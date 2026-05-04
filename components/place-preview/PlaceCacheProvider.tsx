'use client';

// components/place-preview/PlaceCacheProvider.tsx
// In-memory cache for resolved place data within a browser session.
// Prevents duplicate /api/places/resolve calls when the same place
// name is hovered multiple times.

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import type { ResolveRequest, ResolveResponse } from '@/lib/places/types';

interface PlaceCacheContextValue {
  resolve: (req: ResolveRequest) => Promise<ResolveResponse>;
  getFromCache: (key: string) => ResolveResponse | undefined;
}

const NOT_FOUND_RESPONSE: ResolveResponse = {
  place: null,
  primaryPhotoUrl: null,
  source: 'not_found',
};

const PlaceCacheContext = createContext<PlaceCacheContextValue>({
  resolve: async () => NOT_FOUND_RESPONSE,
  getFromCache: () => undefined,
});

export function usePlaceCache() {
  return useContext(PlaceCacheContext);
}

function buildCacheKey(req: ResolveRequest): string {
  return `${req.query.toLowerCase().trim()}::${req.cityContext.toLowerCase().trim()}`;
}

interface PlaceCacheProviderProps {
  children: ReactNode;
}

export function PlaceCacheProvider({ children }: PlaceCacheProviderProps) {
  const cache = useRef<Map<string, ResolveResponse>>(new Map());
  const inflight = useRef<Map<string, Promise<ResolveResponse>>>(new Map());

  const resolve = useCallback(async (req: ResolveRequest): Promise<ResolveResponse> => {
    const key = buildCacheKey(req);

    // 1. Return from cache if available
    const cached = cache.current.get(key);
    if (cached) return cached;

    // 2. If a request for this key is already in flight, wait for it
    //    (prevents duplicate calls when user hovers the same item rapidly)
    const existing = inflight.current.get(key);
    if (existing) return existing;

    // 3. Make the API call
    const promise = (async () => {
      try {
        const res = await fetch('/api/places/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
        });

        if (!res.ok) {
          return NOT_FOUND_RESPONSE;
        }

        const data: ResolveResponse = await res.json();
        cache.current.set(key, data);
        return data;
      } catch {
        return NOT_FOUND_RESPONSE;
      } finally {
        inflight.current.delete(key);
      }
    })();

    inflight.current.set(key, promise);
    return promise;
  }, []);

  const getFromCache = useCallback((key: string): ResolveResponse | undefined => {
    return cache.current.get(key);
  }, []);

  return (
    <PlaceCacheContext.Provider value={{ resolve, getFromCache }}>
      {children}
    </PlaceCacheContext.Provider>
  );
}
