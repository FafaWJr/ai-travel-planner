'use client';

import { MessageCircle } from 'lucide-react';

interface CommentIconProps {
  count: number;
  isExpanded: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export default function CommentIcon({ count, isExpanded, onClick }: CommentIconProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`${count} comment${count !== 1 ? 's' : ''}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: isExpanded ? 'rgba(0,68,123,0.08)' : 'transparent',
        border: 'none', cursor: 'pointer', padding: '3px 6px',
        borderRadius: 20, transition: 'background 0.15s', flexShrink: 0,
      }}
    >
      <MessageCircle
        size={16}
        color={count > 0 ? '#00447B' : '#C0C0C0'}
        fill={isExpanded ? 'rgba(0,68,123,0.12)' : 'none'}
        strokeWidth={1.8}
      />
      {count > 0 && (
        <span style={{
          fontFamily: "'Inter',sans-serif", fontSize: 11, fontWeight: 700,
          color: '#fff', background: '#FF8210',
          minWidth: 16, height: 16, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px', lineHeight: 1,
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
