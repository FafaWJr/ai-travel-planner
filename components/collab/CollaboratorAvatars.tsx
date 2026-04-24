'use client';

import { type CollabRole } from '@/lib/collaboration';

type Avatar = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: CollabRole;
};

const ROLE_BORDER: Record<CollabRole, string> = {
  owner: '#00447B',
  editor: '#FF8210',
  viewer: '#9CA3AF',
};

export function CollaboratorAvatars({
  collaborators,
  maxVisible = 3,
}: {
  collaborators: Avatar[];
  maxVisible?: number;
}) {
  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - visible.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((c) => (
        <div
          key={c.userId}
          title={`${c.name} (${c.role})`}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `2px solid ${ROLE_BORDER[c.role]}`,
            backgroundColor: '#E5E7EB',
            backgroundImage: c.avatarUrl ? `url(${c.avatarUrl})` : undefined,
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
          {!c.avatarUrl && c.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div style={{
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
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}
