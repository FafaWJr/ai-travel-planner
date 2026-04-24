'use client';

/**
 * useCollaborativeTrip: realtime collaboration hook for trip pages.
 *
 * DUAL-MODE BEHAVIOUR:
 *   - enabled === false: passthrough. Hook is effectively inert.
 *     Returns initialTripData as tripData, empty presence, noop
 *     emitPatch, isConnected=false. No Supabase calls.
 *   - enabled === true: authoritative. Hook subscribes to the trip
 *     channel, tracks presence, emits patches, applies received
 *     patches via the ItineraryHandle ref, debounces saves, and
 *     backfills from the activity log on reconnect.
 *
 * STAGE 2d PATCH PIPELINE:
 *   1. Local emit → applyPatchToRef (commutative: immediate;
 *      non-commutative: after seq response).
 *   2. POST /api/trips/{tripId}/patches → server inserts into
 *      trip_activity_log, returns BIGSERIAL seq.
 *   3. Broadcast via Supabase Realtime (channel 'trip:{tripId}').
 *   4. Receivers apply via the dispatcher after gap detection.
 *   5. Debounced save (5s idle) PATCHes /api/trips with
 *      materialized trip_data so page loads don't replay
 *      the whole log.
 *   6. Reconnect: GET /api/trips/{tripId}/patches?since=lastApplied.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { CollabRole } from '@/lib/collaboration';
import {
  isCommutative,
  type Patch,
  type PatchPayload,
  type PatchableTripData,
} from '@/lib/trip-patches';
import { generateEntityId } from '@/lib/trip-ids';
import {
  createTripChannel,
  TRIP_BROADCAST_EVENTS,
  type TripPresencePayload,
} from '@/lib/realtime';
import type { ItineraryHandle, Day, TimeSlot } from '@/components/EditableItinerary';
import type { AcceptedHotel } from '@/components/StayTab';

export type { CollabRole };

export type CollabPresenceUser = {
  userId: string;
  userName: string;
  userRole: CollabRole;
  avatarUrl: string | null;
  joinedAt: number;
};

export type UseCollaborativeTripArgs = {
  tripId: string;
  enabled: boolean;
  initialTripData: PatchableTripData;
  userId: string;
  userName: string;
  userRole: CollabRole;
  avatarUrl?: string | null;
  /**
   * Stage 2d: ref to the EditableItinerary instance. The hook
   * dispatches received patches to ref methods. Required when
   * enabled=true; unused when enabled=false.
   */
  itineraryRef?: React.RefObject<ItineraryHandle | null>;
  /**
   * Stage 2d: called when a hotel-level patch is received
   * (acceptedHotels lives at page level, not in EditableItinerary).
   */
  onHotelsChange?: (next: AcceptedHotel[]) => void;
  /**
   * Stage 2d: current hotels snapshot for computing next state on
   * received hotel patches.
   */
  currentHotels?: AcceptedHotel[];
};

export type UseCollaborativeTripReturn = {
  tripData: PatchableTripData;
  presence: CollabPresenceUser[];
  isConnected: boolean;
  enabled: boolean;
  emitPatch: (payload: PatchPayload) => void;
};

const EMPTY_PRESENCE: CollabPresenceUser[] = [];

/**
 * Resolve a day number from a day id by scanning the current
 * itinerary snapshot. Returns null if not found.
 */
function dayIdToNumber(
  itineraryRef: React.RefObject<ItineraryHandle | null> | undefined,
  dayId: string
): number | null {
  const handle = itineraryRef?.current;
  if (!handle) return null;
  const days = handle.getDaysSnapshot() as Day[];
  const match = days.find((d) => d.id === dayId);
  return match ? match.number : null;
}

/**
 * Dispatch a received patch to the correct ItineraryHandle method
 * (or page-level hotel callback). Missing handle methods are
 * gracefully skipped via optional chaining.
 */
