alter table public.shikigami_reviews
  alter column user_id drop not null,
  alter column rating drop not null,
  alter column content drop not null;

alter table public.shikigami_reviews
  add column if not exists reviewer_name text,
  add column if not exists verdict text,
  add column if not exists summary text,
  add column if not exists pve_short_score numeric(3,1),
  add column if not exists pve_short_note text,
  add column if not exists pve_long_score numeric(3,1),
  add column if not exists pve_long_note text,
  add column if not exists pvp_score numeric(3,1),
  add column if not exists pvp_note text,
  add column if not exists beginner_score numeric(3,1),
  add column if not exists beginner_note text,
  add column if not exists strengths text,
  add column if not exists weaknesses text,
  add column if not exists pve_review text,
  add column if not exists pvp_review text,
  add column if not exists soul_recommendations text;

alter table public.shikigami_reviews drop constraint if exists shikigami_reviews_shikigami_id_user_id_category_key;
alter table public.shikigami_reviews drop constraint if exists shikigami_reviews_rating_check;
alter table public.shikigami_reviews drop constraint if exists shikigami_reviews_content_check;
alter table public.shikigami_reviews add constraint shikigami_reviews_rating_check check (rating is null or rating between 1 and 5);
alter table public.shikigami_reviews add constraint community_review_name_length check (reviewer_name is null or char_length(reviewer_name) between 2 and 50);
alter table public.shikigami_reviews add constraint community_review_verdict_length check (verdict is null or char_length(verdict) between 3 and 1000);
alter table public.shikigami_reviews add constraint community_review_scores check (
  (pve_short_score is null or pve_short_score between 0 and 10) and
  (pve_long_score is null or pve_long_score between 0 and 10) and
  (pvp_score is null or pvp_score between 0 and 10) and
  (beginner_score is null or beginner_score between 0 and 10)
);

grant insert on public.shikigami_reviews to anon;
grant usage, select on all sequences in schema public to anon;

drop policy if exists "users submit own reviews" on public.shikigami_reviews;
create policy "visitors submit pending reviews" on public.shikigami_reviews
for insert to anon, authenticated
with check (
  status = 'pending'
  and reviewer_name is not null
  and char_length(trim(reviewer_name)) >= 2
  and (user_id is null or (select auth.uid()) = user_id)
);
