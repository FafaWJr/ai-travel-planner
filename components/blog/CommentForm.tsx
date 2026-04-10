'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CommentFormProps {
  postSlug: string;
  onSuccess: () => void;
}

export default function CommentForm({ postSlug, onSuccess }: CommentFormProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || comment.trim().length < 10) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: insertError } = await supabase
      .from('blog_comments')
      .insert({ post_slug: postSlug, user_id: userId, comment_text: comment.trim(), is_approved: true });

    if (insertError) {
      setError('Failed to post comment. Please try again.');
    } else {
      setComment('');
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        setSuccess(false);
      }, 400);
    }

    setIsSubmitting(false);
  };

  const isDirty = comment.trim().length >= 10;

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        placeholder="Share your experience or ask a question..."
        rows={4}
        maxLength={1000}
        required
        disabled={!userId}
        style={{
          width: '100%', padding: '14px 16px',
          border: '1.5px solid #C0C0C0', borderRadius: 10,
          fontSize: 14, fontFamily: "'Inter', sans-serif", color: '#3b3b3b',
          background: '#fafafa', resize: 'vertical', outline: 'none',
          boxSizing: 'border-box', transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#FF8210'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#C0C0C0'; }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9ca3af' }}>{comment.length}/1000</span>
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          style={{
            background: isDirty && !isSubmitting ? '#FF8210' : '#e5e7eb',
            color: isDirty && !isSubmitting ? '#fff' : '#9ca3af',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14,
            cursor: isDirty && !isSubmitting ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s',
          }}
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
      {error && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#dc2626', marginTop: 8 }}>{error}</p>}
      {success && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#16a34a', fontWeight: 600, marginTop: 8 }}>Comment posted successfully!</p>}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
        {userId ? 'Your comment will appear immediately below.' : 'You must be signed in to comment.'}
      </p>
    </form>
  );
}
