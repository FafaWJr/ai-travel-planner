// lib/places/types.ts
// Type definitions for the Luna Place Preview system.
// All place preview components and services import from here.

export type EntityType = 'attraction' | 'restaurant' | 'hotel' | 'destination';

/**
 * A cached place record from the cached_places table.
 * This is the normalised shape used across the resolver, cache, and UI layers.
 */
export interface CachedPlace {
  id: string;
  googlePlaceId: string;
  entityType: EntityType;
  displayName: string;
  formattedAddress: string | null;
  lat: number;
  lng: number;
  primaryType: string | null;
  types: string[];
  rating: number | null;
  userRatingCount: number | null;
  priceLevel: number | null;
  editorialSummary: string | null;
  googleMapsUri: string;
  photoCount: number;
  photoNames: string[];
  metadata: PlaceMetadata;
  resolvedAt: string;
  expiresAt: string;
}

/**
 * Type-specific metadata stored in the JSONB column.
 * Extend per entity type as needed.
 */
export interface PlaceMetadata {
  /** Hotel-specific: Booking.com affiliate URL */
  bookingAffiliateUrl?: string;
  /** Restaurant-specific: cuisine types */
  cuisines?: string[];
  /** Attraction-specific: category label */
  category?: string;
  /** Destination-specific: iconic landmarks for hero selection */
  iconicLandmarks?: string[];
  /** Any additional fields from Google not captured in top-level columns */
  [key: string]: unknown;
}

/**
 * A resolution record mapping query text to a place_id.
 */
export interface PlaceResolution {
  id: string;
  queryText: string;
  cityContext: string;
  googlePlaceId: string | null;
  confidence: number;
  resolvedAt: string;
}

/**
 * Photo metadata record from cached_place_photos.
 */
export interface CachedPlacePhoto {
  id: string;
  googlePlaceId: string;
  photoIndex: number;
  googlePhotoName: string;
  widthPx: number | null;
  heightPx: number | null;
  storagePath: string | null;
  authorName: string | null;
  authorUri: string | null;
  fetchedAt: string;
  expiresAt: string;
}

/**
 * Input to the place resolver.
 */
export interface ResolveRequest {
  /** The AI-generated place name, e.g. "Savaya Bali" */
  query: string;
  /** Trip destination context, e.g. "Bali, Indonesia" */
  cityContext: string;
  /** Trip destination latitude for location bias */
  lat?: number;
  /** Trip destination longitude for location bias */
  lng?: number;
  /** ISO 3166-1 alpha-2 region code, e.g. "ID" for Indonesia */
  regionCode?: string;
}

/**
 * Output from the place resolver, returned to the frontend.
 */
export interface ResolveResponse {
  /** The resolved place data, or null if not found */
  place: CachedPlace | null;
  /** URL to the photo proxy for the primary photo, or null */
  primaryPhotoUrl: string | null;
  /** Where the data came from */
  source: 'cache' | 'google' | 'not_found';
}

/**
 * Utility: maps a Supabase row (snake_case) to a CachedPlace (camelCase).
 */
export function mapRowToCachedPlace(row: Record<string, unknown>): CachedPlace {
  return {
    id: row.id as string,
    googlePlaceId: row.google_place_id as string,
    entityType: row.entity_type as EntityType,
    displayName: row.display_name as string,
    formattedAddress: (row.formatted_address as string) ?? null,
    lat: row.lat as number,
    lng: row.lng as number,
    primaryType: (row.primary_type as string) ?? null,
    types: (row.types as string[]) ?? [],
    rating: row.rating != null ? Number(row.rating) : null,
    userRatingCount: (row.user_rating_count as number) ?? null,
    priceLevel: (row.price_level as number) ?? null,
    editorialSummary: (row.editorial_summary as string) ?? null,
    googleMapsUri: (row.google_maps_uri as string) ?? '',
    photoCount: (row.photo_count as number) ?? 0,
    photoNames: (row.photo_names as string[]) ?? [],
    metadata: (row.metadata as PlaceMetadata) ?? {},
    resolvedAt: row.resolved_at as string,
    expiresAt: row.expires_at as string,
  };
}

/**
 * Utility: maps a Supabase row to a CachedPlacePhoto.
 */
export function mapRowToPhoto(row: Record<string, unknown>): CachedPlacePhoto {
  return {
    id: row.id as string,
    googlePlaceId: row.google_place_id as string,
    photoIndex: row.photo_index as number,
    googlePhotoName: row.google_photo_name as string,
    widthPx: (row.width_px as number) ?? null,
    heightPx: (row.height_px as number) ?? null,
    storagePath: (row.storage_path as string) ?? null,
    authorName: (row.author_name as string) ?? null,
    authorUri: (row.author_uri as string) ?? null,
    fetchedAt: row.fetched_at as string,
    expiresAt: row.expires_at as string,
  };
}
