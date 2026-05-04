// lib/places/cache.ts
// Supabase read/write helpers for the Place Preview cache tables.

import { createClient as createServiceClient } from '@supabase/supabase-js';
import {
  type CachedPlace,
  type PlaceResolution,
  type CachedPlacePhoto,
  mapRowToCachedPlace,
  mapRowToPhoto,
} from './types';

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

// ---------------------------------------------------------------------------
// place_resolutions
// ---------------------------------------------------------------------------

export async function getResolution(
  queryText: string,
  cityContext: string
): Promise<PlaceResolution | null> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('place_resolutions')
    .select('*')
    .eq('query_text', queryText)
    .eq('city_context', cityContext)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    queryText: data.query_text,
    cityContext: data.city_context,
    googlePlaceId: data.google_place_id,
    confidence: data.confidence ?? 0,
    resolvedAt: data.resolved_at,
  };
}

export async function upsertResolution(
  queryText: string,
  cityContext: string,
  googlePlaceId: string,
  confidence: number = 80
): Promise<void> {
  const client = getAdminClient();
  await client
    .from('place_resolutions')
    .upsert(
      {
        query_text: queryText,
        city_context: cityContext,
        google_place_id: googlePlaceId,
        confidence,
        resolved_at: new Date().toISOString(),
      },
      { onConflict: 'query_text,city_context' }
    );
}

// ---------------------------------------------------------------------------
// cached_places
// ---------------------------------------------------------------------------

export async function getCachedPlace(
  googlePlaceId: string
): Promise<CachedPlace | null> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('cached_places')
    .select('*')
    .eq('google_place_id', googlePlaceId)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToCachedPlace(data);
}

export async function upsertCachedPlace(
  row: Record<string, unknown>
): Promise<CachedPlace | null> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('cached_places')
    .upsert(row, { onConflict: 'google_place_id' })
    .select()
    .maybeSingle();

  if (error || !data) {
    console.error('[PlaceCache] upsert error:', error?.message);
    return null;
  }
  return mapRowToCachedPlace(data);
}

// ---------------------------------------------------------------------------
// cached_place_photos
// ---------------------------------------------------------------------------

export async function getPhotoMeta(
  googlePlaceId: string,
  photoIndex: number
): Promise<CachedPlacePhoto | null> {
  const client = getAdminClient();
  const { data, error } = await client
    .from('cached_place_photos')
    .select('*')
    .eq('google_place_id', googlePlaceId)
    .eq('photo_index', photoIndex)
    .maybeSingle();

  if (error || !data) return null;
  return mapRowToPhoto(data);
}

export async function upsertPhotoMeta(
  row: Record<string, unknown>
): Promise<void> {
  const client = getAdminClient();
  await client
    .from('cached_place_photos')
    .upsert(row, { onConflict: 'google_place_id,photo_index' });
}

/**
 * Persist photo metadata for all photos returned by Google Places.
 * Called after a fresh Text Search or Place Details response.
 */
export async function persistPhotoMetadata(
  googlePlaceId: string,
  photos: Array<{
    name: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: Array<{ displayName: string; uri: string }>;
  }>
): Promise<void> {
  const client = getAdminClient();
  const rows = photos.slice(0, 10).map((photo, index) => ({
    google_place_id: googlePlaceId,
    photo_index: index,
    google_photo_name: photo.name,
    width_px: photo.widthPx ?? null,
    height_px: photo.heightPx ?? null,
    author_name: photo.authorAttributions?.[0]?.displayName ?? null,
    author_uri: photo.authorAttributions?.[0]?.uri ?? null,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  if (rows.length === 0) return;

  await client
    .from('cached_place_photos')
    .upsert(rows, { onConflict: 'google_place_id,photo_index' });
}

// ---------------------------------------------------------------------------
// Cache expiry check
// ---------------------------------------------------------------------------

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}
