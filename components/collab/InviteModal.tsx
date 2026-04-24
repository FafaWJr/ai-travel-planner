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

  async function handleCopy(url: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
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
                  onClick={() => handleCopy(editorUrl)}
                  style={{ padding: '8px 14px', background: '#FF8210', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  {t('copyButton')}
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
                  onClick={() => handleCopy(viewerUrl)}
                  style={{ padding: '8px 14px', background: '#00447B', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                >
                  {t('copyButton')}
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
