import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRequestUserAndRole } from '@/lib/collaboration';
import type { Patch } from '@/lib/trip-patches';

/**
 * Stage 2d: patch insertion endpoint.
 *
 * Role gates:
 *   - viewer: 403
 *   - editor / owner: allowed
 *   - solo trip owner: allowed (role lookup returns 'owner')
 *
 * Returns: { seq: number, id: string, created_at: string }
 *
 * The client uses this for non-commutative patches (wait for seq before
 * applying locally) and as the canonical write path for ALL patches.
 * Commutative patches still call this; the client just doesn't wait
 * for the response before applying locally.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { user, role } = await getRequestUserAndRole(supabase, tripId);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role === null) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (role === 'viewer') {
    return NextResponse.json({ error: 'Viewers cannot emit patches' }, { status: 403 });
  }

  let patch: Patch;
  try {
    const body = await request.json();
    patch = body.patch;
    if (!patch || !patch.payload || !patch.payload.type) {
      return NextResponse.json({ error: 'Invalid patch payload' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // INSERT into trip_activity_log; Postgres assigns seq at INSERT time.
  const { data, error } = await supabase
    .from('trip_activity_log')
    .insert({
      trip_id: tripId,
      user_id: user.id,
      action: patch.payload.type,
      payload: patch as unknown as Record<string, unknown>,
    })
    .select('id, seq, created_at')
    .single();

  if (error || !data) {
    console.error('[/api/trips/[tripId]/patches] insert error:', error);
    return NextResponse.json({ error: 'Failed to log patch' }, { status: 500 });
  }

  return NextResponse.json({
    seq: data.seq,
    id: data.id,
    created_at: data.created_at,
  });
}

/**
 * Stage 2d: patch replay endpoint. Returns log entries with seq > since,
 * ordered ascending. Used by the hook for:
 *   - Backfill when a broadcast gap is detected.
 *   - Reconnect recovery when the client was offline.
 *
 * Capped at 500 rows. If `truncated` is true, the client should fall
 * back to rehydrating from saved_trips.trip_data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const supabase = await createClient();
  const { user, role } = await getRequestUserAndRole(supabase, tripId);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role === null) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sinceParam = request.nextUrl.searchParams.get('since');
  const since = sinceParam ? parseInt(sinceParam, 10) : 0;
  if (Number.isNaN(since) || since < 0) {
    return NextResponse.json({ error: 'Invalid since param' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('trip_activity_log')
    .select('id, seq, user_id, action, payload, created_at')
    .eq('trip_id', tripId)
    .gt('seq', since)
    .order('seq', { ascending: true })
    .limit(500);

  if (error) {
    console.error('[/api/trips/[tripId]/patches GET] query error:', error);
    return NextResponse.json({ error: 'Failed to fetch patches' }, { status: 500 });
  }

  return NextResponse.json({
    patches: data ?? [],
    truncated: (data?.length ?? 0) === 500,
  });
}
