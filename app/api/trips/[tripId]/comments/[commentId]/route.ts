import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRequestUserAndRole } from '@/lib/collaboration';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; commentId: string }> }
) {
  const { tripId, commentId } = await params;
  const supabase = await createClient();
  const { user, role } = await getRequestUserAndRole(supabase, tripId);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role === null) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: comment, error: fetchErr } = await supabase
    .from('trip_comments')
    .select('id, user_id, deleted_at')
    .eq('id', commentId)
    .eq('trip_id', tripId)
    .single();

  if (fetchErr || !comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  if (comment.deleted_at !== null) {
    return NextResponse.json({ error: 'Comment has been deleted' }, { status: 410 });
  }
  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden: only the author can edit a comment' }, { status: 403 });
  }

  let body: { comment_text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { comment_text } = body;
  if (!comment_text || typeof comment_text !== 'string' || comment_text.trim() === '') {
    return NextResponse.json({ error: 'comment_text is required' }, { status: 400 });
  }
  if (comment_text.length > 500) {
    return NextResponse.json({ error: 'comment_text must be 500 characters or fewer' }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await supabase
    .from('trip_comments')
    .update({ comment_text: comment_text.trim(), updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .select('*, profiles(full_name, avatar_url)')
    .single();

  if (updateErr || !updated) {
    console.error('[PATCH /comments/[commentId]] update error:', updateErr);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }

  await supabase.from('trip_activity_log').insert({
    trip_id: tripId,
    user_id: user.id,
    action: 'edit_comment',
    payload: {
      userName: user.email || 'A collaborator',
      userRole: role,
      payload: { type: 'edit_comment', commentId },
    },
  });

  return NextResponse.json({ comment: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string; commentId: string }> }
) {
  const { tripId, commentId } = await params;
  const supabase = await createClient();
  const { user, role } = await getRequestUserAndRole(supabase, tripId);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role === null) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: comment, error: fetchErr } = await supabase
    .from('trip_comments')
    .select('id, user_id, trip_id, deleted_at')
    .eq('id', commentId)
    .eq('trip_id', tripId)
    .single();

  if (fetchErr || !comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  if (comment.deleted_at !== null) {
    return NextResponse.json({ error: 'Comment already deleted' }, { status: 410 });
  }

  const isAuthor = comment.user_id === user.id;
  const isOwner = role === 'owner';
  if (!isAuthor && !isOwner) {
    return NextResponse.json({ error: 'Forbidden: only the author or trip owner can delete a comment' }, { status: 403 });
  }

  const { error: deleteErr } = await supabase
    .from('trip_comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId);

  if (deleteErr) {
    console.error('[DELETE /comments/[commentId]] soft-delete error:', deleteErr);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }

  await supabase.from('trip_activity_log').insert({
    trip_id: tripId,
    user_id: user.id,
    action: 'delete_comment',
    payload: {
      userName: user.email || 'A collaborator',
      userRole: role,
      payload: { type: 'delete_comment', commentId },
    },
  });

  return NextResponse.json({ deleted: true });
}
