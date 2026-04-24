/**
 * Collaborative Trips: Supabase Realtime channel factory.
 *
 * One channel per trip. Broadcast + Presence only. Postgres Changes
 * subscription is set up by the hook directly when it needs fallback
 * recovery (Stage 2d); this file is the Broadcast/Presence channel.
 *
 * Channel name convention: `trip:{tripId}`.
 * One channel serves: patch broadcasts, presence updates, future
 * comment broadcasts (Stage 4). Splitting into multiple channels
 * was considered and rejected: one channel is simpler, stays within
 * Supabase connection budget, and there's no throughput concern.
 *
 * The factory ONLY creates the channel. Subscribing, tracking
 * presence, sending broadcasts, and unsubscribing are the caller's
 * responsibility (done inside the useCollaborativeTrip hook).
 */

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export type TripChannelOptions = {
  /**
   * Presence key. Should be the authenticated user's id. This is
   * what Supabase Presence uses to deduplicate presence entries
   * (a user opening the same trip in two tabs counts as one).
   */
  userId: string;
  /**
   * Whether to include broadcasts sent by this client in the
   * received events. Set to false to avoid applying our own
   * patches twice (local optimistic update + echo from server).
   * Stage 2d will rely on this being false.
   */
  receiveOwnBroadcasts?: boolean;
};

/**
 * Create (but do not subscribe to) a trip channel.
 *
 * Naming: `trip:{tripId}`. Do NOT rename without a coordinated
 * migration; all clients must agree on the channel name to
 * receive each other's messages.
 */
export function createTripChannel(
  supabase: SupabaseClient,
  tripId: string,
  options: TripChannelOptions
): RealtimeChannel {
  return supabase.channel(`trip:${tripId}`, {
    config: {
      presence: {
        key: options.userId,
      },
      broadcast: {
        self: options.receiveOwnBroadcasts ?? false,
        ack: false, // Stage 2d may flip this on for delivery guarantees
      },
    },
  });
}

/**
 * Typed shape of a presence record for the trip channel.
 * Every client, when tracking presence, sends an object matching
 * this shape. The hook reads received presence records and
 * projects them into the UI.
 */
export type TripPresencePayload = {
  userId: string;
  userName: string;
  userRole: 'owner' | 'editor' | 'viewer';
  avatarUrl: string | null;
  joinedAt: number; // client-side Date.now() at track() time
};

/**
 * Broadcast event names used on trip channels.
 * Centralised so Stage 2d and Stage 4 reference the same strings.
 */
export const TRIP_BROADCAST_EVENTS = {
  /** A trip patch has been emitted. Payload: Patch (from lib/trip-patches). */
  PATCH: 'patch',
  /** A comment event (Stage 4). Payload: comment change envelope. */
  COMMENT: 'comment',
} as const;

export type TripBroadcastEvent =
  (typeof TRIP_BROADCAST_EVENTS)[keyof typeof TRIP_BROADCAST_EVENTS];
