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

const CAT_LABEL = {
  match: '🏉 Match', mercato: '✍️ Mercato', coulisses: '👁 Coulisses',
  espoirs: '🌱 Espoirs', pays_basque: '🏴 Pays Basque', autre: '📰 Brèves',
};
const CAT_ORDER = ['match', 'mercato', 'coulisses', 'espoirs', 'pays_basque', 'autre'];
const byCategory = new Map();
for (const a of articles) {
  if (!byCategory.has(a.category)) byCategory.set(a.category, []);
  byCategory.get(a.category).push(a);
}

// Compose the post body. FB's "see more" cuts ~480 chars on mobile, so
// we front-load the hook + first article, then expand.
const hook = articles.length === 1
  ? `📍 Aujourd'hui sur AUPA AB :`
  : `📍 Les ${articles.length} articles AB du jour (en quelques mots) :`;

const sections = CAT_ORDER
  .filter((c) => byCategory.has(c))
  .map((cat) => {
    const items = byCategory.get(cat);
    const lines = items.map((a) => {
      const headline = a.ai_title || a.title;
      const synth = (a.ai_synthesis || a.excerpt || '').slice(0, 180);
      const url = `${SITE_URL}/article/${a.slug}`;
      return `• ${headline}\n  ${synth}\n  → ${url}`;
    }).join('\n\n');
    return `\n━━━ ${CAT_LABEL[cat] || cat.toUpperCase()} ━━━\n\n${lines}`;
  }).join('\n');

const cta = `\n\n━━━━━━━━━━\n\n📩 Tu veux le recevoir directement par mail à 8 h, chaque matin ? Inscription en 30 secondes :\n${SITE_URL}/newsletter\n\n🔗 Voir tout sur ${SITE_URL.replace('https://', '')}`;

const message = `${hook}\n${sections}${cta}`;

// FB posts cap at ~63 000 chars in the Graph API but the "see more" cuts
// long content — for ergonomics we soft-cap at ~5000.
const finalMessage = message.length > 5000
  ? message.slice(0, 4900) + `…\n\nLire la suite : ${SITE_URL}`
  : message;

console.log(`▶ ${articles.length} article(s) → ${finalMessage.length} chars${DRY ? ' (DRY)' : ''}`);

if (DRY) {
  console.log('--- POST BODY ---');
  console.log(finalMessage);
  console.log('--- END ---');
  await sql.end();
  process.exit(0);
}

const res = await fetch(`https://graph.facebook.com/v18.0/me/feed`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: finalMessage,
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
