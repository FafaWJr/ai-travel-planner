import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRequestUserAndRole } from '@/lib/collaboration';

const VALID_TARGET_TYPES = ['activity', 'day', 'phase', 'hotel'] as const;

export async function GET(
  _request: NextRequest,
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

  const { data, error } = await supabase
    .from('trip_comments')
    .select('*, profiles(full_name, avatar_url)')
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET /comments] query error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
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

  let body: { target_type?: string; target_id?: string; comment_text?: string; original_day_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { target_type, target_id, comment_text, original_day_id } = body;

  if (!target_type || !VALID_TARGET_TYPES.includes(target_type as typeof VALID_TARGET_TYPES[number])) {
    return NextResponse.json({ error: 'target_type must be one of: activity, day, phase, hotel' }, { status: 400 });
  }
  if (!target_id || typeof target_id !== 'string' || target_id.trim() === '') {
    return NextResponse.json({ error: 'target_id is required' }, { status: 400 });
  }
  if (!comment_text || typeof comment_text !== 'string' || comment_text.trim() === '') {
    return NextResponse.json({ error: 'comment_text is required' }, { status: 400 });
  }
  if (comment_text.length > 500) {
    return NextResponse.json({ error: 'comment_text must be 500 characters or fewer' }, { status: 400 });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('trip_comments')
    .insert({
      trip_id: tripId,
      user_id: user.id,
      target_type,
      target_id: target_id.trim(),
      comment_text: comment_text.trim(),
      ...(original_day_id ? { original_day_id } : {}),
    })
    .select('id')
    .single();

  if (insertErr || !inserted) {
    console.error('[POST /comments] insert error:', insertErr);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }

  const { data: created, error: fetchErr } = await supabase
    .from('trip_comments')
    .select('*, profiles(full_name, avatar_url)')
    .eq('id', inserted.id)
    .single();

  if (fetchErr || !created) {
    console.error('[POST /comments] fetch after insert error:', fetchErr);
    return NextResponse.json({ error: 'Comment created but failed to fetch' }, { status: 500 });
  }

  // Fetch profile for activity log userName
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const userName = profile?.full_name || user.email || 'A collaborator';

  await supabase.from('trip_activity_log').insert({
    trip_id: tripId,
    user_id: user.id,
    action: 'add_comment',
    payload: {
      userName,
      userRole: role,
      payload: {
        type: 'add_comment',
        commentId: inserted.id,
        targetType: target_type,
        targetId: target_id.trim(),
        commentText: comment_text.trim().slice(0, 40),
      },
    },
  });

  return NextResponse.json({ comment: created }, { status: 201 });
}
