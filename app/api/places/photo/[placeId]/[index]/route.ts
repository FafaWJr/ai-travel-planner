// app/api/places/photo/[placeId]/[index]/route.ts
// GET endpoint that proxies Google Places photos through Supabase Storage.
// Browser requests: /api/places/photo/{placeId}/{index}?w=800
// Response: 302 redirect to Supabase Storage public URL (or 404)

import { NextResponse } from 'next/server';
import { getOrFetchPhoto, snapToWidthBucket } from '@/lib/places/photo-proxy';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface RouteParams {
  params: Promise<{
    placeId: string;
    index: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteParams
) {
  try {
    // Check feature flag
    if (process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED !== 'true') {
      return new Response(null, { status: 503 });
    }

    const { placeId, index: indexStr } = await context.params;

    // Validate placeId
    if (!placeId || placeId.length < 5) {
      return new Response('Invalid placeId', { status: 400 });
    }

    // Validate and parse index
    const photoIndex = parseInt(indexStr, 10);
    if (isNaN(photoIndex) || photoIndex < 0 || photoIndex > 9) {
      return new Response('Invalid photo index (0-9)', { status: 400 });
    }

    // Parse width from query string
    const url = new URL(request.url);
    const rawWidth = parseInt(url.searchParams.get('w') ?? '800', 10);
    const width = isNaN(rawWidth) ? 800 : snapToWidthBucket(rawWidth);

    // Fetch or serve from cache
    const result = await getOrFetchPhoto(placeId, photoIndex, width);

    if (!result) {
      return new Response(null, { status: 404 });
    }

    // 302 redirect to the Supabase Storage public URL.
    // The browser and CDN will cache the redirect target.
    return NextResponse.redirect(result.publicUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=2592000',
        ...(result.authorName
          ? { 'X-Photo-Author': result.authorName }
          : {}),
        ...(result.authorUri
          ? { 'X-Photo-Author-Uri': result.authorUri }
          : {}),
      },
    });
  } catch (err) {
    console.error('[/api/places/photo] Unhandled error:', err);
    return new Response(null, { status: 500 });
  }
}
