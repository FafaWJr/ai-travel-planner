'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import NavBar from '@/components/NavBar';
import { createClient } from '@/lib/supabase/client';
import { trackQuizStarted, trackQuizCompleted, trackDestinationSelected } from '@/lib/analytics';

/* ── Types ── */
interface QuizPersona {
  id: string;
  name: string;
  travelStyle: string;
  description: string;
  travelProfile: string;
  tripStyle: string;
  askLuna: string[];
  destinations: string[];
}

/* ── Quiz questions ── */
const QUIZ_QUESTIONS = [
  {
    question: 'What does your ideal trip feel like?',
    options: [
      { label: 'Total switch-off — sun, calm, zero plans', value: 'vibe_relax' },
      { label: 'Thrill-seeking and pushing my limits', value: 'vibe_adventure' },
      { label: 'Discovering culture, history and local life', value: 'vibe_culture' },
      { label: 'Partying hard and making unforgettable nights', value: 'vibe_party' },
      { label: 'Romantic and intimate, just the two of us', value: 'vibe_romance' },
      { label: 'Fun and safe for the whole family', value: 'vibe_family' },
    ],
  },
  {
    question: 'How do you spend your evenings on a trip?',
    options: [
      { label: 'Early dinner, quiet walk, early night', value: 'eve_quiet' },
      { label: 'Tasting menus, wine and great conversation', value: 'eve_dining' },
      { label: 'Club or beach party until sunrise', value: 'eve_club' },
      { label: 'Cultural show, live music or a local event', value: 'eve_cultural' },
      { label: 'Reviewing the day\'s shots and planning tomorrow\'s golden hour', value: 'eve_photo' },
      { label: 'Campfire or stargazing after a day outdoors', value: 'eve_outdoor' },
    ],
  },
  {
    question: 'Who are you travelling with?',
    options: [
      { label: 'Solo — just me and my curiosity', value: 'who_solo' },
      { label: 'My partner — this is our special trip', value: 'who_partner' },
      { label: 'A big group of friends', value: 'who_friends' },
      { label: 'My family including kids', value: 'who_family' },
      { label: 'A small luxury group or couple', value: 'who_luxury_group' },
      { label: 'Whoever I meet along the way', value: 'who_anyone' },
    ],
  },
  {
    question: 'What is your main priority on a trip?',
    options: [
      { label: 'Eating and drinking the best local food and wine', value: 'pri_food' },
      { label: 'Capturing stunning photos and content', value: 'pri_photo' },
      { label: 'Attending a specific festival, event or concert', value: 'pri_festival' },
      { label: 'Checking into the finest hotels and experiences', value: 'pri_luxury' },
      { label: 'Getting off the beaten path and finding hidden gems', value: 'pri_explore' },
      { label: 'Completely disconnecting and recharging', value: 'pri_recharge' },
    ],
  },
  {
    question: 'What is your budget approach?',
    options: [
      { label: 'I stretch every dollar — value is everything', value: 'budget_low' },
      { label: 'Mid-range — comfortable without going overboard', value: 'budget_mid' },
      { label: 'Luxury — money is no object on holiday', value: 'budget_high' },
      { label: 'I save on sleep and spend big on experiences', value: 'budget_exp' },
      { label: 'I spend whatever it takes to be at the best events', value: 'budget_events' },
      { label: 'Family budget — value and practicality first', value: 'budget_family' },
    ],
  },
  {
    question: 'How long is your ideal trip?',
    options: [
      { label: 'A long weekend — 3 to 4 days', value: 'dur_short' },
      { label: 'A classic week — 7 days', value: 'dur_week' },
      { label: 'Two full weeks to really settle in', value: 'dur_two_weeks' },
      { label: 'A month or more — I like to live somewhere', value: 'dur_long' },
      { label: 'Just long enough to catch the event I am going for', value: 'dur_event' },
      { label: 'As long as possible — no fixed return date', value: 'dur_open' },
    ],
  },
];

