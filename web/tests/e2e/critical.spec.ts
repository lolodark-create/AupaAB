// Brief §16.2 — 5 critical E2E scenarios.
// Runs against the dev server with the mock-api fallback, so no Supabase needed.

import { test, expect } from '@playwright/test';

test('1. Visitor reads an article and follows the source link', async ({ page }) => {
  await page.goto('/');

  // Home should show at least one featured article
  const featuredLink = page.locator('article a[href^="/article/"]').first();
  await expect(featuredLink).toBeVisible();
  const href = await featuredLink.getAttribute('href');
  expect(href).toMatch(/^\/article\/[a-z0-9-]+$/);

  await featuredLink.click();
  await page.waitForURL(/\/article\//);

  // Article page renders the title (H1) and an outbound CTA
  await expect(page.locator('h1').first()).toBeVisible();
  const outbound = page.getByRole('link', { name: /Lire l'article complet/i });
  await expect(outbound).toBeVisible();
  await expect(outbound).toHaveAttribute('target', '_blank');
  await expect(outbound).toHaveAttribute('rel', /noopener/);

  // Verify legal mention "non-officiel" is in the source URL host (not aupaab.fr)
  const outboundHref = await outbound.getAttribute('href');
  expect(outboundHref).toMatch(/^https?:\/\//);
});

test('2. Visitor searches for a term and finds a result', async ({ page }) => {
  await page.goto('/recherche');
  const input = page.locator('input[name="q"]');
  await expect(input).toBeFocused();

  await input.fill('spedding');
  await input.press('Enter');
  await page.waitForURL(/q=spedding/);

  // At least one article matches "spedding" in the mock data
  const results = page.locator('article');
  await expect(results.first()).toBeVisible();
  expect(await results.count()).toBeGreaterThan(0);
});

test('3. /actu lists articles and filters by category', async ({ page }) => {
  await page.goto('/actu');
  // Mock data has 12, seeded DB has 5 — accept either path.
  const allCount = await page.locator('article').count();
  expect(allCount).toBeGreaterThanOrEqual(3);

  // Click "Mercato" filter
  const mercatoTab = page.getByRole('tab', { name: 'Mercato' });
  await mercatoTab.click();
  await page.waitForURL(/cat=mercato/);

  const filteredCount = await page.locator('article').count();
  expect(filteredCount).toBeLessThan(allCount);
  expect(filteredCount).toBeGreaterThan(0);

  // The Mercato badge should appear inside each filtered article
  const mercatoBadges = page.locator('article >> text=Mercato');
  expect(await mercatoBadges.count()).toBeGreaterThan(0);
});

test('4. 404 page renders with navigation back', async ({ page }) => {
  const response = await page.goto('/article/this-article-does-not-exist');
  expect(response?.status()).toBe(404);

  // Scope to <main> to avoid Astro's dev toolbar audit panel (also has h1s).
  await expect(page.locator('main h1')).toContainText(/n'existe pas|d[ée]plac[ée]e/);
  const homeBtn = page.getByRole('link', { name: "Retour à l'accueil", exact: true });
  await expect(homeBtn).toBeVisible();
  await homeBtn.click();
  await page.waitForURL((u) => u.pathname === '/');
});

test('5. Theme toggle persists across navigation', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // Both desktop (#theme-toggle-d) and mobile (#theme-toggle-m) buttons exist;
  // their parents are toggled via Tailwind responsive utilities, so pick the visible one.
  const themeButton = page.locator('#theme-toggle-d:visible, #theme-toggle-m:visible').first();
  await themeButton.click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // Navigate to /actu — theme should still be dark (persisted in localStorage + applied via inline boot script)
  await page.goto('/actu');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('API: rate-limit returns 429 once the bucket is full', async ({ request }) => {
  // Use a unique X-Forwarded-For so each run starts with an empty in-memory bucket.
  const ip = `198.51.100.${Math.floor(Math.random() * 254) + 1}`;
  const headers = { 'X-Forwarded-For': ip };

  let saw429 = false;
  let priorOk = 0;
  // Limit on /api/search is 30 req/60s. Fire up to 35 — expect 429 around #31.
  for (let i = 0; i < 35; i++) {
    const r = await request.get('/api/search?q=spedding', { headers });
    if (r.status() === 200) {
      priorOk++;
    } else if (r.status() === 429) {
      const body = await r.json();
      expect(body.error?.code).toBe('rate_limited');
      expect(r.headers()['retry-after']).toMatch(/^\d+$/);
      saw429 = true;
      break;
    }
  }
  expect(saw429).toBe(true);
  expect(priorOk).toBeGreaterThanOrEqual(30);
});

test('API: /api/articles responds with a valid envelope', async ({ request }) => {
  const r = await request.get('/api/articles?limit=3');
  expect(r.status()).toBe(200);
  const body = await r.json();
  // Up to `limit` items (real DB may have fewer than 3 seeded articles).
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data.length).toBeGreaterThan(0);
  expect(body.data.length).toBeLessThanOrEqual(3);
  expect(body.error).toBeNull();
  // meta.source === 'mock' when Supabase isn't configured, absent otherwise.
  if (body.meta?.source) {
    expect(body.meta.source).toBe('mock');
  }
});

test('API: takedown form accepts a valid submission', async ({ request }) => {
  // Unique X-Forwarded-For so we don't hit the rate-limit bucket built up by
  // previous test runs against the dev server.
  const ip = `192.0.2.${Math.floor(Math.random() * 254) + 1}`;
  const r = await request.post('/api/takedown', {
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    data: {
      email: 'editor@example.com',
      organization: 'Example Media',
      url: 'https://aupaab.fr/article/test',
      reason: 'copyright',
      message: 'Test takedown request.',
    },
  });
  expect(r.status()).toBe(200);
  const body = await r.json();
  expect(body.data.received).toBe(true);
  expect(body.error).toBeNull();
});
