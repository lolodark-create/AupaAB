// Astro middleware — security headers on every response.
// Brief §15.1.

import { defineMiddleware } from 'astro:middleware';

const CSP_BASE = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://plausible.io https://cdn.plausible.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://res.cloudinary.com",
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
