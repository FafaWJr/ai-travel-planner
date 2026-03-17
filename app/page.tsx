'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/* ── Brand Icon components (flat, 2-colour: #FF8210 + #00447B) ── */
const IconCompass = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="#00447B" strokeWidth="2"/>
    <polygon points="16,6 19,16 16,14 13,16" fill="#FF8210"/>
    <polygon points="16,26 13,16 16,18 19,16" fill="#00447B"/>
  </svg>
);
const IconBolt = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M18 4L8 18h8l-2 10 14-16h-8l2-8z" fill="#FF8210"/>
  </svg>
);
const IconMap = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M4 6l8 4 8-4 8 4v20l-8-4-8 4-8-4V6z" fill="#00447B" opacity=".15"/>
    <path d="M12 10l8-4v20l-8 4V10z" fill="#00447B"/>
    <path d="M4 6l8 4v20L4 26V6z" fill="#679AC1"/>
    <path d="M20 6l8 4v20l-8-4V6z" fill="#FF8210" opacity=".7"/>
  </svg>
);
const IconStar = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M16 4l3 8h8l-6.5 5 2.5 8L16 20l-7 5 2.5-8L5 12h8z" fill="#FF8210"/>
  </svg>
);
const IconChat = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <rect x="4" y="6" width="24" height="16" rx="4" fill="#00447B"/>
    <path d="M10 28l4-6h8l4 6H10z" fill="#00447B"/>
    <rect x="9" y="11" width="14" height="2" rx="1" fill="#FF8210"/>
    <rect x="9" y="15" width="10" height="2" rx="1" fill="white" opacity=".6"/>
  </svg>
);
const IconShield = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M16 4l10 4v8c0 6-4 10-10 12C10 26 6 22 6 16V8l10-4z" fill="#00447B" opacity=".15"/>
    <path d="M16 4l10 4v8c0 6-4 10-10 12C10 26 6 22 6 16V8l10-4z" stroke="#00447B" strokeWidth="1.5"/>
    <path d="M11 16l3 3 7-7" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Data ── */
const DESTINATIONS = [
  { name:'Santorini',   country:'Greece',    tag:'Romance',   color:'#FF8210', img:'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80' },
  { name:'Kyoto',       country:'Japan',     tag:'Culture',   color:'#00447B', img:'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80' },
  { name:'Patagonia',   country:'Argentina', tag:'Adventure', color:'#679AC1', img:'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=80' },
  { name:'Marrakech',   country:'Morocco',   tag:'Discovery', color:'#FFBD59', img:'https://images.unsplash.com/photo-1553603229-f8fd3f0e50ce?auto=format&fit=crop&w=800&q=80' },
  { name:'Amalfi Coast',country:'Italy',     tag:'Luxury',    color:'#FF8210', img:'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80' },
  { name:'Bali',        country:'Indonesia', tag:'Wellness',  color:'#00447B', img:'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=800&q=80' },
];

const QUICK_IDEAS = [
  { icon:'🏖️', label:'Beach escape',   query:'A relaxing 7-day beach escape' },
  { icon:'🗺️', label:'Road trip',       query:'An epic road trip adventure' },
  { icon:'🏔️', label:'Mountain trek',   query:'A mountain trekking adventure' },
  { icon:'🏛️', label:'Culture tour',    query:'A cultural and history tour' },
  { icon:'💑', label:'Romantic',        query:'A romantic couple getaway' },
  { icon:'👨‍👩‍👧', label:'Family fun',  query:'A fun family vacation' },
];

const QUIZ_QUESTIONS = [
  { q:'What is your ideal travel vibe?', opts:[{e:'🌴',l:'Relax & unwind',v:'relaxation'},{e:'🧗',l:'Thrill & adventure',v:'adventure'},{e:'🎭',l:'Culture & history',v:'culture'},{e:'🍷',l:'Food & nightlife',v:'food'}] },
  { q:'How do you prefer to travel?',    opts:[{e:'✈️',l:'Fly everywhere',v:'fly'},{e:'🚗',l:'Road trip',v:'drive'},{e:'🚂',l:'Train journeys',v:'train'},{e:'🚢',l:'Cruise',v:'cruise'}] },
  { q:'What is your budget style?',      opts:[{e:'🎒',l:'Budget backpacker',v:'budget'},{e:'🏨',l:'Mid-range comfort',v:'midrange'},{e:'💎',l:'Luxury splurge',v:'luxury'},{e:'🤷',l:'It depends',v:'flexible'}] },
  { q:'How long is your ideal trip?',    opts:[{e:'⚡',l:'Weekend getaway',v:'weekend'},{e:'📅',l:'1 week',v:'1week'},{e:'🗓️',l:'2 weeks',v:'2weeks'},{e:'🌍',l:'A month+',v:'month'}] },
];

