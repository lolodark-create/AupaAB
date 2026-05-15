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

// Pull the upcoming fixture for the MATCH section (purely informational —
// kickoff + venue + broadcast, no link). Null means no upcoming match in
// the next 7 days → we omit the section.
const [nextFixture] = await sql`
  select kickoff, home_name, away_name, home_short, away_short, is_home,
         home_score, away_score, status, venue, broadcast, competition, round_label
  from public.fixtures
  where kickoff > now()
    and status not in ('Postponed', 'Cancelled')
  order by kickoff asc
  limit 1
`;

// Calendar-day diff in Paris TZ. Math.ceil on a wall-clock diff was off-
// by-one whenever the kickoff sat more than 24h but less than 48h ahead
// (e.g. Fri 15h vs Sat 16h35 = 25.5h → ceil(1.06) = 2, but it's J-1, not
// J-2). Subtract the calendar dates instead.
function parisDate(d) {
  // 'fr-CA' gives YYYY-MM-DD, parseable as ISO date for arithmetic.
  return new Date(
    new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d) + 'T00:00:00Z',
  );
}
function daysBetweenParis(a, b) {
  return Math.round((parisDate(b).getTime() - parisDate(a).getTime()) / 86_400_000);
}

function formatFixture(f) {
  if (!f) return null;
  const kickoff = new Date(f.kickoff);
  const diffDays = daysBetweenParis(new Date(), kickoff);
  if (diffDays > 7) return null; // too far out, hide
  const day = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' }).format(kickoff);
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(kickoff).replace(':', 'h');
  const countdown = diffDays <= 0 ? "AUJOURD'HUI" : diffDays === 1 ? 'DEMAIN' : `J−${diffDays}`;
  const opponent = f.is_home ? f.away_name : f.home_name;
  const venue = f.venue || (f.is_home ? 'Stade Jean-Dauger' : '');
  const action = f.is_home ? 'AB reçoit' : 'AB se déplace à';
  const broadcastLine = f.broadcast ? `\nDiffusion : ${f.broadcast}` : '';
  return `🏉 PROCHAIN MATCH · ${countdown}\n${action} ${opponent}\n${day} · coup d'envoi ${time}\n${venue}${broadcastLine}`;
}

const matchSection = formatFixture(nextFixture);

// Match-category articles overlap heavily with the PROCHAIN MATCH section
// (preview, prediction, "à quelle heure et sur quelle chaîne", etc.) — when
// we already show the fixture info standalone, those articles just repeat
// what the match section already says. Filter them out of the article list.
const otherArticles = articles.filter((a) => a.category !== 'match');

// User policy: 'les jours où il n'y a pas d'actu on ne publie rien'.
// A standalone match-info post is recurring fixture data, not actu —
// skip the FB post entirely when no non-match article is in the day.
if (otherArticles.length === 0) {
  console.log('⚠ no non-match articles today — skipping FB post (per user policy)');
  await sql.end();
  process.exit(0);
}

// ─── ARTICLES DU JOUR ─────────────────────────────────────────────────────
// Header collés au premier article (pas de blank line), articles séparés
// par une blank line. User-edited the first live post to remove the intro
// hook and tighten section headers — mirroring that here.
const articleSection = `📰 ARTICLES DU JOUR\n` + otherArticles.map((a) => {
  const headline = a.ai_title || a.title;
  const synth = (a.ai_synthesis || a.excerpt || '').trim();
  const url = `${SITE_URL}/article/${a.slug}`;
  return `${headline}\n${synth}\n${url}`;
}).join('\n\n');

// ─── CTAs (groupées, pas de blank line entre les deux) ───────────────────
const cta = `📩 Reçois ce résumé dans ta boîte mail chaque matin à 8 h :\n${SITE_URL}/newsletter\n🌐 Tout l'AB → ${SITE_URL.replace('https://', '')}`;

// ─── Assemble (blank line entre sections, pas avant les sub-elements) ────
const parts = [articleSection];
if (matchSection) parts.push(matchSection);
parts.push(cta);
const message = parts.join('\n\n');

// FB posts cap at ~63 000 chars in the Graph API but the "see more" cuts
// long content — for ergonomics we soft-cap at ~5000.
const finalMessage = message.length > 5000
  ? message.slice(0, 4900) + `…\n\nLire la suite : ${SITE_URL}`
  : message;

// Text-only post — user feedback: image attachment collapses the text
// preview to a single line, which kills the value of our exhaustive
// brève. Plain /me/feed post keeps the text fully visible above the fold.
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
