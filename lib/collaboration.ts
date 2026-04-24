/**
 * Collaborative Trips feature foundation.
 *
 * This file is the entry point for every import related to the
 * Collab feature. It centralizes:
 *
 * - The master feature flag (NEXT_PUBLIC_COLLAB_ENABLED).
 * - The role type and constants.
 * - Partial-rollback flags (NEXT_PUBLIC_COLLAB_REALTIME_ENABLED, etc.)
 *   which Stage 2 and Stage 3 will populate.
 *
 * Stage 0b creates this file empty of runtime logic. Stages 1-4 add the
 * per-stage utilities they need, each in its own module that imports
 * the types from here.
 *
 * See docs/specs/collab/00-master-plan.md for the locked scope decisions
 * and docs/specs/collab/01-technical-spec.md for technical detail.
 */

/**
 * Master feature flag for the entire Collab feature.
 * When false, no Collab UI renders, no Collab API routes activate,
 * no Collab-specific code paths execute. Existing solo-trip behavior
 * is completely unchanged.
 *
 * Default: false in all environments until Stage 5 flag flip.
 */
export const COLLAB_ENABLED =
  process.env.NEXT_PUBLIC_COLLAB_ENABLED === 'true';

/**
 * Partial rollback flag for realtime sync (added in Stage 2).
 * When false, sharing and invites still work but changes require
 * manual refresh. Allows disabling realtime without pulling the
 * whole feature. Defaults to true; Stage 2 adds the env var.
 */
export const COLLAB_REALTIME_ENABLED =
  process.env.NEXT_PUBLIC_COLLAB_REALTIME_ENABLED !== 'false';

/**
 * Partial rollback flag for Luna's cross-awareness summary (added
 * in Stage 3). When false, Luna works per-user without the "recent
 * collaborator changes" summary in her prompt. Defaults to true;
 * Stage 3 adds the env var.
 */
export const COLLAB_LUNA_AWARENESS_ENABLED =
  process.env.NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED !== 'false';

/**
 * The three collaborator roles enforced at:
 * 1. Database RLS (authoritative).
 * 2. API route checks.
 * 3. Client UI gating (safety net).
 *
 * Migration note: the SQL schema (see Stage 0a) has a CHECK constraint
 * enforcing this exact set on public.trip_collaborators.role.
 */
export type CollabRole = 'owner' | 'editor' | 'viewer';

export const COLLAB_ROLES: readonly CollabRole[] = [
  'owner',
  'editor',
  'viewer',
] as const;

/**
 * Helper: does this role permit trip mutations (accepting, editing, etc.)?
 * Only owner and editor can mutate; viewer is read-only plus comments.
 */
export function canMutateTrip(role: CollabRole): boolean {
  return role === 'owner' || role === 'editor';
}

/**
 * Helper: is this user the owner of the trip?
 * Used for invite, delete, and role management gates.
 */
export function isOwner(role: CollabRole): boolean {
  return role === 'owner';
}

/**
 * Helper: can this role add/edit/delete comments on the trip?
 * All three roles can comment. This helper exists for clarity at
 * call sites and to match the permission matrix in Tier 1 master plan.
 */
export function canComment(role: CollabRole): boolean {
  return role === 'owner' || role === 'editor' || role === 'viewer';
}

/**
 * Constants used across Collab API routes and UI.
 */
export const COLLAB_CONSTANTS = {
  /** Soft UI limit on collaborators per trip. No DB cap. */
  MAX_COLLABORATORS_SOFT_LIMIT: 10,
  /** Max character length of a single comment (enforced at DB level). */
  MAX_COMMENT_LENGTH: 500,
  /** Debounce interval (ms) before patch accumulation flushes to trip_data. */
  SYNC_DEBOUNCE_MS: 5000,
  /** Share token character length. Set by gen_random_bytes(16) hex-encoded. */
  SHARE_TOKEN_LENGTH: 32,
} as const;

// ─────────────────────────────────────────────────────────────
// Server-side helpers. These import from @supabase/ssr and are safe
// to use in API routes and server components. Do NOT import these
// from client components.
// ─────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolve the authenticated user's role on a given trip.
 *
 * Returns:
 *   - 'owner' if user_id matches saved_trips.user_id
 *   - 'editor' or 'viewer' if the user has a matching trip_collaborators row
 *   - null if the user has no access to the trip at all
 *
 * Uses the caller's Supabase client (RLS-enforced). Safe to call from
 * API routes without service role elevation.
 */
export async function getUserTripRole(
  supabase: SupabaseClient,
  tripId: string,
  userId: string
): Promise<CollabRole | null> {
  const { data: trip, error: tripErr } = await supabase
    .from('saved_trips')
    .select('user_id')
    .eq('id', tripId)
    .maybeSingle();

  if (tripErr) return null;
  if (trip?.user_id === userId) return 'owner';

  const { data: collab, error: collabErr } = await supabase
    .from('trip_collaborators')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (collabErr || !collab) return null;
  return collab.role as CollabRole;
}

/**
 * Verify a trip exists and the authenticated user is the owner.
 * Returns the trip row on success, null on failure.
 * Throws no errors; caller inspects the return value.
 */
export async function requireTripOwner(
  supabase: SupabaseClient,
  tripId: string,
  userId: string
): Promise<{ id: string; user_id: string } | null> {
  const { data, error } = await supabase
    .from('saved_trips')
    .select('id, user_id')
    .eq('id', tripId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Count current collaborators on a trip (excludes the owner).
 * Used for the soft limit check in join/promote flows.
 */
export async function countCollaborators(
  supabase: SupabaseClient,
  tripId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('trip_collaborators')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Resolve the authenticated user and their role on a given trip from a
 * Next.js API route. Used by every mutation route that needs to gate
 * by role.
 *
 * Returns:
 *   - { user, role } with role in owner/editor/viewer when authenticated
 *     AND has a role on the trip.
 *   - { user, role: null } when authenticated but has no role on the trip
 *     (trip not found, or not shared with this user). Caller treats as no access.
 *   - { user: null, role: null } when not authenticated. Caller returns 401.
 *
 * Solo trips: returns role 'owner' for the trip's owner (getUserTripRole
 * checks saved_trips.user_id before trip_collaborators). Solo-trip behavior
 * is unchanged.
 */
export async function getRequestUserAndRole(
  supabase: SupabaseClient,
  tripId: string
): Promise<{ user: { id: string; email?: string } | null; role: CollabRole | null }> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { user: null, role: null };
  }
  const role = await getUserTripRole(supabase, tripId, user.id);
  return { user: { id: user.id, email: user.email }, role };
}
