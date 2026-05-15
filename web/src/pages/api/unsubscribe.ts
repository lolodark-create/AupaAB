// GET /api/unsubscribe?token=<uuid>
// One-click unsubscribe. Flips unsubscribed_at on the matching row.
// Same idempotency contract as /confirm — clicking twice is fine.
import type { APIRoute } from 'astro';
import { service, hasServiceRole } from '~/lib/supabase';

export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token');
  if (!token || !hasServiceRole()) {
    return Response.redirect(`${url.origin}/newsletter/erreur`, 302);
  }

  const sb = service();
  await sb
    .from('subscribers')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .is('unsubscribed_at', null);

  return Response.redirect(`${url.origin}/newsletter/desinscrit`, 302);
};
