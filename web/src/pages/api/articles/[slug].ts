// GET /api/articles/[slug]

import type { APIRoute } from 'astro';
import { anon, isConfigured } from '~/lib/supabase';
import { ok, notFound, fail, methodNotAllowed } from '~/lib/response';
import { getArticle as mockGetArticle } from '~/lib/mock-api';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) return notFound();

  if (!isConfigured()) {
    const article = mockGetArticle(slug);
    if (!article) return notFound('Article introuvable');
    return ok(article, { source: 'mock' });
  }

  const sb = anon();
  const { data, error } = await sb
    .from('articles_public')
    .select(`
      id, slug, title, excerpt, author, published_at, category, source_id, source_url, comment_count, reading_time_sec, cover_image_url, cover_variant, tags
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) return fail(500, error.message, 'db_error');
  if (!data) return notFound('Article introuvable');

  const { data: source } = await sb
    .from('sources')
    .select('slug, name, domain')
    .eq('id', data.source_id)
    .maybeSingle();

  return ok({ ...data, source });
};

export const ALL: APIRoute = () => methodNotAllowed(['GET']);
