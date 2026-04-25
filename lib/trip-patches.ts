/**
 * Collaborative Trips: Patch types, generation, and application.
 *
 * A Patch is a typed mutation envelope that describes one change to
 * a trip's data. Patches are:
 *   1. Generated on the emitting client via generatePatch().
 *   2. Applied optimistically to local state via applyPatch().
 *   3. Broadcast via Supabase Realtime (Stage 2b).
 *   4. Persisted to trip_activity_log server-side (Stage 2b helper).
 *   5. Merged into saved_trips.trip_data on debounce (Stage 2d).
 *   6. Applied again on receiving clients after arrival (Stage 2d).
 *
 * Design rules:
 *   - All patch types are discriminated on `type`.
 *   - All functions are PURE. applyPatch returns new trip_data; it
 *     never mutates the input. This enables safe optimistic UI.
 *   - Patch envelope carries id, tripId, userId, userName, userRole,
 *     timestamp. Receiver uses id for dedup and timestamp for LWW.
 *   - If a target entity does not exist (e.g. removing an activity
 *     that was already removed by a concurrent patch), applyPatch
 *     returns trip_data unchanged rather than throwing. Makes
 *     concurrent-edit resolution forgiving.
 *
 * See docs/specs/collab/01-technical-spec.md Section 3.5 and Appendix C.
 */

import type { CollabRole } from '@/lib/collaboration';

// ─────────────────────────────────────────────────────────────
// Patch type union
// ─────────────────────────────────────────────────────────────

/**
 * Every kind of mutation a patch can describe. 18 types across
 * 4 categories: activities (5), notes (3), hotels (2), phases (5),
 * budget (1), comments (3), expand (1).
 *
 * If Stage 4 adds a new type, list it here AND handle it in the
 * applyPatch router. TypeScript will fail compile if you miss either.
 */
export type PatchType =
  // Activity ops
  | 'add_activity'
  | 'remove_activity'
  | 'replace_activity'
  | 'accept_activity'
  | 'unaccept_activity'
  | 'decline_activity'
  // Note ops
  | 'add_note'
  | 'update_note'
  | 'remove_note'
  // Hotel ops
  | 'add_hotel'
  | 'remove_hotel'
  // Phase ops (R5.1+)
  | 'edit_phase'
  | 'split_phase'
  | 'merge_phases'
  | 'reorder_phases'
  // Budget
  | 'update_budget'
  // R6 long-trip expansion
  | 'expand_phase'
  // Comments (Stage 4)
  | 'add_comment'
  | 'edit_comment'
  | 'delete_comment';

// ─────────────────────────────────────────────────────────────
// Per-type payload shapes. Discriminated via `type` field.
// ─────────────────────────────────────────────────────────────

export type ActivitySlot = 'morning' | 'afternoon' | 'evening' | 'night';

export type AddActivityPayload = {
  type: 'add_activity';
  dayId: string;
  slot: ActivitySlot;
  activity: {
    id: string;
    slot: ActivitySlot;
    text: string;
    status: 'pending' | 'accepted' | 'rejected';
    lunaAdded?: boolean;
    manuallyAdded?: boolean;
  };
};

export type RemoveActivityPayload = {
  type: 'remove_activity';
  dayId: string;
  activityId: string;
};

export type ReplaceActivityPayload = {
  type: 'replace_activity';
  dayId: string;
  activityId: string; // the activity being replaced (will lose its id)
  newActivity: {
    id: string; // freshly generated
    slot: ActivitySlot;
    text: string;
    status: 'pending' | 'accepted' | 'rejected';
    lunaAdded?: boolean;
    manuallyAdded?: boolean;
  };
};

export type AcceptActivityPayload = {
  type: 'accept_activity';
  dayId: string;
  activityId: string;
};

export type UnacceptActivityPayload = {
  type: 'unaccept_activity';
  dayId: string;
  activityId: string;
};

