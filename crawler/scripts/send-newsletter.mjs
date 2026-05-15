#!/usr/bin/env node
/**
 * Newsletter sender — two modes:
 *
 *   --kind=morning   (default) — exhaustive 24h digest, cron 7h UTC daily.
 *   --kind=evening              — post-match recap, cron triggered on the
 *                                  evenings AB plays. Fires only if a
 *                                  fixture finished today AND no evening
 *                                  digest has been sent yet (idempotent
 *                                  via public.newsletter_sends).
 *
 *   DATABASE_URL=...  RESEND_API_KEY=re_...  node crawler/scripts/send-newsletter.mjs
 *   --dry-run             # render preview to stdout, no API calls, no row write
 *   --to=foo@bar.com      # send to a single override address (testing)
 *   --limit=N             # cap the number of recipients this run
 *   --force               # bypass the newsletter_sends idempotency check
 */
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://aupaab.fr';
const FROM = process.env.NEWSLETTER_FROM || 'AUPA AB <newsletter@aupaab.fr>';
const REPLY_TO = process.env.NEWSLETTER_REPLY_TO || 'contact@aupaab.fr';

if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const FORCE = args.includes('--force');
const TO_OVERRIDE = args.find((a) => a.startsWith('--to='))?.split('=')[1];
const LIMIT = parseInt(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || '10000', 10);
const KIND = args.find((a) => a.startsWith('--kind='))?.split('=')[1] || 'morning';
if (!['morning', 'evening'].includes(KIND)) {
  console.error(`--kind must be morning|evening (got ${KIND})`);
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: 'require', max: 2, prepare: false });

// ─── Helpers ──────────────────────────────────────────────────────────────
const PARIS_TZ = 'Europe/Paris';
const todayParis = () => {
  const d = new Intl.DateTimeFormat('fr-CA', { timeZone: PARIS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return d; // YYYY-MM-DD
};
const fmtKickoff = (d) => {
  const day = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: PARIS_TZ }).format(d);
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: PARIS_TZ }).format(d).replace(':', 'h');
  return `${day} · ${time}`;
};

// ─── Idempotency check ───────────────────────────────────────────────────
const sendDate = todayParis();
if (!DRY && !FORCE) {
  const [existing] = await sql`
    select id from public.newsletter_sends where kind = ${KIND} and send_date = ${sendDate}
  `;
  if (existing) {
    console.log(`⚠ ${KIND} digest already sent today (${sendDate}) — no-op. Use --force to override.`);
    await sql.end();
    process.exit(0);
  }
}

// ─── Mode-specific data gathering ────────────────────────────────────────
let articles = [];
let stat = '';
let kicker = '';
let subject = '';
let fixtureId = null;

