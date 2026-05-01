/**
 * Stage 3b: cross-awareness summary for Luna chat.
 *
 * Queries trip_activity_log for recent actions by OTHER collaborators
 * and formats them as a terse COLLABORATOR CONTEXT block that is
 * appended to the end of Luna's dynamic system prompt block.
 *
 * Gated by NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED. Returns null
 * when the flag is off, when there is no recent activity, or on error.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface CollaboratorEvent {
  userName: string;
  userRole: string;
  detail: string;
  minutesAgo: number;
}

/**
 * Query trip_activity_log for actions by OTHER users on this trip
 * in the last 10 minutes. Returns at most 5 events, newest first.
 * Returns null if the feature is disabled or no recent activity exists.
 *
 * Accepts the caller's already-authenticated Supabase client so we
 * don't create a redundant client instance per request (same pattern
 * as lib/activity-log.ts).
 */
export async function getRecentCollaboratorActivity(
  supabase: SupabaseClient,
  tripId: string,
  currentUserId: string
): Promise<CollaboratorEvent[] | null> {
  if (process.env.NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED !== 'true') return null;

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('trip_activity_log')
    .select('action, payload, created_at')
    .eq('trip_id', tripId)
    .neq('user_id', currentUserId)
    .gte('created_at', tenMinutesAgo)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error || !data || data.length === 0) return null;

  const now = Date.now();

  return data.map((row) => {
    // payload column = full Patch envelope: { tripId, userId, userName,
    // userRole, timestamp, payload: { type, dayId, ... } }
    const envelope = row.payload as Record<string, unknown>;
    const innerPayload = (envelope.payload as Record<string, unknown>) ?? {};
    const minutesAgo = Math.round((now - new Date(row.created_at).getTime()) / 60000);

    return {
      userName: (envelope.userName as string) || 'A collaborator',
      userRole: (envelope.userRole as string) || 'editor',
      detail: formatActionDetail(row.action as string, innerPayload),
      minutesAgo,
    };
  });
}

function formatActionDetail(
  action: string,
  inner: Record<string, unknown>
): string {
  const day = (inner.dayId as string) || 'a day';

  switch (action) {
    case 'accept_activity':    return `accepted an activity on ${day}`;
    case 'decline_activity':   return `declined an activity on ${day}`;
    case 'unaccept_activity':  return `un-accepted an activity on ${day}`;
    case 'remove_activity':    return `removed an activity from ${day}`;
    case 'replace_activity':   return `swapped an activity on ${day}`;
    case 'reorder_activities_in_slot':
      return `reordered activities in the ${(inner.slot as string) || ''} slot on ${day}`;
    case 'add_note': {
      const preview = (inner.note as string)?.slice(0, 40) || '';
      return `added a note on ${day}${preview ? `: "${preview}"` : ''}`;
    }
    case 'update_note': {
      const preview = (inner.note as string)?.slice(0, 40) || '';
      return `updated a note on ${day}${preview ? `: "${preview}"` : ''}`;
    }
    case 'edit_phase': {
      const label = (inner.changes as Record<string, unknown>)?.label as string;
      return label ? `renamed a phase to "${label}"` : 'edited a phase';
    }
    case 'split_phase':   return 'split a phase into two';
    case 'merge_phases':  return 'merged multiple phases together';
    case 'add_comment': {
      const preview = (inner.commentText as string)?.slice(0, 40) || '';
      const targetLabel = (inner.targetType as string) || 'an item';
      return `commented on ${targetLabel}${preview ? `: "${preview}"` : ''}`;
    }
    case 'edit_comment':   return 'edited a comment';
    case 'delete_comment': return 'deleted a comment';
    default:              return action.replace(/_/g, ' ');
  }
}

/**
 * Format a list of collaborator events into the COLLABORATOR CONTEXT
 * block appended to the end of Luna's dynamic system prompt block.
 * Returns empty string when the events list is empty.
 *
 * This block goes at the END of the system prompt so it does not
 * disturb prompt caching on the stable block.
 */
export function buildCollaboratorContextBlock(events: CollaboratorEvent[]): string {
  if (events.length === 0) return '';

  const lines = events.map((e) => {
    const timeLabel = e.minutesAgo <= 1 ? 'just now' : `${e.minutesAgo}min ago`;
    return `- ${e.userName} (${e.userRole}) ${e.detail} (${timeLabel})`;
  });

  return [
    '',
    'COLLABORATOR CONTEXT (last 10 minutes):',
    ...lines,
    '',
    'You may naturally reference these recent changes when relevant to the conversation.',
    'Do not list them unprompted. Only mention if the user asks about recent changes,',
    'or if a collaborator action directly relates to what the user is discussing.',
  ].join('\n');
}
