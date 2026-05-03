'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function Footer() {
  const tFooter = useTranslations('footer');
  const tNav = useTranslations('nav');
  return (
    <footer style={{
      background: '#00447B',
      borderTop: '3px solid #FF8210',
      fontFamily: "'Lato', sans-serif",
    }}>

      {/* ── Main grid ── */}
      <div
        className="luna-footer-main"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '56px 40px 40px',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
          gap: '48px',
        }}
      >

        {/* Col 1 – Brand */}
        <div>
          <Link href="/" style={{ display: 'block', marginBottom: 18 }}>
            <img
              src="/luna_letsgo_bigger_3.PNG"
              alt="Luna Let's Go"
              style={{ height: 52, width: 'auto' }}
            />
          </Link>
          <p style={{
            fontSize: 14,
            fontWeight: 300,
            lineHeight: 1.7,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: 240,
            margin: 0,
          }}>
            {tFooter('tagline')}
          </p>
        </div>

        {/* Col 2 – Quick Links */}
        <div>
          <p style={headingStyle}>{tFooter('quickLinks')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FooterLink href="/start">{tNav('planTrip')}</FooterLink>
            <FooterLink href="/trip-ideas">{tNav('tripIdeas')}</FooterLink>
            <FooterLink href="/quiz">{tNav('quiz')}</FooterLink>
            <FooterLink href="/blog">{tNav('blog')}</FooterLink>
            <FooterLink href="/deals">{tNav('deals')}</FooterLink>
            <FooterLink href="/about">{tFooter('aboutUs')}</FooterLink>
            <FooterLink href="/how-to-use-luna">{tFooter('howToUseLuna')}</FooterLink>
            <FooterLink href="/my-trips">{tNav('myTrips')}</FooterLink>
          </div>
        </div>

        {/* Col 3 – Legal */}
        <div>
          <p style={headingStyle}>{tFooter('legal')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <FooterLink href="/privacy-policy">{tFooter('privacyPolicy')}</FooterLink>
            <FooterLink href="/terms">{tFooter('terms')}</FooterLink>
          </div>
        </div>

        {/* Col 4 – Contact */}
        <div>
          <p style={headingStyle}>{tFooter('contact')}</p>
          <a
            href="mailto:hello@lunaletsgo.com"
            style={{
              fontSize: 14,
              color: '#FFBD59',
              textDecoration: 'none',
              display: 'block',
              marginBottom: 24,
              fontWeight: 400,
            }}
          >
            hello@lunaletsgo.com
          </a>
          <div style={{ display: 'flex', gap: 14 }}>
            <SocialLink href="#" label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/>
              </svg>
            </SocialLink>
            <SocialLink href="#" label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.3V2h-3.4v13.7a2.9 2.9 0 0 1-2.9 2.5 2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .5 0 .8.1V9a6.3 6.3 0 0 0-.8-.1A6.3 6.3 0 0 0 3.2 15.2a6.3 6.3 0 0 0 6.3 6.3 6.3 6.3 0 0 0 6.3-6.3V8.7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.8 4.8 0 0 1-1-.1z"/>
              </svg>
            </SocialLink>
            <SocialLink href="#" label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </SocialLink>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ background: 'rgba(0,0,0,0.22)', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
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
            fontSize: 13,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.35)',
            margin: 0,
          }}>
            {tFooter('copyright')}
          </p>
        </div>
      </div>

      {/* ── Responsive overrides ── */}
      <style>{`
        @media (max-width: 1000px) {
          .luna-footer-main { grid-template-columns: 1fr 1fr !important; gap: 36px !important; }
        }
        @media (max-width: 640px) {
          .luna-footer-main { grid-template-columns: 1fr !important; gap: 28px !important; padding: 40px 20px 32px !important; }
          .luna-footer-bar  { flex-direction: column !important; text-align: center !important; padding: 14px 20px !important; }
        }
      `}</style>
    </footer>
  );
}

/* ── Small helper components ── */

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
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
      onMouseEnter={e => (e.currentTarget.style.color = '#FFBD59')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
    >
      {children}
    </Link>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      style={{
        color: 'rgba(255,255,255,0.4)',
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        transition: 'color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.color = 'white')}
      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
    >
      {children}
    </a>
  );
}

const headingStyle: React.CSSProperties = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: 12,
  fontWeight: 600,
  color: 'white',
  margin: '0 0 18px 0',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};
