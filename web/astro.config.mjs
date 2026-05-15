import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

const SITE_URL = process.env.PUBLIC_SITE_URL || 'https://aupa-ab.fr';

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
      // /actu became a 301-redirect to / after the home/actu merge; keeping
      // it in the sitemap would advertise a redirect URL to crawlers.
      // /recherche is noindex/nofollow (search results are user-specific).
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/api/') &&
        !page.includes('/mon-compte') &&
        !page.match(/\/actu\/?$/) &&
        !page.includes('/recherche'),
    }),
  ],
  server: { port: 4321, host: true },
  prefetch: { defaultStrategy: 'viewport' },
});
