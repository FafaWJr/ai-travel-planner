'use client';

import { useTranslations } from 'next-intl';
import { RoleBadge } from './RoleBadge';

export function JoinTripPrompt({
  role,
  onAccept,
  onDecline,
}: {
  role: 'viewer' | 'editor';
  onAccept: () => void;
  onDecline: () => void;
}) {
  const t = useTranslations('collab.share');

  return (
    <div style={{ maxWidth: 480, padding: 24 }}>
      <h1 style={{ fontFamily: 'Poppins, sans-serif', color: '#00447B', marginBottom: 12 }}>
        {t('promptTitle')}
      </h1>
      <p style={{ color: '#374151', marginBottom: 16 }}>
        {t('promptBody')} <RoleBadge role={role} />
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onAccept}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: '#FF8210',
            color: 'white',
            border: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t('acceptButton')}
        </button>
        <button
          onClick={onDecline}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            background: 'transparent',
            color: '#00447B',
            border: '1px solid #00447B',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {t('declineButton')}
        </button>
      </div>
    </div>
  );
}
