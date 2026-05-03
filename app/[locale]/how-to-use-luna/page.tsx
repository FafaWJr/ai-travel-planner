import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import NavBar from '@/components/NavBar'
import { Calendar, Pencil, LayoutList, Layers, Compass, BookOpen, Utensils, Globe, CheckCircle } from 'lucide-react'

const BASE_URL = 'https://www.lunaletsgo.com'

export const metadata: Metadata = {
  title: "How to Use Luna | Luna Let's Go",
  description: 'Learn how to use Luna, your AI travel assistant, to plan and refine your perfect trip.',
  alternates: { canonical: `${BASE_URL}/how-to-use-luna` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "How to Use Luna | Luna Let's Go",
    description: 'Learn how to use Luna, your AI travel assistant, to plan and refine your perfect trip.',
    url: `${BASE_URL}/how-to-use-luna`,
    type: 'website',
  },
}

const FEATURE_CARDS = [
  { key: 'planTrip',       Icon: Calendar    },
  { key: 'editItinerary',  Icon: Pencil      },
  { key: 'dayStructure',   Icon: LayoutList  },
  { key: 'phases',         Icon: Layers      },
  { key: 'explore',        Icon: Compass     },
  { key: 'learnMore',      Icon: BookOpen    },
  { key: 'food',           Icon: Utensils    },
  { key: 'generalHelp',    Icon: Globe       },
] as const

const COMM_TIPS = ['tip1', 'tip2', 'tip3', 'tip4'] as const
const RESULT_TIPS = ['tip1', 'tip2', 'tip3', 'tip4', 'tip5', 'tip6'] as const

