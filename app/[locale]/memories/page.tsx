'use client';
export const dynamic = 'force-dynamic';

import {
  useState, useEffect, useRef, useCallback,
  type ReactNode, type CSSProperties, type FocusEvent, type ChangeEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslations, useLocale } from 'next-intl';
import NavBar from '@/components/NavBar';
import {
  BookHeart, Camera, Share2, FileText, ChevronDown,
  MapPin, Calendar, Users, ArrowRight, Sparkles,
  PenLine, Map, Loader2,
} from 'lucide-react';

// ─── Scroll-triggered animation hook ──────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function FadeUp({ children, delay = 0, style = {} }: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
}) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Feature card with hover ───────────────────────────────────────────────────

function FeatureCard({ icon, title, desc, delay = 0 }: {
  icon: ReactNode; title: string; desc: string; delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <FadeUp delay={delay} style={{ flex: '1 1 210px', minWidth: 210 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '32px 26px 28px',
          border: `1.5px solid ${hovered ? 'rgba(255,130,16,0.3)' : 'rgba(0,68,123,0.06)'}`,
          boxShadow: hovered
            ? '0 12px 32px rgba(255,130,16,0.12), 0 2px 8px rgba(0,68,123,0.04)'
            : '0 2px 12px rgba(0,68,123,0.04)',
          display: 'flex', flexDirection: 'column' as const, gap: 14,
          transition: 'border-color 0.3s, box-shadow 0.4s, transform 0.3s',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          cursor: 'default', height: '100%',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: hovered ? 'linear-gradient(135deg, #FF8210, #e67400)' : '#FFF7ED',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hovered ? '#FFFFFF' : '#FF8210',
          transition: 'background 0.3s, color 0.3s',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <h3 style={{
          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15.5,
          color: '#00447B', margin: 0, lineHeight: 1.3,
        }}>
          {title}
        </h3>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontSize: 13.5,
          color: '#6C6D6F', lineHeight: 1.65, margin: 0,
        }}>
          {desc}
        </p>
      </div>
    </FadeUp>
  );
}

// ─── Step item ─────────────────────────────────────────────────────────────────

function StepItem({ num, icon, title, desc, delay = 0 }: {
  num: number; icon: ReactNode; title: string; desc: string; delay?: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <FadeUp delay={delay} style={{ flex: '1 1 220px', maxWidth: 280 }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          textAlign: 'center' as const,
          display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 14,
          padding: '28px 20px', borderRadius: 20,
          background: hovered ? '#FFFFFF' : 'transparent',
          boxShadow: hovered ? '0 8px 28px rgba(0,68,123,0.06)' : 'none',
          transition: 'background 0.3s, box-shadow 0.3s', cursor: 'default',
        }}
      >
        <div style={{ position: 'relative' as const }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(145deg, #00447B, #003868)',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,68,123,0.2)',
            transition: 'transform 0.3s',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}>
            {icon}
          </div>
          <span style={{
            position: 'absolute' as const, top: -3, right: -3,
            width: 22, height: 22, borderRadius: '50%',
            background: '#FF8210', color: '#FFFFFF',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Poppins',sans-serif",
            boxShadow: '0 2px 6px rgba(255,130,16,0.4)',
          }}>
            {num}
          </span>
        </div>
        <h3 style={{
          fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 16,
          color: '#00447B', margin: 0,
        }}>
          {title}
        </h3>
        <p style={{
          fontFamily: "'Inter',sans-serif", fontSize: 13.5,
          color: '#6C6D6F', lineHeight: 1.6, margin: 0, maxWidth: 240,
        }}>
          {desc}
        </p>
      </div>
    </FadeUp>
  );
}

// ─── Module-level style constants (no state dependencies, stable across renders) ─

const inputBase: CSSProperties = {
  width: '100%', padding: '13px 16px', borderRadius: 10,
  border: '1.5px solid rgba(0,68,123,0.10)',
  fontFamily: "'Inter',sans-serif", fontSize: 14, color: '#2a2a3e',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s, box-shadow 0.2s', background: '#FFFFFF',
};

const labelBase: CSSProperties = {
  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12,
  color: '#6C6D6F', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7,
};

function handleFocus(e: FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#FF8210';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,130,16,0.08)';
}

