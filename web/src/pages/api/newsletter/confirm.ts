// GET /api/newsletter/confirm?token=<uuid>
// Flips confirmed_at on the matching subscriber row, then 302s to a
// friendly confirmation page. Uses the service role because the subscribers
// table only grants INSERT to anon — UPDATE is server-only.
import type { APIRoute } from 'astro';
import { service, hasServiceRole } from '~/lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token) return Response.redirect(`${url.origin}/newsletter/erreur`, 302);
  if (!hasServiceRole()) {
    console.error('[confirm] SUPABASE_SERVICE_ROLE_KEY missing — cannot update confirmed_at');
    return Response.redirect(`${url.origin}/newsletter/erreur`, 302);
  }

  const sb = service();
  const { data, error } = await sb
    .from('subscribers')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('confirmation_token', token)
    .is('confirmed_at', null)
    .select('email')
    .maybeSingle();

  if (error) {
    console.error('[confirm] update error', error);
    return Response.redirect(`${url.origin}/newsletter/erreur`, 302);
  }
  // If data is null, the token was already used or never existed. Either
  // way we redirect to the success page — re-clicking a confirmation link
  // shouldn't error out.
  return Response.redirect(`${url.origin}/newsletter/confirme`, 302);
};
