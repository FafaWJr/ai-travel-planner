'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { Patch, PatchType } from '@/lib/trip-patches';

interface PendingToast {
  name: string;
  type: PatchType;
  at: number;
}

interface CollabToastProps {
  patch: Patch | null;
}

function toastKey(type: PatchType): string {
  switch (type) {
    case 'accept_activity': return 'activityAccepted';
    case 'decline_activity': return 'activityDeclined';
    case 'add_activity': return 'activityAdded';
    case 'remove_activity': return 'activityRemoved';
    case 'confirm_day': return 'dayConfirmed';
    case 'add_note':
    case 'update_note':
    case 'remove_note': return 'notesUpdated';
    default: return 'madeChange';
  }
}

export default function CollabToast({ patch }: CollabToastProps) {
  const t = useTranslations('collab.toast');
  const [message, setMessage] = useState<string | null>(null);
  const pendingRef = useRef<PendingToast[]>([]);
  const throttleUntilRef = useRef<number>(0);
  const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(() => setMessage(null), 3000);
  }, []);

  const flushBatch = useCallback(() => {
    const batch = pendingRef.current;
    pendingRef.current = [];
    if (batch.length === 0) return;

    const now = Date.now();
    throttleUntilRef.current = now + 3000;

    if (batch.length === 1) {
      const { name, type } = batch[0];
      const key = toastKey(type);
      showMessage(t(key as 'madeChange', { name }));
    } else {
      const firstName = batch[0].name;
      const senderNames = [...new Set(batch.map((b) => b.name))];
      const name = senderNames.length === 1 ? firstName : senderNames.slice(0, 2).join(' & ');
      showMessage(t('madeChanges', { name, count: batch.length }));
    }
  }, [t, showMessage]);

  useEffect(() => {
    if (!patch) return;
    const now = Date.now();
    pendingRef.current.push({ name: patch.userName, type: patch.payload.type, at: now });

    if (now < throttleUntilRef.current) {
      // Throttled — batch and wait
      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(() => {
          batchTimerRef.current = null;
          flushBatch();
        }, throttleUntilRef.current - now + 50);
      }
      return;
    }

    // Not throttled — flush immediately after a short tick to catch burst
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(() => {
      batchTimerRef.current = null;
      flushBatch();
    }, 80);
  }, [patch, flushBatch]);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      zIndex: 9500,
      background: '#00447B',
      color: '#fff',
      borderRadius: 12,
      padding: '12px 20px',
      fontFamily: "'Inter',sans-serif",
      fontSize: 13,
      fontWeight: 500,
      boxShadow: '0 6px 24px rgba(0,68,123,0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      animation: 'collabToastIn 0.25s ease both',
      maxWidth: 'min(320px, calc(100vw - 48px))',
    }}>
      <span style={{
        background: 'rgba(103,154,193,0.30)',
        borderRadius: '50%',
        width: 22,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFBD59" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </span>
      {message}
      <style>{`@keyframes collabToastIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
