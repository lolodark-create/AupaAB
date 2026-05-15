// SSR data layer for public pages.
// Reads from Supabase when configured, falls back to @shared/mock otherwise.
// All functions are server-only (called from .astro frontmatter) and use the
// anon key — RLS gates what's returned.

import { anon, isConfigured } from './supabase';
import { ARTICLES as MOCK_ARTICLES, SOURCES as MOCK_SOURCES } from '@shared/mock';
import type { ArticleCategory } from '@shared/types';

// ─── Article shape returned by the data layer ────────────────────────────────
// Matches what the pages need: enough for cards + article view.
export interface ArticleListItem {
  id: string;
  slug: string;
  /** Original journalist headline (kept for SEO + detail-page fallback) */
  title: string;
  /** AI-rewritten short headline (3-7 words) in the AUPA tone */
  ai_title: string | null;
  excerpt: string;
  ai_synthesis: string | null;
  author: string | null;
  published_at: string;
  category: ArticleCategory;
  comment_count: number;
  reading_time_sec: number | null;
  cover_image_url: string | null;
  cover_variant: 'night' | 'sand' | 'aviron' | 'wave' | null;
  source: { slug: string; name: string; domain: string };
  // Display helpers — derived once at fetch time
  time_label: string;
  date_label: string;
  reading_min: number;
  // `lede` is the card preview text. Prefer ai_synthesis (AUPA-tone, ≤200
  // chars) over the raw RSS excerpt. Pages bind <ArticleCard lede={} />
  // directly so they don't need to know the precedence rule.
  lede: string | null;
  body?: string[];
  source_url?: string;
  tags?: string[];
}

const DATE_FR = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });

