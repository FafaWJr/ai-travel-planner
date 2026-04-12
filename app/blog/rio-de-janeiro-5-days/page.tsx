import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import BlogBreadcrumbs from '@/components/BlogBreadcrumbs';
import CommentsSection from '@/components/blog/CommentsSection';

export const metadata: Metadata = {
  title: "5 Days in Rio de Janeiro: Samba, Beaches & Iconic Views | Luna Let's Go Blog",
  description:
    'From Sugarloaf to the Selaron Steps, 5 unforgettable days in Rio de Janeiro. Beaches, samba, Cristo Redentor, a Funk party and the best sandwich in the city.',
  openGraph: {
    title: '5 Days in Rio de Janeiro: Samba, Beaches & Iconic Views',
    description:
      'Our full 5-day Rio de Janeiro travel story, with photos, food tips and affiliate hotel links.',
    type: 'article',
    url: 'https://www.lunaletsgo.com/blog/rio-de-janeiro-5-days',
  },
};

/* ─── Shared design tokens ────────────────────────────────────── */
const ORANGE = '#FF8210';
const NAVY   = '#00447B';
const GRAY   = '#6C6D6F';

/* ─── Affiliate links ─────────────────────────────────────────── */
const BOOKING_AFFILIATE =
  'https://awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding';
const KLOOK_AFFILIATE =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F';
const GOWITHGUIDE_AFFILIATE = 'https://tidd.ly/4s8kRkI';

/* ─── Tip icon ────────────────────────────────────────────────── */
function TipIcon() {
  return (
    <div style={{ width: 20, height: 20, background: ORANGE, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M5.5 1v4M5.5 8v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

/* ─── Day badge ───────────────────────────────────────────────── */
function DayBadge({ label }: { label: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `rgba(255,130,16,0.12)`, borderRadius: 20, padding: '5px 16px', marginBottom: 12 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
      <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 12, color: ORANGE, letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

/* ─── Section heading ─────────────────────────────────────────── */
function SectionH2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
      <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
      {children}
    </h2>
  );
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: '5 Days in Rio de Janeiro: Samba, Beaches & Iconic Views',
  description:
    'From Sugarloaf to the Selaron Steps, 5 unforgettable days in Rio de Janeiro.',
  author: {
    '@type': 'Person',
    name: 'Wilson & Fatima',
    url: 'https://www.lunaletsgo.com/about',
  },
  publisher: {
    '@type': 'Organization',
    name: "Luna Let's Go",
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.lunaletsgo.com/LUNA-LOGO.svg',
    },
  },
  datePublished: '2026-04-12',
  dateModified: '2026-04-12',
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://www.lunaletsgo.com/blog/rio-de-janeiro-5-days',
  },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How many days do you need in Rio de Janeiro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '5 days is a great starting point for Rio. It gives you time for the main landmarks (Sugarloaf, Christ the Redeemer), at least two beach days, a samba night in Lapa, and time to explore neighbourhoods like Botafogo and Ipanema at a relaxed pace.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best area to stay in Rio de Janeiro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The stretch between Copacabana and Ipanema is ideal. Staying on Francisco Otaviano or nearby streets puts you within walking distance of both beaches and gives easy access to Lapa, Botafogo and the main sightseeing spots by Uber.',
      },
    },
    {
      '@type': 'Question',
      name: 'What airport do you fly into for Rio de Janeiro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'There are two airports: Santos Dumont (SDU) in the city centre, closest to Copacabana and Ipanema, and Galeao International (GIG), which is further out. Santos Dumont is ideal for domestic flights.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is biscoito globo and mate tea?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Biscoito Globo is a light, airy ring-shaped biscuit sold by vendors on Rio beaches. Mate tea is iced herbal tea served in plastic cups, also sold on the sand. Together they are the definitive Rio beach snack combo.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a Roda de Samba and where is the best one in Rio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Roda de Samba is a traditional Brazilian samba circle where musicians play live in an informal setting. Lapa is the neighbourhood to go to, and Fundi\u00e7\u00e3o Progresso is one of the best venues.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Rio de Janeiro safe for tourists?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Rio rewards awareness. Stick to tourist areas, use Uber rather than hailing random taxis, avoid displaying expensive items in unfamiliar streets, and you will have a wonderful time.',
      },
    },
  ],
};

