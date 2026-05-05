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

  // 1. Check resolution cache (skipped when force=true)
  if (!req.force) {
    const resolution = await getResolution(queryText, cityContext);
    if (resolution?.googlePlaceId) {
      const cached = await getCachedPlace(resolution.googlePlaceId);
      if (cached) {
        // Return even if expired (stale-while-revalidate).
        // Background refresh can be added later if needed.
        return {
          place: cached,
          primaryPhotoUrl:
            (cached.metadata.unsplashPhotoUrl as string | undefined) ??
            (cached.photoCount > 0 ? buildPhotoProxyUrl(cached.googlePlaceId, 0) : null),
          source: 'cache',
        };
      }
    }
  }

  // 2. Cache miss (or force bypass): call Google Places Text Search (New)
  const bias: LocationBias = { lat: req.lat, lng: req.lng, regionCode: req.regionCode };
  // Enriching the query with the city name dramatically improves disambiguation
  // for shared place names that appear in multiple countries (e.g. "Igreja de Sao
  // Francisco" in both Brazil and Mexico).
  const enrichedQuery = enrichQueryWithCity(req.query, req.cityContext);

  let googleResult = await searchGooglePlaces(enrichedQuery, bias);

  if (googleResult) {
    const countryOk = validateCountryMatch(
      googleResult.formattedAddress,
      req.regionCode,
      req.cityContext
    );
    if (!countryOk) {
      console.warn(
        '[PlaceResolver] Wrong country match for',
        req.query,
        '— got',
        googleResult.formattedAddress,
        '— expected region:',
        req.regionCode ?? req.cityContext
      );
      // Retry with a hard bounding rectangle to force results inside the destination area
      const retryResult = await searchGooglePlacesStrict(enrichedQuery, bias);
      if (retryResult && validateCountryMatch(retryResult.formattedAddress, req.regionCode, req.cityContext)) {
        googleResult = retryResult;
      } else {
        // Both attempts returned wrong-country results. No card > wrong-country card.
        return { place: null, primaryPhotoUrl: null, source: 'not_found' };
      }
    }
  }

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

  // 4a. For destinations, augment metadata with an Unsplash travel photo
  if (entityType === 'destination') {
    const rawName = googleResult.displayName;
    const destName = typeof rawName === 'object' && rawName !== null
      ? (rawName.text ?? '')
      : (typeof rawName === 'string' ? rawName : req.query);
    const unsplashData = await fetchUnsplashDestinationPhoto(destName || req.query);
    if (unsplashData) {
      metadata.unsplashPhotoUrl = unsplashData.photoUrl;
      metadata.unsplashPhotoUrlSmall = unsplashData.photoUrlSmall;
      metadata.unsplashAuthorName = unsplashData.authorName;
      metadata.unsplashAuthorUrl = unsplashData.authorUrl;
      metadata.unsplashPhotoPage = unsplashData.photoPage;
      metadata.unsplashDownloadLocation = unsplashData.downloadLocation;
    }
  }

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
    // On a force-correction, also remap the ORIGINAL activity text so future
    // hovers on the same text resolve to the corrected place automatically.
    if (req.force && req.originalQuery) {
      const originalText = normaliseQuery(req.originalQuery);
      if (originalText && originalText !== queryText) {
        await upsertResolution(originalText, cityContext, place.googlePlaceId);
      }
    }
  }

  return {
    place,
    primaryPhotoUrl: place
      ? ((place.metadata.unsplashPhotoUrl as string | undefined) ??
         (place.photoCount > 0 ? buildPhotoProxyUrl(place.googlePlaceId, 0) : null))
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
      console.error(
        '[PlaceResolver] Google Text Search failed:',
        res.status,
        await res.text()
      );
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

/**
 * Strict variant of searchGooglePlaces using locationRestriction (hard bounding
 * rectangle) instead of locationBias (preference circle). Called as a fallback
 * when the bias search returns a wrong-country result.
 * Note: locationRestriction and locationBias are mutually exclusive per Google API.
 */
async function searchGooglePlacesStrict(
  query: string,
  bias: LocationBias
): Promise<GooglePlaceResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  if (bias.lat == null || bias.lng == null) return null; // restriction requires coordinates

  const delta = 0.25; // ~25km at equator
  const body: Record<string, unknown> = {
    textQuery: query,
    pageSize: 3,
    languageCode: 'en',
    locationRestriction: {
      rectangle: {
        low:  { latitude: bias.lat - delta, longitude: bias.lng - delta },
        high: { latitude: bias.lat + delta, longitude: bias.lng + delta },
      },
    },
  };

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
      console.error('[PlaceResolver] Strict search failed:', res.status, await res.text());
      return null;
    }

    const data = await res.json() as { places?: GooglePlaceResult[] };
    return data.places?.[0] ?? null;
  } catch (err) {
    console.error('[PlaceResolver] Strict search error:', err);
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

/**
 * Appends the city name from cityContext to the query for better disambiguation.
 * "Igreja de Sao Francisco" + "Joao Pessoa, Brazil" → "Igreja de Sao Francisco Joao Pessoa"
 * Skips enrichment if the query already contains the city name.
 */
function enrichQueryWithCity(query: string, cityContext: string): string {
  if (!cityContext) return query;
  // Extract city part: everything before the first comma
  const cityPart = cityContext.split(/[,，]/)[0].trim();
  if (!cityPart) return query;
  // Skip if query already mentions the city (case-insensitive)
  if (query.toLowerCase().includes(cityPart.toLowerCase())) return query;
  return `${query} ${cityPart}`;
}

// ISO 3166-1 alpha-2 country code → expected name variants in formatted addresses
const COUNTRY_NAMES: Record<string, string[]> = {
  BR: ['Brazil', 'Brasil'],
  ID: ['Indonesia'],
  AU: ['Australia'],
  JP: ['Japan'],
  TH: ['Thailand'],
  MX: ['Mexico'],
  US: ['United States', 'USA'],
  GB: ['United Kingdom', 'England', 'Scotland', 'Wales'],
  FR: ['France'],
  IT: ['Italy', 'Italia'],
  ES: ['Spain'],
  PT: ['Portugal'],
  DE: ['Germany', 'Deutschland'],
  NZ: ['New Zealand'],
  VN: ['Vietnam', 'Viet Nam'],
  PH: ['Philippines'],
  GR: ['Greece'],
  TR: ['Turkey', 'Türkiye'],
  CO: ['Colombia'],
  AR: ['Argentina'],
  PE: ['Peru'],
  CL: ['Chile'],
  KR: ['South Korea'],
  IN: ['India'],
  NP: ['Nepal'],
  LK: ['Sri Lanka'],
  MY: ['Malaysia'],
  SG: ['Singapore'],
  HK: ['Hong Kong'],
  TW: ['Taiwan'],
  CN: ['China'],
  AE: ['United Arab Emirates', 'UAE'],
  MA: ['Morocco'],
  ZA: ['South Africa'],
  KE: ['Kenya'],
  TZ: ['Tanzania'],
  EG: ['Egypt'],
  HR: ['Croatia'],
  CZ: ['Czech Republic', 'Czechia'],
  AT: ['Austria'],
  CH: ['Switzerland'],
  NL: ['Netherlands'],
  BE: ['Belgium'],
  SE: ['Sweden'],
  NO: ['Norway'],
  DK: ['Denmark'],
  FI: ['Finland'],
  PL: ['Poland'],
  HU: ['Hungary'],
  RO: ['Romania'],
  IE: ['Ireland'],
  IS: ['Iceland'],
};

/**
 * Returns true when the formattedAddress appears to be in the expected country.
 * Optimistically returns true when validation cannot be performed (no address, no country info).
 * A false return signals a clear wrong-country mismatch that should trigger a retry.
 */
function validateCountryMatch(
  formattedAddress: string | null | undefined,
  regionCode: string | undefined,
  cityContext: string
): boolean {
  if (!formattedAddress) return true; // cannot validate, accept optimistically

  const addressLower = formattedAddress.toLowerCase();

  if (regionCode) {
    const expectedNames = COUNTRY_NAMES[regionCode.toUpperCase()];
    if (expectedNames) {
      return expectedNames.some(name => addressLower.includes(name.toLowerCase()));
    }
  }

  // Fallback: extract country hint from cityContext (e.g. "Joao Pessoa, Brazil" → "Brazil")
  const parts = cityContext.split(/[,，]/);
  if (parts.length >= 2) {
    const countryHint = parts[parts.length - 1].trim().toLowerCase();
    if (countryHint.length > 2) {
      return addressLower.includes(countryHint);
    }
  }

  return true; // cannot validate, accept optimistically
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

// ---------------------------------------------------------------------------
// Unsplash destination photo fetcher
// ---------------------------------------------------------------------------

interface UnsplashPhotoData {
  photoUrl: string;
  photoUrlSmall: string;
  authorName: string;
  authorUrl: string;
  photoPage: string;
  downloadLocation: string;
}

async function fetchUnsplashDestinationPhoto(
  destinationName: string
): Promise<UnsplashPhotoData | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) {
    console.warn('[PlaceResolver] UNSPLASH_ACCESS_KEY not set, skipping Unsplash');
    return null;
  }

  try {
    const query = encodeURIComponent(`${destinationName} travel`);
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&orientation=landscape&per_page=1&content_filter=high`,
      {
        headers: { Authorization: `Client-ID ${apiKey}` },
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!res.ok) {
      console.error('[PlaceResolver] Unsplash search failed:', res.status);
      return null;
    }

    const data = await res.json() as { results?: Record<string, unknown>[] };
    const photo = data.results?.[0] as Record<string, unknown> | undefined;
    if (!photo) return null;

    const utmParams = '?utm_source=lunaletsgo&utm_medium=referral';
    const urls = photo.urls as Record<string, string>;
    const links = photo.links as Record<string, string>;
    const user = photo.user as { name: string; links: { html: string } };

    // Fire download_location ping required by Unsplash ToS — fire and forget
    fetch(links.download_location, {
      headers: { Authorization: `Client-ID ${apiKey}` },
    }).catch(() => {});

    return {
      photoUrl: urls.regular,
      photoUrlSmall: urls.small,
      authorName: user.name,
      authorUrl: `${user.links.html}${utmParams}`,
      photoPage: `${links.html}${utmParams}`,
      downloadLocation: links.download_location,
    };
  } catch (err) {
    console.error('[PlaceResolver] Unsplash fetch error:', err);
    return null;
  }
}

// ---------------------------------------------------------------------------

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
