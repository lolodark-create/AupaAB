import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://aupa-ab.com';

// Pick the adapter via env: ADAPTER=vercel (default) or ADAPTER=node.
// Vercel for production hosting, node for self-hosting (Railway/Fly/VPS) and local SSR tests.
const adapter =
  process.env.ADAPTER === 'node'
    ? node({ mode: 'standalone' })
    : vercel({
        webAnalytics: { enabled: false }, // we use Plausible
        imageService: false, // we use Cloudinary
      });

export default defineConfig({
  site: SITE_URL,
  output: 'server',
  adapter,
  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/api/') &&
        !page.includes('/mon-compte'),
    }),
  ],
  server: { port: 4321, host: true },
  prefetch: { defaultStrategy: 'viewport' },
});
