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

// STRONG signals = direct club identity. Any one of these → accept.
const STRONG_KEYWORDS = [
  'aviron bayonnais', 'aviron bayonne', "l'aviron", 'ab rugby',
  'aupa ab', 'aupa, ab', 'ciel et blanc',
  'jean dauger', 'stade de bayonne',
];
// WEAK signals = player/coach names. Common enough to false-positive on opposing
// teams ("Pau prive Gorgadze de Clermont") so we require 'bayonne' OR 'aviron'
// to also appear somewhere in the haystack.
const WEAK_KEYWORDS = [
  'edwin maka', 'camille lopez', 'beka gorgadze', 'manu tuilagi',
  'gregory patat', 'jean baptiste aldige', 'jean-baptiste aldige',
  'tana umaga', 'spedding', 'mike spedding',
];
// 'Bayonne' alone is too broad (city). Need rugby co-occurrence.
const BAYONNE_RUGBY_CO = ['rugby', 'top 14', 'pro d2', 'maillot', 'tribune', 'mêlée', 'melee', 'aviron'];

function isRelevantToAB(item) {
  const hay = [item.title, item.contentSnippet, item.content, item.description, (item.categories || []).join(' ')]
    .filter(Boolean).join(' ');
  if (!hay.trim()) return false;
  const n = removeAccents(hay.toLowerCase()).replace(/[-_]+/g, ' ');

  // 1. Strong match: direct club reference
  for (const kw of STRONG_KEYWORDS) {
    if (n.includes(removeAccents(kw).replace(/[-_]+/g, ' '))) return true;
  }

  const hasContext = n.includes('bayonne') || n.includes('aviron');

  // 2. Weak match (player name) requires bayonne/aviron context
  if (hasContext) {
    for (const kw of WEAK_KEYWORDS) {
      if (n.includes(removeAccents(kw).replace(/[-_]+/g, ' '))) return true;
    }
  }

  // 3. Bayonne + rugby term = also OK (covers "AB" abbrev + generic match coverage)
  if (n.includes('bayonne')) {
    for (const co of BAYONNE_RUGBY_CO) {
      if (n.includes(removeAccents(co))) return true;
    }
  }

  return false;
}

const CLASS_RULES = [
  ['mercato',     /\b(signe|prolong[eé]|prolongation|quitte|recrute|recrutement|d[eé]part|arriv[eé]e|mercato|transfert|rumeur)/i],
  ['match',       /\b(match|score|victoire|d[eé]faite|r[eé]sultat|composition|compo|avant[\s-]match|apr[eè]s[\s-]match|coup\s?d['’]envoi|kick[\s-]?off|j-?\d+)\b/i],
  ['espoirs',     /\b(jeune|espoir|formation|centre\s+(de\s+)?formation|crabos|reichel|u\s?-?\s?(16|18|20)\b)/i],
  ['pays_basque', /\b(pays\s+basque|biarritz|anglet|saint[\s-]jean[\s-]de[\s-]luz|festival|euskara|euskal)/i],
  ['coulisses',   /\b(analyse|interview|coulisses|coulisse|strat[eé]gie|tactique|d[eé]cryptage|portrait|chronique)/i],
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
