'use client';
export const dynamic = 'force-dynamic';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackSignUpCompleted } from '@/lib/analytics';
import { syncUserToBrevo } from '@/lib/brevo';

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

function SignupForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get('next') || '/';
  const supabase     = createClient();

  const [fullName, setFullName]       = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);

  /* ── Google OAuth ── */
  const handleGoogle = async () => {
    setError('');
    trackSignUpCompleted('google');
    // Save destination before leaving — OAuth strips query params from redirectTo
    try { localStorage.setItem('luna_redirect_after_login', next); } catch {}
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) setError(error.message);
  };

  /* ── Email / password ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);

    if (error) { setError(error.message); return; }

    trackSignUpCompleted('email');
    const nameParts = fullName?.trim().split(' ') ?? [];
    syncUserToBrevo({
      email,
      firstName: nameParts[0] ?? '',
      lastName: nameParts.slice(1).join(' ') ?? '',
      source: 'email_signup',
    });
    // Supabase sends a confirmation email. Show success message instead of redirecting.
    setSuccess('Almost there! Check your inbox and click the confirmation link to activate your account.');
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-section)', padding: '24px 16px',
      }}>
        <Link href="/" style={{ marginBottom: 32 }}>
          <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 64, width: 'auto' }} />
        </Link>
        <div style={{
          width: '100%', maxWidth: 420, background: '#fff',
          borderRadius: 'var(--r-lg)', border: '1.5px solid var(--border)',
          boxShadow: 'var(--shadow-card)', padding: 40, textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(22,163,74,0.10)', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#16A34A" strokeWidth="1.8"/>
              <path d="M8 12l3 3 5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: 'var(--navy)', marginBottom: 12 }}>
            Check your email
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)', lineHeight: 1.65, marginBottom: 24 }}>
            {success}
          </p>
          <Link href="/" style={{
            display: 'inline-block', padding: '11px 28px', borderRadius: 'var(--r-pill)',
            background: 'var(--navy)', color: '#fff',
            fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
          }}>
            Back to home
          </Link>
        </div>
      </div>
    );
  }

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
          Create your account
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)', marginBottom: 28 }}>
          Start planning unforgettable trips with AI
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>
              Full name
            </label>
            <input
              type="text" required autoComplete="name"
              value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Jane Smith"
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

          {/* Email */}
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

          {/* Password */}
          {[
            { label: 'Password', val: password, set: setPassword, show: showPw, setShow: setShowPw, auto: 'new-password' },
            { label: 'Confirm password', val: confirm, set: setConfirm, show: showConfirm, setShow: setShowConfirm, auto: 'new-password' },
          ].map(({ label, val, set, show, setShow, auto }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--navy)' }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'} required autoComplete={auto}
                  value={val} onChange={e => set(e.target.value)}
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
                  type="button" onClick={() => setShow((v: boolean) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    color: 'var(--gray-dark)',
                  }}
                >
                  {show ? (
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
          ))}

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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>

      {/* Footer link */}
      <p style={{ marginTop: 24, fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ color: 'var(--navy)', fontWeight: 600, textDecoration: 'underline' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
