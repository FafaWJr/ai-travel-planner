import { NextRequest } from 'next/server';

// Generic travel fallbacks — used only when both APIs fail
const TRAVEL_FALLBACKS = [
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
];

/**
 * Resolves a Google Places photo_reference to a direct CDN URL.
 * Returns null if the API key is missing or the request fails.
 */
async function resolveGooglePhotoRef(
  photoRef: string,
  apiKey: string,
  maxwidth = 1200,
): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(photoRef)}&key=${apiKey}`;
    const res = await fetch(url, { redirect: 'follow', next: { revalidate: 86400 } });
    if (!res.ok && res.status !== 302) return null;
    return res.url || null;
  } catch {
    return null;
  }
}

/**
 * Google Places Text Search for tourist attractions in the city.
 * Returns up to `needed` direct CDN photo URLs.
 */
async function fetchGooglePlacesDestinationPhotos(
  city: string,
  country: string,
  needed: number,
): Promise<string[]> {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_API_KEY) return [];

  try {
    const query = `${city} tourist attraction landmark`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    const searchRes = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      console.log(`[destination-photos] Google Places: no results for "${query}"`);
      return [];
    }

    // Collect photo_references from top places (up to 1 photo per place)
    const photoRefs: string[] = [];
    for (const place of searchData.results.slice(0, needed + 3)) {
      if (photoRefs.length >= needed) break;
      const ref = place.photos?.[0]?.photo_reference;
      if (ref) photoRefs.push(ref);
    }

    // Resolve all refs to CDN URLs in parallel
    const urls = await Promise.all(
      photoRefs.map(ref => resolveGooglePhotoRef(ref, GOOGLE_API_KEY, 1200)),
    );
    const valid = urls.filter((u): u is string => !!u && u.startsWith('http'));
    console.log(`[destination-photos] Google Places: ${valid.length} photos for "${city}"`);
    return valid;
  } catch (err) {
    console.error('[destination-photos] Google Places error:', err);
    return [];
  }
}

/**
 * Pexels travel photo search — used when Google Places returns fewer than needed.
 */
async function fetchPexelsDestinationPhotos(city: string, needed: number): Promise<string[]> {
  const PEXELS_KEY = process.env.PEXELS_API_KEY;
  if (!PEXELS_KEY) return [];

  try {
    const query = encodeURIComponent(`${city} travel tourism`);
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=${needed}&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY }, signal: AbortSignal.timeout(6000), next: { revalidate: 3600 } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.photos || data.photos.length === 0) return [];
    const urls = data.photos.map((p: { src: { large2x: string } }) => p.src.large2x);
    console.log(`[destination-photos] Pexels: ${urls.length} photos for "${city}"`);
    return urls;
  } catch (err) {
    console.error('[destination-photos] Pexels error:', err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const rawCity = request.nextUrl.searchParams.get('city') || '';
  if (!rawCity.trim()) {
    return Response.json({ photos: TRAVEL_FALLBACKS.slice(0, 3), source: 'fallback' });
  }

  const parts = rawCity.split(',').map(s => s.trim()).filter(Boolean);
  const city = parts[0];
  const country = parts[parts.length - 1] ?? city;

  console.log(`[destination-photos] city="${city}" country="${country}"`);

  const photos: string[] = [];

  // Step 1: Google Places tourist attraction search
  const googlePhotos = await fetchGooglePlacesDestinationPhotos(city, country, 3);
  photos.push(...googlePhotos);

  // Step 2: Pexels to fill remaining slots
  if (photos.length < 3) {
    const pexels = await fetchPexelsDestinationPhotos(city, 3 - photos.length);
    for (const url of pexels) {
      if (!photos.includes(url)) photos.push(url);
    }
  }

  // Step 3: Hardcoded Unsplash travel fallbacks
  if (photos.length < 3) {
    for (const url of TRAVEL_FALLBACKS) {
      if (photos.length >= 3) break;
      if (!photos.includes(url)) photos.push(url);
    }
  }

  const finalPhotos = photos.slice(0, 3);
  const source = googlePhotos.length > 0 ? 'google-places' : photos.length > 0 ? 'pexels' : 'fallback';
  console.log(`[destination-photos] Final: ${finalPhotos.length} photos (source: ${source})`);

  return Response.json({ photos: finalPhotos, source });
}
