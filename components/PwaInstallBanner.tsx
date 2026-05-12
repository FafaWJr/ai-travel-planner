'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Already dismissed
    if (localStorage.getItem('luna_pwa_dismissed')) return;

    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Track and gate on 2+ visits
    const visits = parseInt(localStorage.getItem('luna_visit_count') ?? '0', 10) + 1;
    localStorage.setItem('luna_visit_count', String(visits));
    if (visits < 2) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem('luna_pwa_dismissed', 'true');
    setShow(false);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      zIndex: 9998,
      padding: '12px 16px',
      background: '#00447B',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 -4px 20px rgba(0,20,60,0.15)',
    }}>
      <Download size={16} color="#FFBD59" style={{ flexShrink: 0 }} />
      <p style={{
        fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
        color: '#fff', margin: 0, flex: 1,
      }}>
        Add Luna to your home screen for the best experience
      </p>
      <button
        onClick={handleInstall}
        style={{
          padding: '7px 16px', borderRadius: 100,
          background: '#FF8210', color: '#fff', border: 'none',
          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 4, lineHeight: 0, flexShrink: 0,
        }}
      >
        <X size={16} color="rgba(255,255,255,0.5)" />
      </button>
    </div>
  );
}
