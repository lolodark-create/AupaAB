-- Re-create articles_public so the new ai_synthesis column is exposed.
-- Postgres views freeze their column list at creation time: `select *` is
-- expanded once and doesn't pick up later ALTER TABLE ADD COLUMN. We need
-- to drop + recreate (CREATE OR REPLACE refuses when the column list
-- changes shape).
drop view if exists public.articles_public;

create view public.articles_public as
  select * from public.articles
  where is_published = true and takedown_reason is null;

comment on view public.articles_public is 'Use this view from the API. Automatically filters takedown + unpublished. Recreated in 0006 to pick up ai_synthesis (and any future column).';

-- Refresh PostgREST schema cache so the new shape is visible to the API.
notify pgrst, 'reload schema';
