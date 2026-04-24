import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { COLLAB_ENABLED, COLLAB_CONSTANTS } from '@/lib/collaboration';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!COLLAB_ENABLED) {
    return NextResponse.json({ error: 'Collaboration not enabled' }, { status: 404 });
  }

  const { tripId } = await params;
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token || !/^[a-f0-9]{32}$/.test(token)) {
    return NextResponse.json(
      { error: 'Invalid or missing token' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Service role needed: the user is not yet an owner or collaborator on this
  // trip (that's what this endpoint establishes), so the user-session SELECT
  // would be RLS-filtered to nothing. Service-role reads are gated by the
  // token match check immediately below.
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: trip, error: tripErr } = await serviceSupabase
    .from('saved_trips')
    .select('id, user_id, share_token_viewer, share_token_editor')
    .eq('id', tripId)
    .maybeSingle();

  if (tripErr || !trip) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }

  let role: 'viewer' | 'editor' | null = null;
  if (token === trip.share_token_editor) role = 'editor';
  else if (token === trip.share_token_viewer) role = 'viewer';

  if (!role) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }

  if (trip.user_id === user.id) {
    return NextResponse.json(
      { alreadyOwner: true },
      { status: 200 }
    );
  }

  const { data: existing } = await serviceSupabase
    .from('trip_collaborators')
    .select('role')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      alreadyCollaborator: true,
      role: existing.role,
    });
  }

  const { count } = await serviceSupabase
    .from('trip_collaborators')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);

  if ((count ?? 0) >= COLLAB_CONSTANTS.MAX_COLLABORATORS_SOFT_LIMIT) {
    return NextResponse.json(
      { error: 'This trip has reached the maximum number of collaborators' },
      { status: 403 }
    );
  }

  const { error: insErr } = await serviceSupabase
    .from('trip_collaborators')
    .insert({ trip_id: tripId, user_id: user.id, role });

  if (insErr) {
    return NextResponse.json({ error: 'Join failed' }, { status: 500 });
  }

  if ((count ?? 0) === 0) {
    await serviceSupabase
      .from('saved_trips')
      .update({ is_collaborative: true })
      .eq('id', tripId);
  }

  return NextResponse.json({ role, joined: true });
}
