'use client';
import { useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

type DealCategory = 'All' | 'Flights' | 'Hotels' | 'Excursions' | 'Tickets';

const CATEGORIES: DealCategory[] = ['All', 'Flights', 'Hotels', 'Excursions', 'Tickets'];

/* ── Flat SVG icons per deal category — brand colours only ── */
const IconHotel = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <rect x="6" y="18" width="40" height="28" rx="3" fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth="1.8"/>
    <rect x="14" y="10" width="24" height="10" rx="2" fill="rgba(255,255,255,0.25)" stroke="#fff" strokeWidth="1.8"/>
    <rect x="14" y="2" width="24" height="10" rx="2" fill="rgba(255,255,255,0.18)" stroke="#fff" strokeWidth="1.8"/>
    <rect x="16" y="30" width="8" height="8" rx="1.5" fill="#fff" opacity=".5"/>
    <rect x="28" y="30" width="8" height="8" rx="1.5" fill="#fff" opacity=".5"/>
    <rect x="20" y="36" width="12" height="10" rx="1.5" fill="#fff" opacity=".7"/>
  </svg>
);

const IconFlight = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <path d="M42 18 C42 18 38 10 26 10 C14 10 8 18 8 26 C8 34 14 42 26 42 C38 42 46 34 46 26" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".3"/>
    <path d="M10 32 L20 24 L16 14 L20 14 L28 22 L38 18 C41 17 44 18 44 21 C44 24 41 26 38 26 L28 26 L24 36 L20 36 L22 26 L12 32Z" fill="#fff" opacity=".85"/>
  </svg>
);

const IconCompass = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <circle cx="26" cy="26" r="20" stroke="#fff" strokeWidth="2" opacity=".4"/>
    <circle cx="26" cy="26" r="14" stroke="#fff" strokeWidth="1.5" opacity=".25"/>
    <polygon points="26,10 30,26 26,22 22,26" fill="#fff" opacity=".9"/>
    <polygon points="26,42 22,26 26,30 30,26" fill="#fff" opacity=".5"/>
    <circle cx="26" cy="26" r="3" fill="#fff"/>
    <line x1="6" y1="26" x2="12" y2="26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    <line x1="40" y1="26" x2="46" y2="26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    <line x1="26" y1="6" x2="26" y2="12" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    <line x1="26" y1="40" x2="26" y2="46" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
  </svg>
);

const IconTicket = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <path d="M6 18 L6 34 C10 34 14 30 14 26 C14 22 10 18 6 18Z" fill="#fff" opacity=".25"/>
    <rect x="6" y="18" width="40" height="16" rx="3" stroke="#fff" strokeWidth="1.8" fill="rgba(255,255,255,0.12)"/>
    <line x1="18" y1="18" x2="18" y2="34" stroke="#fff" strokeWidth="1.5" strokeDasharray="3 2" opacity=".5"/>
    <rect x="22" y="22" width="16" height="2.5" rx="1.25" fill="#fff" opacity=".7"/>
    <rect x="22" y="28" width="10" height="2.5" rx="1.25" fill="#fff" opacity=".5"/>
    <circle cx="14" cy="26" r="4" fill="rgba(0,0,0,0.2)" stroke="#fff" strokeWidth="1.5" opacity=".6"/>
  </svg>
);

const IconHouse = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <path d="M26 8 L46 24 L46 44 L6 44 L6 24Z" fill="rgba(255,255,255,0.15)" stroke="#fff" strokeWidth="1.8"/>
    <path d="M6 24 L26 8 L46 24" stroke="#fff" strokeWidth="2" strokeLinejoin="round" fill="none"/>
    <rect x="18" y="30" width="16" height="14" rx="2" fill="rgba(255,255,255,0.3)" stroke="#fff" strokeWidth="1.5"/>
    <rect x="14" y="26" width="10" height="8" rx="1.5" fill="#fff" opacity=".5"/>
    <circle cx="36" cy="30" r="1.5" fill="#fff" opacity=".7"/>
  </svg>
);

const IconMountain = () => (
  <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
    <path d="M4 44 L20 18 L28 28 L34 20 L48 44Z" fill="rgba(255,255,255,0.15)" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M16 24 L20 18 L24 24" fill="#fff" opacity=".5"/>
    <path d="M30 26 L34 20 L38 26" fill="#fff" opacity=".5"/>
    <circle cx="40" cy="12" r="6" fill="#fff" opacity=".2" stroke="#fff" strokeWidth="1.5"/>
    <path d="M37 12 L40 8 L43 12" fill="#fff" opacity=".6"/>
  </svg>
);

const DEAL_ICONS: Record<number, () => React.ReactElement> = {
  1: IconHotel,
  2: IconFlight,
  3: IconCompass,
  4: IconTicket,
  5: IconHouse,
  6: IconMountain,
};

