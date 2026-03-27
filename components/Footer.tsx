import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--navy)',
      borderTop: '3px solid var(--orange)',
      fontFamily: 'var(--font-body)',
    }}>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 48px' }}>

        {/* Brand logo */}
        <div className="footer-brand">
          <img
            src="/luna_letsgo_bigger_3.PNG"
            alt="Luna Let's Go"
            style={{ height: 56, width: 'auto' }}
          />
        </div>

        {/* 4-column grid */}
        <div className="footer-grid">

          {/* About Us */}
          <div>
            <p className="footer-heading">About Us</p>
            <p className="footer-body">
              Luna Let&apos;s Go is your AI-powered travel companion, crafting personalised
              itineraries for every kind of explorer. From weekend escapes to epic adventures,
              we help you travel smarter.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="footer-heading">Quick Links</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/#planner" className="footer-link">Plan a Trip</Link>
              <Link href="/blog"    className="footer-link">Blog</Link>
              <Link href="/deals"   className="footer-link">Deals</Link>
              <Link href="/my-trips" className="footer-link">My Trips</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="footer-heading">Legal</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/privacy-policy" className="footer-link">Privacy Policy</Link>
              <Link href="/terms"   className="footer-link">Terms of Service</Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="footer-heading">Contact</p>
            <a
              href="mailto:hello@lunaletsgo.com"
              className="footer-email"
            >
              hello@lunaletsgo.com
            </a>
          </div>

        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(0,0,0,0.20)' }}>
        <div className="footer-bar">

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'rgba(255,255,255,0.5)',
            margin: 0,
          }}>
            &copy; 2026 Luna Let&apos;s Go. All rights reserved.
          </p>

          {/* Social icons */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>

            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="footer-social">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/>
              </svg>
            </a>

            {/* Facebook */}
            <a href="#" aria-label="Facebook" className="footer-social">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>

            {/* TikTok */}
            <a href="#" aria-label="TikTok" className="footer-social">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.6 6.7a4.8 4.8 0 0 1-3.8-4.3V2h-3.4v13.7a2.9 2.9 0 0 1-2.9 2.5
                  2.9 2.9 0 0 1-2.9-2.9 2.9 2.9 0 0 1 2.9-2.9c.3 0 .5 0 .8.1V9
                  a6.3 6.3 0 0 0-.8-.1A6.3 6.3 0 0 0 3.2 15.2a6.3 6.3 0 0 0 6.3 6.3
                  6.3 6.3 0 0 0 6.3-6.3V8.7a8.2 8.2 0 0 0 4.8 1.5V6.8a4.8 4.8 0 0 1-1-.1z"/>
              </svg>
            </a>

          </div>
        </div>
      </div>

      {/* ── Styles ────────────────────────────────────────────────────── */}
      <style>{`
        .footer-brand {
          margin-bottom: 48px;
          text-align: left;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 48px;
        }
        .footer-heading {
          font-family: var(--font-head);
          font-weight: 600;
          font-size: 16px;
          color: #fff;
          margin: 0 0 18px;
        }
        .footer-body {
          font-family: var(--font-body);
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          line-height: 1.75;
          margin: 0;
        }
        .footer-link {
          font-family: var(--font-body);
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          transition: color 0.2s ease;
          width: fit-content;
        }
        .footer-link:hover { color: #fff; }
        .footer-email {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--orange-light);
          text-decoration: none;
          transition: color 0.2s ease, text-decoration 0.2s ease;
          display: inline-block;
        }
        .footer-email:hover {
          color: #fff;
          text-decoration: underline;
        }
        .footer-bar {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .footer-social {
          color: rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          transition: color 0.2s ease;
          text-decoration: none;
        }
        .footer-social:hover { color: #fff; }

        /* Tablet — 2 columns */
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: repeat(2, 1fr); gap: 36px; }
        }
        /* Mobile — 1 column, centred brand */
        @media (max-width: 540px) {
          .footer-brand { text-align: center; }
          .footer-grid  { grid-template-columns: 1fr; gap: 32px; }
          .footer-bar   { flex-direction: column; align-items: center; text-align: center; }
        }
      `}</style>

    </footer>
  );
}
