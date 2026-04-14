'use client';
import { useTranslations } from 'next-intl';
import NavBar from '@/components/NavBar';
import { Hotel, Plane, Car, Map, Compass } from 'lucide-react';
import { BOOKING_AFFILIATE, ACTIVITY_AFFILIATE } from '@/lib/affiliate';

const PARTNERS = [
  { name: 'Booking.com', tKey: 'booking',     href: BOOKING_AFFILIATE.hotels,       Icon: Hotel },
  { name: 'Klook',       tKey: 'klook',       href: ACTIVITY_AFFILIATE.klook,       Icon: Compass },
  { name: 'GoWithGuide', tKey: 'goWithGuide', href: ACTIVITY_AFFILIATE.goWithGuide, Icon: Map },
  { name: 'Xcaret',      tKey: 'xcaret',      href: ACTIVITY_AFFILIATE.xcaret,      Icon: Plane },
];

export default function DealsPage() {
  const t = useTranslations('deals');
  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F2', fontFamily: "'Inter', sans-serif" }}>
      <NavBar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #00447B 0%, #679AC1 100%)',
        padding: '100px 40px 72px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 'clamp(32px, 5vw, 52px)',
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 16px',
          letterSpacing: '-1px',
          lineHeight: 1.15,
        }}>
          {t('title')}
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 18,
          fontWeight: 400,
          color: 'rgba(255,255,255,0.8)',
          margin: '0 auto',
          maxWidth: 480,
        }}>
          {t('subtitle')}
        </p>
      </div>

      {/* Partner cards */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 40px 48px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 24,
        }}>
          {PARTNERS.map(({ name, tKey, href, Icon }) => (
            <div
              key={name}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid rgba(0,68,123,0.1)',
                padding: '28px 24px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: 'rgba(255,130,16,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={22} color="#FF8210" strokeWidth={1.8} />
              </div>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 17,
                  fontWeight: 700,
                  color: '#00447B',
                  margin: '0 0 2px',
                }}>
                  {name}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#FF8210',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  margin: '0 0 10px',
                }}>
                  {t(`${tKey}.category` as Parameters<typeof t>[0])}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: '#6C6D6F',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {t(`${tKey}.description` as Parameters<typeof t>[0])}
                </p>
              </div>

              {/* CTA */}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#FF8210',
                  color: '#fff',
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                  padding: '10px 20px',
                  borderRadius: 50,
                  textAlign: 'center',
                  marginTop: 4,
                }}
              >
                {t(`${tKey}.cta` as Parameters<typeof t>[0])} &rarr;
              </a>
            </div>
          ))}

          {/* Europcar AU/NZ */}
          <div style={{
            background: '#fff',
            borderRadius: 16,
            border: '1px solid rgba(0,68,123,0.1)',
            padding: '28px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'rgba(255,130,16,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Car size={22} color="#FF8210" strokeWidth={1.8} aria-hidden="true" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: 17,
                fontWeight: 700,
                color: '#00447B',
                margin: '0 0 2px',
              }}>Europcar</p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                color: '#FF8210',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: '0 0 10px',
              }}>{t('europcar.category')}</p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                color: '#6C6D6F',
                lineHeight: 1.6,
                margin: 0,
              }}>
                {t('europcar.description')}
              </p>
            </div>
            {/* Awin affiliate image tag - required for tracking */}
            <a
              rel="sponsored"
              href="https://www.awin1.com/cread.php?s=4703163&v=10777&q=567194&r=2825924"
              target="_blank"
              style={{ display: 'block', lineHeight: 0 }}
            >
              <img
                src="https://www.awin1.com/cshow.php?s=4703163&v=10777&q=567194&r=2825924"
                alt="Europcar car rental deals"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 8,
                  display: 'block',
                }}
              />
            </a>
            <a
              href="https://www.awin1.com/cread.php?s=4703163&v=10777&q=567194&r=2825924"
              target="_blank"
              rel="sponsored noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#FF8210',
                color: '#fff',
                fontFamily: "'Poppins', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                padding: '10px 20px',
                borderRadius: 50,
                textAlign: 'center',
                marginTop: 4,
              }}
            >
              {t('europcar.cta')} &rarr;
            </a>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{ textAlign: 'center', padding: '0 40px 60px', maxWidth: 640, margin: '0 auto' }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          color: '#6C6D6F',
          lineHeight: 1.6,
        }}>
          {t('disclaimer')}
        </p>
      </div>

      <style>{`
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
          div[style*="padding: '100px 40px 72px'"] { padding-top: 72px !important; padding-bottom: 48px !important; padding-left: 20px !important; padding-right: 20px !important; }
          div[style*="padding: '64px 40px 48px'"] { padding-left: 20px !important; padding-right: 20px !important; padding-top: 40px !important; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          div[style*="gridTemplateColumns"] { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
