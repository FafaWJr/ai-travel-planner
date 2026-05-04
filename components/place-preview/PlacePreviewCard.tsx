'use client';

// components/place-preview/PlacePreviewCard.tsx
// Rich preview card showing Google Places data: photo, name, rating,
// address, summary, and attribution. Variant layout by entity type.
// Hotels: navigable photo gallery (up to 5 photos, opacity crossfade).
// All other entity types: single photo (unchanged from Phase 1).

import { useState, useCallback, useEffect } from 'react';
import { MapPin, Star, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CachedPlace } from '@/lib/places/types';
import { GoogleAttribution } from './GoogleAttribution';

// ─── Hotel photo gallery ──────────────────────────────────────────────────────

interface HotelPhotoGalleryProps {
  googlePlaceId: string;
  photoCount: number;
  displayName: string;
}

function HotelPhotoGallery({ googlePlaceId, photoCount, displayName }: HotelPhotoGalleryProps) {
  const totalPhotos = Math.min(photoCount, 5);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
  const [errorIndices, setErrorIndices] = useState<Set<number>>(new Set());

  const buildPhotoUrl = (index: number) =>
    `/api/places/photo/${encodeURIComponent(googlePlaceId)}/${index}?w=800`;

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

  // Single photo: no gallery chrome
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
      {/* Photo stack — only loaded images rendered; active shown at full opacity */}
      {Array.from(loadedIndices).map(idx => (
        <img
          key={idx}
          src={buildPhotoUrl(idx)}
          alt={`${displayName} photo ${idx + 1}`}
          loading="lazy"
          decoding="async"
          onError={() => setErrorIndices(prev => new Set([...prev, idx]))}
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            opacity: idx === activeIndex ? 1 : 0,
            transition: 'opacity 200ms ease-in-out',
            display: errorIndices.has(idx) ? 'none' : 'block',
          }}
        />
      ))}

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
}

export function PlacePreviewCard({
  place,
  primaryPhotoUrl,
  photoAuthorName,
  photoAuthorUri,
}: PlacePreviewCardProps) {
  const [imageError, setImageError] = useState(false);
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
      {/* Photo — gallery for hotels with photos, single img for everything else */}
      {isHotel && place.photoCount > 0 ? (
        <HotelPhotoGallery
          googlePlaceId={place.googlePlaceId}
          photoCount={place.photoCount}
          displayName={place.displayName}
        />
      ) : primaryPhotoUrl && !imageError ? (
        <div
          style={{
            width: '100%',
            height: 200,
            overflow: 'hidden',
            background: '#F0F0F0',
            position: 'relative',
          }}
        >
          <img
            src={primaryPhotoUrl}
            alt={place.displayName}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
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