const TRIP_IDEAS = [
  { title:'10 Days in Japan', sub:'Tokyo to Kyoto', img:'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80', tags:['Culture','Food'], dur:'10 days', bud:'Mid-range', q:'Plan a 10-day trip in Japan from Tokyo to Kyoto focusing on culture and food' },
  { title:'Greek Island Hopping', sub:'Santorini, Mykonos & Rhodes', img:'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80', tags:['Romance','Beach'], dur:'14 days', bud:'Premium', q:'Plan a 14-day Greek island hopping trip' },
  { title:'Patagonia Adventure', sub:'Argentina & Chile', img:'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80', tags:['Adventure','Hiking'], dur:'12 days', bud:'Mid-range', q:'Plan a 12-day Patagonia adventure covering Argentina and Chile' },
  { title:'Morocco Highlights', sub:'Marrakech to Sahara', img:'https://images.unsplash.com/photo-1553603229-f8fd3f0e50ce?auto=format&fit=crop&w=600&q=80', tags:['Culture','Desert'], dur:'8 days', bud:'Budget', q:'Plan an 8-day Morocco trip from Marrakech to the Sahara' },
  { title:'Bali Wellness Retreat', sub:'Ubud & Seminyak', img:'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=600&q=80', tags:['Wellness','Beach'], dur:'10 days', bud:'Mid-range', q:'Plan a 10-day Bali wellness retreat in Ubud and Seminyak' },
  { title:'Amalfi Coast Drive', sub:'Naples to Positano', img:'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80', tags:['Scenic','Food'], dur:'7 days', bud:'Premium', q:'Plan a 7-day Amalfi Coast road trip from Naples to Positano' },
];

