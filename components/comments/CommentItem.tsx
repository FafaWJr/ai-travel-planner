'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Comment } from '@/lib/comment-types';

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'yesterday';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function Avatar({ name, url }: { name: string | null; url: string | null }) {
  const initials = (name ?? '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  if (url) {
    return <img src={url} alt={name ?? ''} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#00447B', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins',sans-serif", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId: string;
  isOwner: boolean;
  tripId: string;
  onUpdated: () => void;
  saveLabel: string;
  cancelLabel: string;
  editLabel: string;
  deleteLabel: string;
  deleteConfirmText: string;
  isOrphaned?: boolean;
  orphanedSubtitle?: string;
}

export default function CommentItem({
  comment, currentUserId, isOwner, tripId, onUpdated,
  saveLabel, cancelLabel, editLabel, deleteLabel, deleteConfirmText,
  isOrphaned, orphanedSubtitle,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.comment_text);
  const [saving, setSaving] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isAuthor = comment.user_id === currentUserId;
  const canEdit = isAuthor && !isOrphaned;
  const canDelete = isAuthor || isOwner;

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === comment.comment_text) { setEditing(false); return; }
    setSaving(true);
    try {
      await fetch(`/api/trips/${tripId}/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_text: draft.trim() }),
      });
      onUpdated();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(deleteConfirmText)) return;
    await fetch(`/api/trips/${tripId}/comments/${comment.id}`, { method: 'DELETE' });
    onUpdated();
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '6px 0' }}
    >
      <Avatar name={comment.profiles?.full_name ?? null} url={comment.profiles?.avatar_url ?? null} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: '#00447B' }}>
            {comment.profiles?.full_name ?? 'Someone'}
          </span>
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#9CA3AF' }}>
            {relativeTime(comment.created_at)}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#C0C0C0' }}>(edited)</span>
          )}
          {(canEdit || canDelete) && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
              {canEdit && (
                <button onClick={() => setEditing(true)} aria-label={editLabel}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#6C6D6F', display: 'flex', alignItems: 'center' }}>
                  <Pencil size={13} />
                </button>
              )}
              {canDelete && (
                <button onClick={handleDelete} aria-label={deleteLabel}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#6C6D6F', display: 'flex', alignItems: 'center' }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>
        {isOrphaned && orphanedSubtitle && (
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#9CA3AF', margin: '0 0 3px', fontStyle: 'italic' }}>
            {orphanedSubtitle}
          </p>
        )}
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={2}
              style={{ width: '100%', resize: 'vertical', border: '1px solid rgba(0,68,123,0.18)', borderRadius: 6, padding: '5px 8px', fontFamily: "'Inter',sans-serif", fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button onClick={handleSave} disabled={saving}
                style={{ background: '#00447B', color: '#fff', border: 'none', borderRadius: 10, padding: '3px 12px', fontSize: 11, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Poppins',sans-serif" }}>
                {saving ? '...' : saveLabel}
              </button>
              <button onClick={() => { setEditing(false); setDraft(comment.comment_text); }}
                style={{ background: 'none', border: '1px solid rgba(0,68,123,0.18)', borderRadius: 10, padding: '3px 12px', fontSize: 11, cursor: 'pointer', fontFamily: "'Inter',sans-serif", color: '#555' }}>
                {cancelLabel}
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#333', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
            {comment.comment_text}
          </p>
        )}
      </div>
    </div>
  );
}
