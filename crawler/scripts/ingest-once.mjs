#!/usr/bin/env node
/**
 * One-shot ingestion: fetch all active RSS sources, filter for AB-relevance,
 * insert articles into Supabase via direct Postgres connection.
 *
 * Why postgres.js instead of @supabase/supabase-js: skips the need for
 * SUPABASE_SERVICE_ROLE_KEY when you have a DB password handy. Same end result.
 *
 *   DATABASE_URL=postgres://... node crawler/scripts/ingest-once.mjs
 */
import postgres from 'postgres';
import Parser from 'rss-parser';
import sanitizeHtml from 'sanitize-html';
import slugify from 'slugify';
import { customAlphabet } from 'nanoid';

// ─── Config ──────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('error: DATABASE_URL env var required');
  process.exit(1);
}
const SOURCE_DELAY_MS = 1500;
const FEED_TIMEOUT_MS = 15_000;

// ─── Pure functions (same logic as crawler/src/*, inlined for portability) ──
function removeAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Title-based relevance. Empirically the highest precision: the title is the
// editorial promise of the article. If AB isn't named there, the piece is
// almost always off-topic (Section Paloise mentioning Gorgadze's absence, BO
// match previews quoting AB stats, etc.).

const STRONG_PHRASES = [
  'aviron bayonnais', 'aviron bayonne', "l'aviron", 'ab rugby',
  'aupa ab', 'aupa, ab', 'ciel et blanc',
  'jean dauger', 'stade de bayonne',
];

// AB roster surnames (May 2026). Keep maintained per mercato cycle.
const AB_NAMES = [
  'maka', 'lopez', 'gorgadze', 'tuilagi', 'spedding', 'umaga',
  'patat', 'aldige', 'heguy', 'capilla', 'segonds', 'tatafu',
  'erbinartegaray', 'moretti', 'bruni',
];

// If the title names another Top 14 / Pro D2 club, the article is almost
// certainly about that club — even if it mentions an AB player tangentially.
// Reject UNLESS the title also has "bayonne" or "aviron" (comparison piece).
const OTHER_CLUB_REJECT = [
  'section paloise', 'biarritz olympique', 'stade toulousain', 'stade rochelais',
  'racing 92', 'stade francais', 'castres olympique', 'asm clermont',
  'usa perpignan', 'rc toulon', 'lyon ou', 'montpellier hr', 'union bordeaux',
  'oyonnax rugby', 'us montauban', 'colomiers rugby', 'soyaux angouleme',
  'beziers rugby', 'agen rugby', 'mont de marsan', 'nevers rugby',
  'grenoble fcg', 'aurillac rugby', 'provence rugby', 'rouen normandie',
  'biarritz - ', 'biarritz–', 'bo - ', 'bo–',
];

function isRelevantToAB(item) {
  const raw = item.title || '';
  if (!raw.trim()) return false;
  const t = removeAccents(raw.toLowerCase()).replace(/[-_]+/g, ' ');

  // Reject if another club appears in the title BEFORE the first AB anchor.
  // Catches panel-format ICI titles like "Hugo Pirlet avant le Biarritz
  // Olympique … et débrief Bayonne-UBB" — primary subject is BO, AB only
  // mentioned as a secondary debrief.
  const abPos = (() => {
    const m = t.match(/\b(aviron|bayonne)\b/);
    return m ? m.index ?? Infinity : Infinity;
  })();
  for (const club of OTHER_CLUB_REJECT) {
    const idx = t.indexOf(removeAccents(club).replace(/[-_]+/g, ' '));
    if (idx !== -1 && idx < abPos) return false;
  }

  // 1. Direct club reference
  for (const kw of STRONG_PHRASES) {
    if (t.includes(removeAccents(kw).replace(/[-_]+/g, ' '))) return true;
  }
  // 2. "bayonne" as a standalone word in title
  if (/\bbayonne\b/.test(t)) return true;
  // 3. "AB" as a case-sensitive standalone token
  if (/\bAB\b/.test(raw)) return true;
  // 4. AB roster surname in title
  for (const n of AB_NAMES) {
    if (new RegExp(`\\b${n}\\b`, 'i').test(t)) return true;
  }
  return false;
}

