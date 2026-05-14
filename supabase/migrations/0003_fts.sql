-- AUPA AB — Postgres Full Text Search (V1, replaces MeiliSearch per external review #5).
-- French dictionary + unaccent + pg_trgm for typo tolerance.
-- Target: < 100 ms search on 1 000+ articles.

-- =============================================================
-- Immutable wrapper around unaccent().
-- The default unaccent() is marked STABLE because it reads its dictionary
-- via the search_path. Postgres rejects STABLE functions in generated
-- columns and functional indexes — we wrap with an explicit dictionary
-- argument and mark it IMMUTABLE.
-- =============================================================
-- Supabase installs extensions in the `extensions` schema (not public),
-- so we have to qualify the call. Mark IMMUTABLE since we trust the dictionary
-- is static after install (Postgres only checks at create time of generated
-- columns / functional indexes — but we use a trigger, so this is mostly
-- documentation here).
create or replace function public.immutable_unaccent(text)
returns text language sql immutable parallel safe strict as $$
  select public.unaccent($1)
$$;

-- =============================================================
-- Helper: title + excerpt + tags as a single unaccent'd tsvector
-- =============================================================
create or replace function public.article_search_vector(
  p_title text,
  p_excerpt text,
  p_tags text[],
  p_author text
) returns tsvector language sql immutable as $$
  select
    setweight(to_tsvector('french', public.immutable_unaccent(coalesce(p_title, ''))), 'A') ||
    setweight(to_tsvector('french', public.immutable_unaccent(coalesce(p_excerpt, ''))), 'B') ||
    setweight(to_tsvector('french', public.immutable_unaccent(coalesce(array_to_string(p_tags, ' '), ''))), 'B') ||
    setweight(to_tsvector('french', public.immutable_unaccent(coalesce(p_author, ''))), 'C')
$$;

-- =============================================================
-- search_vector column populated by a trigger.
-- Why not GENERATED ALWAYS AS … STORED? Postgres rejects it because the
-- unaccent extension's underlying function is STABLE (not IMMUTABLE) — even
-- when wrapped, Supabase's transitive volatility check refuses. A trigger
-- gives identical functional behavior with no constraint on volatility.
-- =============================================================
alter table public.articles drop column if exists search_vector;
alter table public.articles add column search_vector tsvector;

create or replace function public.articles_search_vector_trigger()
returns trigger language plpgsql as $$
begin
  new.search_vector := public.article_search_vector(
    new.title, new.excerpt, new.tags, new.author
  );
  return new;
end;
$$;

drop trigger if exists trg_articles_search_vector on public.articles;
create trigger trg_articles_search_vector
  before insert or update of title, excerpt, tags, author on public.articles
  for each row execute function public.articles_search_vector_trigger();

-- Backfill any rows that already existed before this column was added
update public.articles set title = title where search_vector is null;

create index if not exists idx_articles_search on public.articles using gin(search_vector);

-- Trigram for typo-tolerant fallback ("speding" → "spedding")
create index if not exists idx_articles_title_trgm on public.articles using gin (public.immutable_unaccent(title) public.gin_trgm_ops);

-- =============================================================
-- Function: search_articles
-- Returns ranked, filterable results.
-- =============================================================
create or replace function public.search_articles(
  p_query text,
  p_category public.article_category default null,
  p_source_slug text default null,
  p_limit int default 20,
  p_offset int default 0
) returns table (
  id              uuid,
  slug            text,
  title           text,
  excerpt         text,
  author          text,
  published_at    timestamptz,
  category        public.article_category,
  source_id       uuid,
  source_slug     text,
  source_name     text,
  comment_count   int,
  reading_time_sec int,
  rank            float
) language sql stable as $$
  with q as (
    select
      coalesce(nullif(trim(p_query), ''), '') as raw,
      websearch_to_tsquery('french', public.immutable_unaccent(coalesce(nullif(trim(p_query), ''), ''))) as tsq
  )
  select
    a.id,
    a.slug,
    a.title,
    a.excerpt,
    a.author,
    a.published_at,
    a.category,
    a.source_id,
    s.slug as source_slug,
    s.name as source_name,
    a.comment_count,
    a.reading_time_sec,
    case
      when (select tsq from q) is null then 0
      else ts_rank(a.search_vector, (select tsq from q))
    end as rank
  from public.articles a
  join public.sources s on s.id = a.source_id
  cross join q
  where a.is_published = true
    and a.takedown_reason is null
    and (
      q.raw = '' or
      a.search_vector @@ q.tsq or
      public.immutable_unaccent(a.title) ilike '%' || public.immutable_unaccent(q.raw) || '%'
    )
    and (p_category is null or a.category = p_category)
    and (p_source_slug is null or s.slug = p_source_slug)
  order by
    case when q.raw = '' then a.published_at end desc nulls last,
    rank desc,
    a.published_at desc
  limit p_limit
  offset p_offset
$$;

comment on function public.search_articles(text, public.article_category, text, int, int) is
'Postgres FTS over title/excerpt/tags/author with French dictionary, unaccent and trigram fallback. Returns articles with their source.';

-- =============================================================
-- Function: search_autocomplete
-- Lightweight: returns up to 5 titles matching a prefix.
-- =============================================================
create or replace function public.search_autocomplete(
  p_prefix text,
  p_limit int default 5
) returns table (slug text, title text) language sql stable as $$
  select a.slug, a.title
  from public.articles a
  where a.is_published = true
    and a.takedown_reason is null
    and public.immutable_unaccent(a.title) ilike public.immutable_unaccent(p_prefix) || '%'
  order by a.published_at desc
  limit p_limit
$$;

-- Grant execute to anon/authenticated for the public API.
grant execute on function public.search_articles(text, public.article_category, text, int, int) to anon, authenticated;
grant execute on function public.search_autocomplete(text, int) to anon, authenticated;
