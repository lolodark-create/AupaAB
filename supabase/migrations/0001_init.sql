-- AUPA AB — initial schema
-- Brief §4.1 + corrections from external review (takedown, domain_blocklist).
-- Supabase Postgres 15.

-- =============================================================
-- Extensions
-- =============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";
create extension if not exists "unaccent";

-- =============================================================
-- TABLE: sources
-- =============================================================
create table public.sources (
  id              uuid primary key default uuid_generate_v4(),
  slug            text unique not null,
  name            text not null,
  domain          text not null,
  feed_url        text not null,
  logo_url        text,
  is_active       boolean not null default true,
  fetch_interval  int not null default 900 check (fetch_interval >= 60),
  last_fetched_at timestamptz,
  created_at      timestamptz not null default now()
);

comment on table public.sources is 'Aggregated media sources (RSS feeds).';
comment on column public.sources.is_active is 'When false the crawler will skip this source. Used for takedown / pause.';

-- =============================================================
-- ENUMS
-- =============================================================
create type public.article_category as enum (
  'match', 'mercato', 'coulisses', 'espoirs', 'pays_basque', 'autre'
);

create type public.user_role as enum ('member', 'contributor', 'moderator', 'admin');

create type public.comment_status as enum ('published', 'pending', 'hidden', 'removed');

create type public.report_reason as enum ('spam', 'hate', 'harassment', 'off_topic', 'other');

create type public.report_status as enum ('pending', 'reviewed_kept', 'reviewed_removed');

create type public.moderation_action as enum (
  'comment_approved', 'comment_removed', 'comment_hidden',
  'user_warned', 'user_banned', 'user_unbanned',
  'article_taken_down', 'domain_blocked'
);

-- =============================================================
-- TABLE: domain_blocklist
-- An editor asked us not to ingest from their domain anymore.
-- The crawler must skip any feed whose domain matches.
-- =============================================================
create table public.domain_blocklist (
  domain        text primary key,
  reason        text,
  blocked_by    uuid,
  blocked_at    timestamptz not null default now()
);

comment on table public.domain_blocklist is 'Domains the crawler must never ingest from. Editor takedown or legal request.';

-- =============================================================
-- TABLE: articles
-- =============================================================
create table public.articles (
  id                uuid primary key default uuid_generate_v4(),
  slug              text unique not null,
  title             text not null,
  source_id         uuid not null references public.sources(id),
  source_url        text not null unique,
  excerpt           text not null check (char_length(excerpt) <= 350),
  author            text,
  published_at      timestamptz not null,
  fetched_at        timestamptz not null default now(),
  category          public.article_category not null default 'autre',
  tags              text[] not null default '{}',
  reading_time_sec  int,
  cover_image_url   text,
  cover_variant     text check (cover_variant in ('night', 'sand', 'aviron', 'wave') or cover_variant is null),
  view_count        int not null default 0,
  comment_count     int not null default 0,
  is_published      boolean not null default true,
  is_pinned         boolean not null default false,
  takedown_reason   text,
  takedown_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on column public.articles.excerpt is 'Hard-capped 350 chars (brief §1.2 + §5.7). Legal constraint, do not change.';
comment on column public.articles.takedown_reason is 'When set, the article is excluded from public reads via the articles_public view.';

create index idx_articles_published_at on public.articles(published_at desc);
create index idx_articles_category on public.articles(category);
create index idx_articles_tags on public.articles using gin(tags);
create index idx_articles_source on public.articles(source_id);
create index idx_articles_takedown on public.articles(takedown_at) where takedown_reason is not null;
create index idx_articles_recent_published on public.articles(published_at desc) where is_published = true and takedown_reason is null;

-- Public-facing view: excludes taken-down articles automatically. Use this from API routes.
create view public.articles_public as
  select * from public.articles
  where is_published = true and takedown_reason is null;

comment on view public.articles_public is 'Use this view from the API. Automatically filters takedown + unpublished.';

-- =============================================================
-- TABLE: profiles (mirror of auth.users)
-- Set up in V1 so RLS scaffolding is ready; actual signup opens at V1.5.
-- =============================================================
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique not null check (username ~ '^[a-z0-9_-]{3,20}$'),
  display_name        text check (char_length(display_name) <= 40),
  avatar_url          text,
  bio                 text check (char_length(bio) <= 200),
  supporter_since     int check (supporter_since between 1900 and 2100),
  favorite_player     text check (char_length(favorite_player) <= 50),
  role                public.user_role not null default 'member',
  is_banned           boolean not null default false,
  banned_until        timestamptz,
  ban_reason          text,
  email_notifications jsonb not null default '{"on_reply": true, "on_mention": true, "on_like": false, "weekly_digest": false}'::jsonb,
  comment_count       int not null default 0,
  badges              text[] not null default '{}',
  created_at          timestamptz not null default now(),
  last_seen_at        timestamptz
);