export default function RioBlogPost() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <NavBar />

      <main style={{ paddingTop: 68, minHeight: '100vh', background: '#F7F8FA', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '2.5rem' }}>
            <BlogBreadcrumbs postTitle="5 Days in Rio de Janeiro" postSlug="rio-de-janeiro-5-days" />
          </div>

          {/* ── Article header ── */}
          <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-block', background: `rgba(255,130,16,0.12)`, color: ORANGE, fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20 }}>
                Rio de Janeiro · Brazil · Travel Story
              </span>
            </div>

            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: NAVY, lineHeight: 1.2, marginBottom: '1rem', maxWidth: 780 }}>
              5 Days in Rio de Janeiro: Samba, Beaches and Iconic Views
            </h1>

            <p style={{ fontSize: '1.15rem', color: GRAY, lineHeight: 1.65, maxWidth: 680, marginBottom: '1.5rem', fontStyle: 'italic' }}>
              From Sugarloaf at sunset to a surprise Funk party after a full day of landmarks, Rio never let us catch our breath.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  WF
                </div>
                <div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY }}>Wilson &amp; Fatima</div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}>22 Jan 2026 to 26 Jan 2026</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>5 days</strong> · Copacabana + Ipanema</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>12 min</strong> read</div>
            </div>
          </header>

          {/* ── Hero photo ── */}
          <div className="blog-hero-img" style={{ position: 'relative', width: '100%', height: 420, borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
            <Image
              src="/blog/rio-de-janeiro-5-days/Hero.jpeg"
              alt="Rio de Janeiro skyline with Sugarloaf and beaches"
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 1100px"
            />
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '3rem' }}>
            Rio de Janeiro, Brazil — Wilson &amp; Fatima, January 2026
          </p>

          {/* ── Article body: 2-column grid ── */}
          <div className="blog-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }}>

            {/* ── Main content column ── */}
            <article>

              {/* Intro callout */}
              <div style={{ background: 'rgba(103,154,193,0.12)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 14px 14px 0', padding: '1.5rem 1.75rem', marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#2a2a3e', margin: 0 }}>
                  Rio had been on our radar for a while, but this trip carried an extra layer of magic: it was Fatima&apos;s very first time in the city. Five days, two beaches, one legendary samba night, one surprise Funk party and more caipirinhas than we can count. Here is the full story.
                </p>
              </div>

              {/* Summary box */}
              <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #005fa3 60%, #0077b6 100%)`, borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#FFBD59', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  What&apos;s in this post
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Roda de Samba in Lapa (Day 1)',
                    'Botafogo and Garota de Ipanema (Day 2)',
                    'Sugarloaf + Cristo Redentor + Selaron Steps (Day 3)',
                    'Ipanema beach and the Cervantes sandwich (Day 4)',
                    'Last mate tea on the beach (Day 5)',
                    'Booking tips and affiliate hotel deals',
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFBD59', marginTop: 7, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ── DAY 1 ── */}
              <DayBadge label="Day 1 - January 22" />
              <SectionH2>Scooters Along Copacabana, Caipirinhas at Ipanema and Samba in Lapa</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We arrived at Santos Dumont airport and were in our apartment on Francisco Otaviano — a quiet street sitting between Copacabana and Ipanema — by mid-afternoon. The location was close to perfect. The beach was a two-minute walk in either direction.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We rented electric scooters and rode the full length of Copacabana. Stopped outside the Copacabana Palace just to take it in. Had caipirinhas at a bar on Ipanema. That evening we headed to Lapa for the samba.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Day1-Scooter%20Copacabana%20Palace.jpeg"
                  alt="Scooter ride along Copacabana, Copacabana Palace hotel in background"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Electric scooter along Copacabana — the Copacabana Palace on the left
              </p>

              {/* WHOOSH tip */}
              <div style={{ background: 'rgba(255,189,89,0.15)', border: `1.5px solid rgba(255,130,16,0.3)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '2rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TipIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: ORANGE }}>Scooter Tip</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: 0, lineHeight: 1.6 }}>
                  Electric scooter rentals are available all along Copacabana beachfront. Download the WHOOSH app before you arrive. Prices are low, the ride is flat, and the Atlantic wind is free.
                </p>
              </div>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Roda%20de%20Samba.jpeg"
                  alt="Roda de Samba at Fundicao Progresso in Lapa, Rio de Janeiro"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Roda de Samba at Fundi&ccedil;&atilde;o Progresso, Lapa
              </p>

              {/* Booking affiliate box */}
              <div style={{ border: `2px solid ${ORANGE}`, borderRadius: 14, padding: '1.4rem', margin: '2rem 0' }}>
                <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: NAVY, marginBottom: '0.6rem' }}>Find Your Rio Hotel</h4>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: GRAY, lineHeight: 1.6, marginBottom: '1rem' }}>
                  Stay between Copacabana and Ipanema for the best access to beaches, Lapa and the main sights.
                </p>
                <a href={BOOKING_AFFILIATE} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none' }}>
                  Browse Rio Hotels on Booking.com
                </a>
              </div>

              {/* ── DAY 2 ── */}
              <DayBadge label="Day 2 - January 23" />
              <SectionH2>Botafogo, Flamengo and Dinner at the Legendary Garota de Ipanema</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Day two was slower. We walked through Botafogo and along the Flamengo waterfront, stopping for coffee and people-watching. The views of Sugarloaf from Botafogo beach are some of the best in the city — no cable car required.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                That evening we had dinner at Garota de Ipanema — the restaurant named after the famous bossa nova song, not the inspiration for it. The food was good, the atmosphere was warm, and the street outside was exactly as charming as it sounds.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/CopacanaBeach.jpeg"
                  alt="Copacabana beach, Rio de Janeiro"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Copacabana beach — the view never gets old
              </p>

              {/* ── DAY 3 ── */}
              <DayBadge label="Day 3 - January 24" />
              <SectionH2>The Big Day: Sugarloaf, Cristo Redentor, Sambodromo, Maracana, Cathedral and Selaron Steps</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Day three was a full itinerary. We started early with the Sugarloaf cable car — getting up in the morning before the tour groups arrive makes a real difference. The views from the top, with the city laid out below and the Atlantic stretching to the horizon, are everything you expect and more.
              </p>

              {/* Three-column image grid */}
              <div className="blog-photo-trio" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/rio-de-janeiro-5-days/Day3-Bondinho%20Pao%20de%20Acucar.jpeg', alt: 'Cable car (Bondinho) ascending Sugarloaf, Rio de Janeiro' },
                  { src: '/blog/rio-de-janeiro-5-days/Day3-BondinhoP-PaodeAcucar.jpeg', alt: 'Selfie on the Bondinho cable car, Pao de Acucar' },
                  { src: '/blog/rio-de-janeiro-5-days/Day3-At-Pao%20de%20Acucar.jpeg', alt: 'At the top of Sugarloaf, panoramic view of Rio' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="220px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                The Bondinho cable car up Sugarloaf — and the view that waits at the top
              </p>

              {/* Klook affiliate box */}
              <div style={{ border: `2px solid ${ORANGE}`, borderRadius: 14, padding: '1.4rem', margin: '2rem 0' }}>
                <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: NAVY, marginBottom: '0.6rem' }}>Book Sugarloaf &amp; Rio Activities</h4>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: GRAY, lineHeight: 1.6, marginBottom: '1rem' }}>
                  Skip-the-queue cable car tickets, Cristo Redentor tours and city experiences all in one place.
                </p>
                <a href={KLOOK_AFFILIATE} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none' }}>
                  Explore on Klook
                </a>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                From Sugarloaf we took an Uber up to Cristo Redentor. The statue is bigger than it looks in photos. Standing beneath it with the city and bay spread out below is genuinely moving.
              </p>

              <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '28px auto 8px' }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Cristo%20Redentor.jpeg"
                  alt="Cristo Redentor (Christ the Redeemer), Rio de Janeiro"
                  width={960}
                  height={1280}
                  style={{ width: '100%', height: 'auto', borderRadius: 14, display: 'block' }}
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Cristo Redentor — bigger than any photo prepares you for
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Sugar%20Loaf.jpeg"
                  alt="Sugarloaf mountain from below, Rio de Janeiro"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Sugarloaf (P&atilde;o de A&ccedil;&uacute;car) — the symbol of Rio
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We continued through the afternoon: the Sambadrome (Sambodromo), the outside of Maracana, and then the Metropolitan Cathedral — an extraordinary brutalist cone of stained glass that catches the light in ways no photograph quite captures.
              </p>

              <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '28px auto 8px' }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Cathedral%20do%20Rio.jpeg"
                  alt="Metropolitan Cathedral of Rio de Janeiro interior, stained glass cone"
                  width={960}
                  height={1280}
                  style={{ width: '100%', height: 'auto', borderRadius: 14, display: 'block' }}
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Metropolitan Cathedral of Rio de Janeiro — the stained glass from inside
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We finished in Lapa with the Selaron Steps. Jorge Selaron&apos;s life work, made from tiles collected from over 60 countries, is impossible not to stop and stare at. Do not rush this one.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Day3-Selaron%20Steps.jpeg"
                  alt="Selaron Steps (Escadaria Selaron) in Lapa, Rio de Janeiro"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                The Selaron Steps in Lapa — tiled over decades, from 60 countries
              </p>

              {/* GoWithGuide affiliate box */}
              <div style={{ border: `2px solid ${ORANGE}`, borderRadius: 14, padding: '1.4rem', margin: '2rem 0' }}>
                <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: NAVY, marginBottom: '0.6rem' }}>Local Guided Tours in Rio</h4>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: GRAY, lineHeight: 1.6, marginBottom: '1rem' }}>
                  Private local guides for Cristo Redentor, Lapa, Favela tours and more. GoWithGuide connects you with vetted local experts.
                </p>
                <a href={GOWITHGUIDE_AFFILIATE} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none' }}>
                  Browse Guides on GoWithGuide
                </a>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Somehow, after Sugarloaf, Cristo Redentor, the Cathedral, Maracana, the Sambodromo and the Selaron Steps, we still had energy left. We ended the night at a Funk party, dancing, drinking and going until 4am. Rio does not let you stop, and honestly, we did not want it to.
              </p>

              {/* ── DAY 4 ── */}
              <DayBadge label="Day 4 - January 25" />
              <SectionH2>Finally: Ipanema Beach, Arpoador, Beija-Flor Rehearsal and the Cervantes Sandwich</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                After three days of relentless sightseeing, day four was the beach day. A proper one. We walked to Ipanema, picked a spot, and did nothing more complicated than watch the city come to us.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Vendors walk the sand constantly. The combination to order is mate tea — iced, in a plastic cup — and Biscoito Globo, the light ring-shaped biscuits that are a Rio institution. There is no better beach snack on earth.
              </p>

              {/* Two-column image grid */}
              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '2rem 0' }}>
                {[
                  { src: '/blog/rio-de-janeiro-5-days/Mate%20e%20Biscoito%20Globo%20na%20Praia.jpeg', alt: 'Mate tea and Biscoito Globo being served on Ipanema beach' },
                  { src: '/blog/rio-de-janeiro-5-days/Mate%20e%20Biscoito%20Globo.jpeg', alt: 'Mate tea and Biscoito Globo on a beach towel, Rio de Janeiro' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="330px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Mate tea and Biscoito Globo — the definitive Rio beach snack combo
              </p>

              <div style={{ position: 'relative', width: '100%', maxWidth: 480, margin: '28px auto 8px' }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Day5-ArpoadorBeach.jpeg"
                  alt="Arpoador beach and rock, Rio de Janeiro"
                  width={960}
                  height={1280}
                  style={{ width: '100%', height: 'auto', borderRadius: 14, display: 'block' }}
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Arpoador — the rock between Ipanema and Copacabana
              </p>

              {/* Cervantes tip */}
              <div style={{ background: 'rgba(255,189,89,0.15)', border: `1.5px solid rgba(255,130,16,0.3)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '2rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TipIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: ORANGE }}>Do Not Skip Cervantes</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: 0, lineHeight: 1.6 }}>
                  Cervantes is a late-night sandwich bar on Prado Junior in Copacabana, open until 4am. Order the pork with pineapple. It is one of the best things you will eat in Rio, and it costs almost nothing. Go after Lapa, go after a beach day, go whenever. Just go.
                </p>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                That evening we went to a Beija-Flor samba school rehearsal — a weekly event open to the public in Nilópolis. Worth every minute of the commute. Then back to Copacabana and Cervantes for the sandwich.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/rio-de-janeiro-5-days/Cervantes.jpeg"
                  alt="Cervantes pork and pineapple sandwich, Copacabana, Rio de Janeiro"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                The Cervantes pork and pineapple sandwich — order two
              </p>

              {/* ── DAY 5 ── */}
              <DayBadge label="Day 5 - January 26" />
              <SectionH2>One Last Mate Tea on the Beach and Goodbye Rio</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Last mornings in cities you love always have the same quality. We went back to the beach. One last mate tea from the vendor who walks the sand in the mornings. One last Biscoito Globo. We sat and watched Rio doing what Rio does, completely indifferent to time.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '2.5rem' }}>
                Five days is not enough for Rio. It is barely an introduction. But it is a very good one.
              </p>

              {/* Highlights grid */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.75rem 2rem', border: `1.5px solid rgba(0,68,123,0.1)`, margin: '2.5rem 0' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', color: NAVY, marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Trip Highlights
                </h3>
                <div className="highlights-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem 2rem' }}>
                  {[
                    'Roda de Samba at Fundi\u00e7\u00e3o Progresso',
                    'Cable car up Sugarloaf',
                    'Cristo Redentor',
                    'Caipirinhas at Belmonte Ipanema',
                    'Selaron Steps in Lapa',
                    'Metropolitan Cathedral interior',
                    'Ipanema beach on a sunny Saturday',
                    'Beija-Flor rehearsal',
                    'Pork sandwich at Cervantes',
                    'Funk party after a full day of landmarks',
                  ].map((item) => (
                    <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.9rem', color: '#2a2a3e', lineHeight: 1.5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: ORANGE, marginTop: 5, flexShrink: 0 }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Related post */}
              <div style={{ margin: '2.5rem 0' }}>
                <div style={{ fontSize: 11, fontFamily: "'Poppins', sans-serif", fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: GRAY, marginBottom: 12 }}>
                  Also on the Blog
                </div>
                <Link href="/blog/fiji-oct-2024" style={{ display: 'flex', borderRadius: 14, overflow: 'hidden', border: `1.5px solid rgba(0,68,123,0.1)`, textDecoration: 'none', background: '#fff' }}>
                  <div style={{ width: 120, background: NAVY, flexShrink: 0, minHeight: 100, position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 12, color: '#FFBD59', textAlign: 'center', lineHeight: 1.4 }}>Fiji Islands</span>
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px', flex: 1 }}>
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 6 }}>
                      The Fiji Islands: Our Complete Guide
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, lineHeight: 1.6, margin: 0 }}>
                      Bures on the beach, snorkelling in the coral, kava ceremonies and everything we loved about the South Pacific.
                    </p>
                  </div>
                </Link>
              </div>

              {/* Luna CTA */}
              <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0077b6 100%)`, borderRadius: 16, padding: '2.25rem 2rem', margin: '2.5rem 0', textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.25rem', color: '#fff', marginBottom: '0.6rem' }}>
                  Planning a Trip to Rio?
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, marginBottom: '1.25rem', maxWidth: 480, margin: '0 auto 1.25rem' }}>
                  Luna builds your personalised Rio itinerary in seconds. Day by day, budget-aware, and fully editable. No compromises, no regrets.
                </p>
                <Link href="/plan" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, padding: '12px 30px', borderRadius: 10, textDecoration: 'none' }}>
                  Plan My Rio Trip with Luna
                </Link>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10, marginBottom: 0 }}>Free. No credit card required.</p>
              </div>

              {/* FAQ */}
              <section style={{ margin: '3rem 0 2rem' }}>
                <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '0 0 1.5rem', position: 'relative', paddingLeft: '1.1rem' }}>
                  <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                  Frequently Asked Questions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { q: 'How many days do you need in Rio de Janeiro?', a: '5 days is a great starting point for Rio. It gives you time for the main landmarks (Sugarloaf, Christ the Redeemer), at least two beach days, a samba night in Lapa, and time to explore neighbourhoods like Botafogo and Ipanema at a relaxed pace.' },
                    { q: 'What is the best area to stay in Rio de Janeiro?', a: 'The stretch between Copacabana and Ipanema is ideal. Staying on Francisco Otaviano or nearby streets puts you within walking distance of both beaches and gives easy access to Lapa, Botafogo and the main sightseeing spots by Uber.' },
                    { q: 'What airport do you fly into for Rio de Janeiro?', a: 'There are two airports: Santos Dumont (SDU) in the city centre, closest to Copacabana and Ipanema, and Galeao International (GIG), which is further out. Santos Dumont is ideal for domestic flights.' },
                    { q: 'What is biscoito globo and mate tea?', a: 'Biscoito Globo is a light, airy ring-shaped biscuit sold by vendors on Rio beaches. Mate tea is iced herbal tea served in plastic cups, also sold on the sand. Together they are the definitive Rio beach snack combo.' },
                    { q: 'What is a Roda de Samba and where is the best one in Rio?', a: 'A Roda de Samba is a traditional Brazilian samba circle where musicians play live in an informal setting. Lapa is the neighbourhood to go to, and Fundi\u00e7\u00e3o Progresso is one of the best venues.' },
                    { q: 'Is Rio de Janeiro safe for tourists?', a: 'Rio rewards awareness. Stick to tourist areas, use Uber rather than hailing random taxis, avoid displaying expensive items in unfamiliar streets, and you will have a wonderful time.' },
                  ].map(({ q, a }) => (
                    <details key={q} style={{ background: '#fff', borderRadius: 12, padding: '1.1rem 1.4rem', border: '1.5px solid rgba(0,68,123,0.08)' }}>
                      <summary style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: NAVY, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {q}
                        <span style={{ fontSize: 18, color: ORANGE, flexShrink: 0, marginLeft: 12 }}>+</span>
                      </summary>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.92rem', color: '#3b3b3b', lineHeight: 1.7, marginTop: 12, marginBottom: 0 }}>
                        {a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
                {['Rio de Janeiro', 'Brazil', 'South America', 'Beach', 'City Break', 'Samba', 'Travel Story', 'Couples Travel', 'First Time Rio'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(0,68,123,0.08)', color: NAVY, fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20 }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Affiliate disclaimer */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: GRAY, fontStyle: 'italic', lineHeight: 1.7, marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
                This post contains affiliate links. If you book through our links we may earn a small commission at no extra cost to you. We only recommend places and services we have personally used or genuinely believe in.
              </p>

            </article>

            {/* ── Sidebar ── */}
            <aside>

              {/* Trip Snapshot */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Trip Snapshot
                </div>
                {[
                  { label: 'Destination', value: 'Rio de Janeiro, Brazil' },
                  { label: 'Duration', value: '5 days' },
                  { label: 'When', value: 'January 2026' },
                  { label: 'Dates', value: '22 Jan – 26 Jan' },
                  { label: 'Base', value: 'Copacabana / Ipanema' },
                  { label: 'Travellers', value: 'Couple' },
                  { label: 'Currency', value: 'Brazilian Real (BRL)' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span style={{ color: GRAY }}>{label}</span>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: NAVY, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', fontSize: 13 }}>
                  <span style={{ color: GRAY, paddingTop: 2 }}>Trip Style</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end', maxWidth: '60%' }}>
                    {['Beach', 'Culture', 'Nightlife', 'City'].map(tag => (
                      <span key={tag} style={{ background: 'rgba(0,68,123,0.08)', color: NAVY, fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <a href="/plan" style={{ display: 'block', background: ORANGE, color: '#fff', textAlign: 'center', padding: '0.85rem', borderRadius: 10, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: '1.25rem' }}>
                  Plan your Rio trip
                </a>
              </div>

              {/* Trip Highlights sidebar */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Don&apos;t Miss
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    'Cable car up Sugarloaf at sunrise',
                    'Cristo Redentor (go early)',
                    'Samba night in Lapa',
                    'Mate tea and Biscoito Globo on Ipanema',
                    'Selaron Steps in the afternoon light',
                    'Cervantes sandwich after midnight',
                  ].map((item, i, arr) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: 13, color: '#2a2a3e' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, marginTop: 5, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hotels sidebar */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Where to Stay in Rio
                </div>
                <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.6, marginBottom: '1rem' }}>
                  Stay between Copacabana and Ipanema. Francisco Otaviano and the surrounding streets put you within walking distance of both beaches.
                </p>
                <a href={BOOKING_AFFILIATE} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}>
                  Browse on Booking.com
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,100,180,0.08)', borderRadius: 6, padding: '5px 8px', fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: '#00448b', marginTop: 12 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="#00448b" strokeWidth="1.2"/>
                    <path d="M4 6l1.5 1.5L8 4" stroke="#00448b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Links open on Booking.com via affiliate
                </div>
              </div>

              {/* Getting around */}
              <div style={{ background: 'rgba(0,68,123,0.04)', border: `1.5px solid rgba(0,68,123,0.12)`, borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Getting Around Rio
                </div>
                <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.6, margin: 0 }}>
                  Use <strong>Uber</strong> for anything beyond walking distance — it is reliable, inexpensive and far easier than navigating local buses as a first-time visitor. WHOOSH scooters cover the beachfront. Avoid displaying your phone in unfamiliar areas.
                </p>
              </div>

            </aside>
          </div>

        </div>
      </main>

      {/* Comments */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <CommentsSection postSlug="rio-de-janeiro-5-days" />
      </div>

      {/* Affiliate disclaimer footer */}
      <div style={{ background: '#f0f0f0', padding: '1rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem', color: GRAY, maxWidth: 700, margin: '0 auto' }}>
          <strong>Disclosure:</strong> Luna Let&apos;s Go earns a small commission when you book through affiliate links (Booking.com, Klook, GoWithGuide) at no extra cost to you. We only link to places and services we have actually used or genuinely recommend. Thank you for supporting our small team.
        </p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          main > div {
            padding: 1.5rem 1rem 3rem !important;
          }
          .blog-hero-img {
            height: 220px !important;
            border-radius: 12px !important;
          }
          .blog-layout {
            display: flex !important;
            flex-direction: column !important;
            gap: 2rem !important;
          }
          .blog-layout > article {
            width: 100%;
            min-width: 0;
          }
          .blog-layout > aside {
            width: 100%;
          }
          .blog-photo-trio {
            grid-template-columns: 1fr !important;
          }
          .blog-photo-duo {
            grid-template-columns: 1fr !important;
          }
          .highlights-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
