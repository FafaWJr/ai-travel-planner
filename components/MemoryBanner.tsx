'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { BookHeart, X, ChevronRight, Loader2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MemoryBannerProps {
  tripId: string | null;
  startDate: string;
  endDate: string;
}

export default function MemoryBanner({ tripId, startDate, endDate }: MemoryBannerProps) {
  const t = useTranslations('memories');
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true); // default hidden until check
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  const isActiveTrip = today >= start && today <= end;
  const currentDayNumber =
    Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;

  useEffect(() => {
    if (!tripId || !isActiveTrip) {
      setDismissed(true);
      return;
    }
    const key = `luna_memory_banner_dismissed_${tripId}`;
    const dismissedAt = localStorage.getItem(key);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
      localStorage.removeItem(key);
    }
    setDismissed(false);
  }, [tripId, isActiveTrip]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDismiss = () => {
    if (tripId) {
      localStorage.setItem(
        `luna_memory_banner_dismissed_${tripId}`,
        String(Date.now()),
      );
    }
    setDismissed(true);
  };

  const handleSave = useCallback(async () => {
    if (!tripId || !note.trim() || saving) return;
    setSaving(true);
    try {
      const getRes = await fetch(`/api/memories/${tripId}`);
      if (!getRes.ok) throw new Error('Failed to load memory');
      const { memory } = await getRes.json();

      const days = [...(memory.memory_data?.days ?? [])];
      const dayIndex = days.findIndex(
        (d: { dayNumber: number }) => d.dayNumber === currentDayNumber,
      );
      if (dayIndex >= 0) {
        days[dayIndex] = {
          ...days[dayIndex],
          notes: days[dayIndex].notes
            ? `${days[dayIndex].notes}\n${note.trim()}`
            : note.trim(),
        };

        await fetch(`/api/memories/${tripId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memory_data: { ...memory.memory_data, days } }),
        });

        setSaved(true);
        setNote('');
        setTimeout(() => {
          setSaved(false);
          setExpanded(false);
        }, 2000);
      }
    } catch (err) {
      console.error('[MemoryBanner] save error:', err);
    } finally {
      setSaving(false);
    }
  }, [tripId, note, saving, currentDayNumber]);

  if (dismissed || !isActiveTrip || !tripId) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,130,16,0.06) 0%, rgba(0,68,123,0.04) 100%)',
      border: '1.5px solid rgba(255,130,16,0.20)',
      borderRadius: 12, padding: '14px 18px',
      marginBottom: 16,
      position: 'relative',
    }}>
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, lineHeight: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={16} color="#C0C0C0" />
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: 24 }}>
        <BookHeart size={20} color="#FF8210" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
            color: '#00447B', margin: 0,
          }}>
            {t('bannerTitle', { day: currentDayNumber })}
          </p>

          {!expanded && !saved && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setExpanded(true);
                  setTimeout(() => textareaRef.current?.focus(), 100);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 100,
                  background: '#FF8210', color: '#fff', border: 'none',
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
              >
                {t('bannerQuickNote')}
              </button>
              <button
                onClick={() => router.push(`/memories/${tripId}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 14px', borderRadius: 100,
                  background: 'none', border: '1.5px solid rgba(0,68,123,0.15)',
                  color: '#00447B',
                  fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 12,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {t('bannerFullPage')} <ChevronRight size={14} />
              </button>
            </div>
          )}

          {expanded && !saved && (
            <div style={{ marginTop: 10 }}>
              <textarea
                ref={textareaRef}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t('notesPlaceholder')}
                rows={2}
                style={{
                  width: '100%', padding: 10, borderRadius: 8,
                  border: '1.5px solid rgba(255,130,16,0.25)',
                  fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#2a2a3e',
                  lineHeight: 1.6, resize: 'none', outline: 'none',
                  background: '#fff', boxSizing: 'border-box',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#FF8210'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,130,16,0.25)'; }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setExpanded(false); setNote(''); }}
                  style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: 'none', border: '1px solid #E5E7EB',
                    color: '#6C6D6F', fontFamily: "'Inter',sans-serif", fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {t('bannerCancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!note.trim() || saving}
                  style={{
                    padding: '6px 14px', borderRadius: 100,
                    background: note.trim() ? '#FF8210' : '#E5E7EB',
                    color: note.trim() ? '#fff' : '#C0C0C0',
                    border: 'none',
                    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                    cursor: note.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                  {t('bannerSave')}
                </button>
              </div>
            </div>
          )}

          {saved && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 8,
              fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#16A34A', fontWeight: 500,
            }}>
              <Check size={15} />
              {t('bannerSaved')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
