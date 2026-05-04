// lib/places/destination-header.ts
// Resolves destination header photos via a 3-tier waterfall:
// 1. Google Places landmarks (top tourist attractions for the destination)
// 2. Unsplash with optimised qualifier-rich landscape queries
// 3. Pexels with the same strategy as the final fallback

import { createClient as createServiceClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createServiceClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

// -----------------------------------------------------------------------
// Public types
// -----------------------------------------------------------------------

export interface DestinationHeaderPhoto {
  url: string;
  source: 'google_places' | 'unsplash' | 'pexels';
  photographer: string | null;
  photographerUrl: string | null;
  attributionHtml: string | null;
  width: number;
  height: number;
}

export interface DestinationHeaderResult {
  photos: DestinationHeaderPhoto[];
  destination: string;
  fromCache: boolean;
}

// -----------------------------------------------------------------------
// Internal types
// -----------------------------------------------------------------------

interface LandmarkResult {
  placeId: string;
  displayName: string;
  photoNames: string[];
}

interface GoogleLandmarkPlace {
  id: string;
  displayName?: { text?: string };
  photos?: Array<{ name: string; widthPx?: number; heightPx?: number }>;
  userRatingCount?: number;
}

interface UnsplashSearchResult {
  urls?: { regular?: string; full?: string };
  links?: { html?: string; download_location?: string };
  user?: { name?: string; links?: { html?: string } };
  width?: number;
  height?: number;
  alt_description?: string | null;
}

interface PexelsPhoto {
  src?: { landscape?: string; large?: string };
  photographer?: string | null;
  photographer_url?: string | null;
  alt?: string | null;
  width?: number;
  height?: number;
}

// -----------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------

const TARGET_PHOTO_COUNT = 3;

export async function resolveDestinationHeader(
  destinationName: string,
  lat?: number,
  lng?: number,
  countryCode?: string
): Promise<DestinationHeaderResult> {
  const slug = normaliseSlug(destinationName);

  // 1. Return from photo cache if fresh
  const cached = await getCachedHeaderPhotos(slug);
  if (cached.length >= TARGET_PHOTO_COUNT) {
    return { photos: cached, destination: destinationName, fromCache: true };
  }

  const photos: DestinationHeaderPhoto[] = [];

  // 2. Tier 1 — Google Places landmarks
  const landmarks = await discoverLandmarks(slug, destinationName, lat, lng, countryCode);
  for (const landmark of landmarks) {
    if (photos.length >= TARGET_PHOTO_COUNT) break;
    if (landmark.photoNames.length === 0) continue;
    photos.push({
      url: `/api/places/photo/${encodeURIComponent(landmark.placeId)}/0?w=1200`,
      source: 'google_places',
      photographer: null,
      photographerUrl: null,
      attributionHtml: '<span translate="no">Google Maps</span>',
      width: 1200,
      height: 800,
    });
  }

  // 3. Tier 2 — Unsplash with qualifier-rich queries
  if (photos.length < TARGET_PHOTO_COUNT) {
    const unsplash = await fetchUnsplashDestination(
      destinationName,
      countryCode,
      TARGET_PHOTO_COUNT - photos.length
    );
    photos.push(...unsplash);
  }

  // 4. Tier 3 — Pexels
  if (photos.length < TARGET_PHOTO_COUNT) {
    const pexels = await fetchPexelsDestination(
      destinationName,
      countryCode,
      TARGET_PHOTO_COUNT - photos.length
    );
    photos.push(...pexels);
  }

  // 5. Cache results (7-day TTL)
  if (photos.length > 0) {
    await cacheHeaderPhotos(slug, photos);
  }

  return { photos, destination: destinationName, fromCache: false };
}

// -----------------------------------------------------------------------
// Tier 1: Google Places landmark discovery
// -----------------------------------------------------------------------

async function discoverLandmarks(
  slug: string,
  destinationName: string,
  lat?: number,
  lng?: number,
  countryCode?: string
): Promise<LandmarkResult[]> {
  // Return 90-day cached landmarks if available
  const cached = await getCachedLandmarks(slug);
  if (cached.length >= TARGET_PHOTO_COUNT) return cached;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('[DestHeader] GOOGLE_PLACES_API_KEY not set');
    return cached;
  }

  const body: Record<string, unknown> = {
    textQuery: `top tourist attractions in ${destinationName}`,
    includedType: 'tourist_attraction',
    maxResultCount: 5,
    rankPreference: 'RELEVANCE',
    languageCode: 'en',
  };

  if (lat != null && lng != null) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 15000 },
    };
  }
  if (countryCode) body.regionCode = countryCode;

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // Pro tier: photos field required for landmark photo names
        'X-Goog-FieldMask': 'places.id,places.displayName,places.photos,places.userRatingCount',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('[DestHeader] Google Text Search failed:', res.status);
      return cached;
    }

    const data = await res.json() as { places?: GoogleLandmarkPlace[] };
    const places = data.places ?? [];

    const landmarks: LandmarkResult[] = places
      .filter((p) => (p.photos?.length ?? 0) > 0)
      .map((p) => ({
        placeId: p.id,
        displayName: p.displayName?.text ?? '',
        photoNames: (p.photos ?? []).map((ph) => ph.name),
      }));

    if (landmarks.length > 0) {
      await cacheLandmarks(slug, landmarks);
    }

    return landmarks;
  } catch (err) {
    console.error('[DestHeader] Google landmark discovery error:', err);
    return cached;
  }
}

