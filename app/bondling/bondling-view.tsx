'use client';

import { ChevronDown, ChevronUp, ListFilter, PawPrint, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DonateButton from '../donate-button';

type Language = 'vi'|'en'|'zh';
type Text3 = Record<Language,string>;
type Rune = {id:number;order:number;name:Text3;levels:{level:number;text:Text3}[];iconFile:string};
type RuneGroup = {onmyojiId:number;onmyojiName:string;runes:Rune[]};
type Bondling = {id:number;order:number;name:Text3;bonusStat:string;bonusValue:string;forceName:Text3;forceDescription:Text3;assets:{chibiFile:string;fullImageFile:string}};
type Data = {count:number;bondlings:Bondling[];runeGroups:RuneGroup[]};
const languages:{id:Language;label:string}[]=[{id:'vi',label:'VN'},{id:'en',label:'EN'},{id:'zh',label:'中文'}];

function Art({file,label,kind}:{file:string;label:string;kind:'chibi'|'full'}) {
  const [bad,setBad]=useState(false); useEffect(()=>setBad(false),[file]);
  const src=file?`/bondlings/${kind}/${file}`:'';
  return <span className={`bondling-art ${kind} ${bad||!file?'missing':''}`}>{src&&!bad&&<img src={src} alt="" onError={()=>setBad(true)}/>}<PawPrint/><b>{label.slice(0,2).toUpperCase()}</b></span>;
}

function BonusIcon({stat}:{stat:string}) {
  const normalized=stat.toUpperCase();
  const icon=normalized==='DEF'?'def':normalized==='HP'?'hp':'atk';
  return <span className={`bondling-stat-icon stat-${icon}`} aria-hidden="true"><img src={`/bondlings/icons/stat-${icon}.webp`} alt=""/></span>;
}

export default function BondlingView(){
  const [data,setData]=useState<Data|null>(null),[language,setLanguage]=useState<Language>('vi'),[selectedId,setSelectedId]=useState<number|null>(null),[showRunes,setShowRunes]=useState(false),[groupId,setGroupId]=useState<number|null>(null),[activeRune,setActiveRune]=useState<number|null>(null),[query,setQuery]=useState('');
  useEffect(()=>{fetch('/data/bondlings.json').then(r=>r.json()).then((d:Data)=>{setData(d);const q=Number(new URLSearchParams(location.search).get('id'));setSelectedId(d.bondlings.some(x=>x.id===q)?q:d.bondlings[0]?.id);setGroupId(d.runeGroups[0]?.onmyojiId??null);});},[]);
  const pet=useMemo(()=>data?.bondlings.find(x=>x.id===selectedId)||data?.bondlings[0],[data,selectedId]);
  const group=useMemo(()=>data?.runeGroups.find(x=>x.onmyojiId===groupId)||data?.runeGroups[0],[data,groupId]);
  const rune=group?.runes.find(x=>x.id===activeRune)||group?.runes[0];
  const visiblePets=useMemo(()=>{const q=query.trim().toLocaleLowerCase();return data?.bondlings.filter(x=>!q||Object.values(x.name).some(v=>String(v||'').toLocaleLowerCase().includes(q)))||[]},[data,query]);
  useEffect(()=>{if(pet)history.replaceState(null,'',`/bondling?id=${pet.id}`)},[pet]);
  if(!data||!pet)return <main className="shiki-shell ui-asset-preview"><div className="scene"/><section className="empty-state"><span className="loader"/><h1>Đang nạp dữ liệu…</h1></section></main>;
  return <main className="shiki-shell ui-asset-preview bondling-shell"><div className="scene" aria-hidden="true"/>
    <header className="topbar bondling-topbar"><button className="icon-button" onClick={()=>document.getElementById('bondling-catalog')?.scrollIntoView({behavior:'smooth'})} aria-label="Đi đến danh sách Khiết Linh"><ListFilter/></button><div className="brand-lockup"><span>ONMYOJI • BONDLING FAIRYLAND</span><strong>{data.count} Bondling</strong></div><nav className="section-nav"><a className="section-link" href="/">Thức thần</a><a className="section-link" href="/onmyoji">Âm Dương Sư</a><a className="section-link" href="/ngu-hon">Ngự hồn</a><a className="section-link active" href="/bondling">Khiết Linh</a></nav><label className="searchbox"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm Bondling"/></label><div className="language-tabs">{languages.map(x=><button key={x.id} className={language===x.id?'active':''} onClick={()=>setLanguage(x.id)}>{x.label}</button>)}</div><DonateButton /></header>
    <section className={`bondling-workspace ${showRunes?'runes-open':''}`}>
      <aside className="bondling-picker" id="bondling-catalog"><div className="bondling-title"><span>DANH SÁCH</span><strong>{visiblePets.length} Bondling</strong></div><div className="bondling-list">{visiblePets.map(x=><button key={x.id} className={x.id===pet.id?'selected':''} onClick={()=>setSelectedId(x.id)}><Art file={x.assets.chibiFile} label={x.name[language]||x.name.en} kind="chibi"/><span><strong>{x.name[language]||x.name.en}</strong><small>{x.bonusStat}</small></span></button>)}</div></aside>
      <section className="bondling-stage"><div className="bondling-stage-label"><span>KHẾ LINH #{pet.id}</span><h1>{pet.name[language]||pet.name.en}</h1></div><Art file={pet.assets.fullImageFile} label={pet.name[language]||pet.name.en} kind="full"/><button className="possible-rune-button" onClick={()=>setShowRunes(true)}><ChevronUp/>Thuật Ấn khả dụng</button></section>
      <article className="bondling-info">
        <section className="bondling-info-section">
          <header><h2>Stat Bonuses</h2><span>Chỉ số cộng thêm</span></header>
          <div className="bondling-bonus"><BonusIcon stat={pet.bonusStat}/><div><b>{pet.bonusStat}</b><span>{pet.bonusValue||'Chưa có giá trị trong dữ liệu'}</span></div></div>
        </section>
        <section className="bondling-info-section core-skill-section">
          <header><h2>Core Skill</h2><span>Kỹ năng chính</span></header>
          <div className="bondling-core-skill">
            <span className="bondling-core-icon"><img src={`/bondlings/icons/core-${pet.id}.webp`} alt="" onError={event=>event.currentTarget.style.display='none'}/><PawPrint/></span>
            <div className="force-copy"><h3>{pet.forceName[language]||pet.forceName.en}</h3><p>{pet.forceDescription[language]||pet.forceDescription.en}</p></div>
          </div>
        </section>
      </article>
      <section className="rune-overlay" aria-hidden={!showRunes}><button className="rune-close" onClick={()=>setShowRunes(false)}><ChevronDown/><span>Thu bảng Thuật Ấn</span></button><div className="rune-panel"><header><div><span>POSSIBLE RUNES</span><h2>{group?.onmyojiName}</h2></div><button onClick={()=>setShowRunes(false)}><X/></button></header><nav>{data.runeGroups.map(g=><button key={g.onmyojiId} className={g.onmyojiId===group?.onmyojiId?'active':''} onClick={()=>{setGroupId(g.onmyojiId);setActiveRune(g.runes[0]?.id??null)}}>{g.onmyojiName}</button>)}</nav><div className="rune-content"><div className="rune-grid">{group?.runes.map((r,i)=><button key={r.id} className={r.id===rune?.id?'selected':''} onClick={()=>setActiveRune(r.id)}><span className="rune-icon">{r.iconFile&&<img src={`/skill-icons/${r.iconFile}`} alt="" onError={e=>e.currentTarget.style.display='none'}/>}<i>{i+1}</i></span><b>{r.name[language]||r.name.en}</b></button>)}</div>{rune&&<article className="rune-detail"><span>RUNE #{rune.id}</span><h3>{rune.name[language]||rune.name.en}</h3>{rune.levels.map(l=><div key={l.level}><b>Lv.{l.level}</b><p>{l.text[language]||l.text.en}</p></div>)}</article>}</div></div></section>
    </section>
  </main>;
}
