import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import BlogBreadcrumbs from '@/components/BlogBreadcrumbs';
import CommentsSection from '@/components/blog/CommentsSection';

/**
 * BLOG POST TEMPLATE RULES — apply to ALL blog posts on Luna Let's Go
 *
 * Hero badge: flag emoji + DESTINATION NAME (uppercase) + post type tag
 * Photo captions: describe what is ACTUALLY visible in the photo.
 * NEVER use em dashes anywhere. Use ".", "," or ":" instead.
 * Affiliate links: always target="_blank" rel="nofollow sponsored noopener"
 * CommentsSection: always rendered at the bottom of every post
 * No Tailwind. No emoji in body text. Inline styles only.
 */

export const metadata: Metadata = {
  title: "Japan Part 2: Tokyo, Mt Fuji, Osaka Expo & Universal Studios | Luna Let's Go Blog",
  description:
    'Shibuya Crossing at rush hour, TeamLab Borderless, go-karts through Tokyo, Mt Fuji, the Osaka World Expo 2025 and Super Nintendo World. The second half of Japan delivered everything.',
  openGraph: {
    title: "Japan Part 2: Tokyo, Mt Fuji, Osaka Expo & Universal Studios",
    description:
      'Five electric days in Tokyo, a sunrise at Mt Fuji, Osaka Expo 2025 and Super Nintendo World at Universal Studios Japan.',
    url: 'https://www.lunaletsgo.com/blog/japan-may-2025-part-2',
    type: 'article',
  },
};

/* ─── Shared design tokens ────────────────────────────────────── */
const ORANGE = '#FF8210';
const NAVY   = '#00447B';
const GRAY   = '#6C6D6F';

/* ─── Affiliate links ─────────────────────────────────────────── */
const HOTEL_ACT_ROPPONGI =
  'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fsearchresults.en-us.html%3Fss%3DAct%2BHotel%2BRoppongi%2BTokyo';
const HOTEL_ORIENTAL_USJ =
  'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fsearchresults.en-us.html%3Fss%3DOriental%2BHotel%2BUniversal%2BCity%2BOsaka';
const KLOOK_GOKART =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DTokyo%2Bgo%2Bkart%26country_id%3D96';
const KLOOK_TEAMLAB =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DTeamLab%2BBorderless%26country_id%3D96';
const KLOOK_SHIBUYA_SKY =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DShibuya%2BSky%26country_id%3D96';
const KLOOK_FUJI =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DMount%2BFuji%2Bday%2Btrip%26country_id%3D96';
const KLOOK_FUJIQ =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DFuji-Q%2BHighland%26country_id%3D96';
const KLOOK_USJ =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DUniversal%2BStudios%2BJapan%26country_id%3D96';

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
  headline: 'Japan Part 2: Tokyo Madness, Mt Fuji, Osaka Expo and Universal Studios Japan',
  description:
    'Shibuya Crossing, TeamLab Borderless, go-karts through Tokyo, Mt Fuji, the Osaka World Expo 2025 and Super Nintendo World.',
  image: 'https://www.lunaletsgo.com/blog/Japan-May-2025/shibuya scramble square sky tower.jpeg',
  author: { '@type': 'Person', name: 'Wilson & Fatima', url: 'https://www.lunaletsgo.com/about' },
  publisher: {
    '@type': 'Organization',
    name: "Luna Let's Go",
    logo: { '@type': 'ImageObject', url: 'https://www.lunaletsgo.com/lunaletsgo-logo.jpeg' },
  },
  datePublished: '2025-05-25',
  dateModified: '2025-05-25',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://www.lunaletsgo.com/blog/japan-may-2025-part-2' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is go-karting through Tokyo streets safe?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, with a licensed operator. You drive street karts on public roads following a guide. You must hold a valid international driving permit. It is loud, chaotic and completely brilliant.' } },
    { '@type': 'Question', name: 'Do you need to book TeamLab Borderless in advance?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. TeamLab Borderless Tokyo books out weeks in advance, especially on weekends. Book through Klook or the official TeamLab website as soon as your dates are confirmed.' } },
    { '@type': 'Question', name: 'Can you do Mt Fuji as a day trip from Tokyo?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The journey takes around 2 hours each way from Shinjuku by coach. A full day gives you time at the fifth station, Lake Kawaguchi, and Fuji-Q Highland if you want to add the theme park.' } },
    { '@type': 'Question', name: 'What is Osaka Expo 2025 like?', acceptedAnswer: { '@type': 'Answer', text: 'Osaka Expo 2025 runs from April to October 2025 on Yumeshima Island. Pavilions from over 150 countries showcase food, culture and technology. Give yourself a full day and book tickets in advance online.' } },
    { '@type': 'Question', name: 'Is Super Nintendo World worth it at Universal Studios Japan?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. Super Nintendo World is the most immersive theme park area we have ever seen. Book Express Passes online well in advance as queues can be 90 minutes or more without them.' } },
    { '@type': 'Question', name: 'Which Tokyo neighbourhood is best to stay in?', acceptedAnswer: { '@type': 'Answer', text: 'Roppongi puts you between the quiet residential streets and major museums. Shinjuku suits nightlife and quick access to Fuji day trip coaches. Shibuya is great for shopping and people-watching. All are well connected by metro.' } },
    { '@type': 'Question', name: 'How do you get from Tokyo to Osaka quickly?', acceptedAnswer: { '@type': 'Answer', text: 'The Shinkansen Nozomi from Tokyo Station to Shin-Osaka takes around 2 hours 20 minutes. Book reserved seats especially during Golden Week.' } },
  ],
};