export type DeclineActivityPayload = {
  type: 'decline_activity';
  dayId: string;
  activityId: string;
};

export type AddNotePayload = {
  type: 'add_note';
  dayId: string;
  note: string;
};

export type UpdateNotePayload = {
  type: 'update_note';
  dayId: string;
  note: string;
};

export type RemoveNotePayload = {
  type: 'remove_note';
  dayId: string;
};

export type AddHotelPayload = {
  type: 'add_hotel';
  hotel: {
    id: string;
    name: string;
    stars?: number;
    neighborhood?: string;
    priceRange?: string;
    amenities?: string[];
    googleMapsQuery?: string;
    description?: string;
  };
  segment?: {
    label?: string;
    checkIn?: string;
    checkOut?: string;
    dayRange?: [number, number];
    location?: string;
  };
};

export type RemoveHotelPayload = {
  type: 'remove_hotel';
  hotelId: string;
};

export type EditPhasePayload = {
  type: 'edit_phase';
  phaseId: string;
  changes: {
    label?: string;
    dayFrom?: number;
    dayTo?: number;
    highlights?: string[];
    summary?: string;
  };
};

export type SplitPhasePayload = {
  type: 'split_phase';
  phaseId: string;
  splitAfterDay: number; // day number
  newPhaseLabel: string;
  newPhaseId: string; // freshly generated
};

export type MergePhasesPayload = {
  type: 'merge_phases';
  phaseIds: [string, string]; // [earlierPhaseId, laterPhaseId]; later loses its id
  mergedLabel?: string;
};

export type ReorderPhasesPayload = {
  type: 'reorder_phases';
  phaseIdOrder: string[]; // full ordered list
};

export type UpdateBudgetPayload = {
  type: 'update_budget';
  budget: Record<string, unknown>;
};

export type ExpandPhasePayload = {
  type: 'expand_phase';
  phaseId: string;
};

export type AddCommentPayload = {
  type: 'add_comment';
  commentId: string;
  targetType: 'activity' | 'day' | 'phase' | 'hotel';
  targetId: string;
  commentText: string;
};

export type EditCommentPayload = {
  type: 'edit_comment';
  commentId: string;
  commentText: string;
};

export type DeleteCommentPayload = {
  type: 'delete_comment';
  commentId: string;
};

export type PatchPayload =
  | AddActivityPayload
  | RemoveActivityPayload
  | ReplaceActivityPayload
  | AcceptActivityPayload
  | UnacceptActivityPayload
  | DeclineActivityPayload
  | AddNotePayload
  | UpdateNotePayload
  | RemoveNotePayload
  | AddHotelPayload
  | RemoveHotelPayload
  | EditPhasePayload
  | SplitPhasePayload
  | MergePhasesPayload
  | ReorderPhasesPayload
  | UpdateBudgetPayload
  | ExpandPhasePayload
  | AddCommentPayload
  | EditCommentPayload
  | DeleteCommentPayload;

// ─────────────────────────────────────────────────────────────
// Patch envelope
// ─────────────────────────────────────────────────────────────

/**
 * The full patch as broadcast and persisted. Envelope metadata
 * (id, tripId, userId, userName, userRole, timestamp) plus the
 * domain payload.
 */
export type Patch = {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userRole: CollabRole;
  timestamp: number;
  payload: PatchPayload;
};

// ─────────────────────────────────────────────────────────────
// Generation
// ─────────────────────────────────────────────────────────────

/**
 * Generate a fresh patch envelope. Caller provides the payload and
 * context; id and timestamp are generated here.
 */
export function generatePatch(args: {
  tripId: string;
  userId: string;
  userName: string;
  userRole: CollabRole;
  payload: PatchPayload;
}): Patch {
  return {
    id: crypto.randomUUID(),
    tripId: args.tripId,
    userId: args.userId,
    userName: args.userName,
    userRole: args.userRole,
    timestamp: Date.now(),
    payload: args.payload,
  };
}

