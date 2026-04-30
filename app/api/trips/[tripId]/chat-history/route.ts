import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { getRequestUserAndRole } from '@/lib/collaboration';
import type { ChatHistory } from '@/lib/chat-history';

/**
 * Stage 3a hotfix: per-user chat thread persistence for collaborators.
 *
 * The general PATCH /api/trips uses .eq('user_id', user.id) which only
 * matches the trip owner's row. Editors calling that path get a silent
 * no-op and their chat thread is lost on refresh.
 *
 * This endpoint accepts a keyed chat_history object and server-merges
 * the caller's thread into the existing chat_history, preserving all
 * other users' threads. Service-role client bypasses the owner-only
 * RLS on saved_trips.
 *
 * Role gates:
 *   - owner: allowed (though owner path normally goes through /api/trips)
 *   - editor: allowed
 *   - viewer: 403 (viewers read-only, chat not persisted)
 */
export async function PATCH(
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
    return NextResponse.json({ error: 'Viewers cannot save chat history' }, { status: 403 });
  }

  let incomingHistory: ChatHistory;
  try {
    const body = await request.json();
    incomingHistory = body.chat_history;
    if (!incomingHistory || typeof incomingHistory !== 'object' || Array.isArray(incomingHistory)) {
      return NextResponse.json({ error: 'chat_history must be a keyed object' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Service-role client: saved_trips UPDATE RLS is owner-only, so the
  // user-scoped client would block editor writes. Role is already verified
  // above; the service client is only used for the merge+write.
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Server-side merge: read existing chat_history, overlay caller's thread(s),
  // preserve all other users' threads. Same principle as P2-1 JSONB merge.
  const { data: existing, error: fetchErr } = await serviceSupabase
    .from('saved_trips')
    .select('chat_history')
    .eq('id', tripId)
    .single();

  if (fetchErr) {
    console.error('[PATCH chat-history] fetch failed:', fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const existingHistory = (existing?.chat_history ?? {}) as Record<string, unknown>;
  // Spread: incoming keys win (this user's updated thread), existing keys
  // for other users are preserved unchanged.
  const merged = { ...existingHistory, ...incomingHistory };

  const { error: updateErr } = await serviceSupabase
    .from('saved_trips')
    .update({ chat_history: merged })
    .eq('id', tripId);

  if (updateErr) {
    console.error('[PATCH chat-history] update failed:', updateErr);
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
