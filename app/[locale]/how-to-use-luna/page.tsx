import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import {
  Calendar, Pencil, AlignJustify, Package,
  Compass, Info, Coffee, Globe,
} from 'lucide-react'

const BASE_URL = 'https://www.lunaletsgo.com'

export const metadata: Metadata = {
  title: "How to Use Luna | Luna Let's Go",
  description: "Learn how to use Luna, your AI travel assistant, to plan and refine your perfect trip.",
  alternates: { canonical: `${BASE_URL}/how-to-use-luna` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "How to Use Luna | Luna Let's Go",
    description: "Learn how to use Luna, your AI travel assistant, to plan and refine your perfect trip.",
    url: `${BASE_URL}/how-to-use-luna`,
    type: 'website',
  },
}

/* ── Shared style tokens ── */
const ORANGE   = '#FF8210'
const NAVY     = '#00447B'
const OL       = '#FFBD59'   // orange-light
const NAVY_MID = '#679AC1'
const BG       = '#FAFBFD'
const NAVY_SOFT= '#F0F5FA'
const OG_SOFT  = '#FFF7EE'
const GRAY     = '#4A4A5A'
const BORDER   = '#E8ECF0'
const HEAD     = 'var(--font-head)'
const BODY     = 'var(--font-body)'

/* ── Inline-style helpers ── */
const sectionLabelStyle: React.CSSProperties = {
  fontFamily: HEAD, fontSize: 12, fontWeight: 600,
  letterSpacing: 2, textTransform: 'uppercase', color: ORANGE, marginBottom: 8,
}
const h2Style: React.CSSProperties = {
  fontFamily: HEAD, fontWeight: 700, color: NAVY,
  fontSize: 'clamp(24px, 3.5vw, 32px)', lineHeight: 1.25, marginBottom: 16,
}
const bodyTextStyle: React.CSSProperties = {
  fontFamily: BODY, fontSize: 17, color: GRAY, marginBottom: 28, lineHeight: 1.7,
}
const cardStyle: React.CSSProperties = {
  background: '#fff', border: `1px solid ${BORDER}`,
  borderRadius: 16, padding: 32, marginBottom: 20,
}
const tipBoxStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${OG_SOFT} 0%, #FFF3E0 100%)`,
  borderLeft: `4px solid ${ORANGE}`,
  borderRadius: '0 10px 10px 0',
  padding: '20px 24px',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={sectionLabelStyle}>{children}</div>
}

function CardIcon({ color, children }: { color: 'navy' | 'orange'; children: React.ReactNode }) {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: color === 'navy' ? NAVY_SOFT : OG_SOFT,
      color: color === 'navy' ? NAVY : ORANGE,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 16, flexShrink: 0,
    }}>
      {children}
    </div>
  )
}

function TipBox({ title, body }: { title: string; body: string }) {
  return (
    <div style={tipBoxStyle}>
      <div style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 600, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
        {title}
      </div>
      <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, margin: 0, lineHeight: 1.7 }}>
        {body}
      </p>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, marginBottom: 14 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          fontFamily: BODY, fontSize: 15, color: GRAY,
          padding: '5px 0 5px 22px', position: 'relative', lineHeight: 1.6,
        }}>
          <span style={{
            position: 'absolute', left: 0, top: 13,
            width: 8, height: 8, background: ORANGE,
            borderRadius: '50%', opacity: 0.6, display: 'block',
          }} />
          {item}
        </li>
      ))}
    </ul>
  )
}

function ExamplePrompts({ prompts }: { prompts: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }} className="htul-prompts">
      {prompts.map((p, i) => (
        <span key={i} style={{
          display: 'inline-block',
          background: NAVY_SOFT, border: `1px solid #D4DEE8`,
          borderRadius: 8, padding: '8px 14px',
          fontFamily: BODY, fontSize: 14, fontWeight: 500,
          color: NAVY, lineHeight: 1.4,
        }}>
          &ldquo;{p}&rdquo;
        </span>
      ))}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px' }}>
      <div style={{ height: 1, background: 'linear-gradient(to right, transparent, #D4DEE8, transparent)', margin: '48px 0 0' }} />
    </div>
  )
}

