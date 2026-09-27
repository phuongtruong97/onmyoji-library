'use client';

import { Flag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportSkillDescription } from '@/lib/community';

type Props = { shikigamiId: number; skillId: number | string; skillName: string };

export default function SkillReportButton({ shikigamiId, skillId, skillName }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { setOpen(false); setNote(''); setMessage(''); }, [shikigamiId, skillId]);

  const submit = async () => {
    if (sending || !note.trim()) return;
    setSending(true); setMessage('');
    try {
      await reportSkillDescription(shikigamiId, skillId, skillName, note);
      setMessage('Đã gửi báo cáo. Cảm ơn bạn!'); setNote('');
    } catch (error) {
      setMessage(error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Không thể gửi báo cáo.');
    } finally { setSending(false); }
  };

  return <>
    <button className="review-report-button skill-description-report-button" onClick={() => { setOpen(true); setMessage(''); }}><Flag /> Báo cáo</button>
    {open && <div className="review-report-popover skill-report-popover" role="dialog" aria-modal="true" aria-label="Báo cáo kỹ năng">
      <header><strong>Báo cáo</strong><button onClick={() => setOpen(false)} aria-label="Đóng"><X /></button></header>
      <textarea maxLength={300} value={note} onChange={event => setNote(event.target.value)} placeholder="Nhập ghi chú ngắn…" autoFocus />
      <div className="review-report-footer"><small>{note.length}/300</small><button disabled={sending || !note.trim()} onClick={submit}>{sending ? 'Đang gửi…' : 'Gửi báo cáo'}</button></div>
      {message && <p>{message}</p>}
    </div>}
  </>;
}
