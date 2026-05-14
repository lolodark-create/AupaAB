import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/filter.ts', 'src/classify.ts', 'src/excerpt.ts', 'src/slug.ts', 'src/text.ts'],
      // Brief §16.2 — 100 % coverage on pure crawler functions
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
