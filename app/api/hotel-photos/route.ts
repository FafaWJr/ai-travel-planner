import { NextRequest } from 'next/server';

const HOTEL_FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

async function resolveGooglePhotoRef(photoRef: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${encodeURIComponent(photoRef)}&key=${apiKey}`;
    const res = await fetch(url, { redirect: 'follow', next: { revalidate: 86400 } });
    if (!res.ok && res.status !== 302) return null;
    return res.url || null;
  } catch {
    return null;
  }
}

/**
 * Fetches real hotel photos via Google Places Text Search.
 * ?name=Hotel+Name&city=Paris
 * Returns { photos: string[] } — up to 3 direct CDN URLs.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name') || '';
  const city = request.nextUrl.searchParams.get('city') || '';

  if (!name.trim() || !city.trim()) {
    return Response.json({ photos: [HOTEL_FALLBACK] });
  }

  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_API_KEY) {
    return Response.json({ photos: [HOTEL_FALLBACK] });
  }

  try {
    const query = `${name} hotel ${city}`;
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=lodging&key=${GOOGLE_API_KEY}`;
    const searchRes = await fetch(searchUrl, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });

    if (!searchRes.ok) {
      return Response.json({ photos: [HOTEL_FALLBACK] });
    }

    const searchData = await searchRes.json();
    const place = searchData.results?.[0];

    if (!place?.photos?.length) {
      console.log(`[hotel-photos] No Google Places photos for "${name}, ${city}"`);
      return Response.json({ photos: [HOTEL_FALLBACK] });
    }

    // Take up to 3 photo references from the place
    const photoRefs: string[] = place.photos
      .slice(0, 3)
      .map((p: { photo_reference: string }) => p.photo_reference)
      .filter(Boolean);

    const urls = await Promise.all(
      photoRefs.map(ref => resolveGooglePhotoRef(ref, GOOGLE_API_KEY)),
    );
    const valid = urls.filter((u): u is string => !!u && u.startsWith('http'));

    if (valid.length === 0) {
      return Response.json({ photos: [HOTEL_FALLBACK] });
    }

    console.log(`[hotel-photos] ${valid.length} photos for "${name}, ${city}"`);
    return Response.json({ photos: valid });
  } catch (err) {
    console.error('[hotel-photos] error:', err);
    return Response.json({ photos: [HOTEL_FALLBACK] });
  }
}
