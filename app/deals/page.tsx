'use client';
import NavBar from '@/components/NavBar';
import { bookingComLink } from '@/lib/affiliate';

const POPULAR_DESTINATIONS = [
  {
    name: 'Bali, Indonesia',
    photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
    tag: 'Beach & Nature',
  },
  {
    name: 'Tokyo, Japan',
    photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
    tag: 'Culture & Food',
  },
  {
    name: 'Paris, France',
    photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    tag: 'Romance',
  },
  {
    name: 'New York, USA',
    photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80',
    tag: 'City Break',
  },
  {
    name: 'Santorini, Greece',
    photo: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80',
    tag: 'Islands',
  },
  {
    name: 'Bangkok, Thailand',
    photo: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80',
    tag: 'Adventure',
  },
  {
    name: 'Barcelona, Spain',
    photo: 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=600&q=80',
    tag: 'Culture',
  },
  {
    name: 'Maldives',
    photo: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=80',
    tag: 'Luxury',
  },
  {
    name: 'Lisbon, Portugal',
    photo: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=600&q=80',
    tag: 'Trending',
  },
  {
    name: 'Sydney, Australia',
    photo: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=80',
    tag: 'City & Nature',
  },
  {
    name: 'Dubai, UAE',
    photo: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
    tag: 'Luxury',
  },
  {
    name: 'Cancun, Mexico',
    photo: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=600&q=80',
    tag: 'Beach',
  },
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
          {POPULAR_DESTINATIONS.map(({ name, photo, tag }) => (
            <a
              key={name}
              href={bookingComLink(name)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'white', borderRadius: 16, overflow: 'hidden',
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
              {/* Photo header */}
              <div style={{
                height: 140,
                backgroundImage: `url(${photo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', top: 10, left: 10,
                  background: 'rgba(255,130,16,0.92)', color: 'white',
                  fontFamily: "'Lato', sans-serif", fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '3px 8px', borderRadius: 20,
                }}>
                  {tag}
                </span>
              </div>
              {/* Card body */}
              <div style={{ padding: '16px 20px 20px' }}>
                <p style={{
                  fontFamily: "'Poppins', sans-serif", fontSize: 16, fontWeight: 600,
                  color: '#00447B', margin: 0,
                }}>
                  {name}
                </p>
              </div>
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
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr 1fr !important; }
          div[style*="padding: '64px 40px'"],
          div[style*="padding: '100px 40px 80px'"] { padding-left: 20px !important; padding-right: 20px !important; padding-top: 60px !important; padding-bottom: 48px !important; }
        }
        @media (max-width: 380px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
