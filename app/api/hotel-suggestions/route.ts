import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';
import { createClient } from '@/lib/supabase/server';
import { collectStream as collectText } from '@/lib/stream-utils';
import {
  upsertCachedPlace,
  persistPhotoMetadata,
  upsertResolution,
} from '@/lib/places/cache';

// Stage 2c audit: deliberately NOT role-gated. Hotel suggestions are
// informational; viewers may want to see and discuss them. Mutation
// (Accept) happens client-side and the resulting trip mutation goes
// through Stage 2d's patch system which DOES role-gate.

export const maxDuration = 60;

// ─── Field mask (Enterprise tier — same as lib/places/resolver.ts) ──────────
const HOTEL_FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.location', 'places.types', 'places.primaryType',
  'places.photos', 'places.rating', 'places.userRatingCount',
  'places.priceLevel', 'places.editorialSummary', 'places.googleMapsUri',
].join(',');

// Booking.com affiliate base — includes campaign param from lib/affiliate.ts
const BOOKING_BASE =
  'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countDays(itineraryText: string): number {
  const nums = (itineraryText.match(/\bday\s*\d+/gi) ?? [])
    .map(m => parseInt(m.replace(/\D/g, ''), 10))
    .filter(Boolean);
  return nums.length > 0 ? Math.max(...nums) : 1;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Segment {
  location: string;
  label: string;
  checkIn: string;
  checkOut: string;
  dayRange: [number, number];
}

// Must match StayTab's Hotel interface exactly
interface Hotel {
  id: string;
  name: string;
  stars: number;
  description: string;
  priceRange: string;
  neighborhood: string;
  amenities: string[];
  googleMapsQuery: string;
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

// ─── Phase 1: detect overnight location segments ──────────────────────────────

async function detectSegments(
  itineraryText: string,
  checkIn: string,
  checkOut: string,
): Promise<Segment[]> {
  const stream = await streamCompletion(
    [
      {
        role: 'system',
        content: 'You are a travel itinerary parser. Output ONLY valid JSON. No markdown.',
      },
      {
        role: 'user',
        content:
          `Identify every distinct overnight stay location in this itinerary.\n` +
          `Trip dates: ${checkIn || 'unknown'} → ${checkOut || 'unknown'}\n\n` +
          `${itineraryText}\n\n` +
          `RULES:\n` +
          `- Only include cities/areas where the traveller actually sleeps overnight.\n` +
          `- Day trips and excursions do NOT create a new segment — only overnight stops.\n` +
          `- A new segment starts when the traveller moves to a different city to sleep.\n\n` +
          `Return ONLY this JSON (no extra text):\n` +
          `{"segments":[{"location":"city name","label":"City — Days X–Y","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","dayRange":[1,3]}]}`,
      },
    ],
    'hotelSuggestions'
  );

  const raw = await collectText(stream);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed.segments) ? parsed.segments : [];
  } catch {
    return [];
  }
}

// ─── Phase 2: Google Places hotel discovery ───────────────────────────────────

function getDisplayName(raw: { text?: string } | string | undefined): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  return raw.text ?? '';
}

// Check that the result's formattedAddress plausibly contains the expected location.
// Optimistically returns true when validation cannot be performed.
function isCorrectLocation(
  formattedAddress: string | undefined,
  location: string
): boolean {
  if (!formattedAddress) return true;
  const addr = formattedAddress.toLowerCase();
  // Extract significant words (>3 chars) from the location string
  const words = location.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
  return words.length === 0 || words.some(w => addr.includes(w));
}

async function searchGoogleHotels(textQuery: string): Promise<GooglePlaceResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': HOTEL_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery,
          includedType: 'lodging',
          maxResultCount: 10,
          languageCode: 'en',
          rankPreference: 'RELEVANCE',
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.error('[hotel-suggestions] Google Places failed:', res.status);
      return [];
    }

    const data = await res.json() as { places?: GooglePlaceResult[] };
    return data.places ?? [];
  } catch (err) {
    console.error('[hotel-suggestions] Google Places error:', err);
    return [];
  }
}

