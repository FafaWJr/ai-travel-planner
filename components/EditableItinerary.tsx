'use client';
import { useState } from 'react';

type Status = 'pending' | 'accepted' | 'declined';

interface Activity {
  id: string;
  text: string;
  status: Status;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  timing: string;
}

interface Day {
  number: number;
  title: string;
  activities: Activity[];
  open: boolean;
  suggestions: Suggestion[];
  loadingMore: boolean;
}

/* ── Inline markdown renderer ── */
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
  const content = md.replace(/^##[^\n]*\n+/m, '').trim();
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
      if (m) activities.push({ id: `d${number}-a${activities.length}`, text: m[1].trim(), status: 'pending' });
    }

    days.push({ number, title, activities, open: number === 1, suggestions: [], loadingMore: false });
  }

  return days;
}

const GRADIENTS = [
  'linear-gradient(135deg,#00447B,#0369A1)',
  'linear-gradient(135deg,#0F4C75,#1B7AB5)',
  'linear-gradient(135deg,#164E63,#0891B2)',
  'linear-gradient(135deg,#1E3A5F,#2563EB)',
  'linear-gradient(135deg,#312E81,#4F46E5)',
  'linear-gradient(135deg,#3B0764,#7C3AED)',
  'linear-gradient(135deg,#4A1942,#BE185D)',
];

interface Props {
  itineraryMd: string;
  destination: string;
  tripPrompt: string;
  photos: string[];
  onPlaceHover: (e: React.MouseEvent) => void;
  onPlaceLeave: () => void;
}