// ─────────────────────────────────────────────────────────────
// TripData shape (minimal; matches actual production shape
// as verified via Supabase MCP on 24 April 2026)
// ─────────────────────────────────────────────────────────────

export type TripDay = {
  id: string;
  number: number;
  title?: string;
  open?: boolean;
  confirmed?: boolean;
  notes?: string;
  phase_id?: string;
  activities?: Array<{
    id: string;
    slot: ActivitySlot;
    text: string;
    status: 'pending' | 'accepted' | 'rejected';
    lunaAdded?: boolean;
    manuallyAdded?: boolean;
  }>;
  suggestions?: unknown[];
  loadingMore?: boolean;
};

export type TripPhase = {
  id: string;
  label: string;
  dayFrom: number;
  dayTo: number;
  highlights?: string[];
  summary?: string;
  planned?: boolean;
};

export type TripHotelEntry = {
  hotel: {
    id: string;
    name: string;
    [key: string]: unknown;
  };
  segment?: {
    [key: string]: unknown;
  };
};

export type PatchableTripData = {
  itineraryDays?: TripDay[];
  itineraryPhases?: TripPhase[];
  acceptedHotels?: TripHotelEntry[];
  budget?: Record<string, unknown>;
  [key: string]: unknown;
};

// ─────────────────────────────────────────────────────────────
// Apply
// ─────────────────────────────────────────────────────────────

/**
 * Apply a patch to trip_data, returning new trip_data. Input is
 * never mutated.
 *
 * If a patch targets an entity that no longer exists (e.g. a
 * remove_activity for an activity that was already removed by a
 * concurrent patch), the function returns trip_data unchanged
 * rather than throwing. This makes concurrent-edit handling
 * forgiving: the worst case is a no-op, never a crash.
 *
 * Caller is responsible for:
 *   - Dedup (checking if this.id was already applied).
 *   - LWW conflict resolution (comparing timestamps).
 *   - Persistence (broadcasting, writing to activity_log).
 */
export function applyPatch(
  tripData: PatchableTripData,
  patch: Patch
): PatchableTripData {
  const p = patch.payload;

  switch (p.type) {
    case 'add_activity':
      return applyAddActivity(tripData, p);
    case 'remove_activity':
      return applyRemoveActivity(tripData, p);
    case 'replace_activity':
      return applyReplaceActivity(tripData, p);
    case 'accept_activity':
      return applyAcceptActivity(tripData, p);
    case 'unaccept_activity':
      return applyUnacceptActivity(tripData, p);
    case 'decline_activity':
      return applyDeclineActivity(tripData, p);
    case 'add_note':
    case 'update_note':
      return applySetNote(tripData, p);
    case 'remove_note':
      return applyRemoveNote(tripData, p);
    case 'add_hotel':
      return applyAddHotel(tripData, p);
    case 'remove_hotel':
      return applyRemoveHotel(tripData, p);
    case 'edit_phase':
      return applyEditPhase(tripData, p);
    case 'split_phase':
      return applySplitPhase(tripData, p);
    case 'merge_phases':
      return applyMergePhases(tripData, p);
    case 'reorder_phases':
      return applyReorderPhases(tripData, p);
    case 'update_budget':
      return { ...tripData, budget: p.budget };
    case 'expand_phase':
      // expand_phase is a UI-only concern (R6 long-trip mode),
      // not a trip_data mutation. Returns unchanged; the hook
      // handles the UI toggle separately.
      return tripData;
    case 'add_comment':
    case 'edit_comment':
    case 'delete_comment':
      // Comments live in trip_comments, not trip_data. Receivers
      // update a separate comment store, not trip_data, so these
      // patches do not modify trip_data. Return unchanged; Stage 4
      // wires them to the comment store.
      return tripData;
    default: {
      // Exhaustiveness: TypeScript ensures all types above handled.
      const _never: never = p;
      return tripData;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Per-type apply functions
// ─────────────────────────────────────────────────────────────

function applyAddActivity(
  td: PatchableTripData,
  p: AddActivityPayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryDays)) return td;
  const days = td.itineraryDays.map((d) => {
    if (d.id !== p.dayId) return d;
    const activities = Array.isArray(d.activities) ? [...d.activities, p.activity] : [p.activity];
    return { ...d, activities };
  });
  return { ...td, itineraryDays: days };
}

function applyRemoveActivity(
  td: PatchableTripData,
  p: RemoveActivityPayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryDays)) return td;
  const days = td.itineraryDays.map((d) => {
    if (d.id !== p.dayId) return d;
    if (!Array.isArray(d.activities)) return d;
    return { ...d, activities: d.activities.filter((a) => a.id !== p.activityId) };
  });
  return { ...td, itineraryDays: days };
}