export default async function HowToUseLunaPage() {
  const t = await getTranslations('howToUse')

  return (
    <main style={{ fontFamily: 'var(--font-body)', background: '#fff', color: '#1a1a2e', minHeight: '100vh' }}>
      <NavBar />

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(135deg, #00447B 0%, #002f56 60%, #001e3c 100%)',
        padding: '120px 24px 80px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,189,89,0.15)', border: '1px solid rgba(255,189,89,0.3)',
            borderRadius: 100, padding: '6px 20px', marginBottom: 28,
          }}>
            <span style={{
              fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12,
              color: '#FFBD59', letterSpacing: 1.5, textTransform: 'uppercase',
            }}>
              {t('hero.badge')}
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-head)', fontWeight: 700,
            fontSize: 'clamp(34px, 6vw, 58px)',
            color: '#fff', lineHeight: 1.15, marginBottom: 20,
          }}>
            {t('hero.title')}{' '}
            <span style={{ color: '#FFBD59' }}>{t('hero.titleHighlight')}</span>
          </h1>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto',
          }}>
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* ── Meet Luna intro ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 3, background: '#FF8210', borderRadius: 2 }} />
            <span style={{
              fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12,
              color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase',
            }}>
              {t('intro.sectionLabel')}
            </span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-head)', fontWeight: 600,
            fontSize: 'clamp(26px, 4vw, 38px)',
            color: '#00447B', lineHeight: 1.3, marginBottom: 20,
          }}>
            {t('intro.heading')}
          </h2>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.85,
            color: '#444', marginBottom: 36, maxWidth: 720,
          }}>
            {t('intro.body')}
          </p>

          {/* What Luna can do card */}
          <div style={{
            background: '#F4F7FB',
            borderRadius: 20,
            padding: '36px 40px',
            borderLeft: '4px solid #00447B',
            marginBottom: 36,
          }}>
            <h3 style={{
              fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 18,
              color: '#00447B', marginBottom: 12, marginTop: 0,
            }}>
              {t('intro.cardHeading')}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75, color: '#444', marginBottom: 20 }}>
              {t('intro.cardBody')}
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['bullet1','bullet2','bullet3','bullet4','bullet5','bullet6'] as const).map(key => (
                <li key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle size={16} color="#FF8210" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.6, color: '#333' }}>
                    {t(`intro.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tip box */}
          <div style={{
            background: 'rgba(255,130,16,0.06)',
            border: '1px solid rgba(255,130,16,0.25)',
            borderRadius: 14,
            padding: '20px 24px',
            display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: '#FF8210', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: '#fff' }}>i</span>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 14, color: '#FF8210', margin: '0 0 4px' }}>
                {t('intro.tipTitle')}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7, color: '#555', margin: 0 }}>
                {t('intro.tipBody')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section style={{ padding: '80px 24px', background: '#F4F7FB' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
              <span style={{
                fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12,
                color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase',
              }}>
                {t('featureCards.sectionLabel')}
              </span>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontWeight: 600,
              fontSize: 'clamp(24px, 4vw, 36px)',
              color: '#00447B', lineHeight: 1.3, margin: 0,
            }}>
              {t('featureCards.heading')}
            </h2>
          </div>

          <div className="htul-grid">
            {FEATURE_CARDS.map(({ key, Icon }) => (
              <div
                key={key}
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: '28px 28px 24px',
                  border: '1.5px solid rgba(0,68,123,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {/* Icon + heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(255,130,16,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={20} color="#FF8210" />
                  </div>
                  <h3 style={{
                    fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16,
                    color: '#00447B', margin: 0,
                  }}>
                    {t(`${key}.heading` as Parameters<typeof t>[0])}
                  </h3>
                </div>

                {/* Body */}
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.7,
                  color: '#555', margin: '0 0 18px',
                }}>
                  {t(`${key}.body` as Parameters<typeof t>[0])}
                </p>

                {/* Example prompts */}
                <div style={{ marginTop: 'auto' }}>
                  <p style={{
                    fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11,
                    color: '#679AC1', textTransform: 'uppercase', letterSpacing: 1,
                    margin: '0 0 10px',
                  }}>
                    {t('featureCards.exampleLabel')}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {(['example1', 'example2', 'example3'] as const).map(ex => (
                      <div
                        key={ex}
                        style={{
                          background: '#F4F7FB',
                          border: '1px solid rgba(0,68,123,0.10)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontFamily: 'var(--font-body)',
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: '#333',
                          fontStyle: 'italic',
                        }}
                      >
                        &ldquo;{t(`${key}.${ex}` as Parameters<typeof t>[0])}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to Talk to Luna ── */}
      <section style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
              <span style={{
                fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12,
                color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase',
              }}>
                {t('communication.sectionLabel')}
              </span>
              <div style={{ width: 32, height: 3, background: '#FF8210', borderRadius: 2 }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontWeight: 600,
              fontSize: 'clamp(24px, 4vw, 36px)',
              color: '#00447B', lineHeight: 1.3, margin: 0,
            }}>
              {t('communication.heading')}
            </h2>
          </div>

          <div className="htul-comm-grid">
            {COMM_TIPS.map(tip => (
              <div
                key={tip}
                style={{
                  background: '#F4F7FB',
                  borderRadius: 16,
                  padding: '28px 28px',
                  borderTop: '3px solid #FF8210',
                }}
              >
                <h3 style={{
                  fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 16,
                  color: '#00447B', marginTop: 0, marginBottom: 10,
                }}>
                  {t(`communication.${tip}Title` as Parameters<typeof t>[0])}
                </h3>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: 1.75,
                  color: '#555', margin: 0,
                }}>
                  {t(`communication.${tip}Body` as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tips for best results ── */}
      <section style={{ padding: '80px 24px', background: '#00447B' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 32, height: 3, background: '#FFBD59', borderRadius: 2 }} />
              <span style={{
                fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 12,
                color: '#FFBD59', letterSpacing: 2, textTransform: 'uppercase',
              }}>
                {t('tips.sectionLabel')}
              </span>
              <div style={{ width: 32, height: 3, background: '#FFBD59', borderRadius: 2 }} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-head)', fontWeight: 600,
              fontSize: 'clamp(24px, 4vw, 36px)',
              color: '#fff', lineHeight: 1.3, margin: 0,
            }}>
              {t('tips.heading')}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {RESULT_TIPS.map((tip, i) => (
              <div
                key={tip}
                style={{
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.07)',
                  borderRadius: 14,
                  padding: '20px 24px',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: '#FF8210',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, color: '#fff',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.75,
                  color: 'rgba(255,255,255,0.85)', margin: 0,
                }}>
                  {t(`tips.${tip}` as Parameters<typeof t>[0])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #FF8210 0%, #e6720e 100%)',
        padding: '72px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 18, lineHeight: 1.75,
            color: 'rgba(255,255,255,0.92)', marginBottom: 32,
          }}>
            {t('footerCta.body')}
          </p>
          <a
            href="/start"
            style={{
              display: 'inline-block',
              padding: '16px 40px',
              background: '#fff',
              color: '#FF8210',
              fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16,
              borderRadius: 100, textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            {t('footerCta.button')}
          </a>
        </div>
      </section>

      <style>{`
        .htul-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .htul-comm-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 900px) {
          .htul-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .htul-grid { grid-template-columns: 1fr !important; }
          .htul-comm-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
