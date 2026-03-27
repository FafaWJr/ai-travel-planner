'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-section)', padding: '24px 16px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ marginBottom: 32, display: 'block' }}>
        <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 64, width: 'auto' }} />
      </Link>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#fff', borderRadius: 'var(--r-lg)',
        border: '1.5px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        padding: 'clamp(28px, 5vw, 40px)',
        textAlign: sent ? 'center' : 'left',
      }}>
        {sent ? (
          <>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(22,163,74,0.10)', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#16A34A" strokeWidth="1.8"/>
                <path d="M8 12l3 3 5-5" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', marginBottom: 10 }}>
              Check your inbox
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)', lineHeight: 1.6, marginBottom: 24 }}>
              We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
            </p>
            <Link href="/auth/login" style={{
              display: 'inline-block', fontFamily: 'var(--font-body)', fontSize: 14,
              color: 'var(--navy)', textDecoration: 'underline',
            }}>
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 style={{
              fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 26,
              color: 'var(--navy)', marginBottom: 6,
            }}>
              Forgot password?
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)', marginBottom: 28 }}>
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>
                  Email
                </label>
                <input
                  type="email" required autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    padding: '11px 14px', borderRadius: 'var(--r-md)',
                    border: '1.5px solid var(--border)',
                    fontFamily: 'var(--font-body)', fontSize: 14, color: '#000',
                    outline: 'none', background: '#fff', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {error && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#DC2626', margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  marginTop: 4, padding: '12px 0', borderRadius: 'var(--r-md)',
                  background: loading ? 'rgba(255,130,16,0.6)' : 'var(--orange)',
                  color: '#fff', border: 'none',
                  fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'default' : 'pointer', transition: 'background 0.15s',
                }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <Link href="/auth/login" style={{
                fontFamily: 'var(--font-body)', fontSize: 13,
                color: 'var(--navy-mid)', textAlign: 'center', textDecoration: 'underline',
              }}>
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
