'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Waves, Landmark, Music, Mountain, UtensilsCrossed, Camera, Ticket,
  Star, Heart, Users, Compass, Map, Moon, Wine, Zap, Radio,
  Theater, SunDim, Flame, Gamepad2, User, Baby, Crown, Shuffle,
  Music2, Aperture, ChefHat, TreePine, Volume, Diamond, BookOpen,
  Shield, CalendarDays, MapPin, ClipboardList, Scale, Anchor,
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import { createClient } from '@/lib/supabase/client';
import { trackQuizStarted, trackQuizCompleted, trackDestinationSelected } from '@/lib/analytics';

/* ── Icon map ── */
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Waves, Landmark, Music, Mountain, UtensilsCrossed, Camera, Ticket,
  Star, Heart, Users, Compass, Map, Moon, Wine, Zap, Radio,
  Theater, SunDim, Flame, Gamepad2, User, Baby, Crown, Shuffle,
  Music2, Aperture, ChefHat, TreePine, Volume, Diamond, BookOpen,
  Shield, CalendarDays, MapPin, ClipboardList, Scale, Anchor,
};

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
  personaImage: string;
}

interface CardOption {
  label: string;
  value: string;
  icon: string;
}

interface CardQuestion {
  type: 'cards';
  question: string;
  subtitle: string;
  maxSelect: number;
  options: CardOption[];
}

interface SliderQuestion {
  type: 'slider';
  question: string;
  subtitle: string;
  min: number;
  max: number;
  labels: string[];
}

type QuizQuestion = CardQuestion | SliderQuestion;

/* ── Quiz questions (5 card questions, indices 0-4) ── */
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    type: 'cards',
    question: 'What excites you most about a trip?',
    subtitle: 'Pick up to 3 that feel most like you',
    maxSelect: 3,
    options: [
      { label: 'Sun, beach and switching off',    value: 'ex_beach',    icon: 'Waves' },
      { label: 'Culture, history and local life', value: 'ex_culture',  icon: 'Landmark' },
      { label: 'Parties, clubs and nightlife',    value: 'ex_party',    icon: 'Music' },
      { label: 'Hiking, sports and adrenaline',   value: 'ex_adventure',icon: 'Mountain' },
      { label: 'Food, wine and local markets',    value: 'ex_food',     icon: 'UtensilsCrossed' },
      { label: 'Photos, light and scenic views',  value: 'ex_photo',    icon: 'Camera' },
      { label: 'Festivals and major events',      value: 'ex_festival', icon: 'Ticket' },
      { label: 'Luxury, service and comfort',     value: 'ex_luxury',   icon: 'Star' },
      { label: 'Romance and intimate moments',    value: 'ex_romance',  icon: 'Heart' },
      { label: 'Family fun for all ages',         value: 'ex_family',   icon: 'Users' },
      { label: 'Solo freedom and self-discovery', value: 'ex_solo',     icon: 'Compass' },
      { label: 'Discovering hidden gems',         value: 'ex_explore',  icon: 'Map' },
    ],
  },
  {
    type: 'cards',
    question: 'What does your perfect evening look like?',
    subtitle: 'Pick up to 2',
    maxSelect: 2,
    options: [
      { label: 'Early dinner, quiet walk, in bed by 10',         value: 'eve_quiet',    icon: 'Moon' },
      { label: 'Fine dining and a great wine list',              value: 'eve_dining',   icon: 'Wine' },
      { label: 'Club or beach party until sunrise',              value: 'eve_club',     icon: 'Zap' },
      { label: 'Live music, local bar, spontaneous',             value: 'eve_music',    icon: 'Radio' },
      { label: 'Cultural show or local performance',             value: 'eve_cultural', icon: 'Theater' },
      { label: "Reviewing shots, planning tomorrow's golden hour", value: 'eve_photo',  icon: 'SunDim' },
      { label: 'Campfire or stargazing outdoors',                value: 'eve_outdoor',  icon: 'Flame' },
      { label: 'Games night with family, early bedtime',         value: 'eve_family',   icon: 'Gamepad2' },
    ],
  },
  {
    type: 'cards',
    question: 'Who is joining you on this trip?',
    subtitle: 'Pick 1',
    maxSelect: 1,
    options: [
      { label: 'Just me',                      value: 'who_solo',    icon: 'User' },
      { label: 'Me and my partner',             value: 'who_partner', icon: 'Heart' },
      { label: 'A big group of friends',        value: 'who_group',   icon: 'Users' },
      { label: 'Family including kids',         value: 'who_family',  icon: 'Baby' },
      { label: 'Small luxury group',            value: 'who_luxury',  icon: 'Crown' },
      { label: 'Whoever I meet along the way',  value: 'who_open',    icon: 'Shuffle' },
    ],
  },
  {
    type: 'cards',
    question: 'What is non-negotiable for you?',
    subtitle: 'Pick up to 3 — these are your deal-breakers',
    maxSelect: 3,
    options: [
      { label: 'Great nightlife and a party scene',      value: 'must_party',   icon: 'Music2' },
      { label: 'Stunning photography spots',             value: 'must_photo',   icon: 'Aperture' },
      { label: 'World-class food and restaurants',       value: 'must_food',    icon: 'ChefHat' },
      { label: 'Outdoor activities and nature',          value: 'must_nature',  icon: 'TreePine' },
      { label: 'Peace, quiet and zero crowds',           value: 'must_peace',   icon: 'Volume' },
      { label: 'Luxury properties and premium service',  value: 'must_luxury',  icon: 'Diamond' },
      { label: 'Cultural depth and local authenticity',  value: 'must_culture', icon: 'BookOpen' },
      { label: 'Kid-friendly and safe for families',     value: 'must_family',  icon: 'Shield' },
      { label: 'A specific festival or event',           value: 'must_event',   icon: 'CalendarDays' },
      { label: 'Being completely off the map',           value: 'must_offmap',  icon: 'MapPin' },
    ],
  },
  {
    type: 'cards',
    question: 'What best describes your travel style?',
    subtitle: 'Pick up to 2',
    maxSelect: 2,
    options: [
      { label: 'Plan everything in advance',          value: 'style_planner',    icon: 'ClipboardList' },
      { label: 'Total spontaneity, figure it out',    value: 'style_spontaneous',icon: 'Shuffle' },
      { label: 'Mix of structure and freedom',        value: 'style_balanced',   icon: 'Scale' },
      { label: 'Follow the party or the event',       value: 'style_eventdriven',icon: 'Ticket' },
      { label: 'Deep dives, slow travel',             value: 'style_deep',       icon: 'Anchor' },
      { label: 'Maximum destinations, always moving', value: 'style_fastpace',   icon: 'Zap' },
    ],
  },
];

