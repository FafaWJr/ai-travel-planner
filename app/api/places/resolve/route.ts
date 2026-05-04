// app/api/places/resolve/route.ts
// POST endpoint for resolving a place name to cached Google Places data.
// Called by the PlacePreviewTrigger component on hover (desktop) or tap (mobile).

import { NextResponse } from 'next/server';
import { resolvePlace } from '@/lib/places/resolver';
import type { ResolveRequest } from '@/lib/places/types';

export const runtime = 'nodejs';
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    // Check feature flag
    if (process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Place preview is disabled' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const cityContext =
      typeof body.cityContext === 'string' ? body.cityContext.trim() : '';

    if (!query || !cityContext) {
      return NextResponse.json(
        { error: 'query and cityContext are required' },
        { status: 400 }
      );
    }

    // Optional fields
    const lat =
      typeof body.lat === 'number' && isFinite(body.lat)
        ? body.lat
        : undefined;
    const lng =
      typeof body.lng === 'number' && isFinite(body.lng)
        ? body.lng
        : undefined;
    const regionCode =
      typeof body.regionCode === 'string' && body.regionCode.length === 2
        ? body.regionCode.toUpperCase()
        : undefined;

    const force = body.force === true;
    const originalQuery =
      typeof body.originalQuery === 'string' ? body.originalQuery.trim() : undefined;

    const req: ResolveRequest = {
      query,
      cityContext,
      lat,
      lng,
      regionCode,
      force,
      originalQuery,
    };

    const result = await resolvePlace(req);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        // Force corrections must not be cached — the result is a user-driven override
        'Cache-Control': force
          ? 'no-store'
          : 'public, max-age=300, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('[/api/places/resolve] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
