'use client';

import { ArrowLeft, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Language = 'vi' | 'en' | 'zh';
type Text3 = Record<Language, string>;
type Soul = {
  id: number;
  category: string;
  name: Text3;
  set2: Text3;
  set4: Text3;
  assets: { iconFile: string; fullImageFile: string };
};
type SoulCatalog = { count: number; souls: Soul[] };
type Set2Filter = 'all' | 'ATK' | 'HP' | 'DEF' | 'HIT' | 'RES' | 'Crit' | 'Crit DMG' | 'special';

const languages: { id: Language; label: string }[] = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' },
];

function localized(value: Text3, language: Language) {
  return value[language] || value.vi || value.en || value.zh || '';
}

function set2Kind(value: string): Set2Filter {
  const effect = value.trim().toLocaleUpperCase();
  if (effect.startsWith('CRIT DMG')) return 'Crit DMG';
  if (effect.startsWith('CRIT')) return 'Crit';
  if (effect.startsWith('ATK')) return 'ATK';
  if (effect.startsWith('HP')) return 'HP';
  if (effect.startsWith('DEF')) return 'DEF';
  if (effect.startsWith('HIT')) return 'HIT';
  if (effect.startsWith('RES')) return 'RES';
  return 'special';
}

export default function SoulView() {
  const [catalog, setCatalog] = useState<SoulCatalog | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [language, setLanguage] = useState<Language>('vi');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'normal' | 'boss'>('all');
  const [set2Filter, setSet2Filter] = useState<Set2Filter>('all');

  useEffect(() => {
    void fetch('/data/souls.json').then(response => response.json()).then((data: SoulCatalog) => {
      setCatalog(data);
      const id = Number(new URLSearchParams(window.location.search).get('soul'));
      if (id && data.souls.some(item => item.id === id)) setSelectedId(id);
    });
  }, []);

  const souls = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (catalog?.souls || []).filter(soul => {
      const categoryMatches = category === 'all' || soul.category === category;
      const set2Matches = set2Filter === 'all' || set2Kind(soul.set2.vi) === set2Filter;
      const nameMatches = !needle || Object.values(soul.name).some(name => name.toLocaleLowerCase().includes(needle));
      return categoryMatches && set2Matches && nameMatches;
    });
  }, [catalog, query, category, set2Filter]);
  const selected = catalog?.souls.find(soul => soul.id === selectedId) || null;

  const chooseSoul = (id: number) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('soul', String(id));
    window.history.replaceState({}, '', url);
  };
  const closeDetail = () => {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('soul');
    window.history.replaceState({}, '', url);
  };

  return <main className="soul-shell">
    <div className="soul-scene" aria-hidden="true" />
    <header className="soul-topbar">
      <Link className="soul-back" href="/" aria-label="Về thư viện thức thần"><ArrowLeft size={20} /></Link>
      <div className="soul-brand"><span>ONMYOJI • THƯ VIỆN NGỰ HỒN</span><strong>{catalog?.count || 70} Ngự hồn</strong></div>
      <label className="soul-search"><Search size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên Việt, Anh hoặc Trung" /></label>
      <div className="language-tabs">{languages.map(item => <button key={item.id} className={language === item.id ? 'active' : ''} onClick={() => setLanguage(item.id)}>{item.label}</button>)}</div>
    </header>

    <section className={`soul-browser${selected ? ' detail-open' : ''}`}>
      <aside className="soul-grid-panel">
        <div className="soul-grid-heading">
          <div><span>DANH MỤC</span><strong>{souls.length} kết quả</strong></div>
          <div className="soul-filter-stack">
            <div className="soul-filters">
              <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>Tất cả</button>
              <button className={category === 'normal' ? 'active' : ''} onClick={() => setCategory('normal')}>Bộ 4</button>
              <button className={category === 'boss' ? 'active' : ''} onClick={() => setCategory('boss')}>Boss</button>
            </div>
            <select className="soul-set-filter" value={set2Filter} onChange={event => setSet2Filter(event.target.value as Set2Filter)} aria-label="Lọc theo hiệu quả bộ 2">
              <option value="all">Bộ 2: Tất cả</option>
              <option value="ATK">Bộ 2: ATK</option>
              <option value="HP">Bộ 2: HP</option>
              <option value="DEF">Bộ 2: DEF</option>
              <option value="HIT">Bộ 2: HIT</option>
              <option value="RES">Bộ 2: RES</option>
              <option value="Crit">Bộ 2: Crit</option>
              <option value="Crit DMG">Bộ 2: Crit DMG</option>
              <option value="special">Bộ 2: Đặc biệt</option>
            </select>
          </div>
        </div>
        <div className="soul-grid">{souls.map(soul => <button key={soul.id} className={soul.id === selectedId ? 'selected' : ''} onClick={() => chooseSoul(soul.id)}>
          <span className="soul-icon">{soul.assets.iconFile && <img src={`/souls/portraits/${soul.assets.iconFile}`} alt="" loading="lazy" decoding="async" />}</span>
          <strong>{localized(soul.name, language)}</strong>
          <small>{language === 'vi' ? soul.name.en : soul.name.vi}</small>
        </button>)}</div>
      </aside>

      {selected && <article key={selected.id} className="soul-detail">
        <button className="soul-detail-close" onClick={closeDetail} aria-label="Đóng chi tiết"><X size={20} /></button>
        <div className="soul-art">
          <span>NGỰ HỒN #{String(selected.id).padStart(3, '0')}</span>
          <img src={selected.assets.fullImageFile ? `/souls/full/${selected.assets.fullImageFile}` : `/souls/portraits/${selected.assets.iconFile}`} alt={localized(selected.name, language)} />
        </div>
        <div className="soul-copy">
          <span className="soul-category">{selected.category === 'boss' ? 'NGỰ HỒN BOSS / ĐẶC BIỆT' : 'NGỰ HỒN BỘ 4'}</span>
          <h1>{localized(selected.name, language)}</h1>
          <p className="soul-alt-name">{language === 'vi' ? `${selected.name.en} · ${selected.name.zh}` : selected.name.vi}</p>
          <section className="soul-effect set-two"><b>2</b><div><span>HIỆU QUẢ BỘ 2</span><p>{localized(selected.set2, language)}</p></div></section>
          <section className="soul-effect set-four"><b>4</b><div><span>HIỆU QUẢ BỘ 4</span><p>{localized(selected.set4, language) || 'Không có hiệu ứng bộ 4.'}</p></div></section>
        </div>
      </article>}
    </section>
  </main>;
}
