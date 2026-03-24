'use client';
import { useState, useRef, useEffect } from 'react';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

const SLOTS: { key: TimeSlot; label: string }[] = [
  { key: 'morning',   label: '🌅 Morning'   },
  { key: 'afternoon', label: '☀️ Afternoon'  },
  { key: 'evening',   label: '🌆 Evening'   },
  { key: 'night',     label: '🌙 Night'     },
];

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

type AddForm = { text: string; dayNum: number; slot: TimeSlot };

interface Props {
  plan: string;
  onAddToItinerary: (text: string, dayNum: number, slot: TimeSlot) => void;
}

async function collectSSE(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let result = '', buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try { const d = JSON.parse(json); const t = d?.choices?.[0]?.delta?.content; if (t) result += t; } catch { /* skip */ }
    }
  }
  return result;
}

/* Extract activity-like bold titles from AI response */
function extractActivities(text: string): string[] {
  const found: string[] = [];
  // Numbered: "1. **Title**" or "- **Title**"
  for (const m of text.matchAll(/(?:^\d+\.|^[-*•])\s+\*\*([^*\n]+)\*\*/gm))
    found.push(m[1].trim());
  // Standalone bold on its own: "**Title**" not inside a sentence
  if (found.length === 0)
    for (const m of text.matchAll(/\*\*([A-Z][^*\n]{3,55})\*\*/g)) {
      const t = m[1].trim();
      if (!t.endsWith(':') && !found.includes(t)) found.push(t);
    }
  return found.slice(0, 4);
}

/* Guess day number from text like "Day 2" */
function guessDay(text: string): number {
  const m = text.match(/\bday\s+(\d+)\b/i);
  return m ? parseInt(m[1], 10) : 1;
}

/* Guess slot from text */
function guessSlot(text: string): TimeSlot {
  const t = text.toLowerCase();
  if (/afternoon/.test(t)) return 'afternoon';
  if (/evening/.test(t))   return 'evening';
  if (/night/.test(t))     return 'night';
  return 'morning';
}

