-- AI-generated synthesis column.
-- Replaces the raw RSS excerpt on article cards. Populated by
-- crawler/scripts/synthesize.mjs after each crawl + dedup pass.
-- Nullable: when the synthesizer hasn't run (or API key missing), the UI
-- falls back to the raw excerpt.
alter table public.articles
  add column if not exists ai_synthesis text;

comment on column public.articles.ai_synthesis is
  'Claude-generated 2-sentence synthesis in the AUPA AB tone. Replaces the raw RSS excerpt on cards. NULL = synthesizer hasn''t run yet — UI falls back to excerpt.';

-- articles_public is `select *`, so the new column is exposed automatically.
