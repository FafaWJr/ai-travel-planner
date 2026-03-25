'use client';
import { useEffect } from 'react';

export default function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 24, zIndex: 9990,
      background: '#00447B', color: '#fff',
      borderRadius: 12, padding: '12px 20px',
      fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
      boxShadow: '0 6px 24px rgba(0,68,123,0.25)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'toastSlideIn 0.25s ease both',
      maxWidth: 320,
    }}>
      <span style={{
        background: 'rgba(74,222,128,0.20)', borderRadius: '50%',
        width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#4ADE80', fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>✓</span>
      {message}
      <style>{`@keyframes toastSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
