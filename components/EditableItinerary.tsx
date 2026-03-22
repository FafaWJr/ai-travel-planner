'use client';
import { useState } from 'react';

type Status = 'pending' | 'accepted' | 'declined';

interface Activity {
  id: string;
  text: string;
  status: Status;
}

interface Day {
  number: number;
  title: string;
  activities: Activity[];
  open: boolean;
}

/* ── Inline markdown (bold + place hover) ── */
function inlineMd(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, (_, t) => {
      const isPlace =
        /^[A-Z]/.test(t) &&
        !t.endsWith(':') &&
        !/^(morning|afternoon|evening|night|day\s*\d|note|tip|option|important|total|budget|price|cost|recommended|optional|estimated|approximate|include)/i.test(t);
      if (isPlace) {
        const esc = t.replace(/"/g, '&quot;');
        return `<strong data-place="${esc}" style="cursor:pointer;border-bottom:1.5px dashed rgba(0,68,123,0.40);color:#00447B;font-weight:700;transition:color 0.15s">${t}</strong>`;
      }
      return `<strong>${t}</strong>`;
    })
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/* ── Parse itinerary markdown into Day[] ── */
function parseItinerary(md: string): Day[] {
  // Strip the H2 section header
  const content = md.replace(/^##[^\n]*\n+/m, '').trim();

  // Split by day boundaries (### Day N or **Day N)
  const segments = content.split(/\n(?=(?:###\s*)?(?:\*\*)?Day\s+\d+)/i);
  const days: Day[] = [];

  for (const seg of segments) {
    if (!seg.trim()) continue;
    const headerMatch = seg.match(/^(?:###\s*)?(?:\*\*)?Day\s+(\d+)[:\s–\-–]*([^\n*]*)\*?\*?/i);
    if (!headerMatch) continue;

    const number = parseInt(headerMatch[1], 10);
    const title  = headerMatch[2]?.replace(/\*\*$/, '').trim() || `Day ${number}`;

    const activities: Activity[] = [];
    for (const line of seg.split('\n')) {
      const s = line.trim();
      const m = s.match(/^[-*•]\s+(.+)/) || s.match(/^\d+\.\s+(.+)/);
      if (m) {
        activities.push({ id: `d${number}-a${activities.length}`, text: m[1].trim(), status: 'pending' });
      }
    }

    days.push({ number, title, activities, open: number === 1 });
  }

  return days;
}

interface Props {
  itineraryMd: string;
  destination: string;
  photos: string[];
  onSuggestMore: (message: string) => void;
  onPlaceHover: (e: React.MouseEvent) => void;
  onPlaceLeave: () => void;
}

export default function EditableItinerary({
  itineraryMd, destination, photos,
  onSuggestMore, onPlaceHover, onPlaceLeave,
}: Props) {
  const [days, setDays] = useState<Day[]>(() => parseItinerary(itineraryMd));

  const allActs  = days.flatMap(d => d.activities);
  const accepted = allActs.filter(a => a.status === 'accepted').length;
  const declined = allActs.filter(a => a.status === 'declined').length;
  const pending  = allActs.filter(a => a.status === 'pending').length;
  const total    = allActs.length;
  const progress = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const setStatus = (dayNum: number, actId: string, status: Status) =>
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        activities: d.activities.map(a =>
          a.id === actId ? { ...a, status: a.status === status ? 'pending' : status } : a
        ),
      }
    ));

  const toggleDay = (num: number) =>
    setDays(prev => prev.map(d => d.number === num ? { ...d, open: !d.open } : d));

  /* Gradient fallbacks by day index */
  const GRADIENTS = [
    'linear-gradient(135deg,#00447B,#0369A1)',
    'linear-gradient(135deg,#0F4C75,#1B7AB5)',
    'linear-gradient(135deg,#164E63,#0891B2)',
    'linear-gradient(135deg,#1E3A5F,#2563EB)',
    'linear-gradient(135deg,#312E81,#4F46E5)',
    'linear-gradient(135deg,#3B0764,#7C3AED)',
    'linear-gradient(135deg,#4A1942,#BE185D)',
  ];

  return (
    <div onMouseOver={onPlaceHover} onMouseLeave={onPlaceLeave}>

      {/* ── Live counters + progress bar ── */}
      <div style={{
        background:'#fff', borderRadius:14, padding:'16px 20px 14px',
        marginBottom:16, border:'1px solid rgba(0,68,123,0.08)',
        boxShadow:'0 1px 8px rgba(0,68,123,0.05)',
      }}>
        <div style={{ display:'flex', gap:18, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600, color:'#16A34A' }}>
            <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(22,163,74,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12 }}>✓</span>
            {accepted} accepted
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600, color:'#DC2626' }}>
            <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(220,38,38,0.10)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11 }}>✕</span>
            {declined} removed
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600, color:'#6C6D6F' }}>
            <span style={{ width:22, height:22, borderRadius:'50%', background:'rgba(0,68,123,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10 }}>○</span>
            {pending} to review
          </span>
          <span style={{ marginLeft:'auto', fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:700, color:'#00447B' }}>
            {progress}% accepted
          </span>
        </div>
        <div style={{ height:7, background:'rgba(0,68,123,0.08)', borderRadius:100, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#16A34A,#4ADE80)', borderRadius:100, transition:'width 0.4s ease' }} />
        </div>
      </div>

      {/* ── Day cards ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {days.map((day, idx) => {
          const photo = photos.length > 0 ? photos[idx % photos.length] : null;
          const dayAccepted = day.activities.filter(a => a.status === 'accepted').length;
          const gradient    = GRADIENTS[idx % GRADIENTS.length];

          return (
            <div key={day.number} style={{
              background:'#fff', borderRadius:16, overflow:'hidden',
              border:'1px solid rgba(0,68,123,0.08)',
              boxShadow:'0 2px 12px rgba(0,68,123,0.06)',
            }}>
              {/* ── Cover photo / header ── */}
              <div onClick={() => toggleDay(day.number)} style={{ cursor:'pointer', position:'relative' }}>
                {photo
                  ? <img src={photo} alt={`Day ${day.number}`} style={{ width:'100%', height:120, objectFit:'cover', display:'block' }} />
                  : <div style={{ width:'100%', height:80, background: gradient }} />
                }
                <div style={{
                  position:'absolute', inset:0,
                  background:'linear-gradient(to top,rgba(0,0,0,0.60) 0%,rgba(0,0,0,0.10) 60%,transparent 100%)',
                  display:'flex', alignItems:'flex-end', padding:'10px 14px', gap:8,
                }}>
                  <span style={{
                    background:'#FF8210', color:'#fff',
                    fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:11,
                    padding:'3px 10px', borderRadius:100, flexShrink:0,
                  }}>
                    Day {day.number}
                  </span>
                  <p style={{
                    fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:14,
                    color:'#fff', flex:1, margin:0,
                    textShadow:'0 1px 4px rgba(0,0,0,0.5)',
                    whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                  }}>
                    {day.title}
                  </p>
                  <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, color:'rgba(255,255,255,0.70)', flexShrink:0 }}>
                    {dayAccepted}/{day.activities.length}
                  </span>
                  <span style={{
                    color:'rgba(255,255,255,0.85)', fontSize:14, flexShrink:0,
                    transition:'transform 0.2s', display:'inline-block',
                    transform: day.open ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>▾</span>
                </div>
              </div>

              {/* ── Activity items ── */}
              {day.open && (
                <div style={{ padding:'12px 14px 14px' }}>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {day.activities.map(act => (
                      <div key={act.id} style={{
                        display:'flex', alignItems:'flex-start', gap:8,
                        padding:'9px 12px', borderRadius:10,
                        borderLeft: `3px solid ${
                          act.status === 'accepted' ? '#16A34A'
                          : act.status === 'declined' ? 'rgba(220,38,38,0.3)'
                          : 'rgba(0,68,123,0.12)'
                        }`,
                        background: act.status === 'accepted'
                          ? 'rgba(22,163,74,0.04)'
                          : act.status === 'declined'
                          ? 'rgba(220,38,38,0.03)'
                          : '#F9FAFB',
                        opacity: act.status === 'declined' ? 0.5 : 1,
                        transition:'all 0.2s',
                      }}>
                        <p
                          style={{
                            flex:1, fontFamily:"'Inter',sans-serif", fontSize:13,
                            lineHeight:1.65, color:'#333', margin:0,
                            textDecoration: act.status === 'declined' ? 'line-through' : 'none',
                          }}
                          dangerouslySetInnerHTML={{ __html: inlineMd(act.text) }}
                        />
                        <div style={{ display:'flex', gap:4, flexShrink:0, paddingTop:2 }}>
                          {/* Accept */}
                          <button
                            onClick={() => setStatus(day.number, act.id, 'accepted')}
                            title="Accept"
                            style={{
                              width:26, height:26, borderRadius:'50%', border:'none',
                              cursor:'pointer', fontSize:12, fontWeight:700,
                              background: act.status === 'accepted' ? '#16A34A' : 'rgba(22,163,74,0.12)',
                              color: act.status === 'accepted' ? '#fff' : '#16A34A',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              transition:'all 0.15s',
                            }}
                          >✓</button>
                          {/* Decline */}
                          <button
                            onClick={() => setStatus(day.number, act.id, 'declined')}
                            title="Remove"
                            style={{
                              width:26, height:26, borderRadius:'50%', border:'none',
                              cursor:'pointer', fontSize:11, fontWeight:700,
                              background: act.status === 'declined' ? '#DC2626' : 'rgba(220,38,38,0.10)',
                              color: act.status === 'declined' ? '#fff' : '#DC2626',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              transition:'all 0.15s',
                            }}
                          >✕</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggest more for this day */}
                  <button
                    onClick={() => onSuggestMore(
                      `Suggest 3 more activities for Day ${day.number} (${day.title}) in ${destination}. Keep them specific and match the overall trip style.`
                    )}
                    style={{
                      marginTop:10, display:'inline-flex', alignItems:'center', gap:6,
                      background:'none', border:'1.5px dashed rgba(0,68,123,0.22)',
                      borderRadius:100, padding:'6px 14px', cursor:'pointer',
                      fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12,
                      color:'#00447B', transition:'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,68,123,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span style={{ fontSize:15, lineHeight:1 }}>+</span>
                    More ideas for this day
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
