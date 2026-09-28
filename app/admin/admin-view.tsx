'use client';

import { Check, LogIn, LogOut, RefreshCw, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Kind = 'recommendation' | 'review' | 'report' | 'skill_report';
type Item = Record<string, unknown> & { id: number; status: string; created_at: string; shikigami_id: number };
type Data = { recommendations: Item[]; reviews: Item[]; reports: Item[]; skill_reports: Item[] };
type Name3 = { vi?: string; en?: string; zh?: string };

const emptyData: Data = { recommendations: [], reviews: [], reports: [], skill_reports: [] };
const errorMessage = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Có lỗi xảy ra.';

export default function AdminView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [data, setData] = useState<Data>(emptyData);
  const [tab, setTab] = useState<Kind>('recommendation');
  const [status, setStatus] = useState('pending');
  const [query, setQuery] = useState('');
  const [soulNames, setSoulNames] = useState<Record<number, string>>({});
  const [heroNames, setHeroNames] = useState<Record<number, string>>({});

  const load = async () => {
    if (!supabase) { setMessage('Supabase chưa được cấu hình.'); setLoading(false); return; }
    setLoading(true); setMessage('');
    const { data: sessionData } = await supabase.auth.getSession();
    const signedIn = Boolean(sessionData.session);
    setAuthenticated(signedIn);
    if (!signedIn) { setAuthorized(false); setLoading(false); return; }
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_community_admin');
    if (adminError || !isAdmin) { setAuthorized(false); setMessage(adminError?.message || 'Tài khoản này chưa được cấp quyền quản trị.'); setLoading(false); return; }
    setAuthorized(true);
    const { data: moderation, error } = await supabase.rpc('admin_moderation_data');
    if (error) setMessage(error.message); else setData({ ...emptyData, ...((moderation || {}) as Partial<Data>) });
    setLoading(false);
  };

  useEffect(() => {
    void Promise.all([
      fetch('/data/souls.json', { cache: 'no-store' }).then(r => r.json()).then(value => setSoulNames(Object.fromEntries((value.souls || []).map((item: { id: number; name: Name3 }) => [item.id, item.name.vi || item.name.en || String(item.id)])))).catch(() => {}),
      fetch('/data/shikigami_catalog.json', { cache: 'no-store' }).then(r => r.json()).then(value => setHeroNames(Object.fromEntries((value.heroes || []).map((item: { id: number; name: Name3 }) => [item.id, item.name.vi || item.name.en || String(item.id)])))).catch(() => {}),
    ]).then(load);
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async () => {
    if (!supabase || !email.trim() || !password) return;
    setBusy('login'); setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setMessage(error.message); else { setPassword(''); await load(); }
    setBusy('');
  };
  const loginWithDiscord = async () => {
    if (!supabase) return;
    setBusy('discord'); setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: `${window.location.origin}/admin` } });
    if (error) { setMessage(error.message); setBusy(''); }
  };
  const logout = async () => { if (supabase) await supabase.auth.signOut(); setData(emptyData); setAuthorized(false); setAuthenticated(false); };
  const moderate = async (kind: Kind, id: number, action: string) => {
    if (!supabase) return;
    if (action === 'delete' && !window.confirm('Xóa vĩnh viễn mục này?')) return;
    setBusy(`${kind}-${id}-${action}`); setMessage('');
    const { error } = await supabase.rpc('admin_moderate_item', { p_kind: kind, p_id: id, p_action: action });
    if (error) setMessage(error.message); else await load();
    setBusy('');
  };

  const items = tab === 'recommendation' ? data.recommendations : tab === 'review' ? data.reviews : tab === 'report' ? data.reports : data.skill_reports;
  const shown = useMemo(() => items.filter(item => (status === 'all' || item.status === status) && JSON.stringify(item).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [items, status, query]);

  if (!authenticated) return <main className="admin-shell"><section className="admin-login"><ShieldCheck /><span>QUẢN TRỊ CỘNG ĐỒNG</span><h1>Đăng nhập quản trị</h1><button className="admin-discord-login" disabled={busy === 'discord'} onClick={loginWithDiscord}><LogIn />{busy === 'discord' ? 'Đang chuyển hướng…' : 'Đăng nhập bằng Discord'}</button><div className="admin-login-divider"><span>hoặc dùng email</span></div><label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Mật khẩu<input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void login(); }} /></label><button disabled={busy === 'login'} onClick={login}><LogIn />{busy === 'login' ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>{message && <p>{message}</p>}<a href="/">← Trở về trang chính</a></section></main>;
  if (loading) return <main className="admin-shell"><div className="admin-loading"><span className="loader" />Đang tải dữ liệu quản trị…</div></main>;
  if (!authorized) return <main className="admin-shell"><section className="admin-login"><ShieldCheck /><h1>Chưa có quyền quản trị</h1><p>{message}</p><button onClick={logout}><LogOut />Đăng xuất</button></section></main>;

  return <main className="admin-shell"><header className="admin-header"><div><span>ONMYOJI COMMUNITY</span><h1>Bảng quản trị</h1></div><div><button onClick={load}><RefreshCw />Làm mới</button><button onClick={logout}><LogOut />Đăng xuất</button></div></header>
    <section className="admin-board"><nav className="admin-tabs"><button className={tab === 'recommendation' ? 'active' : ''} onClick={() => setTab('recommendation')}>Ngự Hồn <b>{data.recommendations.filter(x => x.status === 'pending').length}</b></button><button className={tab === 'review' ? 'active' : ''} onClick={() => setTab('review')}>Đánh giá <b>{data.reviews.filter(x => x.status === 'pending').length}</b></button><button className={tab === 'report' ? 'active' : ''} onClick={() => setTab('report')}>Báo cáo đánh giá <b>{data.reports.filter(x => x.status === 'pending').length}</b></button><button className={tab === 'skill_report' ? 'active' : ''} onClick={() => setTab('skill_report')}>Báo cáo kỹ năng <b>{data.skill_reports.filter(x => x.status === 'pending').length}</b></button></nav>
      <div className="admin-tools"><label><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tìm trong danh sách…" /></label><select value={status} onChange={e => setStatus(e.target.value)}><option value="pending">Chờ xử lý</option><option value="approved">Đã duyệt</option><option value="rejected">Đã từ chối</option><option value="hidden">Đã ẩn</option><option value="resolved">Đã xử lý</option><option value="dismissed">Đã bỏ qua</option><option value="all">Tất cả</option></select></div>
      {message && <p className="admin-message">{message}</p>}
      <div className="admin-list">{shown.length === 0 ? <p className="admin-empty">Không có mục nào.</p> : shown.map(item => <article key={`${tab}-${item.id}`}>
        <div className="admin-item-heading"><div><span>#{item.id} · {heroNames[item.shikigami_id] || `Thức thần ${item.shikigami_id}`}</span><strong>{tab === 'recommendation' ? (Number(item.primary_soul_id) ? soulNames[Number(item.primary_soul_id)] || `Ngự ${item.primary_soul_id}` : 'Ngự Mix (Tán Kiện)') : tab === 'review' ? String(item.reviewer_name || 'Ẩn danh') : tab === 'skill_report' ? String(item.skill_name || `Kỹ năng ${item.skill_id}`) : 'Báo cáo đánh giá gốc'}</strong></div><time>{new Date(item.created_at).toLocaleString('vi-VN')}</time></div>
        {tab === 'recommendation' && <div className="admin-item-copy"><p><b>Chế độ:</b> {String(item.mode || 'basic').toUpperCase()} · <b>Bộ 2:</b> {item.secondary_soul_id ? soulNames[Number(item.secondary_soul_id)] : String(item.secondary_bonus || 'Không chọn')}</p><p><b>Vị trí 2–4–6:</b> {String(item.slot_2_stat || '—')} · {String(item.slot_4_stat || '—')} · {String(item.slot_6_stat || '—')}</p><p><b>Tốc đề xuất:</b> {item.speed_min ? `${item.speed_min} < Tốc${item.speed_max ? ` < ${item.speed_max}` : ''}` : '—'}</p><p>{String(item.note || '')}</p>{Boolean(item.recommendation_note) && <p><b>Ghi chú:</b> {String(item.recommendation_note)}</p>}</div>}
        {tab === 'review' && <div className="admin-item-copy"><h3>{String(item.verdict || '')}</h3>{Boolean(item.summary) && <p>{String(item.summary)}</p>}<p>{String(item.strengths || '')}</p><p>{String(item.weaknesses || '')}</p></div>}
        {(tab === 'report' || tab === 'skill_report') && <div className="admin-item-copy">{tab === 'skill_report' && <p><b>Mã kỹ năng:</b> {String(item.skill_id || '—')}</p>}<p>{String(item.note || '')}</p></div>}
        <div className="admin-actions">{tab !== 'report' && tab !== 'skill_report' ? <><button className="approve" disabled={busy.startsWith(`${tab}-${item.id}`)} onClick={() => moderate(tab, item.id, 'approved')}><Check />Duyệt</button><button className="reject" disabled={busy.startsWith(`${tab}-${item.id}`)} onClick={() => moderate(tab, item.id, 'rejected')}><X />Từ chối</button></> : <><button className="approve" disabled={busy.startsWith(`${tab}-${item.id}`)} onClick={() => moderate(tab, item.id, 'resolved')}><Check />Đã xử lý</button><button className="reject" disabled={busy.startsWith(`${tab}-${item.id}`)} onClick={() => moderate(tab, item.id, 'dismissed')}><X />Bỏ qua</button></>}<button className="delete" disabled={busy.startsWith(`${tab}-${item.id}`)} onClick={() => moderate(tab, item.id, 'delete')}><Trash2 />Xóa</button></div>
      </article>)}</div>
    </section>
  </main>;
}
