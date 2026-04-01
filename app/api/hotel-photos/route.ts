import { NextRequest } from 'next/server';

const HOTEL_FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

/**
 * Fetches real hotel photos.
 * Tier 1: Unsplash search "{hotel name} hotel"
 * Tier 2: Google Places Text Search with type=lodging
 * Tier 3: Generic hotel fallback
 *
 * ?name=Hotel+Name&city=Paris
 * Returns { photos: string[] } — up to 3 direct image URLs.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';
  const city = request.nextUrl.searchParams.get('city') || '';

  if (!name.trim() || !city.trim()) {
    return Response.json({ photos: [HOTEL_FALLBACK] });
  }

  // Tier 1: Unsplash
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  if (unsplashKey) {
    try {
      const query = encodeURIComponent(`${name} hotel`);
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=3&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${unsplashKey}` }, signal: AbortSignal.timeout(6000) },
      );
      if (res.ok) {
        const data = await res.json();
        const photos: string[] = (data.results ?? [])
          .slice(0, 3)
          .map((p: { urls: { regular: string } }) => p.urls.regular);
        if (photos.length > 0) {
          console.log(`[hotel-photos] Unsplash: ${photos.length} photos for "${name}"`);
          return Response.json({ photos });
        }
      }
    } catch { /* fall through */ }
  }

  // Tier 2: Google Places
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (GOOGLE_API_KEY) {
    try {
      const query = `${name} hotel ${city}`;
      const searchRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=lodging&key=${GOOGLE_API_KEY}`,
        { signal: AbortSignal.timeout(8000), next: { revalidate: 3600 } },
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const place = searchData.results?.[0];

        if (place?.photos?.length) {
          const photoRefs: string[] = place.photos
            .slice(0, 3)
            .map((p: { photo_reference: string }) => p.photo_reference)
            .filter(Boolean);

          const urls = await Promise.all(
            photoRefs.map(async (ref) => {
              try {
                const photoRes = await fetch(
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_API_KEY}`,
                  { redirect: 'follow', next: { revalidate: 86400 } },
                );
                if (photoRes.ok && photoRes.url && !photoRes.url.includes('photoreference')) {
                  return photoRes.url;
                }
                return null;
              } catch { return null; }
            }),
          );

          const valid = urls.filter((u): u is string => !!u);
          if (valid.length > 0) {
            console.log(`[hotel-photos] Google Places: ${valid.length} photos for "${name}, ${city}"`);
            return Response.json({ photos: valid });
          }
        }
      }
    } catch (err) {
      console.error('[hotel-photos] Google Places error:', err);
    }
  }

  // Tier 3: fallback
  return Response.json({ photos: [HOTEL_FALLBACK] });
}
