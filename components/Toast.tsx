'use client';
import { useEffect } from 'react';

export type ToastVariant = 'success' | 'error';

export default function Toast({
  message,
  onDismiss,
  variant = 'success',
}: {
  message: string;
  onDismiss: () => void;
  variant?: ToastVariant;
}) {
  // P2-1: error toasts hold longer so users can read recovery instructions.
  const duration = variant === 'error' ? 5000 : 2500;
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  const isError = variant === 'error';
  // P2-1: zIndex 10000 sits above UnsavedChangesModal (9999) so the R2b
  // refusal toast is visible during the modal's save-and-leave flow.
  const bg = isError ? '#B91C1C' : '#00447B';
  const iconBg = isError ? 'rgba(252,165,165,0.20)' : 'rgba(74,222,128,0.20)';
  const iconColor = isError ? '#FCA5A5' : '#4ADE80';
  const iconChar = isError ? '!' : '✓';

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: 24, zIndex: 10000,
      background: bg, color: '#fff',
      borderRadius: 12, padding: '12px 20px',
      fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
      boxShadow: '0 6px 24px rgba(0,68,123,0.25)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'toastSlideIn 0.25s ease both',
      maxWidth: 320,
    }}>
      <span style={{
        background: iconBg, borderRadius: '50%',
        width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: iconColor, fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>{iconChar}</span>
      {message}
      <style>{`@keyframes toastSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
