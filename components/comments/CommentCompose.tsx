'use client';

import { useState } from 'react';

interface CommentComposeProps {
  tripId: string;
  targetType: 'activity' | 'day' | 'phase' | 'hotel';
  targetId: string;
  originalDayId?: string;
  onSubmitted: () => void;
  placeholder: string;
  submitLabel: string;
}

export default function CommentCompose({
  tripId, targetType, targetId, originalDayId, onSubmitted, placeholder, submitLabel,
}: CommentComposeProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const overLimit = text.length > 500;
  const canSubmit = text.trim().length > 0 && !overLimit && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const body: Record<string, string> = { target_type: targetType, target_id: targetId, comment_text: text.trim() };
      if (originalDayId) body.original_day_id = originalDayId;
      const res = await fetch(`/api/trips/${tripId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setText('');
        onSubmitted();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
        style={{
          width: '100%', resize: 'vertical', maxHeight: 120,
          border: `1px solid ${overLimit ? '#DC2626' : 'rgba(0,68,123,0.18)'}`,
          borderRadius: 8, padding: '8px 10px',
          fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#333',
          outline: 'none', boxSizing: 'border-box', lineHeight: 1.5,
          transition: 'border-color 0.15s',
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: overLimit ? '#DC2626' : '#9CA3AF' }}>
          {text.length}/500
        </span>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            background: canSubmit ? '#00447B' : 'rgba(0,68,123,0.25)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '5px 14px', fontFamily: "'Poppins',sans-serif",
            fontSize: 12, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          {loading ? '...' : submitLabel}
        </button>
      </div>
    </div>
  );
}