async function discoverHotelsForSegment(
  segment: Segment,
  budget: string,
  filters: string[],
  excludeNames: string[],
): Promise<GooglePlaceResult[]> {
  const loc = segment.location;

  // Primary query based on budget level
  let primaryQuery: string;
  if (
    budget === 'luxury' || budget === 'premium' ||
    filters.includes('luxury') || filters.includes('luxurious')
  ) {
    primaryQuery = `luxury hotels in ${loc}`;
  } else if (
    budget === 'budget' || budget === 'economy' ||
    filters.includes('cheaper') || filters.includes('cheaper')
  ) {
    primaryQuery = `budget hotels in ${loc}`;
  } else {
    primaryQuery = `best hotels in ${loc}`;
  }

  // Secondary query for variety (boutique/highly-rated alternatives)
  const secondaryQuery = `boutique hotels in ${loc}`;

  // Run both queries in parallel
  const [primary, secondary] = await Promise.all([
    searchGoogleHotels(primaryQuery),
    searchGoogleHotels(secondaryQuery),
  ]);

  // Merge, deduplicate by place_id, apply location and exclusion filters
  const seen = new Set<string>();
  const merged: GooglePlaceResult[] = [];
  const excludeLower = excludeNames.map(n => n.toLowerCase());

  for (const place of [...primary, ...secondary]) {
    if (seen.has(place.id)) continue;
    const name = getDisplayName(place.displayName);
    if (excludeLower.includes(name.toLowerCase())) continue;
    if (!isCorrectLocation(place.formattedAddress, loc)) continue;
    seen.add(place.id);
    merged.push(place);
  }

  return merged.slice(0, 10);
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function priceLevelToStars(priceLevel: string | null | undefined): number {
  switch (priceLevel) {
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return 5;
    case 'PRICE_LEVEL_EXPENSIVE': return 4;
    case 'PRICE_LEVEL_MODERATE': return 3;
    case 'PRICE_LEVEL_INEXPENSIVE': return 2;
    default: return 3;
  }
}

function priceLevelToRange(priceLevel: string | null | undefined): string {
  switch (priceLevel) {
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return '$$$$';
    case 'PRICE_LEVEL_EXPENSIVE': return '$$$';
    case 'PRICE_LEVEL_MODERATE': return '$$';
    case 'PRICE_LEVEL_INEXPENSIVE': return '$';
    default: return '$$';
  }
}

function priceLevelToNumeric(priceLevel: string | undefined): number | null {
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return map[priceLevel ?? ''] ?? null;
}

// Extract a neighbourhood/area label from a formatted address.
// Skips purely numeric parts (street numbers, postal codes).
function extractNeighborhood(
  formattedAddress: string | undefined,
  fallback: string
): string {
  if (!formattedAddress) return fallback;
  const parts = formattedAddress.split(',').map(p => p.trim()).filter(Boolean);
  const meaningful = parts.filter(p => !/^\d[\d\s-]*$/.test(p) && !/^\d{4,}/.test(p));
  // First meaningful part is usually the street; second is the neighbourhood/suburb
  if (meaningful.length >= 2) return meaningful[1];
  if (meaningful.length >= 1) return meaningful[0];
  return fallback;
}

// Build a Booking.com search URL with hotel + city search and optional dates,
// used for the cached_places metadata so the Place Preview card also has a link.
function buildBookingCacheUrl(
  hotelName: string,
  city: string,
  checkin?: string,
  checkout?: string
): string {
  const ss = encodeURIComponent(`${hotelName} ${city}`);
  let url = `${BOOKING_BASE}https%3A%2F%2Fwww.booking.com%2Fsearchresults.html%3Fss%3D${ss}`;
  if (checkin && checkout) {
    url += `%26checkin%3D${checkin}%26checkout%3D${checkout}`;
  }
  return url;
}

// ─── Phase 3: AI enrichment (personalised descriptions) ───────────────────────

async function enrichHotelsWithAI(
  hotels: GooglePlaceResult[],
  segment: Segment,
  tripPrompt: string,
  budget: string,
): Promise<Map<string, { description: string; amenities: string[] }>> {
  if (hotels.length === 0) return new Map();

  const hotelList = hotels.map((h, i) => {
    const name = getDisplayName(h.displayName);
    const rating = h.rating
      ? `${h.rating}/5 (${h.userRatingCount ?? 0} reviews)`
      : 'no public rating';
    const editorial = h.editorialSummary?.text ?? '';
    return `${i + 1}. ${name} — ${rating}${editorial ? ` — "${editorial}"` : ''}`;
  }).join('\n');

  const prompt =
    `Trip context: ${tripPrompt}\n` +
    `Location: ${segment.location} (${segment.label})\n` +
    `Dates: ${segment.checkIn || 'unknown'} → ${segment.checkOut || 'unknown'}\n` +
    `Budget: ${budget}\n\n` +
    `For each real hotel listed, write:\n` +
    `1. A 2-sentence description explaining why it suits THIS traveller specifically.\n` +
    `2. 3-4 amenities likely offered based on the hotel's price tier and type.\n\n` +
    `Hotels:\n${hotelList}\n\n` +
    `Return ONLY valid JSON array (no markdown):\n` +
    `[{"hotelName":"exact name from list","description":"2 sentences","amenities":["WiFi","Pool","Breakfast"]}]`;

  try {
    const stream = await streamCompletion(
      [
        {
          role: 'system',
          content: 'You are a travel expert. Respond ONLY with a valid JSON array. No markdown code fences.',
        },
        { role: 'user', content: prompt },
      ],
      'hotelSuggestions'
    );

    const raw = await collectText(stream);
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return new Map();

    const parsed = JSON.parse(match[0]) as Array<{
      hotelName: string;
      description: string;
      amenities: string[];
    }>;
    const result = new Map<string, { description: string; amenities: string[] }>();
    for (const item of parsed) {
      if (item.hotelName) {
        result.set(item.hotelName.toLowerCase(), {
          description: item.description ?? '',
          amenities: Array.isArray(item.amenities) ? item.amenities : [],
        });
      }
    }
    return result;
  } catch {
    return new Map();
  }
}

// ─── AI fallback (original pipeline, used when Google Places is unavailable) ──

async function hotelsForSegmentAI(
  segment: Segment,
  tripPrompt: string,
  budget: string,
  excludeNames: string[],
  filters: string[],
): Promise<Segment & { hotels: Hotel[] }> {
  const excludeNote = excludeNames.length
    ? `\nDo NOT suggest any of these (already shown): ${excludeNames.join(', ')}.`
    : '';
  const filtersNote = filters.length
    ? `\nRequired filters: ${filters.join(', ')}.`
    : '';

  const prompt =
    `Trip context: ${tripPrompt}\n` +
    `Location: ${segment.location} (${segment.label})\n` +
    `Dates: ${segment.checkIn || 'unknown'} → ${segment.checkOut || 'unknown'}\n` +
    `Budget level: ${budget}${filtersNote}${excludeNote}\n\n` +
    `Suggest exactly 5 real, well-known hotels located in ${segment.location}, covering a range of price tiers:\n` +
    `- 1-2 budget options (~$80-150/night)\n` +
    `- 2 mid-range options (~$150-300/night)\n` +
    `- 1-2 premium/luxury options ($300+/night)\n\n` +
    `Return ONLY valid JSON (no markdown, no extra text):\n` +
    `{"hotels":[{"id":"unique-slug","name":"Full Hotel Name","stars":4,` +
    `"description":"2 sentences: why this hotel fits THIS traveller","priceRange":"~$150/night",` +
    `"neighborhood":"area name","amenities":["Pool","Free WiFi"],"googleMapsQuery":"Hotel Name City Country"}]}`;

  try {
    const stream = await streamCompletion(
      [
        {
          role: 'system',
          content: 'You are a luxury travel concierge AI. Respond ONLY with valid JSON. No markdown code fences.',
        },
        { role: 'user', content: prompt },
      ],
      'hotelSuggestions'
    );

    const raw = await collectText(stream);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { ...segment, hotels: [] };

    const parsed = JSON.parse(match[0]);
    const hotels = Array.isArray(parsed.hotels) ? parsed.hotels : [];
    return { ...segment, hotels };
  } catch {
    return { ...segment, hotels: [] };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      prompt = '',
      destination = '',
      checkIn = '',
      checkOut = '',
      budget = 'comfortable',
      excludeNames = [] as string[],
      filters = [] as string[],
      itineraryText = '',
    } = await request.json();

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

    // Phase 1: identify all overnight location segments from the itinerary.
    const days = countDays(itineraryText);
    const rawSegments = itineraryText
      ? await detectSegments(itineraryText, checkIn, checkOut)
      : [];

    const segments: Segment[] = rawSegments.length > 0
      ? rawSegments
      : [{ location: destination, label: destination, checkIn, checkOut, dayRange: [1, days] }];

    // If Google Places API key is not configured, fall back to AI-only pipeline.
    if (!googleApiKey) {
      console.warn('[hotel-suggestions] GOOGLE_PLACES_API_KEY not set, using AI fallback');
      const segmentsAI = await Promise.all(
        segments.map(seg => hotelsForSegmentAI(seg, prompt, budget, excludeNames, filters))
      );
      const hasAnyAI = segmentsAI.some(s => s.hotels.length > 0);
      if (!hasAnyAI) {
        throw new Error('No hotel suggestions could be generated. Please try again.');
      }
      return Response.json({ segments: segmentsAI });
    }

    // Phase 2 + 3: Google Places discovery + AI enrichment, per segment in parallel.
    const segmentsWithHotels = await Promise.all(
      segments.map(async (seg) => {
        // 2a. Discover real hotels via Google Places Text Search
        const googleHotels = await discoverHotelsForSegment(seg, budget, filters, excludeNames);

        // If Google returns nothing for this segment, fall back to AI for this segment only
        if (googleHotels.length === 0) {
          console.warn('[hotel-suggestions] No Google results for segment:', seg.location, '— using AI fallback');
          return hotelsForSegmentAI(seg, prompt, budget, excludeNames, filters);
        }

        // 2b. Persist each discovered hotel to the Place Preview cache.
        // This ensures StayTab photo resolution is a guaranteed cache hit.
        const destinationNorm = destination
          .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

        await Promise.all(googleHotels.map(async (h) => {
          const name = getDisplayName(h.displayName);
          if (!name) return;
          try {
            await upsertCachedPlace({
              google_place_id: h.id,
              entity_type: 'hotel',
              display_name: name,
              formatted_address: h.formattedAddress ?? null,
              lat: h.location?.latitude ?? 0,
              lng: h.location?.longitude ?? 0,
              primary_type: h.primaryType ?? null,
              types: h.types ?? [],
              rating: h.rating ?? null,
              user_rating_count: h.userRatingCount ?? null,
              price_level: priceLevelToNumeric(h.priceLevel),
              editorial_summary: h.editorialSummary?.text ?? null,
              google_maps_uri: h.googleMapsUri ?? '',
              photo_count: h.photos?.length ?? 0,
              photo_names: (h.photos ?? []).map(p => p.name),
              metadata: {
                bookingAffiliateUrl: buildBookingCacheUrl(name, seg.location, seg.checkIn, seg.checkOut),
              },
              resolved_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });

            if (h.photos?.length) {
              await persistPhotoMetadata(h.id, h.photos);
            }

            // Pre-seed the resolution cache so StayTab's resolve() call is a guaranteed hit
            const queryNorm = name.toLowerCase().trim().replace(/\s+/g, ' ');
            await upsertResolution(queryNorm, destinationNorm, h.id, 90);
          } catch (err) {
            console.error('[hotel-suggestions] cache persist error for', name, err);
          }
        }));

        // 3. AI enrichment: personalised descriptions for the real hotels
        const enrichments = await enrichHotelsWithAI(googleHotels, seg, prompt, budget);

        // 4. Map Google Places data → Hotel interface (must match StayTab exactly)
        const hotels: Hotel[] = googleHotels.map((h) => {
          const name = getDisplayName(h.displayName);
          const enriched = enrichments.get(name.toLowerCase()) ?? {
            description: h.editorialSummary?.text ?? '',
            amenities: [],
          };
          const neighborhood = extractNeighborhood(h.formattedAddress, seg.location);

          return {
            id: h.id, // Google place_id — stable, unique, matches cached_places
            name,
            stars: priceLevelToStars(h.priceLevel),
            description: enriched.description || h.editorialSummary?.text || name,
            priceRange: priceLevelToRange(h.priceLevel),
            neighborhood,
            amenities: enriched.amenities,
            googleMapsQuery: `${name} ${seg.location}`,
          };
        });

        return { ...seg, hotels };
      })
    );

    const hasAny = segmentsWithHotels.some(s => s.hotels.length > 0);
    if (!hasAny) {
      throw new Error('No hotel suggestions could be found. Please try again.');
    }

    return Response.json({ segments: segmentsWithHotels });
  } catch (err: unknown) {
    console.error('[hotel-suggestions] error:', err);
    return Response.json({ error: 'Could not load hotel suggestions. Please try again.' }, { status: 500 });
  }
}
