alter table public.soul_recommendations
  alter column primary_soul_id drop not null;

drop index if exists public.soul_recommendations_user_build_idx;
create unique index soul_recommendations_user_build_idx
  on public.soul_recommendations (
    shikigami_id,
    user_id,
    mode,
    coalesce(primary_soul_id, 0),
    coalesce(secondary_soul_id, 0),
    coalesce(secondary_bonus, '')
  );

create or replace function public.like_soul_recommendation(
  p_shikigami_id integer,
  p_mode text,
  p_primary_soul_id integer
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare inserted_count integer;
begin
  if p_mode not in ('basic', 'pvp') then raise exception 'Chế độ không hợp lệ.'; end if;
  if not exists (
    select 1 from public.soul_recommendations
    where shikigami_id = p_shikigami_id
      and mode = p_mode
      and coalesce(primary_soul_id, 0) = p_primary_soul_id
      and status = 'approved'
  ) then raise exception 'Đề xuất chưa được duyệt.'; end if;

  insert into public.soul_recommendation_likes (shikigami_id, mode, primary_soul_id, voter_hash)
  values (p_shikigami_id, p_mode, p_primary_soul_id, public.soul_like_visitor_hash())
  on conflict do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

grant execute on function public.like_soul_recommendation(integer, text, integer) to anon, authenticated;
