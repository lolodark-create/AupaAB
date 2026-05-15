#!/usr/bin/env node
/**
 * Daily Facebook page digest — posts the same 24h roundup as the newsletter
 * to facebook.com/AupaAB as a single structured post, with a CTA back to
 * the newsletter.
 *
 * Cadence: cron at 08:05 UTC (5 min after the email) so the page audience
 * sees value, but readers who want it first → newsletter signup.
 *
 *   DATABASE_URL=...  FB_PAGE_ACCESS_TOKEN=...  node crawler/scripts/post-fb.mjs
 *   --dry-run             # print would-be post + URL, no API call
 *   --site=https://...    # override site URL (defaults PUBLIC_SITE_URL)
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
const FB_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://aupa-ab.vercel.app';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');

if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }
if (!DRY && !FB_TOKEN) { console.error('FB_PAGE_ACCESS_TOKEN required (or use --dry-run)'); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 1, prepare: false });

// Same query as send-newsletter.mjs — keeps the FB post and the email in
// lock-step. If we ever decide to send only "top" articles to FB (less
// spammy for the feed algo), this is the only line to change.
const articles = await sql`
  select a.slug, a.title, a.ai_title, a.excerpt, a.ai_synthesis, a.category,
         a.source_url, s.name as source_name
  from public.articles a
  join public.sources s on s.id = a.source_id
  where a.is_published = true and a.takedown_reason is null
    and a.published_at >= now() - interval '24 hours'
  order by a.published_at desc
`;

if (articles.length === 0) {
  console.log('⚠ no fresh articles — skipping FB post');
  await sql.end();
  process.exit(0);
}

// Voice = supporter-first-person, mirrors the AI synthesis tone. Emojis
// used sparingly as section markers (FB algo seems to lift posts with
// vertical structure + emoji headers, per anecdotal data) — never inside
// the article copy itself.
const CAT_EMOJI = {
  match: '🏉', mercato: '🔁', coulisses: '🎙️',
  espoirs: '🌱', pays_basque: '🏴󠁥󠁳󠁰󠁶󠁿', autre: '📰',
};
const CAT_LABEL = {
  match: 'MATCH', mercato: 'MERCATO', coulisses: 'COULISSES',
  espoirs: 'ESPOIRS', pays_basque: 'PAYS BASQUE', autre: 'BRÈVES',
};
const CAT_ORDER = ['match', 'mercato', 'coulisses', 'espoirs', 'pays_basque', 'autre'];

const byCategory = new Map();
for (const a of articles) {
  if (!byCategory.has(a.category)) byCategory.set(a.category, []);
  byCategory.get(a.category).push(a);
}

// Smart contextual hook: front-load the most engaging article (always the
// first one — articles are ordered by published_at desc, the newest takes
// the slot). Pre-cutoff teaser strategy: the headline + a punchy synthesis
// snippet shows above the FB "see more" line.
const firstHeadline = articles[0].ai_title || articles[0].title;
const firstSynth = (articles[0].ai_synthesis || articles[0].excerpt || '').trim();
const restCount = articles.length - 1;
const tail = restCount === 0
  ? ''
  : `\n\nEt ${restCount} autre${restCount > 1 ? 's' : ''} article${restCount > 1 ? 's' : ''} aujourd'hui ⬇`;
const hook = `🏉 ${firstHeadline}\n${firstSynth}${tail}`;

const sections = CAT_ORDER
  .filter((c) => byCategory.has(c))
  .map((cat) => {
    const items = byCategory.get(cat);
    const header = `${CAT_EMOJI[cat] || '•'} ${CAT_LABEL[cat] || cat.toUpperCase()}`;
    const blocks = items.map((a) => {
      const headline = a.ai_title || a.title;
      const synth = (a.ai_synthesis || a.excerpt || '').trim();
      const url = `${SITE_URL}/article/${a.slug}`;
      return `${headline}\n${synth}\n${url}`;
    }).join('\n\n');
    return `${header}\n\n${blocks}`;
  }).join('\n\n');

const cta = `📩 Reçois ce résumé dans ta boîte mail chaque matin à 8 h :\n${SITE_URL}/newsletter\n\n🌐 Tout l'AB → ${SITE_URL.replace('https://', '')}`;

// The first article is already in the hook — drop it from the sections
// so we don't print it twice. Only remove if there's more than one item
// in its category (otherwise the section would render empty + emoji).
const dedupSections = (() => {
  if (articles.length <= 1) return ''; // hook is the only article — no sections
  const remainingByCat = new Map();
  for (const a of articles.slice(1)) {
    if (!remainingByCat.has(a.category)) remainingByCat.set(a.category, []);
    remainingByCat.get(a.category).push(a);
  }
  return CAT_ORDER
    .filter((c) => remainingByCat.has(c))
    .map((cat) => {
      const items = remainingByCat.get(cat);
      const header = `${CAT_EMOJI[cat] || '•'} ${CAT_LABEL[cat] || cat.toUpperCase()}`;
      const blocks = items.map((a) => {
        const headline = a.ai_title || a.title;
        const synth = (a.ai_synthesis || a.excerpt || '').trim();
        const url = `${SITE_URL}/article/${a.slug}`;
        return `${headline}\n${synth}\n${url}`;
      }).join('\n\n');
      return `${header}\n\n${blocks}`;
    }).join('\n\n');
})();
void sections; // legacy var kept for future swap if we want the first article in its section too

const firstUrl = `${SITE_URL}/article/${articles[0].slug}`;
const message = `${hook}\n${firstUrl}${dedupSections ? '\n\n' + dedupSections : ''}\n\n${cta}`;

// FB posts cap at ~63 000 chars in the Graph API but the "see more" cuts
// long content — for ergonomics we soft-cap at ~5000.
const finalMessage = message.length > 5000
  ? message.slice(0, 4900) + `…\n\nLire la suite : ${SITE_URL}`
  : message;

// Branded OG card generated by /api/og/digest.png on aupaab.fr. Use the
// `picture` param via Graph API's /photos endpoint instead of /feed so
// FB renders the post as image+caption (better algo lift than a text
// post with a tiny link card).
const pictureUrl = `${SITE_URL}/api/og/digest.png`;
console.log(`▶ ${articles.length} article(s) → ${finalMessage.length} chars  picture=${pictureUrl}${DRY ? ' (DRY)' : ''}`);

if (DRY) {
  console.log('--- POST BODY ---');
  console.log(finalMessage);
  console.log('--- END ---');
  console.log('picture:', pictureUrl);
  await sql.end();
  process.exit(0);
}

// /photos accepts a remote URL via `url` + a caption (= the post text).
// Posting through /photos rather than /feed makes the OG image the
// hero of the post instead of a small link preview.
const res = await fetch(`https://graph.facebook.com/v18.0/me/photos`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: pictureUrl,
    caption: finalMessage,
    access_token: FB_TOKEN,
  }),
});

if (!res.ok) {
  const t = await res.text();
  console.error(`✗ FB ${res.status}: ${t.slice(0, 400)}`);
  process.exit(1);
}
const data = await res.json();
console.log(`✓ posted to FB — id=${data.id}`);
await sql.end();
