'use client';

import { ChevronLeft, ChevronRight, Flame, Info, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import data from './data/shikigami-554.json';

type Language = 'vi' | 'en' | 'zh';
const languages: { id: Language; label: string }[] = [
  { id: 'vi', label: 'Tiếng Việt' }, { id: 'en', label: 'English' }, { id: 'zh', label: '中文' },
];

function RichText({ text }: { text: string }) {
  return <>{text.split(/(\[[^\]]+\])/g).map((chunk, index) =>
    /^\[[^\]]+\]$/.test(chunk)
      ? <span className="game-token" key={`${chunk}-${index}`}>{chunk}</span>
      : <span key={index}>{chunk}</span>)}</>;
}

export default function ShikigamiView() {
  const [activeSkill, setActiveSkill] = useState(2);
  const [language, setLanguage] = useState<Language>('vi');
  const [query, setQuery] = useState('');
  const skill = data.skills[activeSkill];
  const matches = useMemo(() => [data.name.vi, data.name.en, data.name.zh].some(
    (name) => name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [query]);

  return <main className="shiki-shell">
    <div className="scene" aria-hidden="true" />
    <header className="topbar">
      <button className="icon-button" aria-label="Quay lại"><ChevronLeft /></button>
      <div className="brand-lockup"><span>ONMYOJI • THƯ VIỆN THỨC THẦN</span><strong>Thông tin kỹ năng</strong></div>
      <label className="searchbox"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên Việt, Anh hoặc Trung" aria-label="Tìm thức thần" /></label>
      <div className="language-tabs" role="group" aria-label="Ngôn ngữ hiển thị">
        {languages.map((item) => <button key={item.id} className={language === item.id ? 'active' : ''} onClick={() => setLanguage(item.id)}>{item.label}</button>)}
      </div>
    </header>

    {!matches ? <section className="empty-state"><Search /><h1>Chưa tìm thấy thức thần</h1><p>Bản mẫu hiện có {data.name.vi}. Dữ liệu toàn bộ thức thần sẽ được bổ sung ở bước tiếp theo.</p><button onClick={() => setQuery('')}>Xóa tìm kiếm</button></section> :
      <section className="workspace">
        <aside className="identity-panel">
          <div className="rarity">{data.rarity}</div>
          <div className="identity-copy"><span>Thức thần #{data.id}</span><h1>{data.name[language]}</h1><p>{language === 'vi' ? data.name.en : data.name.vi}</p></div>
          <button className="switch-arrow left" aria-label="Thức thần trước"><ChevronLeft /></button>
          <div className="character-frame"><img src="/reference-554.jpg" alt="Phưởng Nguyện Duyên Kết Thần trong game" /><div className="character-fade" /><div className="image-note"><Sparkles size={15} /> Ảnh mẫu • sẽ thay bằng tài nguyên gốc</div></div>
          <button className="switch-arrow right" aria-label="Thức thần sau"><ChevronRight /></button>
        </aside>

        <section className="info-card">
          <div className="card-heading"><div><span>THÔNG TIN THỨC THẦN</span><h2>Lv. <strong>{data.level}</strong>/{data.maxLevel}</h2></div><span className="status-chip">6 sao • đã thức tỉnh</span></div>
          <div className="stats-grid">
            {data.stats.map((stat) => <div className="stat-row" key={stat.key}><span className={`grade grade-${stat.grade.toLowerCase()}`}>{stat.grade}</span><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
            {data.secondaryStats.map((stat) => <div className="stat-row secondary" key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></div>)}
          </div>
          <div className="skills-dock" aria-label="Danh sách kỹ năng">
            {data.skills.map((item, index) => <button key={item.id} className={index === activeSkill ? 'selected' : ''} onClick={() => setActiveSkill(index)} aria-label={`${item.name.vi}, cấp ${item.maxLevel}`}><span className={`skill-glyph glyph-${index + 1}`}>{item.id.toString().slice(-1)}</span><b>{item.maxLevel}</b><small>{item.name[language]}</small></button>)}
          </div>
          <div className="source-note"><Info size={14} /> Chỉ số cơ bản cấp 40, không cộng Ngự Hồn</div>
        </section>

        <article className="skill-scroll">
          <header className="skill-heading"><div className={`large-glyph glyph-${activeSkill + 1}`}>{skill.id.toString().slice(-1)}</div><div><span>KỸ NĂNG CẤP TỐI ĐA • Lv.{skill.maxLevel}</span><h2>{skill.name[language]}</h2><p>{skill.intro[language]}</p></div>{skill.orbCost > 0 && <div className="orb-cost"><Flame size={18} /> {skill.orbCost}</div>}</header>
          <div className="skill-body"><div className="skill-tags"><span>Chiến đấu</span><span>{skill.maxLevel > 1 ? 'Có thể nâng cấp' : 'Kỹ năng đặc biệt'}</span></div><p className="description"><RichText text={skill.description[language]} /></p>
            {skill.upgrades.length > 0 && <div className="upgrade-list"><h3>Hiệu quả nâng cấp</h3>{skill.upgrades.map((upgrade) => <div key={upgrade.level}><b>Lv.{upgrade.level}</b><p><RichText text={upgrade.text} /></p></div>)}</div>}
          </div>
        </article>
      </section>}
  </main>;
}
