// Uniform JSON envelope per brief §7.7: { data, error, meta }.

import type { APIContext } from 'astro';
import { service, hasServiceRole } from './supabase';

export interface ApiEnvelope<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
  meta?: Record<string, unknown>;
}

export function ok<T>(data: T, meta?: Record<string, unknown>): Response {
  const body: ApiEnvelope<T> = { data, error: null, meta };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function fail(status: number, message: string, code?: string): Response {
  const body: ApiEnvelope<never> = { data: null, error: { message, code } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function notFound(message = 'Not found'): Response {
  return fail(404, message, 'not_found');
}

export function badRequest(message = 'Bad request', code = 'bad_request'): Response {
  return fail(400, message, code);
}

export function methodNotAllowed(allowed: string[]): Response {
  return new Response(JSON.stringify({ data: null, error: { message: 'Method not allowed' } }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Allow: allowed.join(', '),
    },
  });
}

/**
 * IP + bucket rate limiter.
 *
 * Backed by the Postgres `api_rate_limit` table when Supabase service-role is
 * configured (durable across instances). Falls back to a per-process in-memory
 * map otherwise (works in dev and on a single-instance Node deploy; doesn't
 * carry state across serverless cold starts on Vercel — for production, set
 * SUPABASE_SERVICE_ROLE_KEY).
 *
 * Returns a 429 Response when the bucket is full, else null.
 */
const memBuckets = new Map<string, { count: number; windowStart: number }>();

function rateLimitedResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      data: null,
      error: { message: 'Trop de requêtes, réessayez dans un instant.', code: 'rate_limited' },
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(Math.ceil(retryAfterSeconds)),
      },
    },
  );
}

export async function rateLimit(
  ctx: APIContext,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<Response | null> {
  // Prefer X-Forwarded-For (standard behind Vercel/Cloudflare/Nginx). Their
  // edges strip client-supplied XFF and re-set it to the real IP, so trusting
  // this header in prod is safe. Falls back to ctx.clientAddress otherwise.
  const xff = ctx.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = xff || ctx.clientAddress || 'unknown';
  const key = `${ip}:${bucket}`;

  // ── Postgres-backed (production) ──
  if (hasServiceRole()) {
    const sb = service();
    const { data: row } = await sb
      .from('api_rate_limit')
      .select('count, window_start')
      .eq('key', key)
      .maybeSingle();

    const now = new Date();
    if (!row) {
      await sb.from('api_rate_limit').insert({ key, count: 1, window_start: now.toISOString() });
      return null;
    }
    const elapsed = (now.getTime() - new Date(row.window_start).getTime()) / 1000;
    if (elapsed >= windowSeconds) {
      await sb.from('api_rate_limit').update({ count: 1, window_start: now.toISOString() }).eq('key', key);
      return null;
    }
    if (row.count >= limit) {
      return rateLimitedResponse(windowSeconds - elapsed);
    }
    await sb.from('api_rate_limit').update({ count: row.count + 1 }).eq('key', key);
    return null;
  }

  // ── In-memory fallback (dev / preview / no-DB deploy) ──
  const now = Date.now();
  const slot = memBuckets.get(key);
  if (!slot || now - slot.windowStart >= windowSeconds * 1000) {
    memBuckets.set(key, { count: 1, windowStart: now });
    return null;
  }
  if (slot.count >= limit) {
    return rateLimitedResponse(windowSeconds - (now - slot.windowStart) / 1000);
  }
  slot.count++;
  return null;
}

// Exposed for tests
export function _resetRateLimit(): void {
  memBuckets.clear();
}
