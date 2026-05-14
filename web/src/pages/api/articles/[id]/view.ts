// POST /api/articles/[id]/view — increment view counter with cheap IP throttle.

import type { APIRoute } from 'astro';
import { service } from '~/lib/supabase';
import { ok, fail, notFound, rateLimit, methodNotAllowed } from '~/lib/response';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id;
  if (!id) return notFound();

  // 1 view per IP per minute per article (cheap anti-spam)
  const limited = await rateLimit(ctx, `view:${id}`, 1, 60);
  if (limited) return limited;

  // Atomic +1 via SECURITY DEFINER function (see 0004_helpers.sql)
  const sb = service();
  const { error } = await sb.rpc('increment_view_count', { p_article_id: id });
  if (error) return fail(500, error.message, 'db_error');

  return ok({ ok: true });
};

export const ALL: APIRoute = () => methodNotAllowed(['POST']);
