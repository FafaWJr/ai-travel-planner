'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import type { PhotoMeta } from '@/lib/memories/types';

interface DayPhotoGridProps {
  photos: PhotoMeta[];
  supabaseUrl: string;
  onDelete: (photoId: string) => void;
}

function photoUrl(supabaseUrl: string, storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/memory-photos/${storagePath}`;
}

export default function DayPhotoGrid({ photos, supabaseUrl, onDelete }: DayPhotoGridProps) {
  const t = useTranslations('memories');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const prevPhoto = useCallback(() => {
    setLightboxIndex(prev => (prev !== null ? Math.max(0, prev - 1) : null));
  }, []);

  const nextPhoto = useCallback(() => {
    setLightboxIndex(prev => (prev !== null ? Math.min(photos.length - 1, prev + 1) : null));
  }, [photos.length]);

  const handleDelete = useCallback((photoId: string) => {
    onDelete(photoId);
    setConfirmDeleteId(null);
    if (lightboxIndex !== null) closeLightbox();
  }, [onDelete, lightboxIndex, closeLightbox]);

  if (photos.length === 0) return null;

  const lightboxPhoto = lightboxIndex !== null ? photos[lightboxIndex] : null;

  return (
    <>
      {/* Photo grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
        marginTop: 12,
      }}>
        {photos.map((photo, i) => (
          <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden' }}>
            {/* Blur placeholder background */}
            {photo.blurPlaceholder && (
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${photo.blurPlaceholder})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(4px)', transform: 'scale(1.05)',
              }} />
            )}
            <img
              src={photoUrl(supabaseUrl, photo.storagePath)}
              alt={photo.originalFilename}
              onClick={() => openLightbox(i)}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              loading="lazy"
            />
            {/* Delete button */}
            <button
              onClick={e => { e.stopPropagation(); setConfirmDeleteId(photo.id); }}
              style={{
                position: 'absolute', top: 4, right: 4,
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', lineHeight: 0,
              }}
              aria-label={t('deletePhoto')}
            >
              <X size={12} color="#fff" />
            </button>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 14, padding: 28,
              maxWidth: 360, width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 16,
              color: '#00447B', margin: '0 0 8px',
            }}>
              {t('deletePhotoConfirm')}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: '8px 18px', borderRadius: 100,
                  background: 'none', border: '1.5px solid #E5E7EB',
                  fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#6C6D6F',
                  cursor: 'pointer',
                }}
              >
                {t('deleteCancel')}
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                style={{
                  padding: '8px 18px', borderRadius: 100,
                  background: '#DC2626', border: 'none', color: '#fff',
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Trash2 size={13} />
                {t('deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && lightboxIndex !== null && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', lineHeight: 0,
            }}
            aria-label={t('closeLightbox')}
          >
            <X size={20} color="#fff" />
          </button>

          {/* Prev */}
          {lightboxIndex > 0 && (
            <button
              onClick={e => { e.stopPropagation(); prevPhoto(); }}
              style={{
                position: 'absolute', left: 16,
                background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', lineHeight: 0,
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} color="#fff" />
            </button>
          )}

          {/* Image */}
          <img
            src={photoUrl(supabaseUrl, lightboxPhoto.storagePath)}
            alt={lightboxPhoto.originalFilename}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '90vw', maxHeight: '85vh',
              objectFit: 'contain', borderRadius: 8,
            }}
          />

          {/* Next */}
          {lightboxIndex < photos.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); nextPhoto(); }}
              style={{
                position: 'absolute', right: 16,
                background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%',
                width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', lineHeight: 0,
              }}
              aria-label="Next photo"
            >
              <ChevronRight size={22} color="#fff" />
            </button>
          )}

          {/* Delete from lightbox */}
          <button
            onClick={e => { e.stopPropagation(); setConfirmDeleteId(lightboxPhoto.id); }}
            style={{
              position: 'absolute', bottom: 24, right: 24,
              background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: 100,
              padding: '8px 16px', color: '#fff',
              fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
            }}
          >
            <Trash2 size={14} />
            {t('deletePhoto')}
          </button>

          {/* Counter */}
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.7)',
          }}>
            {t('photoOf', { index: lightboxIndex + 1, total: photos.length })}
          </div>
        </div>
      )}
    </>
  );
}
