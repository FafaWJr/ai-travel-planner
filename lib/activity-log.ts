/**
 * Server-side activity log writer.
 *
 * Every mutation-producing API route calls logActivity() to persist
 * a row in trip_activity_log. This row serves two jobs:
 *   1. Sync recovery after disconnect (Stage 2d replays log since
 *      last_seen when a client reconnects).
 *   2. Backend audit trail (who did what, when).
 *
 * Design:
 *   - Uses the caller's Supabase client (RLS-enforced). The
 *     trip_activity_log INSERT policy requires user_id = auth.uid()
 *     AND trip_id in the user's accessible trips. So callers must
 *     pass an authenticated client, not service-role.
 *   - Returns { ok: true, id } on success, { ok: false, error } on
 *     failure. Does not throw. Per agreed pattern in planning
 *     conversation: await with 2s timeout, surface errors rather
 *     than silently dropping.
 *   - Fire-and-forget behaviour is NOT used. If the caller wants
 *     to proceed regardless of log success, the caller awaits and
 *     decides what to do with a failure. This keeps the log write
 *     audit-grade rather than best-effort.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Patch } from './trip-patches';

export type LogActivityResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const LOG_WRITE_TIMEOUT_MS = 2000;

/**
 * Persist a patch to trip_activity_log. The `action` column stores
 * the patch payload type (e.g. 'add_activity'). The `payload` JSONB
 * column stores the full patch for later replay.
 *
 * Call AFTER the mutation has been successfully broadcast or applied,
 * not before. Order of operations in Stage 2d will be:
 *   1. Apply patch locally (optimistic).
 *   2. Broadcast via Supabase Realtime.
 *   3. await logActivity() (this function).
 *   4. Return success to the caller.
 */
export async function logActivity(
  supabase: SupabaseClient,
  patch: Patch
): Promise<LogActivityResult> {
  const insertPromise = supabase
    .from('trip_activity_log')
    .insert({
      trip_id: patch.tripId,
      user_id: patch.userId,
      action: patch.payload.type,
      payload: patch as unknown as Record<string, unknown>,
    })
    .select('id')
    .single();

  // Timeout guard: log write should complete in <100ms in practice.
  // If it exceeds 2s, fail fast and let the caller decide what to do.
  const timeoutPromise = new Promise<LogActivityResult>((resolve) => {
    setTimeout(() => {
      resolve({ ok: false, error: 'trip_activity_log write timed out' });
    }, LOG_WRITE_TIMEOUT_MS);
  });

  const raceResult = await Promise.race([
    insertPromise.then((r): LogActivityResult => {
      if (r.error) {
        return { ok: false, error: r.error.message };
      }
      return { ok: true, id: r.data.id as string };
    }),
    timeoutPromise,
  ]);

  return raceResult;
}

/**
 * Read the activity log for a trip since a given timestamp.
 * Used in Stage 2d for disconnect recovery: when a client
 * reconnects, it passes its last_seen timestamp and gets back
 * all patches it missed while offline.
 *
 * Returns patches in chronological order (oldest first) so the
 * caller can replay them in sequence.
 */
export async function readActivityLogSince(
  supabase: SupabaseClient,
  tripId: string,
  sinceTimestamp: number
): Promise<Patch[]> {
  const sinceIso = new Date(sinceTimestamp).toISOString();
  const { data, error } = await supabase
    .from('trip_activity_log')
    .select('payload')
    .eq('trip_id', tripId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  // The payload JSONB is the full patch envelope we stored via logActivity.
  return data.map((row: { payload: unknown }) => row.payload as Patch);
}
