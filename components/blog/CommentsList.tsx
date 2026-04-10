'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface CommentsListProps {
  postSlug: string;
  refreshTrigger?: number;
}

export default function CommentsList({ postSlug, refreshTrigger = 0 }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postSlug, refreshTrigger]);

  const fetchComments = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('blog_comments')
      .select(`id, comment_text, created_at, profiles (full_name)`)
      .eq('post_slug', postSlug)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setComments(data as unknown as Comment[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#9ca3af' }}>
        Loading comments...
      </p>
    );
  }

  if (comments.length === 0) {
    return (
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#9ca3af', fontStyle: 'italic' }}>
        No comments yet. Be the first to share your experience!
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {comments.map(comment => {
        const name = comment.profiles?.full_name || 'Traveller';
        const initial = name.charAt(0).toUpperCase();
        const date = new Date(comment.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        });

        return (
          <div key={comment.id} style={{ background: '#F7F8FA', borderRadius: 12, padding: '1.2rem 1.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: '#00447B', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {initial}
              </div>
              <div>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: '#00447B' }}>
                  {name}
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9ca3af' }}>
                  {date}
                </div>
              </div>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#3b3b3b', lineHeight: 1.7, margin: 0 }}>
              {comment.comment_text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