/* ── Persona results ── */
const QUIZ_RESULTS: QuizPersona[] = [
  {
    id: 'explorer',
    name: 'The Explorer',
    travelStyle: 'Off the Beaten Path',
    description: 'You live for the thrill of discovery. Guidebooks bore you. You want the street nobody else found, the village nobody else visited, and the story nobody else has.',
    travelProfile: 'Independent, curious, adaptable and always hungry for the unexpected. You plan loosely and leave room for magic.',
    tripStyle: 'Mix of transport modes, guesthouses and local stays, flexible itinerary with room for detours, and at least one moment that surprises you.',
    askLuna: [
      'What hidden spots should I add to my trip that most tourists miss?',
      'Can you redesign my Day 3 to include a lesser-known area?',
      'What local experiences can replace the touristy activities in my plan?',
    ],
    destinations: [
      'Georgia (Caucasus)', 'Albania', 'Kyrgyzstan', 'Oaxaca, Mexico',
      'Faroe Islands', 'Northern Vietnam', 'Mozambique', 'Patagonia, Argentina',
    ],
  },
  {
    id: 'foodie',
    name: 'The Foodie',
    travelStyle: 'Taste-Led Travel',
    description: 'Your itinerary is built around meals. You research restaurants before flights, wake up for morning markets, and judge a city by its street food.',
    travelProfile: 'Passionate, adventurous palate, willing to queue for the best bite in town, always asking locals where they actually eat.',
    tripStyle: 'Neighbourhood food walks, market visits, at least one cooking class, curated restaurant list from local chefs, and a wine or spirits trail.',
    askLuna: [
      'Can you add the best local market to Day 1 of my trip?',
      'Replace the generic restaurant on Day 4 with something the locals actually go to.',
      'What street food should I absolutely not miss in this destination?',
    ],
    destinations: [
      'San Sebastian, Spain', 'Bologna, Italy', 'Chiang Mai, Thailand',
      'Tokyo, Japan', 'Mexico City, Mexico', 'Lyon, France',
      'Lima, Peru', 'Marrakech, Morocco',
    ],
  },
  {
    id: 'relaxer',
    name: 'The Relaxer',
    travelStyle: 'Slow Travel',
    description: 'Your holiday is a recovery. You want white sand, warm water, a good book and absolutely nothing urgent on the schedule.',
    travelProfile: 'You recharge by doing less, not more. You choose destinations over checklists and experiences over sightseeing counts.',
    tripStyle: 'Beachfront stay, lazy mornings, spa days built into the plan, minimal transfers, and evenings that end early by choice.',
    askLuna: [
      'Can you slow down the pace of Day 2 and remove back-to-back activities?',
      'Add a spa afternoon somewhere in my itinerary.',
      'Which beach in my destination is the quietest and least crowded?',
    ],
    destinations: [
      'Maldives', 'Bali, Indonesia', 'Algarve, Portugal', 'Koh Lanta, Thailand',
      'Sardinia, Italy', 'Tulum, Mexico', 'Seychelles', 'Madeira, Portugal',
    ],
  },
  {
    id: 'photographer',
    name: 'The Photographer',
    travelStyle: 'Visual Storytelling',
    description: 'You see the world through a lens. Golden hour is sacred, composition is everything, and you will get up at 5am for the perfect shot.',
    travelProfile: 'Highly visual, detail-oriented, patient and willing to wait for perfect light. You share your journey through images that stop the scroll.',
    tripStyle: 'Itinerary timed around sunrise and sunset, viewpoints mapped in advance, slow enough pacing to actually compose shots, minimal night activities.',
    askLuna: [
      'Add a sunrise activity to Day 1 and tell me the best viewpoint.',
      'Which spots in my itinerary are the most photogenic?',
      'Can you suggest a photography-focused day tour for my destination?',
    ],
    destinations: [
      'Santorini, Greece', 'Cappadocia, Turkey', 'Iceland', 'Kyoto, Japan',
      'Cinque Terre, Italy', 'Antelope Canyon, USA', 'Luang Prabang, Laos', 'Petra, Jordan',
    ],
  },
  {
    id: 'culture',
    name: 'The Culture Seeker',
    travelStyle: 'Deep Cultural Immersion',
    description: 'You come home knowing more than when you left. Museums, architecture, history and local traditions are what make a trip meaningful for you.',
    travelProfile: 'Intellectually driven, respectful of local customs, keen to understand context and history, and always looking for the story behind the place.',
    tripStyle: 'Museum mornings, historic quarter walks, local guide for context, at least one cultural workshop or performance, neighbourhood exploration.',
    askLuna: [
      'Add a locally guided history walk to my first full day.',
      'What cultural workshop or class should I book for this destination?',
      'Can you replace one of the generic activities with something more historically significant?',
    ],
    destinations: [
      'Athens, Greece', 'Kyoto, Japan', 'Istanbul, Turkey', 'Cairo, Egypt',
      'Havana, Cuba', 'Varanasi, India', 'Rome, Italy', 'Cartagena, Colombia',
    ],
  },
  {
    id: 'adventurer',
    name: 'The Adventurer',
    travelStyle: 'Adrenaline-First Travel',
    description: 'You want to come home with stories that make people say "you did what?". Physical challenge, outdoor intensity and pushing limits is the whole point.',
    travelProfile: 'Physically fit, fearless, motivated by challenge and drawn to nature. You book the hike, the jump and the climb before you book the hotel.',
    tripStyle: 'Multi-day trek, water or extreme sport, nature-based accommodation, minimal urban time, and at least one thing that scares you a little.',
    askLuna: [
      'Add a multi-day trekking segment to my trip.',
      'What is the best adventure activity available in my destination?',
      'Can you swap the city hotel for something closer to the mountains or coast?',
    ],
    destinations: [
      'Queenstown, New Zealand', 'Nepal (Himalayas)', 'Costa Rica', 'Moab, Utah, USA',
      'Swiss Alps', 'Patagonia, Chile', 'Interlaken, Switzerland', 'Azores, Portugal',
    ],
  },
  {
    id: 'luxury',
    name: 'The Luxury Traveller',
    travelStyle: 'Premium All the Way',
    description: 'You travel to be looked after. Five-star service, exceptional food, private transfers and curated experiences are not upgrades — they are the standard.',
    travelProfile: 'Discerning, quality-driven and willing to pay for the best. You research properties obsessively and notice when service falls short.',
    tripStyle: 'Five-star resort or boutique luxury property, private guided experiences, Michelin-starred meals, business class or private transfer, personalized service throughout.',
    askLuna: [
      'Upgrade my accommodation suggestions to five-star or boutique luxury options.',
      'Add a private guided experience to Day 2 instead of the group tour.',
      'What is the finest restaurant in this destination that I should book?',
    ],
    destinations: [
      'Amalfi Coast, Italy', 'St. Barts', 'Dubai, UAE', 'Bora Bora, French Polynesia',
      'Tuscany, Italy', 'Maldives Private Island', 'Monaco', 'Mykonos, Greece',
    ],
  },
  {
    id: 'family',
    name: 'The Family Planner',
    travelStyle: 'Safe, Fun, All Ages',
    description: 'Every decision on your trip is filtered through one question: will the kids love this? You are equal parts travel agent, entertainer and logistics expert.',
    travelProfile: 'Patient, organized, safety-conscious and always thinking two steps ahead. You know which activities work for all ages and which do not.',
    tripStyle: 'Kid-friendly accommodation with space, mix of theme parks and cultural activities, no back-to-back transfers, early dinners and reliable itinerary with buffer time.',
    askLuna: [
      'Make sure all activities in my plan are suitable for children.',
      'Add a theme park or interactive kids\' experience to Day 3.',
      'What family-friendly restaurant options are near my hotel?',
    ],
    destinations: [
      'Orlando, Florida, USA', 'Barcelona, Spain', 'Disneyland Paris, France',
      'Gold Coast, Australia', 'Phuket, Thailand', 'Iceland (summer)', 'Porto, Portugal', 'Tokyo, Japan',
    ],
  },
  {
    id: 'romantic',
    name: 'The Romantic',
    travelStyle: 'Couples Escapes',
    description: 'Every moment on your trip is about connection. Sunset views, private dinners, long walks and experiences shared with the person you love most.',
    travelProfile: 'Thoughtful, sentimental and attentive to atmosphere. You care about the setting as much as the activity and always look for the most intimate option.',
    tripStyle: 'Boutique hotel or private villa, candlelit dinner booking, couples experiences like cooking classes or private tours, sunsets prioritised in the itinerary.',
    askLuna: [
      'Add a sunset dinner or rooftop experience to our trip.',
      'Can you book a couples cooking class or wine tasting for Day 3?',
      'What is the most romantic neighbourhood to stay in at this destination?',
    ],
    destinations: [
      'Amalfi Coast, Italy', 'Paris, France', 'Santorini, Greece', 'Vienna, Austria',
      'Bali, Indonesia', 'Prague, Czech Republic', 'Queenstown, New Zealand', 'Maldives',
    ],
  },
  {
    id: 'solo',
    name: 'The Solo Wanderer',
    travelStyle: 'Independence and Self-Discovery',
    description: 'Travelling alone is not a compromise — it is the whole point. You make every decision on your own terms and come home knowing yourself better.',
    travelProfile: 'Self-reliant, open-minded, adaptable and genuinely comfortable in your own company. You make friends easily and enjoy the freedom of zero consensus.',
    tripStyle: 'Social hostel or guesthouse, flexible daily structure, solo-friendly group tours for socialising, evening activities in lively local areas, budget-conscious pacing.',
    askLuna: [
      'What are the best solo-friendly group tours or activities at my destination?',
      'Add a social hostel or guesthouse option to my stays.',
      'Which neighbourhoods are safest and most fun for solo travellers here?',
    ],
    destinations: [
      'Lisbon, Portugal', 'Bangkok, Thailand', 'Buenos Aires, Argentina', 'Amsterdam, Netherlands',
      'Medellin, Colombia', 'Taipei, Taiwan', 'Budapest, Hungary', 'Cape Town, South Africa',
    ],
  },
  {
    id: 'party',
    name: 'The Party Animal',
    travelStyle: 'Nightlife and Social Energy',
    description: 'Sleep is for the flight home. You travel for the nights, the music, the crowd and the stories that sound completely unbelievable on Monday morning.',
    travelProfile: 'Social, energetic, spontaneous and always the one who finds the best party in any city. You live for the moment and make friends everywhere you go.',
    tripStyle: 'Central hotel or party hostel, late starts and later finishes, rooftop bars, beach clubs, underground clubs and at least one full all-nighter built into the schedule.',
    askLuna: [
      'Add the best beach club or rooftop bar to my itinerary.',
      'What is the nightlife scene like in my destination and when is the best night to go out?',
      'Can you shift Day 2 activities to the afternoon so we can recover from the night before?',
    ],
    destinations: [
      'Ibiza, Spain', 'Mykonos, Greece', 'Bangkok, Thailand', 'Miami, USA',
      'Amsterdam, Netherlands', 'Berlin, Germany', 'Cancun, Mexico', 'Las Vegas, USA',
    ],
  },
  {
    id: 'festival',
    name: 'The Festival Chaser',
    travelStyle: 'Events-First Travel',
    description: 'You build your entire year around events. Whether it is Carnival, Tomorrowland or a local street festival, the event is the destination.',
    travelProfile: 'Organised (around events at least), culturally engaged and passionate about shared collective experiences. You have a bucket list of events, not just places.',
    tripStyle: 'Trip dates set by the event first, accommodation near the festival grounds, day-before exploration and day-after recovery built in, blend of event and local culture.',
    askLuna: [
      'What major festivals or events are happening at my destination around my travel dates?',
      'Add a recovery day after the main event in my itinerary.',
      'What should I do in the city before the festival kicks off?',
    ],
    destinations: [
      'Rio de Janeiro (Carnival)', 'Munich (Oktoberfest)', 'New Orleans (Mardi Gras)',
      'Boom, Belgium (Tomorrowland)', 'Edinburgh (Fringe Festival)',
      'Pamplona, Spain (San Fermin)', 'Chiang Mai (Lantern Festival)', 'Notting Hill, London (Carnival)',
    ],
  },
];

