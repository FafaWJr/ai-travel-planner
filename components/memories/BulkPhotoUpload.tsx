'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ImagePlus, Upload, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { extractExif, sortPhotosByDay } from '@/lib/memories/exif';
import type { PhotoExifData } from '@/lib/memories/exif';
import { compressPhoto, generateBlurPlaceholder } from '@/lib/memories/compress';
import { isHeicFile, convertHeicToJpeg } from '@/lib/memories/heic-convert';
import type { PhotoMeta, PhotoUploadItem } from '@/lib/memories/types';

interface BulkPhotoUploadProps {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  days: Array<{ dayNumber: number; dayTitle: string }>;
  onPhotosAdded: (dayNumber: number, newPhotos: PhotoMeta[]) => void;
  triggerRef?: React.MutableRefObject<(() => void) | null>;
  onFilesSelected?: (count: number) => void;
  onUploadStart?: () => void;
  onProgress?: (done: number, total: number) => void;
  onUploadComplete?: () => void;
}

export default function BulkPhotoUpload({
  tripId,
  tripStartDate,
  tripEndDate,
  days,
  onPhotosAdded,
  triggerRef,
  onFilesSelected,
  onUploadStart,
  onProgress,
  onUploadComplete,
}: BulkPhotoUploadProps) {
  const t = useTranslations('memories');
  const inputRef = useRef<HTMLInputElement>(null);
  // Preserves EXIF from original HEIC files before heic2any strips it during conversion
  const exifCacheRef = useRef<Map<string, PhotoExifData>>(new Map());

  // Expose file picker trigger to parent via ref
  if (triggerRef) {
    triggerRef.current = () => inputRef.current?.click();
  }

  const [items, setItems] = useState<PhotoUploadItem[]>([]);
  const [phase, setPhase] = useState<'idle' | 'preview' | 'uploading' | 'done'>('idle');
  const [doneCount, setDoneCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);

  const handleFilesSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Reset input so the same files can be re-selected later
    e.target.value = '';

    const start = new Date(tripStartDate + 'T00:00:00');
    const end = new Date(tripEndDate + 'T23:59:59');

    // Extract EXIF from all files in parallel.
    // For HEIC: extract EXIF from original first (exifr supports HEIC natively),
    // then convert to JPEG — heic2any strips EXIF during conversion.
    const withExif = await Promise.all(
      files.map(async file => {
        const id = crypto.randomUUID();
        const exif = await extractExif(file); // always from original
        let processedFile = file;
        if (isHeicFile(file)) {
          processedFile = await convertHeicToJpeg(file);
        }
        exifCacheRef.current.set(id, exif); // cache before EXIF is lost
        return { file: processedFile, exif, id };
      }),
    );

    const { sorted, unsorted } = sortPhotosByDay(withExif, start, end);

    const newItems: PhotoUploadItem[] = [];

    for (const [dayNumStr, photos] of Object.entries(sorted)) {
      for (const p of photos) {
        newItems.push({
          localId: p.id,
          file: p.file,
          previewUrl: URL.createObjectURL(p.file),
          dayNumber: parseInt(dayNumStr, 10),
          status: 'pending',
        });
      }
    }

    for (const p of unsorted) {
      newItems.push({
        localId: p.id,
        file: p.file,
        previewUrl: URL.createObjectURL(p.file),
        dayNumber: null,
        status: 'pending',
      });
    }

    setItems(prev => [...prev, ...newItems]);
    setPhase('preview');
    onFilesSelected?.(newItems.length);
  }, [tripStartDate, tripEndDate, onFilesSelected]);

  const removeItem = useCallback((localId: string) => {
    exifCacheRef.current.delete(localId);
    setItems(prev => {
      const item = prev.find(i => i.localId === localId);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter(i => i.localId !== localId);
    });
  }, []);

  const startUpload = useCallback(async () => {
    const uploadable = items.filter(i => i.status === 'pending' && i.dayNumber !== null);
    if (uploadable.length === 0) return;

    setPhase('uploading');
    setDoneCount(0);
    setErrorCount(0);
    onUploadStart?.();

    // Map dayNumber → newPhotos accumulated during this batch
    const accumulated: Record<number, PhotoMeta[]> = {};
    let localDone = 0;

    for (const item of uploadable) {
      setItems(prev => prev.map(i => i.localId === item.localId ? { ...i, status: 'uploading' } : i));

      try {
        const [compressed, blur] = await Promise.all([
          compressPhoto(item.file),
          generateBlurPlaceholder(item.file),
        ]);

        // Use cached EXIF to preserve GPS from original HEIC (stripped by heic2any)
        const exif = exifCacheRef.current.get(item.localId) ?? await extractExif(item.file);
        exifCacheRef.current.delete(item.localId);

        const fd = new FormData();
        fd.append('file', compressed, item.file.name);
        fd.append('tripId', tripId);
        fd.append('dayNumber', String(item.dayNumber!));
        if (exif.date) fd.append('exifDate', exif.date.toISOString());
        if (exif.lat !== null) fd.append('exifLat', String(exif.lat));
        if (exif.lng !== null) fd.append('exifLng', String(exif.lng));
        if (exif.width !== null) fd.append('width', String(exif.width));
        if (exif.height !== null) fd.append('height', String(exif.height));
        fd.append('blurPlaceholder', blur);

        const res = await fetch('/api/memories/photos', { method: 'POST', body: fd });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { photo } = await res.json() as { photo: PhotoMeta; publicUrl: string };

        const dn = item.dayNumber!;
        if (!accumulated[dn]) accumulated[dn] = [];
        accumulated[dn].push(photo);

        setItems(prev => prev.map(i => i.localId === item.localId ? { ...i, status: 'done', meta: photo } : i));
        localDone += 1;
        setDoneCount(localDone);
        onProgress?.(localDone, uploadable.length);
        URL.revokeObjectURL(item.previewUrl);
      } catch (err) {
        console.error('[BulkPhotoUpload] upload error:', err);
        setItems(prev => prev.map(i => i.localId === item.localId ? { ...i, status: 'error', error: 'Upload failed' } : i));
        setErrorCount(c => c + 1);
      }
    }

    // Notify parent of all newly uploaded photos grouped by day
    for (const [dayNumStr, photos] of Object.entries(accumulated)) {
      onPhotosAdded(parseInt(dayNumStr, 10), photos);
    }

    setPhase('done');
    onUploadComplete?.();
  }, [items, tripId, onPhotosAdded, onUploadStart, onProgress, onUploadComplete]);

  const movePhotoToDay = useCallback((localId: string, toDay: number) => {
    setItems(prev => prev.map(i =>
      i.localId === localId ? { ...i, dayNumber: toDay } : i,
    ));
  }, []);

  const reset = useCallback(() => {
    exifCacheRef.current.clear();
    items.forEach(i => { try { URL.revokeObjectURL(i.previewUrl); } catch { /* noop */ } });
    setItems([]);
    setPhase('idle');
    setDoneCount(0);
    setErrorCount(0);
  }, [items]);

  const uploadableCount = items.filter(i => i.status === 'pending' && i.dayNumber !== null).length;
  const unsortedCount = items.filter(i => i.dayNumber === null).length;

  // Group items by dayNumber for preview
  const grouped: Record<number, PhotoUploadItem[]> = {};
  for (const item of items.filter(i => i.dayNumber !== null)) {
    const dn = item.dayNumber!;
    if (!grouped[dn]) grouped[dn] = [];
    grouped[dn].push(item);
  }
  const sortedDayNums = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  if (phase === 'idle') {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          style={{ display: 'none' }}
          onChange={handleFilesSelected}
        />
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 100,
            border: '1.5px dashed rgba(0,68,123,0.22)',
            background: 'rgba(0,68,123,0.03)',
            fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
            color: '#00447B', cursor: 'pointer',
            transition: 'all 0.15s', marginTop: 16,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#FF8210';
            e.currentTarget.style.color = '#FF8210';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(0,68,123,0.22)';
            e.currentTarget.style.color = '#00447B';
          }}
        >
          <ImagePlus size={16} />
          {t('addPhotos')}
        </button>
      </>
    );
  }

  return (
    <div style={{
      marginTop: 16, borderRadius: 12,
      border: '1.5px solid rgba(0,68,123,0.10)',
      background: '#fff', padding: 16,
    }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        style={{ display: 'none' }}
        onChange={handleFilesSelected}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{
          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
          color: '#00447B',
        }}>
          {phase === 'uploading'
            ? t('uploading', { done: doneCount, total: items.filter(i => i.dayNumber !== null).length })
            : phase === 'done'
            ? t('uploadDone', { count: doneCount })
            : t('photosSection')}
        </span>

        <button
          onClick={reset}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 4, lineHeight: 0,
          }}
          aria-label="Close"
        >
          <X size={16} color="#C0C0C0" />
        </button>
      </div>

      {/* Uploading progress */}
      {phase === 'uploading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Loader2 size={16} color="#FF8210" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ flex: 1, height: 4, background: '#E5E7EB', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${items.filter(i => i.dayNumber !== null).length > 0 ? (doneCount / items.filter(i => i.dayNumber !== null).length) * 100 : 0}%`,
              background: '#FF8210', borderRadius: 100, transition: 'width 0.3s',
            }} />
          </div>
        </div>
      )}

      {/* Done state */}
      {phase === 'done' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(74,157,91,0.08)', marginBottom: 12,
        }}>
          <Check size={15} color="#4A9D5B" />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#4A9D5B' }}>
            {t('uploadDone', { count: doneCount })}
          </span>
          {errorCount > 0 && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#DC2626', marginLeft: 8 }}>
              {t('uploadError')}
            </span>
          )}
        </div>
      )}

      {/* Preview sorted by day */}
      {(phase === 'preview' || phase === 'uploading') && (
        <>
          {sortedDayNums.map(dn => {
            const dayInfo = days.find(d => d.dayNumber === dn);
            const dayPhotos = grouped[dn];
            return (
              <div key={dn} style={{ marginBottom: 12 }}>
                <p style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                  color: '#6C6D6F', margin: '0 0 6px',
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {t('dayAssignment', { day: dn })}{dayInfo ? ` - ${dayInfo.dayTitle}` : ''}
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  {dayPhotos.map(item => (
                    <div key={item.localId} style={{ display: 'flex', flexDirection: 'column', width: 56 }}>
                      {/* Image + status overlays + X button */}
                      <div style={{ position: 'relative', width: 56, height: 56, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={item.previewUrl}
                          alt={item.file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {item.status === 'uploading' && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Loader2 size={16} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                          </div>
                        )}
                        {item.status === 'done' && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(74,157,91,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={18} color="#fff" />
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(220,38,38,0.35)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <AlertCircle size={16} color="#fff" />
                          </div>
                        )}
                        {item.status === 'pending' && phase === 'preview' && (
                          <button
                            onClick={() => removeItem(item.localId)}
                            style={{
                              position: 'absolute', top: 2, right: 2,
                              width: 18, height: 18, borderRadius: '50%',
                              background: 'rgba(0,0,0,0.55)', border: 'none',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', lineHeight: 0,
                            }}
                          >
                            <X size={10} color="#fff" />
                          </button>
                        )}
                      </div>
                      {/* Move-to-day select — only in preview, only pending, only when other days exist */}
                      {item.status === 'pending' && phase === 'preview' && days.length > 1 && (
                        <select
                          value=""
                          onChange={e => {
                            const toDay = parseInt(e.target.value, 10);
                            if (!isNaN(toDay)) movePhotoToDay(item.localId, toDay);
                          }}
                          style={{
                            width: '100%', marginTop: 3,
                            padding: '2px 1px', borderRadius: 3,
                            border: '1px solid rgba(0,68,123,0.12)',
                            fontFamily: "'Inter',sans-serif", fontSize: 9,
                            color: '#00447B', background: '#fff',
                            cursor: 'pointer',
                          }}
                          title="Move to different day"
                        >
                          <option value="" disabled>Day {dn}</option>
                          {days
                            .filter(d => d.dayNumber !== dn)
                            .map(d => (
                              <option key={d.dayNumber} value={d.dayNumber}>
                                Day {d.dayNumber}
                              </option>
                            ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Unsorted photos — show per-item with day picker */}
          {items.filter(i => i.dayNumber === null).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertCircle size={13} color="#FF8210" />
                <span style={{
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
                  color: '#6C6D6F', textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {t('photosUnsorted', { count: items.filter(i => i.dayNumber === null).length })}
                </span>
              </div>
              {items.filter(i => i.dayNumber === null).map(item => (
                <div key={item.localId} style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                  padding: '6px 8px', borderRadius: 8,
                  background: 'rgba(255,130,16,0.04)', border: '1px solid rgba(255,130,16,0.12)',
                }}>
                  <img
                    src={item.previewUrl}
                    alt={item.file.name}
                    style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }}
                  />
                  <span style={{
                    fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#6C6D6F',
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                  }}>
                    {item.file.name}
                  </span>
                  {phase === 'preview' && (
                    <>
                      <select
                        defaultValue=""
                        onChange={e => {
                          const dn = parseInt(e.target.value, 10);
                          if (!isNaN(dn)) {
                            setItems(prev => prev.map(i =>
                              i.localId === item.localId ? { ...i, dayNumber: dn } : i,
                            ));
                          }
                        }}
                        style={{
                          fontSize: 11, padding: '4px 6px', borderRadius: 6,
                          border: '1px solid #E5E7EB', background: '#fff',
                          color: '#00447B', cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        <option value="" disabled>{t('assignToDay')}</option>
                        {days.map(d => (
                          <option key={d.dayNumber} value={d.dayNumber}>
                            {t('dayAssignment', { day: d.dayNumber })} - {d.dayTitle}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeItem(item.localId)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: 2, lineHeight: 0, flexShrink: 0,
                        }}
                      >
                        <X size={13} color="#C0C0C0" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Auto-sort note */}
          {sortedDayNums.length > 0 && (
            <p style={{
              fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#C0C0C0',
              margin: '0 0 12px',
            }}>
              {t('photosAutoSorted')}
            </p>
          )}
        </>
      )}

      {/* Actions */}
      {phase === 'preview' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {uploadableCount > 0 && (
            <button
              onClick={startUpload}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 100,
                background: '#FF8210', color: '#fff', border: 'none',
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e67400'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FF8210'; }}
            >
              <Upload size={14} />
              {t('uploadPhotosBtn', { count: uploadableCount })}
            </button>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              padding: '9px 16px', borderRadius: 100,
              border: '1.5px solid rgba(0,68,123,0.15)',
              background: 'none', color: '#00447B',
              fontFamily: "'Inter',sans-serif", fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {t('addMorePhotos')}
          </button>
        </div>
      )}

      {phase === 'done' && (
        <button
          onClick={() => inputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 100,
            border: '1.5px solid rgba(0,68,123,0.15)',
            background: 'none', color: '#00447B',
            fontFamily: "'Inter',sans-serif", fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <ImagePlus size={14} />
          {t('addMorePhotos')}
        </button>
      )}
    </div>
  );
}
