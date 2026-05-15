#!/usr/bin/env node
/**
 * Audit DB articles and remove:
 *   1. URLs that return 4xx/5xx (dead source links)
 *   2. Articles older than MAX_AGE_DAYS
 *   3. Articles that don't pass the *stricter* relevance filter
 *
 *   DATABASE_URL=postgres://... node crawler/scripts/audit-clean.mjs
 *   DATABASE_URL=... DRY_RUN=1 node ... # report only, no delete
 */
import postgres from 'postgres';

const DRY = process.env.DRY_RUN === '1';
const MAX_AGE_DAYS = parseInt(process.env.MAX_AGE_DAYS || '21', 10);
const URL_TIMEOUT_MS = 8000;
const URL_CONCURRENCY = 8;

const UA = 'AUPA-AB-LinkCheck/0.1 (+https://aupa-ab.fr)';

// ─── Title-based relevance filter ─────────────────────────────────────────────
// Tested: a TITLE-ONLY check is the highest-precision signal. Articles where AB
// is only mentioned tangentially in the excerpt (e.g. "Section Paloise: Pau
// receives Clermont, no Bayonnais on the bench") fail to match because their
// titles don't contain any AB token.
function removeAccents(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, ''); }

const STRONG_PHRASES = [
  'aviron bayonnais', 'aviron bayonne', 'jean dauger',
  'stade de bayonne', 'aupa ab', 'ciel et blanc',
];

// AB player/staff surnames worth keeping if they appear in the title.
const AB_NAMES = [
  'maka', 'lopez', 'gorgadze', 'tuilagi', 'spedding', 'umaga',
  'patat', 'aldige', 'heguy', 'capilla', 'segonds', 'tatafu',
  'erbinartegaray',
];

const OTHER_CLUB_REJECT = [
  'section paloise', 'biarritz olympique', 'stade toulousain', 'stade rochelais',
  'racing 92', 'stade francais', 'castres olympique', 'asm clermont',
  'usa perpignan', 'rc toulon', 'lyon ou', 'montpellier hr', 'union bordeaux',
  'biarritz - ', 'biarritz–', 'bo - ', 'bo–',
];

function isStrictlyAB(title, _excerpt) {
  const raw = title || '';
  const t = removeAccents(raw.toLowerCase()).replace(/[-_]+/g, ' ');

  // Reject if another club is named in the title AND no AB anchor appears
  // BEFORE the other club's name. Catches "Hugo Pirlet avant le Biarritz
  // Olympique … et débrief Bayonne-UBB" — BO is the lead, Bayonne is a
  // tangent at the end.
  const abPos = (() => {
    const m = t.match(/\b(aviron|bayonne)\b/);
    return m ? m.index ?? Infinity : Infinity;
  })();
  for (const club of OTHER_CLUB_REJECT) {
    const clubNorm = removeAccents(club).replace(/[-_]+/g, ' ');
    const idx = t.indexOf(clubNorm);
    if (idx !== -1 && idx < abPos) return false;
  }

  for (const kw of STRONG_PHRASES) {
    if (t.includes(removeAccents(kw))) return true;
  }
  if (/\bbayonne\b/.test(t)) return true;
  if (/\bAB\b/.test(raw)) return true;
  for (const n of AB_NAMES) {
    if (new RegExp(`\\b${n}\\b`, 'i').test(t)) return true;
  }
  return false;
}

// ─── Connect ──────────────────────────────────────────────────────────────────
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

const articles = await sql`
  select id, slug, title, excerpt, source_url, published_at
  from articles
  order by published_at desc
`;
console.log(`▶ ${articles.length} articles in DB`);
console.log(`▶ MAX_AGE_DAYS = ${MAX_AGE_DAYS}`);
console.log(`▶ DRY_RUN = ${DRY}`);
console.log();

// ─── Phase 1: age + relevance ─────────────────────────────────────────────────
const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
const tooOld = [];
const offTopic = [];
const candidates = []; // will check URL liveness

for (const a of articles) {
  if (a.published_at.getTime() < cutoff) {
    tooOld.push(a);
    continue;
  }
  if (!isStrictlyAB(a.title, a.excerpt)) {
    offTopic.push(a);
    continue;
  }
  candidates.push(a);
}

console.log(`  age cutoff   : ${tooOld.length} article(s) older than ${MAX_AGE_DAYS}d`);
console.log(`  off-topic    : ${offTopic.length} article(s) failing strict AB filter`);
console.log(`  to URL-check : ${candidates.length}`);

// ─── Phase 2: probe URLs in parallel ──────────────────────────────────────────
const dead = [];
const live = [];

async function probe(article) {
  const ctl = AbortSignal.timeout(URL_TIMEOUT_MS);
  try {
    let r = await fetch(article.source_url, {
      method: 'HEAD', redirect: 'follow', signal: ctl,
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    });
    // Some servers don't support HEAD — fall back to GET if 405/501
    if (r.status === 405 || r.status === 501) {
      r = await fetch(article.source_url, {
        method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(URL_TIMEOUT_MS),
        headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      });
    }
    return { article, status: r.status, ok: r.status < 400 };
  } catch (err) {
    return { article, status: 0, ok: false, err: err.message };
  }
}

// Run in batches
for (let i = 0; i < candidates.length; i += URL_CONCURRENCY) {
  const batch = candidates.slice(i, i + URL_CONCURRENCY);
  const results = await Promise.all(batch.map(probe));
  for (const r of results) {
    if (r.ok) live.push(r);
    else dead.push(r);
  }
  process.stdout.write(`\r  probed ${Math.min(i + URL_CONCURRENCY, candidates.length)}/${candidates.length}`);
}
console.log();

console.log(`  live URLs    : ${live.length}`);
console.log(`  dead URLs    : ${dead.length}`);

if (dead.length) {
  console.log('\n  Dead samples:');
  for (const d of dead.slice(0, 5)) {
    console.log(`    ${String(d.status || '---').padStart(3)} ${d.article.title.slice(0, 60)} → ${d.article.source_url.slice(0, 80)}`);
  }
}

// ─── Phase 3: delete (or dry-run) ─────────────────────────────────────────────
const allToDelete = [...tooOld, ...offTopic, ...dead.map((d) => d.article)];
console.log(`\n▶ Total to ${DRY ? 'WOULD DELETE' : 'DELETE'} : ${allToDelete.length}`);

if (!DRY && allToDelete.length) {
  const ids = allToDelete.map((a) => a.id);
  await sql`delete from articles where id in ${sql(ids)}`;
  console.log(`✓ deleted ${ids.length} rows`);
} else if (DRY) {
  console.log('  (DRY_RUN active, nothing deleted)');
}

const remaining = await sql`select count(*)::int as c from articles`;
console.log(`\n▶ Articles remaining : ${remaining[0].c}`);

await sql.end();
