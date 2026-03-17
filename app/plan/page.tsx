'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const SECTIONS = [
  { id:'overview',       label:'Overview',       icon:'🌍' },
  { id:'weather',        label:'Weather',         icon:'⛅' },
  { id:'itinerary',      label:'Itinerary',       icon:'🗓️' },
  { id:'accommodation',  label:'Stays',           icon:'🏨' },
  { id:'transport',      label:'Transport',       icon:'🚌' },
  { id:'budget',         label:'Budget',          icon:'💰' },
  { id:'tips',           label:'Tips',            icon:'📋' },
];

function PlanContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const prompt       = searchParams.get('prompt') || '';
  const [plan,        setPlan]        = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [activeSection,setActiveSection] = useState('overview');
  const [chatMessages,setChatMessages] = useState<{role:string;content:string}[]>([]);
  const [chatInput,   setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [photos,      setPhotos]      = useState<string[]>([]);

  useEffect(() => { if (prompt) generatePlan(prompt); }, [prompt]);

  const generatePlan = async (p: string) => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:p}) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setPlan(data.plan || data.content || '');
      const dest = p.split(' ').slice(4,8).join(' ');
      try {
        const pr = await fetch(`/api/destination-photos?city=${encodeURIComponent(dest)}`);
        if (pr.ok) { const pd = await pr.json(); setPhotos(pd.photos||[]); }
      } catch {}
    } catch { setError('Failed to generate your travel plan. Please try again.'); }
    finally  { setLoading(false); }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput; setChatInput('');
    const msgs = [...chatMessages, {role:'user', content:msg}];
    setChatMessages(msgs); setChatLoading(true);
    try {
      const res  = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:msgs, plan, destination:prompt}) });
      const data = await res.json();
      setChatMessages([...msgs, {role:'assistant', content:data.response||data.content||''}]);
    } catch {
      setChatMessages([...msgs, {role:'assistant', content:'Sorry, could not process that. Please try again.'}]);
    } finally { setChatLoading(false); }
  };

  return (
    <div style={{ background:'#F4F7FB', minHeight:'100vh', fontFamily:"'Inter', sans-serif" }}>
      {/* Nav */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:64, padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,68,123,0.10)' }}>
        <a href="/" style={{ display:'flex', alignItems:'center' }}>
          <img src="/goto-logo.png" alt="GOTO" style={{ height:34, width:'auto' }} />
        </a>
        <button onClick={()=>router.push('/')} style={{ background:'var(--bg-section,#F4F7FB)', border:'1.5px solid rgba(0,68,123,0.15)', color:'#00447B', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13, padding:'8px 18px', borderRadius:100, cursor:'pointer' }}>
          ← New trip
        </button>
      </nav>

      <div style={{ paddingTop:64 }}>
        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', gap:24 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', border:'3px solid rgba(0,68,123,0.12)', borderTop:'3px solid #FF8210', animation:'spin 1s linear infinite' }} />
            <div style={{ textAlign:'center' }}>
              <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:22, color:'#00447B', marginBottom:8 }}>Crafting your perfect trip...</p>
              <p style={{ color:'#6C6D6F', fontSize:15 }}>This usually takes about 30 seconds</p>
            </div>
            <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
          </div>
        ) : error ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)', gap:16, textAlign:'center', padding:'0 24px' }}>
            <span style={{ fontSize:48 }}>😕</span>
            <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:20 }}>{error}</p>
            <button onClick={()=>generatePlan(prompt)} style={{ background:'#FF8210', color:'#fff', fontFamily:"'Poppins',sans-serif", fontWeight:600, padding:'12px 28px', borderRadius:100, fontSize:15, cursor:'pointer', border:'none' }}>Try again</button>
          </div>
        ) : plan ? (
          <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px', display:'grid', gridTemplateColumns:'1fr 360px', gap:28 }}>
            <div>
              {/* Photo strip */}
              {photos.length>0 && (
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:8, borderRadius:20, overflow:'hidden', marginBottom:28, height:260 }}>
                  {photos.slice(0,3).map((url,i)=>(<img key={i} src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />))}
                </div>
              )}
              {/* Section tabs */}
              <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
                {SECTIONS.map(s=>(
                  <button key={s.id} onClick={()=>setActiveSection(s.id)} style={{ background:activeSection===s.id?'#FF8210':'#fff', border:`1.5px solid ${activeSection===s.id?'#FF8210':'rgba(0,68,123,0.15)'}`, color:activeSection===s.id?'#fff':'#000', borderRadius:100, padding:'8px 16px', fontSize:13, fontFamily:"'Poppins',sans-serif", fontWeight:500, cursor:'pointer' }}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
              {/* Plan content */}
              <div style={{ background:'#fff', border:'1px solid rgba(0,68,123,0.10)', borderRadius:20, padding:'32px', color:'#000', lineHeight:1.8, fontSize:16, whiteSpace:'pre-wrap', boxShadow:'0 4px 24px rgba(0,68,123,0.07)' }}>
                {plan}
              </div>
            </div>

            {/* Chat sidebar */}
            <div style={{ position:'sticky', top:80, height:'calc(100vh - 110px)', display:'flex', flexDirection:'column' }}>
              <div style={{ background:'#fff', border:'1px solid rgba(0,68,123,0.10)', borderRadius:20, flex:1, display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,68,123,0.07)' }}>
                <div style={{ padding:'18px 18px 14px', borderBottom:'1px solid rgba(0,68,123,0.08)' }}>
                  <p style={{ fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:15, color:'#000' }}>💬 Refine with AI</p>
                  <p style={{ fontFamily:"'Inter',sans-serif", color:'#6C6D6F', fontSize:13, marginTop:3 }}>Ask anything about your trip</p>
                </div>
                <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
                  {chatMessages.length===0&&(<div style={{ fontFamily:"'Inter',sans-serif", color:'#C0C0C0', fontSize:13, textAlign:'center', paddingTop:20 }}>Ask me to adjust hotels, activities, budget...</div>)}
                  {chatMessages.map((m,i)=>(
                    <div key={i} style={{ background:m.role==='user'?'#FF8210':'#F4F7FB', color:m.role==='user'?'#fff':'#000', borderRadius:m.role==='user'?'16px 16px 4px 16px':'16px 16px 16px 4px', padding:'11px 14px', fontSize:13, lineHeight:1.6, alignSelf:m.role==='user'?'flex-end':'flex-start', maxWidth:'90%', fontFamily:"'Inter',sans-serif" }}>
                      {m.content}
                    </div>
                  ))}
                  {chatLoading&&(<div style={{ fontFamily:"'Inter',sans-serif", color:'#C0C0C0', fontSize:12 }}>✦ Thinking...</div>)}
                </div>
                <div style={{ padding:14, borderTop:'1px solid rgba(0,68,123,0.08)', display:'flex', gap:8 }}>
                  <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Ask anything..." style={{ flex:1, background:'#F4F7FB', border:'1.5px solid rgba(0,68,123,0.12)', borderRadius:12, padding:'10px 14px', fontFamily:"'Inter',sans-serif", fontSize:13, color:'#000', outline:'none' }} />
                  <button onClick={sendChat} style={{ background:'#FF8210', color:'#fff', borderRadius:12, width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, cursor:'pointer', border:'none', flexShrink:0 }}>↑</button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'calc(100vh - 64px)' }}>
            <p style={{ fontFamily:"'Inter',sans-serif", color:'#6C6D6F', fontSize:16 }}>
              No trip prompt provided.{' '}
              <button onClick={()=>router.push('/')} style={{ color:'#FF8210', background:'none', border:'none', cursor:'pointer', fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:16 }}>Start planning</button>
            </p>
          </div>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
      `}</style>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div style={{ background:'#F4F7FB', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}><p style={{ fontFamily:"'Poppins',sans-serif", color:'#00447B' }}>Loading...</p></div>}>
      <PlanContent />
    </Suspense>
  );
}