export default function FloatingChat({ plan, onAddToItinerary }: Props) {
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm Luna. How can I help customize your trip?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Per-message add-to-itinerary state: undefined = button visible, AddForm = picker open, null = done
  const [addForms, setAddForms] = useState<Record<number, AddForm | null | undefined>>({});
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    const next: Msg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, tripContext: plan }),
      });
      const reply = await collectSSE(res);
      setMsgs(prev => [...prev, { role: 'assistant', content: reply || 'No response received.' }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = (msgIdx: number, text: string, contextText: string) => {
    setAddForms(prev => ({
      ...prev,
      [msgIdx]: { text, dayNum: guessDay(contextText), slot: guessSlot(contextText) },
    }));
  };

  const confirmAdd = (msgIdx: number) => {
    const form = addForms[msgIdx] as AddForm;
    onAddToItinerary(form.text, form.dayNum, form.slot);
    setAddForms(prev => ({ ...prev, [msgIdx]: null }));
  };

  const cancelAdd = (msgIdx: number) => {
    setAddForms(prev => { const n = { ...prev }; delete n[msgIdx]; return n; });
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9000, width: 320, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.16)', border: '1px solid rgba(0,68,123,0.10)', display: 'flex', flexDirection: 'column' }}>

        {/* ── Header ── */}
        <div
          onClick={() => setOpen(v => !v)}
          style={{ background: 'linear-gradient(135deg,#00447B,#005FAD)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
        >
          <img
            src="/luna_2.png"
            alt="Luna"
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '2px solid rgba(255,255,255,0.35)', flexShrink: 0, background: '#fff' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff', margin: 0 }}>Luna</p>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: 0 }}>AI Travel Assistant</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }}>▾</span>
          </div>
        </div>

        {/* ── Body ── */}
        {open && (
          <>
            {/* Messages */}
            <div style={{ overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, minHeight: 160 }}>
              {msgs.map((m, i) => {
                const activities = m.role === 'assistant' && i > 0 ? extractActivities(m.content) : [];
                const addState = addForms[i];
                return (
                  <div key={i}>
                    {/* Bubble */}
                    <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        background: m.role === 'user' ? '#FF8210' : '#F2F5FA',
                        color: m.role === 'user' ? '#fff' : '#1a1a1a',
                        borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                        padding: '9px 12px', fontSize: 13, lineHeight: 1.6, maxWidth: '88%',
                        fontFamily: "'Inter',sans-serif",
                      }}>
                        {m.content}
                      </div>
                    </div>

                    {/* Add to itinerary UI — only for assistant messages that contain activities */}
                    {activities.length > 0 && (
                      <div style={{ paddingLeft: 4, paddingTop: 5 }}>
                        {addState === undefined && (
                          <button
                            onClick={() => openAddForm(i, activities[0], msgs.slice(i - 1, i + 1).map(x => x.content).join(' '))}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(22,163,74,0.09)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 100, padding: '4px 12px', fontSize: 12, fontFamily: "'Poppins',sans-serif", fontWeight: 600, color: '#16A34A', cursor: 'pointer' }}
                          >
                            ➕ Add to itinerary
                          </button>
                        )}

                        {addState !== undefined && addState !== null && (
                          <div style={{ background: '#F0FDF4', border: '1px solid rgba(22,163,74,0.20)', borderRadius: 12, padding: '10px 12px', marginTop: 4 }}>
                            <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#16A34A', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.4 }}>Add to itinerary</p>
                            {/* Activity picker (if multiple) */}
                            {activities.length > 1 && (
                              <select
                                value={addState.text}
                                onChange={e => setAddForms(prev => ({ ...prev, [i]: { ...(prev[i] as AddForm), text: e.target.value } }))}
                                style={{ width: '100%', marginBottom: 8, padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(0,68,123,0.18)', fontSize: 12, fontFamily: "'Inter',sans-serif" }}
                              >
                                {activities.map((a, ai) => <option key={ai} value={a}>{a}</option>)}
                              </select>
                            )}
                            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: '0 0 3px', fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', fontFamily: "'Poppins',sans-serif" }}>Day</p>
                                <input
                                  type="number" min={1} max={21}
                                  value={addState.dayNum}
                                  onChange={e => setAddForms(prev => ({ ...prev, [i]: { ...(prev[i] as AddForm), dayNum: Math.max(1, Number(e.target.value)) } }))}
                                  style={{ width: '100%', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(0,68,123,0.18)', fontSize: 13, fontFamily: "'Inter',sans-serif" }}
                                />
                              </div>
                              <div style={{ flex: 2 }}>
                                <p style={{ margin: '0 0 3px', fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', fontFamily: "'Poppins',sans-serif" }}>Time slot</p>
                                <select
                                  value={addState.slot}
                                  onChange={e => setAddForms(prev => ({ ...prev, [i]: { ...(prev[i] as AddForm), slot: e.target.value as TimeSlot } }))}
                                  style={{ width: '100%', padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(0,68,123,0.18)', fontSize: 12, fontFamily: "'Inter',sans-serif" }}
                                >
                                  {SLOTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => confirmAdd(i)} style={{ flex: 1, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 100, padding: '6px 0', fontSize: 12, fontFamily: "'Poppins',sans-serif", fontWeight: 600, cursor: 'pointer' }}>
                                ✓ Add to plan
                              </button>
                              <button onClick={() => cancelAdd(i)} style={{ background: 'none', border: '1px solid rgba(0,68,123,0.18)', borderRadius: 100, padding: '6px 12px', fontSize: 12, color: '#6B7280', cursor: 'pointer', fontFamily: "'Inter',sans-serif" }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {addState === null && (
                          <p style={{ fontSize: 11, color: '#16A34A', fontFamily: "'Inter',sans-serif", paddingLeft: 2 }}>✓ Added to your itinerary</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading dots */}
              {loading && (
                <div style={{ display: 'flex', gap: 4, padding: '6px 10px' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(0,68,123,0.25)', display: 'inline-block', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(0,68,123,0.08)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask Luna anything..."
                style={{ flex: 1, background: '#F4F7FB', border: '1.5px solid rgba(0,68,123,0.12)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#000', outline: 'none', fontFamily: "'Inter',sans-serif" }}
                onFocus={e => (e.target.style.borderColor = '#00447B')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,68,123,0.12)')}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{ background: input.trim() && !loading ? '#FF8210' : '#CBD5E1', color: '#fff', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.15s' }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L9.5 14 7 9 2 6.5 14 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>
    </div>
  );
}
