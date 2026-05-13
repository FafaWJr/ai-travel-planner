'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Camera, MapPin, Sparkles, FileText } from 'lucide-react';
import NavBar from '@/components/NavBar';

const features = [
  { icon: Camera, titleKey: 'feature1Title', descKey: 'feature1Desc' },
  { icon: MapPin,  titleKey: 'feature2Title', descKey: 'feature2Desc' },
  { icon: Sparkles, titleKey: 'feature3Title', descKey: 'feature3Desc' },
  { icon: FileText, titleKey: 'feature4Title', descKey: 'feature4Desc' },
] as const;

export default function MemoriesComingSoon() {
  const t = useTranslations('memoriesComingSoon');
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Inter', sans-serif" }}>
      <NavBar />
      {/* Hero */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/images/memories-hero-2.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
          filter: 'brightness(0.52)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,44,75,0.6) 0%, rgba(0,44,75,0.35) 50%, rgba(0,44,75,0.8) 100%)',
        }} />

        <div style={{
          maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1,
          textAlign: 'center', padding: '88px 24px 80px',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 16px', borderRadius: 20,
            background: 'rgba(255,130,16,0.15)',
            border: '1px solid rgba(255,130,16,0.35)',
            marginBottom: 24,
          }}>
            <Sparkles size={13} color="#FFBD59" strokeWidth={2} />
            <span style={{
              fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 11,
              color: '#FFBD59', textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {t('badge')}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 40,
            color: '#fff', margin: '0 0 16px', lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            {t('title')}
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 400,
            color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: 1.7,
            maxWidth: 520, marginLeft: 'auto', marginRight: 'auto',
          }}>
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Feature cards — pulled up to overlap hero */}
        <div className="cs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 40 }}>
          {features.map(({ icon: Icon, titleKey, descKey }, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 16,
              padding: '28px 22px',
              boxShadow: '0 4px 20px rgba(0,20,60,0.07)',
              border: '1px solid rgba(0,68,123,0.06)',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,130,16,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 14,
              }}>
                <Icon size={22} color="#FF8210" strokeWidth={1.75} />
              </div>
              <h3 style={{
                fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15,
                color: '#00447B', margin: '0 0 6px',
              }}>
                {t(titleKey)}
              </h3>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                color: '#6C6D6F', lineHeight: 1.65, margin: 0,
              }}>
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          textAlign: 'center', marginTop: 40, padding: '40px 32px',
          background: '#fff', borderRadius: 20,
          boxShadow: '0 4px 24px rgba(0,20,60,0.06)',
          border: '1px solid rgba(0,68,123,0.06)',
        }}>
          <h2 style={{
            fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 22,
            color: '#00447B', margin: '0 0 8px',
          }}>
            {t('ctaTitle')}
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#6C6D6F',
            lineHeight: 1.65, margin: '0 0 28px', maxWidth: 440,
            marginLeft: 'auto', marginRight: 'auto',
          }}>
            {t('ctaDesc')}
          </p>
          <button
            onClick={() => router.push('/start')}
            style={{
              background: 'linear-gradient(135deg, #FF8210, #e06e00)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px 36px',
              fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(255,130,16,0.28)',
            }}
          >
            {t('ctaBtn')}
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .cs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
