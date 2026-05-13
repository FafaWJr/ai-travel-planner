'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NavBar from '@/components/NavBar';
import { useTranslations, useLocale } from 'next-intl';
import {
  BookHeart, ChevronDown, ChevronUp,
  Sparkles, Check, PenLine, RefreshCw, Loader2,
  Share2, Link2, CheckCircle, ImagePlus, Download, MapPin,
} from 'lucide-react';
import { MOOD_CATEGORIES, MAX_MOODS, normaliseMood } from '@/lib/memories/mood';
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
  dayTitleSource?: 'skeleton' | 'gps' | 'user';
  locations?: Array<{ name: string; type: string; lat: number; lng: number; photoCount: number; timeRange: string | null }>;
  confidence?: 'high' | 'medium' | 'low' | 'none';
  notes: string;
  mood: string | string[] | null;
  highlight: boolean;
  photos: PhotoMeta[];
}

interface MemoryData {
  id: string;
  trip_id: string | null;
  user_id: string;
  memory_data: { days: MemoryDay[] };
  narrative: string | null;
  narrative_tone: string;
  status: string;
  share_token: string;
  pdf_purchased: boolean;
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
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [reconstructing, setReconstructing] = useState(false);
  const [reconstructDone, setReconstructDone] = useState(false);
  const [editingTitleDay, setEditingTitleDay] = useState<number | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  useEffect(() => {
    params.then(p => setTripId(p.tripId));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('luna_redirect_after_login', window.location.pathname);
      }
      router.replace('/auth/login');
    }
  }, [user, authLoading]); // eslint-disable-line

  // Detect ?payment=success redirect from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && tripId) {
      fetch(`/api/memories/${tripId}`)
        .then(res => res.json())
        .then(data => { if (data.memory) setMemory(data.memory); })
        .catch(() => { /* noop */ });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [tripId]);

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

  const handlePurchase = useCallback(async () => {
    if (!memory || paymentProcessing) return;
    setPaymentProcessing(true);
    try {
      const memoryId = memory.trip_id ?? memory.id;
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.alreadyPurchased) {
        setMemory(prev => prev ? { ...prev, pdf_purchased: true } : prev);
        setShowPdfPreview(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('[payment] error:', err);
      alert('Payment failed. Please try again.');
    } finally {
      setPaymentProcessing(false);
    }
  }, [memory, paymentProcessing]);

  const hasGpsPhotos = useMemo(() => {
    if (!memory?.memory_data?.days) return false;
    return memory.memory_data.days.some(day =>
      day.photos?.some(p => typeof p.exifLat === 'number'),
    );
  }, [memory]);

  const refetchMemory = useCallback(async () => {
    if (!tripId) return;
    try {
      const res = await fetch(`/api/memories/${tripId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMemory(data.memory);
    } catch { /* noop */ }
  }, [tripId]);

  const handleReconstructTitles = useCallback(async () => {
    if (!memory || reconstructing) return;
    setReconstructing(true);
    setReconstructDone(false);
    try {
      const res = await fetch('/api/memories/reconstruct-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: memory.id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('[reconstruct] Error:', err);
        return;
      }
      const { days: updatedDays } = await res.json();
      setMemory(prev => {
        if (!prev) return prev;
        const newDays = prev.memory_data.days.map(day => {
          const updated = updatedDays.find((d: { dayNumber: number }) => d.dayNumber === day.dayNumber);
          if (!updated) return day;
          return {
            ...day,
            dayTitle: updated.title,
            dayTitleSource: updated.source,
            locations: updated.locations,
            confidence: updated.confidence,
          };
        });
        return { ...prev, memory_data: { ...prev.memory_data, days: newDays } };
      });
      setReconstructDone(true);
      setTimeout(() => setReconstructDone(false), 4000);
    } catch (err) {
      console.error('[reconstruct] Error:', err);
    } finally {
      setReconstructing(false);
    }
  }, [memory, reconstructing]);

  const saveTitleEdit = useCallback((dayIndex: number) => {
    const trimmed = editingTitleValue.trim();
    if (!trimmed || !memory) return;
    const days = [...memory.memory_data.days];
    days[dayIndex] = { ...days[dayIndex], dayTitle: trimmed, dayTitleSource: 'user' };
    setMemory(prev => prev ? { ...prev, memory_data: { ...prev.memory_data, days } } : prev);
    saveMemoryData(days);
    setEditingTitleDay(null);
    setEditingTitleValue('');
  }, [editingTitleValue, memory, saveMemoryData]);

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

        {/* Reconstruct titles from GPS data */}
        {hasGpsPhotos && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 18px', marginTop: 16, marginBottom: 4,
            background: reconstructDone ? 'rgba(16,185,129,0.06)' : 'rgba(255,130,16,0.06)',
            border: `1px solid ${reconstructDone ? 'rgba(16,185,129,0.2)' : 'rgba(255,130,16,0.2)'}`,
            borderRadius: 12,
            transition: 'background 0.3s, border-color 0.3s',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke={reconstructDone ? '#10b981' : '#FF8210'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13,
                color: reconstructDone ? '#10b981' : '#00447B', margin: 0,
              }}>
                {reconstructDone ? t('reconstructDone') : reconstructing ? t('reconstructing') : t('reconstructTitles')}
              </p>
              {!reconstructing && !reconstructDone && (
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 12,
                  color: '#6C6D6F', margin: '2px 0 0',
                }}>
                  {t('reconstructTitlesHint')}
                </p>
              )}
            </div>
            {!reconstructDone && (
              <button
                onClick={handleReconstructTitles}
                disabled={reconstructing}
                style={{
                  background: reconstructing ? '#ccc' : '#FF8210',
                  color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 16px', fontFamily: "'Poppins',sans-serif",
                  fontWeight: 600, fontSize: 12, cursor: reconstructing ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  opacity: reconstructing ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {reconstructing ? '...' : (
                  days.some(d => d.dayTitleSource === 'gps')
                    ? t('reconstructAgain')
                    : t('reconstructTitles')
                )}
              </button>
            )}
          </div>
        )}

        {/* Day cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {days.map((day, i) => {
            const isExpanded = expandedDay === i;
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
                <div
                  onClick={() => { if (editingTitleDay !== i) setExpandedDay(isExpanded ? null : i); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && editingTitleDay !== i) setExpandedDay(isExpanded ? null : i); }}
                  style={{
                    width: '100%', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'none', border: 'none',
                    cursor: editingTitleDay === i ? 'default' : 'pointer',
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
                    {editingTitleDay === i ? (
                      <input
                        autoFocus
                        value={editingTitleValue}
                        onChange={e => setEditingTitleValue(e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation();
                          if (e.key === 'Enter') saveTitleEdit(i);
                          if (e.key === 'Escape') { setEditingTitleDay(null); setEditingTitleValue(''); }
                        }}
                        onBlur={() => saveTitleEdit(i)}
                        onClick={e => e.stopPropagation()}
                        style={{
                          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
                          color: '#00447B', background: 'rgba(0,68,123,0.05)',
                          border: '1.5px solid #679AC1', borderRadius: 6,
                          padding: '2px 8px', outline: 'none', width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    ) : (
                      <div
                        onClick={e => {
                          e.stopPropagation();
                          setEditingTitleDay(i);
                          setEditingTitleValue(day.dayTitle);
                        }}
                        title={t('tapToEdit')}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', cursor: 'text' }}
                      >
                        <span style={{
                          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
                          color: '#00447B', overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', flex: '1 1 auto', minWidth: 0,
                        }}>
                          {day.dayTitle}
                        </span>
                        <PenLine size={11} color="#C0C0C0" style={{ flexShrink: 0 }} />
                      </div>
                    )}
                    {day.dayTitleSource === 'gps' && editingTitleDay !== i && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        marginTop: 2, padding: '1px 6px',
                        background: 'rgba(74,157,91,0.08)', borderRadius: 6,
                        color: '#4A9D5B', fontSize: 10,
                        fontFamily: "'Inter',sans-serif", fontWeight: 500,
                      }}>
                        <MapPin size={10} />
                        {t('titleSourceGps')}
                      </div>
                    )}
                    {Array.isArray(day.locations) && day.locations.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 3 }}>
                        {day.locations.map((loc: { name: string }, locIdx: number) => (
                          <span key={locIdx} style={{
                            display: 'inline-block',
                            padding: '1px 7px',
                            background: 'rgba(0,68,123,0.06)',
                            borderRadius: 6,
                            fontFamily: "'Inter',sans-serif",
                            fontSize: 11,
                            color: '#679AC1',
                            fontWeight: 500,
                          }}>
                            {loc.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {!isExpanded && hasNotes && (
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#6C6D6F',
                        margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {day.notes.slice(0, 80)}{day.notes.length > 80 ? '...' : ''}
                      </p>
                    )}
                  </div>

                  {!isExpanded && normaliseMood(day.mood).length > 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '2px 8px', background: 'rgba(255,130,16,0.08)',
                      borderRadius: 20, fontFamily: "'Inter',sans-serif",
                      fontSize: 11, color: '#FF8210', fontWeight: 500, whiteSpace: 'nowrap',
                    }}>
                      {t(`mood.${normaliseMood(day.mood)[0]}` as Parameters<typeof t>[0])}
                      {normaliseMood(day.mood).length > 1 && ` +${normaliseMood(day.mood).length - 1}`}
                    </span>
                  )}

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
                </div>

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
                        color: '#6C6D6F', margin: '0 0 10px', textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {t('moodLabel')}
                        {normaliseMood(day.mood).length > 0 && (
                          <span style={{
                            fontFamily: "'Inter',sans-serif", fontWeight: 400, fontSize: 10,
                            color: '#FF8210', textTransform: 'none', letterSpacing: 0, marginLeft: 8,
                          }}>
                            {t('moodMaxHint', { count: normaliseMood(day.mood).length, max: MAX_MOODS })}
                          </span>
                        )}
                      </p>
                      {MOOD_CATEGORIES.map(category => {
                        const currentMoods = normaliseMood(day.mood);
                        return (
                          <div key={category.key} style={{ marginBottom: 8 }}>
                            <p style={{
                              fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 500,
                              color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em',
                              margin: '0 0 4px',
                            }}>
                              {t(`moodCategory.${category.key}` as Parameters<typeof t>[0])}
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {category.moods.map(moodKey => {
                                const isSelected = currentMoods.includes(moodKey);
                                const isDisabled = !isSelected && currentMoods.length >= MAX_MOODS;
                                return (
                                  <button
                                    key={moodKey}
                                    onClick={() => {
                                      if (isDisabled) return;
                                      const next = isSelected
                                        ? currentMoods.filter(m => m !== moodKey)
                                        : [...currentMoods, moodKey];
                                      updateDay(i, 'mood', next);
                                    }}
                                    disabled={isDisabled}
                                    style={{
                                      display: 'inline-flex', alignItems: 'center',
                                      padding: '4px 10px', borderRadius: 20,
                                      border: `1.5px solid ${isSelected ? '#FF8210' : 'rgba(0,68,123,0.10)'}`,
                                      background: isSelected ? '#FF8210' : '#F4F7FB',
                                      color: isSelected ? '#fff' : isDisabled ? '#ccc' : '#333',
                                      fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500,
                                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                                      transition: 'all 0.15s',
                                      opacity: isDisabled ? 0.5 : 1,
                                    }}
                                  >
                                    {t(`mood.${moodKey}` as Parameters<typeof t>[0])}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
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

                    {day.confidence === 'none' && !hasNotes && (day.photos ?? []).length === 0 && (
                      <p style={{
                        fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#C0C0C0',
                        marginTop: 14, fontStyle: 'italic', textAlign: 'center',
                      }}>
                        {t('confidenceNone')}
                      </p>
                    )}

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

                {/* PDF: direct download (purchased) or paywall CTA */}
                {memory.pdf_purchased ? (
                  <button
                    onClick={downloadPdf}
                    disabled={generatingPdf}
                    style={{
                      gridColumn: 'span 2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px 16px', borderRadius: 10,
                      border: 'none',
                      background: generatingPdf ? 'rgba(0,68,123,0.6)' : '#00447B',
                      color: '#fff',
                      cursor: generatingPdf ? 'default' : 'pointer',
                      fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    {generatingPdf
                      ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Download size={16} />}
                    {generatingPdf ? t('generatingPdf') : t('downloadPdf')}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowPdfPreview(true)}
                    style={{
                      gridColumn: 'span 2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '14px 16px', borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #FF8210 0%, #e67400 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600,
                      transition: 'all 0.15s',
                      boxShadow: '0 4px 12px rgba(255,130,16,0.3)',
                    }}
                  >
                    <Download size={16} />
                    {t('getPdfStory')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PDF preview / paywall modal */}
          {showPdfPreview && !memory.pdf_purchased && (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,20,60,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24,
              }}
              onClick={() => setShowPdfPreview(false)}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: '#fff', borderRadius: 16,
                  maxWidth: 520, width: '100%',
                  maxHeight: '90vh', overflowY: 'auto',
                  boxShadow: '0 24px 80px rgba(0,20,60,0.25)',
                }}
              >
                {/* Preview header */}
                <div style={{
                  background: 'linear-gradient(180deg, #001F3F 0%, #00447B 100%)',
                  borderRadius: '16px 16px 0 0',
                  padding: '40px 32px 32px', textAlign: 'center', color: '#fff',
                }}>
                  <BookHeart size={28} color="#FF8210" style={{ marginBottom: 12 }} />
                  <h3 style={{
                    fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 22,
                    margin: '0 0 6px',
                  }}>
                    {trip?.destination ?? t('untitledTrip')}
                  </h3>
                  <p style={{
                    fontFamily: "'Inter',sans-serif", fontSize: 13,
                    color: 'rgba(255,255,255,0.5)', margin: 0,
                  }}>
                    {t('pdfPreviewSubtitle')}
                  </p>
                </div>

                {/* What is included */}
                <div style={{ padding: '28px 32px' }}>
                  <p style={{
                    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
                    color: '#00447B', margin: '0 0 14px',
                  }}>
                    {t('pdfIncludes')}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                    {([
                      { label: t('pdfIncludesCover'), detail: t('pdfIncludesCoverDetail') },
                      { label: t('pdfIncludesOverview'), detail: t('pdfIncludesOverviewDetail') },
                      { label: t('pdfIncludesDays'), detail: t('pdfIncludesDaysDetail') },
                      { label: t('pdfIncludesPhotos'), detail: t('pdfIncludesPhotosDetail') },
                      { label: t('pdfIncludesReflections'), detail: t('pdfIncludesReflectionsDetail') },
                    ] as const).map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: 'rgba(255,130,16,0.1)', color: '#FF8210',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11,
                          flexShrink: 0, marginTop: 1,
                        }}>
                          {i + 1}
                        </span>
                        <div>
                          <p style={{
                            fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                            color: '#2a2a3e', margin: 0,
                          }}>
                            {item.label}
                          </p>
                          <p style={{
                            fontFamily: "'Inter',sans-serif", fontSize: 12,
                            color: '#6C6D6F', margin: '2px 0 0', lineHeight: 1.5,
                          }}>
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Purchase button */}
                  <button
                    onClick={handlePurchase}
                    disabled={paymentProcessing}
                    style={{
                      width: '100%', padding: '16px 24px',
                      background: paymentProcessing ? 'rgba(255,130,16,0.6)' : '#FF8210',
                      color: '#fff', border: 'none', borderRadius: 12,
                      fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 16,
                      cursor: paymentProcessing ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      boxShadow: '0 4px 16px rgba(255,130,16,0.35)',
                      transition: 'background 0.15s',
                    }}
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                        {t('processingPayment')}
                      </>
                    ) : (
                      t('purchasePdf')
                    )}
                  </button>

                  <p style={{
                    fontFamily: "'Inter',sans-serif", fontSize: 11,
                    color: '#C0C0C0', textAlign: 'center',
                    marginTop: 12, lineHeight: 1.5,
                  }}>
                    {t('paymentSecure')}
                  </p>
                </div>
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
