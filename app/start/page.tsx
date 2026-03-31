'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import HeroStepForm from '@/components/HeroStepForm';
import { trackCTAClick, trackTripPlanStarted } from '@/lib/analytics';

export default function StartPage() {
  const router = useRouter();

  useEffect(() => {
    trackCTAClick('plan_a_trip', 'start_page');
  }, []);

  const go = (q: string) => {
    if (!q.trim()) return;
    trackTripPlanStarted(q.split(',')[0].trim());
    router.push(`/plan?prompt=${encodeURIComponent(q)}`);
  };

  return (
    <>
      <NavBar />
      <main style={{
        minHeight: '100vh',
        background: 'var(--bg-section)',
        padding: '60px 24px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/luna_letsgo_bigger_3.PNG"
            alt="Luna Let's Go"
            style={{ height: 56, width: 'auto', marginBottom: 24 }}
          />
          <h1 style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 32,
            color: 'var(--navy)',
            marginBottom: 10,
            lineHeight: 1.2,
          }}>
            Plan your perfect trip
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: 'var(--gray-dark)',
            maxWidth: 420,
            margin: '0 auto',
          }}>
            Fill in the details and Luna will build your personalised itinerary in under 30 seconds.
          </p>
        </div>

        <div style={{ width: '100%', maxWidth: 600 }}>
          <HeroStepForm onSubmit={go} />
        </div>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .step-label {
          display: inline;
        }
        @media (max-width: 480px) {
          .step-label { display: none; }
        }
      `}</style>
    </>
  );
}
