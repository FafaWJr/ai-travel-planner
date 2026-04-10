'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

const NAV_LINKS = [
  { label: 'Trip Ideas', href: '/#trip-ideas' },
  { label: 'Quiz', href: '/#quiz' },
  { label: 'Blog', href: '/blog' },
  { label: 'Deals', href: '/deals' },
]

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const initial = (name || '?')[0].toUpperCase()
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
  }
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--navy)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
      {initial}
    </div>
  )
}

function NavInner() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [travelPersona, setTravelPersona] = useState<string | null>(null)
  const menuDesktopRef = useRef<HTMLDivElement>(null)
  const menuMobileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) { setTravelPersona(null); return; }
    supabase
      .from('user_preferences')
      .select('travel_persona')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => { setTravelPersona(data?.travel_persona ?? null); });
  }, [user]); // eslint-disable-line

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const insideDesktop = menuDesktopRef.current?.contains(target)
      const insideMobile = menuMobileRef.current?.contains(target)
      if (!insideDesktop && !insideMobile) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (href: string) =>
    href.startsWith('/#') ? pathname === '/' : pathname === href || pathname.startsWith(href + '/')

  const currentUrl = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
  const loginHref = `/auth/login?next=${encodeURIComponent(currentUrl)}`

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Account'
  const avatarUrl = user?.user_metadata?.avatar_url ?? null

  return (
    <>
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 68, padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 72, width: 'auto' }} />
        </Link>

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 14, color: isActive(href) ? 'var(--navy)' : 'var(--gray-dark)', padding: '8px 14px', borderRadius: 8, borderBottom: isActive(href) ? '2px solid var(--orange)' : '2px solid transparent', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}

          {!loading && user && (
            <Link href="/my-trips" style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 14, color: isActive('/my-trips') ? 'var(--navy)' : 'var(--gray-dark)', padding: '8px 14px', borderRadius: 8, borderBottom: isActive('/my-trips') ? '2px solid var(--orange)' : '2px solid transparent', textDecoration: 'none' }}>
              My Trips
            </Link>
          )}

          <Link href="/start" style={{ marginLeft: 8, background: 'var(--navy)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 'var(--r-pill)', textDecoration: 'none' }}>
            Plan a Trip
          </Link>

          {!loading && (
            user ? (
              <div ref={menuDesktopRef} style={{ position: 'relative', marginLeft: 8 }}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  aria-label="Account menu"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px solid var(--border)', borderRadius: 'var(--r-pill)', padding: '4px 12px 4px 4px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--navy)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Avatar name={displayName} avatarUrl={avatarUrl} />
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.15s', transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M2 4l4 4 4-4" stroke="var(--gray-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 224, background: '#fff', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-hover)', overflow: 'hidden', zIndex: 200, animation: 'fadeIn 0.12s ease both' }}>
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: '#111', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    </div>
                    <Link href="/my-trips" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: '#111', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                      My Trips
                    </Link>
                    {/* Travel persona */}
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(0,68,123,0.1)' }}>
                      {travelPersona ? (
                        <>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,130,16,0.08)', border: '1px solid rgba(255,130,16,0.25)', borderRadius: 20, padding: '4px 12px' }}>
                            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#FF8210" /></svg>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500, color: '#FF8210' }}>{travelPersona}</span>
                          </div>
                          <Link href="/quiz" onClick={() => setMenuOpen(false)} style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, color: '#6C6D6F', marginTop: 4, textDecoration: 'none' }}>
                            Retake quiz
                          </Link>
                        </>
                      ) : (
                        <Link
                          href="/quiz"
                          onClick={() => setMenuOpen(false)}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500, color: '#FF8210', textDecoration: 'none' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          Discover your travel style
                        </Link>
                      )}
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                    <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gray-dark)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={loginHref}
                style={{ marginLeft: 8, display: 'inline-block', padding: '8px 20px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--orange)', color: 'var(--orange)', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'var(--orange)'; el.style.color = '#fff' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.color = 'var(--orange)' }}
              >
                Login
              </Link>
            )
          )}
        </div>

        {/* Mobile right side */}
        <div className="nav-mobile" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
          {!loading && user && (
            <Link href="/my-trips" style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--navy)', textDecoration: 'none', padding: '6px 12px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-pill)' }}>
              My Trips
            </Link>
          )}
          {!loading && (
            user ? (
              <div ref={menuMobileRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  aria-label="Account menu"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1.5px solid var(--border)', borderRadius: 'var(--r-pill)', padding: '4px 10px 4px 4px', cursor: 'pointer' }}
                >
                  <Avatar name={displayName} avatarUrl={avatarUrl} />
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transition: 'transform 0.15s', transform: menuOpen ? 'rotate(180deg)' : 'none' }}>
                    <path d="M2 4l4 4 4-4" stroke="var(--gray-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 200, background: '#fff', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-hover)', overflow: 'hidden', zIndex: 200, animation: 'fadeIn 0.12s ease both' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#111', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--gray-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
                    </div>
                    <Link href="/my-trips" onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 13, color: '#111', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      My Trips
                    </Link>
                    <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
                    <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gray-dark)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={loginHref} style={{ display: 'inline-block', padding: '7px 16px', borderRadius: 'var(--r-pill)', border: '1.5px solid var(--orange)', color: 'var(--orange)', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                Sign In
              </Link>
            )
          )}
          {/* Hamburger */}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--navy)' }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 5h16M3 11h16M3 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,20,60,0.45)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.15s ease both' }}
        />
      )}

      {/* Mobile drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 200,
        width: 260, background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,20,60,0.15)',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: 'var(--navy)' }}>Menu</span>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-dark)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', padding: '12px 0', flex: 1 }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link key={label} href={href} onClick={() => setDrawerOpen(false)} style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 15, color: isActive(href) ? 'var(--navy)' : 'var(--gray-dark)', padding: '13px 20px', textDecoration: 'none', borderLeft: isActive(href) ? '3px solid var(--orange)' : '3px solid transparent' }}>
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <Link href="/start" onClick={() => setDrawerOpen(false)} style={{ display: 'block', textAlign: 'center', background: 'var(--navy)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, padding: '12px', borderRadius: 'var(--r-pill)', textDecoration: 'none' }}>
            Plan a Trip
          </Link>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .nav-desktop { display: flex !important; }
          .nav-mobile  { display: none !important; }
        }
        @media (max-width: 767px) {
          .nav-desktop { display: none !important; }
          .nav-mobile  { display: flex !important; }
          nav[style] { padding: 0 16px !important; }
          nav[style] img { height: 52px !important; }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  )
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavInner />
    </Suspense>
  )
}
