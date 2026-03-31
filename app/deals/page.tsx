'use client';
import NavBar from '@/components/NavBar';
import { bookingComLink } from '@/lib/affiliate';

const POPULAR_DESTINATIONS = [
  { name: 'Bali, Indonesia',     emoji: '🌴', tag: 'Beach & Nature' },
  { name: 'Tokyo, Japan',        emoji: '🗼', tag: 'Culture & Food' },
  { name: 'Paris, France',       emoji: '🗺️', tag: 'Romance' },
  { name: 'New York, USA',       emoji: '🏙️', tag: 'City Break' },
  { name: 'Santorini, Greece',   emoji: '🏝️', tag: 'Islands' },
  { name: 'Bangkok, Thailand',   emoji: '🐘', tag: 'Adventure' },
  { name: 'Barcelona, Spain',    emoji: '🎨', tag: 'Culture' },
  { name: 'Maldives',            emoji: '🐠', tag: 'Luxury' },
  { name: 'Lisbon, Portugal',    emoji: '🚋', tag: 'Trending' },
  { name: 'Sydney, Australia',   emoji: '🦘', tag: 'City & Nature' },
  { name: 'Dubai, UAE',          emoji: '✨', tag: 'Luxury' },
  { name: 'Cancun, Mexico',      emoji: '🌺', tag: 'Beach' },
];

export default function DealsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F2', fontFamily: "'Lato', sans-serif" }}>
      <NavBar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #003580 0%, #0071c2 100%)',
        padding: '100px 40px 80px',
        textAlign: 'center',
      }}>
        <p style={{
          fontFamily: "'Lato', sans-serif", fontSize: 12, fontWeight: 700,
          color: '#FFB700', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
        }}>
          Hotel Deals
        </p>
        <h1 style={{
          fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(36px,5vw,52px)',
          fontWeight: 700, color: 'white', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15,
        }}>
          Find your perfect stay.
        </h1>
        <p style={{
          fontFamily: "'Lato', sans-serif", fontSize: 18, fontWeight: 300,
          color: 'rgba(255,255,255,0.75)', marginBottom: 40,
          maxWidth: 480, margin: '0 auto 40px',
        }}>
          Browse hotels, apartments, and resorts worldwide. Best price guaranteed on Booking.com.
        </p>
        <a
          href={bookingComLink()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: '#FFB700', color: '#003580', borderRadius: 50,
            padding: '16px 48px', fontFamily: "'Poppins', sans-serif",
            fontSize: 17, fontWeight: 700, textDecoration: 'none', display: 'inline-block',
          }}
        >
          Search All Hotels →
        </a>
      </div>

      {/* Destination grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 40px' }}>
        <h2 style={{
          fontFamily: "'Poppins', sans-serif", fontSize: 32, fontWeight: 600,
          color: '#00447B', marginBottom: 8,
        }}>
          Popular destinations
        </h2>
        <p style={{
          fontFamily: "'Lato', sans-serif", fontSize: 16, color: '#6C6D6F', marginBottom: 40,
        }}>
          Click any destination to search hotels instantly on Booking.com.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {POPULAR_DESTINATIONS.map(({ name, emoji, tag }) => (
            <a
              key={name}
              href={bookingComLink(name)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'white', borderRadius: 16, padding: '24px 20px',
                border: '1px solid rgba(0,68,123,0.1)', textDecoration: 'none',
                display: 'block', transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,68,123,0.12)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 10 }}>{emoji}</div>
              <p style={{
                fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 600,
                color: '#00447B', margin: '0 0 4px',
              }}>
                {name}
              </p>
              <p style={{
                fontFamily: "'Lato', sans-serif", fontSize: 12, color: '#FF8210',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
              }}>
                {tag}
              </p>
            </a>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ textAlign: 'center', padding: '0 40px 60px', maxWidth: 600, margin: '0 auto' }}>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: 12, color: '#C0C0C0', lineHeight: 1.6 }}>
          Luna Let&apos;s Go earns a small commission when you book through our Booking.com links. This helps keep Luna free for everyone. Prices and availability are managed by Booking.com.
        </p>
      </div>

      <style>{`
        @media (max-width: 600px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 380px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