function applyReplaceActivity(
  td: PatchableTripData,
  p: ReplaceActivityPayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryDays)) return td;
  const days = td.itineraryDays.map((d) => {
    if (d.id !== p.dayId) return d;
    if (!Array.isArray(d.activities)) return d;
    const idx = d.activities.findIndex((a) => a.id === p.activityId);
    if (idx === -1) return d;
    const activities = [...d.activities];
    activities[idx] = p.newActivity;
    return { ...d, activities };
  });
  return { ...td, itineraryDays: days };
}

function applyAcceptActivity(
  td: PatchableTripData,
  p: AcceptActivityPayload
): PatchableTripData {
  return setActivityStatus(td, p.dayId, p.activityId, 'accepted');
}

function applyUnacceptActivity(
  td: PatchableTripData,
  p: UnacceptActivityPayload
): PatchableTripData {
  return setActivityStatus(td, p.dayId, p.activityId, 'pending');
}

function applyDeclineActivity(
  td: PatchableTripData,
  p: DeclineActivityPayload
): PatchableTripData {
  return setActivityStatus(td, p.dayId, p.activityId, 'rejected');
}

function setActivityStatus(
  td: PatchableTripData,
  dayId: string,
  activityId: string,
  status: 'pending' | 'accepted' | 'rejected'
): PatchableTripData {
  if (!Array.isArray(td.itineraryDays)) return td;
  const days = td.itineraryDays.map((d) => {
    if (d.id !== dayId) return d;
    if (!Array.isArray(d.activities)) return d;
    const activities = d.activities.map((a) =>
      a.id === activityId ? { ...a, status } : a
    );
    return { ...d, activities };
  });
  return { ...td, itineraryDays: days };
}

function applySetNote(
  td: PatchableTripData,
  p: AddNotePayload | UpdateNotePayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryDays)) return td;
  const days = td.itineraryDays.map((d) =>
    d.id === p.dayId ? { ...d, notes: p.note } : d
  );
  return { ...td, itineraryDays: days };
}

function applyRemoveNote(
  td: PatchableTripData,
  p: RemoveNotePayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryDays)) return td;
  const days = td.itineraryDays.map((d) => {
    if (d.id !== p.dayId) return d;
    const { notes: _drop, ...rest } = d;
    return rest as TripDay;
  });
  return { ...td, itineraryDays: days };
}

function applyAddHotel(
  td: PatchableTripData,
  p: AddHotelPayload
): PatchableTripData {
  const existing = Array.isArray(td.acceptedHotels) ? td.acceptedHotels : [];
  if (existing.some((h) => h.hotel?.id === p.hotel.id)) return td; // idempotent
  const entry: TripHotelEntry = {
    hotel: p.hotel,
    ...(p.segment ? { segment: p.segment } : {}),
  };
  return { ...td, acceptedHotels: [...existing, entry] };
}

function applyRemoveHotel(
  td: PatchableTripData,
  p: RemoveHotelPayload
): PatchableTripData {
  if (!Array.isArray(td.acceptedHotels)) return td;
  return {
    ...td,
    acceptedHotels: td.acceptedHotels.filter((h) => h.hotel?.id !== p.hotelId),
  };
}