/* ── Budget & Duration slider data ── */
const BUDGET_LEVELS = [
  { label: 'Backpacker',  sublabel: 'Hostels, street food, every dollar counts',                 value: 'budget_backpacker' },
  { label: 'Budget',      sublabel: 'Affordable hotels, local spots',                            value: 'budget_low' },
  { label: 'Mid-range',   sublabel: 'Comfortable, quality without excess',                       value: 'budget_mid' },
  { label: 'Comfort',     sublabel: 'Nice hotels, good restaurants, splurge occasionally',       value: 'budget_comfort' },
  { label: 'Luxury',      sublabel: 'Five-star, fine dining, private transfers',                 value: 'budget_luxury' },
];

const DURATION_LEVELS = [
  { label: 'Weekend',    sublabel: '2 to 4 days — quick escape',                value: 'dur_weekend' },
  { label: 'One week',   sublabel: '5 to 8 days — the classic trip',             value: 'dur_week' },
  { label: 'Two weeks',  sublabel: '9 to 14 days — really settle in',            value: 'dur_two_weeks' },
  { label: 'One month',  sublabel: '3 to 5 weeks — live somewhere for a while',  value: 'dur_month' },
  { label: 'Open-ended', sublabel: 'No return date — real freedom',              value: 'dur_open' },
];

const TOTAL_STEPS = 7; // 5 card questions + budget slider + duration slider

