'use client';
import { useState, useId, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import FinalItineraryModal from './FinalItineraryModal';
import DayNotes from './itinerary/DayNotes';
import PhaseCard from './PhaseCard';
import AddPhaseButton from './AddPhaseButton';
import RangeSummaryCard from './RangeSummaryCard';
import type { AcceptedHotel } from './StayTab';
import type { Phase, TripLengthMode } from '@/types';
import { formatSlotHours, type SlotName } from '@/lib/ai';
import type { PatchPayload } from '@/lib/trip-patches';
import type { CommentConfig } from '@/lib/comment-types';
import CommentIcon from './comments/CommentIcon';
import CommentItem from './comments/CommentItem';
import CommentCompose from './comments/CommentCompose';
import { PlacePreviewTrigger, useBatchResolve, useDayViewportObserver, usePostGenerationResolve } from './place-preview';
import { cleanActivityQuery, isResolvableQuery } from '@/lib/places/query-cleaner';

/**
 * Stage 2d hotfix #1: optional trailing parameter on every imperative
 * mutation method that fires onPatchEmit. The realtime hook passes
 * { suppressEmit: true } when applying received patches so the local
 * apply does NOT re-broadcast (which would create a ping-pong loop).
 * User-initiated callers omit the option and emit normally.
 */
export type MutationOptions = {
  suppressEmit?: boolean;
};
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* ─── Types ──────────────────────────────────────────────────── */
export type Status   = 'pending' | 'accepted' | 'declined';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Hydration mode governs whether incoming itineraryMd prop changes should
 * trigger a re-parse that overwrites current days state.
 *
 * - 'parsing-from-stream':   stream is still writing markdown. Re-parse on each update.
 * - 'structured-from-stream': stream is writing structured tool calls. Days are set
 *   incrementally via setStructuredDays(); markdown re-parsing is disabled.
 * - 'hydrated-complete':     stream done, no user edits. Frozen.
 * - 'user-owned':            user or Luna mutated days. Frozen.
 * - 'saved-trip-restored':   initialDays used at mount. Frozen.
 */
type HydrationMode =
  | 'parsing-from-stream'
  | 'structured-from-stream'
  | 'hydrated-complete'
  | 'user-owned'
  | 'saved-trip-restored';

export interface Activity {
  id: string;
  text: string;
  status: Status;
  slot: TimeSlot;
  manuallyAdded?: boolean;
  lunaAdded?: boolean;
}
interface Suggestion {
  id: string;
  title: string;
  description: string;
  timing: string;
}
export interface Day {
  /** Stable UUID injected server-side (Stage 0a migration + Stage 2c
      /api/trips POST/PATCH injection). Optional because days parsed from
      streamed markdown before persistence may not yet have one. */
  id?: string;
  number: number;
  title: string;
  activities: Activity[];
  open: boolean;
  suggestions: Suggestion[];
  loadingMore: boolean;
  confirmed: boolean;
  notes?: string;
  phase_id?: string;
}

const SLOTS: { key: TimeSlot; label: string; icon: string }[] = [
  { key: 'morning',   label: 'Morning',   icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️'  },
  { key: 'evening',   label: 'Evening',   icon: '🌆' },
  { key: 'night',     label: 'Night',     icon: '🌙' },
];

const GRADIENTS = [
  'linear-gradient(135deg,#00447B,#0369A1)',
  'linear-gradient(135deg,#0F4C75,#1B7AB5)',
  'linear-gradient(135deg,#164E63,#0891B2)',
  'linear-gradient(135deg,#1E3A5F,#2563EB)',
  'linear-gradient(135deg,#312E81,#4F46E5)',
  'linear-gradient(135deg,#3B0764,#7C3AED)',
  'linear-gradient(135deg,#4A1942,#BE185D)',
];

/* ─── Day date helper ────────────────────────────────────────── */
function formatDayDate(startDate: string | undefined, dayIndex: number, locale: string = 'en-GB'): string {
  if (!startDate) return '';
  try {
    const d = new Date(startDate);
    if (isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + dayIndex);
    const dl = locale === 'en' ? 'en-GB' : locale;
    const weekday = d.toLocaleDateString(dl, { weekday: 'long' });
    const formatted = d.toLocaleDateString(dl, { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${formatted} ${weekday}`;
  } catch {
    return '';
  }
}

/* ─── Inline markdown ────────────────────────────────────────── */
function inlineMd(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, (_, t) => {
      const isPlace = /^[A-Z]/.test(t) && !t.endsWith(':') &&
        !/^(morning|afternoon|evening|night|day\s*\d|note|tip|option|important|total|budget|price|cost|recommended|optional|estimated|approximate|include)/i.test(t);
      if (isPlace) {
        const esc = t.replace(/"/g, '&quot;');
        return `<strong data-place="${esc}" style="cursor:pointer;border-bottom:1.5px dashed rgba(0,68,123,0.40);color:#00447B;font-weight:700;transition:color 0.15s">${t}</strong>`;
      }
      return `<strong>${t}</strong>`;
    })
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/* ─── Parse slot from text/header ───────────────────────────── */
function detectSlot(text: string): TimeSlot | null {
  // Strip markdown bold/italic/heading markers before matching
  const t = text.replace(/^[\*#\s]+/, '').toLowerCase().trim();
  if (/^morning/i.test(t))   return 'morning';
  if (/^afternoon/i.test(t)) return 'afternoon';
  if (/^evening/i.test(t))   return 'evening';
  if (/^night/i.test(t))     return 'night';
  return null;
}

function stripSlotPrefix(text: string): string {
  return text
    // **Morning**: / **Morning:** / **Morning** — / *Morning* :
    .replace(/^\*{0,2}(Morning|Afternoon|Evening|Night)\*{0,2}\s*[:\-–—]\s*/i, '')
    // plain Morning: / Afternoon — / etc.
    .replace(/^(Morning|Afternoon|Evening|Night)\s*[:\-–—]\s*/i, '')
    .trim();
}

/* ─── Parse itinerary markdown into Day[] ───────────────────── */
function parseItinerary(md: string): Day[] {
  const content = md.replace(/^##[^\n]*\n+/m, '').trim();
  const segments = content.split(/\n(?=(?:###\s*)?(?:\*\*)?Day\s+\d+)/i);
  const days: Day[] = [];

  for (const seg of segments) {
    if (!seg.trim()) continue;
    const headerMatch = seg.match(/^(?:###\s*)?(?:\*\*)?Day\s+(\d+)[:\s–\-–]*([^\n*]*)\*?\*?/i);
    if (!headerMatch) continue;

    const number = parseInt(headerMatch[1], 10);
    const title  = headerMatch[2]?.replace(/\*\*$/, '').trim() || `Day ${number}`;

    const activities: Activity[] = [];
    let currentSlot: TimeSlot = 'morning';

    for (const line of seg.split('\n')) {
      const trimmed = line.trim();

      // Detect slot header lines — not a bullet, contains only the slot word (optionally formatted)
      // Matches: "**Morning:**", "### Afternoon", "Evening:", "Night" alone on a line
      const isSlotHeader =
        !trimmed.startsWith('-') && !trimmed.startsWith('*- ') &&
        /^[\*#\s]*(Morning|Afternoon|Evening|Night)[\*\s:–\-—]*$/i.test(trimmed);

      if (isSlotHeader) {
        const detected = detectSlot(trimmed);
        if (detected) { currentSlot = detected; continue; }
      }

      // Bullet activity
      const m = trimmed.match(/^[-*•]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/);
      if (!m) continue;

      let text = m[1].trim();
      // Strip any inline slot prefix (e.g. "Morning: Visit..." or "**Afternoon** — Lunch")
      const stripped = stripSlotPrefix(text);
      const inlineSlot = stripped !== text ? detectSlot(text) : null;
      if (inlineSlot) {
        currentSlot = inlineSlot;
        text = stripped;
      }

      activities.push({
        id: `d${number}-a${activities.length}-${Math.random().toString(36).slice(2,6)}`,
        text,
        status: 'pending',
        slot: currentSlot,
      });
    }

    // Stage 2f-hotfix-2: every Day MUST have a stable id. Without it, every
    // collab patch type that requires `dayId` in its payload (add_activity,
    // replace_activity, remove_activity, add_note, update_note, remove_note)
    // silently fails its emit guard. The markdown parser previously omitted
    // this field, breaking 5+ patch types simultaneously.
    days.push({
      id: `day-${number}-${Math.random().toString(36).slice(2, 10)}`,
      number,
      title,
      activities,
      open: number === 1,
      suggestions: [],
      loadingMore: false,
      confirmed: false,
    });
  }

  return days;
}

/* ─── Phase range analysis (cascade-aware) ───────────────────── */
type RangeEditEffect =
  | { kind: 'ok-no-cascade' }
  | { kind: 'ok-with-cascade'; neighborId: string; neighborLabel: string; neighborNewFrom: number; neighborNewTo: number; movedDays: number[] }
  | { kind: 'error'; message: string };

function analyzeRangeEdit(
  phases: Phase[],
  editingPhaseId: string,
  from: number,
  to: number,
  tripDays: number,
): RangeEditEffect {
  if (from < 1) return { kind: 'error', message: 'Day range must start at 1 or later.' };
  if (to > tripDays) return { kind: 'error', message: `Day range can't go past Day ${tripDays}.` };
  if (from > to) return { kind: 'error', message: '"From" day must be before or equal to "To" day.' };

  const siblings = phases.filter(p => p.id !== editingPhaseId);
  const overlapping = siblings.filter(s => !(to < s.dayFrom || from > s.dayTo));

  if (overlapping.length === 0) return { kind: 'ok-no-cascade' };

  if (overlapping.length > 1) {
    return { kind: 'error', message: 'Range overlaps multiple phases. Change one boundary at a time.' };
  }

  const neighbor = overlapping[0];
  const editing = phases.find(p => p.id === editingPhaseId);
  if (!editing) return { kind: 'error', message: 'Phase not found.' };

  const editingIsLeft = editing.dayFrom < neighbor.dayFrom;
  let neighborNewFrom = neighbor.dayFrom;
  let neighborNewTo = neighbor.dayTo;
  if (editingIsLeft) {
    neighborNewFrom = to + 1;
  } else {
    neighborNewTo = from - 1;
  }

  if (neighborNewFrom > neighborNewTo) {
    return { kind: 'error', message: `That range would leave "${neighbor.label}" with zero days. Delete that phase instead if that's what you want.` };
  }

  const movedDays: number[] = [];
  if (editingIsLeft) {
    for (let d = neighbor.dayFrom; d <= to; d++) movedDays.push(d);
  } else {
    for (let d = from; d <= neighbor.dayTo; d++) movedDays.push(d);
  }

  return { kind: 'ok-with-cascade', neighborId: neighbor.id, neighborLabel: neighbor.label, neighborNewFrom, neighborNewTo, movedDays };
}

/* ─── Slot container ID helpers ─────────────────────────────── */
const slotId = (dayNum: number, slot: TimeSlot) => `__slot__${dayNum}__${slot}`;
const parseSlotId = (id: UniqueIdentifier): { dayNum: number; slot: TimeSlot } | null => {
  const m = String(id).match(/^__slot__(\d+)__(\w+)$/);
  if (!m) return null;
  return { dayNum: Number(m[1]), slot: m[2] as TimeSlot };
};

/* ─── Main component ─────────────────────────────────────────── */
interface Props {
  itineraryMd: string;
  destination: string;
  tripPrompt: string;
  photos: string[];
  acceptedHotels?: AcceptedHotel[];
  onActivityStatusChange?: () => void;
  onPlaceHover: (e: React.MouseEvent) => void;
  onPlaceLeave: () => void;
  isGuest?: boolean;
  onGateRequired?: () => void;
  initialDays?: Day[];
  initialPhases?: Phase[];
  startDate?: string;
  locale?: string;
  /** True while the parent is actively streaming plan content. When this
      flips from true to false, EditableItinerary transitions out of
      'parsing-from-stream' / 'structured-from-stream' mode into 'hydrated-complete'.
      Undefined is treated as false (for saved trip loads and other non-streaming contexts). */
  isStreaming?: boolean;
  /** Called when the user clicks "Plan these days" on a PhaseCard.
      Returns a Promise so PhaseCard can show its loading state until expansion completes. */
  onPlanPhase?: (phase: Phase) => Promise<void>;
  /** R4: Called when user clicks the regen button on a day card header. */
  onRegenerateDay?: (dayNumber: number) => void;
  /** R4: Called when user selects "Regenerate phase" from the PhaseCard three-dot menu. */
  onRegeneratePhase?: (phaseId: string) => void;
  /** R4: Gates the regen affordances. Pass process.env.NEXT_PUBLIC_REGENERATION_ENABLED !== 'false'. */
  regenEnabled?: boolean;
  /** R6: Controls phase generation strategy and phase card rendering mode. */
  tripLengthMode?: TripLengthMode;
  /** Stage 2d (Collab): fired after every imperative mutation via ItineraryHandle.
      Plan page wires this to collab.emitPatch when collab is enabled, undefined
      otherwise. Solo trips: callback stays undefined; mutations only touch
      local state. Not fired for inline UI handlers (accept/decline button
      clicks) in Stage 2d; those can be wrapped in Stage 2e if needed. */
  onPatchEmit?: (payload: PatchPayload) => void;
  /** Stage 2f hotfix #9: viewer collaborator UI lock. When true, every edit
      affordance (accept/decline, drag, move-to-day, notes input, suggestion
      buttons, day confirm, regen, finalize, phase edit/range/delete,
      AddPhaseButton) is hidden or disabled. The data layer is already safe
      (POST /api/trips/[tripId]/patches 403s viewers); this prop closes the
      UX gap where viewers saw active controls that silently no-op. Solo
      trips and editor/owner sessions pass false. */
  readOnly?: boolean;
  /** Stage 4b: comment config. When set (collab trips only), CommentThread
      icons appear on activities, day headers, and phase headers. */
  commentConfig?: CommentConfig;
}

export interface ItineraryHandle {
  addActivity: (
    text: string,
    dayNum: number,
    slot: TimeSlot,
    manuallyAdded?: boolean,
    lunaAdded?: boolean,
    options?: MutationOptions,
    // Stage 2f-hotfix-4: optional id for cross-browser stability.
    // When this method is called via the receive dispatcher, the
    // originator's id is passed so both browsers end up with the
    // same activity id. Reorder/replace patches that reference
    // activity ids then dispatch correctly.
    forcedId?: string,
  ) => void;
  removeActivitiesMatching: (pattern: string) => void;
  getDays: () => { number: number; title: string }[];
  getDaysSnapshot: () => Day[];
  getPhases: () => Phase[];
  restoreDays: (days: Day[]) => void;
  /** Stage 4: incrementally add a structured day (from define_day tool call). */
  setStructuredDay: (day: Day) => void;
  /** Stage 4: add or update a phase (from define_phase tool call). */
  upsertPhase: (phase: Phase) => void;
  /** Stage 4: set all structured days at once (e.g. after full stream). */
  setStructuredDays: (days: Day[]) => void;
  /** Stage 4: signal that the stream is delivering structured tool calls
      (disables markdown re-parsing). */
  beginStructuredStream: () => void;
  /** R4: Replace a single day in-place (used after day/phase regeneration). */
  replaceDay: (dayNumber: number, newDay: Day) => void;
  /** R4: Get accepted activities for a day (for "keep my picks" regen mode). */
  getAcceptedActivitiesForDay: (dayNumber: number) => Array<{
    timeSlot: TimeSlot;
    text: string;
  }>;
  /** R5: Update a phase's label/summary/highlights in-place. */
  editPhase: (phaseId: string, patch: { label?: string; summary?: string; highlights?: string[] }, options?: MutationOptions) => void;
  /** R5: Split a phase into two at a given day boundary. */
  splitPhase: (
    phaseId: string,
    splitAtDay: number,
    phaseA: { id: string; label: string; summary: string; highlights: string[] },
    phaseB: { id: string; label: string; summary: string; highlights: string[] },
    options?: MutationOptions,
  ) => void;
  /** R5: Merge two adjacent phases into one. */
  mergePhases: (
    phaseIdA: string,
    phaseIdB: string,
    mergedPhase: { id: string; label: string; summary: string; highlights: string[] },
    options?: MutationOptions,
  ) => void;
  /** R5: Reorder phases (renumbers all days accordingly). */
  reorderPhases: (orderedPhaseIds: string[], options?: MutationOptions) => void;
  /** R5: Remove a phase and all its days. */
  removePhase: (phaseId: string, options?: MutationOptions) => void;
  /** Stage 2d: remove an activity by stable id (idempotent if not found). */
  removeActivityById: (activityId: string, options?: MutationOptions) => void;
  /** Stage 2d: patch an activity's fields by stable id. Partial update. */
  editActivityById: (activityId: string, changes: Partial<{ text: string; status: Status; lunaAdded: boolean; manuallyAdded: boolean }>, options?: MutationOptions) => void;
  /** Stage 2d: replace an activity's text/slot by id. Preserves id. */
  replaceActivityById: (activityId: string, newActivity: { text: string; slot: TimeSlot; lunaAdded?: boolean; manuallyAdded?: boolean }, options?: MutationOptions) => void;
  /** Stage 2d: move an activity to a different day/slot by id. */
  moveActivityById: (activityId: string, toDayNumber: number, toSlot: TimeSlot, options?: MutationOptions) => void;
  /** Stage 2d: set or clear a day's notes by day number (empty string clears). */
  setNoteForDay: (dayNumber: number, note: string, options?: MutationOptions) => void;
  /** Stage 2d: imperatively set day expansion (open/close) state. */
  setDayExpanded: (dayNumber: number, expanded: boolean, options?: MutationOptions) => void;
  /** collab-fix-confirm-day: set a day's confirmed state by stable day id. */
  setDayConfirmed: (dayId: string, confirmed: boolean, options?: MutationOptions) => void;
  /** Stage 2f-hotfix-3: reorder activities within a single slot of a day.
      activityIdOrder is the desired in-slot order. Activities outside the
      slot are unaffected; activities in the slot but missing from
      activityIdOrder are appended at the end (defensive). */
  reorderActivitiesInSlot: (dayId: string, slot: TimeSlot, activityIdOrder: string[], options?: MutationOptions) => void;
}

const EditableItinerary = forwardRef<ItineraryHandle, Props>(function EditableItinerary({
  itineraryMd, destination, tripPrompt, photos, acceptedHotels = [],
  onActivityStatusChange,
  onPlaceHover, onPlaceLeave,
  isGuest = false, onGateRequired,
  initialDays, initialPhases,
  startDate,
  locale: localeProp,
  isStreaming = false,
  onPlanPhase,
  onRegenerateDay,
  onRegeneratePhase,
  regenEnabled = false,
  tripLengthMode = 'short',
  onPatchEmit,
  readOnly = false,
  commentConfig,
}, ref) {
  // Stage 2f: hold a ref to the live onPatchEmit prop. The handle methods
  // built inside useImperativeHandle close over this ref (which always
  // points to the current prop), instead of the prop itself (which would
  // be undefined at first render before collab.enabled resolves to true).
  // Without this pattern, every handle method emit (addActivity, editPhase,
  // splitPhase, mergePhases, reorderPhases, removeActivityById,
  // replaceActivityById, setNoteForDay) silently no-op'd because
  // onPatchEmit was undefined at the time the handle captured it.
  const onPatchEmitRef = useRef(onPatchEmit);
  useEffect(() => { onPatchEmitRef.current = onPatchEmit; }, [onPatchEmit]);

  // Stage 2f-hotfix-1: ref-of-state pattern for handle methods. Without
  // these, methods inside useImperativeHandle read state from the closure
  // captured at first render (empty days/phases). With these, handle
  // methods read live state via *Ref.current. Combined with the
  // closure-race fix (capture id BEFORE setDays, never via outer-scope
  // assignment from inside the updater), handle methods reliably emit
  // patches with correct payloads.

  const localeFromHook = useLocale();
  const locale = localeProp ?? localeFromHook;
  const t = useTranslations('plan');
  // Underlying days state. Do not use _setDays directly outside the parse
  // effect. Use the setDays wrapper below, which keeps hydrationMode in sync.
  const [days, _setDays] = useState<Day[]>(() =>
    (initialDays && initialDays.length > 0) ? initialDays : []
  );

  // Phase state for 7+ day trips (Stage 4 / R6). Empty for shorter trips.
  const [phases, setPhases] = useState<Phase[]>(() =>
    (initialPhases && initialPhases.length > 0) ? initialPhases : []
  );

  // Stage 2f-hotfix-1: keep refs of days/phases so handle methods inside
  // useImperativeHandle read live state, not state captured at first render.
  const daysRef = useRef(days);
  const phasesRef = useRef(phases);
  useEffect(() => { daysRef.current = days; }, [days]);
  useEffect(() => { phasesRef.current = phases; }, [phases]);

  // P2-7: Viewport batch pre-warming — resolves activities in visible day cards
  // before the user hovers, so the first hover is an instant cache hit.
  const batchPreviewEnabled = process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED !== 'false';
  const { batchResolve } = useBatchResolve();
  const onDayVisible = useCallback((dayElement: HTMLElement) => {
    const dayId = dayElement.dataset.dayId;
    if (!dayId) return;
    const day = daysRef.current.find(d => (d.id ?? String(d.number)) === dayId);
    if (!day) return;
    const items = day.activities
      .map(act => {
        const query = cleanActivityQuery(act.text);
        if (!isResolvableQuery(query)) return null;
        return { query, cityContext: destination };
      })
      .filter((item): item is { query: string; cityContext: string } => item !== null);
    if (items.length > 0) void batchResolve(items);
  }, [batchResolve, destination]);
  const { attachRef } = useDayViewportObserver({ onDayVisible, enabled: batchPreviewEnabled });

  // P2-8: Post-generation resolution key — bumped when a new generation
  // completes (isStreaming: true→false) or a saved trip is loaded (initialDays
  // reference changes). The key guards the hook against re-resolving the same
  // trip on every re-render.
  const postResolveKeyRef = useRef(0);
  const [postResolveKey, setPostResolveKey] = useState('none');

  // Signal 1: main generation just completed.
  // didStreamRef tracks whether streaming was ever true, so we only fire on
  // the true→false transition, not on every render where isStreaming is false.
  const didStreamRef = useRef(false);
  useEffect(() => {
    if (isStreaming) {
      didStreamRef.current = true;
      return;
    }
    if (didStreamRef.current) {
      didStreamRef.current = false;
      // days.length read at effect-fire time, not tracked as dep
      if (days.length > 0) {
        postResolveKeyRef.current += 1;
        setPostResolveKey(`gen-${postResolveKeyRef.current}`);
      }
    }
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signal 2: saved/draft trip loaded (initialDays reference changes to non-empty).
  useEffect(() => {
    if (!initialDays || initialDays.length === 0) return;
    postResolveKeyRef.current += 1;
    setPostResolveKey(`load-${postResolveKeyRef.current}`);
  }, [initialDays]); // eslint-disable-line react-hooks/exhaustive-deps

  usePostGenerationResolve({
    days,
    cityContext: destination,
    enabled: batchPreviewEnabled,
    generationKey: postResolveKey,
  });

  // R6: medium mode only — user can dismiss phase overview cards.
  const [phasesDismissed, setPhasesDismissed] = useState(false);
  // R5.1: which phases are manually collapsed (Set of phase IDs).
  const [collapsedPhaseIds, setCollapsedPhaseIds] = useState<Set<string>>(new Set());
  const togglePhase = (phaseId: string) => {
    setCollapsedPhaseIds(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId); else next.add(phaseId);
      return next;
    });
  };
  // R5.1 FINAL: newly created phase ID, used to auto-open label editor.
  const [newPhaseId, setNewPhaseId] = useState<string | null>(null);

  // Derive trip day count from tripPrompt for range validation.
  const tripDays = (() => {
    const m1 = tripPrompt?.match(/from (\d{4}-\d{2}-\d{2})/);
    const m2 = tripPrompt?.match(/to (\d{4}-\d{2}-\d{2})/);
    if (m1 && m2) return Math.ceil((new Date(m2[1]).getTime() - new Date(m1[1]).getTime()) / 86400000) + 1;
    return 365;
  })();

  const updatePhaseLabel = (phaseId: string, newLabel: string) => {
    // Stage 2f-hotfix-1: emit edit_phase. The inline phase rename UI was
    // bypassing the patch pipeline entirely; collaborators never saw
    // renames until manual save + reload. No-op guard prevents emit
    // spam from blur events that didn't change the value.
    const oldLabel = phases.find(p => p.id === phaseId)?.label;
    if (oldLabel === newLabel) return;

    setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, label: newLabel } : p));
    onActivityStatusChange?.();

    emitFromInline({
      type: 'edit_phase',
      phaseId,
      changes: { label: newLabel },
    });
  };

  const updatePhaseRange = async (phaseId: string, from: number, to: number): Promise<string | null> => {
    // TODO Stage 4+: emit edit_phase with extended payload (dayFrom, dayTo).
    // The current edit_phase payload only carries label/summary/highlights.
    // Range changes apply locally and persist via debounced save, but
    // collaborators see them only after manual save + reload.
    const editing = phases.find(p => p.id === phaseId);
    if (!editing) return 'Phase not found.';
    if (editing.dayFrom === from && editing.dayTo === to) return null;

    const effect = analyzeRangeEdit(phases, phaseId, from, to, tripDays);
    if (effect.kind === 'error') return effect.message;

    if (effect.kind === 'ok-no-cascade') {
      setPhases(prev => prev.map(p => p.id === phaseId ? { ...p, dayFrom: from, dayTo: to } : p));
      onActivityStatusChange?.();
      return null;
    }

    // ok-with-cascade — confirm first
    const neighbor = phases.find(p => p.id === effect.neighborId)!;
    const movedCount = effect.movedDays.length;
    const confirmMsg =
      `"${effect.neighborLabel}" will shrink from Days ${neighbor.dayFrom}-${neighbor.dayTo} to Days ${effect.neighborNewFrom}-${effect.neighborNewTo}. ` +
      `Day${movedCount !== 1 ? 's' : ''} ${effect.movedDays.join(', ')} will move to "${editing.label}". ` +
      `If ${movedCount !== 1 ? 'they have' : 'it has'} activities, ${movedCount !== 1 ? 'they' : 'it'} will be regenerated to match the new phase. Continue?`;

    if (!confirm(confirmMsg)) return null;

    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) return { ...p, dayFrom: from, dayTo: to };
      if (p.id === effect.neighborId) return { ...p, dayFrom: effect.neighborNewFrom, dayTo: effect.neighborNewTo };
      return p;
    }));
    _setDays(prev => prev.map(d =>
      effect.movedDays.includes(d.number) ? { ...d, phase_id: phaseId } : d
    ));

    const daysNeedingRegen = days.filter(d =>
      effect.movedDays.includes(d.number) && d.activities.length > 0
    );
    for (const day of daysNeedingRegen) {
      fetch('/api/regenerate-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: day.number,
          tripPrompt,
          phaseLabel: editing.label,
          phaseSummary: editing.summary,
          phaseHighlights: editing.highlights,
          locale,
        }),
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.day) {
            _setDays(prev => prev.map(d => d.number === day.number ? { ...data.day, phase_id: phaseId } : d));
          }
        })
        .catch(err => console.warn('[R5.1 hotfix] regenerate-day failed:', err));
    }

    onActivityStatusChange?.();
    return null;
  };

  const deletePhase = (phaseId: string) => {
    // TODO Stage 4+: phase deletion needs a `remove_phase` patch type.
    // No corresponding type exists in the 20-type patch library yet, so
    // local apply works but collaborators see deletion only after manual
    // save + reload.
    const ph = phases.find(p => p.id === phaseId);
    const dayCount = ph ? ph.dayTo - ph.dayFrom + 1 : 0;
    const msg = dayCount > 0
      ? `Delete this phase? The ${dayCount} day(s) inside will become unassigned.`
      : 'Delete this phase?';
    if (!confirm(msg)) return;
    setPhases(prev => prev.filter(p => p.id !== phaseId));
    _setDays(prev => prev.map(d => d.phase_id === phaseId ? { ...d, phase_id: undefined } : d));
    onActivityStatusChange?.();
  };

  const createNewPhase = () => {
    const sorted = [...phases].sort((a, b) => b.dayTo - a.dayTo);
    const lastEnd = sorted[0]?.dayTo ?? 0;
    const startDay = Math.min(lastEnd + 1, tripDays);
    const endDay = Math.min(startDay + 2, tripDays);
    const id = `phase-${Date.now()}`;
    const newPhase: Phase = { id, label: 'New phase', dayFrom: startDay, dayTo: endDay, summary: '', highlights: [], planned: false };
    setPhases(prev => [...prev, newPhase]);
    setNewPhaseId(id);
    setTimeout(() => setNewPhaseId(null), 100);
    onActivityStatusChange?.();
  };

  const handleGeneratePhase = async (phase: Phase): Promise<void> => {
    const existingDayCount = days.filter(d => d.phase_id === phase.id && d.activities.length > 0).length;
    if (existingDayCount > 0) {
      const ok = confirm(`Regenerating will overwrite the ${existingDayCount} day(s) currently in this phase. Continue?`);
      if (!ok) return;
    }
    await onPlanPhase?.(phase);
  };

  // Hydration state machine. See HydrationMode type definition above.
  const [hydrationMode, setHydrationMode] = useState<HydrationMode>(() =>
    (initialDays && initialDays.length > 0) ? 'saved-trip-restored' : 'parsing-from-stream'
  );

  /**
   * Public setter. Every user-facing mutation (drag, accept, decline, notes,
   * toggles, addActivity, removeActivitiesMatching) goes through this. It
   * flips hydrationMode out of stream-sensitive modes into 'user-owned' so
   * later stream flushes cannot clobber user edits.
   */
  const setDays = (updater: React.SetStateAction<Day[]>) => {
    setHydrationMode(prev => {
      if (prev === 'parsing-from-stream' || prev === 'hydrated-complete') {
        return 'user-owned';
      }
      return prev;
    });
    // Stage 2f-hotfix-2: backstop. If any code path slips through and
    // produces a Day without an id (e.g., a future construction site,
    // or a saved trip restored from older data), inject one here. This
    // guarantees every Day in state has an id so collab patches always
    // have a valid dayId. Day construction sites (markdown parser,
    // defineDayInputToDay) SHOULD already inject ids; this is defense
    // in depth.
    _setDays(prev => {
      const next = typeof updater === 'function'
        ? (updater as (prev: Day[]) => Day[])(prev)
        : updater;
      return next.map(d =>
        d.id ? d : { ...d, id: `day-${d.number}-${Math.random().toString(36).slice(2, 10)}` }
      );
    });
  };
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const instanceId = useId();

  // Stage 2f-hotfix-8: capture the activity's slot at drag start. handleDragOver
  // mutates the activity's slot during live drag-preview (line ~1234) for visual
  // feedback. Without this ref, handleDragEnd reads the post-preview slot and
  // mistakes a cross-slot drag for an in-place reorder, emitting
  // `reorder_activities_in_slot` instead of `replace_activity`. The receive side
  // then drops the activity from its reorder list (the id no longer matches the
  // declared slot in Browser B). Captured at drag start, cleared at drag end.
  const dragSourceSlotRef = useRef<TimeSlot | null>(null);

  /* dnd sensors — pointer (desktop) + touch (mobile) */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /* Derived counters */
  const allActs      = days.flatMap(d => d.activities);
  const accepted     = allActs.filter(a => a.status === 'accepted').length;
  const declined     = allActs.filter(a => a.status === 'declined').length;
  const pending      = allActs.filter(a => a.status === 'pending').length;
  const total        = allActs.length;
  const confirmedDays = days.filter(d => d.confirmed).length;
  const reviewable   = total - declined; // only accepted + pending count toward progress
  const progress     = reviewable > 0 ? Math.round((accepted / reviewable) * 100) : 0;
  // A day counts as "effectively confirmed" if manually confirmed OR all its activities have been reviewed
  const allConfirmed = days.length > 0 && days.every(d =>
    d.confirmed ||
    (d.activities.length > 0 && d.activities.every(a => a.status !== 'pending'))
  );

  /**
   * Parse effect. Runs whenever itineraryMd changes, but only actually
   * updates state when we're still in parsing-from-stream mode. Uses
   * _setDays directly (bypassing the wrapped setDays) because a parse is
   * NOT a user mutation and must not flip hydrationMode to 'user-owned'.
   *
   * Also handles the regenerate case: if itineraryMd goes to empty (user
   * clicked Try Again), reset back to parsing-from-stream and clear days.
   */
  useEffect(() => {
    if (!itineraryMd) {
      if (hydrationMode !== 'saved-trip-restored') {
        setHydrationMode('parsing-from-stream');
        _setDays([]);
      }
      return;
    }
    if (hydrationMode !== 'parsing-from-stream') return;
    const parsed = parseItinerary(itineraryMd);
    if (parsed.length > 0) {
      _setDays(parsed);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itineraryMd, hydrationMode]);

  /**
   * Stream-end transition. When parent signals streaming is done and we are
   * still in parsing-from-stream or structured-from-stream mode, flip to
   * hydrated-complete. After this, itineraryMd changes no longer trigger
   * re-parses and structured day mutations are locked in.
   */
  useEffect(() => {
    if (
      isStreaming === false &&
      (hydrationMode === 'parsing-from-stream' || hydrationMode === 'structured-from-stream')
    ) {
      setHydrationMode('hydrated-complete');
    }
  }, [isStreaming, hydrationMode]);

  /* Expose handle to parent via ref */
  useImperativeHandle(ref, () => ({
    addActivity(text: string, dayNum: number, slot: TimeSlot, manuallyAdded?: boolean, lunaAdded?: boolean, options?: MutationOptions, forcedId?: string) {
      // Stage 2f-hotfix-1: capture dayId BEFORE setDays. The setDays
      // updater is async-scheduled; reading after the call sees the
      // pre-assignment value (undefined). Read synchronously from
      // the live daysRef instead.
      const day = daysRef.current.find(d => d.number === dayNum);
      const dayIdForPatch = day?.id;

      // Stage 2f-hotfix-4: prefer the originator's id when supplied
      // (passed by the receive dispatcher via p.activity.id). Local
      // user-action callers omit forcedId, so a random id is generated
      // as before — same behaviour as pre-hotfix-4 for solo flows.
      const newActivityId = forcedId ?? `d${dayNum}-chat-${Math.random().toString(36).slice(2,8)}`;
      setDays(prev => prev.map(d => {
        if (d.number !== dayNum) return d;
        const newActivity: Activity = {
          id: newActivityId,
          text,
          status: 'pending',
          slot,
          manuallyAdded,
          lunaAdded,
        };
        return { ...d, activities: [...d.activities, newActivity], open: true };
      }));

      if (dayIdForPatch && !options?.suppressEmit) {
        onPatchEmitRef.current?.({
          type: 'add_activity',
          dayId: dayIdForPatch,
          slot,
          activity: { id: newActivityId, slot, text, status: 'pending', manuallyAdded, lunaAdded },
        });
      }
    },
    removeActivitiesMatching(pattern: string) {
      const lower = pattern.toLowerCase();
      // Snapshot matching activities before setDays (hotfix-1 pattern: read
      // synchronously before the state update is scheduled).
      const toRemove: { dayId: string; activityId: string }[] = [];
      for (const d of daysRef.current) {
        if (!d.id) continue;
        for (const a of d.activities) {
          if (a.text.toLowerCase().includes(lower)) {
            toRemove.push({ dayId: d.id, activityId: a.id });
          }
        }
      }
      setDays(prev => prev.map(d => ({
        ...d,
        activities: d.activities.filter(a => !a.text.toLowerCase().includes(lower)),
      })));
      for (const { dayId, activityId } of toRemove) {
        onPatchEmitRef.current?.({ type: 'remove_activity', dayId, activityId });
      }
    },
    getDays() {
      // Stage 2f-hotfix-1: read from ref so callers see live state.
      return daysRef.current.map(d => ({ number: d.number, title: d.title }));
    },
    getDaysSnapshot() {
      return daysRef.current;
    },
    getPhases() {
      return phasesRef.current;
    },
    restoreDays(savedDays: Day[]) {
      setDays(savedDays);
    },
    // ── Stage 4: structured generation methods ──────────────────────
    beginStructuredStream() {
      // Switch to structured mode so markdown re-parsing is suppressed.
      setHydrationMode('structured-from-stream');
      _setDays([]);
      setPhases([]);
    },
    setStructuredDay(day: Day) {
      // Called incrementally as each define_day tool call arrives.
      // R5.1: medium/long trips default days to collapsed.
      const dayWithOpen = { ...day, open: tripLengthMode === 'short' ? day.open : false };
      _setDays(prev => {
        const existing = prev.findIndex(d => d.number === dayWithOpen.number);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = dayWithOpen;
          return updated;
        }
        const insertAt = prev.findIndex(d => d.number > dayWithOpen.number);
        if (insertAt === -1) return [...prev, dayWithOpen];
        const arr = [...prev];
        arr.splice(insertAt, 0, dayWithOpen);
        return arr;
      });
    },
    upsertPhase(phase: Phase) {
      setPhases(prev => {
        const existing = prev.findIndex(p => p.id === phase.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = phase;
          return updated;
        }
        return [...prev, phase];
      });
    },
    setStructuredDays(newDays: Day[]) {
      // R5.1: medium/long trips default days to collapsed.
      const daysWithOpen = tripLengthMode === 'short'
        ? newDays
        : newDays.map(d => ({ ...d, open: false }));
      _setDays(daysWithOpen);
    },
    replaceDay(dayNumber: number, newDay: Day) {
      setDays(prev => prev.map(d => d.number === dayNumber ? newDay : d));
    },
    getAcceptedActivitiesForDay(dayNumber: number) {
      const day = daysRef.current.find(d => d.number === dayNumber);
      if (!day) return [];
      return day.activities
        .filter(a => a.status === 'accepted')
        .map(a => ({ timeSlot: a.slot, text: a.text.replace(/\*\*/g, '') }));
    },

    // ── R5: Phase editing imperatives ───────────────────────────────────
    editPhase(phaseId: string, patch: { label?: string; summary?: string; highlights?: string[] }, options?: MutationOptions) {
      setPhases(prev => {
        const matched = prev.some(p => p.id === phaseId);
        if (!matched) {
          console.error('[editPhase] no phase matched id:', phaseId, '— available IDs:', prev.map(p => p.id));
          return prev;
        }
        return prev.map(p => p.id !== phaseId ? p : {
          ...p,
          ...(patch.label      !== undefined && { label:      patch.label }),
          ...(patch.summary    !== undefined && { summary:    patch.summary }),
          ...(patch.highlights !== undefined && { highlights: patch.highlights }),
        });
      });
      if (!options?.suppressEmit) {
        onPatchEmitRef.current?.({ type: 'edit_phase', phaseId, changes: patch });
      }
    },

    splitPhase(
      phaseId: string,
      splitAtDay: number,
      phaseA: { id: string; label: string; summary: string; highlights: string[] },
      phaseB: { id: string; label: string; summary: string; highlights: string[] },
      options?: MutationOptions,
    ) {
      // Stage 2f-hotfix-1: read live phases from ref so handle method
      // works correctly after the first render.
      const original = phasesRef.current.find(p => p.id === phaseId);
      if (!original) {
        console.error('[splitPhase] no phase matched id:', phaseId, '— available IDs:', phasesRef.current.map(p => p.id));
        return;
      }
      const newPhaseA: Phase = {
        id: phaseA.id,
        label: phaseA.label,
        dayFrom: original.dayFrom,
        dayTo: splitAtDay - 1,
        summary: phaseA.summary,
        highlights: phaseA.highlights,
        planned: original.planned,
      };
      const newPhaseB: Phase = {
        id: phaseB.id,
        label: phaseB.label,
        dayFrom: splitAtDay,
        dayTo: original.dayTo,
        summary: phaseB.summary,
        highlights: phaseB.highlights,
        planned: original.planned,
      };
      setPhases(prev => {
        const idx = prev.findIndex(p => p.id === phaseId);
        const next = [...prev];
        next.splice(idx, 1, newPhaseA, newPhaseB);
        return next;
      });
      _setDays(prev => prev.map(d => {
        if (d.phase_id !== phaseId) return d;
        return { ...d, phase_id: d.number < splitAtDay ? phaseA.id : phaseB.id };
      }));
      if (!options?.suppressEmit) {
        onPatchEmitRef.current?.({
          type: 'split_phase',
          phaseId,
          splitAfterDay: splitAtDay - 1,
          newPhaseLabel: phaseB.label,
          newPhaseId: phaseB.id,
        });
      }
    },

    mergePhases(
      phaseIdA: string,
      phaseIdB: string,
      mergedPhase: { id: string; label: string; summary: string; highlights: string[] },
      options?: MutationOptions,
    ) {
      // Stage 2f-hotfix-1: read live phases from ref.
      const pA = phasesRef.current.find(p => p.id === phaseIdA);
      const pB = phasesRef.current.find(p => p.id === phaseIdB);
      if (!pA || !pB) {
        console.error('[mergePhases] phase(s) not found — phaseIdA:', phaseIdA, 'phaseIdB:', phaseIdB, '— available IDs:', phasesRef.current.map(p => p.id));
        return;
      }
      const merged: Phase = {
        id: mergedPhase.id,
        label: mergedPhase.label,
        dayFrom: Math.min(pA.dayFrom, pB.dayFrom),
        dayTo: Math.max(pA.dayTo, pB.dayTo),
        summary: mergedPhase.summary,
        highlights: mergedPhase.highlights,
        planned: pA.planned && pB.planned,
      };
      setPhases(prev => prev
        .filter(p => p.id !== phaseIdA && p.id !== phaseIdB)
        .concat([merged])
        .sort((a, b) => a.dayFrom - b.dayFrom)
      );
      _setDays(prev => prev.map(d =>
        (d.phase_id === phaseIdA || d.phase_id === phaseIdB)
          ? { ...d, phase_id: mergedPhase.id }
          : d
      ));
      if (!options?.suppressEmit) {
        // Stage 2f hotfix #6: carry the full mergedPhase across the wire so
        // receiving browsers reconstruct the same id/label/summary/highlights
        // as this originator. Previously only mergedLabel was emitted, which
        // forced the receiver to reconstruct a minimal phase with empty
        // summary/highlights and a different id (phaseIdA), creating
        // content-loss + stable-id divergence on Browser B.
        onPatchEmitRef.current?.({
          type: 'merge_phases',
          phaseIds: [phaseIdA, phaseIdB],
          mergedPhase: {
            id: mergedPhase.id,
            label: mergedPhase.label,
            summary: mergedPhase.summary,
            highlights: mergedPhase.highlights,
          },
        });
      }
    },

    reorderPhases(orderedPhaseIds: string[], options?: MutationOptions) {
      // Stage 2f-hotfix-1: read live phases and days from refs.
      const phaseMap = new Map(phasesRef.current.map(p => [p.id, p]));
      const unknownIds = orderedPhaseIds.filter(id => !phaseMap.has(id));
      if (unknownIds.length > 0) {
        console.error('[reorderPhases] unknown phase IDs:', unknownIds, '— available IDs:', [...phaseMap.keys()]);
      }
      let nextDay = 1;
      const reorderedPhases: Phase[] = [];
      const reorderedDays: Day[] = [];

      for (const pid of orderedPhaseIds) {
        const phase = phaseMap.get(pid);
        if (!phase) continue;
        const phaseDays = daysRef.current
          .filter(d => d.phase_id === pid)
          .sort((a, b) => a.number - b.number);
        const newDayFrom = nextDay;
        const updatedDays = phaseDays.map((d, i) => ({ ...d, number: nextDay + i }));
        const newDayTo = nextDay + phaseDays.length - 1;
        reorderedPhases.push({ ...phase, dayFrom: newDayFrom, dayTo: newDayTo });
        reorderedDays.push(...updatedDays);
        nextDay = newDayTo + 1;
      }

      setPhases(reorderedPhases);
      _setDays(reorderedDays);
      if (!options?.suppressEmit) {
        onPatchEmitRef.current?.({ type: 'reorder_phases', phaseIdOrder: orderedPhaseIds });
      }
    },

    removePhase(phaseId: string, _options?: MutationOptions) {
      void _options;
      setPhases(prev => prev.filter(p => p.id !== phaseId));
      setDays(prev => prev.filter(d => d.phase_id !== phaseId));
      // No corresponding patch type; removal of a phase is not synced via
      // patches in Stage 2d. Stage 2e or later can add one if needed.
    },

    // ── Stage 2d: id-keyed mutation methods for patch dispatching ──────
    removeActivityById(activityId: string, options?: MutationOptions) {
      // Stage 2f-hotfix-1: read dayId synchronously before setDays.
      const dayIdForPatch = daysRef.current.find(d => d.activities.some(a => a.id === activityId))?.id;

      setDays(prev => prev.map(d => {
        if (!d.activities.some(a => a.id === activityId)) return d;
        return { ...d, activities: d.activities.filter(a => a.id !== activityId) };
      }));

      if (dayIdForPatch && !options?.suppressEmit) {
        onPatchEmitRef.current?.({ type: 'remove_activity', dayId: dayIdForPatch, activityId });
      }
    },

    editActivityById(activityId, changes, _options?: MutationOptions) {
      void _options;
      setDays(prev => prev.map(d => ({
        ...d,
        activities: d.activities.map(a =>
          a.id === activityId ? { ...a, ...changes } : a
        ),
      })));
      // No corresponding patch type for arbitrary edits. Status changes
      // could map to accept_activity/unaccept_activity but at this method
      // we don't know the day id from just the activity id without a
      // scan. Stage 2e can add targeted emitters if this becomes load-bearing.
    },

    replaceActivityById(activityId, newActivity, options?: MutationOptions) {
      // Stage 2f-hotfix-1: read dayId synchronously before setDays.
      const dayIdForPatch = daysRef.current.find(d => d.activities.some(a => a.id === activityId))?.id;

      // P2-3b: when the slot changes, reposition the activity to the end of
      // the day's activities array so it appears at the end of the new slot
      // when filtered by the renderer (line 1615: filter(a => a.slot === key)).
      // The previous in-place update kept the activity at its old index,
      // which placed it at the wrong position within the destination slot
      // (e.g. dropping into afternoon would render it BEFORE existing
      // afternoon activities if its index was lower). Same-slot calls
      // (Luna text swap) preserve original position.
      setDays(prev => prev.map(d => {
        const existing = d.activities.find(a => a.id === activityId);
        if (!existing) return d;
        const updated = {
          ...existing,
          text: newActivity.text,
          slot: newActivity.slot,
          manuallyAdded: newActivity.manuallyAdded,
          lunaAdded: newActivity.lunaAdded,
        };
        if (existing.slot !== newActivity.slot) {
          return {
            ...d,
            activities: [...d.activities.filter(a => a.id !== activityId), updated],
          };
        }
        return {
          ...d,
          activities: d.activities.map(a => (a.id === activityId ? updated : a)),
        };
      }));
      if (dayIdForPatch && !options?.suppressEmit) {
        onPatchEmitRef.current?.({
          type: 'replace_activity',
          dayId: dayIdForPatch,
          activityId,
          newActivity: {
            id: activityId,
            slot: newActivity.slot,
            text: newActivity.text,
            status: 'pending',
            manuallyAdded: newActivity.manuallyAdded,
            lunaAdded: newActivity.lunaAdded,
          },
        });
      }
    },

    moveActivityById(activityId, toDayNumber, toSlot, _options?: MutationOptions) {
      void _options;
      setDays(prev => {
        let moving: Activity | null = null;
        const withoutSource = prev.map(d => ({
          ...d,
          activities: d.activities.filter(a => {
            if (a.id === activityId) { moving = { ...a, slot: toSlot }; return false; }
            return true;
          }),
        }));
        if (!moving) return prev;
        return withoutSource.map(d =>
          d.number === toDayNumber ? { ...d, activities: [...d.activities, moving!] } : d
        );
      });
      // Stage 2d: no move_activity patch type in shipped library. Deferred.
    },

    setNoteForDay(dayNumber, note, options?: MutationOptions) {
      // Stage 2f-hotfix-1: read dayId and hadNote synchronously from refs
      // before setDays. The updater is async-scheduled.
      const targetDay = daysRef.current.find(d => d.number === dayNumber);
      const dayIdForPatch = targetDay?.id;
      const hadNote = Boolean(targetDay?.notes && targetDay.notes.length > 0);

      setDays(prev => prev.map(d => {
        if (d.number !== dayNumber) return d;
        if (!note) {
          const { notes: _n, ...rest } = d;
          void _n;
          return rest as Day;
        }
        return { ...d, notes: note };
      }));

      if (dayIdForPatch && !options?.suppressEmit) {
        if (!note) {
          onPatchEmitRef.current?.({ type: 'remove_note', dayId: dayIdForPatch });
        } else if (hadNote) {
          onPatchEmitRef.current?.({ type: 'update_note', dayId: dayIdForPatch, note });
        } else {
          onPatchEmitRef.current?.({ type: 'add_note', dayId: dayIdForPatch, note });
        }
      }
    },

    setDayExpanded(dayNumber, expanded, _options?: MutationOptions) {
      void _options;
      setDays(prev => prev.map(d => d.number === dayNumber ? { ...d, open: expanded } : d));
      // UI state; not synced as a patch (expand_phase patch type is for
      // phase-level UI in R6, not day-level). Local-only.
    },

    reorderActivitiesInSlot(dayId, slot, activityIdOrder, options?: MutationOptions) {
      // Stage 2f-hotfix-3: within-slot reorder. Receive path passes
      // suppressEmit:true to prevent re-broadcast. The local emit path
      // (handleDragEnd) calls onPatchEmit directly, not this method, so
      // this implementation only needs to handle the receive case
      // structurally — but emit support is included for symmetry.
      setDays(prev => prev.map(d => {
        if (d.id !== dayId) return d;
        const inSlot = d.activities.filter(a => a.slot === slot);
        const outOfSlot = d.activities.filter(a => a.slot !== slot);
        const byId = new Map(inSlot.map(a => [a.id, a]));
        const ordered: typeof inSlot = [];
        for (const id of activityIdOrder) {
          const found = byId.get(id);
          if (found) {
            ordered.push(found);
            byId.delete(id);
          }
        }
        // Append any in-slot activities not mentioned in activityIdOrder
        // (defensive; should not happen in practice).
        for (const remaining of byId.values()) ordered.push(remaining);
        // Re-merge: keep out-of-slot activities in their original index
        // positions relative to the day, place ordered in-slot activities
        // at the original first-in-slot index.
        const merged: typeof d.activities = [];
        let orderedIdx = 0;
        for (const a of d.activities) {
          if (a.slot === slot) {
            if (orderedIdx < ordered.length) {
              merged.push(ordered[orderedIdx]!);
              orderedIdx++;
            }
          } else {
            merged.push(a);
          }
        }
        return { ...d, activities: merged };
      }));

      if (!options?.suppressEmit) {
        onPatchEmitRef.current?.({
          type: 'reorder_activities_in_slot',
          dayId,
          slot,
          activityIdOrder,
        });
      }
    },

    setDayConfirmed(dayId, confirmed, options?: MutationOptions) {
      setDays(prev => prev.map(d => {
        if (d.id !== dayId) return d;
        return {
          ...d,
          confirmed,
          activities: confirmed
            ? d.activities.map(a => a.status === 'pending' ? { ...a, status: 'accepted' as const } : a)
            : d.activities,
        };
      }));
      // Receive path passes suppressEmit:true; inline path is handled by
      // toggleConfirmed which calls emitFromInline directly (not this method).
    },
  }));


  /* Find activity across all days */
  const findActivity = (id: UniqueIdentifier) =>
    days.flatMap(d => d.activities).find(a => a.id === id);

  /* Find which day+slot an activity lives in */
  const findContainer = (id: UniqueIdentifier): { dayNum: number; slot: TimeSlot } | null => {
    const slotParsed = parseSlotId(id);
    if (slotParsed) return slotParsed;
    for (const d of days) {
      for (const a of d.activities) {
        if (a.id === id) return { dayNum: d.number, slot: a.slot };
      }
    }
    return null;
  };

  /**
   * Stage 2e: helper invoked by inline mutation handlers (drag, accept,
   * suggestions, notes) to fire onPatchEmit after they've already mutated
   * local state via setDays. Imperative ref methods (addActivity, editPhase,
   * etc.) emit through their own internal logic established in Stage 2d
   * hotfix #1; this helper is for the click/drag-driven sites that don't
   * route through ref methods.
   *
   * Convention: every `setDays(...)` call in an inline user-action handler
   * MUST have a matching emitFromInline() call (or note debounce) so that
   * collaborator views stay in sync. Forgetting one causes silent desync —
   * the local user sees their change, collaborators don't.
   */
  const emitFromInline = (payload: PatchPayload) => {
    if (!onPatchEmit) return;
    onPatchEmit(payload);
  };

  // Stage 2e: per-day debounce for note edits. Avoids one patch per
  // keystroke when the user types a paragraph; emits the final value
  // after 800ms of typing-idle.
  const noteDebounceRefs = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const timers = noteDebounceRefs.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);

  /* ── Drag handlers ── */
  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
    // Stage 2f-hotfix-8: capture original slot before handleDragOver's
    // preview mutation hides the cross-slot intent from handleDragEnd.
    const source = findContainer(active.id);
    dragSourceSlotRef.current = source?.slot ?? null;
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (isGuest) return;                   // guests cannot move activities
    if (!over || active.id === over.id) return;
    const from = findContainer(active.id);
    const to   = findContainer(over.id);
    if (!from || !to) return;
    if (from.dayNum !== to.dayNum) return; // cross-day drag not supported
    if (from.slot === to.slot) return;     // same slot — handled by onDragEnd

    // Capture the activity + day id before the setState callback so we can
    // emit a patch with the right shape afterwards.
    const day = days.find(d => d.number === from.dayNum);
    const act = day?.activities.find(a => a.id === active.id);

    setDays(prev => prev.map(d => {
      if (d.number !== from.dayNum) return d;
      const act = d.activities.find(a => a.id === active.id);
      if (!act) return d;

      // Remove from old slot position, insert at new slot (end)
      const without = d.activities.filter(a => a.id !== active.id);
      const slotItems = without.filter(a => a.slot === to.slot);
      const overIdx = without.findIndex(a => a.id === over.id);

      const newActs = [...without];
      const insertAt = overIdx >= 0 ? overIdx : newActs.length;
      newActs.splice(insertAt, 0, { ...act, slot: to.slot });

      return { ...d, activities: newActs };
    }));

    // Stage 2f: handleDragOver is local drag-preview only. handleDragEnd
    // commits the final position and emits replace_activity. Avoiding
    // emit from handleDragOver prevents broadcasting many intermediate
    // states during a single drag gesture.
    void act; void day;
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (isGuest) { onGateRequired?.(); return; }
    if (!over || active.id === over.id) return;

    const from = findContainer(active.id);
    const to   = findContainer(over.id);
    if (!from || !to || from.dayNum !== to.dayNum) return;

    const day = days.find(d => d.number === from.dayNum);
    const act = day?.activities.find(a => a.id === active.id);

    setDays(prev => prev.map(d => {
      if (d.number !== from.dayNum) return d;

      // Cross-slot drop onto the slot droppable (empty zone)
      if (parseSlotId(over.id)) {
        return {
          ...d,
          activities: d.activities.map(a =>
            a.id === active.id ? { ...a, slot: to.slot } : a
          ),
        };
      }

      // Reorder within same slot or finalise cross-slot position
      const oldIdx = d.activities.findIndex(a => a.id === active.id);
      const newIdx = d.activities.findIndex(a => a.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return d;

      const reordered = arrayMove(d.activities, oldIdx, newIdx);
      // Ensure the moved item has the target slot
      return {
        ...d,
        activities: reordered.map((a, i) =>
          i === newIdx && a.id === active.id ? { ...a, slot: to.slot } : a
        ),
      };
    }));

    // Stage 2e/2f/2f-hotfix-3: drag-end commits the slot change.
    //
    // Cross-slot drag (e.g. morning to afternoon) emits replace_activity
    // so collaborators see the moved activity in its new slot.
    //
    // Within-slot reorder (position 2 to 4 inside the same slot) emits
    // reorder_activities_in_slot with the new in-slot id order. This
    // patch type was added in Stage 2f-hotfix-3 to close the gap left
    // by Stage 2f.
    //
    // Stage 2f-hotfix-8: cross-slot detection uses dragSourceSlotRef
    // (set in handleDragStart) instead of `from.slot`. handleDragOver
    // mutates the activity's slot mid-drag for live preview, so by the
    // time handleDragEnd runs `from.slot === to.slot` and the cross-slot
    // branch never fired. The DB previously logged cross-slot drags as
    // reorder_activities_in_slot (with activityIds whose origin slot
    // differed from the patch's declared slot), and Browser B silently
    // dropped them.
    const sourceSlotAtStart = dragSourceSlotRef.current;
    dragSourceSlotRef.current = null;
    if (act && day?.id && typeof active.id === 'string') {
      const wasCrossSlot = sourceSlotAtStart !== null && sourceSlotAtStart !== to.slot;
      if (wasCrossSlot) {
        emitFromInline({
          type: 'replace_activity',
          dayId: day.id,
          activityId: active.id,
          newActivity: {
            id: active.id,
            slot: to.slot,
            text: act.text,
            status: act.status === 'declined' ? 'rejected' : act.status,
            manuallyAdded: act.manuallyAdded,
            lunaAdded: act.lunaAdded,
          },
        });
      } else {
        // Within-slot reorder. Read the post-arrayMove order from the
        // freshly-updated daysRef (setDays applies synchronously enough
        // for our refs but we rebuild the order from the data we already
        // have above — `reordered` is local to the setDays callback, so
        // we recompute it here from the source-of-truth: days at this
        // point contains pre-update state, so we replay arrayMove with
        // the current (pre-update) indices and project the resulting
        // in-slot id order). Equivalent: take the day's activities,
        // arrayMove them, then filter to slot.
        const oldIdx = day.activities.findIndex(a => a.id === active.id);
        const newIdx = day.activities.findIndex(a => a.id === over.id);
        if (oldIdx !== -1 && newIdx !== -1) {
          const reordered = arrayMove(day.activities, oldIdx, newIdx);
          const activityIdOrder = reordered
            .filter(a => a.slot === to.slot)
            .map(a => a.id);
          emitFromInline({
            type: 'reorder_activities_in_slot',
            dayId: day.id,
            slot: to.slot,
            activityIdOrder,
          });
        }
      }
    }
  };

  /* ── Mutations ── */
  const setActivityStatus = (dayNum: number, actId: string, status: Status) => {
    // Compute the resulting status BEFORE setDays so we can emit accurately.
    const day = days.find(d => d.number === dayNum);
    const act = day?.activities.find(a => a.id === actId);
    const willBe: Status = act?.status === status ? 'pending' : status;

    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        activities: d.activities.map(a =>
          a.id === actId ? { ...a, status: a.status === status ? 'pending' : status } : a
        ),
      }
    ));
    onActivityStatusChange?.();

    // Stage 2f: emit the right patch based on willBe transition.
    // Three branches: accept_activity, decline_activity, unaccept_activity.
    if (willBe === 'accepted') {
      emitFromInline({ type: 'accept_activity', dayId: day?.id ?? '', activityId: actId });
    } else if (willBe === 'declined') {
      emitFromInline({ type: 'decline_activity', dayId: day?.id ?? '', activityId: actId });
    } else if (willBe === 'pending') {
      emitFromInline({ type: 'unaccept_activity', dayId: day?.id ?? '', activityId: actId });
    }
  };

  const toggleDay = (num: number) =>
    setDays(prev => prev.map(d => d.number === num ? { ...d, open: !d.open } : d));

  const fetchMoreIdeas = async (dayNum: number) => {
    if (isGuest) { onGateRequired?.(); return; }
    const day = days.find(d => d.number === dayNum);
    if (!day || day.loadingMore) return;
    setDays(prev => prev.map(d => d.number === dayNum ? { ...d, loadingMore: true } : d));
    try {
      const allDaysContext = days
        .filter(d => d.number !== dayNum)
        .map(d => `Day ${d.number} (${d.title}):\n${d.activities.filter(a => a.status !== 'declined').map(a => `  - ${a.text}`).join('\n')}`)
        .join('\n\n');
      const res = await fetch('/api/day-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripPrompt,
          dayNumber: dayNum,
          dayTitle: day.title,
          destination,
          existingActivities: day.activities.map(a => a.text),
          allDaysContext,
          locale,
        }),
      });
      const data = await res.json();
      const suggestions: Suggestion[] = (data.suggestions || []).map(
        (s: Omit<Suggestion, 'id'>, i: number) => ({ ...s, id: `d${dayNum}-s${Date.now()}-${i}` })
      );
      setDays(prev => prev.map(d =>
        d.number === dayNum ? { ...d, suggestions: [...d.suggestions, ...suggestions], loadingMore: false } : d
      ));
    } catch {
      setDays(prev => prev.map(d => d.number === dayNum ? { ...d, loadingMore: false } : d));
    }
  };

  const acceptSuggestion = (dayNum: number, sug: Suggestion) => {
    // Detect slot from timing hint
    const timing   = (sug.timing || '').toLowerCase();
    const sugSlot: TimeSlot = detectSlot(timing) ?? 'afternoon';
    // Generate the new activity id outside setDays so we can emit it.
    const day = days.find(d => d.number === dayNum);
    const newActivityId = `d${dayNum}-a${day?.activities.length ?? 0}-${Math.random().toString(36).slice(2,6)}`;
    const newActivityText = `**${sug.title}** — ${sug.description}`;

    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        suggestions: d.suggestions.filter(s => s.id !== sug.id),
        activities: [...d.activities, {
          id: newActivityId,
          text: newActivityText,
          status: 'accepted',
          slot: sugSlot,
        }],
      }
    ));

    // Stage 2e: emit add_activity so collaborators see the suggestion was accepted.
    if (day?.id) {
      emitFromInline({
        type: 'add_activity',
        dayId: day.id,
        slot: sugSlot,
        activity: {
          id: newActivityId,
          slot: sugSlot,
          text: newActivityText,
          status: 'accepted',
        },
      });
    }
  };

  const declineSuggestion = (dayNum: number, sugId: string) =>
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : { ...d, suggestions: d.suggestions.filter(s => s.id !== sugId) }
    ));

  const moveActivityToDay = (actId: string, fromDayNum: number, toDayNum: number) => {
    if (isGuest) { onGateRequired?.(); return; }
    setDays(prev => {
      const fromDay = prev.find(d => d.number === fromDayNum);
      const act = fromDay?.activities.find(a => a.id === actId);
      if (!act) return prev;
      return prev.map(d => {
        if (d.number === fromDayNum) return { ...d, activities: d.activities.filter(a => a.id !== actId) };
        if (d.number === toDayNum)   return { ...d, activities: [...d.activities, act], open: true };
        return d;
      });
    });
  };

  const toggleConfirmed = (dayNum: number) => {
    // Read from current days snapshot BEFORE setDays (same pattern as
    // setActivityStatus). setDays updaters run in React's batch queue,
    // AFTER the current synchronous code, so any variable captured inside
    // the updater is unavailable at the emit call site. Pre-computing here
    // is the convention (CLAUDE.md hotfix-1).
    const day = days.find(d => d.number === dayNum);
    if (!day) return;
    const nowConfirmed = !day.confirmed;

    setDays(prev => prev.map(d => {
      if (d.number !== dayNum) return d;
      return {
        ...d,
        confirmed: nowConfirmed,
        // When confirming, auto-accept all pending activities (leave declined as-is)
        activities: nowConfirmed
          ? d.activities.map(a => a.status === 'pending' ? { ...a, status: 'accepted' as const } : a)
          : d.activities,
      };
    }));

    if (day.id) {
      emitFromInline({ type: 'confirm_day', dayId: day.id, confirmed: nowConfirmed });
    }
  };

  const handleNoteChange = (dayIndex: number, note: string) => {
    // Apply locally immediately for responsive typing.
    setDays(prev => prev.map((d, i) => i === dayIndex ? { ...d, notes: note } : d));

    // Stage 2e: debounced emit. 800ms idle before firing so typing a paragraph
    // produces 1 patch, not one per keystroke. Per-day debounce so editing
    // notes on different days doesn't cancel each other.
    const day = days[dayIndex];
    if (!day || !day.id) return;
    const dayId = day.id;
    const dayNumber = day.number;
    const hadNote = Boolean(day.notes && day.notes.length > 0);

    const existing = noteDebounceRefs.current.get(dayNumber);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      noteDebounceRefs.current.delete(dayNumber);
      if (!note) {
        emitFromInline({ type: 'remove_note', dayId });
      } else if (hadNote) {
        emitFromInline({ type: 'update_note', dayId, note });
      } else {
        emitFromInline({ type: 'add_note', dayId, note });
      }
    }, 800);
    noteDebounceRefs.current.set(dayNumber, timer);
  };

  const activeActivity = activeId ? findActivity(activeId) : null;

  const renderDayCard = (day: Day) => {
    const idx = day.number - 1;
    const dayAccepted = day.activities.filter(a => a.status === 'accepted').length;
    const otherDays = days.filter(d => d.number !== day.number).map(d => ({ number: d.number, title: d.title }));
    const dayDate = formatDayDate(startDate, idx, locale);

    return (
      <div key={day.number} data-day-id={day.id ?? String(day.number)} ref={attachRef} style={{ marginBottom: 8 }}>
        <div style={{
          background: day.confirmed ? 'rgba(22,163,74,0.02)' : '#fff',
          borderRadius: 14,
          border: `1px solid ${day.confirmed ? 'rgba(22,163,74,0.25)' : 'rgba(0,68,123,0.08)'}`,
          boxShadow: '0 1px 6px rgba(0,68,123,0.05)',
          transition: 'border-color 0.2s, background 0.2s',
          overflow: 'hidden',
        }}>
          <div
            onClick={() => toggleDay(day.number)}
            style={{ cursor: 'pointer', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span style={{ background: '#FF8210', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12, padding: '3px 11px', borderRadius: 100, flexShrink: 0 }}>
              {t('day.badge', { n: day.number })}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#00447B', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {day.title}
              </p>
              {dayDate && (
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#6C6D6F', margin: '1px 0 0' }}>
                  {dayDate}
                </p>
              )}
            </div>
            {day.confirmed && (
              <span style={{ background: 'rgba(22,163,74,0.12)', color: '#16A34A', fontSize: 10, fontFamily: "'Inter',sans-serif", fontWeight: 700, padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>
                ✓ {t('day.confirmed')}
              </span>
            )}
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#6C6D6F', flexShrink: 0 }}>
              {dayAccepted}/{day.activities.length}
            </span>
            {!readOnly && regenEnabled && onRegenerateDay && (
              <button
                onClick={(e) => { e.stopPropagation(); onRegenerateDay(day.number); }}
                title={`Regenerate Day ${day.number}`}
                style={{
                  background: 'rgba(0,68,123,0.06)',
                  border: '1px solid rgba(0,68,123,0.14)',
                  color: '#00447B', borderRadius: 100,
                  width: 26, height: 26,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, flexShrink: 0,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,68,123,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,68,123,0.06)'; }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8a6 6 0 1 1-2.5-4.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                  <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={{ color: '#6C6D6F', flexShrink: 0, transform: day.open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms' }}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>


          {day.open && (
            <div style={{ padding: '14px 14px 16px' }}>
              {SLOTS.map(({ key, label, icon }) => {
                const slotActs = day.activities.filter(a => a.slot === key);
                const containerId = slotId(day.number, key);
                return (
                  <TimeSlotSection
                    key={key}
                    containerId={containerId}
                    slotKey={key}
                    label={label}
                    icon={icon}
                    activities={slotActs}
                    activeId={activeId}
                    onAccept={(id) => setActivityStatus(day.number, id, 'accepted')}
                    onDecline={(id) => setActivityStatus(day.number, id, 'declined')}
                    otherDays={otherDays}
                    onMoveToDay={(actId, toDayNum) => moveActivityToDay(actId, day.number, toDayNum)}
                    readOnly={readOnly}
                    commentConfig={commentConfig}
                    dayId={day.id}
                    cityContext={destination}
                  />
                );
              })}

              {!readOnly && day.suggestions.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>💡 Extra Ideas for Day {day.number}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {day.suggestions.map(sug => (
                      <SuggestionCard
                        key={sug.id}
                        sug={sug}
                        onAccept={() => acceptSuggestion(day.number, sug)}
                        onDecline={() => declineSuggestion(day.number, sug.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {!readOnly && (
                <button
                  onClick={() => fetchMoreIdeas(day.number)}
                  disabled={day.loadingMore}
                  style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: '1.5px dashed rgba(0,68,123,0.22)', borderRadius: 100, padding: '7px 16px', cursor: day.loadingMore ? 'default' : 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12, color: '#00447B', transition: 'background 0.15s', opacity: day.loadingMore ? 0.6 : 1 }}
                  onMouseEnter={e => { if (!day.loadingMore) e.currentTarget.style.background = 'rgba(0,68,123,0.04)'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  {day.loadingMore ? <><InlineSpinner /> Finding ideas...</> : <><span style={{ fontSize: 15 }}>+</span> {t('itinerary.moreIdeas')}</>}
                </button>
              )}

              {!readOnly && (
                <button
                  onClick={() => toggleConfirmed(day.number)}
                  style={{
                    marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: day.confirmed ? 'rgba(22,163,74,0.10)' : 'rgba(0,68,123,0.04)',
                    color: day.confirmed ? '#16A34A' : '#00447B',
                    border: `1.5px solid ${day.confirmed ? 'rgba(22,163,74,0.30)' : 'rgba(0,68,123,0.15)'}`,
                    borderRadius: 10, padding: '10px 0',
                    fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {day.confirmed ? `✓ ${t('itinerary.dayAccepted')}` : `✓ ${t('itinerary.acceptDay')}`}
                </button>
              )}

              <DayNotes
                dayIndex={idx}
                initialNote={day.notes || ''}
                onSave={handleNoteChange}
                readOnly={readOnly}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div onMouseOver={onPlaceHover} onMouseLeave={onPlaceLeave}>

      {/* ── Counters + progress bar ── */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px 14px', marginBottom: 16, border: '1px solid rgba(0,68,123,0.08)', boxShadow: '0 1px 8px rgba(0,68,123,0.05)' }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
          <StatPill color="#16A34A" bg="rgba(22,163,74,0.12)"  icon="✓">{accepted} {t('itinerary.accepted')}</StatPill>
          <StatPill color="#DC2626" bg="rgba(220,38,38,0.10)"  icon="✕">{declined} {t('itinerary.removed')}</StatPill>
          <StatPill color="#6C6D6F" bg="rgba(0,68,123,0.07)"   icon="○">{pending} {t('itinerary.toReview')}</StatPill>
          <span style={{ marginLeft: 'auto', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 700, color: '#00447B' }}>{progress}{t('itinerary.percentAccepted')}</span>
        </div>
        <div style={{ height: 7, background: 'rgba(0,68,123,0.08)', borderRadius: 100, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#16A34A,#4ADE80)', borderRadius: 100, transition: 'width 0.4s ease' }} />
        </div>
        {/* Days confirmed row */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#6C6D6F' }}>
            {confirmedDays === 0
              ? t('itinerary.acceptPrompt')
              : t('itinerary.daysConfirmed', { n: confirmedDays, total: days.length })}
          </span>
          {!readOnly && (
            <button
              onClick={() => allConfirmed && setShowFinalModal(true)}
              disabled={!allConfirmed}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: allConfirmed ? 'linear-gradient(135deg,#FF8210,#FF6B00)' : 'rgba(0,68,123,0.07)',
                color: allConfirmed ? '#fff' : 'rgba(0,68,123,0.35)',
                border: 'none', borderRadius: 100, padding: '8px 18px',
                fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12,
                cursor: allConfirmed ? 'pointer' : 'default',
                transition: 'all 0.2s',
                boxShadow: allConfirmed ? '0 4px 14px rgba(255,130,16,0.35)' : 'none',
              }}
            >
              🏁 {t('finalize')}
            </button>
          )}
        </div>
      </div>

      {/* ── DnD context wraps phases + day cards ── */}
      <DndContext
        id={instanceId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {phases.length > 0 && !phasesDismissed ? (
          <>
            {phases
              .slice()
              .sort((a, b) => a.dayFrom - b.dayFrom)
              .map(phase => {
                const phaseDays = days
                  .filter(d => d.phase_id === phase.id)
                  .sort((a, b) => a.number - b.number);
                return (
                  <div key={phase.id} style={{ marginBottom: 12 }}>
                    <PhaseCard
                      phase={phase}
                      plannedDaysCount={phaseDays.length}
                      tripDays={tripDays}
                      collapsed={collapsedPhaseIds.has(phase.id)}
                      onToggleCollapse={() => togglePhase(phase.id)}
                      onGeneratePlan={readOnly ? undefined : () => handleGeneratePhase(phase)}
                      onEditLabel={readOnly ? undefined : (lbl) => updatePhaseLabel(phase.id, lbl)}
                      onEditRange={readOnly ? undefined : (from, to) => updatePhaseRange(phase.id, from, to)}
                      onDeletePhase={readOnly ? undefined : () => deletePhase(phase.id)}
                      onDismissPhases={!readOnly && tripLengthMode === 'medium' ? () => setPhasesDismissed(true) : undefined}
                      tripLengthMode={tripLengthMode}
                      initialLabelEditing={!readOnly && phase.id === newPhaseId}
                    />
                    {!collapsedPhaseIds.has(phase.id) && phaseDays.map(day => renderDayCard(day))}
                  </div>
                );
              })
            }
            {!readOnly && <AddPhaseButton onAdd={createNewPhase} />}
          </>
        ) : (
          days.map(day => renderDayCard(day))
        )}

        {/* Drag overlay — ghost card */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeActivity && (
            <div style={{
              padding: '9px 12px', borderRadius: 10, background: '#fff',
              border: '2px dashed #00447B', opacity: 0.85,
              boxShadow: '0 8px 28px rgba(0,68,123,0.18)',
              fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.65, color: '#333',
            }}
              dangerouslySetInnerHTML={{ __html: inlineMd(activeActivity.text.split('\n')[0]) }}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Final Itinerary Modal */}
      {showFinalModal && (
        <FinalItineraryModal
          days={days}
          destination={destination}
          acceptedHotels={acceptedHotels}
          onClose={() => setShowFinalModal(false)}
        />
      )}
    </div>
  );
});

export default EditableItinerary;

/* ─── renderActivityParts ───────────────────────────────────── */
interface ActivityTriggerConfig {
  query: string;
  cityContext: string;
}

function renderActivityParts(text: string, declined: boolean, triggerConfig?: ActivityTriggerConfig) {
  const parts = text.split('\n');
  const pStyle = {
    fontFamily: "'Inter',sans-serif",
    fontSize: 13,
    lineHeight: 1.65,
    color: '#333',
    margin: 0,
    textDecoration: declined ? 'line-through' : 'none',
  } as const;

  if (parts.length < 2) {
    if (triggerConfig) {
      const cleanTitle = text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      return (
        <p style={pStyle}>
          <PlacePreviewTrigger query={triggerConfig.query} cityContext={triggerConfig.cityContext}>
            {cleanTitle}
          </PlacePreviewTrigger>
        </p>
      );
    }
    return <p style={pStyle} dangerouslySetInnerHTML={{ __html: inlineMd(text) }} />;
  }

  const [title, description, duration] = parts;
  const titleEl = triggerConfig
    ? (
        <PlacePreviewTrigger query={triggerConfig.query} cityContext={triggerConfig.cityContext}>
          {title.replace(/\*\*/g, '').replace(/\*/g, '').trim()}
        </PlacePreviewTrigger>
      )
    : <span dangerouslySetInnerHTML={{ __html: inlineMd(title) }} />;

  return (
    <p style={pStyle}>
      {titleEl}
      {description && (
        <span style={{ display: 'block', color: '#555', fontSize: '0.85em', marginTop: 2 }}>
          {description}
        </span>
      )}
      {duration && (
        <span style={{ display: 'block', color: '#6C6D6F', fontSize: '0.78em', marginTop: 2 }}>
          {duration}
        </span>
      )}
    </p>
  );
}

/* ─── TimeSlotSection ────────────────────────────────────────── */
function TimeSlotSection({
  containerId, slotKey, label, icon, activities, activeId,
  onAccept, onDecline, otherDays, onMoveToDay, readOnly = false,
  commentConfig, dayId, cityContext,
}: {
  containerId: string;
  slotKey: TimeSlot;
  label: string;
  icon: string;
  activities: Activity[];
  activeId: UniqueIdentifier | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  otherDays: { number: number; title: string }[];
  onMoveToDay: (actId: string, toDayNum: number) => void;
  readOnly?: boolean;
  commentConfig?: CommentConfig;
  dayId?: string;
  cityContext?: string;
}) {
  const t = useTranslations('plan');
  const ids = activities.map(a => a.id);

  return (
    <div style={{ marginBottom: 10 }}>
      {/* Section header — never draggable */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 4px 6px', marginBottom: 4, borderBottom: '1px solid rgba(0,68,123,0.07)' }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#00447B', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t(`timeOfDay.${slotKey}` as Parameters<typeof t>[0])}</span>
        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 500, fontSize: 11, color: '#9CA3AF', textTransform: 'none', letterSpacing: 'normal' }}>
          {'\u00B7'} {formatSlotHours(slotKey as SlotName)}
        </span>
      </div>

      <SortableContext id={containerId} items={ids} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: 36 }}>
          {activities.length === 0
            ? <EmptyDropZone containerId={containerId} />
            : activities.map(act => (
                <SortableActivityItem
                  key={act.id}
                  act={act}
                  isDragging={act.id === activeId}
                  onAccept={() => onAccept(act.id)}
                  onDecline={() => onDecline(act.id)}
                  otherDays={otherDays}
                  onMoveToDay={(toDayNum) => onMoveToDay(act.id, toDayNum)}
                  readOnly={readOnly}
                  commentConfig={commentConfig}
                  dayId={dayId}
                  cityContext={cityContext}
                />
              ))
          }
        </div>
      </SortableContext>
    </div>
  );
}

/* ─── EmptyDropZone ──────────────────────────────────────────── */
import { useDroppable } from '@dnd-kit/core';
function EmptyDropZone({ containerId }: { containerId: string }) {
  const { isOver, setNodeRef } = useDroppable({ id: containerId });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 36, borderRadius: 8,
        border: `1.5px dashed ${isOver ? '#00447B' : 'rgba(0,68,123,0.14)'}`,
        background: isOver ? 'rgba(0,68,123,0.04)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: isOver ? '#00447B' : 'rgba(0,68,123,0.30)' }}>
        {isOver ? 'Drop here' : 'No activities — drag here'}
      </span>
    </div>
  );
}

/* ─── SortableActivityItem ───────────────────────────────────── */
function SortableActivityItem({
  act, isDragging, onAccept, onDecline, otherDays, onMoveToDay, readOnly = false,
  commentConfig, dayId, cityContext,
}: {
  act: Activity;
  isDragging: boolean;
  onAccept: () => void;
  onDecline: () => void;
  otherDays: { number: number; title: string }[];
  onMoveToDay: (toDayNum: number) => void;
  readOnly?: boolean;
  commentConfig?: CommentConfig;
  dayId?: string;
  cityContext?: string;
}) {
  const t = useTranslations('plan');
  const [showMovePicker, setShowMovePicker] = useState(false);
  const [commentExpanded, setCommentExpanded] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id: act.id, disabled: readOnly });

  const filteredComments = commentConfig
    ? commentConfig.comments.filter(c => c.target_type === 'activity' && c.target_id === act.id)
    : [];
  const visibleComments = showAllComments || filteredComments.length <= 5
    ? filteredComments : filteredComments.slice(-5);
  const hiddenCount = filteredComments.length - visibleComments.length;

  // Close picker when clicking outside
  useEffect(() => {
    if (!showMovePicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowMovePicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMovePicker]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const placePreviewEnabled = process.env.NEXT_PUBLIC_PLACE_PREVIEW_ENABLED !== 'false';
  const triggerConfig: ActivityTriggerConfig | undefined = (() => {
    if (!placePreviewEnabled || !cityContext) return undefined;
    const query = cleanActivityQuery(act.text);
    if (!isResolvableQuery(query)) return undefined;
    return { query, cityContext };
  })();

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={setNodeRef}
        style={{
          ...style,
          display: 'flex', alignItems: 'flex-start', gap: 6,
          padding: '9px 10px', borderRadius: 10,
          borderLeft: `3px solid ${act.status === 'accepted' ? '#16A34A' : act.status === 'declined' ? 'rgba(220,38,38,0.3)' : (act.manuallyAdded || act.lunaAdded) ? '#FF8210' : 'rgba(0,68,123,0.12)'}`,
          border: isOver ? '2px dashed #00447B' : undefined,
          background: isOver
            ? 'rgba(0,68,123,0.05)'
            : act.status === 'accepted' ? 'rgba(22,163,74,0.04)'
            : act.status === 'declined' ? 'rgba(220,38,38,0.03)'
            : (act.manuallyAdded || act.lunaAdded) ? 'rgba(255,130,16,0.04)'
            : '#F9FAFB',
          opacity: act.status === 'declined' ? (isDragging ? 0.2 : 0.5) : (isDragging ? 0.35 : 1),
          transition: 'background 0.15s, border 0.15s, opacity 0.15s',
        }}
      >
        {/* Drag handle */}
        {!readOnly && (
          <span
            {...attributes}
            {...listeners}
            title="Drag to reorder"
            style={{ color: 'rgba(0,68,123,0.30)', fontSize: 16, cursor: 'grab', flexShrink: 0, paddingTop: 2, userSelect: 'none', touchAction: 'none', lineHeight: 1 }}
          >⠿</span>
        )}

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {renderActivityParts(act.text, act.status === 'declined', triggerConfig)}
          {act.manuallyAdded && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#FF8210', fontWeight: 600, letterSpacing: 0.3 }}>✦ {t('activity.addedByYou')}</span>
          )}
          {act.lunaAdded && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#FF8210', fontWeight: 600, letterSpacing: 0.3 }}>✦ {t('activity.addedByLuna')}</span>
          )}
        </div>

        {/* Comment / Move to day / Accept / Decline */}
        {(commentConfig || !readOnly) && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2, alignItems: 'flex-start' }}>
            {commentConfig && dayId && (
              <div onPointerDown={(e) => e.stopPropagation()}>
                <CommentIcon
                  count={filteredComments.length}
                  isExpanded={commentExpanded}
                  onClick={(e) => { e.stopPropagation(); setCommentExpanded(v => !v); }}
                />
              </div>
            )}
            {!readOnly && (
              <>
                {otherDays.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMovePicker(v => !v); }}
                    onPointerDown={(e) => e.stopPropagation()}
                    title={t('activity.moveToAnotherDay')}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', border: 'none',
                      cursor: 'pointer', fontSize: 12, background: showMovePicker ? 'rgba(0,68,123,0.15)' : 'rgba(0,68,123,0.07)',
                      color: '#00447B', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}
                  >→</button>
                )}
                <RoundBtn active={act.status === 'accepted'} activeColor="#16A34A" idleColor="rgba(22,163,74,0.12)" onClick={onAccept} label={t('activity.accept')} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>✓</RoundBtn>
                <RoundBtn active={act.status === 'declined'} activeColor="#DC2626" idleColor="rgba(220,38,38,0.10)" onClick={onDecline} label={t('activity.remove')} onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>✕</RoundBtn>
              </>
            )}
          </div>
        )}
      </div>

      {/* Comment thread panel — below the activity card */}
      {commentConfig && dayId && commentExpanded && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            marginTop: 6, padding: '10px 12px',
            background: 'rgba(0,68,123,0.03)',
            border: '1px solid rgba(0,68,123,0.10)',
            borderRadius: 10,
          }}
        >
          {filteredComments.length === 0 && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#9CA3AF', margin: '0 0 8px', textAlign: 'center' }}>
              {t('comments.noComments')}
            </p>
          )}
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllComments(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#00447B', padding: '0 0 8px', textDecoration: 'underline' }}
            >
              {t('comments.showMore', { count: hiddenCount })}
            </button>
          )}
          {visibleComments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={commentConfig.currentUserId}
              isOwner={commentConfig.isOwner}
              tripId={commentConfig.tripId}
              onUpdated={commentConfig.onRefresh}
              emitPatch={commentConfig.emitPatch}
              saveLabel={t('comments.save')}
              cancelLabel={t('comments.cancel')}
              editLabel={t('comments.edit')}
              deleteLabel={t('comments.delete')}
              deleteConfirmText={t('comments.deleteConfirm')}
            />
          ))}
          <CommentCompose
            tripId={commentConfig.tripId}
            targetType="activity"
            targetId={act.id}
            originalDayId={dayId}
            onSubmitted={(commentId) => {
              commentConfig.onRefresh();
              if (commentId) {
                commentConfig.emitPatch?.({ type: 'add_comment', commentId, targetType: 'activity', targetId: act.id, commentText: '' });
              }
            }}
            placeholder={t('comments.placeholder')}
            submitLabel={t('comments.submit')}
          />
        </div>
      )}

      {/* Move to day picker */}
      {!readOnly && showMovePicker && (
        <div ref={pickerRef} style={{
          position: 'absolute', right: 0, top: '100%', zIndex: 50,
          background: '#fff', border: '1.5px solid rgba(0,68,123,0.15)',
          borderRadius: 12, boxShadow: '0 8px 28px rgba(0,68,123,0.14)',
          padding: '8px', minWidth: 200, marginTop: 4,
        }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#6C6D6F', margin: '0 6px 6px', textTransform: 'uppercase', letterSpacing: 0.4 }}>{t('activity.moveTo')}</p>
          {otherDays.map(d => (
            <button
              key={d.number}
              onClick={() => { onMoveToDay(d.number); setShowMovePicker(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'none', border: 'none', borderRadius: 8, padding: '7px 10px',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,68,123,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ background: '#FF8210', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 10, padding: '2px 7px', borderRadius: 100, flexShrink: 0 }}>{t('day.badge', { n: d.number })}</span>
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

/* ─── SuggestionCard ─────────────────────────────────────────── */
function SuggestionCard({ sug, onAccept, onDecline }: { sug: Suggestion; onAccept: () => void; onDecline: () => void }) {
  const t = useTranslations('plan');
  return (
    <div style={{ border: '1.5px solid rgba(255,130,16,0.22)', borderRadius: 12, background: 'rgba(255,247,237,0.6)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, color: '#C2410C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sug.title}</p>
          {sug.timing && <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9A6700', margin: 0 }}>🕐 {sug.timing}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onAccept} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12 }}>✓ {t('activity.addToPlan')}</button>
          <button onClick={onDecline} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(220,38,38,0.10)', color: '#DC2626', border: 'none', borderRadius: 100, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12 }}>✕</button>
        </div>
      </div>
      <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#555', lineHeight: 1.65, margin: 0, padding: '0 14px 12px' }}>{sug.description}</p>
    </div>
  );
}

/* ─── Tiny reusable bits ─────────────────────────────────────── */
function StatPill({ color, bg, icon, children }: { color: string; bg: string; icon: string; children: React.ReactNode }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color }}>
      <span style={{ width: 22, height: 22, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{icon}</span>
      {children}
    </span>
  );
}

function RoundBtn({ active, activeColor, idleColor, onClick, onPointerDown, label, children }: { active: boolean; activeColor: string; idleColor: string; onClick: () => void; onPointerDown?: (e: React.PointerEvent) => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} onPointerDown={onPointerDown} title={label} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: active ? activeColor : idleColor, color: active ? '#fff' : activeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
      {children}
    </button>
  );
}

function InlineSpinner() {
  return <span style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(0,68,123,0.15)', borderTop: '2px solid #00447B', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />;
}
