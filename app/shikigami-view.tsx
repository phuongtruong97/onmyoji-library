'use client';

import { ChevronLeft, ChevronRight, Flame, ListFilter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type Language = 'vi' | 'en' | 'zh';
type Text3 = Record<Language, string>;
type Assets = { portraitFile: string; headIconFile: string };
type CatalogHero = { id: number; name: Text3; rarity: string; tier?: string; assets: Assets };
type Skill = { id: number | string; number: number; variantOrder?: number; parentSkillId?: number | string | null; maxLevel: number; name: Text3; intro: Text3; description: Text3; upgrades: { level: number; text: Text3 }[]; orbCost: number; iconFile: string };
type Hero = CatalogHero & { level: number; maxLevel: number; statState: string; reviewStatus: string; stats: { key: string; label: string; value: number | string; grade: string }[]; secondaryStats: Record<string, string>; skills: Skill[] };
type GlossaryEntry = { kind: string; title: Text3; description: Text3; iconFile?: string };
type Catalog = { count: number; heroes: CatalogHero[] };

const languages: { id: Language; label: string }[] = [{ id: 'vi', label: 'Tiếng Việt' }, { id: 'en', label: 'English' }, { id: 'zh', label: '中文' }];
const tierOrder = ['Onmyoji', 'UR', 'SP', 'SSR', 'SR', 'R', 'N'];
const secondaryLabels: Record<string, Text3> = {
  critDamage: { vi: 'SÁT THƯƠNG CHÍ MẠNG', en: 'CRIT DMG', zh: '暴击伤害' },
  effectHit: { vi: 'CHÍNH XÁC', en: 'EFFECT HIT', zh: '效果命中' },
  effectRes: { vi: 'KHÁNG HIỆU ỨNG', en: 'EFFECT RES', zh: '效果抵抗' },
};
const statLabels: Record<string, Text3> = {
  atk: { vi: 'CÔNG', en: 'ATK', zh: '攻击' }, hp: { vi: 'MÁU', en: 'HP', zh: '生命' },
  def: { vi: 'THỦ', en: 'DEF', zh: '防御' }, speed: { vi: 'TỐC ĐỘ', en: 'SPEED', zh: '速度' },
  crit: { vi: 'CHÍ MẠNG', en: 'CRIT', zh: '暴击' },
};

function UiIcon({ kind, name, className }: { kind: 'grades' | 'rarities'; name: string; className: string }) {
  const [failed, setFailed] = useState(false);
  return <span className={`${className} custom-ui-icon ${failed ? 'fallback' : ''}`}>
    {!failed && <img src={`/ui/${kind}/${encodeURIComponent(name)}.png`} alt="" onError={() => setFailed(true)} />}
    <em>{name}</em>
  </span>;
}

function SkillIcon({ skill, className, fallback }: { skill: Skill; className: string; fallback: number }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [skill.iconFile]);
  return <span className={`${className} ${failed || !skill.iconFile ? 'icon-missing' : ''}`}>
    {!failed && skill.iconFile && <img key={skill.iconFile} src={`/skill-icons/${skill.iconFile}`} alt="" onError={() => setFailed(true)} />}
    <i>{fallback}</i>
  </span>;
}

function RichText({ text, language, glossary, onToken }: { text: string; language: Language; glossary: Record<string, GlossaryEntry>; onToken: (s: string) => void }) {
  return <>{String(text || '').split(/(\[[^\]]+\])/g).map((chunk, i) => {
    const token = /^\[([^\]]+)\]$/.exec(chunk)?.[1];
    return token && glossary[token]
      ? <span role="button" tabIndex={0} className="game-token" key={`${token}-${i}`} onClick={() => onToken(token)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onToken(token); }}>{glossary[token].title?.[language] || chunk}</span>
      : token ? <span className="game-code" key={`${token}-${i}`}>{chunk}</span> : <span key={i}>{chunk}</span>;
  })}</>;
}