const FEATURES = [
  { icon:<IconCompass/>, title:'Destination Overview',  desc:'What makes it special and must-see highlights' },
  { icon:<IconBolt/>,    title:'Generated in 30s',       desc:'AI crafts your full plan in under 30 seconds' },
  { icon:<IconMap/>,     title:'Day-by-Day Itinerary',   desc:'Morning, afternoon, and evening activities' },
  { icon:<IconStar/>,    title:'Accommodation Picks',    desc:'Curated stays matching your budget' },
  { icon:<IconChat/>,    title:'AI Chat Refinement',     desc:'Ask follow-up questions or tweak any detail' },
  { icon:<IconShield/>,  title:'Practical Tips',         desc:'Visas, safety, culture, local apps and more' },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery]     = useState('');
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers]   = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hovered, setHovered]   = useState<number|null>(null);

  const go = (q?: string) => {
    const s = (q || query).trim();
    if (!s) return;
    router.push(`/plan?prompt=${encodeURIComponent(s)}`);
  };

  const answerQuiz = (v: string) => {
    const a = [...answers, v];
    if (quizStep < QUIZ_QUESTIONS.length - 1) { setAnswers(a); setQuizStep(quizStep + 1); return; }
    const vibeMap: Record<string,string> = { relaxation:'relaxing beach', adventure:'adventure outdoor', culture:'cultural historical', food:'food nightlife' };
    const budMap:  Record<string,string> = { budget:'budget-friendly', midrange:'mid-range', luxury:'luxury', flexible:'flexible budget' };
    const durMap:  Record<string,string> = { weekend:'weekend', '1week':'7-day', '2weeks':'14-day', month:'30-day' };
    router.push(`/plan?prompt=${encodeURIComponent(`Plan a ${durMap[a[3]]||'7-day'} ${vibeMap[a[0]]||'amazing'} trip with ${budMap[a[2]]||''} budget`)}`);
  };

  /* ── Shared styles ── */
  const S = {
    section: { padding:'96px 0' } as React.CSSProperties,
    label:   { fontFamily:'var(--font-head)', fontWeight:600, fontSize:13, letterSpacing:2, textTransform:'uppercase' as const, color:'var(--orange)', marginBottom:12 },
    h2:      { fontFamily:'var(--font-head)', fontWeight:500, fontSize:'var(--fs-h2)', color:'#000', lineHeight:1.3, marginBottom:16 } as React.CSSProperties,
    chip: (active=false): React.CSSProperties => ({
      display:'inline-flex', alignItems:'center', gap:6,
      background: active ? 'rgba(255,130,16,0.1)' : '#F4F7FB',
      border:`1.5px solid ${active ? 'var(--orange)' : 'transparent'}`,
      color: active ? 'var(--orange)' : '#000',
      fontFamily:'var(--font-head)', fontWeight:500, fontSize:14,
      padding:'8px 16px', borderRadius:'var(--r-pill)', cursor:'pointer',
      transition:'all 0.18s',
    }),
  };

  return (
    <div style={{ fontFamily:'var(--font-body)', color:'#000', background:'#fff' }}>

      {/* ───── NAV ───── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:68, padding:'0 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--border)',
      }}>
        <a href="/" style={{ display:'flex', alignItems:'center' }}>
          <img src="/goto-logo.png" alt="GOTO" style={{ height:38, width:'auto' }} />
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {['Destinations','Trip Ideas','Quiz'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}
               style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:14, color:'var(--gray-dark)', padding:'8px 14px', borderRadius:8 }}>
              {l}
            </a>
          ))}
          <a href="#plan-form" style={{
            marginLeft:12, background:'var(--navy)', color:'#fff',
            fontFamily:'var(--font-head)', fontWeight:600, fontSize:14,
            padding:'10px 22px', borderRadius:'var(--r-pill)',
          }}>Plan a Trip</a>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section style={{ position:'relative', height:'100vh', minHeight:680, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        {/* Photo */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=90)', backgroundSize:'cover', backgroundPosition:'center 40%' }} />
        {/* Strong colour overlay — deep navy #00447B at 68% */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(0,40,90,0.75) 0%, rgba(0,68,123,0.60) 50%, rgba(0,20,60,0.78) 100%)' }} />

        <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:860, padding:'0 24px', width:'100%' }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.22)', borderRadius:'var(--r-pill)', padding:'6px 18px', marginBottom:28, animation:'fadeIn 0.6s ease both' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', flexShrink:0 }} />
            <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:13, color:'rgba(255,255,255,0.92)' }}>AI-powered · Free · No account required</span>
          </div>

          {/* H1 */}
          <h1 style={{ color:'#fff', marginBottom:20, animation:'fadeUp 0.65s 0.1s ease both' }}>
            The world is waiting.<br/>
            <span style={{ color:'var(--orange-light)' }}>Where to next?</span>
          </h1>

          <p style={{ fontFamily:'var(--font-body)', fontWeight:400, fontSize:18, color:'rgba(255,255,255,0.75)', marginBottom:40, animation:'fadeUp 0.65s 0.2s ease both' }}>
            Describe your dream trip and get a complete, personalised itinerary in 30 seconds.
          </p>

          {/* Search bar */}
          <div style={{ display:'flex', alignItems:'center', background:'#fff', borderRadius:'var(--r-pill)', padding:'6px 6px 6px 22px', gap:10, boxShadow:'0 24px 64px rgba(0,0,0,0.30)', animation:'fadeUp 0.65s 0.3s ease both' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>🔍</span>
            <input
              type="text" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()}
              placeholder="e.g. 10 days in Japan, mid-range budget, couple..."
              style={{ flex:1, border:'none', outline:'none', fontFamily:'var(--font-body)', fontSize:16, color:'#000', background:'transparent', padding:'10px 0' }}
            />
            <button onClick={()=>go()} style={{
              background:'var(--orange)', color:'#fff',
              fontFamily:'var(--font-head)', fontWeight:600, fontSize:15,
              padding:'14px 26px', borderRadius:'var(--r-pill)', border:'none', cursor:'pointer', whiteSpace:'nowrap',
            }}>Plan my trip ✈</button>
          </div>

          {/* Quick chips */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:20, justifyContent:'center', animation:'fadeUp 0.65s 0.4s ease both' }}>
            {QUICK_IDEAS.map(i=>(
              <button key={i.label} onClick={()=>go(i.query)} style={{
                background:'rgba(255,255,255,0.13)', backdropFilter:'blur(10px)',
                border:'1px solid rgba(255,255,255,0.22)', color:'rgba(255,255,255,0.92)',
                fontFamily:'var(--font-head)', fontWeight:500, fontSize:13,
                padding:'8px 16px', borderRadius:'var(--r-pill)', cursor:'pointer', display:'flex', alignItems:'center', gap:6,
              }}>{i.icon} {i.label}</button>
            ))}
            <button onClick={()=>setShowQuiz(true)} style={{
              background:'var(--orange)', border:'none', color:'#fff',
              fontFamily:'var(--font-head)', fontWeight:600, fontSize:13,
              padding:'8px 16px', borderRadius:'var(--r-pill)', cursor:'pointer', display:'flex', alignItems:'center', gap:6,
            }}>🎯 Take the quiz</button>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position:'absolute', bottom:32, left:'50%', transform:'translateX(-50%)', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', gap:6, animation:'fadeIn 1s 0.8s ease both', opacity:0 }}>
          <span style={{ fontFamily:'var(--font-head)', color:'rgba(255,255,255,0.45)', fontSize:11, letterSpacing:2, textTransform:'uppercase' }}>Scroll</span>
          <div style={{ width:1, height:36, background:'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }} />
        </div>
      </section>

      {/* ───── STATS BAR ───── */}
      <section style={{ background:'var(--navy)', padding:'0' }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'0 32px', display:'flex', justifyContent:'center', flexWrap:'wrap' }}>
          {[['30s','Plan generated'],['7','Plan sections'],['12','Trip styles'],['100%','Personalised']].map(([v,l],i,arr)=>(
            <div key={l} style={{ flex:'1 1 140px', textAlign:'center', padding:'28px 32px', borderRight: i<arr.length-1?'1px solid rgba(255,255,255,0.12)':'none' }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:32, color:'var(--orange-light)' }}>{v}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.55)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── DESTINATIONS ───── */}
      <section id="destinations" style={{ ...S.section, background:'#fff' }}>
        <div className="container">
          <div style={{ marginBottom:48 }}>
            <p style={S.label}>Trending Destinations</p>
            <h2 style={{ ...S.h2, maxWidth:520 }}>Dream destinations,<br/>crafted just for you.</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gridTemplateRows:'repeat(2,260px)', gap:16 }}>
            {DESTINATIONS.map((d,i)=>(
              <div key={d.name} onClick={()=>go(`Plan a trip to ${d.name}, ${d.country}`)}
                onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
                style={{ position:'relative', borderRadius:'var(--r-lg)', overflow:'hidden', cursor:'pointer', gridColumn:i===0?'span 2':undefined, transition:'transform 0.3s', transform:hovered===i?'scale(1.015)':'scale(1)', boxShadow: hovered===i?'var(--shadow-hover)':'var(--shadow-card)' }}>
                <img src={d.img} alt={d.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s', transform:hovered===i?'scale(1.06)':'scale(1)' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)' }} />
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'18px 20px' }}>
                  <span style={{ display:'inline-block', background:d.color, color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:11, padding:'3px 10px', borderRadius:'var(--r-pill)', marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>{d.tag}</span>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:i===0?26:20, color:'#fff', letterSpacing:'-0.3px' }}>{d.name}</div>
                  <div style={{ fontFamily:'var(--font-body)', color:'rgba(255,255,255,0.65)', fontSize:13, marginTop:2 }}>{d.country}</div>
                </div>
                <div style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.25)', borderRadius:'var(--r-pill)', padding:'6px 14px', color:'#fff', fontFamily:'var(--font-head)', fontWeight:600, fontSize:12, opacity:hovered===i?1:0, transition:'opacity 0.2s' }}>Plan this →</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section style={{ ...S.section, background:'var(--bg-section)' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <p style={S.label}>Simple Process</p>
          <h2 style={{ ...S.h2, textAlign:'center', marginBottom:56 }}>How it works</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40 }}>
            {[
              { n:'01', icon:'✏️', t:'Tell us your dream trip', d:'Destination, travel style, dates, group and budget — all in one natural sentence or our smart form.' },
              { n:'02', icon:'⚡', t:'AI crafts your plan',     d:'Your personalised itinerary is generated in under 30 seconds with 7 detailed sections tailored to you.' },
              { n:'03', icon:'✨', t:'Explore & refine',        d:'Chat with AI to adjust any detail. Add activities, change hotels, tweak the budget — all in real time.' },
            ].map(s=>(
              <div key={s.n} style={{ textAlign:'center' }}>
                <div style={{ width:72, height:72, borderRadius:20, background:'#fff', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 16px', boxShadow:'var(--shadow-card)' }}>{s.icon}</div>
                <p style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, color:'var(--gray-light)', letterSpacing:2, marginBottom:10 }}>{s.n}</p>
                <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:'var(--fs-h3)', color:'#000', marginBottom:10 }}>{s.t}</h3>
                <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'var(--gray-dark)', lineHeight:1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── QUIZ ───── */}
      <section id="quiz" style={{ ...S.section, background:'var(--navy)' }}>
        <div className="container" style={{ maxWidth:680, textAlign:'center' }}>
          <p style={{ ...S.label, color:'var(--orange-light)' }}>Not Sure Where to Go?</p>
          <h2 style={{ ...S.h2, color:'#fff' }}>Take the travel quiz</h2>
          <p style={{ fontFamily:'var(--font-body)', fontSize:18, color:'rgba(255,255,255,0.55)', marginBottom:48 }}>
            Answer 4 quick questions and we&apos;ll generate the perfect personalised trip for you.
          </p>

          {!showQuiz ? (
            <button onClick={()=>setShowQuiz(true)} style={{ background:'var(--orange)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:600, fontSize:16, padding:'16px 36px', borderRadius:'var(--r-pill)', border:'none', cursor:'pointer', boxShadow:'0 8px 28px rgba(255,130,16,0.35)' }}>
              🎯 Start the quiz
            </button>
          ) : (
            <div style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'var(--r-lg)', padding:'40px 32px' }}>
              {/* Progress */}
              <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:32 }}>
                {QUIZ_QUESTIONS.map((_,i)=>(<div key={i} style={{ width:40, height:4, borderRadius:100, background:i<=quizStep?'var(--orange)':'rgba(255,255,255,0.15)', transition:'background 0.3s' }} />))}
              </div>
              <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:12, color:'rgba(255,255,255,0.4)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:14 }}>Question {quizStep+1} of {QUIZ_QUESTIONS.length}</p>
              <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:24, color:'#fff', marginBottom:28 }}>{QUIZ_QUESTIONS[quizStep].q}</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {QUIZ_QUESTIONS[quizStep].opts.map(o=>(
                  <button key={o.v} onClick={()=>answerQuiz(o.v)} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', borderRadius:'var(--r-md)', padding:'18px 14px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, fontFamily:'var(--font-head)', fontWeight:500, fontSize:14, transition:'all 0.18s' }}>
                    <span style={{ fontSize:26 }}>{o.e}</span>{o.l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ───── TRIP IDEAS ───── */}
      <section id="trip-ideas" style={{ ...S.section, background:'#fff' }}>
        <div className="container">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:48, flexWrap:'wrap', gap:16 }}>
            <div>
              <p style={S.label}>Curated Itineraries</p>
              <h2 style={S.h2}>Ready-made trip ideas.</h2>
            </div>
            <a href="#plan-form" style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:15, color:'var(--navy)', borderBottom:'2px solid var(--navy)', paddingBottom:2 }}>Create a custom trip →</a>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:20 }}>
            {TRIP_IDEAS.map(t=>(
              <div key={t.title} onClick={()=>go(t.q)} style={{ background:'#fff', borderRadius:'var(--r-lg)', overflow:'hidden', cursor:'pointer', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', transition:'all 0.3s' }}>
                <div style={{ position:'relative', height:200, overflow:'hidden' }}>
                  <img src={t.img} alt={t.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:6, flexWrap:'wrap' }}>
                    {t.tags.map(tag=>(
                      <span key={tag} style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, padding:'3px 10px', borderRadius:'var(--r-pill)', textTransform:'uppercase', letterSpacing:0.4 }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding:'18px 20px 20px' }}>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:'var(--fs-h3)', color:'#000', marginBottom:4 }}>{t.title}</h3>
                  <p style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:14, marginBottom:14 }}>{t.sub}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', gap:14 }}>
                      <span style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:13 }}>📅 {t.dur}</span>
                      <span style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:13 }}>💰 {t.bud}</span>
                    </div>
                    <span style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:13, color:'var(--orange)' }}>Plan this ↗</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FORM ───── */}
      <section id="plan-form" style={{ ...S.section, background:'var(--bg-section)' }}>
        <div style={{ maxWidth:680, margin:'0 auto', padding:'0 24px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <p style={S.label}>Your Adventure Awaits</p>
            <h2 style={{ ...S.h2, textAlign:'center' }}>Create your travel plan</h2>
            <p style={{ fontFamily:'var(--font-body)', fontSize:18, color:'var(--gray-dark)' }}>Free. Personalised. Ready in 30 seconds.</p>
          </div>
          <PlanForm onSubmit={go} />
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section style={{ ...S.section, background:'#fff' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <p style={S.label}>Full Coverage</p>
            <h2 style={{ ...S.h2, textAlign:'center' }}>Everything in every plan</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:20 }}>
            {FEATURES.map(f=>(
              <div key={f.title} style={{ background:'var(--bg-section)', borderRadius:'var(--r-md)', padding:'24px 22px', display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ flexShrink:0 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:'var(--fs-h3)', color:'#000', marginBottom:6 }}>{f.title}</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--gray-dark)', lineHeight:1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ background:'var(--navy)', padding:'48px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <img src="/goto-logo.png" alt="GOTO" style={{ height:36, width:'auto', filter:'brightness(0) invert(1)' }} />
        <p style={{ fontFamily:'var(--font-body)', color:'rgba(255,255,255,0.45)', fontSize:13 }}>
          © 2026 GOTO AI Travel Planner. Built with Next.js &amp; OpenRouter.{' '}
          <a href="https://open-meteo.com" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'underline' }}>Weather by Open-Meteo</a>
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        button:hover { opacity:0.88; }
        .container { max-width:1200px; margin:0 auto; padding:0 32px; }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
function PlanForm({ onSubmit }: { onSubmit: (q:string)=>void }) {
  const [dest,    setDest]    = useState('');
  const [dep,     setDep]     = useState('');
  const [ret,     setRet]     = useState('');
  const [adults,  setAdults]  = useState(2);
  const [kids,    setKids]    = useState(0);
  const [styles,  setStyles]  = useState<string[]>([]);
  const [budget,  setBudget]  = useState('midrange');
  const [notes,   setNotes]   = useState('');

  const styleOpts = [
    {v:'cultural',label:'🏛️ Cultural'},     {v:'food',label:'🍽️ Food & Drink'},
    {v:'party',label:'🎉 Nightlife'},        {v:'shopping',label:'🛍️ Shopping'},
    {v:'family',label:'👨‍👩‍👧 Family'},   {v:'adventure',label:'🏔️ Adventure'},
    {v:'beach',label:'🏖️ Beach'},            {v:'wellness',label:'🧘 Wellness'},
    {v:'romance',label:'💑 Romance'},         {v:'nature',label:'🌿 Nature'},
  ];

  const toggle = (v:string) => setStyles(p=>p.includes(v)?p.filter(s=>s!==v):[...p,v]);

  const submit = () => {
    if (!dest) return;
    const bLabels: Record<string,string> = { budget:'budget-friendly', midrange:'mid-range', luxury:'luxury' };
    const tripStyles = styles.length ? `focusing on ${styles.join(', ')}` : '';
    const dates = dep ? `from ${dep}${ret?` to ${ret}`:''}` : '';
    const group = `for ${adults} adult${adults>1?'s':''}${kids>0?` and ${kids} child${kids>1?'ren':''}`:''}`;
    onSubmit(`Plan a trip to ${dest} ${dates} ${group} with ${bLabels[budget]||budget} budget ${tripStyles}${notes?`. Notes: ${notes}`:''}`);
  };

  const inp: React.CSSProperties = { width:'100%', background:'#fff', border:'1.5px solid var(--border)', borderRadius:'var(--r-md)', padding:'13px 16px', fontFamily:'var(--font-body)', fontSize:16, color:'#000', outline:'none' };
  const lbl: React.CSSProperties = { fontFamily:'var(--font-head)', fontWeight:600, fontSize:13, color:'var(--gray-dark)', marginBottom:8, display:'block', letterSpacing:0.3 };

  return (
    <div style={{ background:'#fff', borderRadius:'var(--r-lg)', border:'1px solid var(--border)', padding:'40px 36px', boxShadow:'var(--shadow-card)', display:'flex', flexDirection:'column', gap:24 }}>

      <div>
        <label style={lbl}>Where are you headed? *</label>
        <input type="text" value={dest} onChange={e=>setDest(e.target.value)} placeholder="📍 e.g. Bali, Paris, Japan..." style={inp} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div><label style={lbl}>Departure Date</label><input type="date" value={dep} onChange={e=>setDep(e.target.value)} style={inp} /></div>
        <div><label style={lbl}>Return Date</label><input type="date" value={ret} onChange={e=>setRet(e.target.value)} style={inp} /></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {[['Adults', adults, setAdults, 1],['Children', kids, setKids, 0]].map(([lbl2,val,set,min])=>(
          <div key={lbl2 as string}>
            <label style={lbl}>{lbl2 as string}</label>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <button onClick={()=>(set as (n:number)=>void)(Math.max(min as number,(val as number)-1))} style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-section)', border:'1.5px solid var(--border)', color:'#000', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontFamily:'var(--font-head)' }}>−</button>
              <span style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:18, minWidth:24, textAlign:'center' }}>{val as number}</span>
              <button onClick={()=>(set as (n:number)=>void)((val as number)+1)} style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-section)', border:'1.5px solid var(--border)', color:'#000', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontFamily:'var(--font-head)' }}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label style={lbl}>Trip Style</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {styleOpts.map(o=>(
            <button key={o.v} onClick={()=>toggle(o.v)} style={{
              background:styles.includes(o.v)?'rgba(255,130,16,0.1)':'var(--bg-section)',
              border:`1.5px solid ${styles.includes(o.v)?'var(--orange)':'transparent'}`,
              color:styles.includes(o.v)?'var(--orange)':'#000',
              fontFamily:'var(--font-head)', fontWeight:500, fontSize:13,
              borderRadius:'var(--r-pill)', padding:'7px 14px', cursor:'pointer',
            }}>{o.label}</button>
          ))}
        </div>
      </div>

      <div>
        <label style={lbl}>Budget Level</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {[{v:'budget',e:'🎒',l:'Budget',s:'< $80/day'},{v:'midrange',e:'🏨',l:'Mid-range',s:'$80–250/day'},{v:'luxury',e:'💎',l:'Luxury',s:'$250+/day'}].map(b=>(
            <button key={b.v} onClick={()=>setBudget(b.v)} style={{
              background:budget===b.v?'rgba(0,68,123,0.06)':'var(--bg-section)',
              border:`1.5px solid ${budget===b.v?'var(--navy)':'transparent'}`,
              borderRadius:'var(--r-md)', padding:'16px 10px', cursor:'pointer', textAlign:'center',
            }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{b.e}</div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:13, color:budget===b.v?'var(--navy)':'#000', marginBottom:2 }}>{b.l}</div>
              <div style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:11 }}>{b.s}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={lbl}>Special requests (optional)</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Dietary needs, accessibility, must-see places..." maxLength={500} rows={3} style={{ ...inp, resize:'vertical' }} />
      </div>

      <button onClick={submit} disabled={!dest} style={{
        background:dest?'var(--orange)':'var(--gray-light)', color:'#fff',
        fontFamily:'var(--font-head)', fontWeight:700, fontSize:16,
        padding:'17px', borderRadius:'var(--r-pill)', border:'none',
        cursor:dest?'pointer':'not-allowed', width:'100%',
        boxShadow:dest?'0 8px 28px rgba(255,130,16,0.30)':'none',
      }}>
        ✈ Generate My Travel Plan
      </button>
    </div>
  );
}
