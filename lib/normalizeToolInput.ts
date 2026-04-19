/**
 * Normalizers for Stage-4 generate tool inputs.
 *
 * The model returns snake_case tool inputs per Anthropic convention. These
 * helpers coerce the raw JSON into well-typed, safe objects so the rest of
 * the frontend never has to guard against missing keys or wrong types.
 */

import type { Phase, DefineDayInput, DefinePhaseInput } from '@/types';
import type { Day, Activity, TimeSlot } from '@/components/EditableItinerary';

/**
 * Coerce a raw tool input object to a typed DefinePhaseInput.
 * Returns null if the input is missing required fields.
 */
export function normalizeDefinePhaseInput(
  raw: Record<string, unknown>,
): DefinePhaseInput | null {
  const phase_id = typeof raw.phase_id === 'string' ? raw.phase_id.trim() : '';
  const label    = typeof raw.label    === 'string' ? raw.label.trim()    : '';
  const day_from = typeof raw.day_from === 'number' ? raw.day_from : null;
  const day_to   = typeof raw.day_to   === 'number' ? raw.day_to   : null;
  const summary  = typeof raw.summary  === 'string' ? raw.summary.trim()  : '';
  const highlights = Array.isArray(raw.highlights)
    ? (raw.highlights as unknown[]).filter(h => typeof h === 'string').map(h => (h as string).trim())
    : [];

  if (!phase_id || !label || day_from === null || day_to === null || !summary) return null;

  return { phase_id, label, day_from, day_to, summary, highlights };
}

/**
 * Convert a validated DefinePhaseInput into a Phase object (UI state).
 */
export function definePhaseInputToPhase(input: DefinePhaseInput): Phase {
  return {
    id:         input.phase_id,
    label:      input.label,
    dayFrom:    input.day_from,
    dayTo:      input.day_to,
    summary:    input.summary,
    highlights: input.highlights,
    planned:    false,
  };
}

/**
 * Coerce a raw tool input object to a typed DefineDayInput.
 * Returns null if required fields are missing.
 */
export function normalizeDefineDayInput(
  raw: Record<string, unknown>,
): DefineDayInput | null {
  const day   = typeof raw.day   === 'number' ? raw.day   : null;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';

  if (day === null || !title) return null;

  const toStringArray = (val: unknown): string[] =>
    Array.isArray(val)
      ? (val as unknown[]).filter(v => typeof v === 'string').map(v => (v as string).trim())
      : [];

  return {
    day,
    title,
    morning:   toStringArray(raw.morning),
    afternoon: toStringArray(raw.afternoon),
    evening:   toStringArray(raw.evening),
    night:     toStringArray(raw.night),
    phase_id:  typeof raw.phase_id === 'string' ? raw.phase_id : undefined,
  };
}

/**
 * Convert a validated DefineDayInput into the Day object used by EditableItinerary.
 * Activities start as 'pending' so the user can accept/decline them.
 */
export function defineDayInputToDay(input: DefineDayInput): Day {
  const makeActivities = (texts: string[], slot: TimeSlot): Activity[] =>
    texts.map((text, i) => ({
      id:     `d${input.day}-${slot}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      text,
      status: 'pending' as const,
      slot,
      lunaAdded: false,
      manuallyAdded: false,
    }));

  const activities: Activity[] = [
    ...makeActivities(input.morning,   'morning'),
    ...makeActivities(input.afternoon, 'afternoon'),
    ...makeActivities(input.evening,   'evening'),
    ...makeActivities(input.night,     'night'),
  ];

  return {
    number:      input.day,
    title:       input.title,
    activities,
    open:        input.day === 1,
    suggestions: [],
    loadingMore: false,
    confirmed:   false,
    phase_id:    input.phase_id,
  };
}
