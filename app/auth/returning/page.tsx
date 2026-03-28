'use client'

import { useEffect } from 'react'

const POST_AUTH_REDIRECT_KEY = 'post_auth_redirect'

/**
 * This page is the landing spot after Google OAuth completes.
 * The auth/callback server route exchanges the code and then redirects here.
 *
 * Why we need this page:
 * Supabase OAuth strips query params (like ?next=) from the redirectTo URL
 * unless that exact URL is in the project's allowed redirect URL list.
 * To avoid maintaining an allowlist of every possible plan URL, we instead
 * save the destination in localStorage BEFORE the OAuth redirect, then read
 * it here after the user returns authenticated.
 */
export default function ReturningPage() {
  useEffect(() => {
    let destination = '/'

    try {
      const saved = localStorage.getItem(POST_AUTH_REDIRECT_KEY)
      if (saved && saved.startsWith('/')) {
        destination = saved
      }
      localStorage.removeItem(POST_AUTH_REDIRECT_KEY)
    } catch {
      // localStorage may be blocked — fall back to home
    }

    // Hard navigate so AuthProvider mounts fresh with the new session
    window.location.href = destination
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4F7FB',
      gap: 16,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '3px solid rgba(0,68,123,0.12)',
        borderTop: '3px solid #FF8210',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{
        fontFamily: 'var(--font-head)',
        fontSize: 15,
        color: '#00447B',
        margin: 0,
      }}>
        Taking you back to your trip…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
