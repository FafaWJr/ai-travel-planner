'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import NavBar from '@/components/NavBar';
import HeroStepForm from '@/components/HeroStepForm';
import { trackCTAClick, trackTripPlanStarted } from '@/lib/analytics';

export default function StartPage() {
  const router = useRouter();
  const t  = useTranslations('start');
  const tH = useTranslations('startHero');

  useEffect(() => {
    trackCTAClick('plan_a_trip', 'start_page');
  }, []);

  const go = (q: string) => {
    if (!q.trim()) return;
    trackTripPlanStarted(q.split(',')[0].trim());
    router.push(`/plan?prompt=${encodeURIComponent(q)}`);
  };

  const feats = [
    {
      title: tH('feat1Title'),
      body: tH('feat1Body'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      title: tH('feat2Title'),
      body: tH('feat2Body'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
      ),
    },
    {
      title: tH('feat3Title'),
      body: tH('feat3Body'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      title: tH('feat4Title'),
      body: tH('feat4Body'),
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}>
          <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <NavBar />

      {/* Mobile-only compact header */}
      <div className="start-mobile-head">
        <h1 style={{
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 700,
          fontSize: 26,
          color: '#00447B',
          marginBottom: 8,
          lineHeight: 1.2,
        }}>
          {t('title')}
        </h1>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 14,
          color: '#6C6D6F',
          lineHeight: 1.5,
          margin: 0,
        }}>
          {t('subtitle')}
        </p>
      </div>

      <main className="start-main">

        {/* Left hero column — desktop/tablet only */}
        <div className="start-left">
          <span style={{
            display: 'inline-block',
            fontFamily: "'Poppins', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase' as const,
            color: '#FF8210',
            border: '1px solid #FF8210',
            padding: '6px 14px',
            borderRadius: 100,
            marginBottom: 22,
          }}>
            {tH('badge')}
          </span>

          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 52,
            color: '#00447B',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
            marginBottom: 20,
          }}>
            {tH('heading1')}<br />
            <span style={{ color: '#FF8210' }}>{tH('heading2')}</span>
          </h1>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 17,
            color: '#6C6D6F',
            lineHeight: 1.55,
            marginBottom: 36,
            maxWidth: 460,
          }}>
            {tH('subtitle')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {feats.map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  flexShrink: 0,
                  width: 40,
                  height: 40,
                  background: '#FFF3E5',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF8210',
                }}>
                  {feat.icon}
                </div>
                <div>
                  <strong style={{
                    display: 'block',
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 600,
                    fontSize: 15,
                    color: '#00447B',
                    marginBottom: 2,
                  }}>
                    {feat.title}
                  </strong>
                  <small style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 13.5,
                    color: '#6C6D6F',
                    lineHeight: 1.5,
                  }}>
                    {feat.body}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form column */}
        <div className="start-right">
          <HeroStepForm onSubmit={go} />
        </div>

      </main>

      <style>{`
        .start-mobile-head {
          display: none;
        }
        .start-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 60px 80px;
          display: grid;
          grid-template-columns: 1fr 480px;
          gap: 80px;
          align-items: start;
          background: #F8F9FB;
          min-height: calc(100vh - 70px);
        }
        .start-left {
          padding-top: 20px;
          position: sticky;
          top: 90px;
        }
        .start-right {
          padding-top: 20px;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .start-main {
            grid-template-columns: 1fr;
            gap: 40px;
            padding: 40px 40px 60px;
          }
          .start-left {
            position: static;
            padding-top: 0;
          }
          .start-left h1 {
            font-size: 40px !important;
          }
          .start-right {
            max-width: 500px;
            margin: 0 auto;
            width: 100%;
            padding-top: 0;
          }
        }

        /* Mobile */
        @media (max-width: 640px) {
          .start-mobile-head {
            display: block;
            padding: 28px 20px 0;
            background: #F8F9FB;
          }
          .start-left {
            display: none;
          }
          .start-main {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 16px 16px 60px;
            min-height: unset;
          }
          .start-right {
            max-width: 100%;
            padding-top: 0;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
