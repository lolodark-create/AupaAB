// POST /api/newsletter/subscribe
//   body: { email, source_hint? }
// Inserts a subscriber row (anon role, allowed by RLS), then triggers a
// confirmation email. Returns JSON for the front-end to show a flash.
//
// Idempotency: if the email is already in the table, we silently re-send
// the confirmation email rather than erroring out (lets the user re-send
// if they lost the first link).
import type { APIRoute } from 'astro';
import { anon, isConfigured } from '~/lib/supabase';
import { sendConfirm, emailConfigured } from '~/lib/email';

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isConfigured()) {
    return Response.json({ ok: false, error: 'Service indisponible.' }, { status: 503 });
  }

  let body: { email?: string; source_hint?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Requête malformée.' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ ok: false, error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  const sourceHint = (body.source_hint || 'unknown').slice(0, 40);
  const ip = clientAddress || null;
  const userAgent = request.headers.get('user-agent')?.slice(0, 240) || null;

  const sb = anon();
  const { data: existing } = await sb
    .from('subscribers')
    .select('id, confirmed_at, confirmation_token')
    .eq('email', email)
    .maybeSingle();

  let confirmationToken: string;

  if (existing) {
    if (existing.confirmed_at) {
      // Already confirmed — no email, just say so. Don't leak "exists" to
      // strangers either — same "vérifie ta boîte" copy in both branches.
      return Response.json({ ok: true });
    }
    confirmationToken = existing.confirmation_token as string;
  } else {
    const { data, error } = await sb
      .from('subscribers')
      .insert({ email, source_hint: sourceHint, ip, user_agent: userAgent })
      .select('confirmation_token')
      .single();
    if (error || !data) {
      console.error('[subscribe] insert error', error);
      return Response.json({ ok: false, error: 'Inscription impossible.' }, { status: 500 });
    }
    confirmationToken = data.confirmation_token as string;
  }

  if (emailConfigured()) {
    await sendConfirm(email, confirmationToken);
  } else {
    console.warn(`[subscribe] email not configured — confirmation link: /api/newsletter/confirm?token=${confirmationToken}`);
  }

  return Response.json({ ok: true });
};
