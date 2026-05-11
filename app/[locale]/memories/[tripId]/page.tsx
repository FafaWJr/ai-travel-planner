'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';
import { useTranslations } from 'next-intl';
import {
  BookHeart, ChevronDown, ChevronUp,
  Frown, Smile, Zap, Leaf, Heart,
  Sparkles, Check,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemoryDay {
  dayNumber: number;
  dayTitle: string;
  notes: string;
  mood: string | null;
  highlight: boolean;
  photos: unknown[];
}

interface MemoryData {
  id: string;
  trip_id: string;
  user_id: string;
  memory_data: { days: MemoryDay[] };
  narrative: string | null;
  narrative_tone: string;
  status: string;
  share_token: string;
  created_at: string;
  updated_at: string;
}

interface TripMeta {
  id: string;
  destination: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
}

const MOODS = [
  { key: 'exhausted', icon: Frown, color: '#6C6D6F' },
  { key: 'content', icon: Smile, color: '#679AC1' },
  { key: 'excited', icon: Zap, color: '#FF8210' },
  { key: 'peaceful', icon: Leaf, color: '#4A9D5B' },
  { key: 'emotional', icon: Heart, color: '#C0547A' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemoryCapturePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('memories');

  const [tripId, setTripId] = useState<string | null>(null);
  const [memory, setMemory] = useState<MemoryData | null>(null);
  const [trip, setTrip] = useState<TripMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    params.then(p => setTripId(p.tripId));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login?next=/my-trips');
  }, [user, authLoading]); // eslint-disable-line

  useEffect(() => {
    if (!user || !tripId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/memories/${tripId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setMemory(data.memory);
        setTrip(data.trip);
        const firstEmpty = data.memory?.memory_data?.days?.findIndex(
          (d: MemoryDay) => !d.notes
        );
        if (firstEmpty !== undefined && firstEmpty >= 0) {
          setExpandedDay(firstEmpty);
        }
      } catch (err) {
        console.error('[memories] fetch error:', err);
        setError('Could not load your trip');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, tripId]); // eslint-disable-line

  const saveMemoryData = useCallback((days: MemoryDay[]) => {
    if (!tripId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/memories/${tripId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memory_data: { days } }),
        });
      } catch (err) {
        console.error('[memories] save error:', err);
      } finally {
        setSaving(false);
      }
    }, 1000);
  }, [tripId]);

  const updateDay = useCallback((dayIndex: number, field: keyof MemoryDay, value: unknown) => {
    if (!memory) return;
    const days = [...memory.memory_data.days];
    const day = { ...days[dayIndex] };

    if (field === 'highlight' && value === true) {
      days.forEach((d, i) => { if (i !== dayIndex) days[i] = { ...d, highlight: false }; });
    }

    (day as Record<string, unknown>)[field] = value;
    days[dayIndex] = day;

    setMemory(prev => prev ? { ...prev, memory_data: { ...prev.memory_data, days } } : prev);
    saveMemoryData(days);
  }, [memory, saveMemoryData]);

  const days = memory?.memory_data?.days ?? [];
  const capturedCount = days.filter(d => d.notes.trim().length > 0).length;
  const totalDays = days.length;
  const progressPct = totalDays > 0 ? (capturedCount / totalDays) * 100 : 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FB' }}>
        <NavBar />
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.12)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !memory || !trip) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4F7FB' }}>
        <NavBar />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Inter',sans-serif", color: '#6C6D6F', fontSize: 16 }}>
            {error || 'Trip not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7FB', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px 60px' }}>

        {/* Trip header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <BookHeart size={24} color="#FF8210" />
            <h1 style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 28,
              color: '#00447B', margin: 0,
            }}>
              {trip.destination || trip.title || t('untitledTrip')}
            </h1>
          </div>
          {(trip.start_date || trip.end_date) && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#6C6D6F', margin: 0 }}>
              {trip.start_date && new Date(trip.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              {trip.start_date && trip.end_date ? ' → ' : ''}
              {trip.end_date && new Date(trip.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          <p style={{
            fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#6C6D6F',
            marginTop: 12, lineHeight: 1.6,
          }}>
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#00447B' }}>
              {t('progress', { count: capturedCount, total: totalDays })}
            </span>
            {saving && (
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#C0C0C0' }}>
                {t('saving')}
              </span>
            )}
          </div>
          <div style={{ height: 6, background: '#E5E7EB', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progressPct}%`,
              background: '#FF8210', borderRadius: 100,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Day cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {days.map((day, i) => {
            const isExpanded = expandedDay === i;
            const hasMood = day.mood !== null;
            const hasNotes = day.notes.trim().length > 0;

            return (
              <div key={day.dayNumber} style={{
                background: '#fff', borderRadius: 12,
                border: day.highlight ? '2px solid #FF8210' : '1.5px solid rgba(0,68,123,0.10)',
                boxShadow: '0 2px 8px rgba(0,68,123,0.04)',
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}>
                {/* Collapsed header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : i)}
                  style={{
                    width: '100%', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: hasNotes ? '#FF8210' : '#00447B',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13,
                    flexShrink: 0,
                  }}>
                    {day.dayNumber}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
                      color: '#00447B', margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {day.dayTitle}
                    </p>
                    {!isExpanded && hasNotes && (
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#6C6D6F',
                        margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {day.notes.slice(0, 80)}{day.notes.length > 80 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  {!isExpanded && hasMood && (() => {
                    const m = MOODS.find(mo => mo.key === day.mood);
                    return m ? <m.icon size={16} color={m.color} /> : null;
                  })()}

                  {day.highlight && <Sparkles size={16} color="#FF8210" />}

                  {isExpanded ? <ChevronUp size={18} color="#C0C0C0" /> : <ChevronDown size={18} color="#C0C0C0" />}
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ padding: '0 18px 18px' }}>
                    <textarea
                      value={day.notes}
                      onChange={e => updateDay(i, 'notes', e.target.value)}
                      placeholder={t('notesPlaceholder')}
                      rows={3}
                      style={{
                        width: '100%', padding: 12, borderRadius: 8,
                        border: '1.5px solid rgba(0,68,123,0.12)',
                        fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#2a2a3e',
                        lineHeight: 1.6, resize: 'vertical',
                        outline: 'none', background: '#FDFBF7',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#FF8210'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,68,123,0.12)'; }}
                    />

                    <div style={{ marginTop: 14 }}>
                      <p style={{
                        fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                        color: '#6C6D6F', margin: '0 0 8px', textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {t('moodLabel')}
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {MOODS.map(m => {
                          const isActive = day.mood === m.key;
                          return (
                            <button
                              key={m.key}
                              onClick={() => updateDay(i, 'mood', isActive ? null : m.key)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 100,
                                border: isActive ? `2px solid ${m.color}` : '1.5px solid #E5E7EB',
                                background: isActive ? `${m.color}10` : '#fff',
                                cursor: 'pointer',
                                fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500,
                                color: isActive ? m.color : '#6C6D6F',
                                transition: 'all 0.15s',
                              }}
                            >
                              <m.icon size={14} color={isActive ? m.color : '#C0C0C0'} />
                              {t(`mood.${m.key}`)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={() => updateDay(i, 'highlight', !day.highlight)}
                      style={{
                        marginTop: 14, display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', borderRadius: 100,
                        border: day.highlight ? '2px solid #FF8210' : '1.5px solid #E5E7EB',
                        background: day.highlight ? 'rgba(255,130,16,0.06)' : '#fff',
                        cursor: 'pointer',
                        fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500,
                        color: day.highlight ? '#FF8210' : '#6C6D6F',
                        transition: 'all 0.15s',
                      }}
                    >
                      {day.highlight ? <Check size={14} color="#FF8210" /> : <Sparkles size={14} color="#C0C0C0" />}
                      {t('highlight')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder { color: #C0C0C0; }
      `}</style>
    </div>
  );
}
