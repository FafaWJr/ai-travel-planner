/**
 * Normalizers for Stage-4 generate tool inputs.
 *
 * The model returns snake_case tool inputs per Anthropic convention. These
 * helpers coerce the raw JSON into well-typed, safe objects so the rest of
 * the frontend never has to guard against missing keys or wrong types.
 */

import type { Phase, DefineDayInput, DefinePhaseInput, EditPhaseInput, SplitPhaseInput, MergePhasesInput, ReorderPhasesInput } from '@/types';
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

// ─── R5: Phase editing normalizers ────────────────────────────────────────────

export function normalizeEditPhaseInput(raw: Record<string, unknown>): EditPhaseInput | null {
  const phase_id = typeof raw.phase_id === 'string' ? raw.phase_id.trim() : '';
  if (!phase_id) return null;
  return {
    phase_id,
    label:      typeof raw.label   === 'string' ? raw.label.trim()   : undefined,
    summary:    typeof raw.summary === 'string' ? raw.summary.trim() : undefined,
    highlights: Array.isArray(raw.highlights)
      ? (raw.highlights as unknown[]).filter(h => typeof h === 'string').map(h => (h as string).trim())
      : undefined,
  };
}

function toHighlights(val: unknown): string[] {
  return Array.isArray(val)
    ? (val as unknown[]).filter(h => typeof h === 'string').map(h => (h as string).trim())
    : [];
}

function toPhaseMetadata(val: unknown): { label: string; summary: string; highlights: string[] } | null {
  if (!val || typeof val !== 'object') return null;
  const v = val as Record<string, unknown>;
  const label   = typeof v.label   === 'string' ? v.label.trim()   : '';
  const summary = typeof v.summary === 'string' ? v.summary.trim() : '';
  if (!label || !summary) return null;
  return { label, summary, highlights: toHighlights(v.highlights) };
}

export function normalizeSplitPhaseInput(raw: Record<string, unknown>): SplitPhaseInput | null {
  const phase_id     = typeof raw.phase_id    === 'string' ? raw.phase_id.trim() : '';
  const split_at_day = typeof raw.split_at_day === 'number' ? raw.split_at_day : null;
  const phase_a      = toPhaseMetadata(raw.phase_a);
  const phase_b      = toPhaseMetadata(raw.phase_b);
  if (!phase_id || split_at_day === null || !phase_a || !phase_b) return null;
  return { phase_id, split_at_day, phase_a, phase_b };
}

export function normalizeMergePhasesInput(raw: Record<string, unknown>): MergePhasesInput | null {
  const phase_id_a   = typeof raw.phase_id_a === 'string' ? raw.phase_id_a.trim() : '';
  const phase_id_b   = typeof raw.phase_id_b === 'string' ? raw.phase_id_b.trim() : '';
  const merged_phase = toPhaseMetadata(raw.merged_phase);
  if (!phase_id_a || !phase_id_b || !merged_phase) return null;
  return { phase_id_a, phase_id_b, merged_phase };
}

export function normalizeReorderPhasesInput(raw: Record<string, unknown>): ReorderPhasesInput | null {
  const ids = raw.ordered_phase_ids;
  if (!Array.isArray(ids) || ids.length === 0) return null;
  const ordered_phase_ids = (ids as unknown[]).filter(id => typeof id === 'string').map(id => (id as string).trim());
  if (ordered_phase_ids.length === 0) return null;
  return { ordered_phase_ids };
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