// -----------------------------------------------------------------------
// Tier 2: Unsplash with optimised queries
// -----------------------------------------------------------------------

async function fetchUnsplashDestination(
  destinationName: string,
  _countryCode: string | undefined,
  needed: number
): Promise<DestinationHeaderPhoto[]> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return [];

  const city = destinationName.split(',')[0].trim();
  const country = destinationName.split(',').slice(-1)[0]?.trim() ?? '';

  // Qualifier-rich query hierarchy — not bare city name (prevents Joao Pessoa→cowboys)
  const queries = [
    `${city} skyline aerial`,
    `${city} beach coast`,
    `${city} landmark architecture`,
    `${city} landscape tourism`,
    country && country !== city ? `${country} ${city} travel` : `${city} travel`,
  ];

  const photos: DestinationHeaderPhoto[] = [];
  const utmParams = '?utm_source=lunaletsgo&utm_medium=referral';

  for (const query of queries) {
    if (photos.length >= needed) break;
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?` +
          `query=${encodeURIComponent(query)}` +
          `&orientation=landscape&content_filter=high&order_by=relevant&per_page=5`,
        { headers: { Authorization: `Client-ID ${apiKey}` } }
      );
      if (!res.ok) continue;

      const data = await res.json() as { results?: UnsplashSearchResult[] };
      for (const photo of data.results ?? []) {
        if (photos.length >= needed) break;

        const w = photo.width ?? 0;
        const h = photo.height ?? 0;
        if (w < 1200 || h === 0 || w / h < 1.5) continue;
        if (isNegativeContent(photo.alt_description ?? '')) continue;

        const photoUrl = photo.urls?.regular ?? photo.urls?.full ?? '';
        if (!photoUrl) continue;

        // Fire download_location ping — required by Unsplash ToS, fire-and-forget
        if (photo.links?.download_location) {
          fetch(photo.links.download_location, {
            headers: { Authorization: `Client-ID ${apiKey}` },
          }).catch(() => {});
        }

        photos.push({
          url: photoUrl,
          source: 'unsplash',
          photographer: photo.user?.name ?? null,
          photographerUrl: photo.user?.links?.html
            ? `${photo.user.links.html}${utmParams}`
            : null,
          attributionHtml: photo.user?.name
            ? `Photo: <a href="${photo.user.links?.html ?? ''}${utmParams}" target="_blank" rel="noopener noreferrer">${photo.user.name}</a> on <a href="https://unsplash.com${utmParams}" target="_blank" rel="noopener noreferrer">Unsplash</a>`
            : null,
          width: w,
          height: h,
        });
      }
    } catch {
      // continue to next query
    }
  }

  return photos;
}

// -----------------------------------------------------------------------
// Tier 3: Pexels with optimised queries
// -----------------------------------------------------------------------

async function fetchPexelsDestination(
  destinationName: string,
  _countryCode: string | undefined,
  needed: number
): Promise<DestinationHeaderPhoto[]> {
  const apiKey = process.env.PEXELS_ACCESS_KEY;
  if (!apiKey) return [];

  const city = destinationName.split(',')[0].trim();
  const country = destinationName.split(',').slice(-1)[0]?.trim() ?? '';

  const queries = [
    `${city} skyline aerial`,
    `${city} beach coast`,
    `${city} landscape`,
    country && country !== city ? `${country} ${city} travel` : `${city} travel`,
  ];

  const photos: DestinationHeaderPhoto[] = [];

  for (const query of queries) {
    if (photos.length >= needed) break;
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?` +
          `query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=5`,
        { headers: { Authorization: apiKey } }
      );
      if (!res.ok) continue;

      const data = await res.json() as { photos?: PexelsPhoto[] };
      for (const photo of data.photos ?? []) {
        if (photos.length >= needed) break;

        const w = photo.width ?? 0;
        const h = photo.height ?? 0;
        if (w < 1200 || h === 0 || w / h < 1.5) continue;
        if (isNegativeContent(photo.alt ?? '')) continue;

        const photoUrl = photo.src?.landscape ?? photo.src?.large ?? '';
        if (!photoUrl) continue;

        photos.push({
          url: photoUrl,
          source: 'pexels',
          photographer: photo.photographer ?? null,
          photographerUrl: photo.photographer_url ?? null,
          attributionHtml: photo.photographer
            ? `Photo: <a href="${photo.photographer_url ?? ''}" target="_blank" rel="noopener noreferrer">${photo.photographer}</a> on <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a>`
            : null,
          width: w,
          height: h,
        });
      }
    } catch {
      // continue to next query
    }
  }

  return photos;
}

