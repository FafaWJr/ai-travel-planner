// app/api/memories/geocode/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { batchReverseGeocode } from '@/lib/memories/geocode';
import type { GeoCoordinate } from '@/lib/memories/geocode-types';

export const maxDuration = 60; // 50 coords × 1.1s worst-case (all uncached)

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { coordinates?: GeoCoordinate[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const coords = body.coordinates;
  if (!Array.isArray(coords) || coords.length === 0) {
    return NextResponse.json({ error: 'coordinates array required' }, { status: 400 });
  }

  if (coords.length > 50) {
    return NextResponse.json({ error: 'Maximum 50 coordinates per request' }, { status: 400 });
  }

  for (const c of coords) {
    if (typeof c.lat !== 'number' || typeof c.lng !== 'number') {
      return NextResponse.json(
        { error: 'Each coordinate must have numeric lat and lng' },
        { status: 400 },
      );
    }
    if (c.lat < -90 || c.lat > 90 || c.lng < -180 || c.lng > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of valid range' },
        { status: 400 },
      );
    }
  }

  try {
    const results = await batchReverseGeocode(coords);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('[geocode] Batch geocode error:', err);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}
