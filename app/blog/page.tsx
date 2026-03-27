'use client';
import { useState } from 'react';
import Link from 'next/link';

const PLACEHOLDER_POSTS = [
  {
    id: 1,
    category: 'Destination Guide',
    categoryColor: '#FF8210',
    title: '10 Unmissable Things to Do in Bali',
    excerpt: 'From the terraced rice fields of Ubud to the legendary surf breaks of Canggu — a local-style guide to Indonesia\'s most iconic island.',
    destination: 'Bali, Indonesia',
    readTime: '8 min read',
    gradient: 'linear-gradient(135deg, #00447B 0%, #679AC1 100%)',
    emoji: '🌴',
    date: 'Coming soon',
  },
  {
    id: 2,
    category: 'Travel Tips',
    categoryColor: '#00447B',
    title: 'How to Plan a 2-Week Japan Trip on a Midrange Budget',
    excerpt: 'Tokyo, Kyoto, and Osaka without breaking the bank — the ultimate guide to JR passes, capsule hotels, and the best ¥500 lunches of your life.',
    destination: 'Japan',
    readTime: '12 min read',
    gradient: 'linear-gradient(135deg, #FF8210 0%, #FFBD59 100%)',
    emoji: '🗾',
    date: 'Coming soon',
  },
  {
    id: 3,
    category: 'Inspiration',
    categoryColor: '#FF8210',
    title: 'Hidden Gems of the Amalfi Coast Most Tourists Walk Past',
    excerpt: 'Beyond Positano and Ravello lies a coastline of steep-staired villages, lemon groves, and trattorias with no English menu. Here\'s where to find them.',
    destination: 'Amalfi Coast, Italy',
    readTime: '7 min read',
    gradient: 'linear-gradient(135deg, #679AC1 0%, #00447B 100%)',
    emoji: '🍋',
    date: 'Coming soon',
  },
];

function NavBar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 68, padding: '0 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 72, width: 'auto' }} />
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {[
          { label: 'Trip Ideas', href: '/#trip-ideas' },
          { label: 'Quiz', href: '/#quiz' },
          { label: 'Blog', href: '/blog' },
          { label: 'Deals', href: '/deals' },
        ].map(({ label, href }) => (
          <Link key={label} href={href}
            style={{
              fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 14,
              color: label === 'Blog' ? 'var(--navy)' : 'var(--gray-dark)',
              padding: '8px 14px', borderRadius: 8,
              borderBottom: label === 'Blog' ? '2px solid var(--orange)' : 'none',
            }}>
            {label}
          </Link>
        ))}
        <Link href="/" style={{
          marginLeft: 12, background: 'var(--navy)', color: '#fff',
          fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
          padding: '10px 22px', borderRadius: 'var(--r-pill)',
        }}>Plan a Trip</Link>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer style={{
      background: 'var(--navy)', padding: '48px 40px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
    }}>
      <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" style={{ height: 70, width: 'auto' }} />
      <p style={{ fontFamily: 'var(--font-body)', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
        © 2026 GOTO AI Travel Planner. Built with Next.js &amp; OpenRouter.
      </p>
    </footer>
  );
}

