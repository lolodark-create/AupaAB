// POST /api/takedown — editor takedown request form.
// External review point #8: a documented process is critical.

import type { APIRoute } from 'astro';
import { z } from 'zod';
import { service, hasServiceRole } from '~/lib/supabase';
import { ok, fail, badRequest, methodNotAllowed, rateLimit } from '~/lib/response';

export const prerender = false;

const bodySchema = z.object({
  email: z.string().email().max(200),
  organization: z.string().max(200).optional(),
  url: z.string().url().max(500),
  reason: z.enum(['copyright', 'gdpr', 'defamation', 'other']),
  message: z.string().max(2000).optional(),
});

export const POST: APIRoute = async (ctx) => {
  // 5 submissions per IP per hour
  const limited = await rateLimit(ctx, 'takedown', 5, 3600);
  if (limited) return limited;

  // Accept both JSON and form-encoded
  let raw: unknown;
  const contentType = ctx.request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    raw = await ctx.request.json().catch(() => null);
  } else {
    const form = await ctx.request.formData();
    raw = Object.fromEntries(form.entries());
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return badRequest('Champs invalides : ' + parsed.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join(', '), 'invalid_payload');
  }

  // Without Supabase configured (dev / preview), accept the submission for
  // shape validation but skip persistence. Returns success so the form UX works.
  if (!hasServiceRole()) {
    console.log('[takedown] (no DB) would store:', parsed.data.email, parsed.data.url);
    if ((ctx.request.headers.get('content-type') ?? '').includes('application/json')) {
      return ok({ received: true, persisted: false });
    }
    return new Response(null, { status: 303, headers: { Location: '/contact-retrait?ok=1' } });
  }

  const ip = ctx.clientAddress ?? ctx.request.headers.get('x-forwarded-for') ?? null;
  const ua = ctx.request.headers.get('user-agent');

  const sb = service();
  const { error } = await sb.from('takedown_requests').insert({
    email: parsed.data.email,
    organization: parsed.data.organization ?? null,
    target_url: parsed.data.url,
    reason: parsed.data.reason,
    message: parsed.data.message ?? null,
    ip_address: ip,
    user_agent: ua,
  });

  if (error) return fail(500, error.message, 'db_error');

  // Email the DPO — placeholder. Wire up Resend in a later sprint.
  console.log('[takedown] new request from', parsed.data.email, parsed.data.url);

  // Form posts redirect to the confirmation state; JSON gets a JSON response
  if (contentType.includes('application/json')) {
    return ok({ received: true });
  }
  return new Response(null, {
    status: 303,
    headers: { Location: '/contact-retrait?ok=1' },
  });
};

export const ALL: APIRoute = () => methodNotAllowed(['POST']);
