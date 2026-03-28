'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const PHOTOS = [
  {
    src: '/about/photo-1.jpg',
    caption: 'Lost (on purpose) at Shibuya Crossing — Tokyo, Japan',
  },
  {
    src: '/about/photo-2.jpg',
    caption: 'The Sphere lit up at night — Las Vegas, Nevada',
  },
  {
    src: '/about/photo-3.jpg',
    caption: 'The iconic welcome sign — Las Vegas, Nevada',
  },
  {
    src: '/about/photo-4.jpg',
    caption: 'Foam party madness at Coco Bongo — Cancún, Mexico',
  },
  {
    src: '/about/photo-5.jpg',
    caption: 'Super Nintendo World — Universal Studios Japan',
  },
]

const STATS = [
  { value: '30s', label: 'To generate your full plan' },
  { value: '195', label: 'Countries we can plan for' },
  { value: '7',   label: 'Detailed plan sections' },
  { value: '∞',   label: 'Ways to make it yours' },
]

const FEATURES = [
  {
    icon: '⚡️',
    title: 'Full trip in 30 seconds',
    desc: 'Tell us where you are going and Luna crafts a complete, personalised plan almost instantly. No endless tabs, no generic guides.',
  },
  {
    icon: '🗓',
    title: 'Day-by-day itinerary',
    desc: 'Morning, afternoon and evening mapped out for every day, tailored to your travel style, pace and group.',
  },
  {
    icon: '🏨',
    title: 'Accommodation picks',
    desc: 'Curated hotel suggestions matched to your budget, from boutique guesthouses to luxury escapes.',
  },
  {
    icon: '💬',
    title: 'Refine with Luna',
    desc: 'Chat with Luna, your personal AI travel assistant. Swap an activity, get insider tips, ask anything. She is always here.',
  },
  {
    icon: '✅',
    title: 'Accept, decline and move',
    desc: 'Each suggestion is yours to keep or swap. Drag activities between days until the plan feels exactly right.',
  },
  {
    icon: '💾',
    title: 'Save and come back',
    desc: 'Your trip is saved in full. Log back in next week and pick up exactly where you left off.',
  },
]

