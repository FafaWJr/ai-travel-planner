'use client';

// components/place-preview/useBatchResolve.ts
// Pre-warms the place cache by batch-resolving activities in parallel.
// Uses the same PlaceCacheProvider.resolve() that hover triggers use,
// so cached results are shared across batch and hover paths.

import { useCallback, useRef } from 'react';
import { usePlaceCache } from './PlaceCacheProvider';
import { cleanActivityQuery, isResolvableQuery } from '@/lib/places/query-cleaner';
import type { ResolveRequest } from '@/lib/places/types';

const MAX_CONCURRENCY = 3;

export interface BatchItem {
  query: string;
  cityContext: string;
  lat?: number;
  lng?: number;
  regionCode?: string;
}

export function useBatchResolve() {
  const { resolve } = usePlaceCache();
  const resolvedSlugs = useRef<Set<string>>(new Set());

  const batchResolve = useCallback(
    async (items: BatchItem[]) => {
      const toResolve: ResolveRequest[] = [];

      for (const item of items) {
        const cleaned = cleanActivityQuery(item.query);
        if (!cleaned || !isResolvableQuery(cleaned)) continue;

        const cacheKey = `${cleaned}::${item.cityContext.toLowerCase().trim()}`;
        if (resolvedSlugs.current.has(cacheKey)) continue;
        resolvedSlugs.current.add(cacheKey);

        toResolve.push({
          query: cleaned,
          cityContext: item.cityContext,
          lat: item.lat,
          lng: item.lng,
          regionCode: item.regionCode,
        });
      }

      if (toResolve.length === 0) return;

      const chunks: ResolveRequest[][] = [];
      for (let i = 0; i < toResolve.length; i += MAX_CONCURRENCY) {
        chunks.push(toResolve.slice(i, i + MAX_CONCURRENCY));
      }

      for (const chunk of chunks) {
        await Promise.allSettled(chunk.map((req) => resolve(req)));
      }
    },
    [resolve]
  );

  return { batchResolve };
}
