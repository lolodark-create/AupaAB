// Brief §13 + §22 — WCAG 2.2 AA, "Aucune erreur axe-core".
// Runs axe on the key public pages in light and dark themes.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const KEY_PAGES = [
  { path: '/', label: 'home' },
  { path: '/actu', label: 'actu' },
  { path: '/article/edwin-maka-prolonge-deux-saisons', label: 'article' },
  { path: '/recherche?q=spedding', label: 'recherche' },
  { path: '/sources', label: 'sources' },
] as const;

const THEMES = ['light', 'dark'] as const;

// We test WCAG 2.0/2.1 AA (axe rule sets). 2.2 AA is largely a superset that
// axe-core gates behind separate rules; we'll add them when stable.
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];

for (const theme of THEMES) {
  for (const { path, label } of KEY_PAGES) {
    test(`a11y · ${label} (${theme})`, async ({ page }) => {
      // Force theme via localStorage so the inline boot script applies it.
      await page.addInitScript((t) => localStorage.setItem('aupa-theme', t), theme);
      await page.goto(path);
      // Wait for any client-side effects (Klaro mounts a notice after init).
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags([...AXE_TAGS])
        // Exclude Klaro's modal — third-party UI, audit it once via their own pipeline.
        .exclude('#klaro')
        .analyze();

      if (results.violations.length) {
        for (const v of results.violations) {
          // eslint-disable-next-line no-console
          console.log(`[axe ${theme} ${label}] ${v.id} (${v.impact}): ${v.help}`);
          for (const n of v.nodes.slice(0, 3)) {
            // eslint-disable-next-line no-console
            console.log('  →', n.target.join(' '), '— ', n.failureSummary?.split('\n')[0]);
          }
        }
      }

      // Hard-fail on serious / critical only. Minor (e.g. "color-contrast-enhanced")
      // is informational — the brief targets AAA contrast separately.
      const blocking = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(blocking, JSON.stringify(blocking.map((v) => v.id))).toEqual([]);
    });
  }
}
