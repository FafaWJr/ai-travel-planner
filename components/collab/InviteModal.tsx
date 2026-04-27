'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { CollaboratorList, type Collaborator } from './CollaboratorList';

export function InviteModal({
  tripId,
  locale,
  onClose,
}: {
  tripId: string;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations('collab.invite');
  const [viewerToken, setViewerToken] = useState<string | null>(null);
  const [editorToken, setEditorToken] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedRole, setCopiedRole] = useState<'editor' | 'viewer' | null>(null);
  const [copyFailedRole, setCopyFailedRole] = useState<'editor' | 'viewer' | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const viewerUrl = viewerToken ? `${origin}/${locale}/trip/${tripId}?invite=${viewerToken}` : '';
  const editorUrl = editorToken ? `${origin}/${locale}/trip/${tripId}?invite=${editorToken}` : '';

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [vRes, eRes, cRes] = await Promise.all([
      fetch(`/api/trips/${tripId}/share?role=viewer`, { method: 'POST' }),
      fetch(`/api/trips/${tripId}/share?role=editor`, { method: 'POST' }),
      fetch(`/api/trips/${tripId}/collaborators`),
    ]);
    const v = await vRes.json().catch(() => ({}));
    const e = await eRes.json().catch(() => ({}));
    const c = await cRes.json().catch(() => ({}));

    setViewerToken(v.token ?? null);
    setEditorToken(e.token ?? null);
    setCollaborators(c.collaborators ?? []);
    setLoading(false);
  }, [tripId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function handleCopy(role: 'editor' | 'viewer', url: string) {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard unavailable');
      }
      await navigator.clipboard.writeText(url);
      setCopiedRole(role);
      setCopyFailedRole(null);
      setTimeout(() => setCopiedRole(prev => prev === role ? null : prev), 1500);
    } catch (err) {
      console.warn('[InviteModal] clipboard write failed', err);
      setCopyFailedRole(role);
      setCopiedRole(null);
      setTimeout(() => setCopyFailedRole(prev => prev === role ? null : prev), 1500);
    }
  }

  async function handleRegenerate(role: 'viewer' | 'editor') {
    const confirmed = window.confirm(t('regenerateConfirm'));
    if (!confirmed) return;
    const res = await fetch(`/api/trips/${tripId}/share/regenerate?role=${role}`, { method: 'POST' });
    const body = await res.json();
    if (role === 'viewer') setViewerToken(body.token);
    else setEditorToken(body.token);
  }

  async function handleRoleChange(userId: string, newRole: 'viewer' | 'editor') {
    await fetch(`/api/trips/${tripId}/collaborators/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    await loadAll();
  }

  async function handleRemove(userId: string) {
    const confirmed = window.confirm(t('removeConfirm'));
    if (!confirmed) return;
    await fetch(`/api/trips/${tripId}/collaborators/${userId}`, { method: 'DELETE' });
    await loadAll();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: 12,
          padding: 28,
          width: '90%',
          maxWidth: 520,
          maxHeight: '85vh',
          overflowY: 'auto',
          fontFamily: 'Inter, Lato, sans-serif',
          color: '#00447B',
        }}
      >
        <h2 style={{ fontFamily: 'Poppins, sans-serif', color: '#00447B', marginTop: 0 }}>
          {t('title')}
        </h2>

        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          {copiedRole && t('copiedAnnouncement')}
          {copyFailedRole && t('copyFailedAnnouncement')}
        </div>

        {loading ? (
          <p>{t('loading')}</p>
        ) : (
          <>
            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, color: '#00447B', marginBottom: 6 }}>{t('editorLinkLabel')}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={editorUrl}
                  style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6 }}
                />
                <button
                  onClick={() => handleCopy('editor', editorUrl)}
                  aria-label={t('copyEditorAriaLabel')}
                  style={{
                    padding: '8px 14px',
                    background:
                      copyFailedRole === 'editor' ? '#EF4444' :
                      copiedRole === 'editor' ? '#10B981' :
                      '#FF8210',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    minWidth: 88,
                    transform: copiedRole === 'editor' ? 'scale(1.03)' : 'scale(1)',
                    transition: 'background 200ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {copyFailedRole === 'editor' ? t('copyFailed') :
                   copiedRole === 'editor' ? t('copied') :
                   t('copyButton')}
                </button>
              </div>
              <button
                onClick={() => handleRegenerate('editor')}
                style={{ marginTop: 6, fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('regenerateEditor')}
              </button>
            </section>

            <section style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, color: '#00447B', marginBottom: 6 }}>{t('viewerLinkLabel')}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  readOnly
                  value={viewerUrl}
                  style={{ flex: 1, padding: '8px 10px', fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 6 }}
                />
                <button
                  onClick={() => handleCopy('viewer', viewerUrl)}
                  aria-label={t('copyViewerAriaLabel')}
                  style={{
                    padding: '8px 14px',
                    background:
                      copyFailedRole === 'viewer' ? '#EF4444' :
                      copiedRole === 'viewer' ? '#10B981' :
                      '#00447B',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontWeight: 600,
                    minWidth: 88,
                    transform: copiedRole === 'viewer' ? 'scale(1.03)' : 'scale(1)',
                    transition: 'background 200ms ease, transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {copyFailedRole === 'viewer' ? t('copyFailed') :
                   copiedRole === 'viewer' ? t('copied') :
                   t('copyButton')}
                </button>
              </div>
              <button
                onClick={() => handleRegenerate('viewer')}
                style={{ marginTop: 6, fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('regenerateViewer')}
              </button>
            </section>

            <section>
              <h3 style={{ fontSize: 14, color: '#00447B', marginBottom: 6 }}>{t('collaboratorsLabel')}</h3>
              <CollaboratorList
                collaborators={collaborators}
                currentUserRole="owner"
                onRoleChange={handleRoleChange}
                onRemove={handleRemove}
              />
            </section>

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 6, cursor: 'pointer' }}
              >
                {t('closeButton')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
