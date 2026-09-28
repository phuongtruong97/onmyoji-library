'use client';

import { Check, ChevronDown, ChevronUp, MessageSquareText, Search, ThumbsUp, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { getApprovedSoulRecommendations, getSoulRecommendationLikes, likeSoulRecommendation, SoulRecommendation, SoulRecommendationLike, submitSoulRecommendation } from '@/lib/community';

type Language = 'vi' | 'en' | 'zh';
type Soul = {
  id: number;
  category: string;
  name: Record<Language, string>;
  set2: Record<Language, string>;
  set4: Record<Language, string>;
  assets: { iconFile: string };
};

type Build = {
  set4: string;
  set2: string;
  indicator: string;
  slot2: string[];
  slot4: string[];
  slot6: string[];
  speedMin: number;
  speedMax: number;
  recommendationNote: string;
  fullCrit: boolean;
};

const emptyBuild = (baseSpeed: number): Build => ({
  set4: '', set2: '', indicator: 'Damage',
  slot2: ['ATK%'], slot4: ['ATK%'], slot6: ['CRIT', 'CRIT DMG'], fullCrit: false,
  speedMin: baseSpeed, speedMax: baseSpeed + 170, recommendationNote: '',
});

const labels = {
  vi: { mine: 'Đề xuất của bạn', set4: 'Ngự Hồn bộ 4', set2: 'Ngự Hồn bộ 2', none: 'Để trống', soul: 'Chọn Ngự Hồn', stat: 'Chọn chỉ số', stats: 'Chỉ số chính vị trí 2 · 4 · 6', crit: 'Yêu cầu đủ 100% Chí mạng', community: 'Đề xuất cộng đồng', empty: 'Chưa có đề xuất.', pvp: 'Đề xuất Ngự Hồn PvP', basic: 'Đề xuất Ngự Hồn PvE', save: 'Gửi đề xuất' },
  en: { mine: 'Your recommendation', set4: '4-piece Soul', set2: 'Optional 2-piece', none: 'Leave empty', soul: 'Choose Soul', stat: 'Choose bonus stat', stats: 'Main stats for slots 2 · 4 · 6', crit: 'Requires 100% Crit', community: 'Community recommendations', empty: 'No recommendations yet.', pvp: 'PvP Soul recommendation', basic: 'Basic Soul recommendation', save: 'Submit recommendation' },
  zh: { mine: '你的推荐', set4: '四件套御魂', set2: '可选两件套', none: '留空', soul: '选择御魂', stat: '选择属性', stats: '二、四、六号位主属性', crit: '需要满暴击', community: '社区推荐', empty: '暂无推荐。', pvp: '斗技御魂推荐', basic: '基础御魂推荐', save: '提交推荐' },
};

const bonusStats = ['ATK', 'HP', 'DEF', 'CRIT', 'HIT', 'RES', 'CRIT DMG'];
const slotOptions: Record<'slot2' | 'slot4' | 'slot6', string[]> = {
  slot2: ['ATK%', 'HP%', 'DEF%', 'SPD'],
  slot4: ['ATK%', 'HP%', 'DEF%', 'HIT', 'RES'],
  slot6: ['ATK%', 'HP%', 'DEF%', 'CRIT', 'CRIT DMG'],
};

const indicatorPresets: Record<string, Pick<Build, 'slot2' | 'slot4' | 'slot6'>> = {
  Damage: { slot2: ['ATK%'], slot4: ['ATK%'], slot6: ['CRIT', 'CRIT DMG'] },
  ATK: { slot2: ['ATK%'], slot4: ['ATK%'], slot6: ['ATK%'] },
  HP: { slot2: ['HP%'], slot4: ['HP%'], slot6: ['HP%'] },
  'DEF DMG': { slot2: ['DEF%'], slot4: ['DEF%'], slot6: ['CRIT', 'CRIT DMG'] },
  Speed: { slot2: ['SPD'], slot4: ['ATK%', 'DEF%', 'HP%', 'HIT', 'RES'], slot6: ['ATK%', 'DEF%', 'HP%', 'CRIT', 'CRIT DMG'] },
  CRIT: { slot2: ['ATK%', 'DEF%', 'HP%', 'SPD'], slot4: ['ATK%', 'DEF%', 'HP%', 'HIT', 'RES'], slot6: ['CRIT', 'CRIT DMG'] },
  'Effect HIT': { slot2: ['SPD'], slot4: ['HIT'], slot6: ['ATK%', 'DEF%', 'HP%', 'CRIT', 'CRIT DMG'] },
  'Effect RES': { slot2: ['SPD'], slot4: ['RES'], slot6: ['ATK%', 'DEF%', 'HP%', 'CRIT', 'CRIT DMG'] },
  'EFF HIT & RES': { slot2: ['SPD'], slot4: ['HIT', 'RES'], slot6: ['HP%'] },
  'Healing Amount': { slot2: ['SPD'], slot4: ['HP%'], slot6: ['CRIT', 'CRIT DMG'] },
};
const indicators = [...Object.keys(indicatorPresets), 'Khác'];

function MultiChoice({ value, options, onChange, single = false }: { value: string[]; options: string[]; onChange: (value: string[]) => void; single?: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);
  const toggle = (option: string) => { if (single) { onChange([option]); setOpen(false); } else onChange(value.includes(option) ? value.filter(item => item !== option) : [...value, option]); };
  return <div ref={rootRef} className="recommend-multi"><button type="button" onClick={() => setOpen(item => !item)}><span>{value.join(', ') || 'Chọn chỉ số'}</span><ChevronDown /></button>{open && <div className="recommend-multi-menu">{options.map(option => <button type="button" className={value.includes(option) ? 'selected' : ''} key={option} onClick={() => toggle(option)}><span>{option}</span><i>{value.includes(option) && <Check />}</i></button>)}</div>}</div>;
}

function SoulPicker({ kind, value, souls, language, onChange, onClose }: { kind: 'set4' | 'set2'; value: string; souls: Soul[]; language: Language; onChange: (value: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const filtered = souls.filter(item => (item.name[language] || item.name.vi).toLowerCase().includes(query.toLowerCase()));
  return <div className="recommend-soul-picker">
    <header><div><b>{kind === 'set4' ? '4-Piece' : '2-Piece'}</b><span>{language === 'vi' ? 'Chọn Ngự Hồn' : 'Choose Soul'}</span></div><button type="button" onClick={onClose}><X /></button></header>
    <div className="recommend-soul-search"><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={language === 'vi' ? 'Nhập tên Ngự Hồn…' : 'Enter a Soul name…'} /></div>
    <div className="recommend-soul-picker-body"><section>
      <button type="button" className={!value ? 'selected' : ''} onClick={() => { onChange(''); onClose(); }}><img className="empty-soul-flower" src="/ui-theme/empty-soul-flower.webp" alt="" /><strong>{language === 'vi' ? 'Không chọn' : language === 'en' ? 'None' : '不选择'}</strong></button>
      {kind === 'set2' && bonusStats.map(stat => <button type="button" className={value === `stat:${stat}` ? 'selected' : ''} key={stat} onClick={() => { onChange(`stat:${stat}`); onClose(); }}><span className={`soul-picker-stat stat-${stat.replaceAll(' ', '-').toLowerCase()}`}>{stat}</span><strong>{stat}</strong></button>)}
      {filtered.map(item => { const optionValue = kind === 'set2' ? `soul:${item.id}` : String(item.id); return <button type="button" className={value === optionValue ? 'selected' : ''} key={item.id} onClick={() => { onChange(optionValue); onClose(); }}><img src={`/souls/portraits/${item.assets.iconFile}`} alt="" /><strong>{item.name[language] || item.name.vi}</strong><small>{kind === 'set4' ? item.set4[language] || item.set4.vi : ''}</small></button>; })}
    </section></div>
  </div>;
}

function BuildForm({ mode, language, set4Souls, set2Souls, shikigamiId, baseSpeed, onSubmitted }: { mode: 'basic' | 'pvp'; language: Language; set4Souls: Soul[]; set2Souls: Soul[]; shikigamiId: number; baseSpeed: number; onSubmitted: () => void }) {
  const text = labels[language];
  const speedCeiling = baseSpeed + 170;
  const [build, setBuild] = useState<Build>(() => emptyBuild(baseSpeed));
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [soulPicker, setSoulPicker] = useState<'set4' | 'set2' | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!noteOpen) return;
    const closeNoteOutside = (event: PointerEvent) => {
      if (noteRef.current?.contains(event.target as Node)) return;
      setNoteOpen(false);
    };
    document.addEventListener('pointerdown', closeNoteOutside);
    return () => document.removeEventListener('pointerdown', closeNoteOutside);
  }, [noteOpen]);
  const set = <K extends keyof Build>(key: K, value: Build[K]) => setBuild(current => ({ ...current, [key]: value }));
  const applyIndicator = (indicator: string) => setBuild(current => ({ ...current, indicator, ...(indicatorPresets[indicator] || {}) }));
  const setManualStats = (slot: 'slot2' | 'slot4' | 'slot6', value: string[]) => setBuild(current => ({ ...current, [slot]: value }));
  const submit = async () => {
    if (submitting) return;
    setSubmitting(true); setMessage('');
    try {
      await submitSoulRecommendation({
        shikigami_id: shikigamiId,
        mode,
        primary_soul_id: build.set4 ? Number(build.set4) : 0,
        secondary_soul_id: build.set2.startsWith('soul:') ? Number(build.set2.slice(5)) : null,
        secondary_bonus: build.set2.startsWith('stat:') ? build.set2.slice(5) : null,
        slot_2_stat: build.slot2.join(', '),
        slot_4_stat: build.slot4.join(', '),
        slot_6_stat: build.slot6.join(', '),
        speed_min: build.speedMin,
        speed_max: build.speedMax >= speedCeiling ? null : build.speedMax,
        recommendation_note: build.recommendationNote.trim() || null,
        requires_100_crit: build.fullCrit,
        note: `Indicator: ${build.indicator}`,
      });
      setMessage(language === 'vi' ? 'Đã gửi, đang chờ duyệt.' : language === 'en' ? 'Submitted for review.' : '已提交审核。');
      setBuild(emptyBuild(baseSpeed)); onSubmitted();
    } catch (error) { const detail = error && typeof error === 'object' && 'message' in error ? String(error.message) : ''; setMessage(detail || 'Không thể gửi đề xuất.'); }
    finally { setSubmitting(false); }
  };
  return <div className="recommend-mode">
    <div className="recommend-mine-label">{text.mine}</div>
    <div className="recommend-sets">
      <div><b>{text.set4}</b><button type="button" className="recommend-soul-choice" onClick={() => setSoulPicker('set4')}><span className={`recommend-soul-icon ${build.set4 ? '' : 'empty'}`}>{set4Souls.find(item => String(item.id) === build.set4) ? <img src={`/souls/portraits/${set4Souls.find(item => String(item.id) === build.set4)!.assets.iconFile}`} alt="" /> : <img className="empty-soul-flower" src="/ui-theme/empty-soul-flower.webp" alt="" />}</span><strong>{set4Souls.find(item => String(item.id) === build.set4)?.name[language] || (language === 'vi' ? 'Chọn' : language === 'en' ? 'Select' : '选择')}</strong><ChevronDown /></button></div>
      <div className="recommend-set2"><b>{text.set2}</b><button type="button" className="recommend-soul-choice" onClick={() => setSoulPicker('set2')}><span className={`recommend-soul-icon ${build.set2 ? '' : 'empty'}`}>{set2Souls.find(item => build.set2 === `soul:${item.id}`) ? <img src={`/souls/portraits/${set2Souls.find(item => build.set2 === `soul:${item.id}`)!.assets.iconFile}`} alt="" /> : build.set2.startsWith('stat:') ? <span className={`soul-picker-stat stat-${build.set2.slice(5).replaceAll(' ', '-').toLowerCase()}`}>{build.set2.slice(5)}</span> : <img className="empty-soul-flower" src="/ui-theme/empty-soul-flower.webp" alt="" />}</span><strong>{build.set2.startsWith('stat:') ? build.set2.slice(5) : set2Souls.find(item => build.set2 === `soul:${item.id}`)?.name[language] || (language === 'vi' ? 'Chọn' : language === 'en' ? 'Select' : '选择')}</strong><ChevronDown /></button></div>
    </div>
    <div className="recommend-indicator"><b>Indicator</b><MultiChoice single value={[build.indicator]} options={indicators} onChange={value => applyIndicator(value[0])} /></div>
    <div className="recommend-main-stats"><b>{text.stats}</b><div>{(['slot2', 'slot4', 'slot6'] as const).map((slot, index) => <label key={slot}><span>{[2, 4, 6][index]}</span><MultiChoice value={build[slot]} options={slotOptions[slot]} onChange={value => setManualStats(slot, value)} /></label>)}</div></div>
    <SpeedRecommendation baseSpeed={baseSpeed} ceiling={speedCeiling} minValue={build.speedMin} maxValue={build.speedMax} onMinChange={value => set('speedMin', Math.min(Math.max(baseSpeed, value), build.speedMax - 1))} onMaxChange={value => set('speedMax', Math.max(build.speedMin + 1, Math.min(speedCeiling, value)))} />
    <div ref={noteRef} className="recommend-note-wrap"><button type="button" className={`recommend-note-button ${build.recommendationNote ? 'has-note' : ''}`} onClick={() => setNoteOpen(value => !value)}><MessageSquareText />{language === 'vi' ? 'Ghi chú' : language === 'en' ? 'Note' : '备注'}{build.recommendationNote && <Check />}</button>{noteOpen && <div className="recommend-note-popover"><header><b>{language === 'vi' ? 'Ghi chú đề xuất' : 'Recommendation note'}</b><button type="button" onClick={() => setNoteOpen(false)}><X /></button></header><textarea autoFocus maxLength={180} value={build.recommendationNote} onChange={event => set('recommendationNote', event.target.value)} placeholder={language === 'vi' ? 'Ví dụ: tốc trên 210, 50% kháng,..' : 'Example: over 210 SPD, 50% Effect RES,..'} /><small>{build.recommendationNote.length}/180</small></div>}</div>
    <label className="recommend-crit"><input type="checkbox" checked={build.fullCrit} onChange={event => set('fullCrit', event.target.checked)} /><span>{text.crit}</span></label>
    <button className="recommend-submit" disabled={submitting} onClick={submit}>{submitting ? '…' : text.save}</button>
    {message && <p className="recommend-message">{message}</p>}
    {soulPicker && <SoulPicker kind={soulPicker} value={build[soulPicker]} souls={soulPicker === 'set4' ? set4Souls : set2Souls} language={language} onChange={value => set(soulPicker, value)} onClose={() => setSoulPicker(null)} />}
  </div>;
}

