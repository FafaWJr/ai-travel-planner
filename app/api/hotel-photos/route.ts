import { NextRequest } from 'next/server';

const HOTEL_FALLBACKS = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c4fe1962?w=1200&q=80',
];

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

/**
 * Fetches real hotel photos.
 * Tier 1: Unsplash search "{hotel name} hotel {city}"
 * Tier 2: Pexels search "{hotel name} hotel exterior"
 * Tier 3: Generic hotel fallbacks (3 different images)
 *
 * ?name=Hotel+Name&city=Paris
 * Returns { photos: string[] } — up to 3 direct image URLs.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';
  const city = request.nextUrl.searchParams.get('city') || '';

  console.log('[hotel-photos] params:', Object.fromEntries(request.nextUrl.searchParams.entries()));

  if (!name.trim() || !city.trim()) {
    return Response.json({ photos: HOTEL_FALLBACKS }, { headers: NO_CACHE_HEADERS });
  }

  // Tier 1: Unsplash
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const query = encodeURIComponent(`${name} hotel ${city}`);
      const randomPage = Math.floor(Math.random() * 3) + 1;
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=5&page=${randomPage}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` }, signal: AbortSignal.timeout(6000) },
      );
      if (res.ok) {
        const data = await res.json();
        const shuffled = ((data.results ?? []) as { urls: { full: string }; links?: { download_location?: string } }[])
          .sort(() => Math.random() - 0.5);
        const results = shuffled.slice(0, 3);
        // Fire-and-forget download triggers (required by Unsplash API guidelines)
        for (const photo of results) {
          if (photo.links?.download_location) {
            fetch(`${photo.links.download_location}&client_id=${unsplashKey}`, { method: 'GET' }).catch(() => {});
          }
        }
        const photos: string[] = results.map((p) => p.urls.full);
        if (photos.length > 0) {
          console.log(`[hotel-photos] Unsplash: ${photos.length} photos for "${name}, ${city}"`);
          return Response.json({ photos }, { headers: NO_CACHE_HEADERS });
        }
      }
    } catch { /* fall through */ }
  }

  // Tier 2: Pexels
  const pexelsKey = process.env.PEXELS_ACCESS_KEY;
  if (pexelsKey) {
    try {
      const query = encodeURIComponent(`${name} hotel exterior`);
      const randomPage = Math.floor(Math.random() * 3) + 1;
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${query}&per_page=5&page=${randomPage}&orientation=landscape`,
        { headers: { Authorization: pexelsKey } },
      );
      if (res.ok) {
        const data = await res.json();
        const shuffled = ((data.photos || []) as { src: { landscape: string } }[])
          .sort(() => Math.random() - 0.5);
        const photos: string[] = shuffled.slice(0, 3).map((p) => p.src.landscape);
        if (photos.length > 0) {
          console.log(`[hotel-photos] Pexels: ${photos.length} photos for "${name}"`);
          return Response.json({ photos }, { headers: NO_CACHE_HEADERS });
        }
      }
    } catch { /* fall through */ }
  }

  // Tier 3: Generic hotel fallbacks
  return Response.json({ photos: HOTEL_FALLBACKS }, { headers: NO_CACHE_HEADERS });
}
