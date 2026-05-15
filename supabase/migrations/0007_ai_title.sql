-- AI-rewritten short title.
-- The source title is often a long journalistic lede — fine on the source's
-- own page, weak on a card. ai_title is a 3-7 word punch line in the AUPA
-- tone, generated alongside ai_synthesis in a single Claude call.
alter table public.articles
  add column if not exists ai_title text;

comment on column public.articles.ai_title is
  'Claude-generated short headline (3-7 words) in the AUPA tone. The UI uses this on cards and falls back to the raw title when null.';

-- Recreate articles_public so the new column is exposed via PostgREST. Views
-- freeze their column list at creation, same dance as 0006.
drop view if exists public.articles_public;
create view public.articles_public as
  select * from public.articles
  where is_published = true and takedown_reason is null;
comment on view public.articles_public is 'Use this view from the API. Automatically filters takedown + unpublished. Recreated in 0007 to pick up ai_title.';

notify pgrst, 'reload schema';
