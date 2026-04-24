import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { COLLAB_ENABLED, requireTripOwner } from '@/lib/collaboration';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string; userId: string }> }
) {
  if (!COLLAB_ENABLED) {
    return NextResponse.json({ error: 'Collaboration not enabled' }, { status: 404 });
  }

  const { tripId, userId: targetUserId } = await params;
  const body = await req.json().catch(() => ({}));
  const newRole = body?.role;

  if (newRole !== 'viewer' && newRole !== 'editor') {
    return NextResponse.json(
      { error: "Body must include { role: 'viewer' | 'editor' }" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trip = await requireTripOwner(supabase, tripId, user.id);
  if (!trip) {
    return NextResponse.json({ error: 'Not found or not owner' }, { status: 403 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error: updErr } = await serviceSupabase
    .from('trip_collaborators')
    .update({ role: newRole })
    .eq('trip_id', tripId)
    .eq('user_id', targetUserId);

  if (updErr) {
    return NextResponse.json({ error: 'Role update failed' }, { status: 500 });
  }

  return NextResponse.json({ role: newRole });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string; userId: string }> }
) {
  if (!COLLAB_ENABLED) {
    return NextResponse.json({ error: 'Collaboration not enabled' }, { status: 404 });
  }

  const { tripId, userId: targetUserId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trip = await requireTripOwner(supabase, tripId, user.id);
  if (!trip) {
    return NextResponse.json({ error: 'Not found or not owner' }, { status: 403 });
  }

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { error: delErr } = await serviceSupabase
    .from('trip_collaborators')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', targetUserId);

  if (delErr) {
    return NextResponse.json({ error: 'Remove failed' }, { status: 500 });
  }

  return NextResponse.json({ removed: true });
}