// Order = priority. Most specific patterns first.
// "espoirs" sits before "match" so Crabos/U18 stories don't get caught by the
// generic "victoire" word in their snippets.
const CLASS_RULES = [
  ['mercato',     /\b(signe|signature|prolong[eé]|prolongation|quitte|recrute|recrutement|d[eé]part|arriv[eé]e|mercato|transfert|rumeur|cl[oô]ture\s+du\s+mercato|s['’]engage|paraphe)/i],
  ['espoirs',     /\b(crabos|reichel|u\s?-?\s?(16|18|20)\b|centre\s+(de\s+)?formation|jeune\s+(joueur|talent|espoir)|p[eé]pinière|cadets)/i],
  ['coulisses',   /\b(analyse|interview|coulisses?|strat[eé]gie|tactique|d[eé]cryptage|portrait|chronique|confidences?|témoignage|t[eé]moigne|d[eé]claration)/i],
  // "match" catches scores, previews, post-game. Includes "s'incline", "l'emporte" — common AB titles.
  ['match',       /\b(match|score|victoire|d[eé]faite|r[eé]sultat|composition|compo|avant[\s-]match|apr[eè]s[\s-]match|coup\s?d['’]envoi|kick[\s-]?off|j-?\d+|s['’]incline|l['’]emporte|re[çc]oit|d[eé]place|finale|demi[\s-]finale|quart|maintien|top\s?14|pro\s?d2|champions?\s+cup|challenge\s+cup|barrage|playoffs?|XV\s+de\s+d[eé]part|essai|m[eê]l[eé]e)/i],
  ['pays_basque', /\b(pays\s+basque|biarritz\s+olympique|euskara|euskal|pelote\s+basque|ikurri[nñ]a|herri\s+urrats|fronton|ikastola)/i],
];

function classifyArticle(title, snippet) {
  const t = removeAccents(`${title || ''} ${snippet || ''}`.toLowerCase());
  for (const [cat, re] of CLASS_RULES) {
    if (re.test(t)) return cat;
  }
  return 'autre';
}

function generateExcerpt(item) {
  let raw = '';
  if (item.contentSnippet && item.contentSnippet.trim()) raw = item.contentSnippet;
  else if (item.content && item.content.trim()) raw = item.content.replace(/<[^>]+>/g, ' ');
  else if (item.description && item.description.trim()) raw = item.description;
  const cleaned = sanitizeHtml(raw, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= 280) return cleaned;
  const cand = cleaned.slice(0, 279);
  const lastSp = cand.lastIndexOf(' ');
  return `${lastSp > 0 ? cand.slice(0, lastSp) : cand}…`;
}

const makeSuffix = customAlphabet('abcdefghjkmnpqrstuvwxyz23456789', 6);
function generateSlug(title) {
  const base = slugify((title || '').trim(), { lower: true, strict: true, locale: 'fr', trim: true });
  const t = base.length > 80 ? base.slice(0, 80).replace(/-+$/, '') : base;
  return `${t || 'article'}-${makeSuffix()}`;
}

// ─── DB ──────────────────────────────────────────────────────────────────────
const sql = postgres(DATABASE_URL, { ssl: 'require', max: 2, prepare: false });

const parser = new Parser({
  headers: { 'User-Agent': 'AUPA-AB-Crawler/0.1 (+https://aupa-ab.com/sources)' },
  timeout: FEED_TIMEOUT_MS,
});

// ─── Run ─────────────────────────────────────────────────────────────────────
const sources = await sql`
  select s.id, s.slug, s.name, s.feed_url, s.domain
  from public.sources s
  where s.is_active = true
    and s.feed_url is not null
    and not exists (select 1 from public.domain_blocklist b where b.domain = s.domain)
`;
console.log(`▶ ${sources.length} active sources`);

const totals = { fetched: 0, relevant: 0, inserted: 0, dupes: 0, errors: 0 };

for (const source of sources) {
  process.stdout.write(`  ${source.slug.padEnd(14)} ${source.feed_url.padEnd(70)} `);
  let feed;
  try {
    feed = await Promise.race([
      parser.parseURL(source.feed_url),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), FEED_TIMEOUT_MS)),
    ]);
  } catch (err) {
    console.log(`✗ fetch: ${err.message}`);
    totals.errors++;
    continue;
  }

  const items = feed.items || [];
  totals.fetched += items.length;
  let inserted = 0;
  let dupes = 0;
  let relevant = 0;

  for (const item of items) {
    if (!item.link || !item.title) continue;
    if (!isRelevantToAB(item)) continue;
    relevant++;
    const excerpt = generateExcerpt(item);
    if (!excerpt) continue;

    try {
      const result = await sql`
        insert into public.articles (
          slug, title, source_id, source_url, excerpt, author, published_at,
          category, tags, reading_time_sec
        ) values (
          ${generateSlug(item.title)},
          ${item.title.trim()},
          ${source.id},
          ${item.link},
          ${excerpt},
          ${item.creator || item.author || null},
          ${item.isoDate || item.pubDate || new Date().toISOString()},
          ${classifyArticle(item.title, item.contentSnippet)},
          ${[]},
          ${Math.max(60, Math.round(((item.contentSnippet || '').split(/\s+/).length / 230) * 60))}
        )
        on conflict (source_url) do nothing
        returning id
      `;
      if (result.length > 0) inserted++;
      else dupes++;
    } catch (err) {
      console.log(`\n     ! insert error: ${err.message}`);
      totals.errors++;
    }
  }

  totals.relevant += relevant;
  totals.inserted += inserted;
  totals.dupes += dupes;
  console.log(`fetched=${items.length} rel=${relevant} new=${inserted} dupes=${dupes}`);

  // Update last_fetched_at
  await sql`update public.sources set last_fetched_at = now() where id = ${source.id}`;

  await new Promise((r) => setTimeout(r, SOURCE_DELAY_MS));
}

console.log(`\n✓ done. fetched=${totals.fetched} relevant=${totals.relevant} new=${totals.inserted} dupes=${totals.dupes} errors=${totals.errors}`);

await sql.end();
