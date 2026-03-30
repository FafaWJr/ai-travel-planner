import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--navy)',
      borderTop: '3px solid var(--orange)',
      fontFamily: 'var(--font-body)',
    }}>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 28px' }}>

        {/* Brand logo */}
        <div className="footer-brand">
          <img
            src="/luna_letsgo_bigger_3.PNG"
            alt="Luna Let's Go"
            style={{ height: 104, width: 'auto' }}
          />
        </div>

        {/* About CTA */}
        <div className="footer-about-cta">
          <Link href="/about" className="footer-about-btn">
            The Purpose Behind Luna
          </Link>
        </div>

        {/* 3-column grid */}
        <div className="footer-grid">

          {/* Quick Links */}
          <div>
            <p className="footer-heading">Quick Links</p>
            <nav className="footer-links-grid">
              <Link href="/start"       className="footer-link">Plan a Trip</Link>
              <Link href="/trip-ideas"  className="footer-link">Trip Ideas</Link>
              <Link href="/quiz"        className="footer-link">Travel Quiz</Link>
              <Link href="/blog"        className="footer-link">Blog</Link>
              <Link href="/deals"       className="footer-link">Deals</Link>
              <Link href="/about"       className="footer-link">About Us</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <p className="footer-heading">Legal</p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/privacy-policy"    className="footer-link">Privacy Policy</Link>
              <Link href="/terms-of-service"  className="footer-link">Terms of Service</Link>
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
          margin-bottom: 28px;
          text-align: left;
        }
        .footer-about-cta {
          text-align: center;
          margin-bottom: 28px;
        }
        .footer-about-btn {
          display: inline-block;
          padding: 11px 28px;
          border: 1.5px solid rgba(255,255,255,0.30);
          border-radius: 100px;
          font-family: var(--font-head);
          font-weight: 600;
          font-size: 14px;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          letter-spacing: 0.2px;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .footer-about-btn:hover {
          border-color: var(--orange);
          color: #fff;
          background: rgba(255,130,16,0.12);
        }
        .footer-links-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 20px;
        }
        .footer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
          padding: 14px 24px;
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
          .footer-links-grid { grid-template-columns: 1fr 1fr; }
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
