'use client';
import { useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

/* ── Flat SVG illustrations — brand colours only (#FF8210 / #00447B / #679AC1) ── */
const BlogIllustrations: Record<number, () => React.ReactElement> = {
  1: () => (
    /* Bali: palm tree + ocean waves */
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Sun */}
      <circle cx="72" cy="22" r="12" fill="#FF8210" opacity=".85"/>
      {/* Ground */}
      <ellipse cx="48" cy="80" rx="38" ry="6" fill="#00447B" opacity=".18"/>
      {/* Trunk */}
      <path d="M46 78 C45 60 43 44 44 30" stroke="#00447B" strokeWidth="4" strokeLinecap="round"/>
      {/* Fronds */}
      <path d="M44 30 C30 20 16 22 12 28" stroke="#00447B" strokeWidth="3" strokeLinecap="round"/>
      <path d="M44 30 C38 16 42 8 50 8" stroke="#00447B" strokeWidth="3" strokeLinecap="round"/>
      <path d="M44 30 C52 18 62 18 66 26" stroke="#00447B" strokeWidth="3" strokeLinecap="round"/>
      <path d="M44 30 C28 30 20 36 20 42" stroke="#679AC1" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M44 30 C54 28 60 32 60 40" stroke="#679AC1" strokeWidth="2.5" strokeLinecap="round"/>
      {/* Waves */}
      <path d="M8 72 Q18 66 28 72 Q38 78 48 72 Q58 66 68 72 Q78 78 88 72" stroke="#679AC1" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M8 80 Q18 74 28 80 Q38 86 48 80 Q58 74 68 80 Q78 86 88 80" stroke="#FF8210" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".6"/>
    </svg>
  ),
  2: () => (
    /* Japan: torii gate + mount fuji silhouette */
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Sky circle */}
      <circle cx="48" cy="38" r="22" fill="#FF8210" opacity=".15"/>
      {/* Mt Fuji */}
      <path d="M12 72 L40 36 L48 42 L56 36 L84 72Z" fill="#00447B" opacity=".20"/>
      <path d="M36 48 L48 36 L60 48" fill="#fff" opacity=".7"/>
      {/* Torii top bar */}
      <rect x="22" y="32" width="52" height="5" rx="2.5" fill="#FF8210"/>
      {/* Torii second bar */}
      <rect x="26" y="40" width="44" height="3.5" rx="1.75" fill="#FF8210" opacity=".7"/>
      {/* Torii pillars */}
      <rect x="26" y="43" width="6" height="30" rx="3" fill="#FF8210"/>
      <rect x="64" y="43" width="6" height="30" rx="3" fill="#FF8210"/>
      {/* Path */}
      <path d="M35 73 L48 60 L61 73" stroke="#679AC1" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>
  ),
  3: () => (
    /* Amalfi: clifftop arch + sailboat */
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* Water */}
      <rect x="0" y="66" width="96" height="30" rx="0" fill="#679AC1" opacity=".25"/>
      {/* Cliff left */}
      <path d="M0 96 L0 50 C8 46 16 52 20 48 C24 44 22 36 28 34 L36 66 L0 66Z" fill="#00447B" opacity=".35"/>
      {/* Cliff right */}
      <path d="M96 96 L96 44 C88 40 80 46 74 42 C68 38 70 28 62 26 L58 66 L96 66Z" fill="#00447B" opacity=".35"/>
      {/* Arch */}
      <path d="M30 66 L30 50 Q48 30 66 50 L66 66" stroke="#00447B" strokeWidth="4" fill="none" strokeLinecap="round"/>
      {/* Sailboat hull */}
      <path d="M36 74 Q48 70 60 74 L58 80 L38 80Z" fill="#FF8210"/>
      {/* Sail */}
      <path d="M48 70 L48 50 L62 70Z" fill="#fff" opacity=".9"/>
      <path d="M48 70 L48 54 L36 70Z" fill="#FFBD59" opacity=".8"/>
      {/* Waves */}
      <path d="M8 78 Q16 74 24 78 Q32 82 40 78" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".5"/>
      <path d="M58 82 Q66 78 74 82 Q82 86 90 82" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".5"/>
    </svg>
  ),
};

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
    date: 'Coming soon',
  },
];



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
                  {(() => { const Illus = BlogIllustrations[post.id]; return Illus ? <Illus /> : null; })()}
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

      <style>{`
        @media (max-width: 640px) {
          nav { padding: 0 20px !important; }
          nav img { height: 52px !important; }
        }
      `}</style>
    </>
  );
}