export default function AboutPage() {
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
    <div style={{ fontFamily: 'var(--font-body)', color: '#000', background: '#fff', overflowX: 'hidden' }}>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #00447B 0%, #003566 60%, #001e3c 100%)',
        padding: '140px 24px 100px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 40, right: 40, width: 240, height: 240, borderRadius: '50%', border: '1px solid rgba(255,189,89,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 320, height: 320, borderRadius: '50%', border: '1px solid rgba(255,130,16,0.08)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,189,89,0.15)', border: '1px solid rgba(255,189,89,0.3)',
            borderRadius: 100, padding: '6px 20px', marginBottom: 28,
          }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FFBD59', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Our story
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 700,
            fontSize: 'clamp(36px, 6vw, 60px)',
            color: '#fff', lineHeight: 1.15, marginBottom: 24,
          }}>
            Built by travellers,<br />
            <span style={{ color: '#FFBD59' }}>for travellers.</span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.8,
            color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto',
          }}>
            Luna Let&apos;s Go started with a simple frustration and a shared dream — to make every trip as good as the one you imagined.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section style={{ background: '#FF8210' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 32px', display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          {STATS.map(({ value, label }, i) => (
            <div key={label} style={{
              flex: '1 1 140px', textAlign: 'center', padding: '28px 32px',
              borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none',
            }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 36, color: '#fff' }}>{value}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.80)', marginTop: 4 }}>{label}</div>
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
              How it started
            </span>
          </div>

          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 'clamp(28px, 4vw, 42px)', color: '#00447B', lineHeight: 1.3, marginBottom: 40 }}>
            A frustration turned into a mission.
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 52 }}>
            <div style={{ background: '#F4F7FB', borderRadius: 20, padding: '32px 28px', borderTop: '3px solid #00447B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#00447B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: '#fff', flexShrink: 0 }}>W</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: '#00447B' }}>Wilson</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6C6D6F' }}>Co-founder</div>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: '#333', margin: 0 }}>
                Always the one with twenty tabs open at once, trying to cross-reference blogs, old forum posts and outdated guides just to plan a single week away. There had to be a better way.
              </p>
            </div>

            <div style={{ background: '#FFF8F2', borderRadius: 20, padding: '32px 28px', borderTop: '3px solid #FF8210' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FF8210', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, color: '#fff', flexShrink: 0 }}>F</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, color: '#FF8210' }}>Fatima</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#6C6D6F' }}>Co-founder</div>
                </div>
              </div>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: '#333', margin: 0 }}>
                The adventurous spirit who would book the flight first and figure out the details later. Still, she would spend weeks hunting for the right excursions and hidden gems worth the detour.
              </p>
            </div>
          </div>

          <div style={{ maxWidth: 720 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 24 }}>
              We are Wilson and Fatima, a couple bound by one shared obsession: travel. We are the kind of people who, the moment one trip ends, are already dreaming about the next one. We have jumped on flights at short notice, navigated countries without speaking a word of the language, and chased sunrises in places we could barely point to on a map. From the chaos of Shibuya Crossing in Tokyo to foam parties in Cancún, from the neon glow of Las Vegas to the magic of Super Nintendo World in Japan — every trip has given us something we never could have planned for. And that is exactly the point.
            </p>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 24 }}>
              But the planning? That part never felt as exciting as the trip itself. We found ourselves spending hours — sometimes days — sifting through generic blog posts, tourist trap recommendations and conflicting reviews, trying to piece together an itinerary that actually matched who we are and what we genuinely wanted to do. We did not want the highlights reel that everyone gets. We wanted <em>our</em> kind of trip.
            </p>

            <div style={{
              borderLeft: '4px solid #FF8210', paddingLeft: 28,
              background: 'rgba(255,130,16,0.04)', borderRadius: '0 12px 12px 0', padding: '24px 28px',
              margin: '40px 0',
            }}>
              <p style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 19, lineHeight: 1.65, color: '#00447B', margin: 0, fontStyle: 'italic' }}>
                &ldquo;We did not want a generic itinerary. We wanted a plan shaped around us, our pace, our interests, the things that make travel feel alive.&rdquo;
              </p>
            </div>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 24 }}>
              That is exactly what Luna Let&apos;s Go was born to solve. We built a platform that truly listens to you — your travel style, your group, your budget, your passions — and builds a genuinely personalised trip in seconds. Not a template. Not a copy and paste. A plan made for you.
            </p>

            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.9, color: '#333', marginBottom: 0 }}>
              Yes, the plans are AI-generated, and we are proud of it. But everything we built around that intelligence — the personalisation engine, the refinement tools, Luna the travel assistant — was crafted with real intention and care. We are always improving it, always listening, always asking how we can make this feel even more like yours. Our goal has never changed. We want to give every traveller the chance to have the trip of their life.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section style={{ background: '#00447B', padding: '80px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 24 }}>🌍</div>
          <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(26px, 4vw, 38px)', color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>
            Our mission is simple.
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.85, color: 'rgba(255,255,255,0.78)', margin: '0 auto', maxWidth: 620 }}>
            Give every person planning a trip the opportunity to have the <strong style={{ color: '#FFBD59' }}>best planner in the world</strong> — one shaped completely around their personal desires, travel style, and idea of a perfect trip. No compromises, no regrets.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 24px', background: '#F4F7FB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase' }}>What Luna does</span>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 'clamp(26px, 4vw, 38px)', color: '#00447B', lineHeight: 1.3, margin: 0 }}>
              Everything you need, nothing you don&apos;t.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', border: '1.5px solid rgba(0,68,123,0.08)', display: 'flex', gap: 18, alignItems: 'flex-start', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 8px 32px rgba(0,68,123,0.10)'; el.style.transform = 'translateY(-3px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,130,16,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {icon}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16, color: '#00447B', marginBottom: 8, marginTop: 0 }}>{title}</h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.65, color: '#6C6D6F', margin: 0 }}>{desc}</p>
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
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase' }}>Our adventures</span>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 'clamp(26px, 4vw, 38px)', color: '#00447B', lineHeight: 1.3, margin: 0 }}>
              The trips that inspired all of this.
            </h2>
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative', borderRadius: 24, overflow: 'hidden',
                aspectRatio: '16/9', background: '#EEF3F9', cursor: 'grab',
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
                    objectFit: 'cover', objectPosition: 'center top',
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
                    Loading photo...
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

              <button onClick={prev} aria-label="Previous photo" style={{
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

              <button onClick={next} aria-label="Next photo" style={{
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
                  aria-label={`Photo ${i + 1}`}
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
            Ready to plan your next adventure?
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'rgba(255,255,255,0.85)', marginBottom: 36, lineHeight: 1.7 }}>
            Join thousands of travellers who let Luna craft their perfect trip in 30 seconds flat.
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
            ✈ Plan my trip now
          </Link>
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }
      `}</style>
    </div>
  )
}
