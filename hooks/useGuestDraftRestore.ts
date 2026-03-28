'use client'

import { useEffect, useRef } from 'react'

interface TripSnapshot {
  plan: string
  photos: string[]
  acceptedHotels: unknown[]
  itineraryDays: unknown[]
  prompt?: string
}

interface UseGuestDraftRestoreOptions {
  isLoggedIn: boolean
  authLoading: boolean
  hasTripLoaded: boolean  // true once a trip is already displayed
  onRestore: (snapshot: TripSnapshot) => void
}

/**
 * After a guest logs in (redirected back to /plan with `?next=` param),
 * this hook reads the trip state that was saved to localStorage before
 * the login redirect and restores it — then clears localStorage.
 */
export function useGuestDraftRestore({
  isLoggedIn,
  authLoading,
  hasTripLoaded,
  onRestore,
}: UseGuestDraftRestoreOptions) {
  const restored = useRef(false)

  useEffect(() => {
    // Only try once, and only after auth is resolved
    if (authLoading || restored.current) return
    // Only restore if the user just logged in and has no existing trip loaded
    if (!isLoggedIn || hasTripLoaded) return

    try {
      const raw = localStorage.getItem('guest_trip_draft')
      if (!raw) return

      const snapshot: TripSnapshot = JSON.parse(raw)
      if (!snapshot?.plan) return

      restored.current = true
      localStorage.removeItem('guest_trip_draft')
      onRestore(snapshot)
    } catch {
      localStorage.removeItem('guest_trip_draft')
    }
  }, [isLoggedIn, authLoading, hasTripLoaded, onRestore])
}
