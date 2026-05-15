#!/usr/bin/env node
/**
 * Event-clustering deduplication.
 *
 * The crawler ingests ~5 sources × 15-min RSS pulls. The same fixture
 * (Bayonne–UBB 38-40) gets 12 articles across sources — preview, live recap,
 * post-match quote, debrief column. The unique constraint on source_url
 * catches *exact* dupes; this script catches *editorial* dupes (same event,
 * different headlines).
 *
 * Strategy:
 *   1. Classify each article into a type (match / news / mercato / misc) and
 *      emit a set of signatures (e.g. `match:ubb:d20586`, `score:38-40:ubb`).
 *      Each signature embeds a day-window so adjacent days merge transitively
 *      via union-find.
 *   2. Articles sharing any signature get merged into one cluster.
 *   3. Per cluster, rank by (source priority → most recent → longest excerpt)
 *      and keep the top-ranked article. Delete the rest.
 *
 * Usage:
 *   DATABASE_URL=...  node crawler/scripts/dedup-clusters.mjs            # dry-run
 *   DATABASE_URL=...  node crawler/scripts/dedup-clusters.mjs --apply   # delete
 */
import postgres from 'postgres';

const APPLY = process.argv.includes('--apply');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

// ─── Token + entity helpers ───────────────────────────────────────────────
const removeAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const norm = (s) => removeAccents((s || '').toLowerCase()).replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ');

const OPPONENTS = [
  // "Bordeaux" alone refers to UBB in rugby context — Sud Ouest uses both forms.
  ['ubb',          /\b(ubb|union\s+bordeaux|bordeaux\s+begles?|bordeaux)\b/],
  ['toulon',       /\brc\s*toulon\b|\btoulon\b/],
  ['lyon',         /\blou\b|\blyon\b/],
  ['toulouse',     /\bstade\s+toulousain\b|\btoulouse\b/],
  ['rochelle',     /\bstade\s+rochelais\b|\brochelle\b/],
  ['racing',       /\bracing\s*92\b|\bracing\b/],
  ['stade-fr',     /\bstade\s+francais\b/],
  ['castres',      /\bcastres\b/],
  ['clermont',     /\bclermont\b|\basm\b/],
  ['perpignan',    /\bperpignan\b|\busap\b/],
  ['montpellier',  /\bmontpellier\b|\bmhr\b/],
  ['pau',          /\bsection\s+paloise\b/],
  ['biarritz',     /\bbiarritz\s+olympique\b/],
];

// Kept in sync with ingest-once.mjs::AB_NAMES, plus a few "passing names"
// that show up as transfer rumors / one-off mentions (tambwe, orabe…).
const PLAYERS = [
  'maka', 'lopez', 'tuilagi',
  'patat', 'heguy', 'capilla', 'segonds', 'tatafu',
  'erbinartegaray', 'moretti', 'bruni', 'tambwe', 'jantjies', 'jantjie',
  'orabe', 'maqala', 'teillery',
  'machenaud', 'tilloles', 'pirlet', 'daunivucu',
  // Removed (not currently at AB — see ingest-once.mjs::AB_NAMES for the
  // detailed list of former-player false-positives).
];

export function classify(article) {
  const title = article.title || '';
  const t = norm(title);
  const day = Math.floor(article.published_at.getTime() / 86_400_000);

  const scoreMatch = title.match(/\b\d{1,2}\s*[-–]\s*\d{1,2}\b/);
  const score = scoreMatch ? scoreMatch[0].replace(/\s/g, '').replace('–', '-') : null;

  const opponents = OPPONENTS.filter(([_, re]) => re.test(t)).map(([k]) => k);
  const players = PLAYERS.filter((p) => new RegExp(`\\b${p}\\b`, 'i').test(t));

  // Prefix-anchored on purpose: handles French plurals/conjugations
  // (transferts, songerait, recrutement…).
  const isMercato = /\b(sign(e|er|ature|atures)|prolong|quitt|recrut|depart|arriv(e|ee|ees|es)|mercato|transfert|songe|enrol|s\s*engage|paraphe|piste|cible)/i.test(t);

  const sigs = [];
  let kind;

  if (isMercato && players.length) {
    // Mercato precedence: a transfer rumour about a UBB player must NOT be
    // absorbed into the UBB match-day cluster just because both mention "UBB".
    kind = 'mercato';
    sigs.push(`mercato:${players[0]}`);
  } else if (score && opponents.length) {
    // Strongest match anchor. Also emits a 5-day opp window so score-articles
    // merge with the preview/debrief coverage of the same fixture.
    kind = 'match-score';
    sigs.push(`score:${score}:${opponents[0]}`);
    for (let d = -2; d <= 2; d++) sigs.push(`match:${opponents[0]}:d${day + d}`);
  } else if (opponents.length) {
    // Opponent mention alone is enough: covers post-match quote pieces and
    // motivation/preview articles that don't use explicit match-mode words.
    kind = 'match';
    for (let d = -2; d <= 2; d++) sigs.push(`match:${opponents[0]}:d${day + d}`);
  } else if (players.length) {
    // Player news (return, injury, quote). Tight 1-day window so unrelated
    // same-player articles weeks apart don't merge.
    kind = 'news';
    for (let d = -1; d <= 1; d++) sigs.push(`news:${players[0]}:d${day + d}`);
  } else {
    kind = 'misc';
    sigs.push(`misc:${article.id}`);
  }
  return { sigs, kind };
}

