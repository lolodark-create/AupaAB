// End-to-end pipeline test on a local RSS fixture.
// Validates that the crawler:
//   1. Reads an RSS file via rss-parser
//   2. Filters AB-relevant items (rejects unrelated ones)
//   3. Classifies categories correctly
//   4. Produces excerpts that respect the 350-char DB CHECK
//   5. Generates collision-free slugs
//
// We test the pure-functions slice end-to-end. The actual Supabase insert is
// covered by manual smoke (no point mocking the SDK shape).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import Parser from 'rss-parser';

import { isRelevantToAB } from '../src/filter';
import { classifyArticle } from '../src/classify';
import { generateExcerpt, EXCERPT_HARD_LIMIT } from '../src/excerpt';
import { generateSlug } from '../src/slug';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = resolve(__dirname, 'fixtures/sud-ouest-sample.xml');

describe('crawler · end-to-end RSS pipeline', () => {
  it('processes a real RSS fixture without I/O', async () => {
    const xml = readFileSync(FIXTURE, 'utf-8');
    const parser = new Parser();
    const feed = await parser.parseString(xml);

    // Pipeline: filter → classify → excerpt → slug
    const processed = feed.items
      .filter((item) => isRelevantToAB(item))
      .map((item) => ({
        sourceUrl: item.link!,
        title: item.title ?? '',
        slug: generateSlug(item.title ?? ''),
        category: classifyArticle({ title: item.title, snippet: item.contentSnippet }),
        excerpt: generateExcerpt({
          contentSnippet: item.contentSnippet ?? null,
          content: item.content ?? null,
          description: item.contentSnippet ?? null,
        }),
        author: item.creator ?? item.author ?? null,
      }));

    // 3 AB-relevant items, 2 unrelated rejected
    expect(processed).toHaveLength(3);

    // 1. Edwin Maka — mercato signing
    const maka = processed.find((a) => a.title.includes('Edwin Maka'));
    expect(maka).toBeDefined();
    expect(maka!.category).toBe('mercato');
    expect(maka!.excerpt).toContain('troisième-ligne fidjien');
    expect(maka!.excerpt.length).toBeLessThanOrEqual(EXCERPT_HARD_LIMIT);
    expect(maka!.slug).toMatch(/^edwin-maka-prolonge-deux-saisons-a-laviron-bayonnais-[a-z2-9]{6}$/);

    // 2. Avant-match Toulouse — match
    const avantMatch = processed.find((a) => a.title.includes('Toulouse'));
    expect(avantMatch).toBeDefined();
    expect(avantMatch!.category).toBe('match');

    // 3. Crabos — espoirs
    const crabos = processed.find((a) => a.title.includes('Crabos'));
    expect(crabos).toBeDefined();
    expect(crabos!.category).toBe('espoirs');
  });

  it('rejects items that mention "Bayonne" without rugby context', async () => {
    const xml = readFileSync(FIXTURE, 'utf-8');
    const parser = new Parser();
    const feed = await parser.parseString(xml);

    const rejected = feed.items.filter((item) => !isRelevantToAB(item));
    expect(rejected.map((r) => r.title)).toEqual([
      'Le Stade Toulousain en démonstration en Top 14',
      'Manifestation dans le centre de Bayonne ce samedi',
    ]);
  });

  it('produces unique slugs for items with the same title', async () => {
    // Edge case: same title published twice. Slugs must differ thanks to the
    // 6-char nanoid suffix, so DB inserts don't collide on the slug unique key.
    const t = 'Edwin Maka prolonge deux saisons';
    const s1 = generateSlug(t);
    const s2 = generateSlug(t);
    expect(s1).not.toBe(s2);
    expect(s1.slice(0, -7)).toBe(s2.slice(0, -7)); // same base, different suffix
  });

  it('every excerpt respects the 350-char DB constraint', async () => {
    const xml = readFileSync(FIXTURE, 'utf-8');
    const parser = new Parser();
    const feed = await parser.parseString(xml);

    for (const item of feed.items) {
      const excerpt = generateExcerpt({
        contentSnippet: item.contentSnippet ?? null,
        content: item.content ?? null,
        description: item.contentSnippet ?? null,
      });
      expect(excerpt.length).toBeLessThanOrEqual(EXCERPT_HARD_LIMIT);
    }
  });
});