// -----------------------------------------------------------------------
// Photo quality filter
// -----------------------------------------------------------------------

const NEGATIVE_KEYWORDS = new Set([
  'portrait', 'selfie', 'headshot', 'model', 'fashion',
  'food', 'plate', 'dish', 'restaurant interior', 'cooking',
  'macro', 'closeup', 'close-up', 'bokeh',
  'product', 'mockup', 'template',
  'wedding', 'bride', 'groom',
  'baby', 'infant', 'newborn',
  'pet', 'dog', 'cat',
  'car interior', 'dashboard',
  'watch', 'phone', 'laptop', 'screen',
  'cowboy', 'rodeo', 'horse riding',
]);

function isNegativeContent(description: string): boolean {
  const lower = description.toLowerCase();
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lower.includes(keyword)) return true;
  }
  return false;
}

// -----------------------------------------------------------------------
// Cache helpers
// -----------------------------------------------------------------------

function normaliseSlug(destination: string): string {
  return destination
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
}

async function getCachedHeaderPhotos(slug: string): Promise<DestinationHeaderPhoto[]> {
  const client = getAdminClient();
  const { data } = await client
    .from('destination_header_photos')
    .select('photo_url, source, photographer, photographer_url, attribution_html, width_px, height_px')
    .eq('destination_slug', slug)
    .gt('expires_at', new Date().toISOString())
    .order('photo_index', { ascending: true })
    .limit(TARGET_PHOTO_COUNT);

  if (!data || data.length === 0) return [];

  return (data as {
    photo_url: string;
    source: 'google_places' | 'unsplash' | 'pexels';
    photographer: string | null;
    photographer_url: string | null;
    attribution_html: string | null;
    width_px: number | null;
    height_px: number | null;
  }[]).map((row) => ({
    url: row.photo_url,
    source: row.source,
    photographer: row.photographer ?? null,
    photographerUrl: row.photographer_url ?? null,
    attributionHtml: row.attribution_html ?? null,
    width: row.width_px ?? 1200,
    height: row.height_px ?? 800,
  }));
}

async function cacheHeaderPhotos(slug: string, photos: DestinationHeaderPhoto[]): Promise<void> {
  const client = getAdminClient();
  const rows = photos.slice(0, TARGET_PHOTO_COUNT).map((photo, i) => ({
    destination_slug: slug,
    photo_index: i,
    source: photo.source,
    google_place_id: null,
    photo_url: photo.url,
    photographer: photo.photographer,
    photographer_url: photo.photographerUrl,
    attribution_html: photo.attributionHtml,
    width_px: photo.width,
    height_px: photo.height,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  await client
    .from('destination_header_photos')
    .upsert(rows, { onConflict: 'destination_slug,photo_index' });
}

async function getCachedLandmarks(slug: string): Promise<LandmarkResult[]> {
  const client = getAdminClient();
  const { data } = await client
    .from('destination_header_landmarks')
    .select('google_place_id, display_name')
    .eq('destination_slug', slug)
    .gt('expires_at', new Date().toISOString())
    .order('rank', { ascending: true })
    .limit(5);

  if (!data || data.length === 0) return [];

  const rows = data as { google_place_id: string; display_name: string | null }[];
  const results: LandmarkResult[] = [];

  for (const row of rows) {
    const { data: place } = await client
      .from('cached_places')
      .select('photo_names')
      .eq('google_place_id', row.google_place_id)
      .maybeSingle();

    results.push({
      placeId: row.google_place_id,
      displayName: row.display_name ?? '',
      photoNames: (place?.photo_names as string[] | null) ?? [],
    });
  }

  return results;
}

async function cacheLandmarks(slug: string, landmarks: LandmarkResult[]): Promise<void> {
  const client = getAdminClient();

  // Persist to cached_places so the photo proxy can serve landmark photos.
  // ignoreDuplicates: true prevents overwriting rich data (lat, rating, etc.)
  // that may already exist from a previous hover-triggered resolution.
  for (const landmark of landmarks) {
    await client
      .from('cached_places')
      .upsert(
        {
          google_place_id: landmark.placeId,
          entity_type: 'attraction',
          display_name: landmark.displayName,
          lat: 0,
          lng: 0,
          google_maps_uri: '',
          photo_count: landmark.photoNames.length,
          photo_names: landmark.photoNames,
          metadata: {},
          resolved_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: 'google_place_id', ignoreDuplicates: true }
      );
  }

  // Cache destination-to-landmark mapping (90-day TTL)
  const rows = landmarks.map((lm, i) => ({
    destination_slug: slug,
    google_place_id: lm.placeId,
    display_name: lm.displayName,
    rank: i,
    resolved_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  await client
    .from('destination_header_landmarks')
    .upsert(rows, { onConflict: 'destination_slug,google_place_id' });
}