function relativeLabel(iso: string): string {
  const dt = new Date(iso).getTime();
  const diffSec = (Date.now() - dt) / 1000;
  if (diffSec < 60) return 'à l’instant';
  if (diffSec < 3600) return `il y a ${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86_400) return `il y a ${Math.floor(diffSec / 3600)} h`;
  if (diffSec < 172_800) return 'hier';
  return `il y a ${Math.floor(diffSec / 86_400)} j`;
}

// ─── DB row → display item ────────────────────────────────────────────────────
interface DbRow {
  id: string;
  slug: string;
  title: string;
  ai_title?: string | null;
  excerpt: string;
  ai_synthesis?: string | null;
  author: string | null;
  published_at: string;
  category: ArticleCategory;
  comment_count: number;
  reading_time_sec: number | null;
  cover_image_url: string | null;
  cover_variant: string | null;
  source_url?: string;
  tags?: string[];
  source?: { slug: string; name: string; domain: string };
}

function toItem(r: DbRow): ArticleListItem {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    ai_title: r.ai_title ?? null,
    excerpt: r.excerpt,
    ai_synthesis: r.ai_synthesis ?? null,
    author: r.author,
    published_at: r.published_at,
    category: r.category,
    comment_count: r.comment_count,
    reading_time_sec: r.reading_time_sec,
    cover_image_url: r.cover_image_url,
    cover_variant: (r.cover_variant as ArticleListItem['cover_variant']) ?? null,
    source: r.source ?? { slug: 'unknown', name: 'Source', domain: '' },
    time_label: relativeLabel(r.published_at),
    date_label: DATE_FR.format(new Date(r.published_at)),
    reading_min: Math.max(1, Math.round((r.reading_time_sec ?? 180) / 60)),
    // Prefer the AI synthesis when available — falls back to raw excerpt.
    lede: r.ai_synthesis ?? r.excerpt,
    source_url: r.source_url,
    tags: r.tags ?? [],
  };
}

function fromMock(a: (typeof MOCK_ARTICLES)[number]): ArticleListItem {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    ai_title: null,
    excerpt: a.excerpt,
    ai_synthesis: null,
    author: a.author,
    published_at: a.published_at,
    category: a.category,
    comment_count: a.comment_count,
    reading_time_sec: a.reading_time_sec,
    cover_image_url: a.cover_image_url,
    cover_variant: null,
    source: { slug: a.source.slug, name: a.source.name, domain: a.source.domain },
    time_label: a.time_label,
    date_label: a.date_label,
    reading_min: a.reading_min,
    lede: a.lede ?? a.excerpt,
    body: a.body,
    source_url: a.source_url,
    tags: a.tags,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function listArticles(params: {
  cat?: ArticleCategory;
  src?: string;
  /** "today" | "week" | "month" — filters published_at relative to now */
  since?: 'today' | 'week' | 'month';
  limit?: number;
} = {}): Promise<ArticleListItem[]> {
  const limit = params.limit ?? 50;

  // Compute cutoff once, used by both mock and DB paths.
  const cutoffMs =
    params.since === 'today'  ? Date.now() - 1 * 86_400_000 :
    params.since === 'week'   ? Date.now() - 7 * 86_400_000 :
    params.since === 'month'  ? Date.now() - 30 * 86_400_000 :
    null;

  if (!isConfigured()) {
    let items = MOCK_ARTICLES.slice();
    if (params.cat) items = items.filter((a) => a.category === params.cat);
    if (params.src) items = items.filter((a) => a.source.slug === params.src);
    if (cutoffMs !== null) items = items.filter((a) => Date.parse(a.published_at) >= cutoffMs);
    return items
      .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))
      .slice(0, limit)
      .map(fromMock);
  }

  const sb = anon();
  let q = sb
    .from('articles_public')
    .select(
      'id, slug, title, ai_title, excerpt, ai_synthesis, author, published_at, category, comment_count, reading_time_sec, cover_image_url, cover_variant, source_url, tags, sources(slug, name, domain)',
    )
    .order('published_at', { ascending: false })
    .limit(limit);
  if (params.cat) q = q.eq('category', params.cat);
  if (cutoffMs !== null) q = q.gte('published_at', new Date(cutoffMs).toISOString());
  // For source filter we need to resolve the source_id first
  if (params.src) {
    const { data: src } = await sb.from('sources').select('id').eq('slug', params.src).maybeSingle();
    if (!src) return [];
    q = q.eq('source_id', src.id);
  }
  const { data, error } = await q;
  if (error || !data) return [];

  // PostgREST returns "sources" as either a single object or an array depending on the join shape
  return data.map((row: Record<string, unknown>) => {
    const s = Array.isArray(row.sources) ? row.sources[0] : row.sources;
    const item: DbRow = { ...(row as unknown as DbRow), source: s as DbRow['source'] };
    return toItem(item);
  });
}

export async function getArticle(slug: string): Promise<ArticleListItem | null> {
  if (!isConfigured()) {
    const a = MOCK_ARTICLES.find((x) => x.slug === slug);
    return a ? fromMock(a) : null;
  }

  const sb = anon();
  const { data, error } = await sb
    .from('articles_public')
    .select(
      'id, slug, title, ai_title, excerpt, ai_synthesis, author, published_at, category, comment_count, reading_time_sec, cover_image_url, cover_variant, source_url, tags, sources(slug, name, domain)',
    )
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  const s = Array.isArray(data.sources) ? data.sources[0] : data.sources;
  return toItem({ ...(data as unknown as DbRow), source: s as DbRow['source'] });
}

export async function searchArticles(q: string, cat?: ArticleCategory, src?: string, limit = 20): Promise<ArticleListItem[]> {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];

  if (!isConfigured()) {
    let items = MOCK_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(needle) ||
        (a.lede ?? a.excerpt).toLowerCase().includes(needle) ||
        a.tags.some((t) => t.toLowerCase().includes(needle)),
    );
    if (cat) items = items.filter((a) => a.category === cat);
    if (src) items = items.filter((a) => a.source.slug === src);
    return items.slice(0, limit).map(fromMock);
  }

  const sb = anon();
  const { data, error } = await sb.rpc('search_articles', {
    p_query: q,
    p_category: cat ?? null,
    p_source_slug: src ?? null,
    p_limit: limit,
    p_offset: 0,
  });
  if (error || !data) return [];

  // Synthesize an ArticleListItem from the RPC result (which has source_slug/source_name flat).
  return (data as Array<Record<string, unknown>>).map((r) => ({
    id: r.id as string,
    slug: r.slug as string,
    title: r.title as string,
    // search_articles RPC doesn't return ai_title yet — falls back to title
    // on cards. To surface AUPA titles in search, extend the RPC signature.
    ai_title: null,
    excerpt: r.excerpt as string,
    author: r.author as string | null,
    published_at: r.published_at as string,
    category: r.category as ArticleCategory,
    comment_count: r.comment_count as number,
    reading_time_sec: r.reading_time_sec as number | null,
    cover_image_url: null,
    cover_variant: null,
    source: {
      slug: r.source_slug as string,
      name: r.source_name as string,
      domain: '',
    },
    time_label: relativeLabel(r.published_at as string),
    date_label: DATE_FR.format(new Date(r.published_at as string)),
    reading_min: Math.max(1, Math.round(((r.reading_time_sec as number) ?? 180) / 60)),
    lede: r.excerpt as string,
    tags: [],
  }));
}

export async function listActiveSources(): Promise<
  Array<{ slug: string; name: string; domain: string; last_fetched_at: string | null }>
> {
  if (!isConfigured()) {
    return Object.values(MOCK_SOURCES).map((s) => ({
      slug: s.slug,
      name: s.name,
      domain: s.domain,
      last_fetched_at: s.last_fetched_at,
    }));
  }
  const sb = anon();
  const { data } = await sb
    .from('sources')
    .select('slug, name, domain, last_fetched_at')
    .eq('is_active', true)
    .order('name');
  return data ?? [];
}

// Sources that have at least one article visible to readers. Used by the
// filter dropdown so we don't offer "RMC (0)" / "Rugbyrama (0)" choices
// that lead to an empty list — La Rép, RMC, Rugbyrama are active in the
// crawler but their RSS rarely surfaces AB-specific stories.
export async function listSourcesWithArticles(): Promise<
  Array<{ slug: string; name: string; count: number }>
> {
  if (!isConfigured()) {
    const counts = new Map<string, number>();
    for (const a of MOCK_ARTICLES) counts.set(a.source.slug, (counts.get(a.source.slug) ?? 0) + 1);
    return Object.values(MOCK_SOURCES)
      .filter((s) => (counts.get(s.slug) ?? 0) > 0)
      .map((s) => ({ slug: s.slug, name: s.name, count: counts.get(s.slug) ?? 0 }));
  }
  const sb = anon();
  // Count via the public view so RLS still gates which rows are counted.
  // PostgREST doesn't expose `count(*) group by` directly so we fetch the
  // source_id list and tally client-side. Cheap at V1 scale (≤50 articles).
  const { data } = await sb
    .from('articles_public')
    .select('sources(slug, name)')
    .order('published_at', { ascending: false })
    .limit(500);
  if (!data) return [];
  const counts = new Map<string, { name: string; count: number }>();
  for (const row of data) {
    const s = Array.isArray(row.sources) ? row.sources[0] : (row.sources as { slug: string; name: string } | null);
    if (!s) continue;
    const existing = counts.get(s.slug);
    if (existing) existing.count++;
    else counts.set(s.slug, { name: s.name, count: 1 });
  }
  return [...counts.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
