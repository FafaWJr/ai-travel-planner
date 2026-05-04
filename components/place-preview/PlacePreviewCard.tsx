'use client';

// components/place-preview/PlacePreviewCard.tsx
// Rich preview card showing Google Places data: photo, name, rating,
// address, summary, and attribution.
// All entity types: navigable photo gallery. Hotels: up to 5 photos.
// Attractions and restaurants: up to 3 photos. 1-photo places: no chrome.

import { useState, useCallback, useEffect } from 'react';
import { MapPin, Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CachedPlace } from '@/lib/places/types';
import { GoogleAttribution } from './GoogleAttribution';
import { UnsplashAttribution } from './UnsplashAttribution';

// ─── Photo gallery (universal: hotels up to 5, all others up to 3) ────────────

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface PhotoGalleryProps {
  placeId: string;
  photoCount: number;
  displayName: string;
  maxPhotos?: number;
}

function PhotoGallery({ placeId, photoCount, displayName, maxPhotos = 3 }: PhotoGalleryProps) {
  const totalPhotos = Math.min(photoCount, maxPhotos);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());
  const [blurUrls, setBlurUrls] = useState<Map<number, string>>(new Map());
  const [fullyLoaded, setFullyLoaded] = useState<Set<number>>(new Set());

  const buildPhotoUrl = (index: number, width: number = 800) =>
    `/api/places/photo/${encodeURIComponent(placeId)}/${index}?w=${width}`;

  const goTo = useCallback((index: number) => {
    const next = ((index % totalPhotos) + totalPhotos) % totalPhotos;
    setActiveIndex(next);
    setLoadedIndices(prev => new Set([...prev, next]));
  }, [totalPhotos]);

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  // Pre-load adjacent images when active index changes
  useEffect(() => {
    setLoadedIndices(prev => {
      const next = new Set(prev);
      if (activeIndex + 1 < totalPhotos) next.add(activeIndex + 1);
      if (activeIndex - 1 >= 0) next.add(activeIndex - 1);
      return next;
    });
  }, [activeIndex, totalPhotos]);

  // Pre-fetch tiny blur versions for all photos on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let i = 0; i < totalPhotos; i++) {
        try {
          const res = await fetch(
            `/api/places/photo/${encodeURIComponent(placeId)}/${i}?w=20`
          );
          if (cancelled) return;
          if (res.ok) {
            const blob = await res.blob();
            const dataUrl = await blobToDataUrl(blob);
            if (!cancelled) {
              setBlurUrls(prev => new Map([...prev, [i, dataUrl]]));
            }
          }
        } catch {
          // blur is a progressive enhancement; ignore failures
        }
      }
    })();
    return () => { cancelled = true; };
  }, [totalPhotos, placeId]);

  // Single photo: render without gallery chrome
  if (totalPhotos <= 1) {
    return (
      <div style={{ width: '100%', height: 200, overflow: 'hidden', background: '#F0F0F0', position: 'relative' }}>
        <img
          src={buildPhotoUrl(0)}
          alt={displayName}
          loading="lazy"
          decoding="async"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  const arrowStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.45)',
    border: 'none',
    color: '#FFFFFF',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    padding: 0,
    backdropFilter: 'blur(4px)',
  };

  return (
    <div style={{ width: '100%', height: 200, overflow: 'hidden', background: '#F0F0F0', position: 'relative' }}>
      {/* Photo stack — each slot: blur placeholder behind, full image fades in on load */}
      {Array.from(loadedIndices).map(idx => {
        const blurUrl = blurUrls.get(idx);
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              opacity: idx === activeIndex ? 1 : 0,
              transition: 'opacity 200ms ease-in-out',
            }}
          >
            {blurUrl && (
              <img
                src={blurUrl}
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  filter: 'blur(20px)',
                  transform: 'scale(1.1)',
                }}
              />
            )}
            <img
              src={buildPhotoUrl(idx)}
              alt={`${displayName} photo ${idx + 1}`}
              loading="lazy"
              decoding="async"
              onLoad={() => setFullyLoaded(prev => new Set([...prev, idx]))}
              onError={() => setErrorIndices(prev => new Set([...prev, idx]))}
              style={{
                position: 'absolute',
                top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: fullyLoaded.has(idx) ? 1 : 0,
                transition: 'opacity 300ms ease-in-out',
                display: errorIndices.has(idx) ? 'none' : 'block',
              }}
            />
          </div>
        );
      })}

      {/* Left arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        aria-label="Previous photo"
        style={{ ...arrowStyle, left: 8 }}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Right arrow */}
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        aria-label="Next photo"
        style={{ ...arrowStyle, right: 8 }}
      >
        <ChevronRight size={14} />
      </button>

      {/* Dot indicators */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 5, zIndex: 2,
      }}>
        {Array.from({ length: totalPhotos }, (_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); goTo(i); }}
            aria-label={`View photo ${i + 1}`}
            style={{
              width: i === activeIndex ? 8 : 6,
              height: i === activeIndex ? 8 : 6,
              borderRadius: '50%',
              background: i === activeIndex ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
              border: 'none', padding: 0, cursor: 'pointer',
              transition: 'all 150ms ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────────────────────

interface PlacePreviewCardProps {
  place: CachedPlace;
  primaryPhotoUrl: string | null;
  /** Photo author from cached_place_photos (passed by the trigger) */
  photoAuthorName?: string | null;
  photoAuthorUri?: string | null;
  /** Called when the user submits a corrected search query */
  onCorrect?: (correctedQuery: string) => Promise<void>;
}

export function PlacePreviewCard({
  place,
  primaryPhotoUrl,
  photoAuthorName,
  photoAuthorUri,
  onCorrect,
}: PlacePreviewCardProps) {
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionQuery, setCorrectionQuery] = useState('');
  const [isCorrecting, setIsCorrecting] = useState(false);

  const handleCorrectionSubmit = async () => {
    const trimmed = correctionQuery.trim();
    if (!trimmed || !onCorrect) return;
    setIsCorrecting(true);
    try {
      await onCorrect(trimmed);
      setShowCorrection(false);
    } catch {
      // trigger logs the error
    } finally {
      setIsCorrecting(false);
    }
  };
  const isHotel = place.entityType === 'hotel';

  const typeLabel = formatTypeLabel(place.entityType, place.primaryType);

  const ratingDisplay = place.rating != null
    ? `${place.rating.toFixed(1)}`
    : null;
  const reviewCount = place.userRatingCount != null
    ? formatReviewCount(place.userRatingCount)
    : null;

  const shortAddress = extractShortAddress(place.formattedAddress);

  const summary = place.editorialSummary
    ? truncate(place.editorialSummary, 120)
    : null;

  const bookingUrl = isHotel
    ? (place.metadata?.bookingAffiliateUrl as string) ?? null
    : null;

  // ── Destination card: hero photo with name overlay, Unsplash attribution ──
  const isDestination = place.entityType === 'destination';
  if (isDestination) {
    const unsplashUrl = place.metadata?.unsplashPhotoUrl as string | undefined;
    const unsplashSmallUrl = place.metadata?.unsplashPhotoUrlSmall as string | undefined;
    const unsplashAuthor = place.metadata?.unsplashAuthorName as string | undefined;
    const unsplashAuthorUrl = place.metadata?.unsplashAuthorUrl as string | undefined;
    const unsplashPhotoPage = place.metadata?.unsplashPhotoPage as string | undefined;
    const heroSrc = unsplashUrl || primaryPhotoUrl;

    return (
      <div
        style={{
          width: 320,
          borderRadius: 12,
          overflow: 'hidden',
          background: '#FFFFFF',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid #E8E8E8',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* Hero photo with gradient overlay and name */}
        <div style={{ width: '100%', height: 200, position: 'relative', background: '#F0F0F0', overflow: 'hidden' }}>
          {/* Blur placeholder — small version stacked below full image */}
          {unsplashSmallUrl && (
            <img
              src={unsplashSmallUrl}
              alt=""
              aria-hidden="true"
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                filter: 'blur(20px)',
                transform: 'scale(1.1)',
              }}
            />
          )}
          {heroSrc && (
            <img
              src={heroSrc}
              alt={place.displayName}
              loading="lazy"
              decoding="async"
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          )}
          {/* Gradient for text readability */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '55%',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.65))',
          }} />
          {/* Name overlay */}
          <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16 }}>
            <div style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700, fontSize: 20, color: '#FFFFFF',
              lineHeight: 1.2, textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            }}>
              {place.displayName}
            </div>
            {shortAddress && (
              <div style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2,
              }}>
                {shortAddress}
              </div>
            )}
          </div>
        </div>

        {/* Rating + Maps link */}
        <div style={{ padding: '10px 16px 4px' }}>
          {ratingDisplay && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 13 }}>
              <Star size={14} fill="#FF8210" color="#FF8210" style={{ flexShrink: 0 }} />
              <span style={{ color: '#FF8210', fontWeight: 500 }}>{ratingDisplay}</span>
              {reviewCount && <span style={{ color: '#6C6D6F' }}>({reviewCount})</span>}
            </div>
          )}
          {place.googleMapsUri && (
            <a
              href={place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 13, fontWeight: 500, color: '#00447B',
                textDecoration: 'none', marginBottom: 4,
              }}
            >
              <ExternalLink size={13} color="#00447B" />
              View on Google Maps
            </a>
          )}
        </div>

        {unsplashAuthor ? (
          <UnsplashAttribution
            authorName={unsplashAuthor}
            authorUrl={unsplashAuthorUrl}
            photoUrl={unsplashPhotoPage}
          />
        ) : (
          <GoogleAttribution
            authorName={photoAuthorName}
            authorUri={photoAuthorUri}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: 320,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '1px solid #E8E8E8',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Photo — universal gallery: hotels 5 photos, attractions/restaurants 3 */}
      {place.photoCount > 0 ? (
        <PhotoGallery
          placeId={place.googlePlaceId}
          photoCount={place.photoCount}
          displayName={place.displayName}
          maxPhotos={isHotel ? 5 : 3}
        />
      ) : null}

      {/* Content */}
      <div style={{ padding: '12px 16px 4px' }}>
        {/* Name */}
        <div
          style={{
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            fontSize: 16,
            color: '#00447B',
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {place.displayName}
        </div>

        {/* Rating + type row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {ratingDisplay && (
            <>
              <Star
                size={14}
                fill="#FF8210"
                color="#FF8210"
                style={{ flexShrink: 0 }}
              />
              <span style={{ color: '#FF8210', fontWeight: 500 }}>
                {ratingDisplay}
              </span>
              {reviewCount && (
                <span style={{ color: '#6C6D6F' }}>({reviewCount})</span>
              )}
              <span style={{ color: '#C0C0C0' }}>{'·'}</span>
            </>
          )}
          <span style={{ color: '#6C6D6F' }}>{typeLabel}</span>
        </div>

        {/* Address */}
        {shortAddress && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 4,
              marginBottom: 6,
              fontSize: 13,
              color: '#6C6D6F',
              lineHeight: 1.4,
            }}
          >
            <MapPin size={13} color="#6C6D6F" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{shortAddress}</span>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <div
            style={{
              fontSize: 13,
              color: '#2a2a3e',
              lineHeight: 1.5,
              marginBottom: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {summary}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
          {place.googleMapsUri && (
            <a
              href={place.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 500,
                color: '#00447B',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={13} color="#00447B" />
              View on Google Maps
            </a>
          )}

          {isHotel && bookingUrl && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="sponsored noopener"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 16px',
                background: '#FF8210',
                color: '#FFFFFF',
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 500,
                fontSize: 13,
                borderRadius: 8,
                textDecoration: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Book on Booking.com
            </a>
          )}
        </div>
      </div>

      <GoogleAttribution
        authorName={photoAuthorName}
        authorUri={photoAuthorUri}
      />

      {/* Wrong place? correction flow */}
      {onCorrect && (
        <div style={{ padding: '0 16px 12px' }}>
          {!showCorrection ? (
            <button
              onClick={() => {
                setShowCorrection(true);
                setCorrectionQuery(place.displayName);
              }}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 11, color: '#C0C0C0', cursor: 'pointer',
                textDecoration: 'underline',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Wrong place?
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={correctionQuery}
                  onChange={(e) => setCorrectionQuery(e.target.value)}
                  placeholder="Search for the correct place..."
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  style={{
                    flex: 1, padding: '6px 8px', fontSize: 12,
                    border: '1px solid #E8E8E8', borderRadius: 6,
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCorrectionSubmit();
                    if (e.key === 'Escape') setShowCorrection(false);
                  }}
                />
                <button
                  onClick={handleCorrectionSubmit}
                  disabled={isCorrecting || !correctionQuery.trim()}
                  style={{
                    padding: '6px 12px', fontSize: 12, fontWeight: 500,
                    background: '#00447B', color: '#FFFFFF',
                    border: 'none', borderRadius: 6, cursor: isCorrecting ? 'default' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    opacity: isCorrecting || !correctionQuery.trim() ? 0.6 : 1,
                    transition: 'opacity 150ms',
                  }}
                >
                  {isCorrecting ? '...' : 'Go'}
                </button>
              </div>
              <button
                onClick={() => setShowCorrection(false)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 11, color: '#6C6D6F', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  alignSelf: 'flex-start',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTypeLabel(entityType: string, primaryType: string | null): string {
  if (primaryType) {
    return primaryType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}

function formatReviewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return count.toString();
}

function extractShortAddress(address: string | null): string | null {
  if (!address) return null;
  const parts = address.split(', ');
  if (parts.length <= 3) return address;
  return parts.slice(-3).join(', ');
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
}
