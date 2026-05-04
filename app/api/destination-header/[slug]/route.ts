// app/api/destination-header/[slug]/route.ts
// GET endpoint returning up to 3 destination header photos via a landmark-first waterfall.
// Called by the planner header component (wired in P2-6b).

import { NextResponse } from 'next/server';
import { resolveDestinationHeader } from '@/lib/places/destination-header';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    if (process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Place preview is disabled' },
        { status: 503 }
      );
    }

    const { slug } = await context.params;

    if (!slug || slug.trim().length < 2) {
      return NextResponse.json(
        { error: 'slug is required' },
        { status: 400 }
      );
    }

    // Decode slug back to a destination name (e.g. "tokyo-japan" → "tokyo japan")
    const destinationName = decodeURIComponent(slug).replace(/-/g, ' ');

    // Optional lat/lng/countryCode from query params
    const url = new URL(_request.url);
    const latParam = url.searchParams.get('lat');
    const lngParam = url.searchParams.get('lng');
    const cc = url.searchParams.get('cc') ?? undefined;

    const lat =
      latParam !== null && isFinite(Number(latParam))
        ? Number(latParam)
        : undefined;
    const lng =
      lngParam !== null && isFinite(Number(lngParam))
        ? Number(lngParam)
        : undefined;

    const result = await resolveDestinationHeader(destinationName, lat, lng, cc);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': result.fromCache
          ? 'public, max-age=3600, s-maxage=86400'
          : 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('[/api/destination-header] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
