'use client';

import { useState } from 'react';
import type { Phase } from '@/types';

interface RangeSummaryCardProps {
  phase: Phase;
  onPlanDays: () => Promise<void>;
}

export default function RangeSummaryCard({ phase, onPlanDays }: RangeSummaryCardProps) {
  const [isPlanning, setIsPlanning] = useState(false);
  const dayCount = phase.dayTo - phase.dayFrom + 1;

  const handleClick = async () => {
    if (isPlanning) return;
    setIsPlanning(true);
    try {
      await onPlanDays();
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(0,68,123,0.04)',
      border: '1px dashed rgba(0,68,123,0.20)',
      borderRadius: 12,
      padding: '14px 18px',
      marginBottom: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div>
        <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#00447B', margin: 0 }}>
          Days {phase.dayFrom}&ndash;{phase.dayTo}: {phase.label}
        </p>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#6C6D6F', margin: '2px 0 0' }}>
          {dayCount} day{dayCount !== 1 ? 's' : ''} &middot; tap &ldquo;Plan these days&rdquo; to expand
        </p>
      </div>
      <button
        onClick={handleClick}
        disabled={isPlanning}
        style={{
          background: isPlanning ? 'rgba(255,130,16,0.7)' : '#FF8210',
          color: '#fff',
          border: 'none',
          fontFamily: "'Poppins',sans-serif",
          fontWeight: 600,
          fontSize: 13,
          padding: '8px 18px',
          borderRadius: 100,
          cursor: isPlanning ? 'default' : 'pointer',
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {isPlanning ? (
          <>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.4)',
              borderTop: '1.5px solid #fff',
              animation: 'rangeSpin 0.7s linear infinite',
              display: 'inline-block',
            }} />
            Planning...
          </>
        ) : 'Plan these days'}
      </button>
      <style>{`@keyframes rangeSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
