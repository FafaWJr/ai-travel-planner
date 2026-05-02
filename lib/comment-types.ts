export interface Comment {
  id: string;
  trip_id: string;
  user_id: string;
  target_type: 'activity' | 'day' | 'phase' | 'hotel';
  target_id: string;
  original_day_id: string | null;
  comment_text: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

import type { PatchPayload } from '@/lib/trip-patches';

/** Grouped comment props passed as a single optional object through the component tree. */
export interface CommentConfig {
  tripId: string;
  comments: Comment[];
  currentUserId: string;
  isOwner: boolean;
  onRefresh: () => void;
  /** When set, called after any comment mutation to broadcast to collaborators. */
  emitPatch?: (payload: PatchPayload) => void;
}