// Local press first — they have the AB beat and longest-form coverage.
// Midi Olympique (national rugby specialist) above generalist RMC.
const SOURCE_PRIORITY = { 'sud-ouest': 5, 'ici-pb': 4, 'midol': 3, 'rmc': 2 };
function rank(a) {
  return (SOURCE_PRIORITY[a.source] || 1) * 1e15
    + a.published_at.getTime()
    + (a.excerpt?.length || 0);
}

// ─── Fetch + cluster ──────────────────────────────────────────────────────
const rows = await sql`
  select a.id, a.title, a.source_url, a.published_at, a.category, a.excerpt, s.slug as source
  from public.articles a
  join public.sources s on s.id = a.source_id
  order by a.published_at desc
`;
console.log(`▶ ${rows.length} articles in DB`);

// Union-find: merge any two articles sharing at least one signature.
const parent = new Map();
const find = (x) => {
  let r = x;
  while (parent.get(r) !== r) r = parent.get(r);
  while (parent.get(x) !== r) { const next = parent.get(x); parent.set(x, r); x = next; }
  return r;
};
const union = (a, b) => { const ra = find(a), rb = find(b); if (ra !== rb) parent.set(ra, rb); };
for (const r of rows) parent.set(r.id, r.id);

const sigToIds = new Map();
for (const r of rows) {
  const c = classify(r);
  r._kind = c.kind;
  for (const s of c.sigs) {
    if (!sigToIds.has(s)) sigToIds.set(s, []);
    sigToIds.get(s).push(r.id);
  }
}
for (const [, ids] of sigToIds) {
  for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
}

const clusters = new Map();
for (const r of rows) {
  const root = find(r.id);
  if (!clusters.has(root)) clusters.set(root, []);
  clusters.get(root).push(r);
}

const sortedClusters = [...clusters.values()].sort((a, b) => b.length - a.length);
const multiCluster = sortedClusters.filter((c) => c.length > 1);
console.log(`  ${sortedClusters.length} clusters total (${multiCluster.length} with multiple articles)`);

// ─── Pick primaries + collect dupes ───────────────────────────────────────
const toDelete = [];
for (const c of sortedClusters) {
  if (c.length <= 1) continue;
  const sorted = [...c].sort((a, b) => rank(b) - rank(a));
  for (const r of sorted.slice(1)) toDelete.push(r);
}

console.log(`  ${toDelete.length} articles flagged as duplicates\n`);

// Show preview of what gets deleted
for (const c of multiCluster) {
  const sorted = [...c].sort((a, b) => rank(b) - rank(a));
  const primary = sorted[0];
  console.log(`── ${primary._kind} (${c.length}) ──`);
  console.log(`   KEEP  [${primary.source.padEnd(10)}] ${primary.published_at.toISOString().slice(0, 10)}  ${primary.title.slice(0, 80)}`);
  for (const r of sorted.slice(1)) {
    console.log(`   drop  [${r.source.padEnd(10)}] ${r.published_at.toISOString().slice(0, 10)}  ${r.title.slice(0, 80)}`);
  }
}

// ─── Apply (if requested) ─────────────────────────────────────────────────
if (toDelete.length === 0) {
  console.log('\n✓ no duplicates found');
} else if (APPLY) {
  const ids = toDelete.map((r) => r.id);
  await sql`delete from public.articles where id in ${sql(ids)}`;
  console.log(`\n✓ deleted ${ids.length} duplicate article(s)`);
  const remaining = await sql`select count(*)::int as c from public.articles`;
  console.log(`▶ ${remaining[0].c} articles remaining`);
} else {
  console.log(`\n(dry-run — pass --apply to delete ${toDelete.length} row(s))`);
}

await sql.end();