const PLACEHOLDER_DEALS = [
  {
    id: 1,
    category: 'Hotels' as DealCategory,
    brand: 'Santorini Cliffside Resorts',
    destination: 'Santorini, Greece',
    discount: 'Up to 35% off',
    description: 'Caldera-view suites with private plunge pools, starting from €180/night.',
    expiry: 'Offer expires 31 May 2026',
    badge: 'HOT DEAL',
    badgeColor: '#FF8210',
    gradient: 'linear-gradient(135deg, #00447B 0%, #679AC1 100%)',
  },
  {
    id: 2,
    category: 'Flights' as DealCategory,
    brand: 'European Getaways',
    destination: 'Multiple destinations',
    discount: 'Up to 40% off',
    description: 'Flash sale on round trips to Paris, Lisbon, Rome and Barcelona from major hubs.',
    expiry: 'Offer expires 15 Apr 2026',
    badge: 'FLASH SALE',
    badgeColor: '#00447B',
    gradient: 'linear-gradient(135deg, #FF8210 0%, #FFBD59 100%)',
  },
  {
    id: 3,
    category: 'Excursions' as DealCategory,
    brand: 'Bali Experience Co.',
    destination: 'Bali, Indonesia',
    discount: 'Up to 25% off',
    description: 'Private sunrise Ubud jungle trek, rice terrace walk, and temple tour combo.',
    expiry: 'Offer expires 30 Jun 2026',
    badge: 'TOP PICK',
    badgeColor: '#FF8210',
    gradient: 'linear-gradient(135deg, #679AC1 0%, #00447B 100%)',
  },
  {
    id: 4,
    category: 'Tickets' as DealCategory,
    brand: 'Tokyo Pass',
    destination: 'Tokyo, Japan',
    discount: 'Save ¥4,200',
    description: 'Unlimited metro travel, skip-the-line Skytree, and Tsukiji Market guided tour.',
    expiry: 'Offer expires 1 Aug 2026',
    badge: 'BUNDLE',
    badgeColor: '#00447B',
    gradient: 'linear-gradient(135deg, #00447B 0%, #FF8210 100%)',
  },
  {
    id: 5,
    category: 'Hotels' as DealCategory,
    brand: 'Morocco Riad Collection',
    destination: 'Marrakech, Morocco',
    discount: 'Up to 30% off',
    description: 'Authentic riads in the medina with rooftop terraces, breakfast included.',
    expiry: 'Offer expires 20 May 2026',
    badge: 'EXCLUSIVE',
    badgeColor: '#FF8210',
    gradient: 'linear-gradient(135deg, #FFBD59 0%, #FF8210 100%)',
  },
  {
    id: 6,
    category: 'Excursions' as DealCategory,
    brand: 'New Zealand Adventures',
    destination: 'Queenstown, NZ',
    discount: 'Up to 20% off',
    description: 'Bungee + skydive combo, glacier heli-hike, or Milford Sound cruise — your pick.',
    expiry: 'Offer expires 15 Sep 2026',
    badge: 'ADVENTURE',
    badgeColor: '#00447B',
    gradient: 'linear-gradient(135deg, #679AC1 0%, #FFBD59 100%)',
  },
];


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

