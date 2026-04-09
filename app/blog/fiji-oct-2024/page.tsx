import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: "Bula! Fiji on a Smart Budget: Islands, Beach Clubs, and a Private Pool | Luna Let's Go",
  description: "We split 7 nights between Nadi and Matamanoa Island, did Mala Mala, Cloud 9, and Castaway Island, then packed our own beer onto the boat. Here's exactly how we did it.",
};

/* ─── Shared design tokens ────────────────────────────────────── */
const ORANGE = '#FF8210';
const NAVY   = '#00447B';
const NAVY_MID = '#679AC1';
const GRAY   = '#6C6D6F';

/* ─── Fiji flag SVG ───────────────────────────────────────────── */
function FijiFlag({ width = 26, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 26 16" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: 3, flexShrink: 0 }}>
      <rect width="26" height="16" fill="#68BFE5"/>
      <rect width="13" height="8" fill="#012169"/>
      <line x1="0" y1="0" x2="13" y2="8" stroke="white" strokeWidth="2.2"/>
      <line x1="13" y1="0" x2="0" y2="8" stroke="white" strokeWidth="2.2"/>
      <line x1="0" y1="0" x2="13" y2="8" stroke="#C8102E" strokeWidth="1.2"/>
      <line x1="13" y1="0" x2="0" y2="8" stroke="#C8102E" strokeWidth="1.2"/>
      <line x1="6.5" y1="0" x2="6.5" y2="8" stroke="white" strokeWidth="2.6"/>
      <line x1="0" y1="4" x2="13" y2="4" stroke="white" strokeWidth="2.6"/>
      <line x1="6.5" y1="0" x2="6.5" y2="8" stroke="#C8102E" strokeWidth="1.4"/>
      <line x1="0" y1="4" x2="13" y2="4" stroke="#C8102E" strokeWidth="1.4"/>
      <rect x="16" y="3.5" width="6.5" height="6" rx="1" fill="white" opacity="0.9"/>
      <rect x="16.5" y="4" width="5.5" height="5" rx="0.5" fill="#012169"/>
      <rect x="16.5" y="4" width="2.75" height="2.5" fill="#C8102E" opacity="0.7"/>
      <rect x="19.25" y="6.5" width="2.75" height="2.5" fill="#C8102E" opacity="0.7"/>
    </svg>
  );
}

