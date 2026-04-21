'use client';

export default function AddPhaseButton({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      style={{
        width: '100%',
        background: 'transparent',
        border: '2px dashed rgba(0,68,123,0.30)',
        borderRadius: 14,
        padding: '16px 24px',
        marginTop: 12,
        cursor: 'pointer',
        fontFamily: "'Poppins',sans-serif",
        fontWeight: 600,
        fontSize: 14,
        color: '#00447B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        transition: 'all 150ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#FF8210';
        e.currentTarget.style.color = '#FF8210';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(0,68,123,0.30)';
        e.currentTarget.style.color = '#00447B';
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Add a phase
    </button>
  );
}
