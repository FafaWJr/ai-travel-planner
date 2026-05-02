import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { COLLAB_ENABLED } from '@/lib/collaboration';

export async function GET() {
  if (!COLLAB_ENABLED) {
    return NextResponse.json({ trips: [] });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Read the caller's own collaborator rows via user session (RLS self-only).
  const { data: collabRows } = await supabase
    .from('trip_collaborators')
    .select('trip_id, role')
    .eq('user_id', user.id);

  if (!collabRows || collabRows.length === 0) {
    return NextResponse.json({ trips: [] });
  }

  // Service role for cross-user owner-name lookup.
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const tripIds = collabRows.map((r) => r.trip_id);
  const { data: trips } = await serviceSupabase
    .from('saved_trips')
    .select('id, title, destination, user_id, start_date, end_date, created_at, profiles:user_id(full_name, email)')
    .in('id', tripIds);

  type TripRow = {
    id: string;
    title: string | null;
    destination: string | null;
    user_id: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
    profiles: { full_name: string | null; email: string | null } | null;
  };

  const result = (trips as TripRow[] | null ?? []).map((t) => {
    const collab = collabRows.find((r) => r.trip_id === t.id);
    return {
      id: t.id,
      title: t.title,
      destination: t.destination,
      role: collab?.role,
      ownerName: t.profiles?.full_name || t.profiles?.email || 'Unknown',
      start_date: t.start_date,
      end_date: t.end_date,
      created_at: t.created_at,
    };
  });

  return NextResponse.json({ trips: result });
}
