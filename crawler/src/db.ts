// Supabase service-role client + small helpers used by the crawler.
// Service-role key is REQUIRED on the crawler side; never expose it to the client.

import { createClient } from '@supabase/supabase-js';

const url = process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) throw new Error('Missing PUBLIC_SUPABASE_URL or SUPABASE_URL');
if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

export const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface SourceRow {
  id: string;
  slug: string;
  name: string;
  domain: string;
  feed_url: string;
  is_active: boolean;
  fetch_interval: number;
  last_fetched_at: string | null;
}

export async function listActiveSources(): Promise<SourceRow[]> {
  // External review point #8 — exclude blocklisted domains even if a source was misconfigured.
  const { data: blocklist } = await supabase.from('domain_blocklist').select('domain');
  const blockedDomains = new Set((blocklist ?? []).map((b: { domain: string }) => b.domain));

  const { data, error } = await supabase
    .from('sources')
    .select('id, slug, name, domain, feed_url, is_active, fetch_interval, last_fetched_at')
    .eq('is_active', true);

  if (error) throw error;
  return (data ?? []).filter((s) => !blockedDomains.has(s.domain));
}

export async function findArticleByUrl(sourceUrl: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('id')
    .eq('source_url', sourceUrl)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface CrawlRunStart {
  id: string;
}

export async function startCrawlRun(sourceId: string): Promise<CrawlRunStart> {
  const { data, error } = await supabase
    .from('crawl_runs')
    .insert({ source_id: sourceId, status: 'running' })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function completeCrawlRun(
  runId: string,
  status: 'success' | 'failed',
  stats: { articles_found: number; articles_new: number; errors?: string[] },
): Promise<void> {
  const { error } = await supabase
    .from('crawl_runs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      articles_found: stats.articles_found,
      articles_new: stats.articles_new,
      errors: stats.errors ?? null,
    })
    .eq('id', runId);
  if (error) throw error;
}

export async function touchSourceLastFetched(sourceId: string): Promise<void> {
  const { error } = await supabase
    .from('sources')
    .update({ last_fetched_at: new Date().toISOString() })
    .eq('id', sourceId);
  if (error) throw error;
}

export interface InsertableArticle {
  slug: string;
  title: string;
  source_id: string;
  source_url: string;
  excerpt: string;
  author: string | null;
  published_at: string;
  category: string;
  tags: string[];
  reading_time_sec: number | null;
  cover_image_url: string | null;
  cover_variant: string | null;
}

export async function insertArticle(article: InsertableArticle): Promise<void> {
  const { error } = await supabase.from('articles').insert(article);
  if (error) throw error;
}
