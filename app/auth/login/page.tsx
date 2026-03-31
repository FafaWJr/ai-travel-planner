'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { trackLoginCompleted } from '@/lib/analytics'

// Key used to persist the post-auth destination across the OAuth redirect
const POST_AUTH_REDIRECT_KEY = 'post_auth_redirect'

function LoginForm() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Where to go after login — could be /plan?prompt=... or any other page
  const next = searchParams.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Email/password login — simple: just hard-navigate to `next` after auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('Login failed. Please check your email and password.')
      setLoading(false)
      return
    }

    trackLoginCompleted('email');
    // Hard reload so AuthProvider picks up the new session
    window.location.href = next
  }

  // Google OAuth — Supabase strips query params from the redirectTo allowlist,
  // so we CANNOT rely on ?next= surviving the OAuth round-trip.
  // Instead: store `next` in localStorage before we leave, then read it on return.
  const handleGoogleLogin = async () => {
    setLoading(true)

    // Persist destination so /auth/returning can read it after the OAuth redirect
    try {
      localStorage.setItem(POST_AUTH_REDIRECT_KEY, next)
    } catch {
      // localStorage may be blocked in some browsers — not fatal
    }

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Simple callback URL — no query params needed.
        // The ?next= destination is safe in localStorage.
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError) {
      setError(oauthError.message)
      setLoading(false)
    } else {
      trackLoginCompleted('google');
    }
    // If no error, the browser will navigate to Google — no more JS runs here
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4F7FB',
      fontFamily: 'var(--font-body)',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 8px 48px rgba(0,68,123,0.10)',
        padding: '48px 40px',
        width: '100%',
        maxWidth: 420,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/">
            <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 56, width: 'auto' }} />
          </Link>
        </div>

        <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 24, color: '#00447B', marginBottom: 8, textAlign: 'center' }}>
          Welcome back
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#6C6D6F', textAlign: 'center', marginBottom: 32 }}>
          Sign in to save and continue your trips
        </p>

        {/* Google OAuth */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px 20px',
            border: '1.5px solid rgba(0,68,123,0.18)', borderRadius: 12,
            background: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: '#333',
            marginBottom: 20, transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#F4F7FB' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,68,123,0.10)' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#C0C0C0' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,68,123,0.10)' }} />
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: '#00447B', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 15, color: '#000', outline: 'none', transition: 'border-color 0.18s' }}
              onFocus={e => e.target.style.borderColor = '#00447B'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,68,123,0.15)'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: '#00447B', textTransform: 'uppercase', letterSpacing: 0.8 }}>Password</label>
              <Link href="/auth/forgot-password" style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#FF8210', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: 15, color: '#000', outline: 'none', transition: 'border-color 0.18s' }}
              onFocus={e => e.target.style.borderColor = '#00447B'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,68,123,0.15)'}
            />
          </div>

          {error && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#DC2626', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', background: loading ? '#C0C0C0' : '#00447B', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s', marginTop: 4 }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#6C6D6F', textAlign: 'center', marginTop: 24, marginBottom: 0 }}>
          Don&apos;t have an account?{' '}
          <Link href={`/auth/signup?next=${encodeURIComponent(next)}`} style={{ color: '#FF8210', fontWeight: 600, textDecoration: 'none' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FB' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(0,68,123,0.12)', borderTop: '3px solid #FF8210', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
