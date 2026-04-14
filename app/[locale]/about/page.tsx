'use client'

import { useState, useEffect, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import NavBar from '@/components/NavBar'
import { useTranslations } from 'next-intl'

const PHOTOS = [
  {
    src: '/about/photo-1.jpg',
    caption: 'Lost (on purpose) at Shibuya Crossing, Tokyo, Japan',
  },
  {
    src: '/about/photo-2.jpg',
    caption: 'The Sphere lit up at night, Las Vegas, Nevada',
  },
  {
    src: '/about/photo-3.jpg',
    caption: 'The iconic welcome sign, Las Vegas, Nevada',
  },
  {
    src: '/about/photo-4.jpg',
    caption: 'Foam party madness at Coco Bongo, Cancún, Mexico',
  },
  {
    src: '/about/photo-5.jpg',
    caption: 'Super Nintendo World, Universal Studios Japan',
  },
  {
    src: '/about/IMG_6137.jpeg',
    caption: 'Swinging above the rice terraces, Ubud, Bali',
  },
  {
    src: '/about/IMG_6682.jpeg',
    caption: 'Perched above the T-Rex, Kelingking Beach, Nusa Penida',
  },
]

const STATS = [
  { value: '30s', tKey: 'stat1' },
  { value: '195', tKey: 'stat2' },
  { value: '7',   tKey: 'stat3' },
  { value: '∞',   tKey: 'stat4' },
]

const FEATURES = [
  { icon: '⚡️', tKey: 'feature1' },
  { icon: '🗓',  tKey: 'feature2' },
  { icon: '🏨',  tKey: 'feature3' },
  { icon: '💬',  tKey: 'feature4' },
  { icon: '✅',  tKey: 'feature5' },
  { icon: '💾',  tKey: 'feature6' },
]

export default function AboutPage() {
  const t = useTranslations('about')
  const [activePhoto, setActivePhoto] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [imgLoaded, setImgLoaded] = useState<boolean[]>(PHOTOS.map(() => false))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActivePhoto(p => (p + 1) % PHOTOS.length)
    }, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const goTo = (idx: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setActivePhoto(idx)
    intervalRef.current = setInterval(() => {
      setActivePhoto(p => (p + 1) % PHOTOS.length)
    }, 5000)
  }

  const prev = () => goTo((activePhoto - 1 + PHOTOS.length) % PHOTOS.length)
  const next = () => goTo((activePhoto + 1) % PHOTOS.length)

  const handleDragStart = (x: number) => { setIsDragging(true); setDragStartX(x) }
  const handleDragEnd   = (x: number) => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragStartX - x > 50) next()
    if (x - dragStartX > 50) prev()
  }

  const markLoaded = (idx: number) => {
    setImgLoaded(prev => { const n = [...prev]; n[idx] = true; return n })
  }

  return (
    <>
      <NavBar />
      <div style={{ fontFamily: 'var(--font-body)', color: '#000', background: '#fff', overflowX: 'hidden' }}>

      {/* HERO */}
      <section style={{
        position: 'relative',
        minHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background photo */}
        <img
          src="/images/wilson-fafa-bali.jpeg"
          alt="Wilson and Fafa in Bali"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 30%',
            zIndex: 0,
          }}
        />

        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,68,123,0.65) 100%)',
          zIndex: 1,
        }} />

        {/* Text content */}
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '140px 24px 100px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,189,89,0.15)', border: '1px solid rgba(255,189,89,0.3)',
            borderRadius: 100, padding: '6px 20px', marginBottom: 28,
          }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FFBD59', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {t('heroLabel')}
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 700,
            fontSize: 'clamp(36px, 6vw, 60px)',
            color: '#fff', lineHeight: 1.15, marginBottom: 24,
          }}>
            {t('heroH1Line1')}<br />
            <span style={{ color: '#FFBD59' }}>{t('heroH1Line2')}</span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.8,
            color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto',
          }}>
            {t('heroSubtitle')}
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: '#FF8210' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          {STATS.map(({ value, tKey }, i) => (
            <div key={tKey} style={{
              flex: '1 1 140px', textAlign: 'center', padding: '28px 32px',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 36, color: '#fff' }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 4 }}>
                {t(`stats.${tKey}` as Parameters<typeof t>[0])}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* OUR STORY */}
      <section style={{ padding: '100px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 3, background: '#FF8210', borderRadius: 2 }} />
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase' }}>
              {t('storyLabel')}
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 'clamp(28px, 4vw, 42px)', color: '#00447B', lineHeight: 1.3, marginBottom: 40 }}>
            {t('storyH2')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 52 }}>
            <div style={{ background: '#F4F7FB', borderRadius: 20, padding: '32px 28px', borderTop: '3px solid #00447B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#00447B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: '#fff', flexShrink: 0 }}>W</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: '#00447B' }}>Wilson</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6C6D6F' }}>{t('cofounder')}</div>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: '#333', margin: 0 }}>
                {t('wilsonBio')}
              </p>
            </div>

            <div style={{ background: '#FFF8F2', borderRadius: 20, padding: '32px 28px', borderTop: '3px solid #FF8210' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FF8210', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: '#fff', flexShrink: 0 }}>F</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: '#FF8210' }}>Fatima</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6C6D6F' }}>{t('cofounder')}</div>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: '#333', margin: 0 }}>
                {t('fatimaBio')}
              </p>
            </div>
          </div>

          <div style={{ maxWidth: 720 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 24 }}>
              {t('storyP1')}
            </p>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 24 }}>
              {t('storyP2Pre')} <em>{t('storyP2Em')}</em> {t('storyP2Post')}
            </p>

            <div style={{
              borderLeft: '4px solid #FF8210', paddingLeft: 28,
              background: 'rgba(255,130,16,0.04)', borderRadius: '0 12px 12px 0', padding: '24px 28px',
              margin: '40px 0',
            }}>
              <p style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 19, lineHeight: 1.65, color: '#00447B', margin: 0, fontStyle: 'italic' }}>
                &ldquo;{t('storyQuote')}&rdquo;
              </p>
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 24 }}>
              {t('storyP3')}
            </p>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 0 }}>
              {t('storyP4')}
            </p>

            <div
              style={{
                marginTop: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: '1.05rem',
                  color: '#6C6D6F',
                  margin: 0,
                  fontFamily: 'Inter, Lato, sans-serif',
                  fontWeight: 400,
                }}
              >
                {t('blogCta')}
              </p>
              <a
                href="/blog"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#FF8210',
                  color: '#fff',
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease, transform 0.15s ease',
                }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#e6730e'
                  ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#FF8210'
                  ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
                }}
              >
                {t('blogCtaBtn')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section style={{ background: '#00447B', padding: '80px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 24 }}>🌍</div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(26px, 4vw, 38px)', color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>
            {t('missionH2')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.85, color: 'rgba(255,255,255,0.78)', margin: '0 auto', maxWidth: 620 }}>
            {t('missionBodyPre')} <strong style={{ color: '#FFBD59' }}>{t('missionBodyBold')}</strong>{t('missionBodyPost')}
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 24px', background: '#F4F7FB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase' }}>{t('featuresLabel')}</span>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 'clamp(26px, 4vw, 38px)', color: '#00447B', lineHeight: 1.3, margin: 0 }}>
              {t('featuresH2')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon, tKey }) => (
              <div
                key={tKey}
                style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1.5px solid rgba(0,68,123,0.08)', display: 'flex', gap: 18, alignItems: 'flex-start', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 8px 32px rgba(0,68,123,0.10)'; el.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,130,16,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16, color: '#00447B', marginBottom: 8, marginTop: 0 }}>
                    {t(`features.${tKey}.title` as Parameters<typeof t>[0])}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, color: '#6C6D6F', margin: 0 }}>
                    {t(`features.${tKey}.desc` as Parameters<typeof t>[0])}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PHOTO CAROUSEL */}
      <section style={{ padding: '100px 0 120px', background: '#fff', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase' }}>{t('carouselLabel')}</span>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 'clamp(26px, 4vw, 38px)', color: '#00447B', lineHeight: 1.3, margin: 0 }}>
              {t('carouselH2')}
            </h2>
          </div>

          <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto' }}>
            <div
              style={{
                position: 'relative', borderRadius: 24, overflow: 'hidden',
                aspectRatio: '3/4', background: '#111', cursor: 'grab',
                userSelect: 'none',
              }}
              onMouseDown={e => handleDragStart(e.clientX)}
              onMouseUp={e => handleDragEnd(e.clientX)}
              onMouseLeave={e => { if (isDragging) handleDragEnd(e.clientX) }}
              onTouchStart={e => handleDragStart(e.touches[0].clientX)}
              onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
            >
              {PHOTOS.map((photo, i) => (
                <img
                  key={photo.src}
                  src={photo.src}
                  alt={photo.caption}
                  onLoad={() => markLoaded(i)}
                  draggable={false}
                  style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'contain', objectPosition: 'center center',
                    opacity: i === activePhoto ? 1 : 0,
                    transition: 'opacity 0.6s ease',
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {!imgLoaded[activePhoto] && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(135deg, #00447B, #005FAD, #679AC1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
                    {t('loadingPhoto')}
                  </div>
                </div>
              )}

              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(to top, rgba(0,20,60,0.88) 0%, transparent 100%)',
                padding: '56px 32px 28px',
                pointerEvents: 'none',
              }}>
                <p style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 17, color: '#fff', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  {PHOTOS[activePhoto].caption}
                </p>
              </div>

              <button onClick={prev} aria-label={t('prevPhoto')} style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                color: '#fff', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              >‹</button>

              <button onClick={next} aria-label={t('nextPhoto')} style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                color: '#fff', fontSize: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.18)')}
              >›</button>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center', alignItems: 'center' }}>
              {PHOTOS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={t('photoN', { n: i + 1 })}
                  style={{
                    height: 8, width: i === activePhoto ? 32 : 8,
                    borderRadius: 100, border: 'none',
                    background: i === activePhoto ? '#FF8210' : 'rgba(0,68,123,0.20)',
                    cursor: 'pointer', padding: 0, flexShrink: 0,
                    transition: 'width 0.35s ease, background 0.35s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #FF8210 0%, #e6720e 100%)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(26px, 4vw, 36px)', color: '#fff', lineHeight: 1.3, marginBottom: 16 }}>
            {t('ctaH2')}
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 36, lineHeight: 1.7 }}>
            {t('ctaSubtitle')}
          </p>
          <Link href="/#planner" style={{
            display: 'inline-block', padding: '16px 40px',
            background: '#fff', color: '#FF8210',
            fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16,
            borderRadius: 100, textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.20)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)' }}
          >
            ✈ {t('ctaBtn')}
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </div>
  </>
  )
}