/* ─── Tip box icon ────────────────────────────────────────────── */
function TipIcon() {
  return (
    <div style={{ width: 20, height: 20, background: ORANGE, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M5.5 1v4M5.5 8v1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

/* ─── Info box icon ───────────────────────────────────────────── */
function InfoIcon({ bg = NAVY }: { bg?: string }) {
  return (
    <div style={{ width: 20, height: 20, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <circle cx="5.5" cy="5.5" r="4" stroke="white" strokeWidth="1.2"/>
        <path d="M5.5 4v3M5.5 3v.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    </div>
  );
}


export default function FijiBlogPost() {
  return (
    <>
      <NavBar />

      <main style={{ paddingTop: 68, minHeight: '100vh', background: '#F7F8FA', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

          {/* Breadcrumb */}
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY, marginBottom: '2.5rem' }}>
            <Link href="/" style={{ color: NAVY, textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 6px', color: '#C0C0C0' }}>/</span>
            <Link href="/blog" style={{ color: NAVY, textDecoration: 'none' }}>Blog</Link>
            <span style={{ margin: '0 6px', color: '#C0C0C0' }}>/</span>
            Fiji on a Smart Budget
          </div>

          {/* ── Article header ── */}
          <header style={{ marginBottom: '2.5rem' }}>
            {/* Tag + flag row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-block', background: `rgba(255,130,16,0.12)`, color: ORANGE, fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '5px 14px', borderRadius: 20 }}>
                Fiji · Budget Travel · Islands
              </span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,68,123,0.07)', padding: '5px 12px', borderRadius: 20 }}>
                <FijiFlag />
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, color: NAVY }}>Fiji</span>
              </div>
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: NAVY, lineHeight: 1.2, marginBottom: '1rem', maxWidth: 780 }}>
              Bula! Fiji on a Smart Budget: Islands, Beach Clubs, and a Private Pool
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: '1.15rem', color: GRAY, lineHeight: 1.65, maxWidth: 680, marginBottom: '1.5rem', fontStyle: 'italic' }}>
              Seven nights, two destinations, one very clever strategy, and yes, we packed our own beer onto the boat to the island.
            </p>

            {/* Author + meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  WF
                </div>
                <div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14, color: NAVY }}>Wilson &amp; Fatima</div>
                  <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}>5 Oct 2024 to 12 Oct 2024</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>7 nights</strong> · Nadi + Matamanoa</div>
              <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, color: GRAY }}><strong style={{ color: NAVY }}>10 min</strong> read</div>
            </div>
          </header>

          {/* ── Hero photo ── */}
          <div style={{ position: 'relative', width: '100%', height: 420, borderRadius: 20, overflow: 'hidden', marginBottom: 12 }}>
            <Image
              src="/blog/fiji-oct-2024/Matamanoa2.JPG"
              alt="Matamanoa Island Resort aerial, Mamanuca Islands, Fiji"
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 1100px"
            />
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', fontStyle: 'italic', marginBottom: '3rem' }}>
            Matamanoa Island Resort, Mamanuca Islands, Fiji — Wilson &amp; Fatima, October 2024
          </p>

          {/* ── Article body: 2-column grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }}>

            {/* ── Main content column ── */}
            <article>

              {/* Bula intro box */}
              <div style={{ background: 'linear-gradient(135deg, #00447B 0%, #005fa3 60%, #0077b6 100%)', borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
                <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '2rem', color: '#FFBD59', marginBottom: 6, display: 'block' }}>Bula!</span>
                <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 8, display: 'block' }}>/ ˈmbula / — the most common Fijian greeting</span>
                <p style={{ fontSize: '0.96rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.7, margin: 0 }}>
                  Before anything else: <em>Bula</em>. Literally meaning "life," it is used to say hello, welcome, and hi, and is always accompanied by a warm Fijian smile. You will hear it everywhere in Fiji, from airport arrivals to resort check-in to beach volleyball. It can also mean cheers when glasses are raised, or bless you after a sneeze. If there is one word that captures Fiji's spirit, this is it.
                </p>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                When people think Fiji, they picture remote island luxury at a price that clears out the savings account. And while that version of Fiji absolutely exists, it is far from the only one available. Our seven-night trip in October 2024 proved that with the right structure, you can have the beach clubs, the private pool, the snorkeling, the floating bar at sunset, and the island serenity, without the kind of bill that haunts you for months after landing.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The secret was treating Fiji as two distinct experiences rather than one. First, Nadi. Then, the island. Here is exactly how it played out.
              </p>

              {/* Pull quote */}
              <blockquote style={{ background: 'linear-gradient(135deg, rgba(0,68,123,0.06) 0%, rgba(255,130,16,0.06) 100%)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.4rem 1.5rem', margin: '2rem 0' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.1rem', fontWeight: 500, fontStyle: 'italic', color: NAVY, margin: 0, lineHeight: 1.6 }}>
                  "We packed a carton of beers and a bag of snacks from a Nadi supermarket before boarding the boat to Matamanoa. At resort prices, every cocktail counts."
                </p>
              </blockquote>

              {/* Section: The Strategy */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                The Strategy: Two Phases, One Perfect Trip
              </h2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Nadi, on Fiji's main island of Viti Levu, operates at a completely different price point from the outer islands. Hotels are more affordable, supermarkets exist, and it sits right next to Port Denarau, the main departure hub for some of Fiji's most iconic day-trip experiences. The plan was to use Nadi as a base for the first four nights, doing everything we wanted to see and do, then check into Matamanoa Island Resort for a three-night finish of pure, uninterrupted relaxation.
              </p>

              {/* Tip box: Port Denarau */}
              <div style={{ background: 'rgba(255,189,89,0.15)', border: `1.5px solid rgba(255,130,16,0.3)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '2rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TipIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: ORANGE }}>Getting to the Day Trips</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: 0, lineHeight: 1.6 }}>
                  All three day-trip experiences below depart from <strong>Port Denarau</strong> in Nadi, not from your hotel. You will need a taxi from your hotel to the port, which takes around 15 to 20 minutes from most Nadi properties. Some tour operators offer hotel pickup, so it is worth asking when you book. We used{' '}
                  <a href="https://southseacruisesfiji.com/" target="_blank" rel="noopener noreferrer" style={{ color: NAVY }}>South Sea Cruises Fiji</a>,{' '}
                  which we highly recommend for reliability and range of destinations across the Mamanuca Islands.
                </p>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Our base in Nadi was the{' '}
                <a href="https://awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Ffj%2Fsonaisali-island-resort.html" target="_blank" rel="noopener noreferrer" style={{ color: NAVY }}>
                  DoubleTree Resort by Hilton Fiji, Sonaisali Island
                </a>,{' '}
                a comfortable, well-located hotel that set exactly the right tone for the start of the trip. Day one was intentionally low-key: pool time, a drink in hand, and the gradual unwinding that every long-haul arrival deserves.
              </p>

              {/* Section: Day 2 Mala Mala */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                Day 2: Mala Mala Beach Club
              </h2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Day two introduced us to one of the trip's genuine highlights. Mala Mala Beach Club earned every bit of its reputation. The infinity pool blurs seamlessly into the ocean horizon, the atmosphere is genuinely relaxed, and the kind of place where a couple and a family with young kids can exist in the same space and both feel entirely at home. We spent the full day there, and leaving was not easy. Highly recommended, and very family friendly.
              </p>

              {/* Photo duo: Mala Mala */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '2rem 0 0' }}>
                <div style={{ position: 'relative', height: 200, borderRadius: 14, overflow: 'hidden' }}>
                  <Image src="/blog/fiji-oct-2024/Mala%20Mala%20pool.jpeg" alt="Mala Mala Beach Club infinity pool" fill style={{ objectFit: 'cover' }} sizes="350px" />
                </div>
                <div style={{ position: 'relative', height: 200, borderRadius: 14, overflow: 'hidden' }}>
                  <Image src="/blog/fiji-oct-2024/Mala%20Mala%20pool2.jpeg" alt="Mala Mala Beach Club pool and ocean" fill style={{ objectFit: 'cover' }} sizes="350px" />
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginTop: 8, marginBottom: '2rem', fontStyle: 'italic' }}>
                Mala Mala Beach Club — whole-day vibes, chill and family friendly
              </p>

              {/* Section: Day 3 Cloud 9 */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                Day 3: Cloud 9 at Sunset
              </h2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Day three started slowly at the hotel and built into something memorable. In the afternoon, we headed out to Cloud 9, a multi-level floating bar and restaurant anchored on the open water, accessible by boat from Port Denarau. What the photos do not capture is the way the atmosphere shifts as the afternoon stretches toward evening. A DJ, wood-fired pizza, cocktails, and then the sunset: the kind of sky that turns every shade of orange and pink before the horizon swallows it whole. Nobody was ready to leave, and nobody had to.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 260, borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image src="/blog/fiji-oct-2024/Cloud.JPG" alt="Cloud 9 floating bar at sunset" fill style={{ objectFit: 'cover' }} sizes="700px" />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Cloud 9 — the sky at sunset made the whole afternoon worth it
              </p>

              {/* Section: Day 4 Castaway */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                Day 4: Castaway Island Day Trip
              </h2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Day four was the biggest day of the Nadi half. A full-day boat trip to Castaway Island, with stops along the way for snorkeling over coral reefs, exploring a white sand beach, and jumping off the boat into water so blue it barely looks real.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                For film and TV fans, Castaway Island carries a little extra history: some of the scenes from the Tom Hanks film <em>Cast Away</em> were recorded here, and the island also served as a location for the TV show <em>Survivor</em>. Standing on that beach, it is not hard to see why those productions chose this spot. The kind of day that becomes a story you tell for years.
              </p>

              <div style={{ position: 'relative', width: '100%', height: 260, borderRadius: 14, overflow: 'hidden', marginTop: '2rem', marginBottom: 8 }}>
                <Image src="/blog/fiji-oct-2024/Castaway.JPG" alt="Castaway Island, Mamanuca, Fiji" fill style={{ objectFit: 'cover' }} sizes="700px" />
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: '2rem', fontStyle: 'italic' }}>
                Castaway Island — snorkeling, exploration, and a jump off the boat
              </p>

              {/* Tip box: Nadi supermarket run */}
              <div style={{ background: 'rgba(255,189,89,0.15)', border: `1.5px solid rgba(255,130,16,0.3)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '2rem 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <TipIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: ORANGE }}>Luna's Tip: The Nadi Supermarket Run</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: '0 0 8px', lineHeight: 1.6 }}>
                  Before leaving Nadi for the island, do a supermarket run. Pick up a carton of beer, water, and snacks. The resort on Matamanoa is stunning but food and drink are expensive, and your options are limited to a single restaurant with a short menu that changes daily. Coming prepared makes a real difference to your total trip cost.
                </p>
                <p style={{ fontSize: '0.92rem', color: '#4a3000', margin: 0, lineHeight: 1.6 }}>
                  We brought our own beers and snacks, had a solid breakfast each morning (included in our stay), nibbled through the afternoon, and had dinner at the resort restaurant each night. That routine worked well and kept costs manageable.
                </p>
              </div>

              {/* Section: Days 5–7 Matamanoa */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                Days 5 to 7: Matamanoa Island Resort
              </h2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                After a final morning at the Hilton pool, we transferred by boat in the afternoon to{' '}
                <a href="https://awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Ffj%2Fmatamanoa-island-resort.html" target="_blank" rel="noopener noreferrer" style={{ color: NAVY }}>
                  Matamanoa Island Resort
                </a>.{' '}
                Even the approach is cinematic: a volcanic island rising from the Pacific, fringed with white sand and turquoise reef, with a handful of traditional bures visible through the palms.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                From that moment on, the pace changed completely. Our room came with a private plunge pool looking straight out at the ocean. No plan, no agenda. Morning coffee by the pool, a slow wander to the beach, back to the private pool, lunch, repeat. The resort also has a beautiful main infinity pool, live music most evenings, and a full program of daily activities including beach volleyball, kayaking, and snorkeling whenever you want them.
              </p>

              {/* Photo duo: Matamanoa */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '2rem 0 0' }}>
                <div style={{ position: 'relative', height: 220, borderRadius: 14, overflow: 'hidden' }}>
                  <Image src="/blog/fiji-oct-2024/Matamanoa-private%20pool.jpeg" alt="Private plunge pool at Matamanoa Island Resort" fill style={{ objectFit: 'cover' }} sizes="350px" />
                </div>
                <div style={{ position: 'relative', height: 220, borderRadius: 14, overflow: 'hidden' }}>
                  <Image src="/blog/fiji-oct-2024/Matamanoa2.JPG" alt="Matamanoa Island aerial view" fill style={{ objectFit: 'cover' }} sizes="350px" />
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: GRAY, textAlign: 'center', marginTop: 8, marginBottom: '2rem', fontStyle: 'italic' }}>
                Matamanoa Island Resort — private pool bures, volcanic island backdrop
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                The staff deserves a dedicated mention. Every single person working at Matamanoa was genuinely warm and attentive. It did not feel like performance. It felt like they actually wanted you to have the time of your life, and they succeeded.
              </p>

              {/* Pull quote 2 */}
              <blockquote style={{ background: 'linear-gradient(135deg, rgba(0,68,123,0.06) 0%, rgba(255,130,16,0.06) 100%)', borderLeft: `4px solid ${ORANGE}`, borderRadius: '0 12px 12px 0', padding: '1.4rem 1.5rem', margin: '2rem 0' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.1rem', fontWeight: 500, fontStyle: 'italic', color: NAVY, margin: 0, lineHeight: 1.6 }}>
                  "Three days in paradise with your own private pool, the sound of the ocean, and no particular reason to be anywhere. That is exactly what a holiday should feel like."
                </p>
              </blockquote>

              {/* Section: The Bird */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                The Matamanoa Bird: What Nobody Tells You
              </h2>

              {/* Info box: bird */}
              <div style={{ background: `rgba(103,154,193,0.12)`, border: `1.5px solid rgba(0,68,123,0.2)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '0 0 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <InfoIcon />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: NAVY }}>The Nocturnal Storm Petrel</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#002244', margin: '0 0 10px', lineHeight: 1.65 }}>
                  Matamanoa Island Resort is one of only two islands in Fiji known to be a breeding ground for the <strong>Nocturnal Storm Petrel</strong>, a rare burrowing seabird that nests in the island's rocky northern areas. These birds produce calls that sound remarkably like a crying baby or howling, and they are loud. The noise runs roughly from 9 PM to 4 AM and can be intense for guests in bures near the northern end of the island, particularly around the Oceanfront Villas.
                </p>
                <p style={{ fontSize: '0.92rem', color: '#002244', margin: '0 0 12px', lineHeight: 1.65 }}>
                  The breeding season runs from December to mid-May, so if you are visiting during those months, earplugs are genuinely recommended. We visited in October, outside the peak breeding period, and still noticed them on the first couple of nights before tuning them out completely by day three.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    { label: 'Breeding season:', value: 'December to mid-May (noisiest period)' },
                    { label: 'Active hours:', value: 'approx. 9 PM to 4 AM' },
                    { label: 'Location:', value: 'northern end of the island, near Oceanfront Villas' },
                    { label: 'Conservation note:', value: 'one of only two Fijian breeding sites for this species' },
                    { label: 'Tip:', value: 'request a room away from the north end if visiting Dec to May' },
                  ].map((item, i, arr) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', fontSize: '0.88rem', color: '#002244', borderBottom: i < arr.length - 1 ? '1px solid rgba(0,68,123,0.1)' : 'none' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: NAVY_MID, marginTop: 7, flexShrink: 0 }} />
                      <span><strong>{item.label}</strong> {item.value}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Fascinating from a conservation standpoint, and yes, slightly annoying on the first night. By day three you will not even notice. We promise.
              </p>

              {/* Section: The Honest Downsides */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                The Honest Downsides
              </h2>

              {/* Downside box */}
              <div style={{ background: 'rgba(108,109,111,0.07)', border: `1.5px solid rgba(108,109,111,0.2)`, borderRadius: 12, padding: '1.2rem 1.4rem', margin: '0 0 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <InfoIcon bg={GRAY} />
                  <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: GRAY }}>Things to Know Before You Go</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: '#3a3a3a', margin: '0 0 8px', lineHeight: 1.6 }}>
                  <strong>Food options are very limited.</strong> The resort restaurant is your only option on the island. The menu changes daily but typically offers just three or four choices for both lunch and dinner, at premium island prices. The quality is good, but if you are someone who likes variety, this is the reality of remote island life.
                </p>
                <p style={{ fontSize: '0.92rem', color: '#3a3a3a', margin: '0 0 8px', lineHeight: 1.6 }}>
                  Our approach: take full advantage of the included breakfast every morning (we ate well), snack through the afternoon from supplies we brought from Nadi, and have dinner at the resort restaurant each night. It worked out well both logistically and for the budget.
                </p>
                <p style={{ fontSize: '0.92rem', color: '#3a3a3a', margin: 0, lineHeight: 1.6 }}>
                  <strong>The birds.</strong> Covered above. Less of a problem outside the December to May breeding season, but worth knowing regardless.
                </p>
              </div>

              {/* Section: The Verdict */}
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '1.4rem', color: NAVY, margin: '2.5rem 0 1rem', position: 'relative', paddingLeft: '1.1rem' }}>
                <span style={{ position: 'absolute', left: 0, top: '0.2em', bottom: '0.2em', width: 4, background: ORANGE, borderRadius: 2 }} />
                The Verdict
              </h2>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '1.5rem' }}>
                Fiji delivered everything it promised and more. The two-phase structure made the trip feel fuller, more varied, and significantly more affordable without sacrificing a single moment of luxury. The Nadi days were genuinely some of the best travel days we have had. Mala Mala, Cloud 9, and Castaway Island are all experiences worth coming to Fiji for on their own. Together, they made a first half that was hard to top.
              </p>

              <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: '#2a2a3e', marginBottom: '2rem' }}>
                And Matamanoa? The private pool, the ocean view, the endless blue, the staff who treated you like the only guests on the island. Three days that felt like a full reset. Bula to that.
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f0f0f0' }}>
                {['Fiji', 'Island Hopping', 'Budget Travel', 'Matamanoa', 'Mala Mala', 'Cloud 9', 'Castaway Island', 'South Sea Cruises', 'Couples', 'Adults Only'].map(tag => (
                  <span key={tag} style={{ background: 'rgba(0,68,123,0.08)', color: NAVY, fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20 }}>
                    {tag}
                  </span>
                ))}
              </div>

            </article>

            {/* ── Sidebar ── */}
            <aside>

              {/* Trip Snapshot */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Trip Snapshot
                </div>

                {[
                  { label: 'Destination', value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FijiFlag width={18} height={11} /> Fiji</span> },
                  { label: 'Duration', value: '7 nights' },
                  { label: 'When', value: 'October 2024' },
                  { label: 'Dates', value: '5 Oct – 12 Oct' },
                  { label: 'Base 1', value: 'Nadi (4 nights)' },
                  { label: 'Base 2', value: 'Matamanoa (3 nights)' },
                  { label: 'Travellers', value: 'Couple' },
                  { label: 'Currency', value: 'Fijian Dollar (FJD)' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                    <span style={{ color: GRAY }}>{label}</span>
                    <span style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: NAVY, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
                  </div>
                ))}

                {/* Trip style */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', fontSize: 13 }}>
                  <span style={{ color: GRAY, paddingTop: 2 }}>Trip Style</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end', maxWidth: '60%' }}>
                    {['Beach', 'Party', 'Nature', 'Adventurous'].map(tag => (
                      <span key={tag} style={{ background: 'rgba(0,68,123,0.08)', color: NAVY, fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 10, whiteSpace: 'nowrap' }}>{tag}</span>
                    ))}
                  </div>
                </div>

                <a href="/" style={{ display: 'block', background: ORANGE, color: '#fff', textAlign: 'center', padding: '0.85rem', borderRadius: 10, fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: '1.25rem' }}>
                  Plan your Fiji trip
                </a>
              </div>

              {/* Trip Highlights */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Trip Highlights
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {[
                    'Mala Mala Beach Club (all-day infinity pool)',
                    'Cloud 9 floating bar at sunset with DJ',
                    'Castaway Island: snorkeling & movie history',
                    'Private plunge pool at Matamanoa',
                    'Live music and beach volleyball on the island',
                    'The warmest, most genuine staff in Fiji',
                  ].map((item, i, arr) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none', fontSize: 13, color: '#2a2a3e' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, marginTop: 5, flexShrink: 0 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hotels */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)', marginBottom: '1.5rem' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Hotels in This Story
                </div>

                {[
                  {
                    name: 'DoubleTree Resort by Hilton Fiji',
                    sub: 'Sonaisali Island, Nadi · Nights 1–4',
                    href: 'https://awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Ffj%2Fsonaisali-island-resort.html',
                  },
                  {
                    name: 'Matamanoa Island Resort',
                    sub: 'Matamanoa Island, Mamanuca · Nights 5–7',
                    href: 'https://awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Ffj%2Fmatamanoa-island-resort.html',
                  },
                ].map((hotel, i, arr) => (
                  <a
                    key={i}
                    href={hotel.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none', textDecoration: 'none' }}
                  >
                    <div>
                      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 600, color: NAVY }}>{hotel.name}</div>
                      <div style={{ fontSize: 12, color: GRAY, marginTop: 2 }}>{hotel.sub}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                      <path d="M4 8H12M9 5L12 8L9 11" stroke={ORANGE} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ))}

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,100,180,0.08)', borderRadius: 6, padding: '5px 8px', fontFamily: "'Poppins', sans-serif", fontSize: 10, fontWeight: 600, color: '#00448b', marginTop: 12 }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="#00448b" strokeWidth="1.2"/>
                    <path d="M4 6l1.5 1.5L8 4" stroke="#00448b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Links open on Booking.com via affiliate
                </div>
              </div>

              {/* Day trip operator */}
              <div style={{ background: 'rgba(0,68,123,0.04)', border: `1.5px solid rgba(0,68,123,0.12)`, borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 16px rgba(0,68,123,0.08)' }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${ORANGE}` }}>
                  Day Trip Operator
                </div>
                <p style={{ fontSize: 13, color: GRAY, lineHeight: 1.6, margin: 0 }}>
                  We booked all three day trips through{' '}
                  <strong>
                    <a href="https://southseacruisesfiji.com/" target="_blank" rel="noopener noreferrer" style={{ color: NAVY }}>South Sea Cruises Fiji</a>
                  </strong>.{' '}
                  Reliable, well-organised, and great coverage of the Mamanuca Islands. Departs from Port Denarau, Nadi.
                </p>
              </div>

            </aside>
          </div>

        </div>
      </main>

      {/* Affiliate disclaimer */}
      <div style={{ background: '#f0f0f0', padding: '1rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem', color: GRAY, maxWidth: 700, margin: '0 auto' }}>
          Some hotel links in this article are affiliate links. If you book through them, Luna Let's Go earns a small commission at no extra cost to you. We only recommend places we have actually stayed in or would genuinely recommend.
        </p>
      </div>
    </>
  );
}