function SpeedRecommendation({ baseSpeed, ceiling, minValue, maxValue, onMinChange, onMaxChange }: { baseSpeed: number; ceiling: number; minValue: number; maxValue: number; onMinChange: (value: number) => void; onMaxChange: (value: number) => void }) {
  const shownMin = minValue;
  const minPercent = ((minValue - baseSpeed) / (ceiling - baseSpeed)) * 100;
  const maxPercent = ((maxValue - baseSpeed) / (ceiling - baseSpeed)) * 100;
  const summary = maxValue >= ceiling ? `Tốc > ${shownMin}` : `${shownMin} < Tốc < ${maxValue}`;
  const quick = (value: number) => onMinChange(Math.min(Math.max(baseSpeed, value), maxValue - 1));
  return <div className="recommend-speed">
    <div className="recommend-speed-heading"><b>Tốc độ đề xuất</b><strong>{summary}</strong></div>
    <div className="recommend-speed-range" style={{ '--speed-low': `${minPercent}%`, '--speed-high': `${maxPercent}%` } as CSSProperties}>
      <div className="recommend-speed-track" />
      <input aria-label="Tốc độ thấp nhất" type="range" min={baseSpeed} max={ceiling} value={minValue} onChange={event => onMinChange(Number(event.target.value))} />
      <input aria-label="Tốc độ cao nhất" type="range" min={baseSpeed} max={ceiling} value={maxValue} onChange={event => onMaxChange(Number(event.target.value))} />
    </div>
    <div className="recommend-speed-controls"><label aria-label="Biên dưới"><input type="number" min={baseSpeed} max={maxValue - 1} value={minValue} onChange={event => onMinChange(Number(event.target.value) || baseSpeed)} /></label><div className="recommend-speed-quick"><button type="button" disabled={128 < baseSpeed || 128 >= maxValue} onClick={() => quick(128)}>128</button><button type="button" disabled={142 < baseSpeed || 142 >= maxValue} onClick={() => quick(142)}>142</button></div><label aria-label="Biên trên"><input type="number" min={minValue + 1} max={ceiling} value={maxValue} onChange={event => onMaxChange(Number(event.target.value) || ceiling)} /></label></div>
  </div>;
}

