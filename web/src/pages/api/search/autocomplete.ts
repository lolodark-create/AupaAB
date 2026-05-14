// GET /api/search/autocomplete — short prefix matching for the search box.

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { anon, isConfigured } from '~/lib/supabase';
import { ok, fail, badRequest } from '~/lib/response';
import { autocomplete as mockAutocomplete } from '~/lib/mock-api';

export const prerender = false;

const querySchema = z.object({
  q: z.string().trim().min(2).max(40),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export const GET: APIRoute = async ({ url }) => {
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return badRequest('Invalid query parameters', 'invalid_query');

  if (!isConfigured()) {
    return ok(mockAutocomplete(parsed.data.q, parsed.data.limit), { source: 'mock' });
  }

  const sb = anon();
  const { data, error } = await sb.rpc('search_autocomplete', {
    p_prefix: parsed.data.q,
    p_limit: parsed.data.limit,
  });
  if (error) return fail(500, error.message, 'db_error');
  return ok(data ?? []);
};
