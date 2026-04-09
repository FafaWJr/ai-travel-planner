'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { CheckCircle } from 'lucide-react';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  planUpdated?: boolean;
  isWelcome?: boolean;
}

export interface TripUpdate {
  type: 'stays' | 'add_activity' | 'remove_activity' | 'replace_activity' | 'itinerary' | 'budget';
  action?: 'add' | 'update' | 'remove';
  // Hotel updates (type === 'stays')
  data?: {
    hotelName?: string;
    checkInDay?: number;
    checkOutDay?: number;
    city?: string;
    stars?: number;
    neighborhood?: string;
    priceRange?: string;
    amenities?: string[];
  };
  // Activity updates (type === 'add_activity' | 'remove_activity' | 'replace_activity')
  day?: number;
  timeSlot?: string;
  activity?: string;
  location?: string;
  activityIndex?: number;
}

interface Props {
  plan: string;
  destination?: string;
  hotelContext?: string;
  currentActivities?: string;
  onAddToItinerary: (text: string, dayNum: number, slot: TimeSlot) => void;
  onPlanUpdate?: (updatedPlan: string) => void;
  onTripUpdate?: (update: TripUpdate) => void;
  isGuest?: boolean;
  onGateRequired?: () => void;
  initialMessages?: Msg[];
  savedTripId?: string | null;
  onMessagesChange?: (messages: Msg[]) => void;
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

/* Extract and parse a ```json block from Luna's response */
function extractJsonBlock(text: string): { json: Record<string, unknown> | null; cleanText: string } {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { json: null, cleanText: text };
  const cleanText = text.replace(/```json\s*[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim();
  try {
    const json = JSON.parse(match[1].trim()) as Record<string, unknown>;
    return { json, cleanText };
  } catch (err) {
    console.error('[Luna] JSON parse error:', err);
    return { json: null, cleanText };
  }
}

/* Extract %%TRIP_UPDATE%% block from Luna's response.
   Supports both %%TRIP_UPDATE%%...%%END_TRIP_UPDATE%% and %%TRIP_UPDATE%%...%%TRIP_UPDATE%% */
function parseTripUpdate(text: string): { update: TripUpdate | null; cleanText: string } {
  // Match either closing format
  const match = text.match(/%%TRIP_UPDATE%%\s*([\s\S]*?)\s*%%(?:END_TRIP_UPDATE|TRIP_UPDATE)%%/);
  if (!match) return { update: null, cleanText: text };
  const cleanText = text
    .replace(/%%TRIP_UPDATE%%[\s\S]*?%%(?:END_TRIP_UPDATE|TRIP_UPDATE)%%/g, '')
    .replace(/\n{3,}/g, '\n\n').trim();
  try {
    const update = JSON.parse(match[1].trim()) as TripUpdate;
    return { update, cleanText };
  } catch (err) {
    console.error('[Luna] TripUpdate parse error:', err);
    return { update: null, cleanText };
  }
}

interface Addable { text: string; dayNum: number; slot: TimeSlot }

function parseAddables(text: string): Addable[] {
  const results: Addable[] = [];
  for (const m of text.matchAll(/\[\[ADD:\s*([^|]+)\|\s*day:\s*(\d+)\s*\|\s*slot:\s*(morning|afternoon|evening|night)\s*\]\]/gi)) {
    results.push({ text: m[1].trim(), dayNum: parseInt(m[2], 10), slot: m[3].toLowerCase() as TimeSlot });
  }
  return results;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}

function renderContent(text: string): React.ReactNode {
  const clean = text.replace(/\[\[ADD:[^\]]*\]\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = clean.split(/\n\n+/);
  return paragraphs.map((para, pi) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
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

function buildWelcome(firstName: string | null, destination: string | null): string {
  const nameGreeting = firstName ? `Hey ${firstName}!` : `Hey there!`;
  const destinationLine = destination
    ? `I've already had a look at your trip to ${destination} and I'm seriously excited for you.`
    : `I've already had a look at your itinerary and I'm seriously excited for you.`;
  return `${nameGreeting} I'm Luna, your personal travel agent here at Luna Let's Go! ${destinationLine} Need to add a hotel, swap an activity, or just want my honest take on what's worth it and what to skip? Just ask, I'm here for all of it. Let's make this trip absolutely unforgettable!`;
}

export default function FloatingChat({ plan, destination, hotelContext, currentActivities, onAddToItinerary, onPlanUpdate, onTripUpdate, isGuest = false, onGateRequired, initialMessages, savedTripId, onMessagesChange }: Props) {
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [{ role: 'assistant', content: buildWelcome(null, destination ?? null), isWelcome: true }]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmedAdds, setConfirmedAdds] = useState<Record<number, Set<number>>>({});
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user's first name from Supabase session on mount
  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const fullName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;
      const first = fullName ? (fullName as string).split(' ')[0] : null;
      setFirstName(first);
      setSessionLoaded(true);
    });
  }, []); // eslint-disable-line

  // Update welcome message when session or destination changes (only if no restored history)
  useEffect(() => {
    if (!sessionLoaded) return;
    setMsgs(prev => {
      if (prev.length === 1 && prev[0].isWelcome) {
        return [{ role: 'assistant', content: buildWelcome(firstName, destination ?? null), isWelcome: true }];
      }
      return prev;
    });
  }, [sessionLoaded, firstName, destination]); // eslint-disable-line

  // Notify parent whenever msgs change (for chat persistence)
  useEffect(() => {
    if (!onMessagesChange) return;
    // Don't sync if only the welcome message exists
    if (msgs.length === 1 && msgs[0].isWelcome) return;
    onMessagesChange(msgs);
  }, [msgs]); // eslint-disable-line

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  const guestMsgCount = msgs.filter(m => m.role === 'user').length;

  const send = async () => {
    if (!input.trim() || loading) return;
    if (isGuest && guestMsgCount >= 2) { onGateRequired?.(); return; }
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
          messages: next.filter(m => !m.isWelcome).map(m => ({ role: m.role, content: m.content })),
          tripContext: ctx,
          userName: firstName ?? undefined,
        }),
      });
      const raw = await collectSSE(res);

      // Step 1: Extract structured trip update block (hotel/activity/budget changes)
      const { update: tripUpdate, cleanText: afterTripUpdate } = parseTripUpdate(raw);

      // Step 2: Extract JSON plan block (full plan markdown update)
      const { json, cleanText } = extractJsonBlock(afterTripUpdate);
      let displayContent = cleanText || afterTripUpdate;
      let planUpdated = false;

      // Apply structured trip update (hotel additions etc.) - real data write
      if (tripUpdate && onTripUpdate) {
        onTripUpdate(tripUpdate);
        planUpdated = true;
      }

      // Apply full plan markdown update if present
      if (json) {
        const updatedPlan = (json.plan ?? json.tripContext ?? json.content) as string | undefined;
        if (updatedPlan && typeof updatedPlan === 'string' && onPlanUpdate) {
          onPlanUpdate(updatedPlan);
          planUpdated = true;
        }
      }

      setMsgs(prev => [...prev, { role: 'assistant', content: displayContent || 'No response received.', planUpdated }]);
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
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9000, width: 340, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.16)', border: '1px solid rgba(0,68,123,0.10)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div
          onClick={() => setOpen(v => !v)}
          style={{ background: 'linear-gradient(135deg,#00447B,#005FAD)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src="/luna_2.png"
              alt="Luna"
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '2px solid rgba(255,255,255,0.35)', display: 'block', background: '#fff' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #00447B' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', margin: 0 }}>Luna</p>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>AI Travel Assistant</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }}>▾</span>
        </div>

        {/* Conversation saved indicator */}
        {open && savedTripId && (
          <div style={{
            fontSize: 11,
            color: '#679AC1',
            textAlign: 'center',
            padding: '3px 0 5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'rgba(103,154,193,0.07)',
            borderBottom: '1px solid rgba(103,154,193,0.15)',
          }}>
            <CheckCircle size={12} color="#679AC1" />
            Conversation saved with your trip
          </div>
        )}

        {/* Body */}
        {open && (
          <>
            {/* Messages */}
            <div style={{ overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, minHeight: 160 }}>
              {msgs.map((m, i) => {
                const addables = m.role === 'assistant' && i > 0 ? parseAddables(m.content) : [];
                const confirmed = confirmedAdds[i] ?? new Set<number>();
                return (
                  <div key={i}>
                    {/* Bubble */}
                    <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                      {m.role === 'assistant' && (
                        <img
                          src="/luna_2.png"
                          alt=""
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, marginBottom: 2, background: '#00447B' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div style={{
                        background: m.role === 'user' ? '#00447B' : '#F0F6FC',
                        color: m.role === 'user' ? '#fff' : '#1a1a1a',
                        borderRadius: m.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                        borderLeft: m.role === 'assistant' ? '3px solid #FF8210' : 'none',
                        padding: '10px 13px', fontSize: 13, maxWidth: '88%',
                        fontFamily: "'Inter',sans-serif",
                      }}>
                        {m.role === 'user' ? m.content : renderContent(m.content)}
                      </div>
                    </div>

                    {/* Plan updated badge */}
                    {m.planUpdated && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, marginLeft: 32, padding: '4px 10px', background: 'rgba(255,130,16,0.08)', border: '1px solid rgba(255,130,16,0.25)', borderRadius: 100, width: 'fit-content' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210' }}>Plan updated!</span>
                      </div>
                    )}

                    {/* Add-to-itinerary chips */}
                    {addables.length > 0 && (
                      <div style={{ paddingLeft: 32, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
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

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <img
                    src="/luna_2.png"
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, marginBottom: 2, background: '#00447B' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ background: '#F0F6FC', borderLeft: '3px solid #FF8210', borderRadius: '0 12px 12px 12px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF8210', display: 'inline-block', animation: `lunaTyping 1.2s ${i * 0.15}s infinite ease-in-out` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Guest limit hint */}
            {isGuest && (
              <div style={{ padding: '6px 12px', background: 'rgba(255,130,16,0.06)', borderTop: '1px solid rgba(255,130,16,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#FF8210' }}>
                  {2 - guestMsgCount > 0 ? `${2 - guestMsgCount} free message${2 - guestMsgCount === 1 ? '' : 's'} left` : 'Free limit reached'}
                </span>
                <button onClick={onGateRequired} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: '#FF8210', background: 'none', border: '1px solid rgba(255,130,16,0.4)', borderRadius: 100, padding: '2px 8px', cursor: 'pointer' }}>
                  Sign in for unlimited
                </button>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(0,68,123,0.08)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask Luna anything about your trip..."
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
        @keyframes lunaTyping {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
