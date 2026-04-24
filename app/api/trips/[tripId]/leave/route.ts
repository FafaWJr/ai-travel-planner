import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COLLAB_ENABLED, getUserTripRole } from '@/lib/collaboration';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!COLLAB_ENABLED) {
    return NextResponse.json({ error: 'Collaboration not enabled' }, { status: 404 });
  }

  const { tripId } = await params;

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserTripRole(supabase, tripId, user.id);
  if (role === 'owner') {
    return NextResponse.json(
      { error: 'Owners cannot leave their own trip. Delete it instead.' },
      { status: 400 }
    );
  }
  if (!role) {
    return NextResponse.json({ error: 'Not a collaborator' }, { status: 403 });
  }

  const { error: delErr } = await supabase
    .from('trip_collaborators')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', user.id);

  if (delErr) {
    return NextResponse.json({ error: 'Leave failed' }, { status: 500 });
  }

  return NextResponse.json({ left: true });
}
