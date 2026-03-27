'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';

/* ── Nav link items ─────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Trip Ideas', href: '/#trip-ideas' },
  { label: 'Quiz',       href: '/#quiz' },
  { label: 'Blog',       href: '/blog' },
  { label: 'Deals',      href: '/deals' },
];

/* ── Avatar circle ──────────────────────────────────────── */
function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initial = (name || '?')[0].toUpperCase();
  return avatarUrl ? (
    <img
      src={avatarUrl} alt={name}
      style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }}
    />
  ) : (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: 'var(--navy)', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

/* ── Main NavBar ─────────────────────────────────────────── */
export default function NavBar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email
    || 'Account';
  const avatarUrl = user?.user_metadata?.avatar_url ?? null;

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 68, padding: '0 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 72, width: 'auto' }} />
      </Link>

      {/* Links + auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {NAV_LINKS.map(({ label, href }) => (
          <Link key={label} href={href} style={{
            fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 14,
            color: isActive(href) ? 'var(--navy)' : 'var(--gray-dark)',
            padding: '8px 14px', borderRadius: 8,
            borderBottom: isActive(href) ? '2px solid var(--orange)' : '2px solid transparent',
            textDecoration: 'none',
          }}>
            {label}
          </Link>
        ))}

        {/* Plan a Trip CTA */}
        <Link href="/" style={{
          marginLeft: 8,
          background: 'var(--navy)', color: '#fff',
          fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
          padding: '10px 22px', borderRadius: 'var(--r-pill)',
          textDecoration: 'none',
        }}>
          Plan a Trip
        </Link>

        {/* Auth slot */}
        {!loading && (
          user ? (
            /* ── Avatar + dropdown ── */
            <div ref={dropdownRef} style={{ position: 'relative', marginLeft: 8 }}>
              <button
                onClick={() => setDropdownOpen(v => !v)}
                aria-label="Account menu"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: '1.5px solid var(--border)',
                  borderRadius: 'var(--r-pill)', padding: '4px 12px 4px 4px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--navy)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <Avatar name={displayName} avatarUrl={avatarUrl} />
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transition: 'transform 0.15s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                >
                  <path d="M2 4l4 4 4-4" stroke="var(--gray-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 224, background: '#fff',
                  borderRadius: 'var(--r-md)', border: '1.5px solid var(--border)',
                  boxShadow: 'var(--shadow-hover)',
                  overflow: 'hidden', zIndex: 200,
                  animation: 'fadeIn 0.12s ease both',
                }}>
                  {/* User header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                    <p style={{
                      fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13,
                      color: '#111', margin: '0 0 2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {displayName}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray-dark)',
                      margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {user.email}
                    </p>
                  </div>

                  {/* My Trips */}
                  <Link href="/" onClick={() => setDropdownOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px',
                    fontFamily: 'var(--font-body)', fontSize: 13, color: '#111',
                    textDecoration: 'none',
                  }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-section)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    My Trips
                  </Link>

                  {/* Preferences */}
                  <Link href="/" onClick={() => setDropdownOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px',
                    fontFamily: 'var(--font-body)', fontSize: 13, color: '#111',
                    textDecoration: 'none',
                  }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-section)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                    </svg>
                    Preferences
                  </Link>

                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

                  {/* Sign out */}
                  <button onClick={handleSignOut} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px',
                    fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--gray-dark)',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-section)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Login button ── */
            <Link href="/auth/login" style={{
              marginLeft: 8,
              display: 'inline-block',
              padding: '8px 20px', borderRadius: 'var(--r-pill)',
              border: '1.5px solid var(--orange)', color: 'var(--orange)',
              fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
              textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--orange)'; el.style.color = '#fff'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--orange)'; }}
            >
              Login
            </Link>
          )
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          nav[style] { padding: 0 20px !important; }
          nav[style] img { height: 52px !important; }
        }
      `}</style>
    </nav>
  );
}