/* ── Scoring ── */
function calculatePersona(answers: string[]): QuizPersona {
  const scores: Record<string, number> = {};
  QUIZ_RESULTS.forEach(p => { scores[p.id] = 0; });

  const scoreMap: Record<string, Record<string, number>> = {
    vibe_relax:     { relaxer: 4, romantic: 2, luxury: 1 },
    vibe_adventure: { adventurer: 4, explorer: 2 },
    vibe_culture:   { culture: 4, explorer: 2, foodie: 1 },
    vibe_party:     { party: 4, festival: 3 },
    vibe_romance:   { romantic: 4, relaxer: 2, luxury: 2 },
    vibe_family:    { family: 5 },

    eve_quiet:    { relaxer: 3, family: 2, romantic: 1 },
    eve_dining:   { foodie: 4, luxury: 2, romantic: 1 },
    eve_club:     { party: 5, festival: 2 },
    eve_cultural: { culture: 3, festival: 3, explorer: 1 },
    eve_photo:    { photographer: 5 },
    eve_outdoor:  { adventurer: 4, explorer: 2 },

    who_solo:         { solo: 4, explorer: 2, adventurer: 1 },
    who_partner:      { romantic: 5, relaxer: 1, luxury: 1 },
    who_friends:      { party: 3, festival: 3, explorer: 1 },
    who_family:       { family: 5 },
    who_luxury_group: { luxury: 4, romantic: 2 },
    who_anyone:       { solo: 3, party: 2 },

    pri_food:     { foodie: 5, luxury: 1 },
    pri_photo:    { photographer: 5 },
    pri_festival: { festival: 5 },
    pri_luxury:   { luxury: 5 },
    pri_explore:  { explorer: 4, adventurer: 2 },
    pri_recharge: { relaxer: 4, romantic: 1 },

    budget_low:    { solo: 3, explorer: 2 },
    budget_mid:    { relaxer: 1, foodie: 1, culture: 1, family: 1, explorer: 1 },
    budget_high:   { luxury: 5, romantic: 2 },
    budget_exp:    { adventurer: 2, party: 2, festival: 2, photographer: 1 },
    budget_events: { festival: 4, party: 3 },
    budget_family: { family: 4 },

    dur_short:     { romantic: 2, party: 2, festival: 1 },
    dur_week:      { relaxer: 1, culture: 1, foodie: 1, photographer: 1 },
    dur_two_weeks: { explorer: 2, adventurer: 2, relaxer: 1 },
    dur_long:      { solo: 3, explorer: 2, adventurer: 1 },
    dur_event:     { festival: 4, party: 2 },
    dur_open:      { solo: 3, explorer: 2 },
  };

  answers.forEach(answer => {
    const mapping = scoreMap[answer];
    if (mapping) {
      Object.entries(mapping).forEach(([id, pts]) => {
        if (scores[id] !== undefined) scores[id] += pts;
      });
    }
  });

  const topId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return QUIZ_RESULTS.find(p => p.id === topId) ?? QUIZ_RESULTS[0];
}