function applyEditPhase(
  td: PatchableTripData,
  p: EditPhasePayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryPhases)) return td;
  const phases = td.itineraryPhases.map((ph) =>
    ph.id === p.phaseId ? { ...ph, ...p.changes } : ph
  );
  return { ...td, itineraryPhases: phases };
}

function applySplitPhase(
  td: PatchableTripData,
  p: SplitPhasePayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryPhases)) return td;
  const idx = td.itineraryPhases.findIndex((ph) => ph.id === p.phaseId);
  if (idx === -1) return td;
  const original = td.itineraryPhases[idx];
  if (p.splitAfterDay < original.dayFrom || p.splitAfterDay >= original.dayTo) return td;
  const updatedOriginal: TripPhase = { ...original, dayTo: p.splitAfterDay };
  const newPhase: TripPhase = {
    id: p.newPhaseId,
    label: p.newPhaseLabel,
    dayFrom: p.splitAfterDay + 1,
    dayTo: original.dayTo,
  };
  const phases = [
    ...td.itineraryPhases.slice(0, idx),
    updatedOriginal,
    newPhase,
    ...td.itineraryPhases.slice(idx + 1),
  ];
  return { ...td, itineraryPhases: phases };
}

function applyMergePhases(
  td: PatchableTripData,
  p: MergePhasesPayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryPhases)) return td;
  const [earlierId, laterId] = p.phaseIds;
  const earlier = td.itineraryPhases.find((ph) => ph.id === earlierId);
  const later = td.itineraryPhases.find((ph) => ph.id === laterId);
  if (!earlier || !later) return td;
  const merged: TripPhase = {
    ...earlier,
    label: p.mergedLabel ?? earlier.label,
    dayTo: later.dayTo,
  };
  const phases = td.itineraryPhases
    .filter((ph) => ph.id !== laterId)
    .map((ph) => (ph.id === earlierId ? merged : ph));
  return { ...td, itineraryPhases: phases };
}

function applyReorderPhases(
  td: PatchableTripData,
  p: ReorderPhasesPayload
): PatchableTripData {
  if (!Array.isArray(td.itineraryPhases)) return td;
  const byId = new Map(td.itineraryPhases.map((ph) => [ph.id, ph]));
  const reordered = p.phaseIdOrder
    .map((id) => byId.get(id))
    .filter((ph): ph is TripPhase => Boolean(ph));
  // If the order contains unknown IDs or is missing known IDs, bail rather than corrupt.
  if (reordered.length !== td.itineraryPhases.length) return td;
  return { ...td, itineraryPhases: reordered };
}

// ─────────────────────────────────────────────────────────────
// Stage 2d: Commutativity classification
// ─────────────────────────────────────────────────────────────

/**
 * Per-patch-type commutativity. Used by useCollaborativeTrip (Stage 2d)
 * to decide between optimistic-apply (commutative) and wait-for-seq
 * (non-commutative). Non-commutative patches are structural ops where
 * two simultaneous applies in different orders produce different
 * final states; we serialize them through the server's seq counter.
 *
 * Structural / non-commutative: split_phase, merge_phases, reorder_phases.
 * Everything else is commutative (LWW per entity id, or append-only).
 */
export const PATCH_COMMUTATIVITY: Record<PatchType, boolean> = {
  add_activity: true,
  remove_activity: true,
  replace_activity: true,
  accept_activity: true,
  unaccept_activity: true,
  decline_activity: true,
  add_note: true,
  update_note: true,
  remove_note: true,
  add_hotel: true,
  remove_hotel: true,
  edit_phase: true,
  split_phase: false,
  merge_phases: false,
  reorder_phases: false,
  update_budget: true,
  expand_phase: true,
  add_comment: true,
  edit_comment: true,
  delete_comment: true,
};

export function isCommutative(type: PatchType): boolean {
  return PATCH_COMMUTATIVITY[type] === true;
}
