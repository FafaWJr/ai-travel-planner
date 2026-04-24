import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { COLLAB_ENABLED, getUserTripRole } from '@/lib/collaboration';

export async function GET(
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
  if (!role) {
    return NextResponse.json({ error: 'No access' }, { status: 403 });
  }

  // Service role needed: trip_collaborators RLS is self-only, so a user-session
  // SELECT returns only the caller's own row. Fellow-collaborator list reads
  // happen here at the API layer, gated by the getUserTripRole check above.
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data, error } = await serviceSupabase
    .from('trip_collaborators')
    .select('user_id, role, joined_at, profiles(id, full_name, email, avatar_url)')
    .eq('trip_id', tripId)
    .order('joined_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'List failed' }, { status: 500 });
  }

  return NextResponse.json({ collaborators: data ?? [], currentUserRole: role });
}