/* ── Personas ── */
const QUIZ_RESULTS: QuizPersona[] = [
  {
    id: 'explorer',
    name: 'The Explorer',
    travelStyle: 'Off the Beaten Path',
    description: 'You live for the thrill of discovery. Guidebooks bore you. You want the street nobody else found, the village nobody else visited, and the story nobody else can tell.',
    travelProfile: 'Independent, curious and adaptable. You plan loosely and leave room for magic. Your best memories are the ones that were not on any itinerary.',
    tripStyle: 'Mix of transport modes, guesthouses with character, flexible itinerary, at least one moment that surprises even you.',
    askLuna: [
      'What hidden spots should I add that most tourists miss?',
      'Can you redesign Day 3 to include a lesser-known area nearby?',
      'Replace the touristy activities in my plan with something local.',
    ],
    destinations: ['Georgia (Caucasus)', 'Albania', 'Kyrgyzstan', 'Oaxaca, Mexico', 'Faroe Islands', 'Northern Vietnam', 'Mozambique', 'Patagonia, Argentina'],
    personaImage: '/quiz/luna-personas/the-explorer.png',
  },
  {
    id: 'foodie',
    name: 'The Foodie',
    travelStyle: 'Taste-Led Travel',
    description: 'Your itinerary is built around meals. You research restaurants before you book flights, wake up for morning markets, and judge a city entirely by its street food.',
    travelProfile: 'Passionate, adventurous palate, willing to queue for the best bite in town. You always ask locals where they actually eat, not where they send tourists.',
    tripStyle: 'Neighbourhood food walks, market mornings, at least one cooking class, curated restaurant list from local chefs, and a wine or spirits trail.',
    askLuna: [
      'Add the best local market to Day 1 of my trip.',
      'Replace the generic restaurant on Day 4 with something the locals actually go to.',
      'What street food should I absolutely not miss here?',
    ],
    destinations: ['San Sebastian, Spain', 'Bologna, Italy', 'Chiang Mai, Thailand', 'Tokyo, Japan', 'Mexico City, Mexico', 'Lyon, France', 'Lima, Peru', 'Marrakech, Morocco'],
    personaImage: '/quiz/luna-personas/the-foodie.png',
  },
  {
    id: 'relaxer',
    name: 'The Relaxer',
    travelStyle: 'Slow Travel',
    description: 'Your holiday is a recovery. You want white sand, warm water, a good book and absolutely nothing urgent on the schedule. If you rush, you are doing it wrong.',
    travelProfile: 'You recharge by doing less, not more. You choose destinations over checklists and experiences over sightseeing counts.',
    tripStyle: 'Beachfront stay, lazy mornings, spa days in the plan, minimal transfers, and evenings that end early by choice not necessity.',
    askLuna: [
      'Slow down the pace of Day 2 and remove back-to-back activities.',
      'Add a spa afternoon somewhere in my itinerary.',
      'Which beach in my destination is the quietest and least crowded?',
    ],
    destinations: ['Maldives', 'Bali, Indonesia', 'Algarve, Portugal', 'Koh Lanta, Thailand', 'Sardinia, Italy', 'Tulum, Mexico', 'Seychelles', 'Madeira, Portugal'],
    personaImage: '/quiz/luna-personas/the-relaxer.png',
  },
  {
    id: 'photographer',
    name: 'The Photographer',
    travelStyle: 'Visual Storytelling',
    description: 'You see the world through a lens. Golden hour is sacred, composition is everything, and you will absolutely get up at 5am for the perfect shot.',
    travelProfile: 'Highly visual, detail-oriented and patient. You share your journey through images that stop the scroll. The best moment is always the one you almost missed.',
    tripStyle: 'Itinerary timed around sunrise and sunset, viewpoints mapped in advance, slow pacing to actually compose shots, minimal back-to-back activities.',
    askLuna: [
      'Add a sunrise activity to Day 1 and tell me the best viewpoint.',
      'Which spots in my itinerary are the most photogenic?',
      'Suggest a photography-focused day tour at my destination.',
    ],
    destinations: ['Santorini, Greece', 'Cappadocia, Turkey', 'Iceland', 'Kyoto, Japan', 'Cinque Terre, Italy', 'Antelope Canyon, USA', 'Luang Prabang, Laos', 'Petra, Jordan'],
    personaImage: '/quiz/luna-personas/the-photographer.png',
  },
  {
    id: 'culture',
    name: 'The Culture Seeker',
    travelStyle: 'Deep Cultural Immersion',
    description: 'You come home knowing more than when you left. Museums, architecture, history and local traditions are what make a trip genuinely meaningful.',
    travelProfile: 'Intellectually driven and respectful of local customs. You want context, not just photos. You ask why before you ask where.',
    tripStyle: 'Museum mornings, historic quarter walks, local guide for context, at least one cultural workshop or performance, neighbourhood exploration off the main drag.',
    askLuna: [
      'Add a locally guided history walk to my first full day.',
      'What cultural workshop or class should I book at this destination?',
      'Replace one generic activity with something more historically significant.',
    ],
    destinations: ['Athens, Greece', 'Kyoto, Japan', 'Istanbul, Turkey', 'Cairo, Egypt', 'Havana, Cuba', 'Varanasi, India', 'Rome, Italy', 'Cartagena, Colombia'],
    personaImage: '/quiz/luna-personas/the-culture-seeker.png',
  },
  {
    id: 'adventurer',
    name: 'The Adventurer',
    travelStyle: 'Adrenaline-First Travel',
    description: 'You want to come home with stories that make people say "you did what?". Physical challenge, outdoor intensity and pushing your limits is the whole point.',
    travelProfile: 'Physically capable, fearless and motivated by challenge. You book the hike, the jump and the climb before you even look at the hotel.',
    tripStyle: 'Multi-day trek, water sport or extreme activity, nature-based accommodation, minimal urban time, and at least one thing that scares you a little.',
    askLuna: [
      'Add a multi-day trekking segment to my trip.',
      'What is the best adventure activity available at my destination?',
      'Swap the city hotel for something closer to the mountains or coast.',
    ],
    destinations: ['Queenstown, New Zealand', 'Nepal', 'Costa Rica', 'Moab, Utah, USA', 'Swiss Alps', 'Patagonia, Chile', 'Interlaken, Switzerland', 'Azores, Portugal'],
    personaImage: '/quiz/luna-personas/the-adventurer.png',
  },
  {
    id: 'luxury',
    name: 'The Luxury Traveller',
    travelStyle: 'Premium All the Way',
    description: 'You travel to be looked after. Five-star service, exceptional food, private transfers and curated experiences are not upgrades — they are your baseline.',
    travelProfile: 'Discerning, quality-driven and unwilling to compromise. You research properties obsessively and notice immediately when service falls short.',
    tripStyle: 'Five-star resort or boutique luxury property, private guided experiences, Michelin-starred meals, business class or private transfer, personalized attention throughout.',
    askLuna: [
      'Upgrade my accommodation suggestions to five-star or boutique luxury options.',
      'Add a private guided experience to Day 2 instead of the group tour.',
      'What is the finest restaurant at this destination that I should book immediately?',
    ],
    destinations: ['Amalfi Coast, Italy', 'St Barts', 'Dubai, UAE', 'Bora Bora, French Polynesia', 'Tuscany, Italy', 'Maldives', 'Monaco', 'Mykonos, Greece'],
    personaImage: '/quiz/luna-personas/the-luxury-traveller.png',
  },
  {
    id: 'family',
    name: 'The Family Planner',
    travelStyle: 'Safe, Fun, All Ages',
    description: 'Every decision on your trip is filtered through one question: will the kids love this? You are simultaneously travel agent, entertainer and logistics wizard.',
    travelProfile: 'Patient, organised, safety-conscious and always thinking two steps ahead. You know which activities work for all ages and which end in tears.',
    tripStyle: 'Spacious family accommodation, mix of theme parks and cultural activities, no brutal back-to-back transfers, early dinners and a reliable itinerary with buffer time built in.',
    askLuna: [
      'Make sure all activities in my plan are suitable for children.',
      'Add a theme park or interactive kids experience to Day 3.',
      'What family-friendly restaurant options are near my hotel?',
    ],
    destinations: ['Orlando, Florida, USA', 'Barcelona, Spain', 'Disneyland Paris', 'Gold Coast, Australia', 'Phuket, Thailand', 'Iceland', 'Porto, Portugal', 'Tokyo, Japan'],
    personaImage: '/quiz/luna-personas/the-family-planner.png',
  },
  {
    id: 'romantic',
    name: 'The Romantic',
    travelStyle: 'Couples Escapes',
    description: 'Every moment on your trip is about connection. Sunset views, private dinners, long walks and experiences shared with the person you love most.',
    travelProfile: 'Thoughtful and attentive to atmosphere. You care about the setting as much as the activity and always look for the most intimate version of an experience.',
    tripStyle: 'Boutique hotel or private villa, candlelit dinner booked in advance, couples experiences like cooking classes or private tours, sunsets built into every day.',
    askLuna: [
      'Add a sunset dinner or rooftop experience to our trip.',
      'Book a couples cooking class or wine tasting for Day 3.',
      'What is the most romantic neighbourhood to stay in at this destination?',
    ],
    destinations: ['Amalfi Coast, Italy', 'Paris, France', 'Santorini, Greece', 'Vienna, Austria', 'Bali, Indonesia', 'Prague, Czech Republic', 'Queenstown, New Zealand', 'Maldives'],
    personaImage: '/quiz/luna-personas/the-romantic.png',
  },
  {
    id: 'solo',
    name: 'The Solo Wanderer',
    travelStyle: 'Independence and Self-Discovery',
    description: 'Travelling alone is not a compromise — it is the whole point. You make every decision on your own terms and come home knowing yourself a little better each time.',
    travelProfile: 'Self-reliant, open-minded, adaptable and genuinely comfortable in your own company. You make friends easily and love the freedom of zero consensus.',
    tripStyle: 'Social hostel or guesthouse with personality, flexible daily structure, solo-friendly group tours for socialising, evenings in lively local areas, real budget consciousness.',
    askLuna: [
      'What are the best solo-friendly group tours or activities here?',
      'Add a social hostel or guesthouse option to my stays.',
      'Which neighbourhoods are safest and most fun for solo travellers at this destination?',
    ],
    destinations: ['Lisbon, Portugal', 'Bangkok, Thailand', 'Buenos Aires, Argentina', 'Amsterdam, Netherlands', 'Medellin, Colombia', 'Taipei, Taiwan', 'Budapest, Hungary', 'Cape Town, South Africa'],
    personaImage: '/quiz/luna-personas/the-solo-wanderer.png',
  },
  {
    id: 'party',
    name: 'The Party Animal',
    travelStyle: 'Nightlife and Social Energy',
    description: 'Sleep is for the flight home. You travel for the nights, the music, the crowd and the stories that sound completely unbelievable on Monday morning.',
    travelProfile: 'Social, energetic and spontaneous. You are always the one who finds the best party in any city. You live fully in the moment and make friends everywhere you go.',
    tripStyle: 'Central hotel or party hostel, late starts and much later finishes, rooftop bars, beach clubs, underground clubs and at least one full all-nighter written into the plan.',
    askLuna: [
      'Add the best beach club or rooftop bar to my itinerary.',
      'What is the nightlife scene like here and what is the best night to go out?',
      'Shift the Day 2 activities to the afternoon so we can recover from the night before.',
    ],
    destinations: ['Ibiza, Spain', 'Mykonos, Greece', 'Bangkok, Thailand', 'Miami, USA', 'Amsterdam, Netherlands', 'Berlin, Germany', 'Cancun, Mexico', 'Las Vegas, USA'],
    personaImage: '/quiz/luna-personas/the-party-animal.png',
  },
  {
    id: 'festival',
    name: 'The Festival Chaser',
    travelStyle: 'Events-First Travel',
    description: 'You build your entire year around events. Whether it is Carnival, Tomorrowland or a local street festival, the event is not just part of the trip — it is the destination.',
    travelProfile: 'Organised at least around events. Culturally engaged and passionate about shared collective experiences. You have a bucket list of events, not just places.',
    tripStyle: 'Dates locked around the event, accommodation near the festival grounds, day-before exploration and day-after recovery built in, a blend of event intensity and local culture.',
    askLuna: [
      'What major festivals or events are happening at my destination around my travel dates?',
      'Add a recovery day after the main event in my itinerary.',
      'What should I do in the city before the festival starts?',
    ],
    destinations: ['Rio de Janeiro, Brazil', 'Munich, Germany', 'New Orleans, USA', 'Boom, Belgium', 'Edinburgh, Scotland', 'Pamplona, Spain', 'Chiang Mai, Thailand', 'London, UK'],
    personaImage: '/quiz/luna-personas/the-festival-chaser.png',
  },
];

