import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/* ── POST /api/trips  — create a new saved trip ── */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, destination, start_date, end_date, trip_data } = body;

  // Guarantee the profiles row exists — saved_trips.user_id has FK → profiles.id
  await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: 'id' }
  );

  const { data, error } = await supabase
    .from('saved_trips')
    .insert({
      user_id: user.id,
      title,
      destination: destination ?? null,
      start_date: start_date ?? null,
      end_date: end_date ?? null,
      trip_data,
      is_favorite: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[POST /api/trips] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: (data as { id: string }).id });
}

/* ── PATCH /api/trips  — update an existing saved trip ── */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, title, trip_data } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing trip id' }, { status: 400 });
  }

  const { error } = await supabase
    .from('saved_trips')
    .update({ title, trip_data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('[PATCH /api/trips] Supabase error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