export default function BlogPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <NavBar />

      <main style={{ paddingTop: 68, minHeight: '100vh', background: '#fff' }}>

        {/* ── Hero ── */}
        <section style={{
          position: 'relative', overflow: 'hidden',
          background: 'var(--navy)',
          padding: 'clamp(64px, 10vw, 112px) 40px',
          textAlign: 'center',
        }}>
          {/* Background pattern */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255,130,16,0.15) 0%, transparent 60%),
              radial-gradient(circle at 80% 20%, rgba(103,154,193,0.20) 0%, transparent 50%)
            `,
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 700, margin: '0 auto' }}>
            {/* Coming soon badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,130,16,0.15)', border: '1.5px solid rgba(255,130,16,0.40)',
              borderRadius: 'var(--r-pill)', padding: '6px 18px', marginBottom: 28,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="13" rx="2" stroke="#FF8210" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FF8210" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FF8210', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Coming Soon
              </span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-head)', fontWeight: 700,
              fontSize: 'clamp(36px, 5vw, 60px)',
              color: '#fff', lineHeight: 1.1, marginBottom: 20,
            }}>
              Travel Blog
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 auto',
            }}>
              Stories, tips &amp; inspiration from around the world
            </p>
          </div>
        </section>

        {/* ── Placeholder posts section ── */}
        <section style={{ padding: 'clamp(48px, 8vw, 96px) clamp(20px, 5vw, 80px)', maxWidth: 1200, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(22px, 3vw, 32px)',
              color: 'var(--navy)', marginBottom: 12,
            }}>
              A preview of what's coming
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--gray-dark)', maxWidth: 520, margin: '0 auto' }}>
              Real travel stories, destination guides, and expert tips — written by people who actually go there.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: 28,
            position: 'relative',
          }}>
            {PLACEHOLDER_POSTS.map(post => (
              <article key={post.id} style={{
                background: '#fff',
                borderRadius: 'var(--r-lg)',
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                opacity: 0.75,
                filter: 'grayscale(0.12)',
              }}>
                {/* Image area */}
                <div style={{
                  height: 200, background: post.gradient,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10,
                  position: 'relative',
                }}>
                  <span style={{ fontSize: 52 }}>{post.emoji}</span>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 12,
                    color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em',
                  }}>
                    {post.destination}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '20px 22px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Category + read time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11,
                      color: post.categoryColor, background: `${post.categoryColor}15`,
                      padding: '3px 10px', borderRadius: 'var(--r-pill)',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                    }}>
                      {post.category}
                    </span>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--gray-dark)' }}>
                      {post.readTime}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17,
                    color: '#111', lineHeight: 1.35, margin: 0,
                  }}>
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)',
                    lineHeight: 1.6, margin: 0, flex: 1,
                  }}>
                    {post.excerpt}
                  </p>

                  {/* CTA */}
                  <button
                    disabled
                    style={{
                      marginTop: 8,
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(0,68,123,0.06)',
                      color: 'var(--gray-light)',
                      fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13,
                      padding: '9px 18px', borderRadius: 'var(--r-pill)',
                      border: '1.5px solid var(--border)',
                      cursor: 'not-allowed', alignSelf: 'flex-start',
                    }}
                  >
                    Read more
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Coming soon overlay banner */}
          <div style={{
            marginTop: 48,
            background: 'var(--bg-section)',
            border: '2px solid rgba(0,68,123,0.10)',
            borderRadius: 'var(--r-lg)',
            padding: 'clamp(32px, 5vw, 56px) clamp(24px, 5vw, 56px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: 20,
          }}>
            {/* Lock icon */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,130,16,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="13" rx="2" fill="rgba(255,130,16,0.15)" stroke="#FF8210" strokeWidth="1.8"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FF8210" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1.5" fill="#FF8210"/>
              </svg>
            </div>

            <div>
              <p style={{
                fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(18px, 2.5vw, 24px)',
                color: 'var(--navy)', marginBottom: 8,
              }}>
                The blog is being crafted with care
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--gray-dark)',
                maxWidth: 480, margin: '0 auto', lineHeight: 1.65,
              }}>
                We're working on stories worth reading — real destinations, honest opinions, and practical tips from people who actually make the journey.
              </p>
            </div>

            {/* Email signup */}
            <div style={{
              width: '100%', maxWidth: 440,
              background: '#fff',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '24px 28px',
            }}>
              <p style={{
                fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
                color: 'var(--navy)', marginBottom: 14,
              }}>
                Be the first to know when we launch
              </p>
              {submitted ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(22,163,74,0.08)', border: '1.5px solid rgba(22,163,74,0.25)',
                  borderRadius: 'var(--r-md)', padding: '12px 16px',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="rgba(22,163,74,0.15)" stroke="#16A34A" strokeWidth="1.5"/>
                    <path d="M8 12l3 3 5-5" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#15803D', fontWeight: 500 }}>
                    You're on the list — we'll be in touch!
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      flex: 1, minWidth: 180,
                      padding: '11px 16px',
                      border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      fontFamily: 'var(--font-body)', fontSize: 14, color: '#000',
                      outline: 'none', background: '#fff',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--navy)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  <button
                    onClick={() => { if (email.includes('@')) setSubmitted(true); }}
                    style={{
                      background: 'var(--orange)', color: '#fff',
                      fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
                      padding: '11px 22px', borderRadius: 'var(--r-md)',
                      border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    Notify me
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 640px) {
          nav { padding: 0 20px !important; }
          nav img { height: 52px !important; }
        }
      `}</style>
    </>
  );
}