export default function ShikigamiView({ previewTheme = false }: { previewTheme?: boolean }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [glossary, setGlossary] = useState<Record<string, GlossaryEntry>>({});
  const [hero, setHero] = useState<Hero | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeSlot, setActiveSlot] = useState(0);
  const [activeVariants, setActiveVariants] = useState<Record<number, number>>({});
  const [showVariants, setShowVariants] = useState(false);
  const [language, setLanguage] = useState<Language>('vi');
  const [query, setQuery] = useState('');
  const [rarity, setRarity] = useState('Tất cả');
  const [showLibrary, setShowLibrary] = useState(!previewTheme);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [navDirection, setNavDirection] = useState<-1 | 0 | 1>(0);
  const [animationKey, setAnimationKey] = useState(0);
  const currentIndex = catalog?.heroes.findIndex(h => h.id === selectedId) ?? -1;

  useEffect(() => {
    fetch('/data/shikigami_catalog.json')
      .then(r => r.json())
      .then(c => {
        setCatalog(c);
        const requestedId = Number(new URLSearchParams(location.search).get('hero'));
        const requestedHero = c.heroes.find((h: CatalogHero) => h.id === requestedId);
        const newestHero = c.heroes.reduce((latest: CatalogHero | null, item: CatalogHero) => !latest || item.id > latest.id ? item : latest, null);
        setSelectedId(requestedHero?.id ?? newestHero?.id ?? null);
      })
      .catch(() => setLoading(false));
    fetch('/data/glossary.json').then(r => r.json()).then(setGlossary).catch(() => {});
  }, []);
  useEffect(() => {
    if (selectedId === null) return;
    const controller = new AbortController();
    setLoading(true);
    fetch(`/data/shikigami/${selectedId}.json`, { signal: controller.signal }).then(r => { if (!r.ok) throw Error(); return r.json(); })
      .then(d => { setHero(d); setActiveSlot(0); setActiveVariants({}); setShowVariants(false); setActiveToken(null); setAnimationKey(k => k + 1); setLoading(false); history.replaceState(null, '', `?hero=${selectedId}`); })
      .catch(error => { if (error?.name !== 'AbortError') setLoading(false); });
    return () => controller.abort();
  }, [selectedId]);
  useEffect(() => {
    if (!catalog || selectedId === null || currentIndex < 0) return;
    const warmHero = (item: CatalogHero | undefined) => {
      if (!item) return;
      fetch(`/data/shikigami/${item.id}.json`).catch(() => {});
      if (item.assets.portraitFile) {
        const image = new Image();
        image.src = `/portraits/${item.assets.portraitFile}`;
      }
    };
    const timer = window.setTimeout(() => {
      warmHero(catalog.heroes[(currentIndex - 1 + catalog.heroes.length) % catalog.heroes.length]);
      warmHero(catalog.heroes[(currentIndex + 1) % catalog.heroes.length]);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [catalog, selectedId, currentIndex]);
  useEffect(() => {
    if (!activeToken) return;
    const close = (e: PointerEvent) => { const t = e.target; if (t instanceof Element && (t.closest('.glossary-popover') || t.closest('.game-token'))) return; setActiveToken(null); };
    document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close);
  }, [activeToken]);

  const rarities = useMemo(() => ['Tất cả', ...tierOrder.filter(r => (catalog?.heroes || []).some(h => h.rarity === r))], [catalog]);
  const filtered = useMemo(() => { const q = query.trim().toLocaleLowerCase(); return (catalog?.heroes || []).filter(h => (rarity === 'Tất cả' || h.rarity === rarity) && (!q || Object.values(h.name).some(n => String(n).toLocaleLowerCase().includes(q)))); }, [catalog, query, rarity]);
  const moveHero = (d: -1 | 1) => { if (catalog?.heroes.length) { setNavDirection(d); setSelectedId(catalog.heroes[(currentIndex + d + catalog.heroes.length) % catalog.heroes.length].id); } };
  const skillSlots = useMemo(() => {
    const grouped = new Map<number, Skill[]>();
    for (const item of hero?.skills || []) {
      const slot = Number(item.number || 0);
      if (!grouped.has(slot)) grouped.set(slot, []);
      grouped.get(slot)!.push(item);
    }
    return [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([slot, variants]) => ({
      slot,
      variants: variants.sort((a, b) => Number(a.variantOrder || 0) - Number(b.variantOrder || 0)),
    }));
  }, [hero]);
  const currentSlot = skillSlots[activeSlot];
  const activeVariant = currentSlot ? Math.min(activeVariants[currentSlot.slot] || 0, currentSlot.variants.length - 1) : 0;
  const skill = currentSlot?.variants[activeVariant];
  const displayedUpgrades = useMemo(() => {
    const seen = new Set<string>();
    return (skill?.upgrades || []).filter(item => {
      const key = `${item.level}\u0000${item.text.vi || ''}\u0000${item.text.en || ''}\u0000${item.text.zh || ''}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [skill]);
  const picture = hero?.assets.portraitFile ? `/portraits/${hero.assets.portraitFile}` : '';

  return <main className={`shiki-shell${previewTheme ? ' ui-asset-preview' : ''}`}>
    <div className="scene" aria-hidden="true" />
    <header className="topbar">
      <button className="icon-button" onClick={() => setShowLibrary(v => !v)} aria-label="Mở thư viện"><ListFilter /></button>
      <div className="brand-lockup"><span>ONMYOJI • THƯ VIỆN THỨC THẦN</span><strong>{catalog?.count || 266} thức thần</strong></div>
      <label className="searchbox"><Search size={18} /><input value={query} onChange={e => { setQuery(e.target.value); setShowLibrary(true); }} placeholder="Tìm tên Việt, Anh hoặc Trung" /></label>
      <div className="language-tabs">{languages.map(l => <button key={l.id} className={language === l.id ? 'active' : ''} onClick={() => { setLanguage(l.id); setActiveToken(null); }}>{l.label}</button>)}</div>
    </header>
    <aside className={`library-drawer ${showLibrary ? 'open' : ''}`}>
      <div className="library-heading"><div><b>Danh sách thức thần</b><small>{filtered.length} kết quả</small></div><button onClick={() => setShowLibrary(false)}><X /></button></div>
      {showLibrary && <><div className="rarity-filter">{rarities.map(r => <button key={r} className={rarity === r ? 'active' : ''} onClick={() => setRarity(r)}>{r}</button>)}</div>
      <div className="hero-list">{filtered.map(h => <button key={h.id} className={h.id === selectedId ? 'selected' : ''} onClick={() => { setNavDirection(0); setSelectedId(h.id); setShowLibrary(false); }}>
        <span className="hero-thumb">{h.assets.headIconFile && <img src={`/head-icons/${h.assets.headIconFile}`} alt="" loading="lazy" decoding="async" onError={e => { e.currentTarget.style.display = 'none'; }} />}<i>{h.rarity}</i></span>
        <span><strong>{h.name[language] || h.name.en || `#${h.id}`}</strong><small>{language === 'vi' ? h.name.en : h.name.vi} · #{h.id}</small></span>
      </button>)}</div></>}
    </aside>
    {showLibrary && <button className="drawer-scrim" onClick={() => setShowLibrary(false)} />}
    {!hero ? <section className="empty-state"><span className="loader" /><h1>Đang nạp dữ liệu…</h1></section> : !skill ? <section className="empty-state"><h1>Chưa nhập kỹ năng</h1><p>Hãy bổ sung kỹ năng trong file Excel thủ công.</p></section> :
      <section className={`workspace hero-transition ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
        <aside key={`identity-${animationKey}`} className={`identity-panel hero-slide ${navDirection > 0 ? 'from-right' : navDirection < 0 ? 'from-left' : 'from-fade'}`}>
          <UiIcon kind="rarities" name={hero.rarity} className="rarity" />
          <div className="character-frame">{picture && <img src={picture} alt={hero.name[language]} decoding="async" fetchPriority="high" onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('missing'); }} />}<div className="character-fade" /></div>
          <div className="identity-copy"><span>Thức thần #{hero.id}</span><h1>{hero.name[language]}</h1><p>{language === 'vi' ? hero.name.en : hero.name.vi}</p></div>
          <button className="switch-arrow left" onClick={() => moveHero(-1)}><ChevronLeft /></button><button className="switch-arrow right" onClick={() => moveHero(1)}><ChevronRight /></button>
        </aside>
        <section className="info-card">
          <div className="card-heading"><div><span>THÔNG TIN THỨC THẦN</span><h2>Lv. <strong>{hero.level}</strong>/{hero.maxLevel}</h2></div><span className="status-chip">{hero.statState === 'EVOLVED' ? 'Evolved Lv.40' : hero.statState === 'SP_NO_EVO' ? 'SP · Lv.40' : 'Lv.40'}</span></div>
          <div className="stats-grid">{hero.stats.map(s => <div className="stat-row" key={s.key}><UiIcon kind="grades" name={String(s.grade)} className={`grade grade-${String(s.grade).toLowerCase()}`} /><span>{statLabels[s.key]?.[language] || s.label}</span><strong>{s.value}</strong></div>)}{Object.entries(hero.secondaryStats || {}).map(([k, v]) => <div className="stat-row secondary" key={k}><span>{secondaryLabels[k]?.[language] || k}</span><strong>{v}</strong></div>)}</div>
          {currentSlot?.variants.length > 1 && showVariants && <div className="skill-variant-picker">
            <button className={activeVariant === 0 ? 'selected' : ''} onClick={() => { setActiveVariants(v => ({ ...v, [currentSlot.slot]: 0 })); setActiveToken(null); }} title={currentSlot.variants[0].name[language]}>
              <SkillIcon skill={currentSlot.variants[0]} className="variant-glyph" fallback={currentSlot.slot} />
            </button>
            <span>Ex</span>
            <div>{currentSlot.variants.slice(1).map((variant, i) => <button key={String(variant.id)} className={activeVariant === i + 1 ? 'selected' : ''} onClick={() => { setActiveVariants(v => ({ ...v, [currentSlot.slot]: i + 1 })); setActiveToken(null); }} title={variant.name[language]}>
              <SkillIcon skill={variant} className="variant-glyph" fallback={currentSlot.slot} />
            </button>)}</div>
          </div>}
          <div className="skills-dock">{skillSlots.map((group, i) => { const selectedVariant = group.variants[Math.min(activeVariants[group.slot] || 0, group.variants.length - 1)]; return <button key={group.slot} className={i === activeSlot ? 'selected' : ''} onClick={() => { if (i === activeSlot && group.variants.length > 1) setShowVariants(v => !v); else { setActiveSlot(i); setShowVariants(group.variants.length > 1); } setActiveToken(null); }}><SkillIcon skill={selectedVariant} className={`skill-glyph glyph-${i % 3 + 1}`} fallback={group.slot} /><b>{selectedVariant.maxLevel}</b><small>{selectedVariant.name[language]}</small>{group.variants.length > 1 && <em className="variant-count">+{group.variants.length - 1}</em>}</button>})}</div>
        </section>
        <article className="skill-scroll">
          <header className="skill-heading"><SkillIcon skill={skill} className={`large-glyph glyph-${activeSlot % 3 + 1}`} fallback={currentSlot?.slot || activeSlot + 1} /><div><span>KỸ NĂNG CẤP TỐI ĐA • Lv.{skill.maxLevel}</span><h2>{skill.name[language]}</h2><p>{skill.intro[language]}</p></div>{skill.orbCost > 0 && <div className="orb-cost"><Flame size={18} />{skill.orbCost}</div>}</header>
          <div className="skill-body"><div className="skill-tags"><span>Chiến đấu</span><span>{skill.maxLevel > 1 ? 'Có thể nâng cấp' : 'Kỹ năng đặc biệt'}</span></div><p className="description"><RichText text={skill.description[language]} language={language} glossary={glossary} onToken={setActiveToken} /></p>{displayedUpgrades.length > 0 && <div className="upgrade-list"><h3>{language === 'vi' ? 'Hiệu quả nâng cấp' : language === 'en' ? 'Upgrade effects' : '升级效果'}</h3><p className="upgrade-note">{language === 'vi' ? 'Mô tả kỹ năng phía trên đã bao gồm tất cả các hiệu quả nâng cấp.' : language === 'en' ? 'The skill description above already includes all upgrade effects.' : '上方技能描述已包含全部升级效果。'}</p>{displayedUpgrades.map((u, index) => <div key={`${u.level}-${u.text.vi}-${u.text.en}-${u.text.zh}-${index}`}><b>Lv.{u.level}</b><p><RichText text={u.text[language]} language={language} glossary={glossary} onToken={setActiveToken} /></p></div>)}</div>}</div>
          {activeToken && glossary[activeToken] && <aside className="glossary-popover"><button className="close-popover" onClick={() => setActiveToken(null)}><X size={16} /></button><span className={`glossary-kind ${glossary[activeToken].kind}`}>{glossary[activeToken].kind === 'buff' ? 'BUFF / DẤU ẤN' : 'THUẬT NGỮ'}</span><div className="glossary-title">{glossary[activeToken].iconFile && <img src={`/buff-icons/${glossary[activeToken].iconFile}`} alt="" onError={e => { e.currentTarget.style.display = 'none'; }} />}<h3>{glossary[activeToken].title[language] || `[${activeToken}]`}</h3></div><p><RichText text={glossary[activeToken].description[language]} language={language} glossary={glossary} onToken={setActiveToken} /></p></aside>}
        </article>
      </section>}
  </main>;
}
