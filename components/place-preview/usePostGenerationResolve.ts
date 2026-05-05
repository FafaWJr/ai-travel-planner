'use client';

// components/place-preview/usePostGenerationResolve.ts
// Pre-resolves all activities after itinerary generation completes.
// Runs in the background with a 2-second delay. No UI blocking.
// Eliminates cold-cache hover delays for freshly generated and saved trips.

import { useEffect, useRef } from 'react';
import { usePlaceCache } from './PlaceCacheProvider';
import { cleanActivityQuery, isResolvableQuery } from '@/lib/places/query-cleaner';

interface TripActivity {
  text?: string;
}

interface TripDay {
  activities?: TripActivity[];
}

interface UsePostGenerationResolveOptions {
  days: TripDay[];
  cityContext: string;
  lat?: number;
  lng?: number;
  regionCode?: string;
  enabled: boolean;
  /** Changes each time a new generation or trip load completes. Hook skips if key is seen before. */
  generationKey: string;
}

const MAX_CONCURRENCY = 3;

export function usePostGenerationResolve({
  days,
  cityContext,
  lat,
  lng,
  regionCode,
  enabled,
  generationKey,
}: UsePostGenerationResolveOptions) {
  const { resolve } = usePlaceCache();
  const resolvedKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !days || days.length === 0 || !cityContext) return;
    if (generationKey === 'none' || generationKey === '') return;
    if (resolvedKeys.current.has(generationKey)) return;
    resolvedKeys.current.add(generationKey);

    const doResolve = async () => {
      const queries: string[] = [];
      for (const day of days) {
        if (!day.activities) continue;
        for (const act of day.activities) {
          if (!act.text) continue;
          const cleaned = cleanActivityQuery(act.text);
          if (cleaned && isResolvableQuery(cleaned)) {
            queries.push(cleaned);
          }
        }
      }

      // Deduplicate (same place may appear on multiple days)
      const unique = [...new Set(queries)];
      if (unique.length === 0) return;

      for (let i = 0; i < unique.length; i += MAX_CONCURRENCY) {
        const chunk = unique.slice(i, i + MAX_CONCURRENCY);
        await Promise.allSettled(
          chunk.map((query) => resolve({ query, cityContext, lat, lng, regionCode }))
        );
      }
    };

    const timer = setTimeout(doResolve, 2000);
    return () => clearTimeout(timer);
  }, [generationKey, days, cityContext, lat, lng, regionCode, enabled, resolve]);
}
