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
  title: "Japan Part 1: Osaka, Kyoto, Nara & Hiroshima | Luna Let's Go Blog",
  description:
    'From Dotonbori midnight sushi to Kuromon Market bluefin tuna, Kyoto temples, wild deer in Nara and the Hiroshima Flower Festival. Japan started perfectly.',
  openGraph: {
    title: 'Japan Part 1: Osaka, Kyoto, Nara & Hiroshima',
    description:
      'Our full travel story through Osaka, Kyoto, Nara and Hiroshima: food, temples, sacred deer and the Peace Memorial.',
    url: 'https://www.lunaletsgo.com/blog/japan-may-2025-part-1',
    type: 'article',
  },
};

/* ─── Shared design tokens ────────────────────────────────────── */
const ORANGE = '#FF8210';
const NAVY   = '#00447B';
const GRAY   = '#6C6D6F';

/* ─── Affiliate links ─────────────────────────────────────────── */
const HOTEL_HILLARYS =
  'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fsearchresults.en-us.html%3Fss%3DHotel%2BHillarys%2BShinsaibashi%2BOsaka';
const HOTEL_YADO =
  'https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fsearchresults.en-us.html%3Fss%3DYADO%2BTENKU%2BKyoto%2BNijo';
const KLOOK_OSAKA_CASTLE =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DOsaka%2BCastle%26country_id%3D96';
const KLOOK_KUROMON =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DKuromon%2BMarket%2BOsaka%26country_id%3D96';
const KLOOK_OSAKA_FOOD_TOUR =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DOsaka%2Bfood%2Btour%26country_id%3D96';
const KLOOK_KYOTO_TEMPLE =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DKyoto%2Btemple%2Btour%26country_id%3D96';
const KLOOK_NARA =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DNara%2Bday%2Btrip%26country_id%3D96';
const KLOOK_HIROSHIMA =
  'https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2Fsearch%3Fquerystring%3DHiroshima%2Bday%2Btrip%26country_id%3D96';

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
  headline: 'Japan Part 1: Osaka Markets, Kyoto Temples, Nara Deer & Hiroshima',
  description:
    'From Dotonbori midnight sushi to Kuromon Market bluefin tuna, Kyoto temples, wild deer in Nara and the Hiroshima Flower Festival.',
  image: 'https://www.lunaletsgo.com/blog/Japan-May-2025/Kiyomizu-dera.jpeg',
  author: { '@type': 'Person', name: 'Wilson & Fatima', url: 'https://www.lunaletsgo.com/about' },
  publisher: {
    '@type': 'Organization',
    name: "Luna Let's Go",
    logo: { '@type': 'ImageObject', url: 'https://www.lunaletsgo.com/lunaletsgo-logo.jpeg' },
  },
  datePublished: '2025-05-20',
  dateModified: '2025-05-20',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://www.lunaletsgo.com/blog/japan-may-2025-part-1' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'Is Japan expensive to travel?', acceptedAnswer: { '@type': 'Answer', text: 'Japan is mid-range. Budget travellers can eat very well for under 2,000 yen per meal at market stalls and convenience stores. The Japan Rail Pass saves significant money on multi-city trips.' } },
    { '@type': 'Question', name: 'What is the best way to get between Osaka, Kyoto and Nara?', acceptedAnswer: { '@type': 'Answer', text: 'Osaka to Kyoto is 15 minutes on the Shinkansen or 30 minutes on the Hankyu line. Kyoto to Nara takes around 45 minutes by JR Nara Line. All are easy, frequent and affordable.' } },
    { '@type': 'Question', name: 'Can you visit Nara as a day trip from Kyoto?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, easily. Around 45 minutes each way by train. A full day is enough for the park, Todai-ji and the streets without rushing.' } },
    { '@type': 'Question', name: 'Is street food in Japan safe?', acceptedAnswer: { '@type': 'Answer', text: 'Completely. Japan has world-class food hygiene standards. Market stalls, convenience stores and street vendors are all safe.' } },
    { '@type': 'Question', name: 'Is the Hiroshima Peace Memorial Museum worth visiting?', acceptedAnswer: { '@type': 'Answer', text: 'Absolutely, though emotionally heavy. Set aside 2 to 3 hours. The Atomic Bomb Dome is adjacent and included in the same visit.' } },
    { '@type': 'Question', name: 'When is the best time to visit Japan?', acceptedAnswer: { '@type': 'Answer', text: 'Spring (late March to early May) for cherry blossoms is one of the most beautiful times, though it is busy. Autumn (October to November) for foliage is equally stunning. Summer is hot and humid.' } },
    { '@type': 'Question', name: 'What was the best food experience in Osaka?', acceptedAnswer: { '@type': 'Answer', text: 'Kuromon Market was exceptional: bluefin tuna, wagyu skewers, king crab and giant oysters all in one place. The Feast Like a Local food tour was equally unforgettable.' } },
  ],
};