function handleBlur(e: FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = 'rgba(0,68,123,0.10)';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function MemoriesLandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('memoriesLanding');
  const locale = useLocale();

  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travellers, setTravellers] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoginError, setIsLoginError] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Sync end date with start date on first pick
  const handleStartChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartDate(val);
    setFormError('');
    if (!endDate && val) {
      const d = new Date(val);
      d.setDate(d.getDate() + 1);
      setEndDate(d.toISOString().split('T')[0]);
    }
  }, [endDate]);

  const handleCreate = async () => {
    if (!destination.trim() || !startDate || !endDate) {
      setFormError(t('formError'));
      setIsLoginError(false);
      return;
    }
    if (!user) {
      setFormError(t('loginRequired'));
      setIsLoginError(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('luna_redirect_after_login', window.location.pathname);
      }
      return;
    }

    setCreating(true);
    setFormError('');
    setIsLoginError(false);
    try {
      const res = await fetch('/api/memories/standalone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          startDate,
          endDate,
          travellers: travellers.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { memory } = await res.json();

      const numDays = Math.round(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000,
      ) + 1;

      try {
        const skelRes = await fetch('/api/memories/skeleton', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: destination.trim(), numDays, locale }),
        });
        if (skelRes.ok) {
          const { titles } = await skelRes.json();
          if (titles?.length > 0) {
            const days = memory.memory_data.days.map(
              (d: { dayNumber: number; dayTitle?: string }, i: number) => ({
                ...d,
                dayTitle: titles[i] ?? d.dayTitle ?? `Day ${i + 1}`,
              }),
            );
            await fetch(`/api/memories/${memory.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ memory_data: { ...memory.memory_data, days } }),
            });
          }
        }
      } catch {
        // Skeleton failed. Continue with generic day titles.
      }

      router.push(`/${locale}/memories/${memory.id}`);
    } catch (err) {
      console.error('[memories] standalone create error:', err);
      setFormError(t('genericError'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter',sans-serif" }}>
      <NavBar />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        style={{
          position: 'relative', minHeight: 560,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/images/memories-hero.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center 40%',
          filter: 'brightness(0.55) saturate(1.1)',
          transform: heroLoaded ? 'scale(1)' : 'scale(1.05)',
          transition: 'transform 1.5s cubic-bezier(0.16,1,0.3,1)',
        }} role="img" aria-hidden="true" />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,31,63,0.65) 0%, rgba(0,68,123,0.55) 50%, rgba(0,31,63,0.80) 100%)',
        }} />

        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} aria-hidden="true" />

        <div style={{
          position: 'relative', zIndex: 1, textAlign: 'center',
          padding: '80px 24px', maxWidth: 720,
        }}>
          <div style={{
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.8s 0.2s, transform 0.8s 0.2s',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,130,16,0.15)',
              border: '1px solid rgba(255,130,16,0.35)',
              borderRadius: 100, padding: '7px 20px', marginBottom: 28,
              backdropFilter: 'blur(8px)',
            }}>
              <BookHeart size={14} color="#FF8210" aria-hidden="true" />
              <span style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11,
                color: '#FFBD59', textTransform: 'uppercase', letterSpacing: '0.12em',
              }}>
                {t('badge')}
              </span>
            </div>
          </div>

          <h1 style={{
            fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 48,
            color: '#FFFFFF', lineHeight: 1.1, margin: '0 0 20px',
            letterSpacing: '-0.025em',
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s 0.35s, transform 0.8s 0.35s',
          }}>
            {t('heroLine1')}<br />
            <span style={{
              background: 'linear-gradient(90deg, #FF8210, #FFBD59)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {t('heroLine2')}
            </span>
          </h1>

          <p style={{
            fontFamily: "'Inter',sans-serif", fontSize: 17,
            color: 'rgba(255,255,255,0.7)', lineHeight: 1.7,
            margin: '0 auto 40px', maxWidth: 520,
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.8s 0.5s, transform 0.8s 0.5s',
          }}>
            {t('heroSubtitle')}
          </p>

          <div style={{
            opacity: heroLoaded ? 1 : 0,
            transform: heroLoaded ? 'translateY(0)' : 'translateY(16px)',
            transition: 'opacity 0.8s 0.65s, transform 0.8s 0.65s',
          }}>
            <a href="#capture-form" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '17px 40px',
              background: 'linear-gradient(135deg, #FF8210 0%, #e67400 100%)',
              color: '#FFFFFF', borderRadius: 14,
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 8px 28px rgba(255,130,16,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
              {t('heroCta')}
              <ChevronDown size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU WILL GET ────────────────────────────────── */}
      <section aria-label={t('featuresTitle')} style={{ background: '#FDFBF7', padding: '72px 24px 76px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <span style={{
                display: 'inline-block',
                fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600,
                letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FF8210',
                marginBottom: 12,
              }}>
                {t('featuresLabel')}
              </span>
              <h2 style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 30,
                color: '#00447B', margin: '0 0 10px', lineHeight: 1.2,
              }}>
                {t('featuresTitle')}
              </h2>
              <p style={{
                fontFamily: "'Inter',sans-serif", fontSize: 15.5,
                color: '#6C6D6F', margin: '0 auto', maxWidth: 420, lineHeight: 1.6,
              }}>
                {t('featuresSubtitle')}
              </p>
            </div>
          </FadeUp>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center' }}>
            <FeatureCard delay={0.05} icon={<Sparkles size={21} aria-hidden="true" />}
              title={t('feat1Title')} desc={t('feat1Desc')} />
            <FeatureCard delay={0.15} icon={<Map size={21} aria-hidden="true" />}
              title={t('feat2Title')} desc={t('feat2Desc')} />
            <FeatureCard delay={0.25} icon={<Share2 size={21} aria-hidden="true" />}
              title={t('feat3Title')} desc={t('feat3Desc')} />
            <FeatureCard delay={0.35} icon={<FileText size={21} aria-hidden="true" />}
              title={t('feat4Title')} desc={t('feat4Desc')} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section aria-label={t('stepsTitle')} style={{ background: '#F4F7FB', padding: '72px 24px 76px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{
                display: 'inline-block',
                fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600,
                letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FF8210',
                marginBottom: 12,
              }}>
                {t('stepsLabel')}
              </span>
              <h2 style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 30,
                color: '#00447B', margin: '0 0 10px',
              }}>
                {t('stepsTitle')}
              </h2>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 15.5, color: '#6C6D6F', margin: 0 }}>
                {t('stepsSubtitle')}
              </p>
            </div>
          </FadeUp>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 0,
            justifyContent: 'center', alignItems: 'flex-start',
          }}>
            <StepItem num={1} delay={0.1} icon={<MapPin size={24} aria-hidden="true" />}
              title={t('step1Title')} desc={t('step1Desc')} />
            <div className="step-connector" style={{ display: 'flex', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ width: 40, height: 2, borderRadius: 1, opacity: 0.4, background: 'linear-gradient(90deg, #FFBD59, #FF8210)' }} />
            </div>
            <StepItem num={2} delay={0.25} icon={<Camera size={24} aria-hidden="true" />}
              title={t('step2Title')} desc={t('step2Desc')} />
            <div className="step-connector" style={{ display: 'flex', alignItems: 'center', paddingTop: 4 }}>
              <div style={{ width: 40, height: 2, borderRadius: 1, opacity: 0.4, background: 'linear-gradient(90deg, #FFBD59, #FF8210)' }} />
            </div>
            <StepItem num={3} delay={0.4} icon={<PenLine size={24} aria-hidden="true" />}
              title={t('step3Title')} desc={t('step3Desc')} />
          </div>
        </div>
      </section>

      {/* ── THE FORM ─────────────────────────────────────────── */}
      <section id="capture-form" aria-label={t('formTitle')} style={{ background: '#FDFBF7', padding: '72px 24px 80px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>
          <FadeUp>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <h2 style={{
                fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 28,
                color: '#00447B', margin: '0 0 8px',
              }}>
                {t('formTitle')}
              </h2>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14.5, color: '#6C6D6F', margin: 0, lineHeight: 1.6 }}>
                {t('formSubtitle')}
              </p>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <div style={{
              background: '#FFFFFF', borderRadius: 20, padding: '32px 30px 28px',
              boxShadow: '0 4px 24px rgba(0,68,123,0.06), 0 1px 3px rgba(0,68,123,0.04)',
              border: '1.5px solid rgba(0,68,123,0.06)',
            }}>
              {/* Destination */}
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="mem-destination" style={labelBase}>
                  <MapPin size={13} aria-hidden="true" /> {t('destination')}
                </label>
                <input
                  id="mem-destination"
                  type="text"
                  value={destination}
                  onChange={e => { setDestination(e.target.value); setFormError(''); }}
                  placeholder={t('destinationPlaceholder')}
                  style={inputBase}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  autoComplete="off"
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                <div>
                  <label htmlFor="mem-start-date" style={labelBase}>
                    <Calendar size={13} aria-hidden="true" /> {t('startDate')}
                  </label>
                  <input
                    id="mem-start-date"
                    type="date"
                    value={startDate}
                    onChange={handleStartChange}
                    style={inputBase}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
                <div>
                  <label htmlFor="mem-end-date" style={labelBase}>
                    <Calendar size={13} aria-hidden="true" /> {t('endDate')}
                  </label>
                  <input
                    id="mem-end-date"
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={e => { setEndDate(e.target.value); setFormError(''); }}
                    style={inputBase}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />
                </div>
              </div>

              {/* Travellers */}
              <div style={{ marginBottom: 22 }}>
                <label htmlFor="mem-travellers" style={labelBase}>
                  <Users size={13} aria-hidden="true" /> {t('travellers')}
                </label>
                <input
                  id="mem-travellers"
                  type="text"
                  value={travellers}
                  onChange={e => setTravellers(e.target.value)}
                  placeholder={t('travellersPlaceholder')}
                  style={inputBase}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </div>

              {/* Error message */}
              {formError && (
                <p
                  role="alert"
                  style={{
                    fontFamily: "'Inter',sans-serif", fontSize: 13,
                    color: isLoginError ? '#FF8210' : '#DC2626',
                    margin: '0 0 14px', lineHeight: 1.5,
                  }}
                >
                  {formError}
                  {isLoginError && (
                    <a href="/auth/login" style={{
                      color: '#FF8210', fontWeight: 600, marginLeft: 6,
                      textDecoration: 'underline',
                    }}>
                      {t('signInLink')}
                    </a>
                  )}
                </p>
              )}

              {/* Submit */}
              <button
                onClick={handleCreate}
                disabled={creating}
                aria-busy={creating}
                style={{
                  width: '100%', padding: '16px 24px',
                  background: creating ? 'rgba(255,130,16,0.6)' : 'linear-gradient(135deg, #FF8210 0%, #e67400 100%)',
                  color: '#FFFFFF', border: 'none', borderRadius: 12,
                  fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 15.5,
                  cursor: creating ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  boxShadow: '0 6px 20px rgba(255,130,16,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                {creating && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />}
                {creating ? t('creatingMemory') : t('startCapturing')}
                {!creating && <ArrowRight size={16} aria-hidden="true" />}
              </button>

              {!user && (
                <p style={{
                  fontFamily: "'Inter',sans-serif", fontSize: 12,
                  color: '#C0C0C0', textAlign: 'center', marginTop: 16, lineHeight: 1.55,
                }}>
                  {t('loginToSave')}
                </p>
              )}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── EXISTING LUNA USERS ───────────────────────────────── */}
      <section style={{ background: '#F4F7FB', padding: '48px 24px 64px' }}>
        <FadeUp>
          <div style={{
            maxWidth: 540, margin: '0 auto', textAlign: 'center',
            background: '#FFFFFF', borderRadius: 20, padding: '32px 36px',
            border: '1.5px solid rgba(0,68,123,0.06)',
            boxShadow: '0 2px 12px rgba(0,68,123,0.04)',
          }}>
            <BookHeart size={24} color="#00447B" style={{ marginBottom: 12 }} aria-hidden="true" />
            <p style={{
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 17,
              color: '#00447B', margin: '0 0 6px',
            }}>
              {t('existingTitle')}
            </p>
            <p style={{
              fontFamily: "'Inter',sans-serif", fontSize: 14,
              color: '#6C6D6F', margin: '0 0 20px', lineHeight: 1.6,
            }}>
              {t('existingDesc')}
            </p>
            <a href={`/${locale}/my-trips`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 26px', borderRadius: 12,
              border: '1.5px solid #00447B', color: '#00447B',
              fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
              textDecoration: 'none',
            }}>
              {t('goToMyTrips')}
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>
        </FadeUp>
      </section>

      <style>{`
        html { scroll-behavior: smooth; }
        input::placeholder { color: #C0C0C0; }
        .step-connector { display: flex; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .step-connector { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
