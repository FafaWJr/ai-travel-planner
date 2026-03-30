'use client';
import Link from 'next/link';
import React from 'react';

const socialStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  transition: 'color 0.2s',
};

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--navy, #00447B)',
      borderTop: '3px solid var(--orange, #FF8210)',
      fontFamily: "'Lato', sans-serif",
    }}>

      {/* Main footer grid */}
      <div
        className="luna-footer-grid"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '56px 40px 40px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '48px',
        }}
      >

        {/* Column 1: Brand */}
        <div>
          <Link href="/">
            <img
              src="/luna_letsgo_bigger_3.PNG"
              alt="Luna Let's Go"
              style={{ height: 56, width: 'auto', marginBottom: 16, display: 'block' }}
            />
          </Link>
          <p style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 14,
            fontWeight: 300,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.55)',
            maxWidth: 260,
            margin: 0,
          }}>
            AI-powered travel planning that feels human. Built for travellers who want something more personal.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'white',
            margin: '0 0 20px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Quick Links
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px 24px',
          }}>
            {[
              { label: 'Plan a Trip',  href: '/start' },
              { label: 'Trip Ideas',   href: '/trip-ideas' },
              { label: 'Travel Quiz',  href: '/quiz' },
              { label: 'Blog',         href: '/blog' },
              { label: 'Deals',        href: '/deals' },
              { label: 'About Us',     href: '/about' },
              { label: 'My Trips',     href: '/my-trips' },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  fontFamily: "'Lato', sans-serif",
                  fontSize: 14,
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.65)',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Column 3: Contact */}
        <div>
          <p style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'white',
            margin: '0 0 20px 0',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            Contact
          </p>
          <a
            href="mailto:hello@lunaletsgo.com"
            style={{
              fontFamily: "'Lato', sans-serif",
              fontSize: 14,
              color: 'var(--orange-light, #FFBD59)',
              textDecoration: 'none',
              display: 'block',
              marginBottom: 24,
              fontWeight: 400,
            }}
          >
            hello@lunaletsgo.com
          </a>
          {/* Social icons */}
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="#" aria-label="Instagram" style={socialStyle}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="#" aria-label="TikTok" style={socialStyle}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.3V2h-3.4v13.7a2.9 2.9 0 0 1-2.9 2.5 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .5 0 .8.1V9a6.3 6.3 0 0 0-.8-.1A6.3 6.3 0 0 0 3.2 15.2a6.3 6.3 0 0 0 6.3 6.3 6.3 6.3 0 0 0 6.3-6.3V8.7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.8 4.8 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a href="#" aria-label="Facebook" style={socialStyle}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'white')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.4)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        background: 'rgba(0,0,0,0.22)',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
      }}>
        <div
          className="luna-footer-bar"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <p style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: 13,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
          }}>
            &copy; 2026 Luna Let&apos;s Go. All rights reserved. lunaletsgo.com
          </p>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link
              href="/privacy-policy"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: 13,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
              }}
            >
              Privacy Policy
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>&middot;</span>
            <Link
              href="/terms-of-service"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: 13,
                fontWeight: 300,
                color: 'rgba(255,255,255,0.35)',
                textDecoration: 'none',
              }}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .luna-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 36px !important; }
        }
        @media (max-width: 540px) {
          .luna-footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .luna-footer-bar  { flex-direction: column !important; text-align: center !important; }
        }
      `}</style>

    </footer>
  );
}