export default function JapanPart1BlogPost() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <NavBar />

      <main style={{ paddingTop: 68, minHeight: '100vh', background: '#F7F8FA', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '2.5rem' }}>
            <BlogBreadcrumbs postTitle="Japan Part 1: Osaka, Kyoto, Nara & Hiroshima" postSlug="japan-may-2025-part-1" />
          </div>

          {/* Article header */}
          <header style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-block', background: `rgba(255,130,16,0.12)`, color: ORANGE, fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20 }}>
                Japan Part 1 · Travel Story
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,68,123,0.07)', padding: '5px 12px', borderRadius: 20 }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>🇯🇵</span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, color: NAVY }}>Japan</span>
              </div>
            </div>

            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: NAVY, lineHeight: 1.2, marginBottom: '1rem', maxWidth: 780 }}>
              Japan Part 1: Osaka, Kyoto, Nara and Hiroshima
            </h1>

            <p style={{ fontSize: '1.15rem', color: GRAY, lineHeight: 1.65, maxWidth: 680, marginBottom: '1.5rem', fontStyle: 'italic' }}>
              Sushi at midnight, market feasts, temple walks and the Hiroshima Flower Festival.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  WF
                </div>
                <div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY }}>Wilson &amp; Fatima</div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}>Apr 30 to May 6, 2025</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>7 days</strong> · Osaka, Kyoto, Nara, Hiroshima</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>14 min</strong> read</div>
            </div>
          </header>

          {/* Hero photo */}
          <div className="blog-hero-img" style={{ position: 'relative', width: '100%', height: 420, borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
            <Image
              src="/blog/Japan-May-2025/Kiyomizu-dera.jpeg"
              alt="Kiyomizudera temple wooden stage overlooking forested hills of Kyoto Japan"
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 1100px"
            />
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '3rem' }}>
            Kiyomizudera, Kyoto. Japan, May 2025.
          </p>

          {/* Article body: 2-column grid */}
          <div className="blog-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }}>

            {/* Main content column */}
            <article>

              {/* Intro callout */}
              <div style={{ background: 'rgba(103,154,193,0.12)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 14px 14px 0', padding: '1.5rem 1.75rem', marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '1.02rem', lineHeight: 1.8, color: '#2a2a3e', margin: 0 }}>
                  Japan had been on our list for years. The kind of destination you talk about until you finally stop talking and just go. We landed in Osaka late on April 30, dropped our bags, and were eating sushi on Dotonbori Street before midnight. That set the tone for everything that followed. This is Part 1, covering Osaka, Kyoto, Nara and Hiroshima.{' '}
                  <Link href="/blog/japan-may-2025-part-2" style={{ color: ORANGE, fontWeight: 600 }}>Read Part 2 for Tokyo, Mt Fuji, the Osaka Expo and Super Nintendo World.</Link>
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
                    'Midnight sushi at Dotonbori on arrival night (Apr 30)',
                    'Osaka Castle Park and Kuromon Market bluefin tuna (May 1)',
                    'A 5-restaurant Feast Like a Local food tour across Osaka',
                    'Pontocho alleyway cocktails and ramen in Kyoto (May 2)',
                    'Nijo Castle, Sanjusangendo and Kiyomizudera temples (May 3)',
                    'Day trip to Nara: sacred deer, Todai-ji Temple, traditional house (May 4)',
                    'Hiroshima: Flower Festival, Peace Memorial, Castle and gyoza (May 5)',
                    'Nishiki Market before the Shinkansen east (May 6)',
                    'Where we stayed: Hotel Hillarys Shinsaibashi and YADO TENKU Kyoto Nijo',
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: 'rgba(255,255,255,0.88)', lineHeight: 1.6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFBD59', marginTop: 7, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* WHERE WE STAYED */}
              <SectionH2>Where We Stayed in Osaka and Kyoto</SectionH2>
              <HotelCard
                name="Hotel Hillarys Shinsaibashi, Osaka"
                nights="Apr 30 to May 2"
                note="Great location, walking distance from Dotonbori and the Shinsaibashi shopping strip. Clean, comfortable and well priced for central Osaka."
                link={HOTEL_HILLARYS}
              />
              <HotelCard
                name="YADO TENKU Kyoto Nijo, Kyoto"
                nights="May 2 to May 6"
                note="Beautifully designed ryokan-style hotel near Nijo Castle. Quiet, refined and very Kyoto. One of the best places we stayed on the entire trip."
                link={HOTEL_YADO}
              />

              {/* DAY: Apr 30 */}
              <DayBadge label="Apr 30 - Arrival Night" />
              <SectionH2>Dotonbori at Midnight: Osaka&apos;s Welcome is Loud, Neon and Delicious</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Arriving late at night in Osaka and finding Dotonbori already buzzing is one of those travel moments that instantly tells you a city is something special. The canal was lit up, the famous Glico running man sign glowing above us, and every street smelled incredible.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We found a small traditional restaurant tucked away from the main drag and sat down for our first proper sushi. No translation needed. Just point, order, eat. The fish was impossibly fresh, the rice perfectly seasoned. This was the sushi trip, and it started exactly right.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/Nakauoyacho.jpeg"
                  alt="Narrow lantern-lit Japanese street at night, Osaka Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Osaka&apos;s night streets. Not bad for 11pm on arrival.
              </p>

              {/* DAY: May 1 */}
              <DayBadge label="May 1 - Day 1 in Osaka" />
              <SectionH2>Osaka Castle, Kuromon Market and the Most Legendary Food Day of the Trip</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                May 1 was one of those days that goes on a personal highlight reel for life.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We started at Osaka Castle Park in the morning. The castle sits on a raised platform surrounded by moats and trees. You can walk the grounds for free. The castle itself is worth the entrance if you want the history, and the views from the top floor over the city are genuinely spectacular. Book{' '}
                <a href={KLOOK_OSAKA_CASTLE} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Osaka Castle tickets in advance via Klook</a> to skip the queues.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/Osaka%20Castle.jpeg"
                  alt="Osaka Castle surrounded by green trees and blue sky, Osaka Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Osaka Castle before the morning crowds arrived.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Then came <strong>Kuromon Market</strong> in Nippombashi. If you eat nothing else in Osaka, eat here. The market is a 580-metre covered street lined with vendors selling every kind of fresh food imaginable. This was one of the biggest highlights of the entire trip.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '0.5rem' }}>
                <strong>What we ate at Kuromon:</strong>
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Bluefin tuna, sliced thick, melt-on-the-tongue, gone in seconds',
                  'Sushi and sashimi at a tiny counter stall with no pretensions',
                  'Wagyu beef skewers, caramelised and smoky',
                  'Giant oysters, fresh and briny, served on ice',
                  'King crab arm, steamed and completely over the top in the best way',
                ].map((item) => (
                  <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '1rem', color: '#2a2a3e', lineHeight: 1.7 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: ORANGE, marginTop: 8, flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Browse{' '}
                <a href={KLOOK_KUROMON} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Kuromon Market food tours on Klook</a>{' '}
                if you want a guided experience through the stalls.
              </p>

              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/Japan-May-2025/Kuromon_market.jpeg', alt: 'Kuromon Ichiba market stalls with fresh seafood, Osaka Japan' },
                  { src: '/blog/Japan-May-2025/Kuromon_market-tuna.jpeg', alt: 'Bluefin tuna being sliced at Kuromon Market, Osaka Japan' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Kuromon Market. Budget an hour. Stay for two.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                That evening we did a &quot;Feast Like a Local&quot; experience: a guided food tour visiting five different restaurants across the city. Sake, small plates, conversations with locals, dishes we could not name but would absolutely eat again. One of the best evenings of the trip. Find{' '}
                <a href={KLOOK_OSAKA_FOOD_TOUR} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Osaka food tours on Klook</a>.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/feast%20food%20crew.jpeg"
                  alt="Group at izakaya restaurant small plates and sake, Osaka Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Five restaurants, one legendary evening.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We finished the night back at Dotonbori, playing in one of the claw machine arcades. Wilson won a toy. Significant achievement.
              </p>

              {/* DAY: May 2 */}
              <DayBadge label="May 2 - Osaka to Kyoto" />
              <SectionH2>Shopping, More Sushi and the Train to Kyoto</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The morning was for shopping around Dotonbori: electronics, gifts, snacks by the bag. We had more sushi. Obviously.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                By midday we were on the Shinkansen to Kyoto. Arriving in Kyoto feels like stepping into a different mood. Where Osaka is loud and electric, Kyoto is quiet and old. We checked in to{' '}
                <a href={HOTEL_YADO} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>YADO TENKU Kyoto Nijo</a>{' '}
                and went straight to Pontocho.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Pontocho is a narrow alleyway running parallel to the Kamogawa River, lined with bars, restaurants and tiny hidden venues. We found a cocktail bar down a set of stairs that felt like a secret. Good drinks, no tourists, excellent music. Finished with ramen at a small restaurant on the strip.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/Izakaya.jpeg"
                  alt="Small Japanese bar with cocktails and low lighting, Kyoto Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Pontocho at night. Every door hides something worth finding.
              </p>

              {/* DAY: May 3 */}
              <DayBadge label="May 3 - Kyoto Temples" />
              <SectionH2>Nijo Castle, Sanjusangendo and Kiyomizudera</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Kyoto has 1,600 Buddhist temples and 400 Shinto shrines. We picked three and did them properly.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Nijo Castle</strong> was first. Built in 1603 as the Kyoto residence of the first Tokugawa shogun, the complex is a UNESCO World Heritage Site. The interior has &quot;nightingale floors&quot; that squeak with every footstep, an early security system. Walking them while imagining samurai doing the same is a genuinely strange and wonderful feeling.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/nijojo.jpeg"
                  alt="Nijo Castle gates and traditional Japanese architecture, Kyoto Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Nijo Castle. The floors squeak by design.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Sanjusangendo</strong> is a long hall containing 1,001 life-size statues of Kannon, the Buddhist deity of compassion. One thousand statues, standing in rows, all facing you. Not a place that leaves you indifferent.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/Sanjusangendo.jpeg"
                  alt="Sanjusangendo hall with rows of Kannon statues, Kyoto Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Sanjusangendo. 1,001 statues. Every one different.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Kiyomizudera</strong> is a temple built on a wooden stage cantilevered over a steep hillside with no nails. The view over Kyoto from the main hall platform is one of the best in the city. Go in the late afternoon when the light softens. Book a{' '}
                <a href={KLOOK_KYOTO_TEMPLE} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Kyoto temple tour via Klook</a>{' '}
                if you want a guide to bring the history to life.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/Kiyomizu-dera.jpeg"
                  alt="Kiyomizudera temple wooden stage overlooking forested hills of Kyoto Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Kiyomizudera. The platform was built without a single nail.
              </p>

              {/* DAY: May 4 */}
              <DayBadge label="May 4 - Day Trip to Nara" />
              <SectionH2>Sacred Deer, Todai-ji Temple and a Traditional Japanese House</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The train from Kyoto to Nara takes about 45 minutes. Go. Make it a full day.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Nara Park is home to approximately 1,200 sika deer that roam completely freely through the grounds, the streets and occasionally the shops. They are considered sacred messengers of the gods in Shinto tradition. They bow for the shika senbei crackers sold around the park, and they will walk up to you uninvited with complete confidence.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Book a{' '}
                <a href={KLOOK_NARA} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Nara day trip on Klook</a>{' '}
                to include a guided tour of the temples and park.
              </p>

              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/Japan-May-2025/nara%20park%20deer.jpeg', alt: 'Wild sika deer in Nara Park, Japan' },
                  { src: '/blog/Japan-May-2025/nara%20house.jpeg', alt: 'Traditional Japanese house with tatami floors, Nara Japan' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Nara deer are sacred, polite and fully aware of what you are holding. The traditional house offered one of the quietest hours of the trip.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Todai-ji Temple</strong> houses a 15-metre bronze Buddha that took decades to build. Walking through the enormous wooden gate into the main hall properly resets your sense of scale.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/todaiji%20temple.jpeg"
                  alt="Todai-ji Temple Great Buddha Hall, Nara Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Todai-ji. The statue alone is 15 metres tall.
              </p>

              {/* DAY: May 5 */}
              <DayBadge label="May 5 - Hiroshima Day Trip" />
              <SectionH2>Bullet Train to Hiroshima: Flower Festival, Peace Memorial and Gyoza</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We took the Shinkansen from Kyoto to Hiroshima early in the morning. The bullet train is one of those things you know is fast and still cannot quite believe how fast it is. Smooth, quiet, punctual to the second.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/shinkansen%20to%20hiroshima.jpeg"
                  alt="Shinkansen bullet train at platform, Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                The Shinkansen to Hiroshima. Smooth, fast and precisely on time.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                We arrived to find Hiroshima in the middle of its annual Flower Festival. The city was filled with music stages, food stalls and thousands of locals celebrating. This was not on our itinerary. We stumbled into it and it was one of the best surprises of the trip.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/hiroshima%20flower%20festival.jpeg"
                  alt="Hiroshima Flower Festival with colourful stalls and crowds, Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                The Hiroshima Flower Festival. A city celebrating life. Very deliberately.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The <strong>Peace Memorial Museum</strong> is not easy. It should not be easy. The exhibits document the atomic bombing of August 6, 1945, with photographs, personal belongings and testimony that leave you quiet for a long time afterwards. The Atomic Bomb Dome next door, one of the only structures left standing near the blast centre, is a UNESCO World Heritage Site. Go with time and patience.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Book a{' '}
                <a href={KLOOK_HIROSHIMA} target="_blank" rel="nofollow sponsored noopener" style={{ color: ORANGE, fontWeight: 600 }}>Hiroshima day trip on Klook</a>{' '}
                if travelling from Kyoto or Osaka.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/hiroshima%20dome.jpeg"
                  alt="Atomic Bomb Dome Hiroshima Peace Memorial reflected in the river, Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                The Atomic Bomb Dome. UNESCO World Heritage Site.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Hiroshima Castle offered another layer of history, and then we found a craft and gyoza festival running nearby. Cold local beer, crispy pan-fried gyoza, festival atmosphere. Hiroshima gave us the full spectrum in a single day.
              </p>

              <div className="blog-photo-duo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '2rem 0' }}>
                {[
                  { src: '/blog/Japan-May-2025/hiroshima%20castle.jpeg', alt: 'Hiroshima Castle surrounded by moat and greenery, Japan' },
                  { src: '/blog/Japan-May-2025/craftgyoza.jpeg', alt: 'Crispy pan-fried gyoza at craft festival, Hiroshima Japan' },
                ].map(({ src, alt }) => (
                  <div key={src} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 10, overflow: 'hidden' }}>
                    <Image src={src} alt={alt} fill style={{ objectFit: 'cover' }} sizes="340px" />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Hiroshima Castle and the craft gyoza festival nearby.
              </p>

              {/* DAY: May 6 */}
              <DayBadge label="May 6 - Nishiki Market" />
              <SectionH2>Nishiki Market, Kyoto&apos;s Kitchen, Before Heading to Tokyo</SectionH2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Before leaving for Tokyo we spent the morning at Nishiki Market: a narrow covered arcade five blocks long crammed with vendors selling pickled vegetables, fresh tofu, grilled skewers, dashi, mochi and every local produce imaginable. We bought snacks for the Shinkansen, ate more matcha, and headed to Kyoto Station for the bullet train east.
              </p>

              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image
                  src="/blog/Japan-May-2025/hiroshima%20market.jpeg"
                  alt="Covered Japanese market arcade with food stalls, Japan"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="700px"
                />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Nishiki Market. Go hungry. Leave very full.
              </p>

              {/* MID-ARTICLE CTA */}
              <div style={{ background: 'linear-gradient(135deg, #00447B 0%, #005fa3 100%)', borderRadius: 16, padding: 32, margin: '40px 0', textAlign: 'center', color: 'white' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.3rem', marginBottom: 12, color: 'white' }}>
                  Planning a Japan trip?
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.85)', marginBottom: 20, lineHeight: 1.6 }}>
                  Let Luna build your personalised Japan itinerary in under 30 seconds. City by city, day by day, with food picks, temple suggestions and Shinkansen tips included.
                </p>
                <a href="https://www.lunaletsgo.com/start" style={{ display: 'inline-block', background: '#FF8210', color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', padding: '14px 28px', borderRadius: 50, textDecoration: 'none' }}>
                  Plan my Japan trip
                </a>
              </div>

              {/* PRACTICAL TIPS */}
              <SectionH2>Japan Practical Tips for Osaka, Kyoto, Nara and Hiroshima</SectionH2>

              <div style={{ background: 'rgba(255,189,89,0.15)', border: `1.5px solid rgba(255,130,16,0.3)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '2rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TipIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: ORANGE }}>Wear Proper Shoes. This is Not Optional.</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: 0, lineHeight: 1.6 }}>
                  Japan involves enormous amounts of walking: 20,000 steps on a slow day, 30,000 on a busy one. One of us brought only a pair of Vans for a 15-day trip. By the end of the first week, the blisters were spectacular. Bring proper walking shoes with cushioning and ankle support. Your feet will thank you every single day.
                </p>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Street food is completely safe.</strong> Japan has exceptional food hygiene standards. Eat from market stalls, convenience stores and vending machines with confidence. The convenience store sushi at 7-Eleven and Lawson is genuinely excellent and costs almost nothing.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>The Shinkansen is worth every yen.</strong> The Japan Rail Pass covers most routes and pays for itself quickly on multi-city trips. Buy it before leaving home. Pick up your beer and bento from the platform kiosks before boarding.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>Matcha is everywhere and it is outstanding.</strong> Hot matcha, matcha ice cream, matcha KitKats. Say yes to all of it.
              </p>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                <strong>People will help you without being asked.</strong> Stand at a train map looking slightly confused and someone will walk over. This happened constantly.
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
                    { q: 'Is Japan expensive to travel?', a: 'Japan is mid-range. Budget travellers can eat very well for under 2,000 yen per meal at market stalls and convenience stores. The Japan Rail Pass saves significant money on multi-city trips.' },
                    { q: 'What is the best way to get between Osaka, Kyoto and Nara?', a: 'Osaka to Kyoto is 15 minutes on the Shinkansen or 30 minutes on the Hankyu line. Kyoto to Nara takes around 45 minutes by JR Nara Line. All are easy, frequent and affordable.' },
                    { q: 'When is the best time to visit Japan?', a: 'Spring (late March to early May) for cherry blossoms is one of the most beautiful times, though it is busy. Autumn (October to November) for foliage is equally stunning. Summer is hot and humid.' },
                    { q: 'Is street food in Japan safe?', a: 'Completely. Japan has world-class food hygiene standards. Market stalls, convenience stores and street vendors are all safe.' },
                    { q: 'Can you visit Nara as a day trip from Kyoto?', a: 'Yes, easily. Around 45 minutes each way by train. A full day is enough for the park, Todai-ji and the streets without rushing.' },
                    { q: 'Is the Hiroshima Peace Memorial Museum worth visiting?', a: 'Absolutely, though emotionally heavy. Set aside 2 to 3 hours. The Atomic Bomb Dome is adjacent and included in the same visit.' },
                    { q: 'What was the best food experience in Osaka?', a: 'Kuromon Market was exceptional: bluefin tuna, wagyu skewers, king crab and giant oysters all in one place. The Feast Like a Local food tour was equally unforgettable.' },
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
                  <li><Link href="/blog/japan-may-2025-part-2" style={{ color: ORANGE, fontWeight: 600, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Continue reading: Japan Part 2, Tokyo, Mt Fuji, Osaka Expo and Super Nintendo World</Link></li>
                  <li><Link href="/start" style={{ color: NAVY, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Ready to plan your Japan trip? Let Luna build your itinerary in 30 seconds</Link></li>
                  <li><Link href="/blog" style={{ color: NAVY, fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Read more travel stories from Wilson and Fatima</Link></li>
                </ul>
              </div>

              {/* Final CTA */}
              <div style={{ background: 'linear-gradient(135deg, #FF8210 0%, #FFBD59 100%)', borderRadius: 16, padding: 32, margin: '40px 0', textAlign: 'center' }}>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.3rem', marginBottom: 12, color: 'white' }}>
                  Japan is waiting. Let Luna plan it for you.
                </h3>
                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)', marginBottom: 20, lineHeight: 1.6 }}>
                  Free. Personalised. Ready in under 30 seconds. Multi-city Japan routes, Shinkansen timing, food picks and hotel suggestions all in one plan.
                </p>
                <a href="https://www.lunaletsgo.com/start" style={{ display: 'inline-block', background: '#00447B', color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '0.95rem', padding: '14px 28px', borderRadius: 50, textDecoration: 'none' }}>
                  Start planning
                </a>
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
                {['Japan', 'Osaka', 'Kyoto', 'Nara', 'Hiroshima', 'Food', 'Culture', 'Temples', 'Couples Travel', 'Asia'].map(tag => (
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

            {/* Sidebar */}
            <aside>

              {/* Trip Snapshot */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Trip Snapshot
                </div>
                {[
                  { label: 'Destinations', value: 'Osaka, Kyoto, Nara, Hiroshima' },
                  { label: 'Duration', value: '7 days' },
                  { label: 'When', value: 'May 2025' },
                  { label: 'Dates', value: 'Apr 30 to May 6' },
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
                    {['Food', 'Culture', 'Temples', 'City'].map(tag => (
                      <span key={tag} style={{ background: 'rgba(0,68,123,0.08)', color: NAVY, fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <a href="/plan" style={{ display: 'block', background: ORANGE, color: '#fff', textAlign: 'center', padding: '0.85rem', borderRadius: 10, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: '1.25rem' }}>
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
                    'Kuromon Market: tuna, wagyu, oysters',
                    'Feast Like a Local food tour, Osaka',
                    'Pontocho alleyway at night, Kyoto',
                    'Kiyomizudera in the late afternoon',
                    'Nara deer and Todai-ji Temple',
                    'Hiroshima Peace Memorial Museum',
                    'Hiroshima Flower Festival (early May)',
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
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, marginBottom: 4 }}>Hotel Hillarys Shinsaibashi</div>
                    <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>Osaka · Apr 30 to May 2</div>
                    <a href={HOTEL_HILLARYS} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 8, textDecoration: 'none' }}>
                      Check on Booking.com
                    </a>
                  </div>
                  <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                    <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: NAVY, marginBottom: 4 }}>YADO TENKU Kyoto Nijo</div>
                    <div style={{ fontSize: 12, color: GRAY, marginBottom: 8 }}>Kyoto · May 2 to May 6</div>
                    <a href={HOTEL_YADO} target="_blank" rel="nofollow sponsored noopener" style={{ display: 'inline-block', background: ORANGE, color: '#fff', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 12, padding: '8px 14px', borderRadius: 8, textDecoration: 'none' }}>
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
                <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.6, margin: 0 }}>
                  The <strong>Japan Rail Pass</strong> covers Shinkansen routes and pays for itself quickly on multi-city trips. Buy before leaving home. Within cities, the subway and local trains are excellent. Suica or Pasmo IC cards work on almost everything.
                </p>
              </div>

            </aside>
          </div>

        </div>
      </main>

      {/* Comments */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <CommentsSection postSlug="japan-may-2025-part-1" />
      </div>

      {/* Affiliate disclaimer footer */}
      <div style={{ background: '#f0f0f0', padding: '1rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem', color: GRAY, maxWidth: 700, margin: '0 auto' }}>
          <strong>Disclosure:</strong> Luna Let&apos;s Go earns a small commission when you book through affiliate links (Booking.com, Klook) at no extra cost to you. We only link to places and services we have actually used or genuinely recommend. Thank you for supporting our small team.
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
      `}</style>
    </>
  );
}