function applyPatchToRef(
  patch: Patch,
  itineraryRef: React.RefObject<ItineraryHandle | null> | undefined,
  currentHotels: AcceptedHotel[] | undefined,
  onHotelsChange: ((next: AcceptedHotel[]) => void) | undefined
): void {
  const handle = itineraryRef?.current;
  const p = patch.payload;

  // Stage 2d hotfix #1: every handle call from this dispatcher passes
  // suppressEmit:true so the receive path mutates locally without
  // re-broadcasting (which would create a ping-pong loop with the
  // remote client that emitted this patch in the first place).
  const SUPPRESS = { suppressEmit: true } as const;

  switch (p.type) {
    case 'add_activity': {
      const dayNum = dayIdToNumber(itineraryRef, p.dayId);
      if (dayNum == null) return;
      handle?.addActivity(p.activity.text, dayNum, p.slot, p.activity.manuallyAdded, p.activity.lunaAdded, SUPPRESS);
      break;
    }
    case 'remove_activity':
      handle?.removeActivityById?.(p.activityId, SUPPRESS);
      break;
    case 'replace_activity': {
      const dayNum = dayIdToNumber(itineraryRef, p.dayId);
      if (dayNum == null) return;
      handle?.replaceActivityById?.(p.activityId, {
        text: p.newActivity.text,
        slot: p.newActivity.slot as TimeSlot,
        manuallyAdded: p.newActivity.manuallyAdded,
        lunaAdded: p.newActivity.lunaAdded,
      }, SUPPRESS);
      break;
    }
    case 'accept_activity':
      handle?.editActivityById?.(p.activityId, { status: 'accepted' }, SUPPRESS);
      break;
    case 'unaccept_activity':
      handle?.editActivityById?.(p.activityId, { status: 'pending' }, SUPPRESS);
      break;
    case 'add_note':
    case 'update_note': {
      const dayNum = dayIdToNumber(itineraryRef, p.dayId);
      if (dayNum != null) handle?.setNoteForDay?.(dayNum, p.note, SUPPRESS);
      break;
    }
    case 'remove_note': {
      const dayNum = dayIdToNumber(itineraryRef, p.dayId);
      if (dayNum != null) handle?.setNoteForDay?.(dayNum, '', SUPPRESS);
      break;
    }
    case 'add_hotel': {
      if (!onHotelsChange || !currentHotels) return;
      // Dedup on hotel id
      if (currentHotels.some((h) => h.hotel.id === p.hotel.id)) return;
      const entry = {
        hotel: p.hotel,
        segment: p.segment ?? {},
      } as AcceptedHotel;
      onHotelsChange([...currentHotels, entry]);
      break;
    }
    case 'remove_hotel': {
      if (!onHotelsChange || !currentHotels) return;
      onHotelsChange(currentHotels.filter((h) => h.hotel.id !== p.hotelId));
      break;
    }
    case 'edit_phase':
      handle?.editPhase(p.phaseId, p.changes, SUPPRESS);
      break;
    case 'split_phase':
      // Bridge my Patch payload shape (splitAfterDay, newPhaseId, newPhaseLabel)
      // to the ref's splitPhase(phaseId, splitAtDay, phaseA, phaseB) signature.
      handle?.splitPhase(
        p.phaseId,
        p.splitAfterDay + 1, // splitAtDay is the first day of phaseB
        { id: p.phaseId, label: '', summary: '', highlights: [] },
        { id: p.newPhaseId, label: p.newPhaseLabel, summary: '', highlights: [] },
        SUPPRESS,
      );
      break;
    case 'merge_phases':
      handle?.mergePhases(
        p.phaseIds[0],
        p.phaseIds[1],
        { id: p.phaseIds[0], label: p.mergedLabel ?? '', summary: '', highlights: [] },
        SUPPRESS,
      );
      break;
    case 'reorder_phases':
      handle?.reorderPhases(p.phaseIdOrder, SUPPRESS);
      break;
    case 'update_budget':
      // Budget lives in trip_data; not wired through the ref yet.
      // Stage 2e can add a page-level onBudgetChange callback if
      // realtime budget sync is needed. Deferred.
      break;
    case 'expand_phase':
      // UI-only; per-user state. Not synced via ref.
      break;
    case 'add_comment':
    case 'edit_comment':
    case 'delete_comment':
      // Comments live in trip_comments and are rendered by Stage 4
      // via a separate subscription. This dispatcher is a no-op.
      break;
    default: {
      const _never: never = p;
      void _never;
    }
  }
}

