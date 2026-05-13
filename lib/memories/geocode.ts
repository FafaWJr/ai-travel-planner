// lib/memories/geocode.ts
import { createClient } from '@supabase/supabase-js';
import type { GeoCoordinate, GeocodedLocation, NominatimResponse } from './geocode-types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'Luna-LetsGo/1.0 (hello@lunaletsgo.com)';
const RATE_LIMIT_MS = 1100; // Nominatim policy: max 1 req/sec
const TIMEOUT_MS = 5000;

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** Round a coordinate to 3 decimal places (~111m precision) for cache keys */
function roundKey(n: number): string {
  return n.toFixed(3);
}

/**
 * Extract the best human-readable display name from a Nominatim address.
 * Priority: landmark > neighbourhood > district > city (most specific wins).
 */
function extractDisplayName(addr: NominatimResponse['address']): {
  displayName: string;
  neighbourhood: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
} {
  const landmark = addr.tourism || addr.historic || null;
  const neighbourhood = addr.neighbourhood || addr.suburb || null;
  const district = addr.city_district || addr.borough || null;
  const city = addr.city || addr.town || addr.village || null;
  const country = addr.country || null;
  const displayName = landmark || neighbourhood || district || city || 'Unknown location';
  return { displayName, neighbourhood, district, city, country };
}

/** Simple sequential queue to respect Nominatim rate limit */
let lastCallTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastCallTime = Date.now();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/** Reverse geocode a single coordinate via Nominatim (no cache check). */
async function nominatimReverse(coord: GeoCoordinate): Promise<NominatimResponse | null> {
  try {
    const url = `${NOMINATIM_BASE}?lat=${coord.lat}&lon=${coord.lng}&format=json&zoom=16&addressdetails=1`;
    const res = await rateLimitedFetch(url);
    if (!res.ok) {
      console.error(`[geocode] Nominatim returned ${res.status} for ${coord.lat},${coord.lng}`);
      return null;
    }
    return await res.json() as NominatimResponse;
  } catch (err) {
    console.error(`[geocode] Nominatim error for ${coord.lat},${coord.lng}:`, err);
    return null;
  }
}

type CacheRow = {
  lat_key: string;
  lng_key: string;
  neighbourhood: string | null;
  district: string | null;
  city: string | null;
  country: string | null;
  display_name: string;
};

/**
 * Batch reverse geocode coordinates.
 * Checks cache first, calls Nominatim only for uncached coordinates.
 * Saves new results to cache.
 *
 * @param coordinates - Array of {lat, lng} (max 50)
 * @returns Array of GeocodedLocation in the same order as input
 */
export async function batchReverseGeocode(
  coordinates: GeoCoordinate[],
): Promise<GeocodedLocation[]> {
  if (coordinates.length === 0) return [];
  if (coordinates.length > 50) {
    throw new Error('batchReverseGeocode: max 50 coordinates per call');
  }

  const supabase = getServiceClient();
  const results: GeocodedLocation[] = new Array(coordinates.length);

  // Build cache lookup keys
  const keys = coordinates.map(c => ({
    latKey: roundKey(c.lat),
    lngKey: roundKey(c.lng),
  }));

  // Deduplicate keys (multiple photos at the same rounded location)
  const uniqueKeys = new Map<string, { latKey: string; lngKey: string; indices: number[] }>();
  keys.forEach((k, i) => {
    const cacheKey = `${k.latKey}:${k.lngKey}`;
    const existing = uniqueKeys.get(cacheKey);
    if (existing) {
      existing.indices.push(i);
    } else {
      uniqueKeys.set(cacheKey, { ...k, indices: [i] });
    }
  });

  const cacheKeyPairs = Array.from(uniqueKeys.values());
  const uncachedEntries: { latKey: string; lngKey: string; indices: number[]; coord: GeoCoordinate }[] = [];

  // Query cache in batches of 20 (Supabase .or() has limits)
  for (let batch = 0; batch < cacheKeyPairs.length; batch += 20) {
    const chunk = cacheKeyPairs.slice(batch, batch + 20);
    const orFilter = chunk
      .map(k => `and(lat_key.eq.${k.latKey},lng_key.eq.${k.lngKey})`)
      .join(',');

    const { data: cached } = await supabase
      .from('geocode_cache')
      .select('lat_key, lng_key, neighbourhood, district, city, country, display_name')
      .or(orFilter);

    const cachedMap = new Map<string, CacheRow>();
    (cached ?? []).forEach((row: CacheRow) => {
      cachedMap.set(`${row.lat_key}:${row.lng_key}`, row);
    });

    chunk.forEach(entry => {
      const cacheKey = `${entry.latKey}:${entry.lngKey}`;
      const hit = cachedMap.get(cacheKey);
      if (hit) {
        entry.indices.forEach(i => {
          results[i] = {
            lat: coordinates[i].lat,
            lng: coordinates[i].lng,
            neighbourhood: hit.neighbourhood,
            district: hit.district,
            city: hit.city,
            country: hit.country,
            displayName: hit.display_name,
            cached: true,
          };
        });
      } else {
        uncachedEntries.push({
          ...entry,
          coord: coordinates[entry.indices[0]],
        });
      }
    });
  }

  // Geocode uncached entries sequentially (rate limited)
  for (const entry of uncachedEntries) {
    const response = await nominatimReverse(entry.coord);

    if (!response?.address) {
      entry.indices.forEach(i => {
        results[i] = {
          lat: coordinates[i].lat,
          lng: coordinates[i].lng,
          neighbourhood: null,
          district: null,
          city: null,
          country: null,
          displayName: 'Unknown location',
          cached: false,
        };
      });
      continue;
    }

    const extracted = extractDisplayName(response.address);

    await supabase.from('geocode_cache').upsert({
      lat_key: entry.latKey,
      lng_key: entry.lngKey,
      raw_response: response as unknown as Record<string, unknown>,
      neighbourhood: extracted.neighbourhood,
      district: extracted.district,
      city: extracted.city,
      country: extracted.country,
      display_name: extracted.displayName,
    }, { onConflict: 'lat_key,lng_key' });

    entry.indices.forEach(i => {
      results[i] = {
        lat: coordinates[i].lat,
        lng: coordinates[i].lng,
        neighbourhood: extracted.neighbourhood,
        district: extracted.district,
        city: extracted.city,
        country: extracted.country,
        displayName: extracted.displayName,
        cached: false,
      };
    });
  }

  return results;
}