if (KIND === 'morning') {
  kicker = 'La brève du matin';
  articles = await sql`
    select a.slug, a.title, a.ai_title, a.excerpt, a.ai_synthesis, a.category, s.name as source_name
    from public.articles a
    join public.sources s on s.id = a.source_id
    where a.is_published = true and a.takedown_reason is null
      and a.published_at >= now() - interval '24 hours'
    order by a.published_at desc
  `;
  if (articles.length === 0) {
    console.log('⚠ no fresh articles in the last 24h — nothing to send');
    await sql.end();
    process.exit(0);
  }
  stat = `${articles.length} article${articles.length > 1 ? 's' : ''} sur l'Aviron Bayonnais dans les dernières 24 h. Tu as tout, ci-dessous.`;
  subject = articles.length === 1
    ? `[AUPA AB] ${articles[0].ai_title || articles[0].title}`
    : `[AUPA AB] ${articles.length} articles aujourd'hui — ${articles[0].ai_title || articles[0].title}`;
} else {
  // Evening: find an AB fixture that finished today (Paris TZ)
  kicker = "La brève d'après-match";
  const fixtures = await sql`
    select id, kickoff, home_name, away_name, home_short, away_short, is_home, home_score, away_score, status
    from public.fixtures
    where (kickoff at time zone 'UTC' at time zone ${PARIS_TZ})::date = ${sendDate}
      and status in ('Final', 'FT', 'STATUS_FINAL')
    order by kickoff desc
    limit 1
  `;
  if (fixtures.length === 0) {
    console.log(`⚠ no AB fixture finished today (${sendDate}) — no evening digest`);
    await sql.end();
    process.exit(0);
  }
  const fx = fixtures[0];
  fixtureId = fx.id;
  const opponent = fx.is_home ? fx.away_name : fx.home_name;
  const opponentShort = fx.is_home ? fx.away_short : fx.home_short;
  const abScore = fx.is_home ? fx.home_score : fx.away_score;
  const oppScore = fx.is_home ? fx.away_score : fx.home_score;
  const scoreStr = abScore != null && oppScore != null ? `${abScore}-${oppScore}` : '';

  // Articles published since kickoff (and a small margin before for live tickers)
  articles = await sql`
    select a.slug, a.title, a.ai_title, a.excerpt, a.ai_synthesis, a.category, s.name as source_name
    from public.articles a
    join public.sources s on s.id = a.source_id
    where a.is_published = true and a.takedown_reason is null
      and a.published_at >= ${fx.kickoff}
      and (
        a.category = 'match'
        or a.title ilike ${'%' + opponent + '%'}
        or a.title ilike ${'%' + opponentShort + '%'}
      )
    order by a.published_at desc
  `;
  if (articles.length === 0) {
    console.log(`⚠ no post-match articles yet for fixture ${fx.id} — skip`);
    await sql.end();
    process.exit(0);
  }
  const verb = abScore > oppScore ? 'l\'emporte' : abScore < oppScore ? 's\'incline' : 'fait nul';
  const scorePhrase = scoreStr ? `AB ${scoreStr} ${opponent}` : `${fx.is_home ? 'AB' : opponent} - ${fx.is_home ? opponent : 'AB'}`;
  stat = scoreStr
    ? `${scorePhrase}. ${articles.length} article${articles.length > 1 ? 's' : ''} après-match déjà publié${articles.length > 1 ? 's' : ''}.`
    : `${articles.length} article${articles.length > 1 ? 's' : ''} après-match déjà publié${articles.length > 1 ? 's' : ''}.`;
  subject = scoreStr
    ? `[AUPA AB] ${scorePhrase} — l'après-match en bref`
    : `[AUPA AB] L'après-match en bref`;
  void verb; // reserved for future copy variation
}

// ─── Recipients ──────────────────────────────────────────────────────────
let recipients;
if (TO_OVERRIDE) {
  recipients = [{ email: TO_OVERRIDE, unsubscribe_token: 'preview-token-no-unsub' }];
} else {
  // For the EVENING digest we don't gate on last_email_sent_at < current_date
  // because we may legitimately send a second email today (morning + evening).
  recipients = KIND === 'evening'
    ? await sql`
        select email, unsubscribe_token from public.subscribers
        where confirmed_at is not null and unsubscribed_at is null
        limit ${LIMIT}
      `
    : await sql`
        select email, unsubscribe_token from public.subscribers
        where confirmed_at is not null and unsubscribed_at is null
          and (last_email_sent_at is null or last_email_sent_at < current_date)
        limit ${LIMIT}
      `;
}

console.log(`▶ kind=${KIND}  ${articles.length} article(s), ${recipients.length} recipient(s)${DRY ? ' (DRY)' : ''}`);

// ─── Templates (mirrors web/src/lib/email.ts::shell) ─────────────────────
function shell(title, body, kickerText) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#1A1D24;-webkit-font-smoothing:antialiased;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E2D9;border-radius:14px;overflow:hidden;">
  <tr>
    <td align="center" style="background:#B3DCFA;padding:28px 20px 22px;text-align:center;">
      <a href="${SITE_URL}" style="text-decoration:none;display:inline-block;">
        <div style="font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:34px;font-weight:700;color:#FFFFFF;letter-spacing:-0.02em;line-height:1;">
          AUPA <span style="opacity:0.85;">AB</span>
        </div>
        <div style="margin-top:8px;font-size:11px;font-weight:600;color:#FFFFFF;opacity:0.92;letter-spacing:0.18em;text-transform:uppercase;">
          ${kickerText}
        </div>
      </a>
    </td>
  </tr>
  <tr><td style="padding:28px 28px 8px 28px;">${body}</td></tr>
  <tr><td style="padding:8px 28px 28px 28px;border-top:1px solid #F3F1EB;color:#5F6975;font-size:11px;line-height:1.55;margin-top:16px;">
    <p style="margin:16px 0 4px;">AUPA AB est un agrégateur d'actualités <em>officiellement non-officiel</em> de l'Aviron Bayonnais. Fait par des supporters, pour des supporters.</p>
    <p style="margin:4px 0;">
      <a href="${SITE_URL}" style="color:#006B9D;text-decoration:none;">aupaab.fr</a>
      &nbsp;·&nbsp;
      <a href="${SITE_URL}/mentions-legales" style="color:#5F6975;text-decoration:none;">Mentions légales</a>
      &nbsp;·&nbsp;
      <a href="${SITE_URL}/confidentialite" style="color:#5F6975;text-decoration:none;">Confidentialité</a>
    </p>
  </td></tr>
