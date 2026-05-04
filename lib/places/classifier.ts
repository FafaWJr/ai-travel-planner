// lib/places/classifier.ts
// Classifies Google Places results into Luna entity types.

import type { EntityType } from './types';

const HOTEL_TYPES = new Set([
  'lodging', 'hotel', 'motel', 'resort_hotel',
  'bed_and_breakfast', 'extended_stay_hotel',
  'hostel', 'guest_house', 'camping_cabin',
  'farmstay', 'private_guest_room',
]);

const RESTAURANT_TYPES = new Set([
  'restaurant', 'cafe', 'bar', 'bakery', 'coffee_shop',
  'fast_food_restaurant', 'meal_delivery', 'meal_takeaway',
  'american_restaurant', 'barbecue_restaurant', 'brazilian_restaurant',
  'breakfast_restaurant', 'brunch_restaurant', 'chinese_restaurant',
  'french_restaurant', 'greek_restaurant', 'hamburger_restaurant',
  'indian_restaurant', 'indonesian_restaurant', 'italian_restaurant',
  'japanese_restaurant', 'korean_restaurant', 'lebanese_restaurant',
  'mediterranean_restaurant', 'mexican_restaurant', 'middle_eastern_restaurant',
  'pizza_restaurant', 'ramen_restaurant', 'seafood_restaurant',
  'spanish_restaurant', 'steak_house', 'sushi_restaurant',
  'thai_restaurant', 'turkish_restaurant', 'vegan_restaurant',
  'vegetarian_restaurant', 'vietnamese_restaurant',
  'ice_cream_shop', 'juice_shop', 'sandwich_shop',
]);

const DESTINATION_TYPES = new Set([
  'locality', 'political', 'sublocality',
  'administrative_area_level_1', 'administrative_area_level_2',
  'administrative_area_level_3', 'country', 'colloquial_area',
  'natural_feature', 'archipelago',
]);

/**
 * Classify a Google Places result into a Luna entity type.
 * Priority: hotel > restaurant > destination > attraction (default).
 */
export function classifyEntityType(
  primaryType: string | null | undefined,
  types: string[] | null | undefined
): EntityType {
  const safeTypes = types ?? [];

  // Check primaryType first (most reliable signal)
  if (primaryType) {
    if (HOTEL_TYPES.has(primaryType)) return 'hotel';
    if (RESTAURANT_TYPES.has(primaryType)) return 'restaurant';
    if (DESTINATION_TYPES.has(primaryType)) return 'destination';
  }

  // Fall back to scanning the types array
  for (const t of safeTypes) {
    if (HOTEL_TYPES.has(t)) return 'hotel';
  }
  for (const t of safeTypes) {
    if (RESTAURANT_TYPES.has(t)) return 'restaurant';
  }
  for (const t of safeTypes) {
    if (DESTINATION_TYPES.has(t)) return 'destination';
  }

  // Default: attraction (covers tourist_attraction, museum, park, church, etc.)
  return 'attraction';
}
