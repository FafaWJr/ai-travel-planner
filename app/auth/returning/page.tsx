'use client'
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { syncUserToBrevo } from '@/lib/brevo'

export default function ReturningPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleRedirect = async () => {
      // Read destination before any async work
      const destination =
        localStorage.getItem('luna_redirect_after_login') ||
        localStorage.getItem('post_auth_redirect') ||
        localStorage.getItem('redirectAfterLogin') ||
        '/'

      // Clean up all possible keys
      localStorage.removeItem('luna_redirect_after_login')
      localStorage.removeItem('post_auth_redirect')
      localStorage.removeItem('redirectAfterLogin')

      // First attempt — cookies should already be set by the callback route
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Sync new Google OAuth users to Brevo
        const createdAt = new Date(session.user.created_at).getTime()
        const isNewUser = Date.now() - createdAt < 60_000
        if (isNewUser) {
          const meta = session.user.user_metadata
          syncUserToBrevo({
            email: session.user.email ?? '',
            firstName: meta?.given_name ?? meta?.full_name?.split(' ')[0] ?? '',
            lastName: meta?.family_name ?? meta?.full_name?.split(' ').slice(1).join(' ') ?? '',
            source: 'google_oauth',
          })
        }
        router.replace(destination)
        return
      }

      // Retry after 1.5s — hash-fragment tokens may need a moment
      await new Promise(resolve => setTimeout(resolve, 1500))
      const { data: { session: retrySession } } = await supabase.auth.getSession()

      if (retrySession) {
        router.replace(destination)
        return
      }

      // Last resort: listen for auth state change, fallback to login after 5s
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          if (newSession) {
            subscription.unsubscribe()
            router.replace(destination)
          }
        }
      )

      setTimeout(() => {
        subscription.unsubscribe()
        router.replace('/auth/login?error=session_not_found')
      }, 5000)
    }

    handleRedirect()
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4F7FB',
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '3px solid rgba(0,68,123,0.12)',
        borderTop: '3px solid #FF8210',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
