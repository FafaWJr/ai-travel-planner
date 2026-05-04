// lib/places/resolver.ts
// Core place resolution service for Luna Place Preview.
// Converts AI-generated place names into cached Google Places data.

import type {
  ResolveRequest,
  ResolveResponse,
  CachedPlace,
  EntityType,
} from './types';
import { classifyEntityType } from './classifier';
import {
  getResolution,
  upsertResolution,
  getCachedPlace,
  upsertCachedPlace,
  persistPhotoMetadata,
} from './cache';

// ---------------------------------------------------------------------------
// Field mask: controls which Google Places fields we request.
// This mask triggers Enterprise tier ($20/1K) because of rating + userRatingCount.
// Do NOT add: reviews, generativeSummary, currentOpeningHours, websiteUri,
// internationalPhoneNumber. Those push to Enterprise + Atmosphere ($25/1K).
// ---------------------------------------------------------------------------
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.types',
  'places.primaryType',
  'places.photos',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.editorialSummary',
  'places.googleMapsUri',
].join(',');

// Booking.com affiliate base URL (Luna existing pattern)
const BOOKING_AFFILIATE_BASE =
  'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&ued=';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function resolvePlace(
  req: ResolveRequest
): Promise<ResolveResponse> {
  const queryText = normaliseQuery(req.query);
  const cityContext = normaliseCityContext(req.cityContext);

  if (!queryText || queryText.length < 2) {
    return { place: null, primaryPhotoUrl: null, source: 'not_found' };
  }

  // 1. Check resolution cache (permanent mapping)
  const resolution = await getResolution(queryText, cityContext);
  if (resolution?.googlePlaceId) {
    const cached = await getCachedPlace(resolution.googlePlaceId);
    if (cached) {
      // Return even if expired (stale-while-revalidate).
      // Background refresh can be added later if needed.
      return {
        place: cached,
        primaryPhotoUrl: cached.photoCount > 0
          ? buildPhotoProxyUrl(cached.googlePlaceId, 0)
          : null,
        source: 'cache',
      };
    }
  }

  // 2. Cache miss: call Google Places Text Search (New)
  const googleResult = await searchGooglePlaces(req.query, {
    lat: req.lat,
    lng: req.lng,
    regionCode: req.regionCode,
  });

  if (!googleResult) {
    return { place: null, primaryPhotoUrl: null, source: 'not_found' };
  }

  // 3. Classify entity type
  const entityType = classifyEntityType(
    googleResult.primaryType ?? null,
    googleResult.types ?? null
  );

  // 4. Build metadata
  const metadata = buildMetadata(googleResult, entityType);

  // 5. Resolve displayName — Google returns either { text, languageCode } or a plain string
  const rawName = googleResult.displayName;
  const displayName = typeof rawName === 'object' && rawName !== null
    ? (rawName.text ?? '')
    : (rawName ?? '');

  // 5. Persist to cached_places
  const place = await upsertCachedPlace({
    google_place_id: googleResult.id,
    entity_type: entityType,
    display_name: displayName,
    formatted_address: googleResult.formattedAddress ?? null,
    lat: googleResult.location?.latitude ?? 0,
    lng: googleResult.location?.longitude ?? 0,
    primary_type: googleResult.primaryType ?? null,
    types: googleResult.types ?? [],
    rating: googleResult.rating ?? null,
    user_rating_count: googleResult.userRatingCount ?? null,
    price_level: mapPriceLevel(googleResult.priceLevel),
    editorial_summary: googleResult.editorialSummary?.text ?? null,
    google_maps_uri: googleResult.googleMapsUri ?? '',
    photo_count: googleResult.photos?.length ?? 0,
    photo_names: (googleResult.photos ?? []).map((p) => p.name),
    metadata,
    resolved_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // 6. Persist photo metadata
  if (googleResult.photos?.length) {
    await persistPhotoMetadata(googleResult.id, googleResult.photos);
  }

  // 7. Persist resolution mapping (permanent)
  if (place) {
    await upsertResolution(queryText, cityContext, place.googlePlaceId);
  }

  return {
    place,
    primaryPhotoUrl:
      place && place.photoCount > 0
        ? buildPhotoProxyUrl(place.googlePlaceId, 0)
        : null,
    source: 'google',
  };
}

// ---------------------------------------------------------------------------
// Google Places Text Search (New)
// ---------------------------------------------------------------------------

interface LocationBias {
  lat?: number;
  lng?: number;
  regionCode?: string;
}

interface GooglePlaceResult {
  id: string;
  displayName?: { text?: string } | string;
  formattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  types?: string[];
  primaryType?: string;
  photos?: Array<{
    name: string;
    widthPx?: number;
    heightPx?: number;
    authorAttributions?: Array<{ displayName: string; uri: string }>;
  }>;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  editorialSummary?: { text?: string };
  googleMapsUri?: string;
}

async function searchGooglePlaces(
  query: string,
  bias: LocationBias
): Promise<GooglePlaceResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error('[PlaceResolver] GOOGLE_PLACES_API_KEY not set');
    return null;
  }

  const body: Record<string, unknown> = {
    textQuery: query,
    pageSize: 3,
    languageCode: 'en',
  };

  if (bias.lat != null && bias.lng != null) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: 30000,
      },
    };
  }

  if (bias.regionCode) {
    body.regionCode = bias.regionCode;
  }

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': FIELD_MASK,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[PlaceResolver] HTTP${res.status} ${errBody.slice(0, 200)}`);
      return null;
    }

    const data = await res.json() as { places?: GooglePlaceResult[] };
    const places = data.places;

    if (!places || places.length === 0) {
      return null;
    }

    // Take the first result (Google ranks by relevance to query + bias)
    return places[0];
  } catch (err) {
    console.error('[PlaceResolver] Google Text Search error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normaliseCityContext(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

function buildPhotoProxyUrl(placeId: string, index: number): string {
  return `/api/places/photo/${encodeURIComponent(placeId)}/${index}?w=800`;
}

function mapPriceLevel(
  priceLevel: unknown
): number | null {
  if (!priceLevel || typeof priceLevel !== 'string') return null;
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return map[priceLevel] ?? null;
}

function buildMetadata(
  result: GooglePlaceResult,
  entityType: EntityType
): Record<string, unknown> {
  const meta: Record<string, unknown> = {};

  if (entityType === 'hotel') {
    const rawName = result.displayName;
    const hotelName = typeof rawName === 'object' && rawName !== null
      ? (rawName.text ?? '')
      : (rawName ?? '');
    const city = result.formattedAddress ?? '';
    const searchQuery = encodeURIComponent(`${hotelName} ${city}`);
    meta.bookingAffiliateUrl =
      `${BOOKING_AFFILIATE_BASE}https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3D${searchQuery}`;
  }

  if (entityType === 'restaurant') {
    const pt = result.primaryType ?? '';
    if (pt.endsWith('_restaurant') && pt !== 'fast_food_restaurant') {
      const cuisine = pt
        .replace('_restaurant', '')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
      meta.cuisines = [cuisine];
    }
  }

  return meta;
}
