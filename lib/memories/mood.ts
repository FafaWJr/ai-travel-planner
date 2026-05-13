// lib/memories/mood.ts

/** All available mood options, grouped by category */
export const MOOD_CATEGORIES = [
  {
    key: 'relaxed',
    moods: ['relaxed', 'peaceful', 'recharged'],
  },
  {
    key: 'energetic',
    moods: ['adventurous', 'excited', 'inspired'],
  },
  {
    key: 'emotional',
    moods: ['grateful', 'nostalgic', 'romantic', 'meaningful'],
  },
  {
    key: 'social',
    moods: ['connected', 'celebratory', 'playful'],
  },
  {
    key: 'comfort',
    moods: ['cozy', 'indulgent'],
  },
  {
    key: 'nature',
    moods: ['grounded', 'refreshed'],
  },
] as const;

/** Flat list of all valid mood values */
export const ALL_MOODS = MOOD_CATEGORIES.flatMap(c => c.moods);

/** Maximum moods selectable per day */
export const MAX_MOODS = 4;

/** Migration map: old single-select mood values → new set */
const MOOD_MIGRATION: Record<string, string> = {
  exhausted: 'recharged',
  content: 'peaceful',
  excited: 'excited',
  peaceful: 'peaceful',
  emotional: 'meaningful',
};

/**
 * Normalise mood data from any storage format to string[].
 * Handles: null/undefined → [], string → [migrated], string[] → validated array.
 */
export function normaliseMood(mood: unknown): string[] {
  if (!mood) return [];

  if (typeof mood === 'string') {
    const migrated = MOOD_MIGRATION[mood] ?? mood;
    return (ALL_MOODS as readonly string[]).includes(migrated) ? [migrated] : [];
  }

  if (Array.isArray(mood)) {
    return (mood as unknown[])
      .filter((m): m is string => typeof m === 'string')
      .filter(m => (ALL_MOODS as readonly string[]).includes(m))
      .slice(0, MAX_MOODS);
  }

  return [];
}
