// lib/places/photo-proxy.ts
// Fetches Google Places photo binaries, caches them in Supabase Storage,
// and returns the public URL. The Google API key never reaches the browser.

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getPhotoMeta, upsertPhotoMeta, getCachedPlace, isExpired } from './cache';

// Valid width buckets. Requests for other widths are snapped to the nearest bucket.
const WIDTH_BUCKETS = [400, 800, 1200, 1600] as const;

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

/**
 * Snap a requested width to the nearest valid bucket.
 * Prevents storage explosion from arbitrary width values.
 */
export function snapToWidthBucket(requestedWidth: number): number {
  let closest: number = WIDTH_BUCKETS[0];
  let minDiff = Math.abs(requestedWidth - closest);
  for (const bucket of WIDTH_BUCKETS) {
    const diff = Math.abs(requestedWidth - bucket);
    if (diff < minDiff) {
      minDiff = diff;
      closest = bucket;
    }
  }
  return closest;
}

export interface PhotoResult {
  /** Public URL to redirect the browser to */
  publicUrl: string;
  /** Photo author name for attribution (may be null) */
  authorName: string | null;
  /** Photo author profile URI for attribution (may be null) */
  authorUri: string | null;
}

/**
 * Get a photo for a place. Returns a public Supabase Storage URL.
 *
 * Flow:
 * 1. Check cached_place_photos for an existing storage_path.
 * 2. If cached and not expired, return the public URL.
 * 3. If miss or expired, fetch from Google Places Photos API.
 * 4. Upload binary to Supabase Storage.
 * 5. Update cached_place_photos with the storage_path.
 * 6. Return the public URL.
 */
export async function getOrFetchPhoto(
  googlePlaceId: string,
  photoIndex: number,
  requestedWidth: number
): Promise<PhotoResult | null> {
  const width = snapToWidthBucket(requestedWidth);
  const storagePath = `${googlePlaceId}/${photoIndex}_w${width}.jpg`;

  // 1. Check photo metadata cache
  const meta = await getPhotoMeta(googlePlaceId, photoIndex);

  // 2. If we have a storage_path and metadata is not expired, return it
  if (meta?.storagePath && !isExpired(meta.expiresAt)) {
    const publicUrl = buildStoragePublicUrl(meta.storagePath);
    return {
      publicUrl,
      authorName: meta.authorName,
      authorUri: meta.authorUri,
    };
  }

  // 3. We need to fetch from Google. Get the photo resource name.
  let photoName = meta?.googlePhotoName ?? null;
  const authorName = meta?.authorName ?? null;
  const authorUri = meta?.authorUri ?? null;

  // If no photo name in the photos table, try the photo_names array on cached_places
  if (!photoName) {
    const place = await getCachedPlace(googlePlaceId);
    if (!place || !place.photoNames || place.photoNames.length <= photoIndex) {
      return null;
    }
    photoName = place.photoNames[photoIndex];
  }

  if (!photoName) return null;

  // 4. Fetch from Google Places Photos API
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('[PhotoProxy] GOOGLE_PLACES_API_KEY not set');
    return null;
  }

  let photoUri: string;
  try {
    const googleRes = await fetch(
      `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${width}&skipHttpRedirect=true`,
      {
        headers: { 'X-Goog-Api-Key': apiKey },
      }
    );

    if (!googleRes.ok) {
      const errorText = await googleRes.text();
      console.error(
        '[PhotoProxy] Google photo fetch failed:',
        googleRes.status,
        errorText
      );
      if (googleRes.status === 400) {
        console.warn(
          '[PhotoProxy] Photo name may have expired for',
          googlePlaceId,
          'index',
          photoIndex
        );
      }
      return null;
    }

    const photoData = await googleRes.json() as { photoUri?: string };
    photoUri = photoData.photoUri ?? '';

    if (!photoUri) {
      console.error('[PhotoProxy] No photoUri in Google response');
      return null;
    }
  } catch (err) {
    console.error('[PhotoProxy] Google photo API error:', err);
    return null;
  }

  // 5. Fetch the actual image binary from the photoUri
  let imageBuffer: ArrayBuffer;
  let contentType = 'image/jpeg';
  try {
    const imageRes = await fetch(photoUri);
    if (!imageRes.ok) {
      console.error('[PhotoProxy] Failed to fetch image binary:', imageRes.status);
      return null;
    }
    contentType = imageRes.headers.get('content-type') ?? 'image/jpeg';
    imageBuffer = await imageRes.arrayBuffer();
  } catch (err) {
    console.error('[PhotoProxy] Image binary fetch error:', err);
    return null;
  }

  // 6. Upload to Supabase Storage
  const client = getAdminClient();
  try {
    const { error: uploadError } = await client.storage
      .from('place-photos')
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: true,
        cacheControl: '2592000',
      });

    if (uploadError) {
      console.error('[PhotoProxy] Storage upload error:', uploadError.message);
    }
  } catch (err) {
    console.error('[PhotoProxy] Storage upload exception:', err);
  }

  // 7. Update photo metadata with the storage path
  await upsertPhotoMeta({
    google_place_id: googlePlaceId,
    photo_index: photoIndex,
    google_photo_name: photoName,
    width_px: width,
    storage_path: storagePath,
    author_name: authorName,
    author_uri: authorUri,
    fetched_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const publicUrl = buildStoragePublicUrl(storagePath);
  return { publicUrl, authorName, authorUri };
}

/**
 * Build the public URL for a file in the place-photos bucket.
 */
function buildStoragePublicUrl(storagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/place-photos/${storagePath}`;
}
