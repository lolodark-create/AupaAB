// GET /api/sources — active sources, transparency endpoint.

import type { APIRoute } from 'astro';
import { anon, isConfigured } from '~/lib/supabase';
import { ok, fail } from '~/lib/response';
import { listSources as mockListSources } from '~/lib/mock-api';

export const prerender = false;

export const GET: APIRoute = async () => {
  if (!isConfigured()) {
    return ok(mockListSources(), { source: 'mock' });
  }
  const sb = anon();
  const { data, error } = await sb
    .from('sources')
    .select('slug, name, domain, feed_url, last_fetched_at')
    .eq('is_active', true)
    .order('name');
  if (error) return fail(500, error.message, 'db_error');
  return ok(data ?? []);
};
