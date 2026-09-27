'use client';

import { ExternalLink, Flag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import CommunityReviewPanel from './community-review-panel';
import { reportOfficialReview } from '@/lib/community';

type Language = 'vi' | 'en' | 'zh';
type Rating = { key: string; label: string; score: number; note?: string };
type ReviewSection = { title: string; paragraphs: string[] };
type ReviewSource = { title: string; publisher: string; url: string; publishedAt?: string; usedFor: string };
type ReviewData = {
  shikigamiId: number;
  status: 'draft' | 'reviewed' | 'verified';
  updatedAt: string;
  confidence: 'low' | 'medium' | 'high';
  verdict: string;
  summary: string;
  ratings: Rating[];
  sections: ReviewSection[];
  strengths: string[];
  weaknesses: string[];
  sources: ReviewSource[];
};

const copy = {
  vi: { empty: 'Chưa có bài đánh giá đã đối chiếu nguồn cho thức thần này.', source: 'Nguồn đã đối chiếu', updated: 'Cập nhật', confidence: 'Độ tin cậy', high: 'Cao', medium: 'Trung bình', low: 'Thấp', strength: 'Điểm mạnh', weakness: 'Hạn chế' },
  en: { empty: 'No source-checked review is available for this shikigami yet.', source: 'Checked sources', updated: 'Updated', confidence: 'Confidence', high: 'High', medium: 'Medium', low: 'Low', strength: 'Strengths', weakness: 'Limitations' },
  zh: { empty: '该式神暂无经过来源核对的评价。', source: '已核对来源', updated: '更新', confidence: '可信度', high: '高', medium: '中', low: '低', strength: '优点', weakness: '局限' },
};

function ReviewText({ text }: { text: string }) {
  const pattern = /(\[[^\]]+\]|《[^》]+》|\{\+[^}]+\}|\{[-−][^}]+\}|〈[^〉]+〉)/g;
  return <>{String(text || '').split(pattern).filter(Boolean).map((part, index) => {
    if (/^\[[^\]]+\]$/.test(part)) return <span className="review-token skill" key={index}>{part}</span>;
    if (/^《[^》]+》$/.test(part)) return <span className="review-token shikigami" key={index}>{part.slice(1, -1)}</span>;
    if (/^\{\+[^}]+\}$/.test(part)) return <span className="review-token buff" key={index}>{part.slice(2, -1)}</span>;
    if (/^\{[-−][^}]+\}$/.test(part)) return <span className="review-token debuff" key={index}>{part.slice(2, -1)}</span>;
    if (/^〈[^〉]+〉$/.test(part)) return <span className="review-token soul" key={index}>{part.slice(1, -1)}</span>;
    return <span key={index}>{part}</span>;
  })}</>;
}

export default function ShikigamiReview({ shikigamiId, language }: { shikigamiId: number; language: Language }) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const [reporting, setReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const t = copy[language];

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/data/reviews/${shikigamiId}.json`, { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { setReview(data); setLoading(false); })
      .catch(error => { if (error?.name !== 'AbortError') { setReview(null); setLoading(false); } });
    return () => controller.abort();
  }, [shikigamiId]);

  const submitReport = async () => {
    if (reporting || !reportNote.trim()) return;
    setReporting(true); setReportMessage('');
    try {
      await reportOfficialReview(shikigamiId, reportNote);
      setReportNote(''); setReportMessage('Đã gửi báo cáo. Cảm ơn bạn.');
    } catch (error) { setReportMessage(error instanceof Error ? error.message : 'Không thể gửi báo cáo.'); }
    finally { setReporting(false); }
  };

  return <><button className="review-report-button" onClick={() => { setReportOpen(true); setReportMessage(''); }}><Flag /> Báo cáo</button>{loading ? <div className="review-empty"><span className="loader" /></div> : !review ? <div className="review-empty"><p>{t.empty}</p></div> : <div className="review-content">
    <section className="review-hero">
      <div className="review-meta"><div className="review-confidence-wrap"><span className={`review-confidence ${review.confidence}`}>{t.confidence}: {t[review.confidence]}</span><small><span>Đánh giá được tổng hợp bởi AI, độ tin cậy thấp.</span><span>Xin hãy tham khảo ý kiến từ cộng đồng.</span></small></div><time>{t.updated}: {review.updatedAt}</time></div>
      <h3>{review.verdict}</h3>
      <p><ReviewText text={review.summary} /></p>
    </section>
    <section className="review-ratings" aria-label="Điểm đánh giá">{review.ratings.map(item => <article key={item.key}>
      <div><b>{item.label}</b><strong>{item.score}<small>/10</small></strong></div>
      <span><i style={{ width: `${Math.max(0, Math.min(10, item.score)) * 10}%` }} /></span>
      {item.note && <p><ReviewText text={item.note} /></p>}
    </article>)}</section>
    <div className="review-columns">
      <section><h4>{t.strength}</h4><ul>{review.strengths.map((item, index) => <li key={index}><ReviewText text={item} /></li>)}</ul></section>
      <section className="weakness"><h4>{t.weakness}</h4><ul>{review.weaknesses.map((item, index) => <li key={index}><ReviewText text={item} /></li>)}</ul></section>
    </div>
    {review.sections.map((section, index) => <section className="review-section" key={`${section.title}-${index}`}><h4>{section.title}</h4>{section.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}><ReviewText text={paragraph} /></p>)}</section>)}
    <section className="review-sources"><h4>{t.source}</h4>{review.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`}><span><b>{source.title}</b><small>{source.publisher}{source.publishedAt ? ` · ${source.publishedAt}` : ''} — {source.usedFor}</small></span><ExternalLink /></a>)}</section>
  </div>}{reportOpen && <div className="review-report-popover" role="dialog" aria-modal="true" aria-label="Báo cáo đánh giá"><header><strong>Báo cáo đánh giá</strong><button onClick={() => setReportOpen(false)} aria-label="Đóng"><X /></button></header><textarea maxLength={300} value={reportNote} onChange={event => setReportNote(event.target.value)} placeholder="Nhập ghi chú ngắn…" autoFocus /><div className="review-report-footer"><small>{reportNote.length}/300</small><button disabled={reporting || !reportNote.trim()} onClick={submitReport}>{reporting ? 'Đang gửi…' : 'Gửi báo cáo'}</button></div>{reportMessage && <p>{reportMessage}</p>}</div>}<CommunityReviewPanel shikigamiId={shikigamiId} language={language} /></>;
}
