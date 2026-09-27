'use client';

import { ChevronDown, ChevronUp, PenLine, ThumbsUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CommunityReview, getApprovedReviews, likeCommunityReview, submitCommunityReview } from '@/lib/community';

type Language = 'vi' | 'en' | 'zh';
type FormState = {
  reviewer_name: string; verdict: string; summary: string;
  pve_short_score: string; pve_short_note: string; pve_long_score: string; pve_long_note: string;
  pvp_score: string; pvp_note: string; beginner_score: string; beginner_note: string;
  strengths: string; weaknesses: string; pve_review: string; pvp_review: string; soul_recommendations: string;
};

const emptyForm: FormState = { reviewer_name: '', verdict: '', summary: '', pve_short_score: '', pve_short_note: '', pve_long_score: '', pve_long_note: '', pvp_score: '', pvp_note: '', beginner_score: '', beginner_note: '', strengths: '', weaknesses: '', pve_review: '', pvp_review: '', soul_recommendations: '' };
const score = (value: string) => value === '' ? null : Number(value);

export default function CommunityReviewPanel({ shikigamiId, language }: { shikigamiId: number; language: Language }) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [reviews, setReviews] = useState<CommunityReview[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [liking, setLiking] = useState<number | null>(null);
  const load = () => getApprovedReviews(shikigamiId).then(setReviews).catch(() => setReviews([]));
  useEffect(() => { load(); }, [shikigamiId]);
  const set = (key: keyof FormState, value: string) => setForm(current => ({ ...current, [key]: value }));
  const submit = async () => {
    if (submitting || form.reviewer_name.trim().length < 2 || !form.verdict.trim()) return;
    setSubmitting(true); setMessage('');
    try {
      await submitCommunityReview({ shikigami_id: shikigamiId, reviewer_name: form.reviewer_name.trim(), verdict: form.verdict.trim(), summary: form.summary.trim() || null, pve_short_score: score(form.pve_short_score), pve_short_note: form.pve_short_note.trim() || null, pve_long_score: score(form.pve_long_score), pve_long_note: form.pve_long_note.trim() || null, pvp_score: score(form.pvp_score), pvp_note: form.pvp_note.trim() || null, beginner_score: score(form.beginner_score), beginner_note: form.beginner_note.trim() || null, strengths: form.strengths.trim() || null, weaknesses: form.weaknesses.trim() || null, pve_review: form.pve_review.trim() || null, pvp_review: form.pvp_review.trim() || null, soul_recommendations: form.soul_recommendations.trim() || null });
      setForm(emptyForm); setMessage('Đã gửi đánh giá, đang chờ duyệt.'); setFormOpen(false); load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể gửi đánh giá.'); }
    finally { setSubmitting(false); }
  };

  return <>
    <button className={`community-review-handle ${open ? 'open' : ''}`} onClick={() => { setOpen(value => !value); setFormOpen(false); }} aria-expanded={open}>{open ? <ChevronDown /> : <ChevronUp />}<span>{language === 'vi' ? 'Đánh giá từ cộng đồng' : language === 'en' ? 'Community reviews' : '社区评价'}</span></button>
    {open && <section className="community-review-overlay">
      <header><div><span>COMMUNITY</span><h3>Đánh giá từ cộng đồng</h3></div><button onClick={() => setOpen(false)} aria-label="Đóng"><X /></button></header>
      <div className="community-review-toolbar"><span>{reviews.length} đánh giá đã duyệt</span><button onClick={() => setFormOpen(true)}><PenLine /> Gửi đánh giá của bạn</button></div>
      <div className="community-review-list">{reviews.length === 0 ? <p className="community-review-empty">Chưa có đánh giá cộng đồng đã được duyệt.</p> : reviews.map(review => {
        const isExpanded = expanded === review.id;
        return <article className={isExpanded ? 'expanded' : ''} key={review.id}>
          <button className="community-review-summary" onClick={() => setExpanded(isExpanded ? null : review.id)} aria-expanded={isExpanded}>
            <span><strong>{review.reviewer_name || 'Ẩn danh'}</strong><small>{review.verdict}</small></span>
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </button>
          <div className="community-review-like-row"><time>{new Date(review.created_at).toLocaleDateString('vi-VN')}</time><span>{review.like_count || 0}</span><button className={`recommend-like ${review.viewer_liked ? 'liked' : ''}`} disabled={review.viewer_liked || liking === review.id} onClick={async () => { setLiking(review.id); try { await likeCommunityReview(review.id); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Không thể thích đánh giá.'); } finally { setLiking(null); } }} aria-label={review.viewer_liked ? 'Đã thích' : 'Thích đánh giá'} title={review.viewer_liked ? 'Bạn đã thích đánh giá này' : 'Thích đánh giá'}><ThumbsUp /></button></div>
          {isExpanded && <div className="community-review-details">
            {review.summary && <p>{review.summary}</p>}
            <div className="community-review-scores">{[['PvE ngắn', review.pve_short_score, review.pve_short_note], ['PvE dài', review.pve_long_score, review.pve_long_note], ['PvP', review.pvp_score, review.pvp_note], ['Người mới', review.beginner_score, review.beginner_note]].map(([label, value, note]) => (value !== null || note) && <span key={String(label)}><b>{label}</b>{value !== null && <strong>{String(value)}/10</strong>}{note && <small>{String(note)}</small>}</span>)}</div>
            {(review.strengths || review.weaknesses) && <div className="community-review-pros">{review.strengths && <section><b>Điểm mạnh</b><p>{review.strengths}</p></section>}{review.weaknesses && <section><b>Điểm yếu</b><p>{review.weaknesses}</p></section>}</div>}
            {review.pve_review && <section className="community-review-section"><b>Đánh giá PvE</b><p>{review.pve_review}</p></section>}
            {review.pvp_review && <section className="community-review-section"><b>Đánh giá PvP</b><p>{review.pvp_review}</p></section>}
            {review.soul_recommendations && <div className="community-review-souls"><b>Ngự Hồn đề xuất</b><p>{review.soul_recommendations}</p></div>}
          </div>}
        </article>;
      })}</div>
      {message && <p className="community-review-message">{message}</p>}
      {formOpen && <div className="community-review-form-overlay"><form onSubmit={event => { event.preventDefault(); submit(); }}>
        <header><h3>Gửi đánh giá của bạn</h3><button type="button" onClick={() => setFormOpen(false)}><X /></button></header>
        <label className="required-field"><span>Tên người đánh giá (*)</span><input required minLength={2} maxLength={50} value={form.reviewer_name} onChange={event => set('reviewer_name', event.target.value)} /></label>
        <label className="required-field"><span>Đánh giá chung (*)</span><input required minLength={3} value={form.verdict} onChange={event => set('verdict', event.target.value)} placeholder="Nhận định ngắn gọn về thức thần" /></label>
        <label>Tóm tắt<textarea value={form.summary} onChange={event => set('summary', event.target.value)} /></label>
        <div className="community-score-fields">{([['pve_short', 'PvE ngắn'], ['pve_long', 'PvE dài'], ['pvp', 'PvP'], ['beginner', 'Người mới']] as const).map(([key, label]) => <section key={key}><label>{label} — điểm<input type="number" min="0" max="10" step="0.5" value={form[`${key}_score`]} onChange={event => set(`${key}_score`, event.target.value)} /></label><label>Ghi chú<textarea value={form[`${key}_note`]} onChange={event => set(`${key}_note`, event.target.value)} /></label></section>)}</div>
        <div className="community-text-columns"><label>Điểm mạnh<textarea value={form.strengths} onChange={event => set('strengths', event.target.value)} placeholder="Mỗi ý một dòng" /></label><label>Điểm yếu<textarea value={form.weaknesses} onChange={event => set('weaknesses', event.target.value)} placeholder="Mỗi ý một dòng" /></label></div>
        <label>Đánh giá PvE<textarea value={form.pve_review} onChange={event => set('pve_review', event.target.value)} /></label>
        <label>Đánh giá PvP<textarea value={form.pvp_review} onChange={event => set('pvp_review', event.target.value)} /></label>
        <label>Ngự Hồn đề xuất<textarea value={form.soul_recommendations} onChange={event => set('soul_recommendations', event.target.value)} placeholder="Bộ Ngự Hồn, chỉ số 2–4–6 và yêu cầu chỉ số" /></label>
        <button className="community-review-submit" disabled={submitting || form.reviewer_name.trim().length < 2 || !form.verdict.trim()}>{submitting ? 'Đang gửi…' : 'Gửi đánh giá'}</button>
      </form></div>}
    </section>}
  </>;
}
