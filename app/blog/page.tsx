'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavBar from '@/components/NavBar';

function FijiFlag() {
  return (
    <svg width="22" height="14" viewBox="0 0 22 14" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 2, flexShrink: 0 }}>
      <rect width="22" height="14" fill="#68BFE5"/>
      <rect width="11" height="7" fill="#012169"/>
      <line x1="0" y1="0" x2="11" y2="7" stroke="white" strokeWidth="1.8"/>
      <line x1="11" y1="0" x2="0" y2="7" stroke="white" strokeWidth="1.8"/>
      <line x1="0" y1="0" x2="11" y2="7" stroke="#C8102E" strokeWidth="1"/>
      <line x1="11" y1="0" x2="0" y2="7" stroke="#C8102E" strokeWidth="1"/>
      <line x1="5.5" y1="0" x2="5.5" y2="7" stroke="white" strokeWidth="2.2"/>
      <line x1="0" y1="3.5" x2="11" y2="3.5" stroke="white" strokeWidth="2.2"/>
      <line x1="5.5" y1="0" x2="5.5" y2="7" stroke="#C8102E" strokeWidth="1.2"/>
      <line x1="0" y1="3.5" x2="11" y2="3.5" stroke="#C8102E" strokeWidth="1.2"/>
      <rect x="14" y="3" width="5" height="5" rx="1" fill="white" opacity="0.85"/>
      <rect x="14.5" y="3.5" width="4" height="4" rx="0.5" fill="#012169"/>
    </svg>
  );
}

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
              Real trips, honest takes, and the kind of advice only a friend who just came back gives you.
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
              Travel Stories
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--gray-dark)', maxWidth: 520, margin: '0 auto' }}>
              Real destinations, honest takes, and practical tips from people who actually make the journey.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
            gap: 28,
            position: 'relative',
          }}>

            {/* ── Real post: Rio ── */}
            <Link href="/blog/rio-de-janeiro-5-days" style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(0,68,123,0.14)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,68,123,0.08)'; }}
            >
              {/* Card image */}
              <div style={{ position: 'relative', width: '100%', height: 220, background: 'linear-gradient(135deg, #00447B 0%, #005fa3 40%, #0096c7 70%, #48cae4 100%)' }}>
                <Image src="/blog/rio-de-janeiro-5-days/Hero.jpeg" alt="Aerial view of Rio de Janeiro with Sugarloaf Mountain from the plane window" fill style={{ objectFit: 'cover' }} sizes="380px" />
                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 100%)' }} />
                {/* Tags row */}
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#FF8210', color: '#fff', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20 }}>Travel Story</span>
                </div>
                {/* Bottom label */}
                <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase' }}>Rio de Janeiro, Brazil</span>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '1.4rem 1.5rem 1.75rem' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 12, color: 'var(--gray-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>January 2026</span>
                  <span style={{ color: '#C0C0C0' }}>·</span>
                  <span>12 min read</span>
                  <span style={{ color: '#C0C0C0' }}>·</span>
                  <span>5 days</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, color: 'var(--navy)', marginBottom: 10, lineHeight: 1.4 }}>
                  5 Days in Rio de Janeiro: Samba, Beaches &amp; Iconic Views
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)', lineHeight: 1.6, marginBottom: 18 }}>
                  From Sugarloaf to the Selaron Steps, five unforgettable days exploring Rio&apos;s greatest icons, beaches, samba nights and a surprise Funk party.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: '#fff' }}>WF</div>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>Wilson &amp; Fatima</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 600, color: '#FF8210', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Read the story
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7H11M8 4L11 7L8 10" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* ── Real post: Fiji ── */}
            <Link href="/blog/fiji-oct-2024" style={{ textDecoration: 'none', color: 'inherit', display: 'block', background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', transition: 'transform 0.25s ease, box-shadow 0.25s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(0,68,123,0.14)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 16px rgba(0,68,123,0.08)'; }}
            >
              {/* Card image */}
              <div style={{ position: 'relative', width: '100%', height: 220, background: 'linear-gradient(135deg, #00447B 0%, #005fa3 40%, #0096c7 70%, #48cae4 100%)' }}>
                <Image src="/blog/fiji-oct-2024/Matamanoa%20resort%20pool.jpeg" alt="Matamanoa Island Resort" fill style={{ objectFit: 'cover' }} sizes="380px" />
                {/* Overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 100%)' }} />
                {/* Tags row */}
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#FF8210', color: '#fff', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 20 }}>Fiji</span>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.18)', borderRadius: 20, padding: '4px 8px', gap: 5, backdropFilter: 'blur(4px)' }}>
                    <FijiFlag />
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>Fiji</span>
                  </div>
                </div>
                {/* Bottom label */}
                <div style={{ position: 'absolute', bottom: 14, left: 14 }}>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase' }}>Matamanoa Island · Mamanuca, Fiji</span>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '1.4rem 1.5rem 1.75rem' }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 12, color: 'var(--gray-dark)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>October 2024</span>
                  <span style={{ color: '#C0C0C0' }}>·</span>
                  <span>10 min read</span>
                  <span style={{ color: '#C0C0C0' }}>·</span>
                  <span>7 nights</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, color: 'var(--navy)', marginBottom: 10, lineHeight: 1.4 }}>
                  Bula! Fiji on a Smart Budget: Islands, Beach Clubs, and a Private Pool
                </h3>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--gray-dark)', lineHeight: 1.6, marginBottom: 18 }}>
                  We split 7 nights between Nadi and Matamanoa Island, did Mala Mala, Cloud 9, and Castaway, then packed our own beer onto the island boat. Here's exactly how we did it.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontSize: 11, fontWeight: 700, color: '#fff' }}>WF</div>
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>Wilson &amp; Fatima</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-head)', fontSize: 12, fontWeight: 600, color: '#FF8210', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Read story
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7H11M8 4L11 7L8 10" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

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
