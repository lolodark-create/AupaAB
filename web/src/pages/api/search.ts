// GET /api/search — Postgres FTS via search_articles() function.

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { anon, isConfigured } from '~/lib/supabase';
import { ok, fail, badRequest, rateLimit } from '~/lib/response';
import { searchArticles as mockSearch } from '~/lib/mock-api';

export const prerender = false;

const querySchema = z.object({
  q: z.string().trim().min(1).max(120),
  cat: z.enum(['match', 'mercato', 'coulisses', 'espoirs', 'pays_basque', 'autre']).optional(),
  src: z.string().min(1).max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(500).default(0),
});

export const GET: APIRoute = async (ctx) => {
  // 30 searches per IP per minute. Search hits Postgres FTS or in-memory mock.
  const limited = await rateLimit(ctx, 'search', 30, 60);
  if (limited) return limited;

  const params = Object.fromEntries(ctx.url.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return badRequest('Invalid query parameters', 'invalid_query');

  const { q, cat, src, limit, offset } = parsed.data;

  if (!isConfigured()) {
    return ok(mockSearch({ q, cat, src, limit, offset }), { query: q, limit, offset, source: 'mock' });
  }

  const sb = anon();
  const { data, error } = await sb.rpc('search_articles', {
    p_query: q,
    p_category: cat ?? null,
    p_source_slug: src ?? null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) return fail(500, error.message, 'db_error');
  return ok(data ?? [], { query: q, limit, offset });
};
