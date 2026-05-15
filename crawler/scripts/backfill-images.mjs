#!/usr/bin/env node
/**
 * Backfill cover_image_url for existing articles by re-parsing the RSS
 * feeds and matching items to articles via source_url.
 *
 * One-shot use after wiring image extraction into ingest-once.mjs — future
 * articles get their image populated at insert time, so this script only
 * needs to run once.
 *
 *   DATABASE_URL=...  node crawler/scripts/backfill-images.mjs
 *   --force        # overwrite existing cover_image_url too
 */
import postgres from 'postgres';
import Parser from 'rss-parser';

const FORCE = process.argv.includes('--force');
const FEED_TIMEOUT_MS = 15_000;

function extractFromRss(item) {
  const mc = item.mediaContent;
  if (Array.isArray(mc) && mc[0]) {
    const u = mc[0].$?.url || mc[0].url;
    if (u) return u;
  }
  const mt = item.mediaThumbnail;
  if (Array.isArray(mt) && mt[0]) {
    const u = mt[0].$?.url || mt[0].url;
    if (u) return u;
  }
  if (item.enclosure?.url && /^image\//.test(item.enclosure.type || '')) {
    return item.enclosure.url;
  }
  const html = item['content:encoded'] || item.content || item.description || '';
  const m = String(html).match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m && /^https?:\/\//.test(m[1])) return m[1];
  return null;
}

async function fetchOgImage(articleUrl) {
  try {
    const res = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'AUPA-AB-Crawler/0.1 (+https://aupa-ab.fr/sources)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return null;
    const html = (await res.text()).slice(0, 30_000);
    const og =
      html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!og) return null;
    let url = og[1];
    if (url.startsWith('//')) url = 'https:' + url;
    else if (url.startsWith('/')) {
      const u = new URL(articleUrl);
      url = `${u.protocol}//${u.host}${url}`;
    }
    return /^https?:\/\//.test(url) ? url : null;
  } catch {
    return null;
  }
}

async function extractCoverImage(item) {
  return extractFromRss(item) || (await fetchOgImage(item.link));
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 2, prepare: false });
const parser = new Parser({
  headers: { 'User-Agent': 'AUPA-AB-Crawler/0.1 (+https://aupa-ab.fr/sources)' },
  timeout: FEED_TIMEOUT_MS,
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

const articles = await sql`
  select a.id, a.title, a.source_url, a.cover_image_url, s.slug as source_slug, s.feed_url
  from public.articles a
  join public.sources s on s.id = a.source_id
  ${FORCE ? sql`` : sql`where a.cover_image_url is null`}
  order by a.published_at desc
`;
console.log(`▶ ${articles.length} article(s) to backfill${FORCE ? ' (FORCE)' : ''}`);

// Group articles by feed_url so we parse each feed once
const byFeed = new Map();
for (const a of articles) {
  if (!byFeed.has(a.feed_url)) byFeed.set(a.feed_url, []);
  byFeed.get(a.feed_url).push(a);
}

let updated = 0;
let notFound = 0;
let noImage = 0;

for (const [feedUrl, list] of byFeed) {
  process.stdout.write(`  ${list[0].source_slug.padEnd(12)} ${feedUrl.slice(0, 70).padEnd(70)} `);
  let feed;
  try {
    feed = await parser.parseURL(feedUrl);
  } catch (err) {
    console.log(`✗ ${err.message}`);
    continue;
  }
  const items = feed.items || [];
  // Match by source_url. Some sources strip query strings — try both.
  const byUrl = new Map();
  for (const it of items) {
    if (it.link) byUrl.set(it.link, it);
  }
  let found = 0;
  for (const a of list) {
    const item = byUrl.get(a.source_url);
    if (!item) {
      notFound++;
      continue;
    }
    const img = await extractCoverImage(item);
    if (!img) {
      noImage++;
      continue;
    }
    await sql`update public.articles set cover_image_url = ${img} where id = ${a.id}`;
    updated++;
    found++;
  }
  console.log(`updated=${found}/${list.length}`);
}

console.log(`\n✓ updated=${updated}  not-found-in-feed=${notFound}  no-image-in-item=${noImage}`);
await sql.end();
