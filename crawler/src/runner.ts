// Crawler runner — one cron tick.
// V1: RSS only. No scraping. No fallback. (External review #6.)

import Parser from 'rss-parser';
import {
  completeCrawlRun,
  findArticleByUrl,
  insertArticle,
  listActiveSources,
  startCrawlRun,
  touchSourceLastFetched,
  type SourceRow,
  type InsertableArticle,
} from './db.js';
import { isRelevantToAB } from './filter.js';
import { classifyArticle } from './classify.js';
import { generateExcerpt } from './excerpt.js';
import { generateSlug } from './slug.js';

const USER_AGENT = 'AUPA-AB-Crawler/0.1 (+https://aupa-ab.fr/sources)';
const SOURCE_DELAY_MS = 2_000;
const PER_RUN_TIMEOUT_MS = 30_000;

const parser = new Parser({
  headers: { 'User-Agent': USER_AGENT },
  timeout: 15_000,
});

interface RunStats {
  articles_found: number;
  articles_new: number;
  errors: string[];
}

export async function runCrawl(): Promise<{ ranAt: string; stats: Record<string, RunStats> }> {
  const startedAt = new Date().toISOString();
  const sources = await listActiveSources();
  const perSource: Record<string, RunStats> = {};

  for (const source of sources) {
    perSource[source.slug] = await runSource(source);
    await new Promise((r) => setTimeout(r, SOURCE_DELAY_MS));
  }

  return { ranAt: startedAt, stats: perSource };
}

async function runSource(source: SourceRow): Promise<RunStats> {
  const run = await startCrawlRun(source.id);
  const stats: RunStats = { articles_found: 0, articles_new: 0, errors: [] };

  try {
    const feed = await Promise.race([
      parser.parseURL(source.feed_url),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Feed timeout: ${source.feed_url}`)), PER_RUN_TIMEOUT_MS),
      ),
    ]);

    for (const item of feed.items ?? []) {
      stats.articles_found++;

      // Skip irrelevant
      if (!isRelevantToAB(item)) continue;

      // Skip if already in DB
      if (!item.link) continue;
      const existing = await findArticleByUrl(item.link).catch(() => null);
      if (existing) continue;

      // Compose the row
      const title = (item.title ?? '').trim();
      if (!title) continue;

      const article: InsertableArticle = {
        slug: generateSlug(title),
        title,
        source_id: source.id,
        source_url: item.link,
        excerpt: generateExcerpt({
          contentSnippet: item.contentSnippet ?? null,
          content: item['content:encoded'] ?? item.content ?? null,
          description: item.contentSnippet ?? null,
        }),
        author: item.creator ?? item.author ?? null,
        published_at: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        category: classifyArticle({ title, snippet: item.contentSnippet ?? null }),
        tags: [],
        reading_time_sec: estimateReadingTimeSec(item.contentSnippet ?? item.content ?? ''),
        cover_image_url: null, // Cloudinary URL added in a later sprint
        cover_variant: null,
      };

      try {
        await insertArticle(article);
        stats.articles_new++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Duplicate slug / url is fine (race) — only log other errors
        if (!msg.includes('duplicate key')) stats.errors.push(`insert: ${msg}`);
      }
    }

    await touchSourceLastFetched(source.id);
    await completeCrawlRun(run.id, 'success', stats);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    stats.errors.push(`fetch: ${msg}`);
    await completeCrawlRun(run.id, 'failed', stats).catch(() => {});
  }

  return stats;
}

function estimateReadingTimeSec(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  const wpm = 230;
  return Math.max(60, Math.round((words / wpm) * 60));
}