function CommunityRecommendations({ recommendations, souls, language, likes, onLike }: { recommendations: SoulRecommendation[]; souls: Soul[]; language: Language; likes: SoulRecommendationLike[]; onLike: (soulId: number) => Promise<void> }) {
  const text = labels[language];
  const [liking, setLiking] = useState<string | null>(null);
  const [hoveredSoul, setHoveredSoul] = useState<{ soul: Soul; left: number; top: number } | null>(null);
  const soul = (id: number | null) => souls.find(item => item.id === id);
  const showSoul = (item: Soul, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const width = 310;
    setHoveredSoul({ soul: item, left: Math.min(rect.right + 10, window.innerWidth - width - 12), top: Math.max(12, Math.min(rect.top, window.innerHeight - 250)) });
  };
  const grouped = Array.from(recommendations.reduce((map, item) => {
    const key = String(item.primary_soul_id ?? 0);
    const current = map.get(key);
    if (current) current.count += 1;
    else map.set(key, { item, count: 1 });
    return map;
  }, new Map<string, { item: SoulRecommendation; count: number }>()).values()).map(group => {
    const like = likes.find(value => value.primary_soul_id === (group.item.primary_soul_id ?? 0));
    return { ...group, total: group.count + (like?.like_count || 0) };
  }).sort((a, b) => b.total - a.total).slice(0, 5);
  return <div className="recommend-community"><b>{text.community}</b>{grouped.length === 0 ? <p>{text.empty}</p> : <div className="recommend-list">{grouped.map(({ item, count }) => {
    const primary = soul(item.primary_soul_id);
    const secondary = soul(item.secondary_soul_id);
    const like = likes.find(value => value.primary_soul_id === (item.primary_soul_id ?? 0));
    const total = count + (like?.like_count || 0);
    return <article key={item.primary_soul_id ?? 0}>
      <div className="recommend-community-icons">
        <span className={`recommend-community-primary ${primary ? 'has-tooltip' : 'empty'}`} tabIndex={primary ? 0 : undefined} onMouseEnter={event => primary && showSoul(primary, event.currentTarget)} onMouseLeave={() => setHoveredSoul(null)} onFocus={event => primary && showSoul(primary, event.currentTarget)} onBlur={() => setHoveredSoul(null)}>{primary ? <img src={`/souls/portraits/${primary.assets.iconFile}`} alt={primary.name[language] || primary.name.vi} /> : <img className="empty-soul-flower" src="/ui-theme/empty-soul-flower.webp" alt="" />}</span>
        {(secondary || item.secondary_bonus) && <span className={`recommend-community-secondary ${secondary ? 'has-tooltip' : 'stat'}`} tabIndex={secondary ? 0 : undefined} onMouseEnter={event => secondary && showSoul(secondary, event.currentTarget)} onMouseLeave={() => setHoveredSoul(null)} onFocus={event => secondary && showSoul(secondary, event.currentTarget)} onBlur={() => setHoveredSoul(null)}>{secondary ? <img src={`/souls/portraits/${secondary.assets.iconFile}`} alt={secondary.name[language] || secondary.name.vi} /> : item.secondary_bonus}</span>}
      </div>
      <div className="recommend-community-copy"><div><strong>{primary?.name[language] || (language === 'vi' ? 'Ngự Mix (Tán Kiện)' : language === 'en' ? 'Mixed Souls' : '散件御魂')}</strong>{(secondary || item.secondary_bonus) && <span> + {item.secondary_bonus || secondary?.name[language]}</span>}</div>{item.note && <em>{item.note}</em>}<small>2: {item.slot_2_stat} · 4: {item.slot_4_stat} · 6: {item.slot_6_stat}{item.requires_100_crit ? ' · 100% CRIT' : ''}</small>{item.speed_min && <small className="recommend-speed-summary">{item.speed_max ? `${item.speed_min} < Tốc < ${item.speed_max}` : `Tốc > ${item.speed_min}`}</small>}{item.recommendation_note && <small className="recommend-card-note">{item.recommendation_note}</small>}</div>
      <div className="recommend-actions"><span className="recommend-count" title={language === 'vi' ? 'Số lượt đề xuất' : 'Recommendation count'}>{total}</span><button className={`recommend-like ${like?.viewer_liked ? 'liked' : ''}`} disabled={like?.viewer_liked || liking === String(item.primary_soul_id ?? 0)} onClick={async () => { setLiking(String(item.primary_soul_id ?? 0)); try { await onLike(item.primary_soul_id); } finally { setLiking(null); } }} title={like?.viewer_liked ? 'Bạn đã thích đề xuất này' : 'Thêm một lượt đề xuất'} aria-label={like?.viewer_liked ? 'Đã thích' : 'Thích đề xuất'}><ThumbsUp /></button></div>
    </article>;
  })}</div>}{hoveredSoul && <aside className="recommend-soul-tooltip" style={{ left: hoveredSoul.left, top: hoveredSoul.top }}>
    <header><img src={`/souls/portraits/${hoveredSoul.soul.assets.iconFile}`} alt="" /><div><small>NGỰ HỒN</small><strong>{hoveredSoul.soul.name[language] || hoveredSoul.soul.name.vi}</strong></div></header>
    <section><b>2</b><div><span>HIỆU QUẢ BỘ 2</span><p>{hoveredSoul.soul.set2[language] || hoveredSoul.soul.set2.vi || 'Không có hiệu ứng.'}</p></div></section>
    <section className="set-four"><b>4</b><div><span>HIỆU QUẢ BỘ 4</span><p>{hoveredSoul.soul.set4[language] || hoveredSoul.soul.set4.vi || 'Không có hiệu ứng bộ 4.'}</p></div></section>
  </aside>}</div>;
}

