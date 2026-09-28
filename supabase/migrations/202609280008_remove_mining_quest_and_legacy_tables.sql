-- Remove tables from the retired Mining Quest project and the first, replaced
-- version of the Onmyoji community feature.
--
-- The current site uses shikigami_reviews, shikigami_review_likes,
-- soul_recommendations, soul_recommendation_likes, official_review_reports,
-- skill_description_reports, admin_users and admin_moderation_log instead.

begin;

-- Mining Quest (retired)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.mining_logs cascade;
drop table if exists public.user_achievements cascade;
drop table if exists public.user_ore_icons cascade;
drop table if exists public.user_quests cascade;
drop table if exists public.user_profiles cascade;

-- Legacy community tables replaced by the current feature-specific tables.
drop table if exists public.recommendation_votes cascade;
drop table if exists public.review_votes cascade;
drop table if exists public.community_reports cascade;
drop table if exists public.community_profiles cascade;

commit;
