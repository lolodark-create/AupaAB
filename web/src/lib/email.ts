// Resend wrapper — single fetch call, no SDK. We send three kinds of
// emails today:
//   1. confirm()        — double opt-in confirmation link, sent on signup
//   2. dailyDigest()    — morning brief, sent by the cron script
//   3. unsubscribeOk()  — optional courtesy receipt after unsubscribe
//
// All renderable templates live here as plain HTML/text strings so the
// build doesn't pull a heavy email framework (react-email is overkill
// for three templates). Inline CSS only — Outlook/Gmail strip <style>.
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const FROM = import.meta.env.NEWSLETTER_FROM || 'AUPA AB <newsletter@aupa-ab.com>';
const REPLY_TO = import.meta.env.NEWSLETTER_REPLY_TO || 'contact@aupa-ab.com';
const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://aupa-ab.vercel.app';

export function emailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

async function send(to: string, subject: string, html: string, text: string): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY missing — would have sent:', subject, 'to', to);
    return { ok: false, error: 'resend not configured' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error('[email] resend error', res.status, body.slice(0, 200));
    return { ok: false, error: `resend ${res.status}` };
  }
  return { ok: true };
}

// ─── Templates ───────────────────────────────────────────────────────────
function shell(title: string, body: string) {
  // Bare-bones email shell. No web fonts (clients block them), system stack.
  // Single column, max-width 560px, Apple-ish.
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;color:#1A1D24;-webkit-font-smoothing:antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:560px;margin:0 auto;padding:24px 20px;">
    <tr>
      <td style="padding-bottom:24px;">
        <a href="${SITE_URL}" style="display:inline-block;text-decoration:none;">
          <span style="display:inline-block;width:36px;height:36px;background:#B3DCFA;border-radius:6px;vertical-align:middle;text-align:center;line-height:36px;color:#FAFAF7;font-weight:900;font-size:9px;letter-spacing:-0.5px;">
            <span style="display:block;line-height:1;padding-top:7px;">AUPA</span>
            <span style="display:block;line-height:1;padding-top:1px;">AB</span>
          </span>
          <span style="display:inline-block;vertical-align:middle;font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:18px;font-weight:600;color:#1A1D24;margin-left:8px;">
            AUPA <span style="color:#006B9D;">AB</span>
          </span>
        </a>
      </td>
    </tr>
    <tr><td>${body}</td></tr>
    <tr>
      <td style="padding-top:32px;border-top:1px solid #E5E2D9;color:#5F6975;font-size:11px;line-height:1.5;">
        AUPA AB est un agrégateur d'actualités <em>officiellement non-officiel</em> de l'Aviron Bayonnais.<br>
        Faits par des supporters, pour des supporters. Pas de pisteur, pas de pub.<br>
        <a href="${SITE_URL}/mentions-legales" style="color:#006B9D;">Mentions légales</a> · <a href="${SITE_URL}/confidentialite" style="color:#006B9D;">Confidentialité</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendConfirm(to: string, confirmationToken: string) {
  const link = `${SITE_URL}/api/newsletter/confirm?token=${confirmationToken}`;
  const html = shell(
    'Confirme ton inscription',
    `<h1 style="font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:28px;line-height:1.15;margin:0 0 16px;font-weight:600;letter-spacing:-0.01em;color:#1A1D24;">
      Encore un clic et c'est bon.
    </h1>
    <p style="font-size:16px;line-height:1.6;color:#1A1D24;margin:0 0 20px;">
      Confirme ton inscription à la brève AUPA AB en cliquant ci-dessous. Tu recevras chaque matin à 8h les 3 articles à connaître sur l'Aviron Bayonnais, en deux phrases pour chacun.
    </p>
    <p style="margin:24px 0;">
      <a href="${link}" style="display:inline-block;background:#006B9D;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:14px 24px;border-radius:8px;">Je confirme mon adresse</a>
    </p>
    <p style="font-size:13px;line-height:1.55;color:#5F6975;margin:24px 0 0;">
      Si tu n'as rien demandé, ignore cet e-mail — sans confirmation, on ne t'écrira jamais.
    </p>`,
  );
  const text = `Confirme ton inscription à AUPA AB en ouvrant ce lien :\n${link}\n\nSi tu n'as rien demandé, ignore ce message.`;
  return send(to, 'Confirme ton inscription à AUPA AB', html, text);
}

export interface DigestArticle {
  ai_title: string | null;
  title: string;
  ai_synthesis: string | null;
  excerpt: string;
  slug: string;
  source_name: string;
}

export async function sendDailyDigest(
  to: string,
  articles: DigestArticle[],
  unsubscribeToken: string,
  stat: string,
) {
  const cards = articles
    .map((a) => {
      const url = `${SITE_URL}/article/${a.slug}`;
      const headline = a.ai_title || a.title;
      const synth = a.ai_synthesis || a.excerpt;
      return `<a href="${url}" style="display:block;text-decoration:none;color:inherit;margin:0 0 18px;padding:16px;border:1px solid #E5E2D9;border-radius:10px;background:#FFFFFF;">
        <div style="font-size:11px;color:#5F6975;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 6px;">${a.source_name}</div>
        <div style="font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:18px;line-height:1.25;font-weight:600;color:#1A1D24;margin:0 0 8px;letter-spacing:-0.01em;">${headline}</div>
        <div style="font-size:14px;line-height:1.5;color:#5A6472;margin:0;">${synth}</div>
      </a>`;
    })
    .join('');

  const unsubLink = `${SITE_URL}/api/unsubscribe?token=${unsubscribeToken}`;
  const html = shell(
    'AUPA AB · La brève du matin',
    `<h1 style="font-family:'New York','Iowan Old Style',Charter,Georgia,serif;font-size:26px;line-height:1.15;margin:0 0 6px;font-weight:600;letter-spacing:-0.01em;color:#1A1D24;">
      La brève du matin
    </h1>
    <p style="font-size:13px;color:#5F6975;margin:0 0 24px;">${stat}</p>
    ${cards}
    <p style="margin:24px 0 0;font-size:13px;color:#5F6975;line-height:1.55;">
      Bonne journée. <a href="${SITE_URL}" style="color:#006B9D;">Voir tout sur aupa-ab.com</a>
    </p>
    <p style="margin:32px 0 0;font-size:11px;color:#878E9A;line-height:1.5;text-align:center;">
      Tu veux arrêter de recevoir cette brève ? <a href="${unsubLink}" style="color:#878E9A;">Se désinscrire en 1 clic</a>.
    </p>`,
  );
  const text = `AUPA AB · La brève du matin\n${stat}\n\n` +
    articles.map((a) => `▸ ${a.ai_title || a.title}\n  ${a.ai_synthesis || a.excerpt}\n  → ${SITE_URL}/article/${a.slug}\n`).join('\n') +
    `\n— Se désinscrire : ${unsubLink}`;
  const subject = `[AUPA AB] ${articles[0]?.ai_title || articles[0]?.title || 'La brève du matin'}`;
  return send(to, subject, html, text);
}
