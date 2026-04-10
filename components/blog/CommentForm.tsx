'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CommentFormProps {
  postSlug: string;
  onCommentAdded: () => void;
}

export default function CommentForm({ postSlug, onCommentAdded }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to comment.');
      setIsSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('blog_comments')
      .insert({
        post_slug: postSlug,
        user_id: user.id,
        comment_text: comment.trim(),
        is_approved: false,
      });

    if (insertError) {
      setError('Failed to post comment. Please try again.');
      setIsSubmitting(false);
      return;
    }

    setComment('');
    setIsSubmitting(false);
    onCommentAdded();
  };

  const isDirty = comment.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <div style={{ position: 'relative' }}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience or ask a question..."
          rows={4}
          maxLength={1000}
          required
          style={{
            width: '100%',
            padding: '14px 16px',
            border: '1.5px solid #C0C0C0',
            borderRadius: 10,
            fontSize: 14,
            fontFamily: "'Inter', sans-serif",
            color: '#3b3b3b',
            background: '#fafafa',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#FF8210'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#C0C0C0'; }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9ca3af' }}>
          {comment.length}/1000
        </span>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          style={{
            background: isDirty && !isSubmitting ? '#FF8210' : '#e5e7eb',
            color: isDirty && !isSubmitting ? '#fff' : '#9ca3af',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: 14,
            cursor: isDirty && !isSubmitting ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
      {error && (
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#dc2626', marginTop: 8 }}>
          {error}
        </p>
      )}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
        Your comment will be reviewed before appearing publicly.
      </p>
    </form>
  );
}