export default function SoulRecommendationBuilder({ shikigamiId, language, baseSpeed }: { shikigamiId: number; language: Language; baseSpeed: number }) {
  const [souls, setSouls] = useState<Soul[]>([]);
  const [recommendations, setRecommendations] = useState<SoulRecommendation[]>([]);
  const [likes, setLikes] = useState<Record<'basic' | 'pvp', SoulRecommendationLike[]>>({ basic: [], pvp: [] });
  const [pvpOpen, setPvpOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  useEffect(() => { fetch('/data/souls.json', { cache: 'no-store' }).then(response => response.json()).then(data => setSouls(data.souls || [])).catch(() => setSouls([])); }, []);
  const refresh = () => {
    getApprovedSoulRecommendations(shikigamiId).then(setRecommendations).catch(() => setRecommendations([]));
    Promise.all([getSoulRecommendationLikes(shikigamiId, 'basic'), getSoulRecommendationLikes(shikigamiId, 'pvp')]).then(([basic, pvp]) => setLikes({ basic, pvp })).catch(() => setLikes({ basic: [], pvp: [] }));
  };
  useEffect(refresh, [shikigamiId]);
  const set4Souls = useMemo(() => souls.filter(item => item.category !== 'boss' && !/^Không có$/i.test(item.set4?.vi || '')), [souls]);
  const specialSet2Souls = useMemo(() => souls.filter(item => [34, 35, 36, 37, 38, 49, 62, 65, 66, 67, 68, 69, 70].includes(item.id)), [souls]);
  const text = labels[language];
  return <div className="soul-recommendation-builder">
    <div key={pvpOpen ? 'pvp' : 'pve'} className={`recommend-board ${pvpOpen ? 'switch-to-pvp' : 'switch-to-pve'}`}>
      <div className="recommend-board-heading"><h3>{pvpOpen ? text.pvp : text.basic}</h3><button onClick={() => setFormOpen(true)}>{text.mine}</button></div>
      <CommunityRecommendations recommendations={recommendations.filter(item => item.mode === (pvpOpen ? 'pvp' : 'basic'))} souls={souls} language={language} likes={likes[pvpOpen ? 'pvp' : 'basic']} onLike={async soulId => { await likeSoulRecommendation(shikigamiId, pvpOpen ? 'pvp' : 'basic', soulId); refresh(); }} />
    </div>
    <button className={`recommend-pvp-handle ${pvpOpen ? 'pvp-active' : ''}`} onClick={() => { setPvpOpen(value => !value); setFormOpen(false); }} aria-expanded={pvpOpen}>{pvpOpen ? <ChevronDown /> : <ChevronUp />}<span>{pvpOpen ? text.basic : text.pvp}</span></button>
    {formOpen && <div className="recommend-form-overlay" role="dialog" aria-modal="true">
      <button className="recommend-form-close" onClick={() => setFormOpen(false)} aria-label="Đóng"><X /></button>
      <BuildForm mode={pvpOpen ? 'pvp' : 'basic'} language={language} set4Souls={set4Souls} set2Souls={specialSet2Souls} shikigamiId={shikigamiId} baseSpeed={baseSpeed} onSubmitted={() => { refresh(); setFormOpen(false); }} />
    </div>}
  </div>;
}