</table>
</body></html>`;
}

// Group articles by category. Evening digests typically only have 'match'
// so the loop is cheap; keeping the same renderer for both kinds.
const CAT_ORDER = ['match', 'mercato', 'coulisses', 'espoirs', 'pays_basque', 'autre'];
const CAT_LABEL = {
  match: 'Match', mercato: 'Mercato', coulisses: 'Coulisses',
  espoirs: 'Espoirs', pays_basque: 'Pays Basque', autre: 'Brèves',
};
const byCategory = new Map();
for (const a of articles) {
  if (!byCategory.has(a.category)) byCategory.set(a.category, []);
  byCategory.get(a.category).push(a);
}

function buildHtml(unsubToken) {
  const sections = CAT_ORDER
    .filter((c) => byCategory.has(c))
    .map((cat) => {
      const items = byCategory.get(cat);
      const cards = items.map((a) => {
        const url = `${SITE_URL}/article/${a.slug}`;
        const headline = a.ai_title || a.title;
        const synth = a.ai_synthesis || a.excerpt;
        return `<a href="${url}" style="display:block;text-decoration:none;color:inherit;margin:0 0 12px;padding:14px 16px;border:1px solid #E5E2D9;border-radius:10px;background:#FAFAF7;">
          <div style="font-size:11px;color:#5F6975;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">${a.source_name}</div>
          <div style="font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:17px;line-height:1.25;font-weight:600;color:#1A1D24;margin:0 0 6px;letter-spacing:-0.01em;">${headline}</div>
          <div style="font-size:14px;line-height:1.5;color:#5A6472;margin:0;">${synth}</div>
        </a>`;
      }).join('');
      return `<h2 style="font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#006B9D;margin:28px 0 12px;font-weight:600;">${CAT_LABEL[cat]} · ${items.length}</h2>${cards}`;
    }).join('');

  const unsubLink = `${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
  const closing = KIND === 'evening'
    ? `<p style="margin:32px 0 0;font-size:13px;color:#5F6975;line-height:1.55;">À demain matin pour la suite. <a href="${SITE_URL}" style="color:#006B9D;">Voir tout sur aupaab.fr</a></p>`
    : `<p style="margin:32px 0 0;font-size:13px;color:#5F6975;line-height:1.55;">Bonne journée. <a href="${SITE_URL}" style="color:#006B9D;">Voir tout sur aupaab.fr</a></p>`;
  return shell(`AUPA AB · ${kicker}`, `
    <p style="font-size:14px;color:#5F6975;margin:0 0 4px;line-height:1.5;">${stat}</p>
    ${sections}
    ${closing}
    <p style="margin:24px 0 0;font-size:11px;color:#878E9A;line-height:1.5;text-align:center;">
      Tu veux arrêter ? <a href="${unsubLink}" style="color:#878E9A;">Se désinscrire en 1 clic</a>.
    </p>`, kicker);
}

function buildText(unsubToken) {
  const sections = CAT_ORDER
    .filter((c) => byCategory.has(c))
    .map((cat) => {
      const items = byCategory.get(cat);
      const block = items.map((a) =>
        `▸ ${a.ai_title || a.title}\n  ${a.ai_synthesis || a.excerpt}\n  → ${SITE_URL}/article/${a.slug}`,
      ).join('\n\n');
      return `\n— ${CAT_LABEL[cat].toUpperCase()} (${items.length}) —\n\n${block}`;
    }).join('\n');
  return `AUPA AB · ${kicker}\n${stat}\n${sections}\n\n— Se désinscrire : ${SITE_URL}/api/unsubscribe?token=${unsubToken}`;
}

if (DRY) {
  console.log('--- SUBJECT ---');
  console.log(subject);
  console.log('--- KICKER ---');
  console.log(kicker);
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

// Record the send for idempotency (skip when sending to a single override)
if (!TO_OVERRIDE && ok > 0) {
  await sql`
    insert into public.newsletter_sends (kind, send_date, sent_at, recipients_count, fixture_id)
    values (${KIND}, ${sendDate}, now(), ${ok}, ${fixtureId})
    on conflict (kind, send_date) do nothing
  `;
}

console.log(`✓ sent=${ok} failed=${fail}`);
await sql.end();