export default async function HowToUseLunaPage() {
  const t = await getTranslations('howToUse')

  return (
    <main style={{ fontFamily: BODY, background: BG, color: '#1A1A2E', minHeight: '100vh' }}>
      <NavBar />

      {/* ── Hero ── */}
      <header style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #003366 60%, #002244 100%)`,
        color: '#fff', padding: '80px 24px 64px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -120, right: -80, width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(255,130,16,0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -40, width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(103,154,193,0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(255,130,16,0.2)',
            border: '1px solid rgba(255,130,16,0.35)', color: OL,
            fontFamily: HEAD, fontSize: 13, fontWeight: 600,
            letterSpacing: '1.5px', textTransform: 'uppercase',
            padding: '6px 18px', borderRadius: 100, marginBottom: 24,
          }}>
            {t('hero.badge')}
          </div>
          <h1 style={{
            fontFamily: HEAD, fontWeight: 700,
            fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.15,
            marginBottom: 16,
          }}>
            {t('hero.title')} <span style={{ color: ORANGE }}>{t('hero.titleHighlight')}</span>
          </h1>
          <p style={{ fontFamily: BODY, fontSize: 'clamp(16px, 2.2vw, 20px)', color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto' }}>
            {t('hero.subtitle')}
          </p>
        </div>
      </header>

      {/* ── Introduction ── */}
      <section style={{ padding: '56px 0 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px' }}>
          <SectionLabel>{t('intro.sectionLabel')}</SectionLabel>
          <h2 style={h2Style}>{t('intro.heading')}</h2>
          <p style={bodyTextStyle}>{t('intro.body')}</p>

          <div style={cardStyle}>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>
              {t('intro.cardHeading')}
            </h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>
              {t('intro.cardBody')}
            </p>
            <BulletList items={[
              t('intro.bullet1'), t('intro.bullet2'), t('intro.bullet3'),
              t('intro.bullet4'), t('intro.bullet5'), t('intro.bullet6'),
            ]} />
          </div>

          <div style={{ ...tipBoxStyle, margin: '28px 0' }}>
            <div style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 600, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              {t('intro.tipTitle')}
            </div>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, margin: 0, lineHeight: 1.7 }}>
              {t('intro.tipBody')}
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Feature cards ── */}
      <section style={{ padding: '56px 0 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px' }}>
          <SectionLabel>{t('featureCards.sectionLabel')}</SectionLabel>
          <h2 style={h2Style}>{t('featureCards.heading')}</h2>
          <p style={bodyTextStyle}>{t('featureCards.subheading')}</p>

          {/* Plan your trip */}
          <div style={cardStyle}>
            <CardIcon color="navy"><Calendar size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('planTrip.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('planTrip.body')}</p>
            <div style={{ ...tipBoxStyle, margin: '0 0 18px 0' }}>
              <div style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 600, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                {t('planTrip.tipTitle')}
              </div>
              <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, margin: 0, lineHeight: 1.7 }}>{t('planTrip.tipBody')}</p>
            </div>
            <BulletList items={[
              t('planTrip.bullet1'), t('planTrip.bullet2'), t('planTrip.bullet3'),
              t('planTrip.bullet4'), t('planTrip.bullet5'),
            ]} />
            <ExamplePrompts prompts={[t('planTrip.example1'), t('planTrip.example2'), t('planTrip.example3'), t('planTrip.example4')]} />
          </div>

          {/* Edit your itinerary */}
          <div style={cardStyle}>
            <CardIcon color="orange"><Pencil size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('editItinerary.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('editItinerary.body')}</p>
            <BulletList items={[
              t('editItinerary.bullet1'), t('editItinerary.bullet2'),
              t('editItinerary.bullet3'), t('editItinerary.bullet4'),
            ]} />
            <ExamplePrompts prompts={[t('editItinerary.example1'), t('editItinerary.example2'), t('editItinerary.example3'), t('editItinerary.example4')]} />
          </div>

          {/* Modify day structure */}
          <div style={cardStyle}>
            <CardIcon color="navy"><AlignJustify size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('dayStructure.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('dayStructure.body')}</p>
            <BulletList items={[t('dayStructure.bullet1'), t('dayStructure.bullet2'), t('dayStructure.bullet3')]} />
            <ExamplePrompts prompts={[t('dayStructure.example1'), t('dayStructure.example2'), t('dayStructure.example3')]} />
          </div>

          {/* Organise trip phases */}
          <div style={cardStyle}>
            <CardIcon color="orange"><Package size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('phases.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('phases.body')}</p>
            <BulletList items={[t('phases.bullet1'), t('phases.bullet2'), t('phases.bullet3'), t('phases.bullet4')]} />
            <ExamplePrompts prompts={[t('phases.example1'), t('phases.example2'), t('phases.example3')]} />
            <div style={{ ...tipBoxStyle, marginTop: 16 }}>
              <div style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 600, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
                {t('phases.tipTitle')}
              </div>
              <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, margin: 0, lineHeight: 1.7 }}>{t('phases.tipBody')}</p>
            </div>
          </div>

          {/* Explore more options */}
          <div style={cardStyle}>
            <CardIcon color="orange"><Compass size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('explore.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('explore.body')}</p>
            <BulletList items={[t('explore.bullet1'), t('explore.bullet2'), t('explore.bullet3')]} />
            <ExamplePrompts prompts={[t('explore.example1'), t('explore.example2'), t('explore.example3')]} />
          </div>

          {/* Learn more about activities */}
          <div style={cardStyle}>
            <CardIcon color="navy"><Info size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('learnMore.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('learnMore.body')}</p>
            <ExamplePrompts prompts={[t('learnMore.example1'), t('learnMore.example2'), t('learnMore.example3'), t('learnMore.example4')]} />
          </div>

          {/* Food and restaurant suggestions */}
          <div style={cardStyle}>
            <CardIcon color="orange"><Coffee size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('food.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('food.body')}</p>
            <BulletList items={[t('food.bullet1'), t('food.bullet2'), t('food.bullet3')]} />
            <ExamplePrompts prompts={[t('food.example1'), t('food.example2'), t('food.example3')]} />
          </div>

          {/* General travel help */}
          <div style={cardStyle}>
            <CardIcon color="navy"><Globe size={22} /></CardIcon>
            <h3 style={{ fontFamily: HEAD, fontSize: 19, fontWeight: 600, color: NAVY, marginBottom: 8, marginTop: 0 }}>{t('generalHelp.heading')}</h3>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, marginBottom: 14, lineHeight: 1.7 }}>{t('generalHelp.body')}</p>
            <ExamplePrompts prompts={[t('generalHelp.example1'), t('generalHelp.example2'), t('generalHelp.example3'), t('generalHelp.example4')]} />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── How to Talk to Luna ── */}
      <section style={{ padding: '56px 0 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px' }}>
          <SectionLabel>{t('communication.sectionLabel')}</SectionLabel>
          <h2 style={h2Style}>{t('communication.heading')}</h2>
          <p style={bodyTextStyle}>{t('communication.body')}</p>

          <div className="htul-steps">
            {([
              { num: '1', title: t('communication.step1Title'), body: t('communication.step1Body') },
              { num: '2', title: t('communication.step2Title'), body: t('communication.step2Body') },
              { num: '3', title: t('communication.step3Title'), body: t('communication.step3Body') },
            ]).map(step => (
              <div key={step.num} style={{
                background: '#fff', border: `1px solid ${BORDER}`,
                borderRadius: 10, padding: 24, textAlign: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: NAVY,
                  color: '#fff', fontFamily: HEAD, fontSize: 15, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12,
                }}>
                  {step.num}
                </div>
                <h4 style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 600, color: NAVY, marginBottom: 6, marginTop: 0 }}>{step.title}</h4>
                <p style={{ fontFamily: BODY, fontSize: 14, color: GRAY, margin: 0, lineHeight: 1.65 }}>{step.body}</p>
              </div>
            ))}
          </div>

          <div style={{ ...tipBoxStyle, marginTop: 28 }}>
            <div style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 600, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
              {t('communication.exampleTitle')}
            </div>
            <p style={{ fontFamily: BODY, fontSize: 15, color: GRAY, margin: 0, lineHeight: 1.8 }}>
              <strong style={{ color: NAVY }}>{t('communication.youLabel')}</strong> &ldquo;{t('communication.you1')}&rdquo;<br />
              <strong style={{ color: NAVY }}>{t('communication.lunaLabel')}</strong> &ldquo;{t('communication.luna1')}&rdquo;<br />
              <br />
              <strong style={{ color: NAVY }}>{t('communication.youLabel')}</strong> &ldquo;{t('communication.you2')}&rdquo;<br />
              <strong style={{ color: NAVY }}>{t('communication.lunaLabel')}</strong> &ldquo;{t('communication.luna2')}&rdquo;
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Tips for best results ── */}
      <section style={{ padding: '56px 0 0' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px' }}>
          <SectionLabel>{t('tips.sectionLabel')}</SectionLabel>
          <h2 style={h2Style}>{t('tips.heading')}</h2>
          <p style={bodyTextStyle}>{t('tips.body')}</p>

          <ol style={{ listStyle: 'none', padding: 0, counterReset: 'tips' }}>
            {([
              t('tips.tip1'), t('tips.tip2'), t('tips.tip3'),
              t('tips.tip4'), t('tips.tip5'), t('tips.tip6'),
            ]).map((tip, i) => (
              <li key={i} style={{
                display: 'flex', gap: 16, padding: '18px 0',
                borderBottom: i < 5 ? `1px solid #ECEEF1` : 'none',
                fontFamily: BODY, fontSize: 16, color: GRAY, alignItems: 'flex-start',
                lineHeight: 1.7,
              }}>
                <span style={{
                  width: 30, height: 30, minWidth: 30, borderRadius: '50%',
                  background: OG_SOFT, color: ORANGE,
                  fontFamily: HEAD, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Divider />

      {/* ── Footer CTA ── */}
      <footer style={{ textAlign: 'center', padding: '48px 24px 56px' }}>
        <p style={{ fontFamily: BODY, fontSize: 15, color: '#6C6D6F', lineHeight: 1.7 }}>
          {t('footerCta.body')}<br />
          <a
            href="https://www.lunaletsgo.com"
            style={{ color: ORANGE, textDecoration: 'none', fontWeight: 600 }}
          >
            {t('footerCta.linkLabel')}
          </a>
        </p>
      </footer>

      <style>{`
        @media (max-width: 600px) {
          .htul-prompts { flex-direction: column; }
          .htul-prompts span { display: block; }
        }
        .htul-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-top: 20px;
        }
      `}</style>
    </main>
  )
}
