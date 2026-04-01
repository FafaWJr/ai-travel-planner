import { NextRequest } from 'next/server';

/**
 * Resolves a Google Places photo_reference to a usable CDN image URL.
 * Google Photos API redirects to lh3.googleusercontent.com — we follow
 * the redirect and return that final URL so the client can load it directly.
 */
export async function GET(request: NextRequest) {
  const photoRef = request.nextUrl.searchParams.get('photo_reference');
  const maxwidth = request.nextUrl.searchParams.get('maxwidth') || '1200';
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  if (!photoRef || !GOOGLE_API_KEY) {
    return Response.json({ url: null });
  }

  try {
    const apiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(photoRef)}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(apiUrl, { redirect: 'follow', next: { revalidate: 86400 } });
    if (!res.ok && res.status !== 302) return Response.json({ url: null });
    // res.url is the final URL after redirect (lh3.googleusercontent.com)
    return Response.json({ url: res.url });
  } catch {
    return Response.json({ url: null });
  }
}
