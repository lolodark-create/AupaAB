// Astro middleware — security headers on every response.
// Brief §15.1.

import { defineMiddleware } from 'astro:middleware';

const CSP_BASE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://cdn.plausible.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // We hot-link article thumbnails from the source CDN of each registered
  // press partner. Listing each domain explicitly (instead of `https:`) keeps
  // the CSP narrow — the browser still blocks any random https image.
  "img-src 'self' data: https://res.cloudinary.com https://media.sudouest.fr https://images.rugbyrama.fr https://www.midi-olympique.fr https://images.midi-olympique.fr https://media.rmcsport.fr https://www.rmcsport.fr https://www.francebleu.fr https://media.francebleu.fr https://www.ici.fr https://media.ici.fr https://media.larepubliquedespyrenees.fr",
  "connect-src 'self' https://*.supabase.co https://plausible.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export const onRequest = defineMiddleware(async (_ctx, next) => {
  const response = await next();

  response.headers.set('Content-Security-Policy', CSP_BASE);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
});
