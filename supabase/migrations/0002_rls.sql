-- AUPA AB — Row Level Security policies.
-- Following external review point #7: exhaustive coverage, table by table.
-- Convention: every table is opted-in (alter table ... enable row level security)
-- and gets explicit select/insert/update/delete policies. Default = denied.

-- =============================================================
-- sources : public read for active sources only ; only admins write
-- =============================================================
alter table public.sources enable row level security;

create policy "sources_select_active"
  on public.sources for select
  using (is_active = true);

create policy "sources_admin_all"
  on public.sources for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================================
-- articles : public read via articles_public view ; writes via service-role only.
-- We still need a SELECT policy on the underlying table because the view
-- inherits RLS from the base table.
-- =============================================================
alter table public.articles enable row level security;

create policy "articles_select_public"
  on public.articles for select
  using (is_published = true and takedown_reason is null);

-- Moderators can see hidden / taken-down articles for review
create policy "articles_select_moderators"
  on public.articles for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- Inserts come from the crawler (service role) — no policy needed.
-- Updates by moderators (takedown, pin)
create policy "articles_update_moderators"
  on public.articles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- =============================================================
-- domain_blocklist : admin only
-- =============================================================
alter table public.domain_blocklist enable row level security;

create policy "blocklist_admin_all"
  on public.domain_blocklist for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================================
-- profiles : public read ; self update ; moderators can read banned flag
-- =============================================================
alter table public.profiles enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_moderators_update_ban"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- Note: profiles_select_all + profiles_moderators_update_ban means a regular user
-- can see usernames/badges but cannot modify another profile.

-- =============================================================
-- saved_articles : strictly private to the user
-- =============================================================
alter table public.saved_articles enable row level security;

create policy "saved_select_self"
  on public.saved_articles for select
  using (auth.uid() = user_id);

create policy "saved_insert_self"
  on public.saved_articles for insert
  with check (auth.uid() = user_id);

create policy "saved_delete_self"
  on public.saved_articles for delete
  using (auth.uid() = user_id);

-- =============================================================
-- comments : public read if published or own ; auth insert ; self/mod update
-- =============================================================
alter table public.comments enable row level security;

create policy "comments_select_published_or_own"
  on public.comments for select
  using (
    status = 'published'
    or auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

create policy "comments_insert_authenticated"
  on public.comments for insert
  with check (
    auth.uid() = author_id
    and not exists (select 1 from public.profiles where id = auth.uid() and is_banned = true)
  );

create policy "comments_update_self"
  on public.comments for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "comments_update_moderators"
  on public.comments for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

create policy "comments_delete_self"
  on public.comments for delete
  using (auth.uid() = author_id);

create policy "comments_delete_moderators"
  on public.comments for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- =============================================================
-- comment_votes : public read aggregate via like_count ; self toggle
-- =============================================================
alter table public.comment_votes enable row level security;

create policy "votes_select_all"
  on public.comment_votes for select
  using (true);  -- public; UI can show who liked if needed

create policy "votes_insert_self"
  on public.comment_votes for insert
  with check (auth.uid() = user_id);

create policy "votes_delete_self"
  on public.comment_votes for delete
  using (auth.uid() = user_id);

-- =============================================================
-- comment_reports : reporter self insert ; moderators read/update
-- =============================================================
alter table public.comment_reports enable row level security;

create policy "reports_insert_self"
  on public.comment_reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports_select_self"
  on public.comment_reports for select
  using (auth.uid() = reporter_id);

create policy "reports_moderators_all"
  on public.comment_reports for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  )
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- =============================================================
-- moderation_logs : moderators read ; service-role only writes
-- =============================================================
alter table public.moderation_logs enable row level security;

create policy "modlogs_select_moderators"
  on public.moderation_logs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- =============================================================
-- crawl_runs : admin read only
-- =============================================================
alter table public.crawl_runs enable row level security;

create policy "crawls_select_admin"
  on public.crawl_runs for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- =============================================================
-- takedown_requests : public insert (form) ; admin read
-- =============================================================
alter table public.takedown_requests enable row level security;

create policy "takedown_insert_anyone"
  on public.takedown_requests for insert
  with check (true);  -- form is publicly exposed; rate-limited at API layer

create policy "takedown_select_admin"
  on public.takedown_requests for select
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- =============================================================
-- api_rate_limit : service-role only (no public access)
-- =============================================================
alter table public.api_rate_limit enable row level security;
-- No policies -> no access for anon/authenticated by default. service_role bypasses RLS.

-- =============================================================
-- Grant SELECT on the public view to anon/authenticated.
-- Views don't have their own RLS; they inherit base-table policies.
-- =============================================================
grant select on public.articles_public to anon, authenticated;
