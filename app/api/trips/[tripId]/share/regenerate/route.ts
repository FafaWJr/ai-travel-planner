import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COLLAB_ENABLED, requireTripOwner } from '@/lib/collaboration';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!COLLAB_ENABLED) {
    return NextResponse.json({ error: 'Collaboration not enabled' }, { status: 404 });
  }

  const { tripId } = await params;
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  if (role !== 'viewer' && role !== 'editor') {
    return NextResponse.json(
      { error: "Query param 'role' must be 'viewer' or 'editor'" },
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

  const newToken = (
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '')
  ).slice(0, 32);
  const column = role === 'viewer' ? 'share_token_viewer' : 'share_token_editor';

  const { error: updErr } = await supabase
    .from('saved_trips')
    .update({ [column]: newToken })
    .eq('id', tripId);

  if (updErr) {
    return NextResponse.json({ error: 'Token rotation failed' }, { status: 500 });
  }

  return NextResponse.json({ role, token: newToken });
}
