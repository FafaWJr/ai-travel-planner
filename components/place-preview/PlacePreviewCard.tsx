'use client';

// components/place-preview/PlacePreviewCard.tsx
// Rich preview card showing Google Places data: photo, name, rating,
// address, summary, and attribution. Variant layout by entity type.

import { useState } from 'react';
import { MapPin, Star, ExternalLink } from 'lucide-react';
import type { CachedPlace } from '@/lib/places/types';
import { GoogleAttribution } from './GoogleAttribution';

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
      {/* Photo — standard img because this renders inside a Portal */}
      {primaryPhotoUrl && !imageError && (
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
      )}

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
