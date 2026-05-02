import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { COLLAB_ENABLED } from '@/lib/collaboration';

export async function GET() {
  if (!COLLAB_ENABLED) {
    return NextResponse.json({ counts: {} });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Fetch all trips owned by this user via service role to get IDs
  const { data: ownedTrips } = await serviceSupabase
    .from('saved_trips')
    .select('id')
    .eq('user_id', user.id);

  if (!ownedTrips || ownedTrips.length === 0) {
    return NextResponse.json({ counts: {} });
  }

  const tripIds = ownedTrips.map((t) => t.id);

  const { data: collabRows } = await serviceSupabase
    .from('trip_collaborators')
    .select('trip_id')
    .in('trip_id', tripIds);

  const counts: Record<string, number> = {};
  for (const row of collabRows ?? []) {
    counts[row.trip_id] = (counts[row.trip_id] ?? 0) + 1;
  }

  return NextResponse.json({ counts });
}