/* ── Scoring ── */
function calculatePersona(allSelectedValues: string[]): QuizPersona {
  const scores: Record<string, number> = {};
  QUIZ_RESULTS.forEach(p => { scores[p.id] = 0; });

  const scoreMap: Record<string, Record<string, number>> = {
    ex_beach:     { relaxer: 4, romantic: 2, photographer: 1 },
    ex_culture:   { culture: 4, explorer: 2, foodie: 1 },
    ex_party:     { party: 5, festival: 2 },
    ex_adventure: { adventurer: 4, explorer: 2 },
    ex_food:      { foodie: 5, culture: 1, luxury: 1 },
    ex_photo:     { photographer: 5, explorer: 1 },
    ex_festival:  { festival: 5, party: 2 },
    ex_luxury:    { luxury: 5, romantic: 2, relaxer: 1 },
    ex_romance:   { romantic: 5, relaxer: 2, luxury: 1 },
    ex_family:    { family: 5 },
    ex_solo:      { solo: 5, explorer: 2, adventurer: 1 },
    ex_explore:   { explorer: 5, adventurer: 2, culture: 1 },

    eve_quiet:    { relaxer: 3, family: 2, romantic: 1 },
    eve_dining:   { foodie: 4, luxury: 3, romantic: 2 },
    eve_club:     { party: 5, festival: 2, solo: 1 },
    eve_music:    { solo: 3, explorer: 2, party: 2 },
    eve_cultural: { culture: 4, festival: 3, explorer: 1 },
    eve_photo:    { photographer: 5 },
    eve_outdoor:  { adventurer: 4, explorer: 2, relaxer: 1 },
    eve_family:   { family: 5, relaxer: 1 },

    who_solo:    { solo: 5, explorer: 2, adventurer: 2 },
    who_partner: { romantic: 5, luxury: 2, relaxer: 2 },
    who_group:   { party: 3, festival: 3, explorer: 2, solo: 1 },
    who_family:  { family: 5 },
    who_luxury:  { luxury: 4, romantic: 3 },
    who_open:    { solo: 4, party: 2, adventurer: 1 },

    must_party:   { party: 5, festival: 3 },
    must_photo:   { photographer: 5 },
    must_food:    { foodie: 5, luxury: 2 },
    must_nature:  { adventurer: 4, explorer: 2, relaxer: 1 },
    must_peace:   { relaxer: 4, romantic: 2, photographer: 1 },
    must_luxury:  { luxury: 5, romantic: 2 },
    must_culture: { culture: 5, explorer: 2, foodie: 1 },
    must_family:  { family: 5 },
    must_event:   { festival: 5, party: 2 },
    must_offmap:  { explorer: 5, adventurer: 3, solo: 2 },

    style_planner:     { family: 2, luxury: 2, culture: 1, romantic: 1 },
    style_spontaneous: { party: 3, solo: 3, adventurer: 2, explorer: 2 },
    style_balanced:    { relaxer: 2, explorer: 2, foodie: 2, photographer: 1 },
    style_eventdriven: { festival: 5, party: 3 },
    style_deep:        { culture: 3, explorer: 3, foodie: 2, photographer: 2 },
    style_fastpace:    { explorer: 3, adventurer: 2, solo: 2, festival: 1 },

    budget_backpacker: { solo: 4, explorer: 3, adventurer: 2 },
    budget_low:        { solo: 2, explorer: 2, adventurer: 1, culture: 1 },
    budget_mid:        { relaxer: 1, foodie: 1, culture: 1, photographer: 1, family: 1 },
    budget_comfort:    { luxury: 2, relaxer: 2, romantic: 2, foodie: 1 },
    budget_luxury:     { luxury: 5, romantic: 3, relaxer: 2 },

    dur_weekend:   { romantic: 2, party: 2, festival: 2 },
    dur_week:      { relaxer: 2, foodie: 2, culture: 2, photographer: 1 },
    dur_two_weeks: { explorer: 3, adventurer: 3, relaxer: 2, culture: 2 },
    dur_month:     { solo: 4, explorer: 4, adventurer: 2 },
    dur_open:      { solo: 5, explorer: 3, adventurer: 2 },
  };

  allSelectedValues.forEach(value => {
    const mapping = scoreMap[value];
    if (mapping) {
      Object.entries(mapping).forEach(([id, pts]) => {
        if (scores[id] !== undefined) scores[id] += pts;
      });
    }
  });

  const topId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  return QUIZ_RESULTS.find(p => p.id === topId) ?? QUIZ_RESULTS[0];
}

