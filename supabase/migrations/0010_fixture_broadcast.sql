-- Broadcast channel column. ESPN doesn't ship French TV rights, so we
-- derive it from the competition: Top 14 = Canal+ Sport (exclusive since
-- the 2023-27 deal), Champions Cup = BeIN Sport / France TV, etc.
alter table public.fixtures
  add column if not exists broadcast text;

comment on column public.fixtures.broadcast is
  'Broadcast channel(s). Derived from competition in fetch-fixtures.mjs because the ESPN feed leaves it blank for France.';

-- Backfill known cases. French Top 14 is the only competition AB currently
-- plays in V1 — extend when we add Champions Cup fixtures.
update public.fixtures
   set broadcast = 'Canal+ Sport'
 where competition = 'French Top 14'
   and broadcast is null;
