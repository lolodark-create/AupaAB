-- Fixtures (matches) — populated from the ESPN Top 14 endpoint by
-- crawler/scripts/fetch-fixtures.mjs once a day. Replaces the V1 mocked
-- MatchBanner — every column here is a real ESPN value.
create table if not exists public.fixtures (
  id              text primary key,             -- ESPN event id
  competition     text not null,                -- "French Top 14"
  round_label     text,                         -- "Round 24", null when ESPN doesn't ship one
  kickoff         timestamptz not null,         -- UTC, page renders in local time
  home_id         text not null,                -- ESPN team id
  away_id         text not null,
  home_short      text not null,                -- "BAY", "LYO", etc.
  away_short      text not null,
  home_name       text not null,
  away_name       text not null,
  venue           text,
  is_home         boolean not null,             -- AB home or away
  status          text not null,                -- Scheduled | In Progress | Final | Postponed | Cancelled
  home_score      integer,                      -- null until match starts
  away_score      integer,
  fetched_at      timestamptz not null default now()
);

create index if not exists idx_fixtures_kickoff on public.fixtures(kickoff desc);
create index if not exists idx_fixtures_status on public.fixtures(status);

comment on table public.fixtures is 'Aviron Bayonnais fixtures pulled from the ESPN Top 14 API. Refreshed once a day (cron).';

-- RLS — public read of every fixture, write via service role only.
alter table public.fixtures enable row level security;
create policy fixtures_public_read on public.fixtures for select using (true);
