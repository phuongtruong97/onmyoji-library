alter table public.soul_recommendations
  add column if not exists mode text not null default 'basic'
    check (mode in ('basic', 'pvp')),
  add column if not exists secondary_bonus text
    check (secondary_bonus is null or secondary_bonus in ('ATK', 'HP', 'DEF', 'CRIT', 'HIT', 'RES', 'CRIT DMG')),
  add column if not exists requires_100_crit boolean not null default false;

do $$
declare old_unique text;
begin
  select conname into old_unique
  from pg_constraint
  where conrelid = 'public.soul_recommendations'::regclass
    and contype = 'u'
    and conname like 'soul_recommendations_shikigami_id_user_id_primary_soul_id%'
  limit 1;
  if old_unique is not null then
    execute format('alter table public.soul_recommendations drop constraint %I', old_unique);
  end if;
end;
$$;

create unique index if not exists soul_recommendations_user_build_idx
  on public.soul_recommendations (
    shikigami_id,
    user_id,
    mode,
    primary_soul_id,
    coalesce(secondary_soul_id, 0),
    coalesce(secondary_bonus, '')
  );
