'use client';
import React, { useState, useRef, useEffect } from 'react';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';


interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  plan: string;
  hotelContext?: string;
  currentActivities?: string;
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

interface Addable { text: string; dayNum: number; slot: TimeSlot }

/* Parse [[ADD: title | day: N | slot: X]] markers from AI response */
function parseAddables(text: string): Addable[] {
  const results: Addable[] = [];
  for (const m of text.matchAll(/\[\[ADD:\s*([^|]+)\|\s*day:\s*(\d+)\s*\|\s*slot:\s*(morning|afternoon|evening|night)\s*\]\]/gi)) {
    results.push({ text: m[1].trim(), dayNum: parseInt(m[2], 10), slot: m[3].toLowerCase() as TimeSlot });
  }
  return results;
}

/* Render inline markdown: **bold** */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}

/* Render assistant message as proper paragraphs, stripping [[ADD:]] markers */
function renderContent(text: string): React.ReactNode {
  const clean = text.replace(/\[\[ADD:[^\]]*\]\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = clean.split(/\n\n+/);
  return paragraphs.map((para, pi) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    // Handle bullet lists inside paragraphs
    if (/^[-*•]\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter(l => l.trim());
      return (
        <ul key={pi} style={{ margin: pi === 0 ? '0' : '8px 0 0', paddingLeft: 16, listStyle: 'disc' }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ marginBottom: 3 }}>{renderInline(item.replace(/^[-*•]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }
    const lines = trimmed.split('\n');
    return (
      <p key={pi} style={{ margin: pi === 0 ? '0' : '8px 0 0', lineHeight: 1.65 }}>
        {lines.map((line, li) => (
          <span key={li}>{li > 0 && <br />}{renderInline(line)}</span>
        ))}
      </p>
    );
  });
}

export default function FloatingChat({ plan, hotelContext, currentActivities, onAddToItinerary }: Props) {
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm Luna. How can I help customize your trip?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Per-message: which addable index is being confirmed (or null = all done for that msg)
  const [confirmedAdds, setConfirmedAdds] = useState<Record<number, Set<number>>>({});
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
      let ctx = plan;
      if (hotelContext) ctx += `\n\n## Confirmed Accommodation\n${hotelContext}`;
      if (currentActivities) ctx += `\n\n## Already in Itinerary (NEVER suggest these again)\n${currentActivities}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          tripContext: ctx,
        }),
      });
      const reply = await collectSSE(res);
      setMsgs(prev => [...prev, { role: 'assistant', content: reply || 'No response received.' }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAdd = (msgIdx: number, addable: Addable, addIdx: number) => {
    onAddToItinerary(addable.text, addable.dayNum, addable.slot);
    setConfirmedAdds(prev => {
      const s = new Set(prev[msgIdx] ?? []);
      s.add(addIdx);
      return { ...prev, [msgIdx]: s };
    });
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
                const addables = m.role === 'assistant' && i > 0 ? parseAddables(m.content) : [];
                const confirmed = confirmedAdds[i] ?? new Set<number>();
                return (
                  <div key={i}>
                    {/* Bubble */}
                    <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        background: m.role === 'user' ? '#FF8210' : '#F2F5FA',
                        color: m.role === 'user' ? '#fff' : '#1a1a1a',
                        borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                        padding: '10px 13px', fontSize: 13, maxWidth: '92%',
                        fontFamily: "'Inter',sans-serif",
                      }}>
                        {m.role === 'user' ? m.content : renderContent(m.content)}
                      </div>
                    </div>

                    {/* Add-to-itinerary chips — one per detected [[ADD:]] marker */}
                    {addables.length > 0 && (
                      <div style={{ paddingLeft: 4, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {addables.map((addable, ai) =>
                          confirmed.has(ai) ? (
                            <span key={ai} style={{ fontSize: 11, color: '#16A34A', fontFamily: "'Inter',sans-serif" }}>
                              ✓ <em>{addable.text}</em> added to Day {addable.dayNum}
                            </span>
                          ) : (
                            <button
                              key={ai}
                              onClick={() => confirmAdd(i, addable, ai)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.28)', borderRadius: 100, padding: '5px 12px', fontSize: 12, fontFamily: "'Poppins',sans-serif", fontWeight: 600, color: '#16A34A', cursor: 'pointer', textAlign: 'left' }}
                            >
                              <span style={{ fontSize: 13 }}>➕</span>
                              <span>Add to Day {addable.dayNum} · {addable.slot}</span>
                              <span style={{ fontWeight: 400, color: '#4B7A55', fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {addable.text}
                              </span>
                            </button>
                          )
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
