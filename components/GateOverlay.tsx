'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface GateOverlayProps {
  onClose: () => void
  /** Full current trip state to persist across the login flow */
  tripSnapshot?: {
    plan: string
    photos: string[]
    acceptedHotels: unknown[]
    itineraryDays: unknown[]
    prompt?: string
  }
}

export default function GateOverlay({ onClose, tripSnapshot }: GateOverlayProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleLogin = () => {
    // Persist the full trip state so it can be restored after login
    if (tripSnapshot) {
      try {
        localStorage.setItem('guest_trip_draft', JSON.stringify(tripSnapshot))
      } catch {
        // localStorage may be unavailable in some privacy modes — that's OK
      }
    }

    // Build the return URL — keep the current prompt in the URL
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    router.push(`/auth/login?next=${encodeURIComponent(currentUrl)}`)
  }

  const handleSignup = () => {
    if (tripSnapshot) {
      try {
        localStorage.setItem('guest_trip_draft', JSON.stringify(tripSnapshot))
      } catch {}
    }
    const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    router.push(`/auth/signup?next=${encodeURIComponent(currentUrl)}`)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,20,60,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.18s ease both',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,68,123,0.22)',
        padding: '40px 36px',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
        animation: 'slideUp 0.22s ease both',
      }}>
        {/* Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(255,130,16,0.10)',
          border: '2px solid rgba(255,130,16,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          fontSize: 28,
        }}>
          🔐
        </div>

        <h2 style={{
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
          fontSize: 22,
          color: '#00447B',
          marginBottom: 10,
        }}>
          Sign in to unlock this
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          color: '#6C6D6F',
          lineHeight: 1.6,
          marginBottom: 28,
        }}>
          Create a free account to save your trip, move activities, get more suggestions, and come back to it anytime.
          <br />
          <strong style={{ color: '#00447B' }}>Your current trip will be kept.</strong>
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: '#00447B',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#003566' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#00447B' }}
          >
            Sign in
          </button>

          <button
            onClick={handleSignup}
            style={{
              width: '100%',
              padding: '14px',
              background: '#FF8210',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e6720e' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FF8210' }}
          >
            Create free account
          </button>

          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px',
              background: 'none',
              color: '#6C6D6F',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Maybe later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
