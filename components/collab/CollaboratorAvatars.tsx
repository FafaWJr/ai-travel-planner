'use client';

import type { CollabRole } from '@/lib/collaboration';

export type PresenceAvatar = {
  userId: string;
  userName: string;
  userRole: CollabRole;
  avatarUrl: string | null;
};

const ROLE_BORDER: Record<CollabRole, string> = {
  owner: '#00447B',
  editor: '#FF8210',
  viewer: '#9CA3AF',
};

export function CollaboratorAvatars({
  presence,
  maxVisible = 3,
  currentUserId,
}: {
  presence: PresenceAvatar[];
  maxVisible?: number;
  /**
   * Used to mark the current user's own avatar (e.g. with a subtle
   * outline). Optional; omit to treat all avatars identically.
   */
  currentUserId?: string;
}) {
  if (presence.length === 0) return null;

  const visible = presence.slice(0, maxVisible);
  const overflow = presence.length - visible.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((p) => {
        const isSelf = currentUserId === p.userId;
        return (
          <div
            key={p.userId}
            title={`${p.userName}${isSelf ? ' (you)' : ''} · ${p.userRole}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `2px solid ${ROLE_BORDER[p.userRole]}`,
              outline: isSelf ? '1px solid #00447B' : 'none',
              outlineOffset: 1,
              backgroundColor: '#E5E7EB',
              backgroundImage: p.avatarUrl ? `url(${p.avatarUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              marginLeft: -6,
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#374151',
            }}
          >
            {!p.avatarUrl && p.userName.charAt(0).toUpperCase()}
          </div>
        );
      })}
      {overflow > 0 && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: '#E5E7EB',
            marginLeft: -6,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#374151',
            fontWeight: 600,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
