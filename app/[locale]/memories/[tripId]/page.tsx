'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';
import { useTranslations, useLocale } from 'next-intl';
import {
  BookHeart, ChevronDown, ChevronUp,
  Frown, Smile, Zap, Leaf, Heart,
  Sparkles, Check, PenLine, RefreshCw, Loader2,
  Share2, Link2, CheckCircle, ImagePlus, Download,
} from 'lucide-react';
import nextDynamic from 'next/dynamic';
import DayPhotoGrid from '@/components/memories/DayPhotoGrid';
import BulkPhotoUpload from '@/components/memories/BulkPhotoUpload';
import type { PhotoMeta } from '@/lib/memories/types';

const RouteMap = nextDynamic(() => import('@/components/memories/RouteMap'), {
  ssr: false,
  loading: () => null,
});

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemoryDay {
  dayNumber: number;
  dayTitle: string;
  notes: string;
  mood: string | null;
  highlight: boolean;
  photos: PhotoMeta[];
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ─── Component ────────────────────────────────────────────────────────────────

export default function MemoryCapturePage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations('memories');
  const locale = useLocale();

  const [tripId, setTripId] = useState<string | null>(null);
  const [memory, setMemory] = useState<MemoryData | null>(null);
  const [trip, setTrip] = useState<TripMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [narrativeText, setNarrativeText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

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
        if (data.memory?.narrative) {
          setNarrativeText(data.memory.narrative);
        }
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

  const generateNarrative = useCallback(async () => {
    if (!tripId || isGenerating) return;
    setIsGenerating(true);
    setNarrativeText('');
    setIsEditingNarrative(false);

    try {
      const res = await fetch('/api/memories/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, locale }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setNarrativeText(accumulated);
            }
          } catch { /* skip malformed */ }
        }
      }

      if (accumulated.trim()) {
        const res2 = await fetch(`/api/memories/${tripId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memory_data: memory?.memory_data,
            status: 'complete',
            narrative: accumulated,
          }),
        });
        if (res2.ok) {
          const saved = await res2.json();
          setMemory(saved.memory);
        }
      }
    } catch (err) {
      console.error('[memories] narrative generation error:', err);
      setNarrativeText('Something went wrong generating your story. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [tripId, isGenerating, memory?.memory_data, locale]);

  const saveNarrative = useCallback(async () => {
    if (!tripId || !narrativeText.trim()) return;
    try {
      await fetch(`/api/memories/${tripId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative: narrativeText }),
      });
    } catch (err) {
      console.error('[memories] save narrative error:', err);
    }
  }, [tripId, narrativeText]);

  const copyShareLink = useCallback(async () => {
    if (!memory?.share_token) return;
    const url = `${window.location.origin}/memories/share/${memory.share_token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      /* fallback: do nothing */
    }
  }, [memory?.share_token]);

  const downloadPdf = useCallback(async () => {
    if (!tripId || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const res = await fetch('/api/memories/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: tripId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeDestination = (trip?.destination ?? 'trip').replace(/[^a-zA-Z0-9]/g, '-');
      link.download = `${safeDestination}-memory.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[memories] PDF download error:', err);
    } finally {
      setGeneratingPdf(false);
    }
  }, [tripId, generatingPdf, trip?.destination]);

  const refetchMemory = useCallback(async () => {
    if (!tripId) return;
    try {
      const res = await fetch(`/api/memories/${tripId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMemory(data.memory);
    } catch { /* noop */ }
  }, [tripId]);

  const handleDayPhotosAdded = useCallback((dayNumber: number, newPhotos: PhotoMeta[]) => {
    setMemory(prev => {
      if (!prev) return prev;
      const days = prev.memory_data.days.map(d =>
        d.dayNumber === dayNumber
          ? { ...d, photos: [...(d.photos ?? []), ...newPhotos] }
          : d,
      );
      return { ...prev, memory_data: { ...prev.memory_data, days } };
    });
  }, []);

  const handlePhotoDelete = useCallback(async (dayNumber: number, photoId: string) => {
    if (!tripId) return;
    try {
      await fetch('/api/memories/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId, dayNumber, photoId }),
      });
      setMemory(prev => {
        if (!prev) return prev;
        const days = prev.memory_data.days.map(d =>
          d.dayNumber === dayNumber
            ? { ...d, photos: d.photos.filter(p => p.id !== photoId) }
            : d,
        );
        return { ...prev, memory_data: { ...prev.memory_data, days } };
      });
    } catch (err) {
      console.error('[memories] photo delete error:', err);
      refetchMemory();
    }
  }, [tripId, refetchMemory]);

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

        {/* Bulk photo upload */}
        {trip?.start_date && trip?.end_date && (
          <BulkPhotoUpload
            tripId={tripId!}
            tripStartDate={trip.start_date}
            tripEndDate={trip.end_date}
            days={days.map(d => ({ dayNumber: d.dayNumber, dayTitle: d.dayTitle }))}
            onPhotosAdded={handleDayPhotosAdded}
          />
        )}

        {/* Route map from photo GPS data */}
        {days.some(d => (d.photos ?? []).some(p => p.exifLat !== null && p.exifLng !== null)) && (
          <p style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
            color: '#00447B', margin: '16px 0 4px', textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {t('mapLabel')}
          </p>
        )}
        <RouteMap days={days} />

        {/* Day cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
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

                  {!isExpanded && (day.photos ?? []).length > 0 && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#679AC1',
                    }}>
                      <ImagePlus size={12} color="#679AC1" />
                      {t('photoCount', { count: (day.photos ?? []).length })}
                    </span>
                  )}

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

                    {/* Photo grid for this day */}
                    {(day.photos ?? []).length > 0 && (
                      <p style={{
                        fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                        color: '#00447B', margin: '12px 0 6px', textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}>
                        {t('photosLabel')}
                      </p>
                    )}
                    {(day.photos ?? []).length > 0 && (
                      <DayPhotoGrid
                        photos={day.photos ?? []}
                        supabaseUrl={supabaseUrl}
                        onDelete={photoId => handlePhotoDelete(day.dayNumber, photoId)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── Generate story / Narrative section ──────────────────────────── */}
        <div style={{ marginTop: 32 }}>
          {/* Generate button — appears once 3+ days have notes */}
          {capturedCount >= 3 && !narrativeText && !isGenerating && (
            <button
              onClick={generateNarrative}
              style={{
                width: '100%', padding: '16px 24px',
                background: '#FF8210', color: '#fff', border: 'none',
                borderRadius: 12, cursor: 'pointer',
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'background 0.15s',
                boxShadow: '0 4px 12px rgba(255,130,16,0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e67400'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF8210'; }}
            >
              <PenLine size={18} />
              {t('generateStory')}
            </button>
          )}

          {/* Nudge when fewer than 3 days have notes */}
          {capturedCount < 3 && capturedCount > 0 && !narrativeText && (
            <p style={{
              textAlign: 'center', fontFamily: "'Inter',sans-serif",
              fontSize: 13, color: '#C0C0C0', marginTop: 8,
            }}>
              {t('minDaysNotice', { needed: 3 - capturedCount })}
            </p>
          )}

          {/* Generating spinner */}
          {isGenerating && !narrativeText && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: 24,
            }}>
              <Loader2 size={20} color="#FF8210" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 14,
                color: '#FF8210',
              }}>
                {t('narrativeGenerating')}
              </span>
            </div>
          )}

          {/* Streaming display — text appearing word by word */}
          {isGenerating && narrativeText && (
            <div style={{
              background: '#FDFBF7', borderRadius: 12,
              border: '1.5px solid rgba(255,130,16,0.2)',
              padding: 28, marginTop: 12,
            }}>
              <div style={{
                fontFamily: "'Inter',sans-serif", fontSize: 15, color: '#2a2a3e',
                lineHeight: 1.85, whiteSpace: 'pre-wrap',
              }}>
                {narrativeText}
                <span style={{
                  display: 'inline-block', width: 8, height: 18,
                  background: '#FF8210', marginLeft: 2,
                  animation: 'blink 1s step-end infinite',
                }} />
              </div>
            </div>
          )}

          {/* Share panel — visible once story is complete */}
          {narrativeText && !isGenerating && memory?.status === 'complete' && (
            <div style={{
              marginTop: 24, background: '#fff', borderRadius: 12,
              border: '1.5px solid rgba(0,68,123,0.08)',
              padding: '24px 28px',
            }}>
              <h3 style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15,
                color: '#00447B', margin: '0 0 16px',
              }}>
                {t('shareStory')}
              </h3>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
              }}>
                {/* Copy link */}
                <button
                  onClick={copyShareLink}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', borderRadius: 10,
                    border: copied ? '1.5px solid #16A34A' : '1.5px solid rgba(0,68,123,0.12)',
                    background: copied ? 'rgba(22,163,74,0.04)' : '#fff',
                    color: copied ? '#16A34A' : '#00447B',
                    cursor: 'pointer',
                    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                >
                  {copied ? <CheckCircle size={15} /> : <Link2 size={15} />}
                  {copied ? t('linkCopied') : t('copyLink')}
                </button>

                {/* Download Stories card */}
                <a
                  href={`/api/memories/card/${memory.share_token}`}
                  download={`${(trip?.destination ?? 'trip').replace(/[^a-zA-Z0-9]/g, '-')}-story.png`}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', borderRadius: 10,
                    border: '1.5px solid rgba(0,68,123,0.12)',
                    background: '#fff', color: '#00447B',
                    textDecoration: 'none',
                    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Download size={15} />
                  {t('downloadStoryCard')}
                </a>

                {/* Download carousel images */}
                <button
                  onClick={async () => {
                    const dayCount = memory?.memory_data?.days?.length ?? 0;
                    for (let i = 1; i <= dayCount; i++) {
                      const link = document.createElement('a');
                      link.href = `/api/memories/card/day/${memory.share_token}/${i}`;
                      link.download = `day-${i}.png`;
                      link.click();
                      await new Promise<void>(r => setTimeout(r, 300));
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', borderRadius: 10,
                    border: '1.5px solid rgba(0,68,123,0.12)',
                    background: '#fff', color: '#00447B',
                    cursor: 'pointer',
                    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
                  }}
                >
                  <Download size={15} />
                  {t('downloadCarousel')}
                </button>

                {/* Share to Instagram */}
                <button
                  onClick={() => {
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    const link = document.createElement('a');
                    link.href = `/api/memories/card/${memory.share_token}`;
                    link.download = 'luna-story.png';
                    link.click();
                    if (isMobile) {
                      setTimeout(() => alert(t('instagramShareHint')), 500);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600,
                  }}
                >
                  <Share2 size={15} />
                  {t('shareInstagram')}
                </button>

                {/* Download PDF story */}
                <button
                  onClick={downloadPdf}
                  disabled={generatingPdf}
                  style={{
                    gridColumn: 'span 2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '13px 16px', borderRadius: 10,
                    border: '1.5px solid rgba(0,68,123,0.15)',
                    background: generatingPdf ? 'rgba(0,68,123,0.04)' : '#fff',
                    color: generatingPdf ? '#C0C0C0' : '#00447B',
                    cursor: generatingPdf ? 'not-allowed' : 'pointer',
                    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600,
                    transition: 'all 0.15s',
                  }}
                >
                  {generatingPdf
                    ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Download size={15} />}
                  {generatingPdf ? t('generatingPdf') : t('downloadPdf')}
                </button>
              </div>
            </div>
          )}

          {/* Completed narrative display */}
          {narrativeText && !isGenerating && (
            <div style={{
              background: '#FDFBF7', borderRadius: 12,
              border: '1.5px solid rgba(0,68,123,0.08)',
              padding: 28,
            }}>
              {/* Header with edit / re-roll controls */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 16,
              }}>
                <h2 style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 20,
                  color: '#00447B', margin: 0,
                }}>
                  {t('yourStory')}
                </h2>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setIsEditingNarrative(!isEditingNarrative)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 100,
                      border: '1.5px solid rgba(0,68,123,0.12)',
                      background: isEditingNarrative ? '#00447B' : '#fff',
                      color: isEditingNarrative ? '#fff' : '#00447B',
                      cursor: 'pointer',
                      fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    <PenLine size={13} />
                    {isEditingNarrative ? t('doneEditing') : t('editStory')}
                  </button>
                  <button
                    onClick={generateNarrative}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 100,
                      border: '1.5px solid rgba(0,68,123,0.12)',
                      background: '#fff', color: '#6C6D6F',
                      cursor: 'pointer',
                      fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500,
                      transition: 'all 0.15s',
                    }}
                  >
                    <RefreshCw size={13} />
                    {t('narrativeReroll')}
                  </button>
                </div>
              </div>

              {/* Narrative content */}
              {isEditingNarrative ? (
                <div>
                  <textarea
                    value={narrativeText}
                    onChange={e => setNarrativeText(e.target.value)}
                    onBlur={saveNarrative}
                    rows={20}
                    style={{
                      width: '100%', padding: 16, borderRadius: 8,
                      border: '1.5px solid #FF8210',
                      fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#2a2a3e',
                      lineHeight: 1.85, resize: 'vertical',
                      outline: 'none', background: '#fff',
                      boxSizing: 'border-box',
                    }}
                  />
                  <p style={{
                    fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#C0C0C0',
                    marginTop: 6,
                  }}>
                    {t('narrativeEditHint')}
                  </p>
                </div>
              ) : (
                <div style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 15, color: '#2a2a3e',
                  lineHeight: 1.85, whiteSpace: 'pre-wrap',
                }}>
                  {narrativeText}
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0; } }
        textarea::placeholder { color: #C0C0C0; }
      `}</style>
    </div>
  );
}
