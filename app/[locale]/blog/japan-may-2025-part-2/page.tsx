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
    'Monkey go-karts through Akihabara, TeamLab Borderless, Mt Fuji, Osaka Expo 2025, and Super Nintendo World. Japan part two delivered everything.',
  openGraph: {
    title: 'Japan Part 2: Tokyo, Mt Fuji, Osaka Expo & Universal Studios',
    description:
      'Our full Tokyo to Osaka story: go-karting through Shibuya, TeamLab art, Mt Fuji day trip, Osaka Expo 2025 and Super Nintendo World.',
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

/* ─── Hotel card ──────────────────────────────────────────────── */
function HotelCard({ name, nights, note, link }: { name: string; nights: string; note: string; link: string }) {
  return (
    <div style={{ border: `2px solid ${ORANGE}`, borderRadius: 14, padding: '1.4rem', margin: '1.5rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', flexWrap: 'wrap', gap: 8 }}>
        <h4 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: NAVY, margin: 0 }}>{name}</h4>
        <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: ORANGE, fontWeight: 600 }}>{nights}</span>
      </div>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: GRAY, lineHeight: 1.6, marginBottom: '1rem' }}>{note}</p>
      <a href={link} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 8, textDecoration: 'none' }}>
        Check availability on Booking.com
      </a>
    </div>
  );
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Japan Part 2: Tokyo, Mt Fuji, Osaka Expo 2025 and Universal Studios Japan',
  description:
    'Monkey go-karts through Akihabara, TeamLab Borderless immersive art, a Mt Fuji day trip, Osaka Expo 2025 and Super Nintendo World.',
  image: 'https://www.lunaletsgo.com/blog/Japan-May-2025/shibuya%20scramble%20square%20sky%20tower.jpeg',
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
    { '@type': 'Question', name: 'Is go-karting through Tokyo streets safe?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, with an operator like Street Kart or similar licensed companies. You drive licensed street karts on public roads, follow a guide, and must hold a valid international driving permit. It is loud, chaotic and completely brilliant.' } },
    { '@type': 'Question', name: 'Do you need to book TeamLab Borderless in advance?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. TeamLab Borderless Tokyo books out weeks in advance, especially on weekends. Book through Klook or the official TeamLab website as soon as your dates are confirmed.' } },
    { '@type': 'Question', name: 'Can you do Mt Fuji as a day trip from Tokyo?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The journey takes around 2 hours each way from Shinjuku by bus or train. A full day gives you time at the fifth station, Lake Kawaguchi and Fuji-Q Highland if you want to add the theme park.' } },
    { '@type': 'Question', name: 'What is Osaka Expo 2025 like?', acceptedAnswer: { '@type': 'Answer', text: 'Osaka Expo 2025 runs from April to October 2025 on Yumeshima Island. Pavilions from over 150 countries showcase food, culture and technology. Give yourself a full day and book tickets in advance online.' } },
    { '@type': 'Question', name: 'Is Super Nintendo World worth it at Universal Studios Japan?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely. Super Nintendo World is the most immersive theme park area we have ever seen. Book Express Passes online well in advance as the queues can be 90 minutes or more without them.' } },
    { '@type': 'Question', name: 'Which Tokyo neighbourhood is best to stay in?', acceptedAnswer: { '@type': 'Answer', text: 'Roppongi puts you between the quiet residential streets and major art museums. Shinjuku suits nightlife and quick access to Fuji day trip buses. Shibuya is great for shopping and people-watching. All are well connected by metro.' } },
    { '@type': 'Question', name: 'How do you get from Tokyo to Osaka quickly?', acceptedAnswer: { '@type': 'Answer', text: 'The Shinkansen Nozomi from Tokyo Station to Shin-Osaka takes around 2 hours 20 minutes. It is covered by the Japan Rail Pass (except Nozomi on some passes, check your pass type). Book reserved seats especially during Golden Week.' } },
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
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}>May 6 to May 14, 2025</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>9 days</strong> · Tokyo, Mt Fuji, Osaka</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>15 min</strong> read</div>
            </div>
          </header>

          {/* Hero photo */}
          <div className="blog-hero-img" style={{ position: 'relative', width: '100%', height: 420, borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
            <Image
              src="/blog/Japan-May-2025/shibuya%20scramble%20square%20sky%20tower.jpeg"
              alt="Shibuya Scramble Square sky tower observation deck at night with city lights stretching across Tokyo"
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 1100px"
            />
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '3rem' }}>
            Shibuya Scramble Square, Tokyo at night. Japan, May 2025.
          </p>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }} className="blog-grid">

            {/* ── MAIN ARTICLE ─────────────────────────────── */}
            <article>

              {/* Intro */}
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                After nine days weaving through Osaka markets, Kyoto temples, Nara deer parks and Hiroshima, we boarded the Shinkansen heading north to Tokyo. We had no idea what was waiting.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                Part 2 was a completely different kind of travel. Less ancient, more electric. Neon-lit streets, immersive art installations, volcanic lakes reflecting a snowcapped peak, and a theme park built entirely around a video game world we grew up loving. Japan kept finding new ways to surprise us.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '2.5rem' }}>
                This is the full story of our final nine days: from Shibuya Crossing to the summit of Mt Fuji, Osaka Expo 2025, and Super Nintendo World at Universal Studios Japan.
              </p>

              {/* Day 8 */}
              <SectionH2>Day 8 (May 6): Arriving in Tokyo</SectionH2>
              <DayBadge label="Wednesday, 6 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                We arrived at Tokyo Station in the early afternoon after a smooth two-hour-twenty Shinkansen ride from Shin-Osaka. The contrast with Osaka was instant. Where Osaka felt loud and fast, Tokyo felt enormous and somehow still efficient. Thousands of people moving at pace, all apparently knowing exactly where they were going.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                We checked into our hotel in Roppongi, dropped our bags, and walked straight to Shibuya. The scramble crossing at rush hour is something that has been photographed ten million times and is still not properly capturable. Six pedestrian streams, all at once, in total silence except for the chirping of the crossing signals. We stood watching it for 20 minutes before crossing ourselves, giggling the whole way.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.5rem' }}>
                That evening we found the Nintendo Store in Shibuya Parco and spent far too long testing demo units and watching Fatima win several rounds of the hook machine games. We came away with a small Kirby plushie and a lot of dignity intact.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 380, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <Image
                  src="/blog/Japan-May-2025/hook%20machines%20win.jpeg"
                  alt="Prize machine winnings including plush toys and small gifts at a Japanese arcade"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 750px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                The hook machine haul. We are not ashamed.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                We ended the night at Centifolia, a beautiful bar tucked into one of the Roppongi backstreets. Low lighting, a long whisky list and the kind of quiet that Tokyo hides surprisingly well when you know where to look.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 380, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <Image
                  src="/blog/Japan-May-2025/centifolia.jpeg"
                  alt="Dimly lit cocktail bar interior with polished wooden bar and warm amber lighting"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 750px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                Centifolia bar, Roppongi. One of the best quiet spots we found in Tokyo.
              </p>

              {/* Day 9 */}
              <SectionH2>Day 9 (May 7): Akihabara and Monkey Go-Karts</SectionH2>
              <DayBadge label="Thursday, 7 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                We spent the morning in Akihabara. Several floors of electronics, anime figurines, retro game cartridges and maid cafes. Even with no interest in buying anything, it is visually overwhelming in the best way. The density of colour and neon in a single street block is something you simply cannot replicate anywhere else.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.5rem' }}>
                In the afternoon we did the go-kart experience through the streets of Tokyo dressed as Mario Kart characters. We booked through Klook in advance. You pick your costume at the base, get a safety briefing and then follow a guide through real public roads covering Akihabara, Akasaka and parts of central Tokyo. It is chaotic, legal and absolutely ridiculous fun. Fatima wore a Princess Peach costume. I was Donkey Kong. We are both fine with this.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ position: 'relative', height: 280, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/monkey%20kart.jpeg"
                    alt="Go-kart rider in costume driving through Tokyo streets with neon signs overhead"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
                <div style={{ position: 'relative', height: 280, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/monkeykart2.jpeg"
                    alt="Group of go-kart riders in Mario Kart costumes stopped at a city intersection in Tokyo"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                Go-karting through Tokyo streets in Mario Kart costumes. Completely unhinged. Completely essential.
              </p>

              <div style={{ background: 'rgba(255,130,16,0.06)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.2rem 1.4rem', margin: '1.5rem 0 2rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TipIcon />
                <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.6, color: '#444' }}>
                  <strong>Go-kart tip:</strong> You must hold a valid international driving permit (IDP) to drive. Get one from your national automobile club before you leave home. Without it, you will not be allowed to drive and will follow in a passenger vehicle instead.
                </p>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                <a href={KLOOK_GOKART} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Book the Tokyo go-kart experience on Klook</a> well in advance, especially if you are visiting during peak season.
              </p>

              {/* Day 10 */}
              <SectionH2>Day 10 (May 8): TeamLab Borderless</SectionH2>
              <DayBadge label="Friday, 8 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                TeamLab Borderless is an immersive digital art museum where the installations bleed between rooms with no defined paths. You wander. Art follows you, reacts to you, splits around you. We spent four hours inside and still felt like we missed things.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.5rem' }}>
                The forest room, where thousands of hanging lanterns shift colour in response to touch, was the highlight. The overgrown lamp room, where vines and flowers climb across suspended lights, was close behind. No description does it justice. Book ahead on Klook and go with no plan: just wander and let it unfold.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ position: 'relative', height: 280, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/team%20lab.jpeg"
                    alt="Glowing digital art installation with flowing colours projected across floors walls and ceiling"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
                <div style={{ position: 'relative', height: 280, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/teamlab2.jpeg"
                    alt="Visitors standing inside a mirrored room with thousands of hanging illuminated orbs at TeamLab Borderless"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                TeamLab Borderless, Tokyo. Every room is different. Every photo looks like a dream.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                <a href={KLOOK_TEAMLAB} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Book TeamLab Borderless tickets through Klook</a> at least two weeks ahead. Weekend sessions in particular sell out fast.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                That night we found a robot restaurant-style show bar near Shinjuku, which was exactly as absurd as described: giant robots, neon costumes, taiko drumming and enthusiastic audience participation. We also found a karaoke bar in the Shinjuku entertainment district, where we stayed until 2am. No regrets.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 380, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <Image
                  src="/blog/Japan-May-2025/karaoke.jpeg"
                  alt="Private karaoke booth with neon lights and a large screen in a Tokyo karaoke bar"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 750px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                2am karaoke in Shinjuku. We gave it everything.
              </p>

              {/* Day 11 */}
              <SectionH2>Day 11 (May 9): Roppongi and Breakfast Above Shibuya</SectionH2>
              <DayBadge label="Saturday, 9 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                A slower morning. We explored the Roppongi Hills complex, which turned out to be far more interesting than a shopping mall deserves to be. The Mori Art Museum on the 53rd floor was showing a thoughtful contemporary exhibition and the city view from the observation deck made a strong case for Tokyo being one of the most beautiful things humans have ever built.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                In the afternoon we took ourselves to the Shibuya Sky observation deck for golden hour. We had booked the <a href={KLOOK_SHIBUYA_SKY} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Shibuya Sky sunset slot through Klook</a> two weeks before, which turned out to be essential. The view from the top of Shibuya Scramble Square at sunset, looking across the entire sprawl of Tokyo, is something we will not easily forget.
              </p>

              {/* Day 12 */}
              <SectionH2>Day 12 (May 10): Shibuya Sky at Sunset and Omoide Yokocho</SectionH2>
              <DayBadge label="Sunday, 10 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.5rem' }}>
                The rooftop at Shibuya Sky has an outdoor section with no glass barrier between you and the open air, 230 metres above street level. The floor below shows the scramble crossing as a tiny grid. As the sun drops, the neon comes on across the city in waves. It is hard to express how large Tokyo feels from up there.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 420, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <Image
                  src="/blog/Japan-May-2025/shibuya%20scramble%20square%20sky%20tower.jpeg"
                  alt="Panoramic view from Shibuya Scramble Square sky deck at dusk with city lights spreading across Tokyo"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 750px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                Shibuya Sky. The most extraordinary city view we have seen anywhere.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                For dinner we walked to Omoide Yokocho, the narrow alley of yakitori stalls near Shinjuku Station that locals call Memory Lane. Eight or ten seats per stall, no menus, smoke from the charcoal grills drifting across the lane, the kind of place that has not changed in 60 years. We squeezed in, pointed at things, drank cold Kirin and ate some of the best skewered chicken of our lives.
              </p>

              {/* Mid-article CTA */}
              <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a5c9e 100%)`, borderRadius: 16, padding: '2rem', margin: '3rem 0', color: '#fff', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.6rem', lineHeight: 1.3 }}>
                  Planning your own Japan trip?
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', opacity: 0.88, lineHeight: 1.6, marginBottom: '1.4rem' }}>
                  Luna builds personalised Japan itineraries in seconds, balancing cities, temples, theme parks and travel logistics automatically.
                </p>
                <Link href="/start" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 10, textDecoration: 'none' }}>
                  Plan my Japan trip with Luna
                </Link>
              </div>

              {/* Day 13 */}
              <SectionH2>Day 13 (May 11): Mt Fuji Day Trip</SectionH2>
              <DayBadge label="Monday, 11 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                We booked a day trip from Shinjuku to Mt Fuji and Lake Kawaguchi through Klook. The bus left at 7am and reached the Fuji fifth station at around 9:30. May is a good month for Fuji: the snowline is still visible from the fifth station and the crowds are smaller than July or August when the hiking season opens.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.5rem' }}>
                Standing below the volcanic cone, looking up at the perfect symmetrical slope, is one of those moments where you stop trying to take photos because no photo will be accurate. We walked the Ochudo trail around the fifth station for a couple of hours, then descended to Lake Kawaguchi for lunch by the water.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ position: 'relative', height: 300, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/Fuji.jpeg"
                    alt="Mount Fuji snowcapped peak rising above cloud level against a blue sky"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
                <div style={{ position: 'relative', height: 300, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/Fuji2.jpeg"
                    alt="View of Mount Fuji reflected in a calm lake at Kawaguchi with cherry blossoms in the foreground"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                Mt Fuji from above and reflected at Lake Kawaguchi. Two ways of seeing the same mountain.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                In the afternoon we went to Fuji-Q Highland, the amusement park at the base of the mountain, for the roller coasters. Fuji-Q holds several world records for steepness and speed and the coasters deliver on that reputation fully. Book your <a href={KLOOK_FUJI} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Mt Fuji day trip</a> and <a href={KLOOK_FUJIQ} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>Fuji-Q Highland tickets</a> through Klook ahead of time.
              </p>

              <div style={{ background: 'rgba(255,130,16,0.06)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.2rem 1.4rem', margin: '1.5rem 0 2rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TipIcon />
                <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.6, color: '#444' }}>
                  <strong>Fuji visibility tip:</strong> Mt Fuji is often hidden in cloud, especially in summer. May and October give the best odds of clear skies. Check the live webcam at Lake Kawaguchi the night before and be prepared to adjust plans if visibility is poor.
                </p>
              </div>

              {/* Day 14 */}
              <SectionH2>Day 14 (May 12): Osaka Expo 2025</SectionH2>
              <DayBadge label="Tuesday, 12 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                We took the Shinkansen back south to Osaka, checked into our hotel near Universal City and headed straight to Yumeshima Island for Osaka Expo 2025. The expo runs from April to October 2025 across a custom-built island in Osaka Bay with pavilions from over 150 countries.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.5rem' }}>
                The scale of it is staggering. We spent a full day and covered maybe 40 percent of the grounds. Standout pavilions included the circular Grand Ring walkway (reportedly the largest wooden structure in the world), the Japan pavilion, and a handful of smaller national pavilions serving extraordinary food. The Australia and Brazil pavilions had long queues, both worth it.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <Image
                  src="/blog/Japan-May-2025/OsakaExpo.jpeg"
                  alt="Osaka Expo 2025 pavilions and the Grand Ring wooden walkway structure under a blue sky"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 750px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                Osaka Expo 2025, Yumeshima Island. A full day was not enough.
              </p>

              <div style={{ background: 'rgba(255,130,16,0.06)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.2rem 1.4rem', margin: '1.5rem 0 2rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TipIcon />
                <p style={{ margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.6, color: '#444' }}>
                  <strong>Expo tip:</strong> Book tickets online before arriving in Japan. Timed entry tickets for specific pavilions often sell out weeks ahead. Arrive early and head for the most popular national pavilions first. Comfortable shoes are essential.
                </p>
              </div>

              {/* Day 15 */}
              <SectionH2>Day 15 (May 13): Universal Studios Japan and Super Nintendo World</SectionH2>
              <DayBadge label="Wednesday, 13 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                Universal Studios Japan was our last full day in Japan and we saved it for Super Nintendo World. We had heard good things. The reality exceeded them significantly.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                Super Nintendo World is entered through a warp pipe. You emerge into a life-size recreation of the Mushroom Kingdom, complete with moving Goombas, interactive question blocks that respond to your wristband, and a full-scale Bowser's Castle looming at the back. The Mario Kart ride inside the castle is genuinely extraordinary: augmented reality kart racing with physical motion tracked to the visuals.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.5rem' }}>
                We had Express Passes booked through Klook, without which the queues for Mario Kart can run to two hours. If you are going, book <a href={KLOOK_USJ} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600, textDecoration: 'none' }}>USJ tickets and Express Passes on Klook</a> as early as possible. They sell out months ahead.
              </p>

              <div style={{ background: 'rgba(0,68,123,0.05)', border: `1px solid rgba(0,68,123,0.15)`, borderRadius: 14, padding: '1.4rem 1.6rem', margin: '2rem 0' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', color: NAVY, marginBottom: '0.6rem' }}>Practical tip: USJ Express Pass</p>
                <ul style={{ paddingLeft: '1.2rem', margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.7, color: '#444' }}>
                  <li>Express Pass 4 or 7 are the most common options. Buy 7 if your budget allows.</li>
                  <li>Mario Kart Express is sold as a separate add-on from the main pass.</li>
                  <li>All passes have entry time slots. Book the Mario Kart slot for first thing in the morning.</li>
                  <li>The Butterbeer and Wand experience in The Wizarding World of Harry Potter next door is also worthwhile.</li>
                </ul>
              </div>

              {/* Day 16 */}
              <SectionH2>Day 16 (May 14): Umeda Sky Building and Farewell Osaka</SectionH2>
              <DayBadge label="Thursday, 14 May" />
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                Our last morning in Japan. We checked out of the hotel, stored luggage at Osaka Station, and walked to the Umeda Sky Building for one final city view. Two towers joined by a floating garden observatory at the top, connected by escalators that cross open air between them. The view over northern Osaka is calm and vast.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 400, borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
                <Image
                  src="/blog/Japan-May-2025/umeda.jpeg"
                  alt="Umeda Sky Building twin towers in Osaka with the connected floating garden observatory at the top"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="(max-width: 768px) 100vw, 750px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                Umeda Sky Building. A quiet end to a very full trip.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                We had lunch at a small ramen shop in the basement restaurant floor of Osaka Station, the kind of place with a ticket machine at the entrance and seats for eight people. We shared a bowl of tonkotsu ramen and a plate of gyoza and talked about coming back.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '2.5rem' }}>
                The Shinkansen to the airport left at 2pm. Japan was over.
              </p>

              {/* Japan Food Section */}
              <SectionH2>Eating Your Way Through Japan</SectionH2>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                Food in Japan deserves its own conversation. Across two weeks and four cities, we ate spectacularly well. The combination of extraordinary quality, affordable prices and the density of good options in every neighbourhood makes Japan one of the best countries in the world to eat in.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div style={{ position: 'relative', height: 260, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/Osaka%20feast%20food.jpeg"
                    alt="Spread of Japanese dishes including sashimi gyoza ramen and yakitori on a restaurant table"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
                <div style={{ position: 'relative', height: 260, borderRadius: 14, overflow: 'hidden' }}>
                  <Image
                    src="/blog/Japan-May-2025/shinkansen%20lunch.jpeg"
                    alt="Ekiben bento box lunch eaten on the Shinkansen with views of the Japanese countryside outside the window"
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 50vw, 360px"
                  />
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '2rem' }}>
                Left: a proper Osaka feast. Right: the Shinkansen ekiben lunch, one of the joys of train travel in Japan.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '1.2rem' }}>
                Some highlights across the trip: the ekiben (station bento boxes) sold on Shinkansen platforms were excellent meals in themselves. Convenience store onigiri from FamilyMart or 7-Eleven is genuinely good food, not a compromise. Ramen quality is consistently high everywhere, even in cheap side-street spots. The gap between a 600 yen convenience store meal and a 1,200 yen sit-down lunch is surprisingly small.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333', marginBottom: '2.5rem' }}>
                Our highest recommendation: do not over-plan food. Walk until something smells good, go in, point at the pictures if there is no English menu. Japan has the lowest food risk of any country we have visited. Everything is clean, fresh and cared about.
              </p>

              {/* Practical tips */}
              <SectionH2>Practical Tips for Tokyo and Osaka</SectionH2>
              <div style={{ background: 'rgba(255,130,16,0.06)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.2rem 1.4rem', margin: '1.5rem 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TipIcon />
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.7, color: '#444' }}>
                  <strong>IC card:</strong> Get a Suica or PASMO card at any station machine on day one. It covers all metro, bus and most local train lines in Tokyo. Add money as you go. Works in convenience stores and vending machines too.
                </div>
              </div>
              <div style={{ background: 'rgba(255,130,16,0.06)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.2rem 1.4rem', margin: '1.5rem 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TipIcon />
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.7, color: '#444' }}>
                  <strong>eSIM:</strong> Buy a Japan eSIM from Airalo or similar before departure. Data is fast and coverage in both cities is comprehensive including on metro lines.
                </div>
              </div>
              <div style={{ background: 'rgba(255,130,16,0.06)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.2rem 1.4rem', margin: '1.5rem 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TipIcon />
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.7, color: '#444' }}>
                  <strong>Book ahead:</strong> TeamLab, Shibuya Sky, USJ Express Passes, go-karts and the Osaka Expo pavilions all require advance booking. Leave nothing to walk-up chance, especially in May.
                </div>
              </div>
              <div style={{ background: 'rgba(255,130,16,0.06)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.2rem 1.4rem', margin: '1.5rem 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TipIcon />
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.7, color: '#444' }}>
                  <strong>Cash still matters:</strong> Many small ramen shops, izakayas and temple shops do not accept cards. Withdraw from 7-Eleven ATMs (the most reliable for foreign cards) and keep some yen handy.
                </div>
              </div>

              {/* Luna CTA box */}
              <div style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #e07010 100%)`, borderRadius: 16, padding: '2rem', margin: '3rem 0', color: '#fff', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.6rem', lineHeight: 1.3 }}>
                  Ready to plan your Japan adventure?
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '1.4rem', maxWidth: 480, margin: '0 auto 1.4rem' }}>
                  Tell Luna where you want to go and she will build a complete Japan itinerary: cities, day trips, theme parks and travel logistics, all personalised to your style.
                </p>
                <Link href="/start" style={{ display: 'inline-block', background: '#fff', color: ORANGE, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 10, textDecoration: 'none' }}>
                  Start planning with Luna
                </Link>
              </div>

              {/* FAQ */}
              <SectionH2>Frequently Asked Questions</SectionH2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2.5rem' }}>
                {faqSchema.mainEntity.map((item, i) => (
                  <details key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,68,123,0.10)', padding: '1.1rem 1.3rem' }}>
                    <summary style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '0.95rem', color: NAVY, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {item.name}
                      <span style={{ color: ORANGE, fontSize: 18, fontWeight: 400, flexShrink: 0, marginLeft: 12 }}>+</span>
                    </summary>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.92rem', color: GRAY, lineHeight: 1.7, marginTop: '0.8rem', marginBottom: 0 }}>
                      {item.acceptedAnswer.text}
                    </p>
                  </details>
                ))}
              </div>

              {/* Read also */}
              <SectionH2>Read Also</SectionH2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '2.5rem' }}>
                <Link href="/blog/japan-may-2025-part-1" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.2rem', background: '#fff', border: '1px solid rgba(0,68,123,0.10)', borderRadius: 12, textDecoration: 'none' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: NAVY }}>Japan Part 1: Osaka, Kyoto, Nara and Hiroshima</span>
                </Link>
                <Link href="/blog/fiji-oct-2024" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.2rem', background: '#fff', border: '1px solid rgba(0,68,123,0.10)', borderRadius: 12, textDecoration: 'none' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: NAVY }}>Fiji October 2024: Islands, Resorts and the Best Slow Travel</span>
                </Link>
                <Link href="/blog/rio-de-janeiro-5-days" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.2rem', background: '#fff', border: '1px solid rgba(0,68,123,0.10)', borderRadius: 12, textDecoration: 'none' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: NAVY }}>Rio de Janeiro in 5 Days: Carnival, Favelas and the Best Caipirinhas</span>
                </Link>
              </div>

              {/* Final CTA */}
              <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0a5c9e 100%)`, borderRadius: 16, padding: '2.5rem 2rem', margin: '3rem 0', color: '#fff', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', marginBottom: '0.7rem', lineHeight: 1.3 }}>
                  Japan inspired you. Now make it happen.
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '1rem', opacity: 0.88, lineHeight: 1.6, marginBottom: '1.6rem', maxWidth: 520, margin: '0 auto 1.6rem' }}>
                  Luna plans your full Japan trip: from first shinkansen to last izakaya. Personalised to your travel style, budget and group.
                </p>
                <Link href="/start" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 10, textDecoration: 'none' }}>
                  Build my Japan itinerary
                </Link>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '2rem' }}>
                {['Japan', 'Tokyo', 'Mt Fuji', 'Osaka Expo', 'Universal Studios Japan', 'TeamLab', 'Go-kart', 'Travel 2025'].map(tag => (
                  <span key={tag} style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, color: NAVY, background: 'rgba(0,68,123,0.08)', padding: '5px 14px', borderRadius: 20 }}>
                    {tag}
                  </span>
                ))}
              </div>

              {/* Affiliate disclaimer */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#aaa', lineHeight: 1.6, borderTop: '1px solid #eee', paddingTop: '1.5rem', marginBottom: 0 }}>
                Some links in this post are affiliate links. If you book through them, Luna Let&apos;s Go earns a small commission at no extra cost to you. We only link to experiences and hotels we actually used.
              </p>

            </article>

            {/* ── SIDEBAR ──────────────────────────────────── */}
            <aside style={{ position: 'sticky', top: 90 }}>

              {/* Trip Snapshot */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(0,68,123,0.10)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', color: NAVY, marginBottom: '1.2rem', borderBottom: '2px solid rgba(255,130,16,0.2)', paddingBottom: '0.6rem' }}>
                  Trip Snapshot
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: '#444', lineHeight: 1.7 }}>
                  <li><strong style={{ color: NAVY }}>Dates:</strong> May 6 to 14, 2025</li>
                  <li><strong style={{ color: NAVY }}>Duration:</strong> 9 days</li>
                  <li><strong style={{ color: NAVY }}>Cities:</strong> Tokyo, Mt Fuji, Osaka</li>
                  <li><strong style={{ color: NAVY }}>Travellers:</strong> 2 adults</li>
                  <li><strong style={{ color: NAVY }}>Style:</strong> Mix of adventure and culture</li>
                  <li><strong style={{ color: NAVY }}>Budget:</strong> Mid-range to splurge</li>
                </ul>
              </div>

              {/* Don't Miss */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(0,68,123,0.10)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', color: NAVY, marginBottom: '1.2rem', borderBottom: '2px solid rgba(255,130,16,0.2)', paddingBottom: '0.6rem' }}>
                  Don&apos;t Miss
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Tokyo Go-Karting', link: KLOOK_GOKART },
                    { label: 'TeamLab Borderless', link: KLOOK_TEAMLAB },
                    { label: 'Shibuya Sky sunset', link: KLOOK_SHIBUYA_SKY },
                    { label: 'Mt Fuji day trip', link: KLOOK_FUJI },
                    { label: 'Universal Studios Japan', link: KLOOK_USJ },
                  ].map(({ label, link }) => (
                    <li key={label}>
                      <a href={link} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: NAVY, fontWeight: 500 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: ORANGE, flexShrink: 0 }} />
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Where We Stayed */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(0,68,123,0.10)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', color: NAVY, marginBottom: '1.2rem', borderBottom: '2px solid rgba(255,130,16,0.2)', paddingBottom: '0.6rem' }}>
                  Where We Stayed
                </h3>
                <HotelCard
                  name="Act Hotel Roppongi, Tokyo"
                  nights="5 nights (May 6 to 11)"
                  note="Well-located in Roppongi with easy metro access to Shibuya, Shinjuku and Akihabara. Clean, compact rooms typical of Tokyo."
                  link={HOTEL_ACT_ROPPONGI}
                />
                <HotelCard
                  name="Oriental Hotel Universal City, Osaka"
                  nights="3 nights (May 11 to 14)"
                  note="Walking distance from Universal Studios Japan. Comfortable rooms and easy access back into Osaka city by train."
                  link={HOTEL_ORIENTAL_USJ}
                />
              </div>

              {/* Getting Around */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(0,68,123,0.10)', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1rem', color: NAVY, marginBottom: '1.2rem', borderBottom: '2px solid rgba(255,130,16,0.2)', paddingBottom: '0.6rem' }}>
                  Getting Around
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: "'Inter', sans-serif", fontSize: '0.88rem', color: '#444', lineHeight: 1.9 }}>
                  <li><strong style={{ color: NAVY }}>Tokyo metro:</strong> Suica IC card covers all lines</li>
                  <li><strong style={{ color: NAVY }}>Tokyo to Osaka:</strong> Shinkansen Nozomi, 2h 20min</li>
                  <li><strong style={{ color: NAVY }}>Fuji day trip:</strong> Highway bus from Shinjuku Bus Terminal</li>
                  <li><strong style={{ color: NAVY }}>Osaka Expo:</strong> Direct metro to Yumeshima Island</li>
                  <li><strong style={{ color: NAVY }}>USJ:</strong> JR Sakurajima Line to Universal City</li>
                </ul>
              </div>

              {/* Luna CTA sidebar */}
              <div style={{ background: `linear-gradient(135deg, ${ORANGE} 0%, #e07010 100%)`, borderRadius: 16, padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#fff', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  Plan your Japan trip
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                  Luna builds your full itinerary in seconds, from Tokyo to Osaka.
                </p>
                <Link href="/start" style={{ display: 'inline-block', background: '#fff', color: ORANGE, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 13, padding: '10px 22px', borderRadius: 8, textDecoration: 'none' }}>
                  Start planning
                </Link>
              </div>

            </aside>
          </div>
        </div>
      </main>

      {/* Comments */}
      <CommentsSection postSlug="japan-may-2025-part-2" />

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .blog-hero-img { height: 240px !important; }
        }
        details summary::-webkit-details-marker { display: none; }
      `}</style>
    </>
  );
}
