import { supabase } from './supabase';

export type CommunityReview = {
  id: number;
  shikigami_id: number;
  user_id: string | null;
  category: 'overall' | 'pve' | 'pvp' | 'beginner';
  rating: number | null;
  content: string | null;
  reviewer_name: string;
  verdict: string | null;
  summary: string | null;
  pve_short_score: number | null;
  pve_short_note: string | null;
  pve_long_score: number | null;
  pve_long_note: string | null;
  pvp_score: number | null;
  pvp_note: string | null;
  beginner_score: number | null;
  beginner_note: string | null;
  strengths: string | null;
  weaknesses: string | null;
  pve_review: string | null;
  pvp_review: string | null;
  soul_recommendations: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  created_at: string;
  updated_at: string;
  like_count?: number;
  viewer_liked?: boolean;
};

export type CommunityReviewInput = Omit<CommunityReview, 'id' | 'user_id' | 'rating' | 'content' | 'category' | 'status' | 'created_at' | 'updated_at'>;

export type SoulRecommendation = {
  id: number;
  shikigami_id: number;
  user_id: string;
  primary_soul_id: number;
  secondary_soul_id: number | null;
  mode: 'basic' | 'pvp';
  secondary_bonus: string | null;
  requires_100_crit: boolean;
  slot_2_stat: string | null;
  slot_4_stat: string | null;
  slot_6_stat: string | null;
  speed_min: number | null;
  speed_max: number | null;
  recommendation_note: string | null;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  created_at: string;
  updated_at: string;
};

export type SoulRecommendationInput = {
  shikigami_id: number;
  mode: 'basic' | 'pvp';
  primary_soul_id: number;
  secondary_soul_id: number | null;
  secondary_bonus: string | null;
  slot_2_stat: string;
  slot_4_stat: string;
  slot_6_stat: string;
  speed_min: number;
  speed_max: number | null;
  recommendation_note: string | null;
  requires_100_crit: boolean;
  note: string | null;
};

export type SoulRecommendationLike = {
  primary_soul_id: number;
  like_count: number;
  viewer_liked: boolean;
};

export async function getApprovedReviews(shikigamiId: number) {
  if (!supabase) return [] as CommunityReview[];
  const { data, error } = await supabase.rpc('get_approved_shikigami_reviews', { p_shikigami_id: shikigamiId });
  if (error) throw error;
  return (data ?? []).map((item: CommunityReview) => ({ ...item, like_count: Number(item.like_count || 0) })) as CommunityReview[];
}

export async function likeCommunityReview(reviewId: number) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await supabase.rpc('like_shikigami_review', { p_review_id: reviewId });
  if (error) throw error;
  return Boolean(data);
}

export async function reportOfficialReview(shikigamiId: number, note: string) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await supabase.rpc('report_official_shikigami_review', {
    p_shikigami_id: shikigamiId,
    p_note: note.trim(),
  });
  if (error) throw error;
  return Boolean(data);
}

export async function reportSkillDescription(shikigamiId: number, skillId: number | string, skillName: string, note: string) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await supabase.rpc('report_skill_description', {
    p_shikigami_id: shikigamiId,
    p_skill_id: String(skillId),
    p_skill_name: skillName.trim(),
    p_note: note.trim(),
  });
  if (error) throw error;
  return Boolean(data);
}

export async function submitCommunityReview(input: CommunityReviewInput) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('shikigami_reviews').insert({
    ...input,
    user_id: user?.id ?? null,
    category: 'overall',
    rating: null,
    content: input.summary || input.verdict || '',
    status: 'pending',
  });
  if (error) throw error;
}

export async function getApprovedSoulRecommendations(shikigamiId: number) {
  if (!supabase) return [] as SoulRecommendation[];
  const { data, error } = await supabase
    .from('soul_recommendations')
    .select('*')
    .eq('shikigami_id', shikigamiId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SoulRecommendation[];
}

export async function submitSoulRecommendation(input: SoulRecommendationInput) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('soul_recommendations').insert({
    ...input,
    user_id: user?.id ?? null,
    status: 'pending',
  });
  if (error) throw error;
}

export async function getSoulRecommendationLikes(shikigamiId: number, mode: 'basic' | 'pvp') {
  if (!supabase) return [] as SoulRecommendationLike[];
  const { data, error } = await supabase.rpc('get_soul_recommendation_likes', { p_shikigami_id: shikigamiId, p_mode: mode });
  if (error) throw error;
  return (data ?? []).map((item: SoulRecommendationLike) => ({ ...item, like_count: Number(item.like_count) })) as SoulRecommendationLike[];
}

export async function likeSoulRecommendation(shikigamiId: number, mode: 'basic' | 'pvp', primarySoulId: number) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.');
  const { data, error } = await supabase.rpc('like_soul_recommendation', { p_shikigami_id: shikigamiId, p_mode: mode, p_primary_soul_id: primarySoulId });
  if (error) throw error;
  return Boolean(data);
}
