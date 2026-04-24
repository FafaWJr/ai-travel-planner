'use client';

/**
 * useCollaborativeTrip: realtime collaboration hook for trip pages.
 *
 * DUAL-MODE BEHAVIOUR:
 *   - enabled === false: passthrough. Hook is effectively inert.
 *     Returns initialTripData as tripData, empty presence, noop
 *     emitPatch, isConnected=false. No Supabase calls.
 *   - enabled === true: authoritative. Hook owns tripData state,
 *     subscribes to the trip channel, tracks presence, and in
 *     future stages (2d) emits and applies patches.
 *
 * The public return shape is identical in both modes. Consumers
 * use collab.tripData / collab.emitPatch / collab.presence
 * without branching.
 *
 * STAGE 2b SCOPE:
 *   - Channel subscription: DONE.
 *   - Presence tracking: DONE.
 *   - Patch emission: STUB (logs warning, does nothing).
 *   - Patch application: STUB (not wired; tripData mirrors
 *     initialTripData always).
 *
 * STAGE 2d WILL ADD:
 *   - Real emitPatch: broadcast via channel, applyPatch locally,
 *     dedup via id + self:false, await log write.
 *   - Real patch reception: apply received broadcasts to tripData.
 *   - LWW conflict resolution via timestamp.
 *   - Debounced save: merge accumulated tripData into saved_trips
 *     every 5s idle.
 *   - Disconnect recovery: on reconnect, read activity_log since
 *     last_seen and replay.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { CollabRole } from '@/lib/collaboration';
import type { PatchableTripData, PatchPayload } from '@/lib/trip-patches';
import {
  createTripChannel,
  TRIP_BROADCAST_EVENTS,
  type TripPresencePayload,
} from '@/lib/realtime';

// Re-exported to callers so they don't need two imports.
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
  /**
   * Master switch. True when COLLAB_ENABLED && trip.is_collaborative
   * && COLLAB_REALTIME_ENABLED. The page computes this and passes in.
   */
  enabled: boolean;
  /**
   * Starting trip data. When enabled=true, the hook seeds its
   * internal state from this. When enabled=false, the hook
   * returns this unchanged.
   *
   * IMPORTANT: the hook does NOT re-sync to initialTripData on
   * later renders. Once enabled, the hook is authoritative.
   * Callers in solo mode continue to manage their own tripData
   * and pass it here as initialTripData; the hook's passthrough
   * behaviour returns it unchanged.
   */
  initialTripData: PatchableTripData;
  /** Authenticated user id. */
  userId: string;
  /** Display name for presence. */
  userName: string;
  /** The user's role on this trip. */
  userRole: CollabRole;
  /** Optional avatar URL for presence display. */
  avatarUrl?: string | null;
};

export type UseCollaborativeTripReturn = {
  /** Current trip data. Hook-managed when enabled, passthrough when disabled. */
  tripData: PatchableTripData;
  /** Other users currently connected to this trip (plus self). */
  presence: CollabPresenceUser[];
  /** Is the realtime channel currently subscribed and receiving events? */
  isConnected: boolean;
  /** Whether the hook is running in collab mode. */
  enabled: boolean;
  /**
   * Emit a patch. Stage 2b STUB: logs a warning and does nothing.
   * Stage 2d wires this to broadcast + apply + log write.
   *
   * Caller provides the payload; the hook constructs the full envelope
   * (id, tripId, userId, userName, userRole, timestamp).
   */
  emitPatch: (payload: PatchPayload) => void;
};

const EMPTY_PRESENCE: CollabPresenceUser[] = [];

export function useCollaborativeTrip(
  args: UseCollaborativeTripArgs
): UseCollaborativeTripReturn {
  // Both branches unconditionally call the same hooks (useState, useRef,
  // useEffect, useCallback) below, then return different values based on
  // `enabled`. This keeps hook order stable across re-renders even if
  // `enabled` flips, satisfying the Rules of Hooks.
  const { tripId, initialTripData, userId, userName, userRole, avatarUrl, enabled } = args;

  const [tripData, _setTripData] = useState<PatchableTripData>(initialTripData);
  const [presence, setPresence] = useState<CollabPresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Stage 2d will use this to dedup patches we emitted ourselves,
  // in case self:false is ever flipped or a race occurs. Unused in 2b.
  const emittedPatchIdsRef = useRef<Set<string>>(new Set());

  // Stage 2b stub. Stage 2d replaces this with real broadcast + apply.
  const emitPatch = useCallback(
    (payload: PatchPayload) => {
      if (!enabled) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            '[useCollaborativeTrip] emitPatch called on a passthrough (non-collab) trip. Ignoring.'
          );
        }
        return;
      }
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[useCollaborativeTrip] emitPatch is a Stage 2b stub. Patches will flow in Stage 2d.',
          { type: payload.type, tripId }
        );
      }
      // Intentionally no-op. Stage 2d replaces this function body with:
      //   1. const patch = generatePatch({ tripId, userId, userName, userRole, payload });
      //   2. emittedPatchIdsRef.current.add(patch.id);
      //   3. const next = applyPatch(tripData, patch);
      //   4. setTripData(next);
      //   5. await channelRef.current?.send({ type: 'broadcast', event: 'patch', payload: patch });
      //   6. await logActivity(supabase, patch);
    },
    [enabled, tripId]
  );

  // Channel subscription + presence tracking (only when enabled).
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = createTripChannel(supabase, tripId, {
      userId,
      receiveOwnBroadcasts: false,
    });
    channelRef.current = channel;

    // Presence: track self and listen for changes
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
      // Sort by joinedAt ascending, so the UI shows earliest-joined first.
      flat.sort((a, b) => a.joinedAt - b.joinedAt);
      setPresence(flat);
    });

    // Broadcast: Stage 2d will consume this. In 2b, we subscribe but
    // no-op the handler (warn in dev) so we validate the subscription
    // itself works end-to-end.
    channel.on('broadcast', { event: TRIP_BROADCAST_EVENTS.PATCH }, (message) => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug(
          '[useCollaborativeTrip] Received patch broadcast (Stage 2b stub, ignored).',
          message
        );
      }
      // Stage 2d will replace this with:
      //   const patch = message.payload as Patch;
      //   if (emittedPatchIdsRef.current.has(patch.id)) return; // dedup belt
      //   setTripData(current => applyPatch(current, patch));
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
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      // Explicitly untrack presence before removing the channel so
      // other clients see us go offline immediately.
      void channel.untrack();
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
      setPresence([]);
    };
    // Intentionally exclude userName/userRole/avatarUrl from deps;
    // we only want the effect to re-run when enabled/trip/user change,
    // not on every profile tweak. Reconnecting on display-name changes
    // would be thrashy.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tripId, userId]);

  // Silence lint: ref is held for Stage 2d consumption.
  void emittedPatchIdsRef;
  void _setTripData;

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
