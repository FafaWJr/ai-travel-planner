'use client';
import Link from 'next/link';

interface Props {
  onClose: () => void;
  featureName?: string;
}

export default function GateOverlay({ onClose, featureName }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9990,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'gateBackdropIn 0.15s ease both',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '40px 32px',
          maxWidth: 360, width: '100%', textAlign: 'center', position: 'relative',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          border: '1.5px solid rgba(0,68,123,0.10)',
          animation: 'gateCardIn 0.18s ease both',
        }}
      >
        {/* Dismiss */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#C0C0C0', padding: 4, lineHeight: 1,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Lock icon */}
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(255,130,16,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#FF8210" strokeWidth="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FF8210" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1.5" fill="#FF8210"/>
          </svg>
        </div>

        <h3 style={{
          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 19,
          color: '#00447B', marginBottom: 10,
        }}>
          Login to unlock this feature
        </h3>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#6C6D6F',
          lineHeight: 1.6, marginBottom: 24,
        }}>
          {featureName
            ? `${featureName} is available to registered users. `
            : 'This feature is available to registered users. '}
          Sign in or create a free account to continue.
        </p>

        <Link
          href="/auth/login"
          style={{
            display: 'block', padding: '12px 0', borderRadius: 100,
            background: '#FF8210', color: '#fff', textDecoration: 'none',
            fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 15,
            marginBottom: 14,
          }}
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          style={{
            fontFamily: "'Inter',sans-serif", fontSize: 14,
            color: '#679AC1', textDecoration: 'underline',
          }}
        >
          Create free account
        </Link>
      </div>

      <style>{`
        @keyframes gateBackdropIn { from { opacity:0; } to { opacity:1; } }
        @keyframes gateCardIn { from { opacity:0; transform:translateY(14px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