export default function DealsPage() {
  const [activeCategory, setActiveCategory] = useState<DealCategory>('All');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const filtered = activeCategory === 'All'
    ? PLACEHOLDER_DEALS
    : PLACEHOLDER_DEALS.filter(d => d.category === activeCategory);

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
          {/* Background glow */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `
              radial-gradient(circle at 15% 60%, rgba(255,130,16,0.20) 0%, transparent 55%),
              radial-gradient(circle at 85% 30%, rgba(103,154,193,0.25) 0%, transparent 50%)
            `,
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>
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
              Travel Deals
            </h1>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 auto',
            }}>
              Exclusive discounts on hotels, flights, excursions &amp; more
            </p>
          </div>
        </section>

        {/* ── Filter bar ── */}
        <div style={{
          background: 'var(--bg-section)',
          borderBottom: '1px solid var(--border)',
          padding: '0 clamp(20px, 5vw, 80px)',
        }}>
          <div style={{
            maxWidth: 1200, margin: '0 auto',
            display: 'flex', alignItems: 'center', gap: 4,
            overflowX: 'auto', padding: '16px 0',
          }}>
            {CATEGORIES.map(cat => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13,
                    padding: '9px 20px', borderRadius: 'var(--r-pill)',
                    border: active ? '1.5px solid var(--navy)' : '1.5px solid transparent',
                    background: active ? 'var(--navy)' : 'transparent',
                    color: active ? '#fff' : 'var(--gray-dark)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat}
                </button>
              );
            })}

            {/* Coming soon pill at end */}
            <div style={{
              marginLeft: 'auto', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,130,16,0.10)', border: '1.5px solid rgba(255,130,16,0.30)',
              borderRadius: 'var(--r-pill)', padding: '6px 14px',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="13" rx="2" stroke="#FF8210" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#FF8210" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: '#FF8210', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Preview only
              </span>
            </div>
          </div>
        </div>

        {/* ── Deals grid ── */}
        <section style={{ padding: 'clamp(40px, 6vw, 72px) clamp(20px, 5vw, 80px)', maxWidth: 1200, margin: '0 auto' }}>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 24,
          }}>
            {filtered.map(deal => (
              <div key={deal.id} style={{
                background: '#fff',
                borderRadius: 'var(--r-lg)',
                border: '1.5px solid var(--border)',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
                opacity: 0.78,
                filter: 'grayscale(0.08)',
              }}>
                {/* Card header gradient */}
                <div style={{
                  height: 140, background: deal.gradient,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  position: 'relative',
                }}>
                  {/* Badge */}
                  <div style={{
                    position: 'absolute', top: 14, left: 14,
                    background: deal.badgeColor, color: '#fff',
                    fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 10,
                    padding: '4px 10px', borderRadius: 'var(--r-pill)',
                    letterSpacing: '0.08em',
                  }}>
                    {deal.badge}
                  </div>

                  {(() => { const Icon = DEAL_ICONS[deal.id]; return Icon ? <Icon /> : null; })()}
                  <span style={{
                    fontFamily: 'var(--font-head)', fontWeight: 700,
                    fontSize: 'clamp(20px, 3vw, 26px)', color: '#fff',
                  }}>
                    {deal.discount}
                  </span>
                </div>

                {/* Content */}
                <div style={{ padding: '18px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Category */}
                  <span style={{
                    fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11,
                    color: 'var(--navy)', background: 'rgba(0,68,123,0.08)',
                    padding: '3px 10px', borderRadius: 'var(--r-pill)',
                    alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    {deal.category}
                  </span>

                  {/* Brand + destination */}
                  <div>
                    <p style={{
                      fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15,
                      color: '#111', margin: '0 0 2px',
                    }}>
                      {deal.brand}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 12,
                      color: 'var(--gray-dark)', margin: 0,
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="var(--orange)" opacity=".7"/>
                        <circle cx="12" cy="9" r="2.5" fill="#fff"/>
                      </svg>
                      {deal.destination}
                    </p>
                  </div>

                  {/* Description */}
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: 'var(--gray-dark)', lineHeight: 1.6, margin: 0, flex: 1,
                  }}>
                    {deal.description}
                  </p>

                  {/* Expiry */}
                  <p style={{
                    fontFamily: 'var(--font-body)', fontSize: 11,
                    color: 'var(--gray-light)', margin: 0,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="var(--gray-light)" strokeWidth="1.5"/>
                      <path d="M12 7v5l3 3" stroke="var(--gray-light)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {deal.expiry}
                  </p>

                  {/* CTA */}
                  <button
                    disabled
                    style={{
                      marginTop: 6,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'rgba(0,68,123,0.06)',
                      color: 'var(--gray-light)',
                      fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13,
                      padding: '10px 0', borderRadius: 'var(--r-pill)',
                      border: '1.5px solid var(--border)',
                      cursor: 'not-allowed', width: '100%',
                    }}
                  >
                    Get Deal
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Coming soon section */}
          <div style={{
            marginTop: 56,
            background: 'var(--bg-section)',
            border: '2px solid rgba(0,68,123,0.10)',
            borderRadius: 'var(--r-lg)',
            padding: 'clamp(32px, 5vw, 56px) clamp(24px, 5vw, 56px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center', gap: 20,
          }}>
            {/* Icon */}
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
                fontFamily: 'var(--font-head)', fontWeight: 700,
                fontSize: 'clamp(18px, 2.5vw, 24px)',
                color: 'var(--navy)', marginBottom: 8,
              }}>
                Deals are coming — and they'll be worth it
              </p>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--gray-dark)',
                maxWidth: 500, margin: '0 auto', lineHeight: 1.65,
              }}>
                We're partnering with top hotels, airlines, and tour operators to bring you real, curated discounts — not generic vouchers. Subscribe to get them straight to your inbox.
              </p>
            </div>

            {/* Email CTA */}
            <div style={{
              width: '100%', maxWidth: 460,
              background: '#fff',
              border: '1.5px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '24px 28px',
            }}>
              <p style={{
                fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14,
                color: 'var(--navy)', marginBottom: 14,
              }}>
                Subscribe to get exclusive deals straight to your inbox
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
                    Subscribed! We'll send deals your way.
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
                    Subscribe
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
