'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/* ── Google "G" SVG logo ──────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M47.5 24.5c0-1.63-.15-3.2-.42-4.71H24.5v8.92h12.92c-.56 2.96-2.24 5.47-4.77 7.15v5.93h7.73C44.5 37.58 47.5 31.52 47.5 24.5z" fill="#4285F4"/>
      <path d="M24.5 48c6.48 0 11.92-2.15 15.88-5.81l-7.73-5.93c-2.15 1.44-4.9 2.29-8.15 2.29-6.27 0-11.58-4.24-13.48-9.93H3.05v6.12C6.99 42.69 15.12 48 24.5 48z" fill="#34A853"/>
      <path d="M11.02 28.62A14.44 14.44 0 0 1 10.5 24c0-1.6.27-3.15.52-4.62V13.26H3.05A23.97 23.97 0 0 0 .5 24c0 3.87.93 7.53 2.55 10.74l8.47-6.12z" fill="#FBBC05"/>
      <path d="M24.5 9.55c3.54 0 6.71 1.22 9.21 3.6l6.9-6.9C36.4 2.39 30.97 0 24.5 0 15.12 0 6.99 5.31 3.05 13.26l8.47 6.12C13.42 13.78 18.73 9.55 24.5 9.55z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next        = searchParams.get('next') || '/';
  const supabase    = createClient();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  /* ── Google OAuth ── */
  const handleGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setError(error.message);
  };

  /* ── Email / password ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data.session) { setError('Login failed — please try again.'); return; }
    // Hard navigation so the page fully reloads and AuthContext reads the
    // fresh session from cookies (soft router.push keeps the old React tree
    // alive and the auth state doesn't propagate across client instances).
    window.location.href = next;
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
      }}>
        <h1 style={{
          fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 26,
          color: 'var(--navy)', marginBottom: 6,
        }}>
          Welcome back
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)', marginBottom: 28 }}>
          Sign in to your Luna Let's Go account
        </p>

        {/* Google button */}
        <button
          onClick={handleGoogle}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '11px 16px', borderRadius: 'var(--r-md)',
            border: '1.5px solid var(--navy)', background: '#fff',
            fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: 'var(--navy)',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,68,123,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gray-dark)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Email / password form */}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '11px 42px 11px 14px', borderRadius: 'var(--r-md)',
                  border: '1.5px solid var(--border)',
                  fontFamily: 'var(--font-body)', fontSize: 14, color: '#000',
                  outline: 'none', background: '#fff', transition: 'border-color 0.15s',
                  boxSizing: 'border-box',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              <button
                type="button" onClick={() => setShowPw(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                  color: 'var(--gray-dark)',
                }}
              >
                {showPw ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#DC2626', margin: 0 }}>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={loading}
            style={{
              marginTop: 4, padding: '12px 0', borderRadius: 'var(--r-md)',
              background: loading ? 'rgba(255,130,16,0.6)' : 'var(--orange)',
              color: '#fff', border: 'none',
              fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
              cursor: loading ? 'default' : 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#e8720a'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--orange)'; }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          {/* Forgot password */}
          <Link href="/auth/forgot-password" style={{
            fontFamily: 'var(--font-body)', fontSize: 13,
            color: 'var(--navy-mid)', textAlign: 'center', textDecoration: 'underline',
          }}>
            Forgot password?
          </Link>
        </form>
      </div>

      {/* Footer link */}
      <p style={{ marginTop: 24, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)' }}>
        Don't have an account?{' '}
        <Link href="/auth/signup" style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'underline' }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