create index idx_profiles_username on public.profiles(username);

-- =============================================================
-- TABLE: saved_articles (V1.5)
-- =============================================================
create table public.saved_articles (
  user_id    uuid references public.profiles(id) on delete cascade,
  article_id uuid references public.articles(id) on delete cascade,
  saved_at   timestamptz not null default now(),
  primary key (user_id, article_id)
);

create index idx_saved_user on public.saved_articles(user_id, saved_at desc);

-- =============================================================
-- TABLE: comments (V2 — table exists so we don't migrate later)
-- =============================================================
create table public.comments (
  id                uuid primary key default uuid_generate_v4(),
  article_id        uuid not null references public.articles(id) on delete cascade,
  author_id         uuid not null references public.profiles(id) on delete cascade,
  parent_id         uuid references public.comments(id) on delete cascade,
  body              text not null check (char_length(body) between 1 and 2000),
  body_rendered     text not null,
  is_edited         boolean not null default false,
  edited_at         timestamptz,
  status            public.comment_status not null default 'published',
  is_pinned         boolean not null default false,
  like_count        int not null default 0,
  report_count      int not null default 0,
  ai_toxicity_score float check (ai_toxicity_score between 0 and 1),
  ai_flags          jsonb,
  created_at        timestamptz not null default now()
);

create index idx_comments_article on public.comments(article_id, created_at desc);
create index idx_comments_author on public.comments(author_id);
create index idx_comments_parent on public.comments(parent_id);
create index idx_comments_status on public.comments(status) where status <> 'published';

-- =============================================================
-- TABLE: comment_votes
-- =============================================================
create table public.comment_votes (
  comment_id  uuid references public.comments(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create index idx_votes_user on public.comment_votes(user_id);

-- =============================================================
-- TABLE: comment_reports
-- =============================================================
create table public.comment_reports (
  id           uuid primary key default uuid_generate_v4(),
  comment_id   uuid not null references public.comments(id) on delete cascade,
  reporter_id  uuid not null references public.profiles(id),
  reason       public.report_reason not null,
  details      text,
  status       public.report_status not null default 'pending',
  reviewed_by  uuid references public.profiles(id),
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create index idx_reports_status on public.comment_reports(status, created_at desc);
create index idx_reports_comment on public.comment_reports(comment_id);

-- =============================================================
-- TABLE: moderation_logs (audit trail)
-- =============================================================
create table public.moderation_logs (
  id                uuid primary key default uuid_generate_v4(),
  moderator_id      uuid references public.profiles(id),
  target_user_id    uuid references public.profiles(id),
  target_comment_id uuid references public.comments(id),
  target_article_id uuid references public.articles(id),
  action            public.moderation_action not null,
  reason            text,
  metadata          jsonb,
  created_at        timestamptz not null default now()
);

create index idx_modlogs_action on public.moderation_logs(action, created_at desc);

-- =============================================================
-- TABLE: crawl_runs (monitoring)
-- =============================================================
create table public.crawl_runs (
  id              uuid primary key default uuid_generate_v4(),
  source_id       uuid references public.sources(id),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  articles_found  int default 0,
  articles_new    int default 0,
  errors          text[],
  status          text not null default 'running' check (status in ('running', 'success', 'failed'))
);

create index idx_crawls_source on public.crawl_runs(source_id, started_at desc);
create index idx_crawls_status on public.crawl_runs(status, started_at desc);

-- =============================================================
-- TABLE: takedown_requests (editor-facing form submissions)
-- =============================================================
create table public.takedown_requests (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null,
  organization  text,
  target_url    text not null,
  reason        text not null check (reason in ('copyright', 'gdpr', 'defamation', 'other')),
  message       text,
  status        text not null default 'pending' check (status in ('pending', 'in_review', 'resolved', 'rejected')),
  resolved_at   timestamptz,
  notes         text,
  ip_address    inet,
  user_agent    text,
  created_at    timestamptz not null default now()
);

create index idx_takedown_status on public.takedown_requests(status, created_at desc);

-- =============================================================
-- TABLE: api_rate_limit (server-side rate limiting bucket)
-- =============================================================
create table public.api_rate_limit (
  key         text primary key, -- e.g. "ip:1.2.3.4:articles" or "user:uuid:comments"
  count       int not null default 0,
  window_start timestamptz not null default now()
);

-- =============================================================
-- TRIGGERS
-- =============================================================

-- updated_at on articles
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_articles_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

-- comment_count on article
create or replace function public.update_article_comment_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.status = 'published' then
    update public.articles set comment_count = comment_count + 1 where id = new.article_id;
  elsif tg_op = 'UPDATE' and old.status = 'published' and new.status <> 'published' then
    update public.articles set comment_count = greatest(comment_count - 1, 0) where id = new.article_id;
  elsif tg_op = 'UPDATE' and old.status <> 'published' and new.status = 'published' then
    update public.articles set comment_count = comment_count + 1 where id = new.article_id;
  elsif tg_op = 'DELETE' and old.status = 'published' then
    update public.articles set comment_count = greatest(comment_count - 1, 0) where id = old.article_id;
  end if;
  return null;
end;
$$;

create trigger trg_article_comment_count
after insert or update or delete on public.comments
for each row execute function public.update_article_comment_count();

-- like_count on comment
create or replace function public.update_comment_like_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set like_count = like_count + 1 where id = new.comment_id;
  elsif tg_op = 'DELETE' then
    update public.comments set like_count = greatest(like_count - 1, 0) where id = old.comment_id;
  end if;
  return null;
end;
$$;

create trigger trg_comment_like_count
after insert or delete on public.comment_votes
for each row execute function public.update_comment_like_count();

-- report_count on comment + auto-hide at 3 reports
create or replace function public.update_comment_report_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.comments set report_count = report_count + 1 where id = new.comment_id;
    update public.comments
      set status = 'hidden'
      where id = new.comment_id
        and status = 'published'
        and report_count >= 3;
  end if;
  return null;
end;
$$;

create trigger trg_comment_report_count
after insert on public.comment_reports
for each row execute function public.update_comment_report_count();

-- Audit log when an article is taken down
create or replace function public.log_article_takedown()
returns trigger language plpgsql as $$
begin
  if (old.takedown_reason is null) and (new.takedown_reason is not null) then
    insert into public.moderation_logs (target_article_id, action, reason, metadata)
    values (new.id, 'article_taken_down', new.takedown_reason, jsonb_build_object('source_url', new.source_url));
    new.takedown_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_article_takedown
before update on public.articles
for each row execute function public.log_article_takedown();

-- Profile auto-create on auth.users insert (V1.5+ — kept here for completeness)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Don't insert if a profile already exists for this user (idempotent)
  insert into public.profiles (id, username)
  values (
    new.id,
    -- temporary username, user must finalize at /inscription/finaliser
    'u-' || substring(new.id::text from 1 for 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Hook the trigger only when auth is enabled (V1.5+). The migration writes it conditionally.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'auth') then
    drop trigger if exists trg_handle_new_user on auth.users;
    create trigger trg_handle_new_user
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end$$;
