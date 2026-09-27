'use client';

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Flame, ListFilter, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DonateButton from '../donate-button';

type Language = 'vi' | 'en' | 'zh';
type Text3 = Record<Language, string>;
type Skill = { id: number | string; number: number; defaultEquipped: boolean; maxLevel: number; name: Text3; intro: Text3; description: Text3; upgrades: { level: number; text: Text3 }[]; orbCost: number; iconFile: string };
type CatalogCharacter = { id: number; kind: 'Onmyoji' | 'Champion'; name: Text3; assets: { portraitFile: string; headIconFile: string } };
type Character = CatalogCharacter & { level: number; maxLevel: number; stats: { key: string; label: string; value: number | string; grade: string }[]; secondaryStats: Record<string, string>; skills: Skill[] };
type GlossaryEntry = { kind: string; title: Text3; description: Text3; iconFile?: string };

const normalizeGlossaryToken = (value: string) => String(value || '').normalize('NFC').replace(/[·∙]/g, '•').replace(/\s+/g, ' ').trim();

const languages: { id: Language; label: string }[] = [{ id: 'vi', label: 'Tiếng Việt' }, { id: 'en', label: 'English' }, { id: 'zh', label: '中文' }];
const statLabels: Record<string, Text3> = {
  atk: { vi: 'CÔNG', en: 'ATK', zh: '攻击' }, hp: { vi: 'MÁU', en: 'HP', zh: '生命' },
  def: { vi: 'THỦ', en: 'DEF', zh: '防御' }, speed: { vi: 'TỐC ĐỘ', en: 'SPD', zh: '速度' }, crit: { vi: 'CHÍ MẠNG', en: 'CRIT', zh: '暴击' },
};
const secondaryLabels: Record<string, Text3> = {
  critDamage: { vi: 'SÁT THƯƠNG CHÍ MẠNG', en: 'CRIT DMG', zh: '暴击伤害' }, effectHit: { vi: 'CHÍNH XÁC', en: 'EFFECT HIT', zh: '效果命中' }, effectRes: { vi: 'KHÁNG HIỆU ỨNG', en: 'EFFECT RES', zh: '效果抵抗' },
};

function Grade({ value }: { value: string }) {
  const [failed, setFailed] = useState(false);
  return <span className="grade onmyoji-grade">{!failed && value && <img src={`/ui/grades/${encodeURIComponent(value)}.webp`} alt="" onError={() => setFailed(true)} />}<em>{value}</em></span>;
}

function SkillIcon({ skill, fallback, className = '' }: { skill: Skill; fallback: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [skill.iconFile]);
  return <span className={`${className} onmyoji-skill-icon ${failed || !skill.iconFile ? 'icon-missing' : ''}`}>
    {!failed && skill.iconFile && <img src={`/skill-icons/${skill.iconFile}`} alt="" onError={() => setFailed(true)} />}
    <i>{fallback}</i>
  </span>;
}

function RichText({ text, language, glossary, onToken }: { text: string; language: Language; glossary: Record<string, GlossaryEntry>; onToken: (token: string) => void }) {
  return <>{String(text || '').split(/(\[[^\]]+\])/g).map((part, index) => {
    const token = /^\[([^\]]+)\]$/.exec(part)?.[1];
    const normalizedToken = token ? normalizeGlossaryToken(token) : '';
    if (!token) return <span key={index}>{part}</span>;
    const entry = glossary[normalizedToken];
    if (!entry) return <span className="game-token missing-token" key={`${token}-${index}`}>{part}</span>;
    return <span role="button" tabIndex={0} className="game-token" key={`${token}-${index}`} onClick={() => onToken(normalizedToken)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') onToken(normalizedToken); }}>{entry.title?.[language] || token}</span>;
  })}</>;
}

