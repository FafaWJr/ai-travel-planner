'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

/* ── Destination autocomplete ── */
interface GeoResult { id:number; name:string; country:string; country_code:string; admin1?:string; }

function flagEmoji(code:string) {
  if (!code || code.length!==2) return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6+c.charCodeAt(0)-65));
}

function DestinationInput({ value, onChange }: { value:string; onChange:(v:string)=>void }) {
  const [query,       setQuery]       = useState(value);
  const [results,     setResults]     = useState<GeoResult[]>([]);
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const [thumbs,      setThumbs]      = useState<Record<number,string>>({});
  const containerRef  = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const listRef       = useRef<HTMLUListElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const skipRef       = useRef(false);

  useEffect(() => { if (value !== query) setQuery(value); }, [value]); // eslint-disable-line

  const fetchSuggestions = useCallback(async (q:string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`);
      const data = await res.json();
      const items: GeoResult[] = data.results ?? [];
      setResults(items); setActiveIdx(-1); setThumbs({});
      setOpen(items.length > 0);
      Promise.allSettled(items.map(r =>
        fetch(`/api/place-photo?q=${encodeURIComponent(r.name)}`).then(r=>r.json()).then(d=>({id:r.id,url:d.url as string|null}))
      )).then(settled => {
        const m: Record<number,string> = {};
        settled.forEach(r => { if (r.status==='fulfilled'&&r.value.url) m[r.value.id]=r.value.url; });
        setThumbs(m);
      });
    } catch { setResults([]); setOpen(false); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setQuery(v); onChange(v); skipRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (!skipRef.current) fetchSuggestions(v); }, 300);
  };

  const select = (r: GeoResult) => {
    const parts = [r.name]; if (r.admin1&&r.admin1!==r.name) parts.push(r.admin1); parts.push(r.country);
    const label = parts.join(', ');
    skipRef.current = true; setQuery(label); onChange(label); setOpen(false); setResults([]); setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key==='ArrowDown') { e.preventDefault(); setActiveIdx(i=>Math.min(i+1,results.length-1)); }
    else if (e.key==='ArrowUp') { e.preventDefault(); setActiveIdx(i=>Math.max(i-1,-1)); }
    else if (e.key==='Enter'&&activeIdx>=0) { e.preventDefault(); select(results[activeIdx]); }
    else if (e.key==='Escape') { setOpen(false); setActiveIdx(-1); }
  };

  useEffect(() => {
    if (activeIdx>=0&&listRef.current) (listRef.current.children[activeIdx] as HTMLElement)?.scrollIntoView({block:'nearest'});
  }, [activeIdx]);

  useEffect(() => {
    const h = (e:MouseEvent) => { if (containerRef.current&&!containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return ()=>document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={containerRef} style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:18, pointerEvents:'none', zIndex:1 }}>📍</span>
        <input
          ref={inputRef} type="text" autoComplete="off" value={query}
          onChange={handleChange} onKeyDown={handleKey}
          placeholder="Paris, France · Tokyo, Japan · Bali, Indonesia…"
          style={{
            width:'100%', paddingLeft:48, paddingRight:40, paddingTop:15, paddingBottom:15,
            border:'1.5px solid rgba(0,68,123,0.15)', borderRadius:'var(--r-md)',
            fontFamily:'var(--font-body)', fontSize:16, color:'#000', background:'#fff', outline:'none',
            transition:'border-color 0.18s', boxSizing:'border-box',
          }}
          onFocus={e=>(e.target.style.borderColor='var(--navy)')}
          onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')}
        />
        {loading && (
          <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.8s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(0,68,123,0.2)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--navy)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul ref={listRef} role="listbox" style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:200,
          background:'#fff', borderRadius:'var(--r-md)', border:'1px solid rgba(0,68,123,0.12)',
          boxShadow:'0 8px 32px rgba(0,68,123,0.14)', maxHeight:280, overflowY:'auto',
          listStyle:'none', padding:0, margin:0,
        }}>
          {results.map((r,i) => {
            const active = i===activeIdx;
            const parts = [r.name]; if (r.admin1&&r.admin1!==r.name) parts.push(r.admin1); parts.push(r.country);
            return (
              <li key={r.id} role="option" aria-selected={active}
                onMouseDown={e=>{e.preventDefault();select(r);}}
                onMouseEnter={()=>setActiveIdx(i)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 14px', cursor:'pointer',
                  background: active ? 'rgba(0,68,123,0.05)' : '#fff',
                  borderBottom: i<results.length-1 ? '1px solid rgba(0,68,123,0.06)' : 'none',
                  transition:'background 0.12s',
                }}>
                <div style={{
                  width:40, height:40, borderRadius:10, overflow:'hidden', flexShrink:0,
                  background:'#F4F7FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                }}>
                  {thumbs[r.id]
                    ? <img src={thumbs[r.id]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span>{flagEmoji(r.country_code)}</span>
                  }
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:13 }}>{flagEmoji(r.country_code)}</span>
                    <span style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:14, color:'#000', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--gray-dark)', marginTop:1 }}>
                    {parts.slice(1).join(', ')}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── HeroStepForm ── */
export default function HeroStepForm({ onSubmit, preFilledData }: { onSubmit:(q:string)=>void; preFilledData?:{budget:string;styles:string[]}|null }) {
  const [step, setStep] = useState(0);
  const [dest, setDest] = useState('');
  const [dep, setDep] = useState('');
  const [ret, setRet] = useState('');
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [adultAges, setAdultAges] = useState<string[]>(['','']);
  const [childAges, setChildAges] = useState<string[]>([]);
  const [companion, setCompanion] = useState('couple');
  const [depTime, setDepTime] = useState('');
  const [retTime, setRetTime] = useState('');
  const [styles, setStyles] = useState<string[]>(preFilledData?.styles ?? []);
  const [budget, setBudget] = useState(preFilledData?.budget ?? 'comfort');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});

  const today = new Date().toISOString().split('T')[0];

  const saveFormDraft = () => {
    try {
      localStorage.setItem('luna_trip_draft', JSON.stringify({
        dest, dep, ret, adults, kids, companion, styles, budget, notes,
        updatedAt: new Date().toISOString(),
      }));
    } catch {}
  };

  const goNext = (nextStep: number) => {
    const errs: Record<string,string> = {};
    if (!dest.trim()) errs.dest = 'Please enter your destination.';
    if (!dep) errs.dep = 'Please choose a start date.';
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      saveFormDraft();
      setStep(nextStep);
    }
  };

  useEffect(() => {
    if (preFilledData) { setStyles(preFilledData.styles); setBudget(preFilledData.budget); setStep(1); }
  }, [preFilledData]); // eslint-disable-line

  const setAdultsChecked = (n:number) => {
    setAdults(n);
    setAdultAges(prev=>{const a=[...prev];while(a.length<n)a.push('');return a.slice(0,n);});
    if(n===1&&kids===0) setCompanion('solo'); else if(companion==='solo') setCompanion('couple');
  };
  const setKidsChecked = (n:number) => {
    setKids(n);
    setChildAges(prev=>{const a=[...prev];while(a.length<n)a.push('');return a.slice(0,n);});
    if(adults===1&&n===0) setCompanion('solo');
    else if(n>0&&companion!=='family') setCompanion('family');
    else if(n===0&&companion==='family') setCompanion('couple');
  };
  const toggle = (v:string) => setStyles(p=>p.includes(v)?p.filter(s=>s!==v):[...p,v]);

  const submit = () => {
    if (!dest) { setStep(0); return; }
    const bLabels: Record<string,string> = {budget:'budget-friendly',comfort:'comfortable',premium:'premium',luxury:'luxury'};
    const tripStyles = styles.length ? `focusing on ${styles.join(', ')}` : '';
    const dates = dep ? `from ${dep}${depTime?` (arriving at ${depTime})`:''}${ret?` to ${ret}`:''}${ret&&retTime?` (departing at ${retTime})`:''}` : '';
    const group = `for ${adults} adult${adults>1?'s':''}${kids>0?` and ${kids} child${kids>1?'ren':''}`:''}`;
    const cLabel: Record<string,string> = {solo:'travelling solo',couple:'travelling as a couple',partner:'travelling as a couple',family:'travelling with family',friends:'travelling with friends'};
    const filledAdultAges = adultAges.filter(Boolean);
    const filledChildAges = childAges.filter(Boolean);
    const ageParts = [filledAdultAges.length?`adults aged ${filledAdultAges.join(', ')}`:'',...(filledChildAges.length?[`children aged ${filledChildAges.join(', ')}`]:[])].filter(Boolean);
    const ageCtx = ageParts.length ? `. Traveller ages: ${ageParts.join('; ')}` : '';
    onSubmit(`Plan a trip to ${dest} ${dates} ${group}, ${cLabel[companion]||''}, with ${bLabels[budget]||budget} budget ${tripStyles}${ageCtx}${notes?`. Additional context: ${notes}`:''}`);
  };

  const styleOpts = [
    {v:'cultural',label:'🏛️ Cultural'},{v:'food',label:'🍽️ Food & Drink'},
    {v:'nightlife',label:'🎉 Nightlife'},{v:'shopping',label:'🛍️ Shopping'},
    {v:'family',label:'👨‍👩‍👧 Family'},{v:'adventure',label:'🏔️ Adventure'},
    {v:'beach',label:'🏖️ Beach'},{v:'wellness',label:'🧘 Wellness'},
    {v:'romance',label:'💑 Romance'},{v:'nature',label:'🌿 Nature'},
    {v:'luxury',label:'💎 Luxury'},{v:'photography',label:'📸 Photography'},
    {v:'ski',label:'🎿 Winter Sports'},{v:'safari',label:'🦁 Safari'},
    {v:'roadtrip',label:'🚗 Road Trip'},{v:'citybreak',label:'🏙️ City Break'},
  ];
  const inp: React.CSSProperties = {width:'100%',boxSizing:'border-box' as const,border:'1.5px solid rgba(0,68,123,0.15)',borderRadius:'var(--r-md)',padding:'11px 14px',fontFamily:'var(--font-body)',fontSize:14,color:'#000',background:'#fff',outline:'none',transition:'border-color 0.18s'};
  const lbl: React.CSSProperties = {fontFamily:'var(--font-head)',fontWeight:600,fontSize:11,color:'var(--navy)',marginBottom:6,display:'block',textTransform:'uppercase',letterSpacing:0.8};
  const cBox: React.CSSProperties = {display:'flex',alignItems:'center',background:'#F4F7FB',border:'1.5px solid rgba(0,68,123,0.12)',borderRadius:'var(--r-md)',overflow:'hidden'};
  const cBtn: React.CSSProperties = {width:40,height:40,background:'none',border:'none',color:'var(--navy)',fontSize:20,cursor:'pointer',flexShrink:0};
  const navBtn = (primary=true): React.CSSProperties => ({
    fontFamily:'var(--font-head)',fontWeight:700,fontSize:14,padding:'12px 28px',borderRadius:'var(--r-pill)',border:primary?'none':'1.5px solid rgba(0,68,123,0.15)',
    background:primary?'var(--navy)':'none',color:primary?'#fff':'var(--navy)',cursor:'pointer',transition:'all 0.18s',
  });
  const STEPS = ['Where & When','Travel Style','Budget & Trip'];

  return (
    <div style={{ background:'#fff', borderRadius:'var(--r-lg)', boxShadow:'0 32px 80px rgba(0,0,0,0.28)', overflow:'hidden', textAlign:'left' }}>
      {/* Step header */}
      <div className="step-header" style={{ background:'var(--navy)', padding:'14px 28px', display:'flex', alignItems:'center' }}>
        {STEPS.map((label,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flex:i<STEPS.length-1?1:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <div style={{ width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center', background:i<step?'var(--orange)':i===step?'#fff':'rgba(255,255,255,0.15)', fontFamily:'var(--font-head)',fontWeight:700,fontSize:11, color:i<step?'#fff':i===step?'var(--navy)':'rgba(255,255,255,0.35)', flexShrink:0,transition:'all 0.2s' }}>
                {i<step?'✓':i+1}
              </div>
              <span className="step-label" style={{ fontFamily:'var(--font-head)',fontWeight:i===step?600:400,fontSize:12,color:i===step?'#fff':'rgba(255,255,255,0.40)',whiteSpace:'nowrap' }}>{label}</span>
            </div>
            {i<STEPS.length-1 && <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.15)',margin:'0 10px' }} />}
          </div>
        ))}
      </div>

      <div style={{ padding:'24px 28px' }}>
        {/* Step 0: Where & When */}
        {step===0 && (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div>
              <label style={lbl}>Destination <span style={{ color:'var(--orange)' }}>*</span></label>
              <DestinationInput value={dest} onChange={v=>{setDest(v);if(v.trim())setErrors(p=>({...p,dest:''}));}} />
              {errors.dest && <p style={{ fontFamily:'var(--font-body)',fontSize:12,color:'#E53E3E',marginTop:5,display:'flex',alignItems:'center',gap:4 }}>⚠ {errors.dest}</p>}
            </div>

            <div>
              <label style={lbl}>From <span style={{ color:'var(--orange)' }}>*</span></label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:0 }}>
                  <input type="date" value={dep} min={today}
                    onChange={e=>{setDep(e.target.value);if(ret&&e.target.value>ret)setRet('');if(e.target.value)setErrors(p=>({...p,dep:''}));}}
                    style={{...inp,borderColor:errors.dep?'#E53E3E':'rgba(0,68,123,0.15)'}}
                    onFocus={e=>(e.target.style.borderColor=errors.dep?'#E53E3E':'var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor=errors.dep?'#E53E3E':'rgba(0,68,123,0.15)')} />
                </div>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',whiteSpace:'nowrap',flexShrink:0 }}>Est. arrival</span>
                <div style={{ position:'relative', width:110, flexShrink:0 }}>
                  <input type="time" value={depTime} onChange={e=>setDepTime(e.target.value)}
                    style={{...inp,padding:'11px 8px'}}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
              </div>
              {errors.dep && <p style={{ fontFamily:'var(--font-body)',fontSize:12,color:'#E53E3E',marginTop:5,display:'flex',alignItems:'center',gap:4 }}>⚠ {errors.dep}</p>}
            </div>

            <div>
              <label style={lbl}>To <span style={{ fontFamily:'var(--font-body)',fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--gray-dark)' }}>(optional)</span></label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:0 }}>
                  <input type="date" value={ret} min={dep || today}
                    onChange={e=>setRet(e.target.value)}
                    style={inp}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',whiteSpace:'nowrap',flexShrink:0 }}>Est. return</span>
                <div style={{ position:'relative', width:110, flexShrink:0 }}>
                  <input type="time" value={retTime} onChange={e=>setRetTime(e.target.value)}
                    style={{...inp,padding:'11px 8px'}}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
              </div>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {([['Adults',adults,setAdultsChecked,1],['Children',kids,setKidsChecked,0]] as const).map(([l,val,set,min])=>(
                <div key={l as string}>
                  <label style={lbl}>{l as string}</label>
                  <div style={cBox}>
                    <button onClick={()=>(set as (n:number)=>void)(Math.max(min as number,(val as number)-1))} style={cBtn}>−</button>
                    <span style={{ flex:1,textAlign:'center',fontFamily:'var(--font-head)',fontWeight:700,fontSize:18,color:'var(--navy)' }}>{val as number}</span>
                    <button onClick={()=>(set as (n:number)=>void)((val as number)+1)} style={cBtn}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {(adults>0||kids>0) && (
              <div>
                <p style={{ fontFamily:'var(--font-head)',fontWeight:500,fontSize:10,color:'var(--gray-dark)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8 }}>Ages <span style={{ fontWeight:400,textTransform:'none',letterSpacing:0 }}>(optional)</span></p>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                  {adultAges.map((age,i)=>(
                    <div key={`a${i}`} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <input type="number" min={1} max={99} value={age} placeholder="—" onChange={e=>setAdultAges(p=>{const a=[...p];a[i]=e.target.value;return a;})} style={{ width:46,padding:'6px 0',textAlign:'center',background:'#F4F7FB',border:'1.5px solid rgba(0,68,123,0.12)',borderRadius:8,fontFamily:'var(--font-head)',fontWeight:600,fontSize:13,color:'var(--navy)',outline:'none' }} onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.12)')} />
                      <span style={{ fontFamily:'var(--font-body)',fontSize:9,color:'var(--gray-dark)' }}>Adult {adults>1?i+1:''}</span>
                    </div>
                  ))}
                  {childAges.map((age,i)=>(
                    <div key={`c${i}`} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <input type="number" min={1} max={17} value={age} placeholder="—" onChange={e=>setChildAges(p=>{const a=[...p];a[i]=e.target.value;return a;})} style={{ width:46,padding:'6px 0',textAlign:'center',background:'rgba(255,130,16,0.06)',border:'1.5px solid rgba(255,130,16,0.20)',borderRadius:8,fontFamily:'var(--font-head)',fontWeight:600,fontSize:13,color:'var(--navy)',outline:'none' }} onFocus={e=>(e.target.style.borderColor='var(--orange)')} onBlur={e=>(e.target.style.borderColor='rgba(255,130,16,0.20)')} />
                      <span style={{ fontFamily:'var(--font-body)',fontSize:9,color:'var(--gray-dark)' }}>Child {kids>1?i+1:''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex',justifyContent:'flex-end',paddingTop:4 }}>
              <button onClick={()=>goNext(1)} style={navBtn()}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 1: Travelling With + Trip Style */}
        {step===1 && (
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>Travelling with</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {[{v:'solo',icon:'🧳',l:'Solo'},{v:'couple',icon:'💑',l:'Couple'},{v:'family',icon:'👨‍👩‍👧',l:'Family'},{v:'friends',icon:'🧑‍🤝‍🧑',l:'Friends'}].map(opt=>{
                  const active=companion===opt.v;
                  return (
                    <button key={opt.v} onClick={()=>setCompanion(opt.v)} style={{ background:active?'rgba(0,68,123,0.07)':'#F4F7FB',border:`2px solid ${active?'var(--navy)':'transparent'}`,borderRadius:'var(--r-md)',padding:'12px 6px',cursor:'pointer',textAlign:'center',transition:'all 0.15s' }}>
                      <div style={{ fontSize:20,marginBottom:4 }}>{opt.icon}</div>
                      <div style={{ fontFamily:'var(--font-head)',fontWeight:active?700:500,fontSize:12,color:active?'var(--navy)':'#333' }}>{opt.l}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>Trip Style {styles.length>0&&<span style={{ fontFamily:'var(--font-body)',fontWeight:400,fontSize:10,color:'var(--orange)',textTransform:'none',letterSpacing:0,marginLeft:4 }}>{styles.length} selected</span>}</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {styleOpts.map(o=>{const active=styles.includes(o.v);return(<button key={o.v} onClick={()=>toggle(o.v)} style={{ background:active?'rgba(255,130,16,0.10)':'#F4F7FB',border:`1.5px solid ${active?'var(--orange)':'rgba(0,68,123,0.10)'}`,color:active?'var(--orange)':'#333',fontFamily:'var(--font-head)',fontWeight:active?600:400,fontSize:12,borderRadius:'var(--r-pill)',padding:'6px 13px',cursor:'pointer',transition:'all 0.15s' }}>{o.label}</button>);})}
              </div>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',paddingTop:4 }}>
              <button onClick={()=>setStep(0)} style={navBtn(false)}>← Back</button>
              <button onClick={()=>{ saveFormDraft(); setStep(2); }} style={navBtn()}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 2: Budget + Notes */}
        {step===2 && (
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>Budget Level</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {[{v:'budget',e:'🎒',l:'Budget',s:'< $80 / day'},{v:'comfort',e:'🏨',l:'Comfort',s:'$80–150 / day'},{v:'premium',e:'🌟',l:'Premium',s:'$150–350 / day'},{v:'luxury',e:'💎',l:'Luxury',s:'$350+ / day'}].map(b=>{
                  const active=budget===b.v;
                  return(<button key={b.v} onClick={()=>setBudget(b.v)} style={{ background:active?'rgba(0,68,123,0.07)':'#F4F7FB',border:`2px solid ${active?'var(--navy)':'transparent'}`,borderRadius:'var(--r-md)',padding:'14px 8px',cursor:'pointer',textAlign:'center',transition:'all 0.15s' }}>
                    <div style={{ fontSize:22,marginBottom:5 }}>{b.e}</div>
                    <div style={{ fontFamily:'var(--font-head)',fontWeight:700,fontSize:12,color:active?'var(--navy)':'#000',marginBottom:2 }}>{b.l}</div>
                    <div style={{ fontFamily:'var(--font-body)',color:'var(--gray-dark)',fontSize:10 }}>{b.s}</div>
                  </button>);
                })}
              </div>
            </div>
            <div>
              <label style={lbl}>Describe your ideal trip <span style={{ fontFamily:'var(--font-body)',fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--gray-dark)' }}>(optional)</span></label>
              <p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',marginBottom:8,lineHeight:1.5 }}>Vibe, pace, must-see spots, dietary needs, occasions — anything that makes this trip special.</p>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Slow-paced honeymoon focused on local food and hidden gems. One of us is vegetarian. Avoid big tourist crowds." maxLength={600} rows={3} style={{ ...inp,resize:'vertical' }} onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',paddingTop:4 }}>
              <button onClick={()=>setStep(1)} style={navBtn(false)}>← Back</button>
              <button onClick={submit} style={{ ...navBtn(),background:'var(--orange)',boxShadow:'0 6px 20px rgba(255,130,16,0.30)',letterSpacing:0.3 }}>✈ Let&apos;s Go!</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
