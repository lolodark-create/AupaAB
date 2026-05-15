#!/usr/bin/env node
/**
 * Daily newsletter sender — runs at 7 h UTC (8 h Paris CET / 9 h CEST)
 * from a separate GitHub Actions cron (see .github/workflows/newsletter.yml).
 *
 * Pipeline:
 *   1. Pick the day's top 3 articles (newest, AI-titled, AI-synthesized)
 *   2. Build the HTML email body in the AUPA shell
 *   3. Send to every confirmed + non-unsubscribed subscriber via Resend
 *   4. Stamp last_email_sent_at to avoid double-sending on cron retries
 *
 *   DATABASE_URL=...  RESEND_API_KEY=re_...  node crawler/scripts/send-newsletter.mjs
 *   --dry-run             # render preview to stdout, no API calls
 *   --to=foo@bar.com      # send to a single override address (testing)
 *   --limit=N             # cap the number of recipients this run
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://aupa-ab.vercel.app';
const FROM = process.env.NEWSLETTER_FROM || 'AUPA AB <newsletter@aupa-ab.com>';
const REPLY_TO = process.env.NEWSLETTER_REPLY_TO || 'contact@aupa-ab.com';

if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const TO_OVERRIDE = args.find((a) => a.startsWith('--to='))?.split('=')[1];
const LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '10000', 10);

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 2, prepare: false });

// ─── Pick today's articles (last 24 h, top 3, fresh ai_title + ai_synth) ──
const articles = await sql`
  select a.slug, a.title, a.ai_title, a.excerpt, a.ai_synthesis, s.name as source_name
  from public.articles a
  join public.sources s on s.id = a.source_id
  where a.is_published = true and a.takedown_reason is null
    and a.published_at >= now() - interval '36 hours'
    and a.ai_title is not null and a.ai_synthesis is not null
  order by a.published_at desc
  limit 3
`;

if (articles.length === 0) {
  console.log('⚠ no fresh articles in the last 36h — nothing to send today');
  await sql.end();
  process.exit(0);
}

// One-liner stat ("Aujourd'hui : X articles depuis Y sources")
const stats = await sql`
  select count(*)::int as today, count(distinct source_id)::int as srcs
  from public.articles
  where published_at >= current_date
`;
const stat = `Aujourd'hui : ${stats[0].today} article${stats[0].today > 1 ? 's' : ''} depuis ${stats[0].srcs} source${stats[0].srcs > 1 ? 's' : ''}.`;

// ─── Recipients ───────────────────────────────────────────────────────────
let recipients;
if (TO_OVERRIDE) {
  recipients = [{ email: TO_OVERRIDE, unsubscribe_token: 'preview-token-no-unsub' }];
} else {
  recipients = await sql`
    select email, unsubscribe_token
    from public.subscribers
    where confirmed_at is not null
      and unsubscribed_at is null
      and (last_email_sent_at is null or last_email_sent_at < current_date)
    limit ${LIMIT}
  `;
}

console.log(`▶ ${articles.length} article(s), ${recipients.length} recipient(s)${DRY ? ' (DRY)' : ''}`);

// ─── Templates (mirror web/src/lib/email.ts so future template tweaks
//     have to happen in both places — small duplication, no shared bundle) ──
function shell(title, body) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#1A1D24;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;padding:24px 20px;">
<tr><td style="padding-bottom:24px;"><a href="${SITE_URL}" style="text-decoration:none;color:inherit;">
  <span style="display:inline-block;width:36px;height:36px;background:#B3DCFA;border-radius:6px;vertical-align:middle;text-align:center;color:#FAFAF7;font-weight:900;font-size:9px;letter-spacing:-0.5px;">
    <span style="display:block;line-height:1;padding-top:7px;">AUPA</span><span style="display:block;line-height:1;padding-top:1px;">AB</span>
  </span>
  <span style="display:inline-block;vertical-align:middle;font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:18px;font-weight:600;margin-left:8px;">AUPA <span style="color:#006B9D;">AB</span></span>
</a></td></tr>
<tr><td>${body}</td></tr>
<tr><td style="padding-top:32px;border-top:1px solid #E5E2D9;color:#5F6975;font-size:11px;line-height:1.5;">
  AUPA AB est un agrégateur d'actualités <em>officiellement non-officiel</em> de l'Aviron Bayonnais.<br>
  <a href="${SITE_URL}/mentions-legales" style="color:#006B9D;">Mentions légales</a> · <a href="${SITE_URL}/confidentialite" style="color:#006B9D;">Confidentialité</a>
</td></tr></table></body></html>`;
}

function buildHtml(unsubToken) {
  const cards = articles.map((a) => {
    const url = `${SITE_URL}/article/${a.slug}`;
    const headline = a.ai_title || a.title;
    const synth = a.ai_synthesis || a.excerpt;
    return `<a href="${url}" style="display:block;text-decoration:none;color:inherit;margin:0 0 18px;padding:16px;border:1px solid #E5E2D9;border-radius:10px;background:#FFFFFF;">
      <div style="font-size:11px;color:#5F6975;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">${a.source_name}</div>
      <div style="font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:18px;line-height:1.25;font-weight:600;color:#1A1D24;margin:0 0 8px;letter-spacing:-0.01em;">${headline}</div>
      <div style="font-size:14px;line-height:1.5;color:#5A6472;margin:0;">${synth}</div>
    </a>`;
  }).join('');
  const unsubLink = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
  return shell('AUPA AB · La brève du matin', `
    <h1 style="font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:26px;line-height:1.15;margin:0 0 6px;font-weight:600;letter-spacing:-0.01em;">La brève du matin</h1>
    <p style="font-size:13px;color:#5F6975;margin:0 0 24px;">${stat}</p>
    ${cards}
    <p style="margin:24px 0 0;font-size:13px;color:#5F6975;line-height:1.55;">Bonne journée. <a href="${SITE_URL}" style="color:#006B9D;">Voir tout sur aupa-ab.com</a></p>
    <p style="margin:32px 0 0;font-size:11px;color:#878E9A;line-height:1.5;text-align:center;">
      Tu veux arrêter de recevoir cette brève ? <a href="${unsubLink}" style="color:#878E9A;">Se désinscrire en 1 clic</a>.
    </p>`);
}
function buildText(unsubToken) {
  const items = articles.map((a) => `▸ ${a.ai_title || a.title}\n  ${a.ai_synthesis || a.excerpt}\n  → ${SITE_URL}/article/${a.slug}`).join('\n\n');
  return `AUPA AB · La brève du matin\n${stat}\n\n${items}\n\n— Se désinscrire : ${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
}

const subject = `[AUPA AB] ${articles[0].ai_title || articles[0].title}`;

if (DRY) {
  console.log('--- SUBJECT ---');
  console.log(subject);
  console.log('--- TEXT ---');
  console.log(buildText('preview-token'));
  await sql.end();
  process.exit(0);
}

if (!RESEND_API_KEY) {
  console.error('RESEND_API_KEY required');
  process.exit(1);
}

let ok = 0;
let fail = 0;
for (const r of recipients) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM, to: [r.email], reply_to: REPLY_TO,
        subject, html: buildHtml(r.unsubscribe_token), text: buildText(r.unsubscribe_token),
      }),
    });
    if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 120)}`);
    if (!TO_OVERRIDE) {
      await sql`update public.subscribers set last_email_sent_at = now() where email = ${r.email}`;
    }
    ok++;
  } catch (err) {
    console.error(`✗ ${r.email}: ${err.message}`);
    fail++;
  }
  // Resend free tier: 10 req/sec
  await new Promise((res) => setTimeout(res, 110));
}

console.log(`✓ sent=${ok} failed=${fail}`);
await sql.end();