export default function OnmyojiView() {
  const [catalog, setCatalog] = useState<{ count: number; characters: CatalogCharacter[] } | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeSkillId, setActiveSkillId] = useState<number | string | null>(null);
  const [language, setLanguage] = useState<Language>('vi');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'Onmyoji' | 'Champion'>('all');
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [glossary, setGlossary] = useState<Record<string, GlossaryEntry>>({});
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/onmyoji_catalog.json', { cache: 'no-store' }).then(r => r.json()).then(data => {
      setCatalog(data);
      const requested = Number(new URLSearchParams(location.search).get('id'));
      setSelectedId(data.characters.some((item: CatalogCharacter) => item.id === requested) ? requested : data.characters[0]?.id ?? null);
    });
    fetch('/data/glossary.json', { cache: 'no-store' }).then(r => r.json()).then((data: Record<string, GlossaryEntry>) => setGlossary(Object.fromEntries(Object.entries(data).map(([token, entry]) => [normalizeGlossaryToken(token), entry])))).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    fetch(`/data/onmyoji/${selectedId}.json`, { cache: 'no-store' }).then(r => r.json()).then((data: Character) => {
      setCharacter(data);
      const initial = data.skills.find(item => item.defaultEquipped) || data.skills[0];
      setActiveSkillId(initial?.id ?? null);
      setShowAllSkills(false);
      setActiveToken(null);
      history.replaceState(null, '', `/onmyoji?id=${selectedId}`);
    });
  }, [selectedId]);

  const currentIndex = catalog?.characters.findIndex(item => item.id === selectedId) ?? -1;
  const move = (direction: -1 | 1) => {
    if (!catalog?.characters.length) return;
    setSelectedId(catalog.characters[(currentIndex + direction + catalog.characters.length) % catalog.characters.length].id);
  };
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return (catalog?.characters || []).filter(item => (kind === 'all' || item.kind === kind) && (!normalized || Object.values(item.name).some(name => String(name).toLocaleLowerCase().includes(normalized))));
  }, [catalog, kind, query]);
  const equipped = useMemo(() => (character?.skills || []).filter(item => item.defaultEquipped), [character]);
  const activeSkill = character?.skills.find(item => item.id === activeSkillId) || character?.skills[0];
  const activeGlossary = activeToken ? glossary[activeToken] : null;
  const picture = character?.assets.portraitFile ? `/portraits/${character.assets.portraitFile}` : '';

  return <main className="shiki-shell ui-asset-preview onmyoji-shell">
    <div className="scene" aria-hidden="true" />
    <header className="topbar">
      <button className="icon-button" onClick={() => setShowLibrary(value => !value)} aria-label="Mở danh sách Onmyoji"><ListFilter /></button>
      <div className="brand-lockup"><span>ONMYOJI • THƯ VIỆN NHÂN VẬT</span><strong>{catalog?.count || 6} Onmyoji</strong></div>
      <nav className="section-nav"><a className="section-link" href="/">Thức thần</a><a className="section-link active" href="/onmyoji">Âm Dương Sư</a><a className="section-link" href="/ngu-hon">Ngự hồn</a><a className="section-link" href="/bondling">Khiết Linh</a></nav>
      <label className="searchbox"><Search size={18} /><input value={query} onChange={event => { setQuery(event.target.value); setShowLibrary(true); }} placeholder="Tìm Onmyoji hoặc Champion" /></label>
      <div className="language-tabs">{languages.map(item => <button key={item.id} className={language === item.id ? 'active' : ''} onClick={() => setLanguage(item.id)}>{item.label}</button>)}</div><DonateButton />
    </header>

    <aside className={`library-drawer ${showLibrary ? 'open' : ''}`}>
      <div className="library-heading"><div><b>Danh sách Onmyoji</b><small>{filtered.length} kết quả</small></div><button onClick={() => setShowLibrary(false)}><X /></button></div>
      <div className="rarity-filter"><button className={kind === 'all' ? 'active' : ''} onClick={() => setKind('all')}>Tất cả</button><button className={kind === 'Onmyoji' ? 'active' : ''} onClick={() => setKind('Onmyoji')}>Âm Dương Sư</button><button className={kind === 'Champion' ? 'active' : ''} onClick={() => setKind('Champion')}>Champion</button></div>
      <div className="hero-list">{filtered.map(item => <button key={item.id} className={item.id === selectedId ? 'selected' : ''} onClick={() => { setSelectedId(item.id); setShowLibrary(false); }}>
        <span className="hero-thumb">{item.assets.headIconFile && <img src={`/head-icons/${item.assets.headIconFile}`} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}<i>{item.kind === 'Champion' ? 'CP' : 'OM'}</i></span>
        <span><strong>{item.name[language] || item.name.en}</strong><small>{item.kind} · #{item.id}</small></span>
      </button>)}</div>
    </aside>
    {showLibrary && <button className="drawer-scrim" onClick={() => setShowLibrary(false)} />}

    {!character || !activeSkill ? <section className="empty-state"><span className="loader" /><h1>Đang nạp dữ liệu…</h1></section> : <section className="workspace onmyoji-workspace">
      <aside className="identity-panel onmyoji-identity">
        <span className="onmyoji-kind">{character.kind === 'Champion' ? 'CHAMPION' : 'ONMYOJI'}</span>
        <div className="character-frame">{picture && <img src={picture} alt={character.name[language]} onError={event => { event.currentTarget.style.display = 'none'; event.currentTarget.parentElement?.classList.add('missing'); }} />}<div className="character-fade" /></div>
        <div className="identity-copy"><span>{character.kind} #{character.id}</span><h1>{character.name[language]}</h1><p>{language === 'vi' ? character.name.en : character.name.vi}</p></div>
        <button className="switch-arrow left" onClick={() => move(-1)}><ChevronLeft /></button><button className="switch-arrow right" onClick={() => move(1)}><ChevronRight /></button>
      </aside>

      <section className={`info-card onmyoji-info ${showAllSkills ? 'tray-open' : ''}`}>
        <div className="card-heading"><div><span>THÔNG TIN {character.kind.toUpperCase()}</span><h2>Lv. <strong>{character.level}</strong>/{character.maxLevel}</h2></div><span className="status-chip">Max Lv.40</span></div>
        <div className="stats-grid">{character.stats.map(stat => <div className="stat-row" key={stat.key}><Grade value={String(stat.grade)} /><span>{statLabels[stat.key]?.[language] || stat.label}</span><strong>{stat.value}</strong></div>)}{Object.entries(character.secondaryStats || {}).map(([key, value]) => <div className="stat-row secondary" key={key}><span>{secondaryLabels[key]?.[language] || key}</span><strong>{value}</strong></div>)}</div>

        <div className={`onmyoji-full-tray ${showAllSkills ? 'open' : ''}`} aria-hidden={!showAllSkills}>
          <div className="full-tray-title"><span>{language === 'vi' ? 'Toàn bộ kỹ năng' : language === 'en' ? 'All skills' : '全部技能'}</span></div>
          <div className="full-skill-grid">{character.skills.map((skill, index) => <button key={String(skill.id)} className={skill.id === activeSkill.id ? 'selected' : ''} onClick={() => setActiveSkillId(skill.id)}>
            <SkillIcon skill={skill} fallback={index + 1} /><b>{skill.maxLevel}</b><small>{skill.name[language]}</small>{skill.defaultEquipped && <em>Đang dùng</em>}
          </button>)}</div>
        </div>

        <button className="skill-tray-handle" onClick={() => setShowAllSkills(value => !value)} aria-expanded={showAllSkills} aria-label={showAllSkills ? 'Thu gọn kỹ năng' : 'Mở toàn bộ kỹ năng'}>{showAllSkills ? <ChevronDown /> : <ChevronUp />}</button>
        <div className="skills-dock onmyoji-dock">{equipped.map((skill, index) => <button key={String(skill.id)} className={skill.id === activeSkill.id ? 'selected' : ''} onClick={() => setActiveSkillId(skill.id)}><SkillIcon skill={skill} fallback={index + 1} /><b>{skill.maxLevel}</b><small>{skill.name[language]}</small></button>)}</div>
      </section>

      <article className="skill-scroll">
        <header className="skill-heading"><SkillIcon skill={activeSkill} className="large-glyph" fallback={activeSkill.number} /><div><span>KỸ NĂNG CẤP TỐI ĐA • Lv.{activeSkill.maxLevel}</span><h2>{activeSkill.name[language]}</h2><p>{activeSkill.intro[language]}</p></div>{activeSkill.orbCost > 0 && <div className="orb-cost"><Flame size={18} />{activeSkill.orbCost}</div>}</header>
        <div className="skill-body"><div className="skill-tags"><span>{character.kind}</span><span>{activeSkill.defaultEquipped ? 'Đang trang bị' : 'Có thể thay thế'}</span></div><p className="description"><RichText text={activeSkill.description[language]} language={language} glossary={glossary} onToken={setActiveToken} /></p>{activeSkill.upgrades.length > 0 && <div className="upgrade-list"><h3>{language === 'vi' ? 'Hiệu quả nâng cấp' : language === 'en' ? 'Upgrade effects' : '升级效果'}</h3>{activeSkill.upgrades.map((upgrade, index) => <div key={`${upgrade.level}-${index}`}><b>Lv.{upgrade.level}</b><p><RichText text={upgrade.text[language]} language={language} glossary={glossary} onToken={setActiveToken} /></p></div>)}</div>}</div>
        {activeToken && activeGlossary && <aside className="glossary-popover"><button className="close-popover" onClick={() => setActiveToken(null)}><X size={16} /></button><span className={`glossary-kind ${activeGlossary.kind || 'term'}`}>{activeGlossary.kind === 'buff' ? 'BUFF / DẤU ẤN' : 'THUẬT NGỮ'}</span><div className="glossary-title">{activeGlossary.iconFile && <img src={`/buff-icons/${activeGlossary.iconFile}`} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} />}<h3>{activeGlossary.title?.[language] || activeToken}</h3></div><p><RichText text={activeGlossary.description?.[language]} language={language} glossary={glossary} onToken={setActiveToken} /></p></aside>}
      </article>
    </section>}
  </main>;
}
