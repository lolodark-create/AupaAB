-- Newsletter subscribers.
-- Double opt-in: a row is created at signup with confirmed_at = null and a
-- confirmation_token; clicking the link in the confirmation email flips
-- confirmed_at. Unsubscribe is one click with a per-subscriber token so
-- nobody can guess and unsubscribe a stranger.
create table if not exists public.subscribers (
  id                    uuid primary key default gen_random_uuid(),
  email                 text not null unique check (email = lower(email) and email ~ '^[^@]+@[^@]+\.[^@]+$'),
  confirmation_token    uuid not null default gen_random_uuid(),
  confirmed_at          timestamptz,
  unsubscribe_token     uuid not null default gen_random_uuid(),
  unsubscribed_at       timestamptz,
  preferences           jsonb not null default '{}'::jsonb,
  source_hint           text,                 -- "footer", "feed-inline", "article-bottom" — track which CTA converts
  ip                    inet,                 -- light anti-abuse (rate-limit per IP)
  user_agent            text,
  created_at            timestamptz not null default now(),
  last_email_sent_at    timestamptz
);

create index if not exists idx_subscribers_active on public.subscribers(confirmed_at) where confirmed_at is not null and unsubscribed_at is null;
create index if not exists idx_subscribers_confirmation on public.subscribers(confirmation_token);
create index if not exists idx_subscribers_unsubscribe on public.subscribers(unsubscribe_token);

comment on table public.subscribers is 'Newsletter subscribers, double opt-in. Active = confirmed_at is not null AND unsubscribed_at is null.';
comment on column public.subscribers.source_hint is 'Which CTA the subscriber came from (footer/feed-inline/article-bottom) — measure which placement converts.';

-- RLS: locked down. Anonymous users can INSERT (via the subscribe API
-- route), nothing else. Server-side routes use the service role to
-- update confirmation/unsubscribe state.
alter table public.subscribers enable row level security;
create policy subscribers_anon_insert on public.subscribers
  for insert to anon
  with check (true);
-- (no select / update / delete for anon)
