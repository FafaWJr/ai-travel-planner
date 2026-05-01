'use client';

import { useState } from 'react';
import { MessageCircleOff } from 'lucide-react';
import CommentIcon from './CommentIcon';
import CommentCompose from './CommentCompose';
import CommentItem from './CommentItem';
import type { Comment, CommentConfig } from '@/lib/comment-types';

const VISIBLE_COUNT = 5;

interface CommentThreadProps {
  config: CommentConfig;
  targetType: 'activity' | 'day' | 'phase' | 'hotel';
  targetId: string;
  /** If set, used as original_day_id when creating activity comments. */
  originalDayId?: string;
  /** Override count displayed on the icon (for aggregated day/phase counts). */
  countOverride?: number;
  /** Orphaned comments to show at the bottom of a day card. */
  orphanedComments?: Comment[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

export default function CommentThread({
  config, targetType, targetId, originalDayId, countOverride, orphanedComments, t,
}: CommentThreadProps) {
  const { tripId, comments, currentUserId, isOwner, onRefresh } = config;
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [orphanExpanded, setOrphanExpanded] = useState(false);

  const filtered = comments.filter(c => c.target_type === targetType && c.target_id === targetId);
  const count = countOverride ?? filtered.length;

  const visibleComments = showAll || filtered.length <= VISIBLE_COUNT
    ? filtered
    : filtered.slice(-VISIBLE_COUNT);
  const hiddenCount = filtered.length - visibleComments.length;

  const orphans = orphanedComments ?? [];

  return (
    <div>
      {/* Icon toggle */}
      <CommentIcon
        count={count}
        isExpanded={expanded}
        onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
      />

      {/* Thread panel */}
      {expanded && (
        <div style={{
          marginTop: 6, padding: '10px 12px',
          background: 'rgba(0,68,123,0.03)',
          border: '1px solid rgba(0,68,123,0.10)',
          borderRadius: 10,
        }}>
          {filtered.length === 0 && (
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#9CA3AF', margin: '0 0 8px', textAlign: 'center' }}>
              {t('comments.noComments')}
            </p>
          )}

          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#00447B', padding: '0 0 8px', textDecoration: 'underline' }}
            >
              {t('comments.showMore', { count: hiddenCount })}
            </button>
          )}

          {visibleComments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              isOwner={isOwner}
              tripId={tripId}
              onUpdated={onRefresh}
              saveLabel={t('comments.save')}
              cancelLabel={t('comments.cancel')}
              editLabel={t('comments.edit')}
              deleteLabel={t('comments.delete')}
              deleteConfirmText={t('comments.deleteConfirm')}
            />
          ))}

          <CommentCompose
            tripId={tripId}
            targetType={targetType}
            targetId={targetId}
            originalDayId={originalDayId}
            onSubmitted={onRefresh}
            placeholder={t('comments.placeholder')}
            submitLabel={t('comments.submit')}
          />

          {/* Orphaned comments section */}
          {orphans.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,68,123,0.08)' }}>
              <button
                onClick={() => setOrphanExpanded(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF' }}
              >
                <MessageCircleOff size={14} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
                  {t('comments.orphanedTitle', { count: orphans.length })}
                </span>
              </button>
              {orphanExpanded && (
                <div style={{ marginTop: 6, paddingLeft: 6, borderLeft: '2px solid rgba(0,68,123,0.08)' }}>
                  {orphans.map(c => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      currentUserId={currentUserId}
                      isOwner={isOwner}
                      tripId={tripId}
                      onUpdated={onRefresh}
                      saveLabel={t('comments.save')}
                      cancelLabel={t('comments.cancel')}
                      editLabel={t('comments.edit')}
                      deleteLabel={t('comments.delete')}
                      deleteConfirmText={t('comments.deleteConfirm')}
                      isOrphaned
                      orphanedSubtitle={t('comments.orphanedSubtitle')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Returns the comment count for a day (day-level + all child activity comments). */
export function dayCommentCount(
  dayId: string,
  activityIds: string[],
  comments: Comment[]
): number {
  return comments.filter(c =>
    (c.target_type === 'day' && c.target_id === dayId) ||
    (c.target_type === 'activity' && activityIds.includes(c.target_id))
  ).length;
}

/** Returns orphaned activity comments for a day (original_day_id matches, but activity no longer exists). */
export function orphanedActivityComments(
  dayId: string,
  activityIds: string[],
  comments: Comment[]
): Comment[] {
  return comments.filter(c =>
    c.target_type === 'activity' &&
    c.original_day_id === dayId &&
    !activityIds.includes(c.target_id)
  );
}