export function useCollaborativeTrip(
  args: UseCollaborativeTripArgs
): UseCollaborativeTripReturn {
  const {
    tripId,
    initialTripData,
    userId,
    userName,
    userRole,
    avatarUrl,
    enabled,
    itineraryRef,
    onHotelsChange,
    currentHotels,
  } = args;

  const [tripData] = useState<PatchableTripData>(initialTripData);
  const [presence, setPresence] = useState<CollabPresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const emittedPatchIdsRef = useRef<Set<string>>(new Set());
  const emittedSeqsRef = useRef<Set<number>>(new Set());
  const lastAppliedSeqRef = useRef<number>(0);
  const debouncedSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef<boolean>(false);
  const wasConnectedRef = useRef<boolean>(false);
  // Stage 2d hotfix #1: defense-in-depth rate limit. 10 emits per 5s
  // triggers a 2s backoff during which new emits are dropped. Caps
  // blast radius of any future runaway loop that slips past the
  // primary suppressEmit fix.
  const emitTimestampsRef = useRef<number[]>([]);
  const throttleBackoffUntilRef = useRef<number>(0);
  // Stage 2d hotfix #1: rapid-duplicate tripwire. Two identical payloads
  // received within 2s suggests a ping-pong variant.
  const recentReceivedRef = useRef<Array<{ key: string; at: number }>>([]);

  // Keep latest hotel state and callback in refs so emitPatch and
  // the broadcast handler (captured once per subscription) see fresh values.
  const currentHotelsRef = useRef(currentHotels);
  const onHotelsChangeRef = useRef(onHotelsChange);
  const itineraryHandleRef = useRef(itineraryRef);
  useEffect(() => { currentHotelsRef.current = currentHotels; }, [currentHotels]);
  useEffect(() => { onHotelsChangeRef.current = onHotelsChange; }, [onHotelsChange]);
  useEffect(() => { itineraryHandleRef.current = itineraryRef; }, [itineraryRef]);

  // Schedule a debounced PATCH /api/trips with materialized trip_data.
  const scheduleDebouncedSave = useCallback(() => {
    if (!enabled) return;
    if (debouncedSaveTimerRef.current) clearTimeout(debouncedSaveTimerRef.current);
    debouncedSaveTimerRef.current = setTimeout(async () => {
      if (!dirtyRef.current) return;
      dirtyRef.current = false;
      const handle = itineraryHandleRef.current?.current;
      if (!handle) return;
      const days = handle.getDaysSnapshot();
      const phases = handle.getPhases();
      const hotels = currentHotelsRef.current ?? [];
      try {
        await fetch(`/api/trips`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tripId,
            trip_data: {
              itineraryDays: days,
              itineraryPhases: phases,
              acceptedHotels: hotels,
            },
          }),
        });
      } catch (err) {
        console.error('[useCollaborativeTrip] debounced save failed:', err);
        dirtyRef.current = true;
      }
    }, 5000);
  }, [enabled, tripId]);

  // Backfill missed patches from the server's activity log.
  const backfillFromApi = useCallback(async (sinceSeq: number): Promise<void> => {
    try {
      const res = await fetch(`/api/trips/${tripId}/patches?since=${sinceSeq}`);
      if (!res.ok) {
        console.error('[useCollaborativeTrip] backfill fetch failed:', res.status);
        return;
      }
      const body = await res.json() as { patches: Array<{ seq: number; payload: Patch }>; truncated: boolean };
      for (const entry of body.patches) {
        if (emittedSeqsRef.current.has(entry.seq)) continue;
        try {
          applyPatchToRef(
            entry.payload,
            itineraryHandleRef.current,
            currentHotelsRef.current,
            onHotelsChangeRef.current,
          );
          if (entry.seq > lastAppliedSeqRef.current) {
            lastAppliedSeqRef.current = entry.seq;
          }
        } catch (err) {
          console.error('[useCollaborativeTrip] backfill apply failed for seq', entry.seq, err);
        }
      }
      if (body.truncated) {
        console.warn('[useCollaborativeTrip] backfill truncated (>500 patches); recommend reload');
      }
    } catch (err) {
      console.error('[useCollaborativeTrip] backfill error:', err);
    }
  }, [tripId]);

  // Real emitPatch. Apply → POST → Broadcast → schedule save.
  const emitPatch = useCallback(async (payload: PatchPayload) => {
    if (!enabled) return;

    // Stage 2d hotfix #1: rate limit. 10 emits in 5s triggers 2s backoff.
    const now = Date.now();
    if (now < throttleBackoffUntilRef.current) {
      console.warn(
        '[useCollaborativeTrip] emitPatch throttled (in backoff). Dropped patch:',
        payload.type
      );
      return;
    }
    emitTimestampsRef.current = emitTimestampsRef.current.filter(t => now - t < 5000);
    if (emitTimestampsRef.current.length >= 10) {
      throttleBackoffUntilRef.current = now + 2000;
      console.error(
        '[useCollaborativeTrip] Runaway emit detected. Entering 2s backoff. Recent count:',
        emitTimestampsRef.current.length,
        'current patch type:',
        payload.type
      );
      return;
    }
    emitTimestampsRef.current.push(now);

    const patch: Patch = {
      id: generateEntityId(),
      tripId,
      userId,
      userName,
      userRole,
      timestamp: Date.now(),
      payload,
    };

    emittedPatchIdsRef.current.add(patch.id);
    const commutative = isCommutative(payload.type);

    // Commutative: apply locally first so the UI responds immediately.
    // The local apply came from the user's own action (via ItineraryHandle),
    // so for same-tab emissions the state is already updated; this branch
    // is mainly useful for programmatic emissions.
    if (commutative) {
      try {
        applyPatchToRef(patch, itineraryHandleRef.current, currentHotelsRef.current, onHotelsChangeRef.current);
      } catch (err) {
        console.error('[useCollaborativeTrip] local commutative apply failed:', err);
      }
    }

    // POST to log. Server assigns seq.
    let assignedSeq: number | null = null;
    try {
      const res = await fetch(`/api/trips/${tripId}/patches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patch }),
      });
      if (!res.ok) {
        console.error('[useCollaborativeTrip] emitPatch POST failed:', res.status);
        return;
      }
      const body = await res.json();
      assignedSeq = body.seq as number;
    } catch (err) {
      console.error('[useCollaborativeTrip] emitPatch POST error:', err);
      return;
    }

    if (assignedSeq !== null) {
      emittedSeqsRef.current.add(assignedSeq);
      if (assignedSeq > lastAppliedSeqRef.current) {
        lastAppliedSeqRef.current = assignedSeq;
      }
    }

    // Non-commutative: apply locally only after we have the seq.
    if (!commutative) {
      try {
        applyPatchToRef(patch, itineraryHandleRef.current, currentHotelsRef.current, onHotelsChangeRef.current);
      } catch (err) {
        console.error('[useCollaborativeTrip] non-commutative apply failed:', err);
      }
    }

    // Broadcast to other clients. self:false ensures we don't receive
    // our own echo, but emittedPatchIdsRef is a belt-and-braces dedup.
    try {
      await channelRef.current?.send({
        type: 'broadcast',
        event: TRIP_BROADCAST_EVENTS.PATCH,
        payload: { ...patch, seq: assignedSeq },
      });
    } catch (err) {
      console.error('[useCollaborativeTrip] broadcast send failed:', err);
    }

    dirtyRef.current = true;
    scheduleDebouncedSave();
  }, [enabled, tripId, userId, userName, userRole, scheduleDebouncedSave]);

  // Channel subscription + presence tracking + patch reception.
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = createTripChannel(supabase, tripId, {
      userId,
      receiveOwnBroadcasts: false,
    });
    channelRef.current = channel;

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<TripPresencePayload>();
      const flat: CollabPresenceUser[] = [];
      for (const presenceRefList of Object.values(state)) {
        for (const entry of presenceRefList) {
          flat.push({
            userId: entry.userId,
            userName: entry.userName,
            userRole: entry.userRole,
            avatarUrl: entry.avatarUrl,
            joinedAt: entry.joinedAt,
          });
        }
      }
      flat.sort((a, b) => a.joinedAt - b.joinedAt);
      setPresence(flat);
    });

    // Real patch receiver.
    channel.on('broadcast', { event: TRIP_BROADCAST_EVENTS.PATCH }, async (message) => {
      const incoming = (message as unknown as { payload: Patch & { seq: number | null } }).payload;
      const seq = incoming.seq ?? 0;

      if (emittedPatchIdsRef.current.has(incoming.id)) return;
      if (seq > 0 && emittedSeqsRef.current.has(seq)) return;

      // Stage 2d hotfix #1: self-receive tripwire. If we get a broadcast
      // claiming to be from ourselves despite receiveOwnBroadcasts:false,
      // realtime is misconfigured. Don't block; emittedSeqsRef dedup
      // catches actual self-echoes. This is diagnostic.
      if (incoming.userId === userId) {
        console.warn(
          '[useCollaborativeTrip] Received own broadcast despite receiveOwnBroadcasts:false. Seq:',
          seq
        );
      }

      // Stage 2d hotfix #1: rapid-duplicate tripwire. Two identical
      // received payloads within 2 seconds suggests a ping-pong variant
      // not caught by suppressEmit + seq dedup.
      const dedupKey = JSON.stringify({
        type: incoming.payload?.type,
        // Hash a few payload fields likely to differ across legitimate
        // edits but be identical in a ping-pong: dayId for activity ops,
        // phaseId for phase ops, hotelId for hotel ops.
        dayId: (incoming.payload as { dayId?: string })?.dayId,
        phaseId: (incoming.payload as { phaseId?: string })?.phaseId,
        hotelId: (incoming.payload as { hotelId?: string })?.hotelId,
        activityId: (incoming.payload as { activityId?: string })?.activityId,
      });
      const nowMs = Date.now();
      recentReceivedRef.current = recentReceivedRef.current.filter(r => nowMs - r.at < 2000);
      if (recentReceivedRef.current.some(r => r.key === dedupKey)) {
        console.error(
          '[useCollaborativeTrip] Rapid duplicate patch received within 2s. Possible ping-pong loop.',
          { type: incoming.payload?.type, seq, dedupKey }
        );
      }
      recentReceivedRef.current.push({ key: dedupKey, at: nowMs });

      // Gap detection: if seq is more than 1 ahead, backfill first.
      if (seq > 0 && seq > lastAppliedSeqRef.current + 1) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug(
            `[useCollaborativeTrip] seq gap detected: expected ${lastAppliedSeqRef.current + 1}, got ${seq}. Backfilling...`
          );
        }
        await backfillFromApi(lastAppliedSeqRef.current);
        if (lastAppliedSeqRef.current >= seq) return;
      }

      try {
        applyPatchToRef(incoming, itineraryHandleRef.current, currentHotelsRef.current, onHotelsChangeRef.current);
        if (seq > lastAppliedSeqRef.current) lastAppliedSeqRef.current = seq;
        dirtyRef.current = true;
        scheduleDebouncedSave();
      } catch (err) {
        console.error('[useCollaborativeTrip] received patch apply failed:', err);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const payload: TripPresencePayload = {
          userId,
          userName,
          userRole,
          avatarUrl: avatarUrl ?? null,
          joinedAt: Date.now(),
        };
        await channel.track(payload);
        setIsConnected(true);

        // Reconnect recovery: if we had already applied patches before,
        // this is a reconnect rather than first connect. Backfill.
        if (wasConnectedRef.current && lastAppliedSeqRef.current > 0) {
          void backfillFromApi(lastAppliedSeqRef.current);
        }
        wasConnectedRef.current = true;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      if (debouncedSaveTimerRef.current) {
        clearTimeout(debouncedSaveTimerRef.current);
        debouncedSaveTimerRef.current = null;
      }
      // Best-effort flush on unmount. keepalive lets the request complete
      // even after the page is navigated away.
      if (dirtyRef.current) {
        const handle = itineraryHandleRef.current?.current;
        if (handle) {
          try {
            const days = handle.getDaysSnapshot();
            const phases = handle.getPhases();
            const hotels = currentHotelsRef.current ?? [];
            void fetch(`/api/trips`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: tripId,
                trip_data: {
                  itineraryDays: days,
                  itineraryPhases: phases,
                  acceptedHotels: hotels,
                },
              }),
              keepalive: true,
            }).catch(() => {});
          } catch {
            // Ignore cleanup errors; nothing we can do from here.
          }
        }
        dirtyRef.current = false;
      }
      void channel.untrack();
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
      setPresence([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tripId, userId]);

  if (!enabled) {
    return {
      tripData: initialTripData,
      presence: EMPTY_PRESENCE,
      isConnected: false,
      enabled: false,
      emitPatch,
    };
  }

  return {
    tripData,
    presence,
    isConnected,
    enabled: true,
    emitPatch,
  };
}