/* ── Save to Supabase ── */
async function savePersonaToProfile(persona: QuizPersona): Promise<void> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_preferences').upsert({
      user_id: user.id,
      travel_persona: persona.name,
      travel_style: persona.travelStyle,
      persona_completed_at: new Date().toISOString(),
      persona_image: persona.personaImage,
    }, { onConflict: 'user_id' });
    console.log('[quiz] persona saved:', persona.name);
  } catch (err) {
    console.error('[quiz] persona save error:', err);
  }
}

/* ── DestinationCard component ── */
function DestinationCard({ destination, onClick }: { destination: string; onClick: () => void }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/destination-photos?destination=${encodeURIComponent(destination)}&count=1`)
      .then(r => r.json())
      .then(data => {
        const url = data?.photos?.[0] ?? null;
        setPhotoUrl(url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [destination]);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        aspectRatio: '4/3',
        background: loading ? 'rgba(0,68,123,0.3)' : '#00447B',
        transition: 'transform 0.18s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
    >
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', animation: 'shimmer 1.6s ease-in-out infinite' }} />
      )}
      {photoUrl && (
        <img src={photoUrl} alt={destination} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)' }} />
      <div style={{ position: 'absolute', bottom: 12, left: 12, right: 40, color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>
        {destination}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, background: '#FF8210', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

/* ── Slider UI ── */
function StepSlider({
  value, onChange, levels, label,
}: {
  value: number;
  onChange: (v: number) => void;
  levels: { label: string; sublabel: string }[];
  label: string;
}) {
  const current = levels[value];
  const pct = (value / (levels.length - 1)) * 100;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 22, color: '#00447B', marginBottom: 6 }}>{current.label}</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#6C6D6F' }}>{current.sublabel}</div>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <input
          type="range"
          min={0}
          max={levels.length - 1}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="quiz-slider-light"
          style={{ '--fill': `${pct}%` } as React.CSSProperties}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        {levels.map((lvl, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === value ? '#FF8210' : 'rgba(0,68,123,0.25)',
              transition: 'background 0.2s',
            }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: i === value ? '#00447B' : '#9ca3af', fontWeight: i === value ? 600 : 400 }}>
              {lvl.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main quiz component ── */
function QuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Multi-select state (for card questions 0-4)
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  // Slider state
  const [budgetSlider, setBudgetSlider] = useState(2); // Mid-range
  const [durationSlider, setDurationSlider] = useState(1); // One week
  // Step (0-6 = questions, 7 = results)
  const [currentStep, setCurrentStep] = useState(0);
  const [quizPersona, setQuizPersona] = useState<QuizPersona | null>(null);
  const [showAllDest, setShowAllDest] = useState(false);

  useEffect(() => { trackQuizStarted(); }, []);

  // Show saved persona result (from navbar link)
  useEffect(() => {
    if (searchParams.get('show_result') !== 'true') return;
    async function loadSavedPersona() {
      try {
        const client = createClient();
        const { data: { user } } = await client.auth.getUser();
        if (!user) return;
        const { data } = await client
          .from('user_preferences')
          .select('travel_persona, persona_image')
          .eq('user_id', user.id)
          .single();
        if (!data?.travel_persona) return;
        const match = QUIZ_RESULTS.find(p => p.name === data.travel_persona);
        if (!match) return;
        const persona = data.persona_image
          ? { ...match, personaImage: data.persona_image }
          : match;
        setQuizPersona(persona);
        setCurrentStep(TOTAL_STEPS);
      } catch (err) {
        console.error('[quiz] show_result load error:', err);
      }
    }
    loadSavedPersona();
  }, [searchParams]); // eslint-disable-line

  // Resume after login
  useEffect(() => {
    if (searchParams.get('resume') !== 'true') return;
    try {
      const saved = localStorage.getItem('luna_pending_quiz_v3');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.selections) setSelections(parsed.selections);
      if (typeof parsed.budgetSlider === 'number') setBudgetSlider(parsed.budgetSlider);
      if (typeof parsed.durationSlider === 'number') setDurationSlider(parsed.durationSlider);
      localStorage.removeItem('luna_pending_quiz_v3');
      setTimeout(() => {
        const allValues = getAllSelectedValues(parsed.selections, parsed.budgetSlider ?? 2, parsed.durationSlider ?? 1);
        const result = calculatePersona(allValues);
        setQuizPersona(result);
        setCurrentStep(TOTAL_STEPS);
        trackQuizCompleted(result.name);
        savePersonaToProfile(result);
      }, 100);
    } catch { /* ignore */ }
  }, []); // eslint-disable-line

  const getAllSelectedValues = (
    sel: Record<number, string[]> = selections,
    budget: number = budgetSlider,
    duration: number = durationSlider,
  ): string[] => {
    const cardValues = Object.values(sel).flat();
    return [...cardValues, BUDGET_LEVELS[budget].value, DURATION_LEVELS[duration].value];
  };

  const toggleOption = (questionIndex: number, value: string, maxSelect: number) => {
    setSelections(prev => {
      const current = prev[questionIndex] ?? [];
      if (current.includes(value)) {
        return { ...prev, [questionIndex]: current.filter(v => v !== value) };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [questionIndex]: [...current, value] };
    });
  };

  const isStepAnswered = (step: number): boolean => {
    if (step >= 5) return true; // sliders always answered
    return (selections[step]?.length ?? 0) > 0;
  };

  // At least 3 of the 5 card questions answered
  const canSubmit = (): boolean => {
    const answeredCards = Object.keys(selections).filter(k => (selections[Number(k)]?.length ?? 0) > 0).length;
    return answeredCards >= 3;
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      try {
        localStorage.setItem('luna_pending_quiz_v3', JSON.stringify({ selections, budgetSlider, durationSlider }));
        localStorage.setItem('luna_redirect_after_login', '/quiz?resume=true');
      } catch { /* ignore */ }
      router.push('/auth/login?next=' + encodeURIComponent('/quiz?resume=true'));
      return;
    }

    const allValues = getAllSelectedValues();
    const result = calculatePersona(allValues);
    setQuizPersona(result);
    setCurrentStep(TOTAL_STEPS);
    trackQuizCompleted(result.name);
    savePersonaToProfile(result);
  };

  const resetQuiz = () => {
    setSelections({});
    setBudgetSlider(2);
    setDurationSlider(1);
    setCurrentStep(0);
    setQuizPersona(null);
    setShowAllDest(false);
  };

  const progressPct = ((currentStep) / TOTAL_STEPS) * 100;
  const isCardStep = currentStep < 5;
  const isBudgetStep = currentStep === 5;
  const isDurationStep = currentStep === 6;
  const showResults = currentStep === TOTAL_STEPS && quizPersona;

  const visibleDest = showAllDest
    ? (quizPersona?.destinations ?? [])
    : (quizPersona?.destinations ?? []).slice(0, 4);

  /* ── RENDER ── */
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: '#000', background: '#00447B', minHeight: '100vh' }}>
      <NavBar />

      <section style={{ minHeight: 'calc(100vh - 68px)', padding: '48px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Background radial glow */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(103,154,193,0.18) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,130,16,0.12) 0%, transparent 40%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          {!showResults && (
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#FFBD59', marginBottom: 10 }}>
                Find your travel style
              </p>
              <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 'clamp(26px,4vw,38px)', color: '#fff', marginBottom: 0, lineHeight: 1.2 }}>
                Discover your traveller persona
              </h1>
            </div>
          )}

          {/* Quiz card */}
          {!showResults ? (
            <div className="quiz-card" style={{ background: '#fff', borderRadius: 20, padding: '40px 36px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              {/* Progress */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9ca3af' }}>Step {currentStep + 1} of {TOTAL_STEPS}</span>
                  <button
                    onClick={handleSkip}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#9ca3af', padding: 0 }}
                  >
                    Skip
                  </button>
                </div>
                <div style={{ width: '100%', height: 4, background: 'rgba(0,68,123,0.10)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: '#FF8210', borderRadius: 2, transition: 'width 0.3s ease' }} />
                </div>
              </div>

              {/* Card questions (steps 0-4) */}
              {isCardStep && (() => {
                const q = QUIZ_QUESTIONS[currentStep] as CardQuestion;
                const stepSel = selections[currentStep] ?? [];
                const maxReached = stepSel.length >= q.maxSelect;

                return (
                  <div>
                    <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 22, color: '#00447B', marginBottom: 6, lineHeight: 1.3 }}>
                      {q.question}
                    </h2>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#6C6D6F', marginBottom: 6 }}>{q.subtitle}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#FFBD59', marginBottom: 20, fontWeight: 600 }}>
                      {stepSel.length} of {q.maxSelect} selected
                    </p>

                    <div className="quiz-options-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
                      {q.options.map(opt => {
                        const isSel = stepSel.includes(opt.value);
                        const isDimmed = maxReached && !isSel;
                        const IconComp = ICON_MAP[opt.icon];

                        return (
                          <button
                            key={opt.value}
                            onClick={() => toggleOption(currentStep, opt.value, q.maxSelect)}
                            disabled={isDimmed}
                            style={{
                              background: isSel ? '#FF8210' : '#fff',
                              border: `1.5px solid ${isSel ? '#FF8210' : 'rgba(0,68,123,0.15)'}`,
                              borderRadius: 12,
                              padding: '14px 16px',
                              cursor: isDimmed ? 'default' : 'pointer',
                              opacity: isDimmed ? 0.35 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              transition: 'all 0.15s ease',
                              textAlign: 'left',
                            }}
                            onMouseEnter={e => {
                              if (!isSel && !isDimmed) {
                                (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF8210';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSel && !isDimmed) {
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,68,123,0.15)';
                              }
                            }}
                          >
                            {IconComp && (
                              <IconComp size={20} color={isSel ? '#fff' : '#679AC1'} />
                            )}
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: isSel ? 600 : 400, color: isSel ? '#fff' : '#00447B', lineHeight: 1.35 }}>
                              {opt.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Budget slider (step 5) */}
              {isBudgetStep && (
                <div>
                  <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 22, color: '#00447B', marginBottom: 6 }}>
                    What is your budget style?
                  </h2>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#6C6D6F', marginBottom: 32 }}>
                    Drag the slider or tap a level
                  </p>
                  <StepSlider value={budgetSlider} onChange={setBudgetSlider} levels={BUDGET_LEVELS} label="Budget" />
                </div>
              )}

              {/* Duration slider (step 6) */}
              {isDurationStep && (
                <div>
                  <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 22, color: '#00447B', marginBottom: 6 }}>
                    How long do you want to travel?
                  </h2>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#6C6D6F', marginBottom: 32 }}>
                    Drag the slider or tap a duration
                  </p>
                  <StepSlider value={durationSlider} onChange={setDurationSlider} levels={DURATION_LEVELS} label="Duration" />
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                {currentStep > 0 ? (
                  <button
                    onClick={handleBack}
                    style={{ background: 'none', border: '1.5px solid rgba(0,68,123,0.20)', borderRadius: 50, padding: '11px 24px', fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: 14, color: '#00447B', cursor: 'pointer' }}
                  >
                    Back
                  </button>
                ) : <span />}

                {currentStep < TOTAL_STEPS - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={isCardStep && !isStepAnswered(currentStep)}
                    style={{
                      background: (isCardStep && !isStepAnswered(currentStep)) ? '#e5e7eb' : '#FF8210',
                      color: (isCardStep && !isStepAnswered(currentStep)) ? '#9ca3af' : '#fff',
                      border: 'none',
                      borderRadius: 50,
                      padding: '12px 32px',
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: (isCardStep && !isStepAnswered(currentStep)) ? 'not-allowed' : 'pointer',
                      boxShadow: (isCardStep && !isStepAnswered(currentStep)) ? 'none' : '0 4px 16px rgba(255,130,16,0.30)',
                      transition: 'all 0.2s',
                    }}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    disabled={!canSubmit()}
                    style={{
                      background: canSubmit() ? '#FF8210' : '#e5e7eb',
                      color: canSubmit() ? '#fff' : '#9ca3af',
                      border: 'none',
                      borderRadius: 50,
                      padding: '12px 32px',
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: canSubmit() ? 'pointer' : 'not-allowed',
                      boxShadow: canSubmit() ? '0 4px 16px rgba(255,130,16,0.30)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    Reveal my persona
                  </button>
                )}
              </div>
            </div>
          ) : quizPersona ? (
            /* ── RESULTS ── */
            <div style={{ background: '#fff', borderRadius: 20, padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              {/* 1. Persona name + style badge + image */}
              <div className="quiz-persona-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                    Your Traveller Persona
                  </p>
                  <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 34, color: '#00447B', lineHeight: 1.1, marginBottom: 12 }}>
                    {quizPersona.name}
                  </h2>
                  <span style={{ display: 'inline-block', background: 'rgba(255,130,16,0.12)', border: '1.5px solid rgba(255,130,16,0.35)', borderRadius: 50, padding: '5px 18px', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 13, color: '#FF8210' }}>
                    {quizPersona.travelStyle}
                  </span>
                </div>
                <div style={{ flexShrink: 0, width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,130,16,0.25)', boxShadow: '0 8px 24px rgba(0,68,123,0.15)' }}>
                  <img
                    src={quizPersona.personaImage}
                    alt={quizPersona.name}
                    width={140}
                    height={140}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              </div>

              {/* 2. Description */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 16, color: '#3b3b3b', lineHeight: 1.75, marginBottom: 28, borderLeft: '3px solid #FF8210', paddingLeft: 18 }}>
                {quizPersona.description}
              </p>

              {/* 3. Travel Profile */}
              <div style={{ marginBottom: 24, background: '#F7F8FA', borderRadius: 12, padding: '20px 22px' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  Travel Profile
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#3b3b3b', lineHeight: 1.7, margin: 0 }}>
                  {quizPersona.travelProfile}
                </p>
              </div>

              {/* 4. Suggested Trip Style */}
              <div style={{ marginBottom: 32, background: '#F7F8FA', borderRadius: 12, padding: '20px 22px' }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
                  Suggested Trip Style
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#3b3b3b', lineHeight: 1.7, margin: 0 }}>
                  {quizPersona.tripStyle}
                </p>
              </div>

              {/* 5. Start Planning CTA */}
              <div style={{ marginBottom: 40, textAlign: 'center' }}>
                <a
                  href="/plan"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackDestinationSelected(quizPersona.name, 'quiz')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF8210', color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 16, padding: '14px 32px', borderRadius: 50, textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,130,16,0.35)' }}
                >
                  Start planning with Luna
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              {/* 6. Destination cards with photos */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
                  Destinations for you
                </p>
                <div className="quiz-dest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  {visibleDest.map(dest => (
                    <DestinationCard
                      key={dest}
                      destination={dest}
                      onClick={() => {
                        trackDestinationSelected(quizPersona.name, 'quiz');
                        window.open(`/plan?destination=${encodeURIComponent(dest)}`, '_blank');
                      }}
                    />
                  ))}
                </div>
                {quizPersona.destinations.length > 4 && (
                  <button
                    onClick={() => setShowAllDest(v => !v)}
                    style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#6C6D6F', padding: 0 }}
                  >
                    {showAllDest ? 'Show fewer destinations' : `Show all ${quizPersona.destinations.length} destinations`}
                  </button>
                )}
              </div>

              {/* 7. Ask Luna prompts */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>
                  Ask Luna on your next trip
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {quizPersona.askLuna.map((prompt, i) => (
                    <a
                      key={i}
                      href={`/plan?luna_prompt=${encodeURIComponent(prompt)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,68,123,0.05)', border: '1.5px solid rgba(0,68,123,0.15)', borderRadius: 50, padding: '11px 20px', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#00447B', textDecoration: 'none', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,68,123,0.10)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,68,123,0.30)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,68,123,0.05)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(0,68,123,0.15)'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      {prompt}
                    </a>
                  ))}
                </div>
              </div>

              {/* 8. Deals CTA */}
              <div style={{ background: 'linear-gradient(135deg, #00447B 0%, #679AC1 100%)', borderRadius: 16, padding: '32px', textAlign: 'center', marginBottom: 28 }}>
                <p style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 18, color: 'white', marginBottom: 8 }}>
                  Ready to book? Check our exclusive deals
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 20 }}>
                  Hotels, flights, tours and activities — all curated for your travel style
                </p>
                <a
                  href="/deals"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FF8210', color: 'white', fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 15, padding: '12px 28px', borderRadius: 50, textDecoration: 'none' }}
                >
                  Explore deals
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>

              {/* 9. Retake */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={resetQuiz}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#9ca3af', textDecoration: 'underline', padding: 0 }}
                >
                  Retake quiz
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <style>{`
        .quiz-slider-light {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 100px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(to right, #FF8210 var(--fill, 50%), rgba(0,68,123,0.15) var(--fill, 50%));
        }
        .quiz-slider-light::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #FF8210;
          border: 3px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255,130,16,0.40), 0 0 0 4px rgba(255,130,16,0.15);
          transition: box-shadow 0.15s;
        }
        .quiz-slider-light::-webkit-slider-thumb:hover {
          box-shadow: 0 2px 8px rgba(255,130,16,0.50), 0 0 0 7px rgba(255,130,16,0.18);
        }
        .quiz-slider-light::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #FF8210;
          border: 3px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(255,130,16,0.40);
        }
        .quiz-slider-light::-moz-range-progress {
          background: #FF8210;
          height: 6px;
          border-radius: 100px;
        }
        @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @media (max-width: 640px) {
          .quiz-card { padding: 24px 16px !important; }
          .quiz-options-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .quiz-dest-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 520px) {
          .quiz-persona-header { flex-direction: column-reverse !important; align-items: center !important; text-align: center !important; }
          .quiz-persona-header > div:first-child { width: 100% !important; }
        }
        @media (max-width: 380px) {
          .quiz-options-grid { grid-template-columns: 1fr !important; }
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
