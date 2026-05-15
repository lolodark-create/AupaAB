-- Idempotency log for newsletter sends. Prevents the cron from firing a
-- second time the same day (cron retries, manual workflow_dispatch over
-- the schedule, etc.). One row per (kind, date-in-Paris) tuple.
create table if not exists public.newsletter_sends (
  id                uuid primary key default gen_random_uuid(),
  kind              text not null check (kind in ('morning', 'evening')),
  send_date         date not null,
  sent_at           timestamptz not null default now(),
  recipients_count  integer not null default 0,
  fixture_id        text references public.fixtures(id) on delete set null,
  unique (kind, send_date)
);

create index if not exists idx_newsletter_sends_date on public.newsletter_sends(send_date desc);

comment on table public.newsletter_sends is 'Idempotency tracker for daily/post-match newsletter sends. send_date is in Europe/Paris.';
comment on column public.newsletter_sends.fixture_id is 'For kind=evening, the AB fixture this recap covers.';