/* ── Save persona to Supabase ── */
async function savePersonaToProfile(persona: QuizPersona): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          travel_persona: persona.name,
          travel_style: persona.travelStyle,
          persona_completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      console.error('[quiz] failed to save persona:', error);
    } else {
      console.log('[quiz] persona saved:', persona.name);
    }
  } catch (err) {
    console.error('[quiz] persona save exception:', err);
  }
}

const STEP_LABELS = ['Vibe', 'Evenings', 'Company', 'Priority', 'Budget', 'Duration'];

function QuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [persona, setPersona] = useState<QuizPersona | null>(null);
  const [showAllDests, setShowAllDests] = useState(false);

  useEffect(() => { trackQuizStarted(); }, []);

  // Resume quiz from localStorage after login redirect
  useEffect(() => {
    if (searchParams.get('resume') !== 'true') return;
    try {
      const saved = localStorage.getItem('luna_pending_quiz_v2');
      if (!saved) return;
      const { answers: savedAnswers } = JSON.parse(saved);
      if (Array.isArray(savedAnswers) && savedAnswers.length === QUIZ_QUESTIONS.length) {
        localStorage.removeItem('luna_pending_quiz_v2');
        setTimeout(() => {
          const result = calculatePersona(savedAnswers);
          setAnswers(savedAnswers);
          setPersona(result);
          trackQuizCompleted(result.name);
          savePersonaToProfile(result);
        }, 100);
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line

  const handleNext = async () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (newAnswers.length < QUIZ_QUESTIONS.length) {
      setCurrentQ(q => q + 1);
      return;
    }

    // Last question answered — finish quiz
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      try {
        localStorage.setItem('luna_pending_quiz_v2', JSON.stringify({ answers: newAnswers }));
        localStorage.setItem('luna_redirect_after_login', '/quiz?resume=true');
      } catch { /* ignore */ }
      router.push('/auth/login?next=' + encodeURIComponent('/quiz?resume=true'));
      return;
    }

    const result = calculatePersona(newAnswers);
    setPersona(result);
    trackQuizCompleted(result.name);
    savePersonaToProfile(result); // fire and forget
  };

  const handleBack = () => {
    if (currentQ === 0) return;
    const newAnswers = answers.slice(0, -1);
    setAnswers(newAnswers);
    setSelected(answers[currentQ - 1] ?? null);
    setCurrentQ(q => q - 1);
  };

  const resetQuiz = () => {
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
    setPersona(null);
    setShowAllDests(false);
  };

  const visibleDests = showAllDests
    ? (persona?.destinations ?? [])
    : (persona?.destinations ?? []).slice(0, 4);

  return (
    <div style={{ fontFamily: 'var(--font-body)', color: '#000', background: '#fff' }}>
      <NavBar />

      <section className="quiz-section" style={{ background: 'var(--navy)', minHeight: 'calc(100vh - 68px)', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(103,154,193,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,130,16,0.10) 0%, transparent 40%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--orange-light)', marginBottom: 12 }}>Not Sure Where to Go?</p>
          <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'clamp(28px,4vw,40px)', color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>Discover your traveller persona</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 48 }}>
            6 quick questions. We&apos;ll match you to one of 12 traveller types and suggest destinations built for your style.
          </p>

          {!persona ? (
            <div className="quiz-card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-lg)', padding: '40px 36px', textAlign: 'left' }}>
              {/* Progress bar */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                {STEP_LABELS.map((label, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', height: 4, borderRadius: 100, background: i < currentQ ? 'var(--orange)' : i === currentQ ? 'var(--orange-light)' : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
                    <span style={{ fontFamily: 'var(--font-head)', fontSize: 10, color: i <= currentQ ? 'var(--orange-light)' : 'rgba(255,255,255,0.25)', letterSpacing: 0.5, textTransform: 'uppercase' as const }}>{label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 28, marginTop: 16 }}>Question {currentQ + 1} of {QUIZ_QUESTIONS.length}</p>

              {/* Question */}
              <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 24, lineHeight: 1.3 }}>
                {QUIZ_QUESTIONS[currentQ].question}
              </h3>

              {/* Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {QUIZ_QUESTIONS[currentQ].options.map(opt => {
                  const isSel = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setSelected(opt.value)}
                      style={{
                        background: isSel ? 'rgba(255,130,16,0.18)' : 'rgba(255,255,255,0.06)',
                        border: `1.5px solid ${isSel ? 'var(--orange)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: 10,
                        padding: '14px 18px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-body)',
                        fontWeight: isSel ? 600 : 400,
                        fontSize: 15,
                        color: isSel ? 'var(--orange-light)' : 'rgba(255,255,255,0.80)',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSel ? 'var(--orange)' : 'rgba(255,255,255,0.3)'}`, background: isSel ? 'var(--orange)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {isSel && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {currentQ > 0 ? (
                  <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-head)', fontSize: 13, cursor: 'pointer', padding: 0 }}>Back</button>
                ) : <span />}
                <button
                  onClick={handleNext}
                  disabled={!selected}
                  style={{
                    background: selected ? 'var(--orange)' : 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontFamily: 'var(--font-head)',
                    fontWeight: 700,
                    fontSize: 15,
                    padding: '14px 32px',
                    borderRadius: 'var(--r-pill)',
                    border: 'none',
                    cursor: selected ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
                    boxShadow: selected ? '0 4px 16px rgba(255,130,16,0.30)' : 'none',
                  }}
                >
                  {currentQ < QUIZ_QUESTIONS.length - 1 ? 'Continue' : 'Reveal my persona'}
                </button>
              </div>
            </div>

          ) : (
            /* ── RESULTS ── */
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--r-lg)', padding: '40px', textAlign: 'left' }}>
              {/* Persona name + style badge */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: 'var(--orange-light)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Your Traveller Persona</p>
                <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 34, color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>{persona.name}</h2>
                <span style={{ display: 'inline-block', background: 'rgba(255,130,16,0.20)', border: '1.5px solid rgba(255,130,16,0.40)', borderRadius: 'var(--r-pill)', padding: '5px 16px', fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 13, color: 'var(--orange-light)' }}>
                  {persona.travelStyle}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'rgba(255,255,255,0.78)', lineHeight: 1.75, marginBottom: 28, borderLeft: '3px solid var(--orange)', paddingLeft: 18 }}>
                {persona.description}
              </p>

              {/* Travel Profile */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: 'var(--orange-light)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Travel Profile</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, margin: 0 }}>{persona.travelProfile}</p>
              </div>

              {/* Suggested Trip Style */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: 'var(--orange-light)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>Suggested Trip Style</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, margin: 0 }}>{persona.tripStyle}</p>
              </div>

              {/* Destinations */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: 'var(--orange-light)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Destinations for you</p>
                <div className="quiz-dest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                  {visibleDests.map(dest => (
                    <button
                      key={dest}
                      onClick={() => {
                        trackDestinationSelected(persona.name, 'quiz');
                        window.open(`/plan?destination=${encodeURIComponent(dest)}`, '_blank');
                      }}
                      className="dest-card"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1.5px solid rgba(0,68,123,0.40)',
                        borderRadius: 10,
                        padding: '12px 16px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-head)',
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#fff',
                        transition: 'all 0.18s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--orange)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,68,123,0.40)'; }}
                    >
                      <span>{dest}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.7 }}>
                        <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
                {(persona.destinations.length > 4) && (
                  <button
                    onClick={() => setShowAllDests(v => !v)}
                    style={{ marginTop: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontFamily: 'var(--font-head)', fontSize: 13, cursor: 'pointer', padding: 0 }}
                  >
                    {showAllDests ? 'Show fewer' : `Show ${persona.destinations.length - 4} more`}
                  </button>
                )}
              </div>

              {/* Ask Luna */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: 11, color: 'var(--orange-light)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>Ask Luna on your next trip</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {persona.askLuna.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => window.open(`/plan?luna_prompt=${encodeURIComponent(prompt)}`, '_blank')}
                      style={{
                        background: 'var(--navy)',
                        border: '1.5px solid rgba(103,154,193,0.30)',
                        borderRadius: 50,
                        padding: '10px 18px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-body)',
                        fontSize: 13,
                        color: '#fff',
                        lineHeight: 1.5,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--orange)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--orange)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--navy)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(103,154,193,0.30)'; }}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    trackDestinationSelected(persona.name, 'quiz');
                    window.open('/plan', '_blank');
                  }}
                  style={{ background: 'var(--orange)', color: '#fff', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 'var(--r-pill)', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,130,16,0.35)' }}
                >
                  Start Planning with Luna
                </button>
                <button
                  onClick={resetQuiz}
                  style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-head)', fontWeight: 500, fontSize: 15, padding: '14px 24px', borderRadius: 'var(--r-pill)', border: '1px solid rgba(255,255,255,0.20)', cursor: 'pointer' }}
                >
                  Retake quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 640px) {
          .quiz-card { padding: 24px 16px !important; }
          .quiz-section { padding: 80px 16px !important; }
          .quiz-dest-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={null}>
      <QuizPageInner />
    </Suspense>
  );
}
