alter table public.soul_recommendations
  add column if not exists speed_min smallint,
  add column if not exists speed_max smallint,
  add column if not exists recommendation_note text;

alter table public.soul_recommendations
  drop constraint if exists soul_recommendations_speed_range_check;

alter table public.soul_recommendations
  add constraint soul_recommendations_speed_range_check check (
    speed_min is null
    or speed_max is null
    or (speed_min >= 0 and speed_max > speed_min and speed_max <= 500)
  );
