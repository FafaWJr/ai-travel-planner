'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import CommentForm from './CommentForm';
import CommentsList from './CommentsList';

interface CommentsSectionProps {
  postSlug: string;
}

export default function CommentsSection({ postSlug }: CommentsSectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  if (isAuthenticated === null) return null;

  return (
    <section style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '2px solid #f0f0f0' }}>
      <h2 style={{
        fontFamily: "'Poppins', sans-serif", fontWeight: 700,
        fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', color: '#00447B', marginBottom: '0.75rem',
      }}>
        Share Your Experience
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#6C6D6F', marginBottom: '2rem', lineHeight: 1.65 }}>
        Have you been to Fiji? Share your tips, recommendations, or questions below.
      </p>

      {isAuthenticated ? (
        <>
          <CommentForm postSlug={postSlug} onCommentAdded={() => setRefreshTrigger(p => p + 1)} />
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{
              fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.1rem',
              color: '#00447B', marginBottom: '1.25rem',
            }}>
              Traveller Comments
            </h3>
            <CommentsList postSlug={postSlug} refreshTrigger={refreshTrigger} />
          </div>
        </>
      ) : (
        <div style={{
          background: '#F7F8FA', borderRadius: 16, padding: '2.5rem',
          textAlign: 'center', border: '1.5px solid rgba(0,68,123,0.08)',
        }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#3b3b3b', marginBottom: '1.25rem', lineHeight: 1.65 }}>
            Sign in to share your travel stories and connect with fellow travellers.
          </p>
          <Link
            href={`/auth/returning?luna_redirect_after_login=/blog/${postSlug}`}
            style={{
              display: 'inline-block', background: '#FF8210', color: '#fff',
              fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14,
              padding: '12px 28px', borderRadius: 10, textDecoration: 'none',
            }}
          >
            Sign In to Comment
          </Link>
        </div>
      )}
    </section>
  );
}
