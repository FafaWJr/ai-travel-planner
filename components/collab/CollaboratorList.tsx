'use client';

import { useTranslations } from 'next-intl';
import { type CollabRole } from '@/lib/collaboration';
import { RoleBadge } from './RoleBadge';

export type Collaborator = {
  user_id: string;
  role: CollabRole;
  joined_at: string;
  profiles: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
};

export function CollaboratorList({
  collaborators,
  currentUserRole,
  onRoleChange,
  onRemove,
}: {
  collaborators: Collaborator[];
  currentUserRole: CollabRole;
  onRoleChange: (userId: string, newRole: 'viewer' | 'editor') => void;
  onRemove: (userId: string) => void;
}) {
  const t = useTranslations('collab.invite');
  const isOwner = currentUserRole === 'owner';

  if (collaborators.length === 0) {
    return <p style={{ color: '#6B7280', fontSize: 14 }}>{t('noCollaborators')}</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {collaborators.map((c) => (
        <li key={c.user_id} style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 0',
          borderBottom: '1px solid #F3F4F6',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#00447B' }}>
              {c.profiles?.full_name || c.profiles?.email || t('unknownUser')}
            </span>
            <RoleBadge role={c.role} />
          </div>
          {isOwner && c.role !== 'owner' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {c.role === 'viewer' && (
                <button
                  onClick={() => onRoleChange(c.user_id, 'editor')}
                  style={{ fontSize: 12, color: '#FF8210', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {t('promoteToEditor')}
                </button>
              )}
              {c.role === 'editor' && (
                <button
                  onClick={() => onRoleChange(c.user_id, 'viewer')}
                  style={{ fontSize: 12, color: '#00447B', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {t('demoteToViewer')}
                </button>
              )}
              <button
                onClick={() => onRemove(c.user_id)}
                style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('remove')}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
