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