export default function EditableItinerary({
  itineraryMd, destination, tripPrompt, photos,
  onPlaceHover, onPlaceLeave,
}: Props) {
  const [days, setDays] = useState<Day[]>(() => parseItinerary(itineraryMd));

  const allActs  = days.flatMap(d => d.activities);
  const accepted = allActs.filter(a => a.status === 'accepted').length;
  const declined = allActs.filter(a => a.status === 'declined').length;
  const pending  = allActs.filter(a => a.status === 'pending').length;
  const total    = allActs.length;
  const progress = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const setActivityStatus = (dayNum: number, actId: string, status: Status) =>
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

  const fetchMoreIdeas = async (dayNum: number) => {
    const day = days.find(d => d.number === dayNum);
    if (!day || day.loadingMore) return;

    setDays(prev => prev.map(d => d.number === dayNum ? { ...d, loadingMore: true } : d));

    try {
      const res = await fetch('/api/day-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripPrompt,
          dayNumber: dayNum,
          dayTitle: day.title,
          destination,
          existingActivities: day.activities.map(a => a.text),
        }),
      });
      const data = await res.json();
      const suggestions: Suggestion[] = (data.suggestions || []).map(
        (s: Omit<Suggestion, 'id'>, i: number) => ({ ...s, id: `d${dayNum}-s${Date.now()}-${i}` })
      );
      setDays(prev => prev.map(d => d.number === dayNum ? { ...d, suggestions: [...d.suggestions, ...suggestions], loadingMore: false } : d));
    } catch {
      setDays(prev => prev.map(d => d.number === dayNum ? { ...d, loadingMore: false } : d));
    }
  };

  /* Accept suggestion → add to activities */
  const acceptSuggestion = (dayNum: number, sug: Suggestion) =>
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        suggestions: d.suggestions.filter(s => s.id !== sug.id),
        activities: [...d.activities, { id: `d${dayNum}-a${d.activities.length}`, text: `**${sug.title}** — ${sug.description}${sug.timing ? ` (${sug.timing})` : ''}`, status: 'accepted' }],
      }
    ));

  /* Decline suggestion → just remove it */
  const declineSuggestion = (dayNum: number, sugId: string) =>
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : { ...d, suggestions: d.suggestions.filter(s => s.id !== sugId) }
    ));

  return (
    <div onMouseOver={onPlaceHover} onMouseLeave={onPlaceLeave}>

      {/* ── Live counters + progress bar ── */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '16px 20px 14px',
        marginBottom: 16, border: '1px solid rgba(0,68,123,0.08)',
        boxShadow: '0 1px 8px rgba(0,68,123,0.05)',
      }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <Pill color="#16A34A" bg="rgba(22,163,74,0.12)" icon="✓">{accepted} accepted</Pill>
          <Pill color="#DC2626" bg="rgba(220,38,38,0.10)" icon="✕">{declined} removed</Pill>
          <Pill color="#6C6D6F" bg="rgba(0,68,123,0.07)"  icon="○">{pending} to review</Pill>
          <span style={{ marginLeft: 'auto', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, color: '#00447B' }}>
            {progress}% accepted
          </span>
        </div>
        <div style={{ height: 7, background: 'rgba(0,68,123,0.08)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#16A34A,#4ADE80)', borderRadius: 100, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* ── Day cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {days.map((day, idx) => {
          const photo = photos.length > 0 ? photos[idx % photos.length] : null;
          const dayAccepted = day.activities.filter(a => a.status === 'accepted').length;

          return (
            <div key={day.number} style={{
              background: '#fff', borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(0,68,123,0.08)',
              boxShadow: '0 2px 12px rgba(0,68,123,0.06)',
            }}>

              {/* Cover photo / header */}
              <div onClick={() => toggleDay(day.number)} style={{ cursor: 'pointer', position: 'relative' }}>
                {photo
                  ? <img src={photo} alt={`Day ${day.number}`} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: 80, background: GRADIENTS[idx % GRADIENTS.length] }} />
                }
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top,rgba(0,0,0,0.60) 0%,rgba(0,0,0,0.10) 60%,transparent 100%)',
                  display: 'flex', alignItems: 'flex-end', padding: '10px 14px', gap: 8,
                }}>
                  <span style={{ background: '#FF8210', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 100, flexShrink: 0 }}>
                    Day {day.number}
                  </span>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', flex: 1, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {day.title}
                  </p>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.70)', flexShrink: 0 }}>
                    {dayAccepted}/{day.activities.length}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, flexShrink: 0, display: 'inline-block', transition: 'transform 0.2s', transform: day.open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                </div>
              </div>

              {/* Body */}
              {day.open && (
                <div style={{ padding: '12px 14px 16px' }}>

                  {/* ── Existing activities ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {day.activities.map(act => (
                      <ActivityRow
                        key={act.id}
                        act={act}
                        onAccept={() => setActivityStatus(day.number, act.id, 'accepted')}
                        onDecline={() => setActivityStatus(day.number, act.id, 'declined')}
                      />
                    ))}
                  </div>

                  {/* ── Suggested activities ── */}
                  {day.suggestions.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12, color: '#FF8210', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                        💡 Extra Ideas for Day {day.number}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {day.suggestions.map(sug => (
                          <SuggestionCard
                            key={sug.id}
                            sug={sug}
                            onAccept={() => acceptSuggestion(day.number, sug)}
                            onDecline={() => declineSuggestion(day.number, sug.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── More ideas button ── */}
                  <button
                    onClick={() => fetchMoreIdeas(day.number)}
                    disabled={day.loadingMore}
                    style={{
                      marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7,
                      background: 'none', border: '1.5px dashed rgba(0,68,123,0.22)',
                      borderRadius: 100, padding: '7px 16px', cursor: day.loadingMore ? 'default' : 'pointer',
                      fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12,
                      color: '#00447B', transition: 'background 0.15s',
                      opacity: day.loadingMore ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!day.loadingMore) e.currentTarget.style.background = 'rgba(0,68,123,0.04)'; }}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    {day.loadingMore
                      ? <><Spinner /> Finding ideas...</>
                      : <><span style={{ fontSize: 15 }}>+</span> More ideas for this day</>
                    }
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

/* ── Sub-components ── */

function Pill({ color, bg, icon, children }: { color: string; bg: string; icon: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{icon}</span>
      {children}
    </span>
  );
}

function ActivityRow({ act, onAccept, onDecline }: { act: { id: string; text: string; status: Status }; onAccept: () => void; onDecline: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 12px', borderRadius: 10,
      borderLeft: `3px solid ${act.status === 'accepted' ? '#16A34A' : act.status === 'declined' ? 'rgba(220,38,38,0.3)' : 'rgba(0,68,123,0.12)'}`,
      background: act.status === 'accepted' ? 'rgba(22,163,74,0.04)' : act.status === 'declined' ? 'rgba(220,38,38,0.03)' : '#F9FAFB',
      opacity: act.status === 'declined' ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      <p
        style={{ flex: 1, fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.65, color: '#333', margin: 0, textDecoration: act.status === 'declined' ? 'line-through' : 'none' }}
        dangerouslySetInnerHTML={{ __html: inlineMd(act.text) }}
      />
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2 }}>
        <RoundBtn active={act.status === 'accepted'} activeColor="#16A34A" idleColor="rgba(22,163,74,0.12)" onClick={onAccept} label="Accept">✓</RoundBtn>
        <RoundBtn active={act.status === 'declined'} activeColor="#DC2626" idleColor="rgba(220,38,38,0.10)" onClick={onDecline} label="Remove">✕</RoundBtn>
      </div>
    </div>
  );
}

function SuggestionCard({ sug, onAccept, onDecline }: { sug: Suggestion; onAccept: () => void; onDecline: () => void }) {
  return (
    <div style={{
      border: '1.5px solid rgba(255,130,16,0.22)', borderRadius: 12,
      background: 'rgba(255,247,237,0.6)', overflow: 'hidden',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: '#C2410C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {sug.title}
          </p>
          {sug.timing && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9A6700', margin: 0 }}>🕐 {sug.timing}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={onAccept}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12 }}
          >
            ✓ Add to plan
          </button>
          <button
            onClick={onDecline}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(220,38,38,0.10)', color: '#DC2626', border: 'none', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12 }}
          >
            ✕
          </button>
        </div>
      </div>
      {/* Description */}
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0, padding: '0 14px 12px' }}>
        {sug.description}
      </p>
    </div>
  );
}

function RoundBtn({ active, activeColor, idleColor, onClick, label, children }: { active: boolean; activeColor: string; idleColor: string; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? activeColor : idleColor, color: active ? '#fff' : activeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,68,123,0.15)', borderTop: '2px solid #00447B', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
  );
}
