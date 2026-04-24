/**
 * Trip entity ID injection helpers.
 *
 * The Collaborative Trips feature requires stable IDs on every commentable
 * entity in trip_data (activities, days, phases, hotels). After the Stage 0a
 * UUID migration (24 April 2026), all existing trips have stable IDs:
 *
 * - Activities: already had IDs in format "d1-a0-fgfj" pre-Collab.
 * - Phases: already had IDs in format "phase-1" pre-Collab.
 * - Hotels: already had IDs in format "hotel-arts-barcelona" pre-Collab.
 * - Days: got UUIDs injected during Stage 0a migration.
 *
 * For NEW trips generated after Collab ships, this file provides server-side
 * UUID injection so every day always has an id field before the trip_data
 * reaches the client or Supabase. Activities, phases, and hotels continue to
 * use their existing ID formats (set by the AI or Stays pipeline).
 *
 * Do NOT modify existing trip_data shapes. This file only ensures new data
 * has IDs where it would otherwise be missing.
 */

export type TripDay = {
  id?: string;
  number: number;
  title?: string;
  activities?: unknown[];
  [key: string]: unknown;
};

export type TripData = {
  itineraryDays?: TripDay[];
  itineraryPhases?: unknown[];
  acceptedHotels?: unknown[];
  [key: string]: unknown;
};

/**
 * Generate a UUIDv4 string using the crypto Web API (available in Node 20+
 * and all Edge runtimes). Safe for server-side use in Next.js API routes.
 */
export function generateEntityId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  throw new Error(
    'crypto.randomUUID is required for entity ID generation. ' +
    'Upgrade the Node runtime or polyfill crypto.'
  );
}

/**
 * Injects a new UUID into every day of itineraryDays that does not already
 * have an id. Idempotent: days with an existing id are untouched.
 *
 * Returns a new TripData object; does not mutate the input.
 *
 * Use at the boundaries where new trip_data is produced:
 * - After /api/generate composes the itinerary but before returning.
 * - After /api/chat produces an add_activity or add_phase mutation.
 */
export function injectMissingDayIds(tripData: TripData): TripData {
  if (!Array.isArray(tripData.itineraryDays)) return tripData;

  const nextDays = tripData.itineraryDays.map((day) => {
    if (day && typeof day === 'object' && !day.id) {
      return { ...day, id: generateEntityId() };
    }
    return day;
  });

  return { ...tripData, itineraryDays: nextDays };
}

/**
 * Guard against trip_data being malformed. Returns true only if tripData
 * has the minimum shape we expect: an object with itineraryDays as an array.
 * Useful for defensive checks before applying patches in collaborative mode.
 */
export function isValidTripData(tripData: unknown): tripData is TripData {
  if (!tripData || typeof tripData !== 'object') return false;
  const td = tripData as TripData;
  return td.itineraryDays === undefined || Array.isArray(td.itineraryDays);
}
