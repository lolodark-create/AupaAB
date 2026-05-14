// Supabase clients — one anon-keyed (browser & SSR), one service-role (server only).
// Anon client respects RLS. Service-role bypasses RLS — use it ONLY on the server.
//
// Both clients are lazy: calling them without env vars throws. Use isConfigured()
// before calling, so API routes can fall back to mock data in dev / Vercel previews
// where no Supabase project is wired up.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

let _anon: SupabaseClient | null = null;
let _service: SupabaseClient | null = null;

/** True when both PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are set. */
export function isConfigured(): boolean {
  return Boolean(url && anonKey);
}

/** True when SUPABASE_SERVICE_ROLE_KEY is also set (server-only ops). */
export function hasServiceRole(): boolean {
  return Boolean(url && serviceKey);
}

export function anon(): SupabaseClient {
  if (!isConfigured()) {
    throw new Error('Supabase not configured (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY)');
  }
  _anon ??= createClient(url, anonKey, { auth: { persistSession: false } });
  return _anon;
}

export function service(): SupabaseClient {
  if (!hasServiceRole()) {
    throw new Error('Supabase service role not configured (SUPABASE_SERVICE_ROLE_KEY)');
  }
  _service ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _service;
}
