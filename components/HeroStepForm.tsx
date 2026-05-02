'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

/* ── Destination autocomplete ── */
interface GeoResult { id:number; name:string; country:string; country_code:string; admin1?:string; }

function flagEmoji(code:string) {
  if (!code || code.length!==2) return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6+c.charCodeAt(0)-65));
}

function DestinationInput({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder:string }) {
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
          placeholder={placeholder}
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
  const t = useTranslations('start');

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
  const [showLoginGate, setShowLoginGate] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

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
    if (!dest.trim()) errs.dest = t('errDest');
    if (!dep) errs.dep = t('errDep');
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

  const buildPrompt = () => {
    const bLabels: Record<string,string> = {budget:'budget-friendly',comfort:'comfortable',premium:'premium',luxury:'luxury'};
    const tripStyles = styles.length ? `focusing on ${styles.join(', ')}` : '';
    const dates = dep ? `from ${dep}${depTime?` (arriving at ${depTime})`:''}${ret?` to ${ret}`:''}${ret&&retTime?` (departing at ${retTime})`:''}` : '';
    const group = `for ${adults} adult${adults>1?'s':''}${kids>0?` and ${kids} child${kids>1?'ren':''}`:''}`;
    const cLabel: Record<string,string> = {solo:'travelling solo',couple:'travelling as a couple',partner:'travelling as a couple',family:'travelling with family',friends:'travelling with friends'};
    const filledAdultAges = adultAges.filter(Boolean);
    const filledChildAges = childAges.filter(Boolean);
    const ageParts = [filledAdultAges.length?`adults aged ${filledAdultAges.join(', ')}`:'',...(filledChildAges.length?[`children aged ${filledChildAges.join(', ')}`]:[])].filter(Boolean);
    const ageCtx = ageParts.length ? `. Traveller ages: ${ageParts.join('; ')}` : '';
    return `Plan a trip to ${dest} ${dates} ${group}, ${cLabel[companion]||''}, with ${bLabels[budget]||budget} budget ${tripStyles}${ageCtx}${notes?`. Additional context: ${notes}`:''}`;
  };

  const submit = async () => {
    if (!dest) { setStep(0); return; }
    const builtPrompt = buildPrompt();

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      try {
        localStorage.setItem('luna_trip_draft', JSON.stringify({
          dest, dep, ret, adults, kids, companion, styles, budget, notes,
          prompt: builtPrompt,
          updatedAt: new Date().toISOString(),
        }));
        localStorage.setItem('luna_redirect_after_login', '/plan?autoGenerate=true');
      } catch {}
      setShowLoginGate(true);
      return;
    }

    onSubmit(builtPrompt);
  };

  const handleGoogleLogin = async () => {
    setLoginLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setLoginLoading(false);
  };

  const styleOpts = [
    {v:'cultural',e:'🏛️',label:t('styles.cultural')},{v:'food',e:'🍽️',label:t('styles.foodDrink')},
    {v:'nightlife',e:'🎉',label:t('styles.nightlife')},{v:'shopping',e:'🛍️',label:t('styles.shopping')},
    {v:'family',e:'👨‍👩‍👧',label:t('styles.family')},{v:'adventure',e:'🏔️',label:t('styles.adventure')},
    {v:'beach',e:'🏖️',label:t('styles.beach')},{v:'wellness',e:'🧘',label:t('styles.wellness')},
    {v:'romance',e:'💑',label:t('styles.romance')},{v:'nature',e:'🌿',label:t('styles.nature')},
    {v:'luxury',e:'💎',label:t('styles.luxuryStyle')},{v:'photography',e:'📸',label:t('styles.photography')},
    {v:'ski',e:'🎿',label:t('styles.winterSports')},{v:'safari',e:'🦁',label:t('styles.safari')},
    {v:'roadtrip',e:'🚗',label:t('styles.roadTrip')},{v:'citybreak',e:'🏙️',label:t('styles.cityBreak')},
  ];
  const inp: React.CSSProperties = {width:'100%',boxSizing:'border-box' as const,border:'1.5px solid rgba(0,68,123,0.15)',borderRadius:'var(--r-md)',padding:'11px 14px',fontFamily:'var(--font-body)',fontSize:14,color:'#000',background:'#fff',outline:'none',transition:'border-color 0.18s'};
  const lbl: React.CSSProperties = {fontFamily:'var(--font-head)',fontWeight:600,fontSize:11,color:'var(--navy)',marginBottom:6,display:'block',textTransform:'uppercase',letterSpacing:0.8};
  const cBox: React.CSSProperties = {display:'flex',alignItems:'center',background:'#F4F7FB',border:'1.5px solid rgba(0,68,123,0.12)',borderRadius:'var(--r-md)',overflow:'hidden'};
  const cBtn: React.CSSProperties = {width:40,height:40,background:'none',border:'none',color:'var(--navy)',fontSize:20,cursor:'pointer',flexShrink:0};
  const navBtn = (primary=true): React.CSSProperties => ({
    fontFamily:'var(--font-head)',fontWeight:700,fontSize:14,padding:'12px 28px',borderRadius:'var(--r-pill)',border:primary?'none':'1.5px solid rgba(0,68,123,0.15)',
    background:primary?'var(--navy)':'none',color:primary?'#fff':'var(--navy)',cursor:'pointer',transition:'all 0.18s',
  });
  const STEPS = [t('step1'), t('step2'), t('step3')];

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
              <label style={lbl}>{t('destination')} <span style={{ color:'var(--orange)' }}>*</span></label>
              <DestinationInput value={dest} onChange={v=>{setDest(v);if(v.trim())setErrors(p=>({...p,dest:''}));}} placeholder={t('destinationPlaceholder')} />
              {errors.dest && <p style={{ fontFamily:'var(--font-body)',fontSize:12,color:'#E53E3E',marginTop:5,display:'flex',alignItems:'center',gap:4 }}>⚠ {errors.dest}</p>}
            </div>

            <div>
              <label style={lbl}>{t('from')} <span style={{ color:'var(--orange)' }}>*</span></label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:0 }}>
                  <input type="date" value={dep} min={today}
                    onChange={e=>{const v=e.target.value;if(v&&v<today){setDep('');return;}setDep(v);if(ret&&v>ret)setRet('');if(v)setErrors(p=>({...p,dep:''}));}}
                    style={{...inp,borderColor:errors.dep?'#E53E3E':'rgba(0,68,123,0.15)'}}
                    onFocus={e=>(e.target.style.borderColor=errors.dep?'#E53E3E':'var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor=errors.dep?'#E53E3E':'rgba(0,68,123,0.15)')} />
                </div>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',whiteSpace:'nowrap',flexShrink:0 }}>{t('estArrival')}</span>
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
              <label style={lbl}>{t('to')} <span style={{ fontFamily:'var(--font-body)',fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--gray-dark)' }}>({t('optional')})</span></label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:0 }}>
                  <input type="date" value={ret} min={dep || today}
                    onChange={e=>{const v=e.target.value;if(v&&v<(dep||today)){setRet('');return;}setRet(v);}}
                    style={inp}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',whiteSpace:'nowrap',flexShrink:0 }}>{t('estReturn')}</span>
                <div style={{ position:'relative', width:110, flexShrink:0 }}>
                  <input type="time" value={retTime} onChange={e=>setRetTime(e.target.value)}
                    style={{...inp,padding:'11px 8px'}}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
              </div>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {([
                [t('adults'), adults, setAdultsChecked, 1],
                [t('children'), kids, setKidsChecked, 0],
              ] as const).map(([l,val,set,min])=>(
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
                <p style={{ fontFamily:'var(--font-head)',fontWeight:500,fontSize:10,color:'var(--gray-dark)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8 }}>{t('ages')} <span style={{ fontWeight:400,textTransform:'none',letterSpacing:0 }}>({t('optional')})</span></p>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                  {adultAges.map((age,i)=>(
                    <div key={`a${i}`} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <input type="number" min={1} max={99} value={age} placeholder="—" onChange={e=>setAdultAges(p=>{const a=[...p];a[i]=e.target.value;return a;})} style={{ width:46,padding:'6px 0',textAlign:'center',background:'#F4F7FB',border:'1.5px solid rgba(0,68,123,0.12)',borderRadius:8,fontFamily:'var(--font-head)',fontWeight:600,fontSize:13,color:'var(--navy)',outline:'none' }} onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.12)')} />
                      <span style={{ fontFamily:'var(--font-body)',fontSize:9,color:'var(--gray-dark)' }}>{t('adult')} {adults>1?i+1:''}</span>
                    </div>
                  ))}
                  {childAges.map((age,i)=>(
                    <div key={`c${i}`} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <input type="number" min={1} max={17} value={age} placeholder="—" onChange={e=>setChildAges(p=>{const a=[...p];a[i]=e.target.value;return a;})} style={{ width:46,padding:'6px 0',textAlign:'center',background:'rgba(255,130,16,0.06)',border:'1.5px solid rgba(255,130,16,0.20)',borderRadius:8,fontFamily:'var(--font-head)',fontWeight:600,fontSize:13,color:'var(--navy)',outline:'none' }} onFocus={e=>(e.target.style.borderColor='var(--orange)')} onBlur={e=>(e.target.style.borderColor='rgba(255,130,16,0.20)')} />
                      <span style={{ fontFamily:'var(--font-body)',fontSize:9,color:'var(--gray-dark)' }}>{t('child')} {kids>1?i+1:''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex',justifyContent:'flex-end',paddingTop:4 }}>
              <button onClick={()=>goNext(1)} style={navBtn()}>{t('next')} →</button>
            </div>
          </div>
        )}

        {/* Step 1: Travelling With + Trip Style */}
        {step===1 && (
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>{t('travellingWith')}</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {[{v:'solo',icon:'🧳',l:t('companions.solo')},{v:'couple',icon:'💑',l:t('companions.couple')},{v:'family',icon:'👨‍👩‍👧',l:t('companions.family')},{v:'friends',icon:'🧑‍🤝‍🧑',l:t('companions.friends')}].map(opt=>{
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
              <label style={{ ...lbl,marginBottom:10 }}>{t('travelStyles')} {styles.length>0&&<span style={{ fontFamily:'var(--font-body)',fontWeight:400,fontSize:10,color:'var(--orange)',textTransform:'none',letterSpacing:0,marginLeft:4 }}>{styles.length} {t('selected')}</span>}</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {styleOpts.map(o=>{const active=styles.includes(o.v);return(<button key={o.v} onClick={()=>toggle(o.v)} style={{ background:active?'rgba(255,130,16,0.10)':'#F4F7FB',border:`1.5px solid ${active?'var(--orange)':'rgba(0,68,123,0.10)'}`,color:active?'var(--orange)':'#333',fontFamily:'var(--font-head)',fontWeight:active?600:400,fontSize:12,borderRadius:'var(--r-pill)',padding:'6px 13px',cursor:'pointer',transition:'all 0.15s' }}>{o.e} {o.label}</button>);})}
              </div>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',paddingTop:4 }}>
              <button onClick={()=>setStep(0)} style={navBtn(false)}>← {t('back')}</button>
              <button onClick={()=>{ saveFormDraft(); setStep(2); }} style={navBtn()}>{t('next')} →</button>
            </div>
          </div>
        )}

        {/* Step 2: Budget + Notes */}
        {step===2 && (
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>{t('budgetLevel')}</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {[{v:'budget',e:'🎒',l:t('budgetLevels.budget'),s:'< $80 / day'},{v:'comfort',e:'🏨',l:t('budgetLevels.comfort'),s:'$80–150 / day'},{v:'premium',e:'🌟',l:t('budgetLevels.premium'),s:'$150–350 / day'},{v:'luxury',e:'💎',l:t('budgetLevels.luxury'),s:'$350+ / day'}].map(b=>{
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
              <label style={lbl}>{t('idealTrip')} <span style={{ fontFamily:'var(--font-body)',fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--gray-dark)' }}>({t('optional')})</span></label>
              <p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',marginBottom:8,lineHeight:1.5 }}>{t('idealTripHint')}</p>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder={t('idealTripPlaceholder')} maxLength={600} rows={3} style={{ ...inp,resize:'vertical' }} onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',paddingTop:4 }}>
              <button onClick={()=>setStep(1)} style={navBtn(false)}>← {t('back')}</button>
              <button onClick={submit} style={{ ...navBtn(),background:'var(--orange)',boxShadow:'0 6px 20px rgba(255,130,16,0.30)',letterSpacing:0.3 }}>{t('generate')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Login gate modal */}
      {showLoginGate && (
        <div
          style={{ position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.60)',backdropFilter:'blur(4px)' }}
          onClick={() => setShowLoginGate(false)}
        >
          <div
            style={{ background:'#fff',borderRadius:20,padding:'40px 32px',maxWidth:360,width:'calc(100% - 48px)',boxShadow:'0 24px 80px rgba(0,0,0,0.20)',textAlign:'center' }}
            onClick={e => e.stopPropagation()}
          >
            <img src="/luna_BLUE.png" alt="Luna" style={{ width:72,height:72,objectFit:'contain',margin:'0 auto 16px' }} />

            <h2 style={{ fontFamily:'var(--font-head)',fontWeight:700,fontSize:20,color:'#00447B',marginBottom:8 }}>
              Your trip is ready!
            </h2>
            <p style={{ fontFamily:'var(--font-body)',fontSize:14,color:'#6C6D6F',marginBottom:28,lineHeight:1.6 }}>
              Sign in to generate your personalised itinerary. It only takes a second.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loginLoading}
              style={{ width:'100%',padding:'12px 20px',border:'1.5px solid rgba(0,68,123,0.18)',borderRadius:12,background:'#fff',cursor:loginLoading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:12,fontFamily:'var(--font-head)',fontWeight:600,fontSize:14,color:'#333',transition:'background 0.15s',opacity:loginLoading?0.6:1 }}
              onMouseEnter={e => { if (!loginLoading) (e.currentTarget as HTMLButtonElement).style.background = '#F4F7FB'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loginLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <button
              onClick={() => setShowLoginGate(false)}
              style={{ marginTop:16,background:'none',border:'none',fontFamily:'var(--font-body)',fontSize:12,color:'#6C6D6F',textDecoration:'underline',cursor:'pointer',padding:0 }}
            >
              Go back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
