'use client';
import { useState, useId, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import FinalItineraryModal from './FinalItineraryModal';
import DayNotes from './itinerary/DayNotes';
import PhaseCard from './PhaseCard';
import type { AcceptedHotel } from './StayTab';
import type { Phase, TripLengthMode } from '@/types';
import { formatSlotHours, type SlotName } from '@/lib/ai';
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

    days.push({ number, title, activities, open: number === 1, suggestions: [], loadingMore: false, confirmed: false });
  }

  return days;
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
}

export interface ItineraryHandle {
  addActivity: (text: string, dayNum: number, slot: TimeSlot, manuallyAdded?: boolean, lunaAdded?: boolean) => void;
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
  editPhase: (phaseId: string, patch: { label?: string; summary?: string; highlights?: string[] }) => void;
  /** R5: Split a phase into two at a given day boundary. */
  splitPhase: (
    phaseId: string,
    splitAtDay: number,
    phaseA: { id: string; label: string; summary: string; highlights: string[] },
    phaseB: { id: string; label: string; summary: string; highlights: string[] },
  ) => void;
  /** R5: Merge two adjacent phases into one. */
  mergePhases: (
    phaseIdA: string,
    phaseIdB: string,
    mergedPhase: { id: string; label: string; summary: string; highlights: string[] },
  ) => void;
  /** R5: Reorder phases (renumbers all days accordingly). */
  reorderPhases: (orderedPhaseIds: string[]) => void;
  /** R5: Remove a phase and all its days. */
  removePhase: (phaseId: string) => void;
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
}, ref) {
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
  // R6: medium mode only — user can dismiss phase overview cards.
  const [phasesDismissed, setPhasesDismissed] = useState(false);

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
    _setDays(updater);
  };
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [showFinalModal, setShowFinalModal] = useState(false);
  const instanceId = useId();

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
    addActivity(text: string, dayNum: number, slot: TimeSlot, manuallyAdded?: boolean, lunaAdded?: boolean) {
      setDays(prev => prev.map(d => {
        if (d.number !== dayNum) return d;
        const newActivity: Activity = {
          id: `d${dayNum}-chat-${Math.random().toString(36).slice(2,8)}`,
          text,
          status: 'pending',
          slot,
          manuallyAdded,
          lunaAdded,
        };
        return { ...d, activities: [...d.activities, newActivity], open: true };
      }));
    },
    removeActivitiesMatching(pattern: string) {
      const lower = pattern.toLowerCase();
      setDays(prev => prev.map(d => ({
        ...d,
        activities: d.activities.filter(a => !a.text.toLowerCase().includes(lower)),
      })));
    },
    getDays() {
      return days.map(d => ({ number: d.number, title: d.title }));
    },
    getDaysSnapshot() {
      return days;
    },
    getPhases() {
      return phases;
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
      // Only active in structured-from-stream mode.
      _setDays(prev => {
        const existing = prev.findIndex(d => d.number === day.number);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = day;
          return updated;
        }
        // Insert in order
        const insertAt = prev.findIndex(d => d.number > day.number);
        if (insertAt === -1) return [...prev, day];
        const arr = [...prev];
        arr.splice(insertAt, 0, day);
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
      // Set all structured days at once (used after full stream completion).
      _setDays(newDays);
    },
    replaceDay(dayNumber: number, newDay: Day) {
      setDays(prev => prev.map(d => d.number === dayNumber ? newDay : d));
    },
    getAcceptedActivitiesForDay(dayNumber: number) {
      const day = days.find(d => d.number === dayNumber);
      if (!day) return [];
      return day.activities
        .filter(a => a.status === 'accepted')
        .map(a => ({ timeSlot: a.slot, text: a.text.replace(/\*\*/g, '') }));
    },

    // ── R5: Phase editing imperatives ───────────────────────────────────
    editPhase(phaseId: string, patch: { label?: string; summary?: string; highlights?: string[] }) {
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
    },

    splitPhase(
      phaseId: string,
      splitAtDay: number,
      phaseA: { id: string; label: string; summary: string; highlights: string[] },
      phaseB: { id: string; label: string; summary: string; highlights: string[] },
    ) {
      const original = phases.find(p => p.id === phaseId);
      if (!original) {
        console.error('[splitPhase] no phase matched id:', phaseId, '— available IDs:', phases.map(p => p.id));
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
    },

    mergePhases(
      phaseIdA: string,
      phaseIdB: string,
      mergedPhase: { id: string; label: string; summary: string; highlights: string[] },
    ) {
      const pA = phases.find(p => p.id === phaseIdA);
      const pB = phases.find(p => p.id === phaseIdB);
      if (!pA || !pB) {
        console.error('[mergePhases] phase(s) not found — phaseIdA:', phaseIdA, 'phaseIdB:', phaseIdB, '— available IDs:', phases.map(p => p.id));
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
    },

    reorderPhases(orderedPhaseIds: string[]) {
      const phaseMap = new Map(phases.map(p => [p.id, p]));
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
        const phaseDays = days
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
    },

    removePhase(phaseId: string) {
      setPhases(prev => prev.filter(p => p.id !== phaseId));
      setDays(prev => prev.filter(d => d.phase_id !== phaseId));
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

  /* ── Drag handlers ── */
  const handleDragStart = ({ active }: DragStartEvent) => setActiveId(active.id);

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (isGuest) return;                   // guests cannot move activities
    if (!over || active.id === over.id) return;
    const from = findContainer(active.id);
    const to   = findContainer(over.id);
    if (!from || !to) return;
    if (from.dayNum !== to.dayNum) return; // cross-day drag not supported
    if (from.slot === to.slot) return;     // same slot — handled by onDragEnd

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
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (isGuest) { onGateRequired?.(); return; }
    if (!over || active.id === over.id) return;

    const from = findContainer(active.id);
    const to   = findContainer(over.id);
    if (!from || !to || from.dayNum !== to.dayNum) return;

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
  };

  /* ── Mutations ── */
  const setActivityStatus = (dayNum: number, actId: string, status: Status) => {
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        activities: d.activities.map(a =>
          a.id === actId ? { ...a, status: a.status === status ? 'pending' : status } : a
        ),
      }
    ));
    onActivityStatusChange?.();
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
    setDays(prev => prev.map(d =>
      d.number !== dayNum ? d : {
        ...d,
        suggestions: d.suggestions.filter(s => s.id !== sug.id),
        activities: [...d.activities, {
          id: `d${dayNum}-a${d.activities.length}-${Math.random().toString(36).slice(2,6)}`,
          text: `**${sug.title}** — ${sug.description}`,
          status: 'accepted',
          slot: sugSlot,
        }],
      }
    ));
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

  const toggleConfirmed = (dayNum: number) =>
    setDays(prev => prev.map(d => {
      if (d.number !== dayNum) return d;
      const nowConfirmed = !d.confirmed;
      return {
        ...d,
        confirmed: nowConfirmed,
        // When confirming, auto-accept all pending activities (leave declined as-is)
        activities: nowConfirmed
          ? d.activities.map(a => a.status === 'pending' ? { ...a, status: 'accepted' as const } : a)
          : d.activities,
      };
    }));

  const handleNoteChange = (dayIndex: number, note: string) =>
    setDays(prev => prev.map((d, i) => i === dayIndex ? { ...d, notes: note } : d));

  const activeActivity = activeId ? findActivity(activeId) : null;

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
        </div>
      </div>

      {/* ── Phase cards (7+ day trips) ── */}
      {phases.length > 0 && !phasesDismissed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {phases.map((phase, phaseIdx) => {
            const phaseDays = days.filter(d =>
              d.number >= phase.dayFrom &&
              d.number <= phase.dayTo &&
              d.activities.length > 0
            );
            const phaseActivityCount = days
              .filter(d => d.phase_id === phase.id)
              .reduce((sum, d) => sum + d.activities.filter(a => a.status !== 'declined').length, 0);
            return (
              <PhaseCard
                key={phase.id}
                phase={phase}
                plannedDaysCount={phaseDays.length}
                onPlanPhase={onPlanPhase ? () => onPlanPhase(phase) : undefined}
                onRegeneratePhase={onRegeneratePhase}
                regenEnabled={regenEnabled}
                isPlanned={phaseActivityCount > 0}
                tripLengthMode={tripLengthMode}
                onDismissPhases={tripLengthMode === 'medium' && phaseIdx === 0 ? () => setPhasesDismissed(true) : undefined}
              />
            );
          })}
        </div>
      )}

      {/* ── DnD context wraps all day cards ── */}
      <DndContext
        id={instanceId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {days.map((day, idx) => {
            const photo = photos.length > 0 ? photos[idx % photos.length] : null;
            const dayAccepted = day.activities.filter(a => a.status === 'accepted').length;
            const otherDays = days.filter(d => d.number !== day.number).map(d => ({ number: d.number, title: d.title }));

            return (
              <div key={day.number} style={{ background: day.confirmed ? 'rgba(22,163,74,0.02)' : '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${day.confirmed ? 'rgba(22,163,74,0.25)' : 'rgba(0,68,123,0.08)'}`, boxShadow: '0 2px 12px rgba(0,68,123,0.06)', transition: 'border-color 0.2s, background 0.2s' }}>

                {/* Cover photo */}
                <div onClick={() => toggleDay(day.number)} style={{ cursor: 'pointer', position: 'relative' }}>
                  {photo
                    ? <img src={photo} alt={`Day ${day.number}`} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                    : <div style={{ width: '100%', height: 80, background: GRADIENTS[idx % GRADIENTS.length] }} />
                  }
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.60) 0%,rgba(0,0,0,0.10) 60%,transparent 100%)', display: 'flex', alignItems: 'flex-end', padding: '10px 14px', gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
                      <span style={{ background: '#FF8210', color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 11, padding: '3px 10px', borderRadius: 100 }}>{t('day.badge', { n: day.number })}</span>
                      {formatDayDate(startDate, idx, locale) && (
                        <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 11, color: '#fff', marginTop: 2, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{formatDayDate(startDate, idx, locale)}</span>
                      )}
                    </div>
                    <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', flex: 1, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day.title}</p>
                    {day.confirmed && <span style={{ background: 'rgba(22,163,74,0.80)', color: '#fff', fontSize: 10, fontFamily: "'Inter',sans-serif", fontWeight: 700, padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>✓ {t('day.confirmed')}</span>}
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.70)', flexShrink: 0 }}>{dayAccepted}/{day.activities.length}</span>
                    {regenEnabled && onRegenerateDay && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onRegenerateDay(day.number); }}
                        title={`Regenerate Day ${day.number}`}
                        style={{
                          background: 'rgba(255,255,255,0.15)',
                          border: '1.5px solid rgba(255,255,255,0.35)',
                          color: '#fff', borderRadius: 100,
                          width: 28, height: 28,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', padding: 0, flexShrink: 0,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                      >
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                          <path d="M14 8a6 6 0 1 1-2.5-4.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                          <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, flexShrink: 0, display: 'inline-block', transition: 'transform 0.2s', transform: day.open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                  </div>
                </div>

                {/* Time-slot sections */}
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
                        />
                      );
                    })}

                    {/* Suggestions */}
                    {day.suggestions.length > 0 && (
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

                    {/* More ideas button */}
                    <button
                      onClick={() => fetchMoreIdeas(day.number)}
                      disabled={day.loadingMore}
                      style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'none', border: '1.5px dashed rgba(0,68,123,0.22)', borderRadius: 100, padding: '7px 16px', cursor: day.loadingMore ? 'default' : 'pointer', fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 12, color: '#00447B', transition: 'background 0.15s', opacity: day.loadingMore ? 0.6 : 1 }}
                      onMouseEnter={e => { if (!day.loadingMore) e.currentTarget.style.background = 'rgba(0,68,123,0.04)'; }}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      {day.loadingMore ? <><InlineSpinner /> Finding ideas...</> : <><span style={{ fontSize: 15 }}>+</span> {t('itinerary.moreIdeas')}</>}
                    </button>

                    {/* Accept Day button */}
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

                    <DayNotes
                      dayIndex={idx}
                      initialNote={day.notes || ''}
                      onSave={handleNoteChange}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag overlay — ghost card */}
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
          {activeActivity && (
            <div style={{
              padding: '9px 12px', borderRadius: 10, background: '#fff',
              border: '2px dashed #00447B', opacity: 0.85,
              boxShadow: '0 8px 28px rgba(0,68,123,0.18)',
              fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.65, color: '#333',
            }}
              dangerouslySetInnerHTML={{ __html: inlineMd(activeActivity.text) }}
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

/* ─── TimeSlotSection ────────────────────────────────────────── */
function TimeSlotSection({
  containerId, slotKey, label, icon, activities, activeId,
  onAccept, onDecline, otherDays, onMoveToDay,
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
  act, isDragging, onAccept, onDecline, otherDays, onMoveToDay,
}: {
  act: Activity;
  isDragging: boolean;
  onAccept: () => void;
  onDecline: () => void;
  otherDays: { number: number; title: string }[];
  onMoveToDay: (toDayNum: number) => void;
}) {
  const t = useTranslations('plan');
  const [showMovePicker, setShowMovePicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isOver } = useSortable({ id: act.id });

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
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{ color: 'rgba(0,68,123,0.30)', fontSize: 16, cursor: 'grab', flexShrink: 0, paddingTop: 2, userSelect: 'none', touchAction: 'none', lineHeight: 1 }}
        >⠿</span>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.65, color: '#333', margin: 0, textDecoration: act.status === 'declined' ? 'line-through' : 'none' }}
            dangerouslySetInnerHTML={{ __html: inlineMd(act.text) }}
          />
          {act.manuallyAdded && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#FF8210', fontWeight: 600, letterSpacing: 0.3 }}>✦ {t('activity.addedByYou')}</span>
          )}
          {act.lunaAdded && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#FF8210', fontWeight: 600, letterSpacing: 0.3 }}>✦ {t('activity.addedByLuna')}</span>
          )}
        </div>

        {/* Move to day / Accept / Decline */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2, alignItems: 'center' }}>
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
        </div>
      </div>

      {/* Move to day picker */}
      {showMovePicker && (
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
