import { type CollabRole } from '@/lib/collaboration';
import { useTranslations } from 'next-intl';

const ROLE_COLORS: Record<CollabRole, { bg: string; fg: string }> = {
  owner: { bg: '#00447B', fg: '#FFFFFF' },
  editor: { bg: '#FF8210', fg: '#FFFFFF' },
  viewer: { bg: '#E5E7EB', fg: '#374151' },
};

export function RoleBadge({ role }: { role: CollabRole }) {
  const t = useTranslations('collab.roles');
  const colors = ROLE_COLORS[role];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: colors.bg,
      color: colors.fg,
      fontFamily: 'Inter, sans-serif',
      letterSpacing: 0.2,
      textTransform: 'uppercase',
    }}>
      {t(role)}
    </span>
  );
}
