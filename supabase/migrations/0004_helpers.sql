-- AUPA AB — RPC helpers used by the API.

-- =============================================================
-- increment_view_count : atomic +1 on articles.view_count
-- =============================================================
create or replace function public.increment_view_count(p_article_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.articles
  set view_count = view_count + 1
  where id = p_article_id
    and is_published = true
    and takedown_reason is null
$$;

grant execute on function public.increment_view_count(uuid) to anon, authenticated;