export default function JapanPart2BlogPost() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <NavBar />

      <main style={{ paddingTop: 68, minHeight: '100vh', background: '#F7F8FA', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '2.5rem' }}>
            <BlogBreadcrumbs postTitle="Japan Part 2: Tokyo, Mt Fuji, Expo & Universal Studios" postSlug="japan-may-2025-part-2" />
          </div>

          {/* Article header */}
          <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-block', background: `rgba(255,130,16,0.12)`, color: ORANGE, fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20 }}>
                Japan Part 2 · Travel Story
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,68,123,0.07)', padding: '5px 12px', borderRadius: 20 }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>🇯🇵</span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, color: NAVY }}>Japan</span>
              </div>
            </div>

            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: NAVY, lineHeight: 1.2, marginBottom: '1rem', maxWidth: 780 }}>
              Japan Part 2: Tokyo, Mt Fuji, Osaka Expo and Universal Studios Japan
            </h1>

            <p style={{ fontSize: '1.15rem', color: GRAY, lineHeight: 1.65, maxWidth: 680, marginBottom: '1.5rem', fontStyle: 'italic' }}>
              Go-karts through Shibuya, a lake view of Fuji, Expo 2025 and Super Nintendo World. The second half of Japan was completely different and completely unforgettable.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  WF
                </div>
                <div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY }}>Wilson &amp; Fatima</div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}>May 2025</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>9 days</strong> · Tokyo, Mt Fuji, Osaka</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>13 min</strong> read</div>
            </div>
          </header>

          {/* Hero photo */}
          <div className="blog-hero-img" style={{ position: 'relative', width: '100%', height: 420, borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
            <Image
              src="/blog/Japan-May-2025/shibuya scramble square sky tower.jpeg"
              alt="Panoramic view of Tokyo skyline from Shibuya Scramble Square observation deck at night, Japan"
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 1100px"
            />
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '3rem' }}>
            Shibuya Scramble Square, Tokyo at night. Japan, May 2025.
          </p>

          {/* Article body: 2-column grid */}
          <div className="blog-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }}>

            {/* Main content column */}
            <article>

              {/* Intro callout */}
              <div style={{ background: 'rgba(103,154,193,0.12)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 14px 14px 0', padding: '1.5rem 1.75rem', marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#2a2a3e', margin: 0 }}>
                  After nine days weaving through Osaka markets, Kyoto temples, Nara deer parks and Hiroshima, we boarded the Shinkansen heading north to Tokyo. We had no idea what was waiting. Part 2 was a completely different kind of travel: less ancient, more electric.{' '}
                  <Link href="/blog/japan-may-2025-part-1" style={{ color: ORANGE, fontWeight: 600 }}>If you missed Part 1 covering Osaka, Kyoto, Nara and Hiroshima, read it here.</Link>
                </p>
              </div>

              {/* Highlights box */}
              <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #005fa3 60%, #0077b6 100%)`, borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', color: '#FFBD59', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  What&apos;s in this post
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    'Shibuya Crossing at rush hour and the Nintendo Store (May 6)',
                    'Akihabara district and go-karting through central Tokyo (May 7)',
                    'TeamLab Borderless and late-night karaoke in Shinjuku (May 8)',
                    'Shibuya Sky at sunset: the best view of the trip (May 10)',
                    'Day trip to Mt Fuji and Fuji-Q Highland (May 11)',
                    'Osaka Expo 2025: a full day on Yumeshima Island (May 12)',
                    'Super Nintendo World at Universal Studios Japan (May 13)',
                    'Umeda Sky Building farewell and goodbye to Japan (May 14)',
                    'Where we stayed: Act Hotel Roppongi + Oriental Hotel Universal City',
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFBD59', marginTop: 7, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opening paragraphs */}
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Neon-lit streets, immersive art installations, volcanic lakes reflecting a snowcapped peak, and a theme park built entirely around a video game world we grew up loving. Japan kept finding new ways to surprise us.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                This is the full story of our final nine days: from Shibuya Crossing to the summit of Mt Fuji, Osaka Expo 2025 and Super Nintendo World at Universal Studios Japan.
              </p>

              {/* DAY: May 6 */}
              <DayBadge label="Wednesday, 6 May" />
              <SectionH2>Shibuya Crossing, the Nintendo Store and Centifolia Bar</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We arrived at Tokyo Station in the early afternoon after a smooth two-hour-twenty Shinkansen ride from Shin-Osaka. The contrast with Osaka was instant. Where Osaka felt loud and fast, Tokyo felt enormous and somehow still efficient. Thousands of people moving at pace, all apparently knowing exactly where they were going.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We checked into{' '}
                <a href={HOTEL_ACT_ROPPONGI} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Act Hotel Roppongi</a>,
                dropped our bags and walked straight to Shibuya. The scramble crossing at rush hour is something that has been photographed ten million times and is still not properly capturable. Six pedestrian streams, all at once, in total silence except for the chirping of the crossing signals. We stood watching it for 20 minutes before crossing ourselves.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                That evening we found the Nintendo Store in Shibuya Parco and spent far too long inside. We came away with a small Kirby plushie and a lot of dignity intact.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/hook machines win.jpeg"
                  alt="Prize machine winnings including plush toys at a Japanese arcade"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                The hook machine haul. We are not ashamed.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We ended the night at Centifolia, a bar tucked into one of the Roppongi backstreets. Low lighting, a long whisky list and the kind of quiet that Tokyo hides surprisingly well.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/centifolia.jpeg"
                  alt="Dimly lit cocktail bar interior with polished wooden bar and warm amber lighting, Roppongi Tokyo"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Centifolia bar, Roppongi. One of the best quiet spots we found in Tokyo.
              </p>

              {/* DAY: May 7 */}
              <DayBadge label="Thursday, 7 May" />
              <SectionH2>Akihabara Electronics and Go-Karts Through Central Tokyo</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We spent the morning in Akihabara. Several floors of electronics, anime figurines, retro game cartridges and maid cafes. Even with no interest in buying anything, it is visually overwhelming in the best way.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                In the afternoon we did the go-kart experience through the streets of Tokyo dressed as Mario Kart characters. We booked through{' '}
                <a href={KLOOK_GOKART} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Klook</a>{' '}
                in advance. You pick your costume, get a safety briefing and follow a guide through real public roads across Akihabara, Akasaka and parts of central Tokyo. It is chaotic, legal and absolutely ridiculous fun. Fatima wore a Princess Peach costume. Wilson was Donkey Kong.
              </p>

              <div style={{ background: 'rgba(255,189,89,0.15)', border: `1.5px solid rgba(255,130,16,0.3)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '2rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TipIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: ORANGE }}>Go-kart tip</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: 0, lineHeight: 1.6 }}>
                  You must hold a valid international driving permit to drive. Get one before you leave home. Without it, you will follow in a passenger vehicle instead.
                </p>
              </div>

              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/Japan-May-2025/monkey kart.jpeg', alt: 'Go-kart rider in costume driving through Tokyo streets, Japan' },
                  { src: '/blog/Japan-May-2025/monkeykart2.jpeg', alt: 'Group of go-kart riders in Mario Kart costumes stopped at traffic lights in Tokyo, Japan' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Street go-karting through Tokyo. Completely unhinged. Completely essential.
              </p>

              {/* DAY: May 8 */}
              <DayBadge label="Friday, 8 May" />
              <SectionH2>TeamLab Borderless: Four Hours Was Not Enough</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <a href={KLOOK_TEAMLAB} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>TeamLab Borderless</a> is an immersive digital art museum where installations bleed between rooms with no defined paths. You wander. Art follows you, reacts to you, splits around you. We spent four hours inside and still felt like we missed things. The forest room, where thousands of hanging lanterns shift colour in response to touch, was the highlight.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Book ahead on Klook and go with no plan: just wander.
              </p>

              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/Japan-May-2025/team lab.jpeg', alt: 'Glowing digital art installation with flowing colours and hanging lanterns at TeamLab Borderless Tokyo' },
                  { src: '/blog/Japan-May-2025/teamlab2.jpeg', alt: 'Visitors standing inside a mirrored room with thousands of suspended lights at TeamLab Borderless' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                TeamLab Borderless, Tokyo. Every room is different. Every photo looks like a dream.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                That night we found a robot restaurant-style show bar near Shinjuku, which was exactly as absurd as described: giant robots, neon costumes and enthusiastic audience participation. We also found a karaoke bar in the Shinjuku entertainment district, where we stayed until 2am.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/karaoke.jpeg"
                  alt="Private karaoke booth with neon lights and microphones in a Shinjuku karaoke bar, Tokyo Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                2am karaoke in Shinjuku. We gave it everything.
              </p>

              {/* MID-ARTICLE CTA */}
              <div style={{ background: 'linear-gradient(135deg, #00447B 0%, #005fa3 100%)', borderRadius: 16, padding: 32, margin: '40px 0', textAlign: 'center', color: 'white' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.2rem', marginBottom: 12, color: 'white', lineHeight: 1.3 }}>
                  Planning your own Japan trip?
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.88)', marginBottom: 20, lineHeight: 1.6 }}>
                  Luna builds personalised Japan itineraries in seconds, balancing cities, temples, theme parks and travel logistics automatically.
                </p>
                <a href="/start" style={{ display: 'inline-block', background: '#FF8210', color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', padding: '14px 28px', borderRadius: 50, textDecoration: 'none' }}>
                  Plan my Japan trip with Luna
                </a>
              </div>

              {/* DAY: May 9 */}
              <DayBadge label="Saturday, 9 May" />
              <SectionH2>Roppongi Hills and Breakfast Above Shibuya Crossing</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                A slower morning. We explored the Roppongi Hills complex. The Mori Art Museum on the 53rd floor was showing a thoughtful contemporary exhibition, and the city view from the observation deck made a strong case for Tokyo being one of the most beautiful things humans have ever built.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                In the afternoon we went to Cafe L&apos;Occitane in Shibuya for breakfast with a window table looking directly down onto the crossing. Watching it from above with coffee in hand is a completely different experience from standing inside it.
              </p>

              {/* DAY: May 10 */}
              <DayBadge label="Sunday, 10 May" />
              <SectionH2>Shibuya Sky at Sunset: The Best View of the Entire Trip</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <a href={KLOOK_SHIBUYA_SKY} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Shibuya Sky</a> is the open-air rooftop observation deck on top of Scramble Square, 230 metres above the city. At sunset, the light catches the sprawl of Tokyo in all directions. On a clear day you can see Mt Fuji on the horizon.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                This was the single best view of the entire trip. Book the sunset time slot on Klook and arrive slightly early to secure a spot on the open-air section.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/shibuya scramble square sky tower.jpeg"
                  alt="Panoramic view from Shibuya Scramble Square sky deck at sunset with Tokyo sprawl and Mt Fuji silhouette, Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Shibuya Sky at sunset. Book the sunset slot. Arrive 20 minutes early.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                After sunset we went to Omoide Yokocho (Memory Lane): a cluster of tiny yakitori and ramen stalls in narrow alleys just west of Shinjuku Station. Standing at a counter eating grilled skewers under yellow light with smoke rising around you is one of those Tokyo moments that stays with you.
              </p>

              {/* DAY: May 11 */}
              <DayBadge label="Monday, 11 May" />
              <SectionH2>Day Trip to Mt Fuji and Fuji-Q Highland</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The day trip to Mt Fuji from Tokyo takes about two hours by coach. Go on a clear day, check the weather the night before, and book transport in advance.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Book a{' '}
                <a href={KLOOK_FUJI} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Mt Fuji day trip on Klook</a>{' '}
                for the easiest round-trip from Tokyo. Mt Fuji completely delivers. We visited the 5th Station on the Fujiyoshida side. The scale of the mountain against the landscape around it is genuinely something.
              </p>

              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/Japan-May-2025/Fuji.jpeg', alt: 'Mount Fuji snowcapped peak rising above cloud level, Japan' },
                  { src: '/blog/Japan-May-2025/Fuji2.jpeg', alt: 'View of Mount Fuji reflected in the calm waters of Lake Kawaguchi, Japan' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Mt Fuji. Everything you imagined. Exactly that.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <a href={KLOOK_FUJIQ} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Fuji-Q Highland</a> is the amusement park at the base of the mountain. The rides are among Japan&apos;s most extreme. Queues in May were 2 to 3 hours per ride. Go on a weekday or arrive at opening time.
              </p>

              {/* DAY: May 12 */}
              <DayBadge label="Tuesday, 12 May" />
              <SectionH2>Osaka Expo 2025: Surprisingly, Genuinely Impressive</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                From Tokyo we returned to Osaka for the final days, staying at the{' '}
                <a href={HOTEL_ORIENTAL_USJ} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Oriental Hotel Universal City</a>,
                perfectly placed for the Expo and Universal Studios.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The 2025 World Expo ran on Yumeshima, an artificial island in Osaka Bay. We went expecting something corporate. We were wrong.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/OsakaExpo.jpeg"
                  alt="Osaka Expo 2025 pavilions and the Grand Ring wooden structure on Yumeshima Island, Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Osaka Expo 2025. Go early, stay late.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The pavilions were genuinely ambitious. The Saudi Arabia pavilion with its immersive environments, the Japan pavilion showcasing food and materials technology, smaller country pavilions with real craft and character. Plan a full day and arrive early.
              </p>

              {/* DAY: May 13 */}
              <DayBadge label="Wednesday, 13 May" />
              <SectionH2>Super Nintendo World: The Best Theme Park Experience Either of Us Has Ever Had</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Book{' '}
                <a href={KLOOK_USJ} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Universal Studios Japan tickets on Klook</a>{' '}
                in advance. For Super Nintendo World, also book a timed entry reservation alongside your park ticket.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Walking through the entry pipe into the Mushroom Kingdom and hearing the music start is one of the most genuinely delightful experiences in the world. Every surface, every sound, every detail has been designed with unreasonable care. The rides are excellent. The interactive wristband challenges are addictive.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Wilson, who has played Mario games since childhood, was emotional within approximately four minutes of entering. This is correct behaviour.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Donkey Kong Country is spectacular. The mine cart rollercoaster is faithful to the game in all the right ways.
              </p>

              {/* DAY: May 14 */}
              <DayBadge label="Thursday, 14 May" />
              <SectionH2>Umeda Sky Building and Goodbye to Japan</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The final morning. We went to the Shin-Umeda Sky Building, specifically the Floating Garden Observatory on the 39th floor: an open-air circular walkway connecting two towers, with views across Osaka in all directions.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/umeda.jpeg"
                  alt="Umeda Sky Building twin towers in Osaka with the city skyline and mountains in the background, Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Umeda Sky Building. A good place to say goodbye to an extraordinary country.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We stood up there for a while without saying much. Japan fills you up with so much food, beauty, kindness and strangeness that by the end you just stand on a rooftop and try to take it in before the flight home.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Japan is the kind of place that makes you want to go back before you have even left. We both said it. We will go back.
              </p>

              {/* FOOD SECTION */}
              <SectionH2>Eating Your Way Through Japan</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Food in Japan deserves its own conversation. Across two weeks and four cities, we ate spectacularly well. The combination of extraordinary quality, affordable prices and the density of good options in every neighbourhood makes Japan one of the best countries in the world to eat in.
              </p>

              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/Japan-May-2025/Osaka feast food.jpeg', alt: 'Spread of Japanese dishes including sashimi, gyoza and small plates at an Osaka izakaya, Japan' },
                  { src: '/blog/Japan-May-2025/shinkansen lunch.jpeg', alt: 'Ekiben bento box lunch eaten on the Shinkansen bullet train, Japan' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Two weeks of this. Zero bad meals.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Some highlights across the trip: the ekiben (station bento boxes) sold on Shinkansen platforms were excellent meals in themselves. Convenience store onigiri from FamilyMart or 7-Eleven is genuinely good food, not a compromise. Ramen quality is consistently high everywhere, even in cheap side-street spots.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Our highest recommendation: do not over-plan food. Walk until something smells good, go in, point at the pictures if there is no English menu. Japan has the lowest food risk of any country we have visited. Everything is clean, fresh and cared about.
              </p>

              {/* TIPS SECTION */}
              <SectionH2>Practical Tips for Tokyo and Osaka</SectionH2>

              <div style={{ background: 'rgba(255,189,89,0.15)', border: `1.5px solid rgba(255,130,16,0.3)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '2rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TipIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: ORANGE }}>Shoes. Still. Non-negotiable.</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: 0, lineHeight: 1.6 }}>
                  Tokyo is larger than it looks on a map and walking is how you see it. 20,000 steps on a quiet day, 30,000 on a busy one. Vans are not walking shoes. Bring cushioned walking shoes. Every single day.
                </p>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Book TeamLab and Shibuya Sky in advance.</strong> Both sell out, especially on weekends and during Golden Week. Klook is reliable for both. Book the Shibuya Sky sunset slot specifically.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>USJ timed entry for Super Nintendo World</strong> is separate from the Express Pass. Book both ahead. The Mario Kart queue without Express Pass runs to 90 minutes or more.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Fuji-Q Highland on a weekday.</strong> Weekend queues for the big coasters are 2 to 3 hours. A weekday arrival at opening cuts that in half.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Buy your bento at the Shinkansen platform kiosk</strong> before boarding. The ekiben are regional and genuinely excellent. Do not board without one.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Osaka Expo: arrive early.</strong> The most popular pavilions queue from mid-morning. Go straight to the Saudi Arabia or Japan pavilion first, then work outward.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Cash for small shops.</strong> Many ramen shops, izakayas and temple stalls do not accept cards. Withdraw from 7-Eleven ATMs, the most reliable for foreign cards, and keep yen handy.
              </p>

              {/* Luna CTA box */}
              <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #003a6e 100%)`, borderRadius: 16, padding: '2rem', margin: '2.5rem 0', textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '0.75rem' }}>
                  Planning a Trip to Japan?
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, marginBottom: '1.25rem' }}>
                  Luna builds your personalised Japan itinerary in seconds. Day by day, budget-aware, and fully editable.
                </p>
                <Link href="/plan" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, padding: '12px 30px', borderRadius: 10, textDecoration: 'none' }}>
                  Plan My Japan Trip with Luna
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
                    { q: 'Is go-karting through Tokyo streets safe?', a: 'Yes, with a licensed operator. You drive street karts on public roads following a guide. You must hold a valid international driving permit. It is loud, chaotic and completely brilliant.' },
                    { q: 'Do you need to book TeamLab Borderless in advance?', a: 'Yes. TeamLab Borderless Tokyo books out weeks in advance, especially on weekends. Book through Klook or the official TeamLab website as soon as your dates are confirmed.' },
                    { q: 'Can you do Mt Fuji as a day trip from Tokyo?', a: 'Yes. The journey takes around 2 hours each way from Shinjuku by coach. A full day gives you time at the fifth station, Lake Kawaguchi, and Fuji-Q Highland if you want to add the theme park.' },
                    { q: 'What is Osaka Expo 2025 like?', a: 'Osaka Expo 2025 runs from April to October 2025 on Yumeshima Island. Pavilions from over 150 countries showcase food, culture and technology. Give yourself a full day and book tickets in advance online.' },
                    { q: 'Is Super Nintendo World worth it at Universal Studios Japan?', a: 'Absolutely. Super Nintendo World is the most immersive theme park area we have ever seen. Book Express Passes online well in advance as queues can be 90 minutes or more without them.' },
                    { q: 'Which Tokyo neighbourhood is best to stay in?', a: 'Roppongi puts you between the quiet residential streets and major museums. Shinjuku suits nightlife and quick access to Fuji day trip coaches. Shibuya is great for shopping and people-watching. All are well connected by metro.' },
                    { q: 'How do you get from Tokyo to Osaka quickly?', a: 'The Shinkansen Nozomi from Tokyo Station to Shin-Osaka takes around 2 hours 20 minutes. Book reserved seats especially during Golden Week.' },
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

              {/* Read also */}
              <div style={{ background: '#f0f5fb', borderRadius: 14, padding: '1.4rem', margin: '2rem 0' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, color: NAVY, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Read Also</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <li><Link href="/blog/japan-may-2025-part-1" style={{ color: ORANGE, fontWeight: 600, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Japan Part 1: Osaka, Kyoto, Nara and Hiroshima</Link></li>
                  <li><Link href="/blog/fiji-oct-2024" style={{ color: NAVY, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Fiji October 2024: Islands, Beach Clubs and a Private Pool</Link></li>
                  <li><Link href="/blog/rio-de-janeiro-5-days" style={{ color: NAVY, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>5 Days in Rio de Janeiro: Samba, Beaches and Iconic Views</Link></li>
                </ul>
              </div>

              {/* Final CTA */}
              <div style={{ background: 'linear-gradient(135deg, #FF8210 0%, #e07010 100%)', borderRadius: 16, padding: '2rem', margin: '2rem 0', textAlign: 'center', color: '#fff' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.6rem', lineHeight: 1.3 }}>
                  Japan inspired you. Now make it happen.
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '1.4rem' }}>
                  Luna plans your full Japan trip: from first Shinkansen to last izakaya. Personalised to your travel style, budget and group.
                </p>
                <a href="/start" style={{ display: 'inline-block', background: '#fff', color: '#FF8210', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '14px', padding: '12px 28px', borderRadius: 10, textDecoration: 'none' }}>
                  Build my Japan itinerary
                </a>
              </div>

              {/* Affiliate disclaimer */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.78rem', color: '#9CA3AF', lineHeight: 1.6, marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0', marginBottom: 0 }}>
                Some links in this post are affiliate links. If you book through them, Luna Let&apos;s Go earns a small commission at no extra cost to you. We only link to experiences and hotels we actually used.
              </p>

            </article>

            {/* Sidebar */}
            <aside>

              {/* Trip Snapshot */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Trip Snapshot
                </div>
                {[
                  { label: 'Destinations', value: 'Tokyo, Mt Fuji, Osaka' },
                  { label: 'Duration', value: '9 days' },
                  { label: 'When', value: 'May 2025' },
                  { label: 'Dates', value: 'May 6 to May 14' },
                  { label: 'Travellers', value: 'Couple' },
                  { label: 'Currency', value: 'Japanese Yen (JPY)' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span style={{ color: GRAY }}>{label}</span>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: NAVY, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', fontSize: 13 }}>
                  <span style={{ color: GRAY, paddingTop: 2 }}>Trip Style</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end', maxWidth: '60%' }}>
                    {['Adventure', 'Culture', 'Theme Parks', 'Food'].map(tag => (
                      <span key={tag} style={{ background: 'rgba(0,68,123,0.08)', color: NAVY, fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <a href="/start" style={{ display: 'block', background: ORANGE, color: '#fff', textAlign: 'center', padding: '0.85rem', borderRadius: 10, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: '1.25rem' }}>
                  Plan your Japan trip
                </a>
              </div>

              {/* Don't Miss */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Don&apos;t Miss
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    'Shibuya Sky at sunset (book in advance)',
                    'TeamLab Borderless digital art museum',
                    'Go-karting through central Tokyo',
                    'Super Nintendo World at USJ',
                    'Mt Fuji day trip from Tokyo',
                    'Osaka Expo 2025',
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
                  Where We Stayed
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, marginBottom: 4 }}>Act Hotel Roppongi</div>
                    <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>Tokyo · May 6 to May 11</div>
                    <a href={HOTEL_ACT_ROPPONGI} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 8, textDecoration: 'none' }}>
                      Check on Booking.com
                    </a>
                  </div>
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, marginBottom: 4 }}>Oriental Hotel Universal City</div>
                    <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>Osaka · May 11 to May 14</div>
                    <a href={HOTEL_ORIENTAL_USJ} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 8, textDecoration: 'none' }}>
                      Check on Booking.com
                    </a>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,100,180,0.08)', borderRadius: 6, padding: '5px 8px', fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: '#00448b', marginTop: 12 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="#00448b" strokeWidth="1.2"/>
                    <path d="M4 6l1.5 1.5L8 4" stroke="#00448b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Links open on Booking.com via affiliate
                </div>
              </div>

              {/* Getting around */}
              <div style={{ background: 'rgba(0,68,123,0.04)', border: `1.5px solid rgba(0,68,123,0.12)`, borderRadius: 16, padding: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Getting Around Japan
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { label: 'Tokyo metro', value: 'Suica IC card covers all lines' },
                    { label: 'Tokyo to Osaka', value: 'Shinkansen Nozomi, 2h 20min' },
                    { label: 'Fuji day trip', value: 'Highway bus from Shinjuku Bus Terminal' },
                    { label: 'Osaka Expo', value: 'Direct metro to Yumeshima Island' },
                    { label: 'USJ', value: 'JR Sakurajima Line to Universal City Station' },
                  ].map(({ label, value }, i, arr) => (
                    <li key={label} style={{ display: 'flex', flexDirection: 'column', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: 13 }}>
                      <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: NAVY, marginBottom: 2 }}>{label}</span>
                      <span style={{ color: GRAY }}>{value}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </aside>
          </div>

        </div>
      </main>

      {/* Comments */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <CommentsSection postSlug="japan-may-2025-part-2" />
      </div>

      {/* Disclosure bar */}
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
          .blog-layout > article { width: 100%; min-width: 0; }
          .blog-layout > aside { width: 100%; }
          .blog-photo-duo { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .blog-photo-duo {
            display: flex !important;
            flex-direction: column !important;
          }
        }
      `}</style>
    </>
  );
}
