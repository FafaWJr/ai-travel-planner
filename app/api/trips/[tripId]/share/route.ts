import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COLLAB_ENABLED, requireTripOwner } from '@/lib/collaboration';

function collabOffResponse() {
  return NextResponse.json(
    { error: 'Collaboration feature not enabled' },
    { status: 404 }
  );
}

function generateHexToken(): string {
  return (
    crypto.randomUUID().replace(/-/g, '') +
    crypto.randomUUID().replace(/-/g, '')
  ).slice(0, 32);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  if (!COLLAB_ENABLED) return collabOffResponse();

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

  const column = role === 'viewer' ? 'share_token_viewer' : 'share_token_editor';
  const { data, error } = await supabase
    .from('saved_trips')
    .select(column)
    .eq('id', tripId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Token lookup failed' }, { status: 500 });
  }

  const token = (data as Record<string, string | null>)[column];
  if (!token) {
    const hexToken = generateHexToken();
    const { error: updErr } = await supabase
      .from('saved_trips')
      .update({ [column]: hexToken })
      .eq('id', tripId);
    if (updErr) {
      return NextResponse.json({ error: 'Token generation failed' }, { status: 500 });
    }
    return NextResponse.json({ role, token: hexToken });
  }

  return NextResponse.json({ role, token });
}
