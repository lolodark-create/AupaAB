// In-memory mock implementations of the Supabase queries used by /api/*.
// Activated automatically by API routes when isConfigured() returns false,
// so the site is fully demo-able without any external services.

import { ARTICLES, SOURCES } from '@shared/mock';
import type { ArticleCategory } from '@shared/types';

interface ListParams {
  cat?: ArticleCategory;
  src?: string;
  cursor?: string;
  limit: number;
}

export function listArticles(p: ListParams) {
  let items = ARTICLES.slice();
  if (p.cat) items = items.filter((a) => a.category === p.cat);
  if (p.src) items = items.filter((a) => a.source.slug === p.src);
  if (p.cursor) {
    const cursorTs = Date.parse(p.cursor);
    items = items.filter((a) => Date.parse(a.published_at) < cursorTs);
  }
  items.sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const hasMore = items.length > p.limit;
  const sliced = items.slice(0, p.limit);
  const nextCursor = hasMore && sliced.length ? sliced[sliced.length - 1].published_at : null;
  return {
    data: sliced.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      author: a.author,
      published_at: a.published_at,
      category: a.category,
      source_id: a.source_id,
      comment_count: a.comment_count,
      reading_time_sec: a.reading_time_sec,
      cover_image_url: a.cover_image_url,
      cover_variant: null,
    })),
    hasMore,
    nextCursor,
  };
}

export function getArticle(slug: string) {
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return null;
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    author: a.author,
    published_at: a.published_at,
    category: a.category,
    source_id: a.source_id,
    source_url: a.source_url,
    comment_count: a.comment_count,
    reading_time_sec: a.reading_time_sec,
    cover_image_url: a.cover_image_url,
    cover_variant: null,
    tags: a.tags,
    source: a.source,
  };
}

export function listSources() {
  return Object.values(SOURCES).map((s) => ({
    slug: s.slug,
    name: s.name,
    domain: s.domain,
    feed_url: s.feed_url,
    last_fetched_at: s.last_fetched_at,
  }));
}

export function searchArticles(params: {
  q: string;
  cat?: ArticleCategory;
  src?: string;
  limit: number;
  offset: number;
}) {
  const needle = params.q.toLowerCase();
  let items = ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(needle) ||
      a.excerpt.toLowerCase().includes(needle) ||
      a.tags.some((t) => t.toLowerCase().includes(needle)),
  );
  if (params.cat) items = items.filter((a) => a.category === params.cat);
  if (params.src) items = items.filter((a) => a.source.slug === params.src);
  return items
    .slice(params.offset, params.offset + params.limit)
    .map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt,
      author: a.author,
      published_at: a.published_at,
      category: a.category,
      source_id: a.source_id,
      source_slug: a.source.slug,
      source_name: a.source.name,
      comment_count: a.comment_count,
      reading_time_sec: a.reading_time_sec,
      rank: 1,
    }));
}

export function autocomplete(prefix: string, limit: number) {
  const p = prefix.toLowerCase();
  return ARTICLES
    .filter((a) => a.title.toLowerCase().startsWith(p))
    .slice(0, limit)
    .map((a) => ({ slug: a.slug, title: a.title }));
}
