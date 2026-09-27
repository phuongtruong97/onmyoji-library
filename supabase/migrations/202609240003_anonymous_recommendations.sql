alter table public.soul_recommendations
  alter column user_id drop not null;

drop index if exists public.soul_recommendations_user_build_idx;

create index if not exists soul_recommendations_pending_review_idx
  on public.soul_recommendations (status, created_at desc);

grant insert on public.soul_recommendations to anon;
grant usage, select on all sequences in schema public to anon;

drop policy if exists "users submit own recommendations" on public.soul_recommendations;
create policy "visitors submit pending recommendations" on public.soul_recommendations
for insert to anon, authenticated
with check (
  status = 'pending'
  and (user_id is null or (select auth.uid()) = user_id)
);
