'use client';

// components/place-preview/PlacePreviewTrigger.tsx
// Wraps a place name in the itinerary. Shows a preview card on:
//   - Desktop: hover (400ms open delay, 200ms close delay)
//   - Mobile: tap
//   - Keyboard: focus + Enter

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import type { ResolveRequest, ResolveResponse } from '@/lib/places/types';
import { usePlaceCache } from './PlaceCacheProvider';
import { PlacePreviewCard } from './PlacePreviewCard';
import { PlacePreviewSkeleton } from './PlacePreviewSkeleton';

const OPEN_DELAY_MS = 400;
const CLOSE_DELAY_MS = 200;

interface PlacePreviewTriggerProps {
  /** The AI-generated place name */
  query: string;
  /** Trip destination context, e.g. "Bali, Indonesia" */
  cityContext: string;
  /** Trip destination latitude */
  lat?: number;
  /** Trip destination longitude */
  lng?: number;
  /** ISO region code, e.g. "ID" */
  regionCode?: string;
  /** Trip dates in ISO format (YYYY-MM-DD). Passed to the card for hotel booking URLs. */
  tripCheckin?: string;
  tripCheckout?: string;
  /** The text/element to wrap (typically the activity name) */
  children: ReactNode;
}

interface CardPosition {
  top: number;
  left: number;
}

export function PlacePreviewTrigger({
  query,
  cityContext,
  lat,
  lng,
  regionCode,
  tripCheckin,
  tripCheckout,
  children,
}: PlacePreviewTriggerProps) {
  const { resolve, update } = usePlaceCache();

  const [isOpen, setIsOpen] = useState(false);
  const [resolveResult, setResolveResult] = useState<ResolveResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<CardPosition>({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasResolvedRef = useRef(false);

  const doResolve = useCallback(async () => {
    if (hasResolvedRef.current) return;
    hasResolvedRef.current = true;
    setIsLoading(true);

    const result = await resolve({
      query,
      cityContext,
      lat,
      lng,
      regionCode,
    } as ResolveRequest);

    setResolveResult(result);
    setIsLoading(false);
  }, [query, cityContext, lat, lng, regionCode, resolve]);

  const handleCorrect = useCallback(async (correctedQuery: string) => {
    try {
      const res = await fetch('/api/places/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: correctedQuery,
          cityContext,
          lat,
          lng,
          regionCode,
          force: true,
          originalQuery: query,
        }),
      });

      if (!res.ok) return;

      const data: ResolveResponse = await res.json();
      setResolveResult(data);

      // Update client cache for the original query key so future hovers
      // on this activity use the corrected result without another API call
      update({ query, cityContext, lat, lng, regionCode }, data);
    } catch (err) {
      console.error('[PlacePreviewTrigger] Correction failed:', err);
    }
  }, [query, cityContext, lat, lng, regionCode, update]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const cardWidth = 320;
    const cardHeight = 400;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = rect.bottom + scrollY + 8;
    let left = rect.left + scrollX;

    // Flip above if not enough space below
    if (rect.bottom + cardHeight > viewportHeight) {
      top = rect.top + scrollY - cardHeight - 8;
    }

    // Prevent overflow right
    if (left + cardWidth > viewportWidth + scrollX) {
      left = viewportWidth + scrollX - cardWidth - 16;
    }

    // Prevent overflow left
    if (left < scrollX + 8) {
      left = scrollX + 8;
    }

    setPosition({ top, left });
  }, []);

  const openCard = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    updatePosition();
    setIsOpen(true);
    doResolve();
  }, [updatePosition, doResolve]);

  const closeCard = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    openTimerRef.current = setTimeout(openCard, OPEN_DELAY_MS);
  }, [openCard]);

  const handleMouseLeave = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(closeCard, CLOSE_DELAY_MS);
  }, [closeCard]);

  const handleCardMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(closeCard, CLOSE_DELAY_MS);
  }, [closeCard]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!('ontouchstart' in window)) return;
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) {
      closeCard();
    } else {
      openCard();
    }
  }, [isOpen, openCard, closeCard]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen) {
        closeCard();
      } else {
        openCard();
      }
    }
    if (e.key === 'Escape' && isOpen) {
      closeCard();
    }
  }, [isOpen, openCard, closeCard]);

  // Close on click outside (mobile)
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        cardRef.current &&
        !cardRef.current.contains(target)
      ) {
        closeCard();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, closeCard]);

  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const cardContent = (() => {
    if (isLoading || !resolveResult) {
      return <PlacePreviewSkeleton />;
    }
    if (resolveResult.source === 'not_found' || !resolveResult.place) {
      return <PlacePreviewFallback query={query} cityContext={cityContext} />;
    }
    return (
      <PlacePreviewCard
        place={resolveResult.place}
        primaryPhotoUrl={resolveResult.primaryPhotoUrl}
        tripCheckin={tripCheckin}
        tripCheckout={tripCheckout}
        onCorrect={handleCorrect}
      />
    );
  })();

  return (
    <>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          cursor: 'pointer',
          borderBottom: '1px dotted #679AC1',
          paddingBottom: 1,
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {children}
      </span>

      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={cardRef}
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            style={{
              position: 'absolute',
              top: position.top,
              left: position.left,
              zIndex: 9999,
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 150ms ease-in-out',
              pointerEvents: 'auto',
            }}
            role="dialog"
            aria-label={`Preview of ${query}`}
          >
            {cardContent}
          </div>,
          document.body
        )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Fallback card for "not found" results
// ---------------------------------------------------------------------------

function PlacePreviewFallback({
  query,
  cityContext,
}: {
  query: string;
  cityContext: string;
}) {
  const googleSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query + ' ' + cityContext
  )}`;

  return (
    <div
      style={{
        width: 320,
        borderRadius: 12,
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        border: '1px solid #E8E8E8',
        padding: '20px 16px',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 600,
          fontSize: 16,
          color: '#00447B',
          marginBottom: 8,
        }}
      >
        {query}
      </div>
      <div style={{ fontSize: 13, color: '#6C6D6F', marginBottom: 12 }}>
        Details unavailable for this place.
      </div>
      <a
        href={googleSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: '#00447B',
          textDecoration: 'none',
        }}
      >
        Search on Google Maps
      </a>
    </div>
  );
}
