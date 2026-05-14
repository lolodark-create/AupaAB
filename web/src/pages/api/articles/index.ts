// GET /api/articles — paginated, filterable list.
// Cursor pagination by published_at (descending).

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { anon, isConfigured } from '~/lib/supabase';
import { ok, fail, methodNotAllowed, badRequest } from '~/lib/response';
import { listArticles as mockListArticles } from '~/lib/mock-api';

export const prerender = false;

const querySchema = z.object({
  cat: z.enum(['match', 'mercato', 'coulisses', 'espoirs', 'pays_basque', 'autre']).optional(),
  src: z.string().min(1).max(50).optional(),
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET: APIRoute = async ({ url }) => {
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return badRequest('Invalid query parameters', 'invalid_query');

  const { cat, src, cursor, limit } = parsed.data;

  // Fallback to in-memory mock when no Supabase project is configured.
  // Same response envelope, so client code is unaware of the swap.
  if (!isConfigured()) {
    const result = mockListArticles({ cat, src, cursor, limit });
    return ok(result.data, { has_more: result.hasMore, cursor: result.nextCursor, source: 'mock' });
  }

  const sb = anon();
  let q = sb
    .from('articles_public')
    .select('id, slug, title, excerpt, author, published_at, category, source_id, comment_count, reading_time_sec, cover_image_url, cover_variant')
    .order('published_at', { ascending: false })
    .limit(limit + 1);

  if (cat) q = q.eq('category', cat);
  if (cursor) q = q.lt('published_at', cursor);

  if (src) {
    const { data: source } = await sb.from('sources').select('id').eq('slug', src).maybeSingle();
    if (!source) return ok([], { has_more: false });
    q = q.eq('source_id', source.id);
  }

  const { data, error } = await q;
  if (error) return fail(500, error.message, 'db_error');

  const hasMore = (data ?? []).length > limit;
  const items = (data ?? []).slice(0, limit);
  const nextCursor = hasMore && items.length ? items[items.length - 1].published_at : null;

  return ok(items, { has_more: hasMore, cursor: nextCursor });
};

export const ALL: APIRoute = () => methodNotAllowed(['GET']);
