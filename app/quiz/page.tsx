'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { trackQuizStarted, trackQuizCompleted, trackDestinationSelected } from '@/lib/analytics';

/* ── Quiz data ── */
const VIBE_SPECTRUMS = [
  { key:'energy',  leftIcon:'⛰️', left:'Pure Adventure',    right:'Total Relaxation',  rightIcon:'🌴', labels:['Pure Adventure','Adventurous','Balanced','Relaxed','Pure Relaxation'] },
  { key:'setting', leftIcon:'🌿', left:'Outdoors & Nature',  right:'Cities & Culture',  rightIcon:'🏛️', labels:['Pure Outdoors','Outdoorsy','Mix of both','Culture-leaning','Pure Culture'] },
  { key:'crowd',   leftIcon:'📸', left:'Famous Highlights',  right:'Hidden Local Gems', rightIcon:'🗺️', labels:['Iconic hotspots','Popular spots','Mix of both','Off-beaten-path','Hidden gems'] },
  { key:'coast',   leftIcon:'🏔️', left:'Mountains & Inland', right:'Beaches & Coast',   rightIcon:'🏖️', labels:['Deep inland','Mountain-based','Mix of both','Coastal vibes','Full beach mode'] },
];

const ACCOM_OPTIONS = [
  {v:'luxury',e:'🏰',l:'Luxury Hotel'},{v:'boutique',e:'🏡',l:'Boutique Hotel'},
  {v:'resort',e:'🌴',l:'Resort'},{v:'bnb',e:'☕',l:'B&B / Guesthouse'},
  {v:'hostel',e:'🎒',l:'Hostel'},{v:'apartment',e:'🏠',l:'Apartment / Airbnb'},
  {v:'camping',e:'⛺',l:'Camping & Glamping'},{v:'motel',e:'🛣️',l:'Motel'},
  {v:'allinclusive',e:'🍹',l:'All-Inclusive'},
];

const HABIT_QUESTIONS = [
  { key:'spend', label:'Spending style', opts:[
    {e:'🎒',l:'Shoestring',v:'shoestring'},{e:'💰',l:'Budget-conscious',v:'budget'},
    {e:'🏨',l:'Comfortable',v:'comfortable'},{e:'✨',l:'Splurge often',v:'splurge'},
    {e:'💎',l:'No limits',v:'unlimited'},
  ]},
  { key:'pace', label:'Time of day', opts:[
    {e:'🌅',l:'Early bird',v:'early'},{e:'☀️',l:'Daytime explorer',v:'day'},
    {e:'🌆',l:'Afternoon starter',v:'afternoon'},{e:'🌙',l:'Night owl',v:'night'},
  ]},
  { key:'social', label:'Travel company', opts:[
    {e:'🧍',l:'Solo & independent',v:'solo'},
    {e:'💑',l:'Couple',v:'couple'},
    {e:'🤝',l:'Mix of both',v:'mixed'},{e:'🎉',l:'Group & social',v:'social'},
  ]},
];

const DINING_OPTIONS = [
  {v:'finedining',e:'🍽️',l:'Fine Dining'},{v:'streetfood',e:'🌮',l:'Street Food'},
  {v:'cafes',e:'☕',l:'Cafes & Bistros'},{v:'family',e:'👨‍👩‍👧',l:'Family Restaurants'},
  {v:'veganveg',e:'🥗',l:'Vegetarian / Vegan'},{v:'ethnic',e:'🌍',l:'Ethnic & World Cuisine'},
  {v:'halal',e:'🌙',l:'Halal'},{v:'fastfood',e:'🍔',l:'Fast Food'},
  {v:'pub',e:'🍺',l:'Pub & Tavern'},{v:'bakery',e:'🥐',l:'Bakeries & Patisseries'},
  {v:'markets',e:'🛒',l:'Food Markets'},{v:'farmtable',e:'🌾',l:'Farm-to-Table'},
];

const INTEREST_OPTIONS = [
  {v:'beach',e:'🏖️',l:'Beach & Swimming'},{v:'hiking',e:'🥾',l:'Hiking & Trekking'},
  {v:'watersports',e:'🏄',l:'Water Sports'},{v:'cycling',e:'🚴',l:'Cycling'},
  {v:'photography',e:'📸',l:'Photography'},{v:'wellness',e:'🧘',l:'Wellness & Spa'},
  {v:'history',e:'🏛️',l:'Historical Tours'},{v:'nightlife',e:'🎉',l:'Nightlife & Bars'},
  {v:'wildlife',e:'🦁',l:'Wildlife & Nature'},{v:'shows',e:'🎭',l:'Shows & Performances'},
  {v:'shopping',e:'🛍️',l:'Shopping'},{v:'architecture',e:'🏰',l:'Architecture'},
  {v:'cooking',e:'👨‍🍳',l:'Cooking Classes'},{v:'wine',e:'🍷',l:'Wine & Spirits'},
  {v:'markets',e:'🏪',l:'Local Markets'},{v:'sports',e:'⚽',l:'Sports & Activities'},
];

const PERSONA_DESTINATIONS: Record<string, Array<{name:string; country:string; desc:string; query:string}>> = {
  'The Wild Explorer':       [{name:'Patagonia',country:'Argentina & Chile',desc:'Glaciers, granite peaks and raw Andean wilderness with virtually no crowds.',query:'Patagonia'},{name:'Faroe Islands',country:'Denmark',desc:'Dramatic sea cliffs, waterfalls and mist-shrouded volcanic seascapes.',query:'Faroe Islands'},{name:'Kyrgyzstan',country:'Central Asia',desc:'Untouched mountain valleys, nomadic yurt camps and silk-road culture.',query:'Kyrgyzstan'}],
  'The Thrill Seeker':       [{name:'Queenstown',country:'New Zealand',desc:'The adventure capital of the world — bungee, skydive, raft, all in one week.',query:'Queenstown New Zealand'},{name:'Interlaken',country:'Switzerland',desc:'Alpine adventure hub ringed by lakes, glaciers and extreme sports.',query:'Interlaken Switzerland'},{name:'Moab',country:'Utah, USA',desc:'Red-rock canyon country built for climbing, mountain biking and off-road.',query:'Moab Utah'}],
  'The Cultural Adventurer': [{name:'Tbilisi',country:'Georgia',desc:'Ancient cave monasteries, Soviet street art and world-class natural wine.',query:'Tbilisi'},{name:'Oaxaca',country:'Mexico',desc:'Rich indigenous heritage, ancient ruins and a world-renowned food scene.',query:'Oaxaca'},{name:'Luang Prabang',country:'Laos',desc:'Golden temples, saffron-robed monks at dawn and Mekong river sunsets.',query:'Luang Prabang'}],
  'The Expedition Traveller':[{name:'Machu Picchu',country:'Peru',desc:'Iconic Inca citadel perched high in the cloud-covered Andes mountains.',query:'Machu Picchu'},{name:'Angkor Wat',country:'Cambodia',desc:"The world's largest religious monument, deep in the jungle.",query:'Angkor Wat'},{name:'Cappadocia',country:'Turkey',desc:'Hot-air balloons at sunrise over fairy-chimney rock formations.',query:'Cappadocia'}],
  'The Mindful Wanderer':    [{name:'Azores',country:'Portugal',desc:'Volcanic island paradise with thermal pools, whale watching and wild coasts.',query:'Azores'},{name:'Chiang Mai',country:'Thailand',desc:'Jungle temples, elephant sanctuaries, wellness retreats and farm cuisine.',query:'Chiang Mai'},{name:'Sintra',country:'Portugal',desc:'Fairy-tale palaces, misty forests and clifftop castles near Lisbon.',query:'Sintra'}],
  'The Beach Lover':         [{name:'Maldives',country:'Indian Ocean',desc:'Overwater bungalows, crystal-clear lagoons and pristine coral reefs.',query:'Maldives'},{name:'Bali',country:'Indonesia',desc:'Lush rice paddies, surf-ready beaches and vibrant sunset beach clubs.',query:'Bali'},{name:'Seychelles',country:'East Africa',desc:'Granite-boulder beaches, turquoise bays and tropical marine paradise.',query:'Seychelles'}],
  'The Cultural Connoisseur':[{name:'Havana',country:'Cuba',desc:"1950s cars, salsa rhythms, crumbling colonial grandeur and street art.",query:'Havana'},{name:'Bologna',country:'Italy',desc:"Italy's food capital with medieval arcades, markets and student energy.",query:'Bologna'},{name:'Fez',country:'Morocco',desc:"The world's oldest living medieval city, full of hidden souks and craft.",query:'Fez'}],
  'The Cultured Traveller':  [{name:'Paris',country:'France',desc:'The city of art, gastronomy, fashion and unmatched cultural grandeur.',query:'Paris'},{name:'Florence',country:'Italy',desc:'Renaissance art, leather markets, extraordinary trattorias and wine bars.',query:'Florence'},{name:'Kyoto',country:'Japan',desc:'Ancient temples, geisha districts and immaculate seasonal gardens.',query:'Kyoto'}],
  'The All-Rounder':         [{name:'Barcelona',country:'Spain',desc:'Gaudí architecture, tapas bars, beach days and world-class nightlife.',query:'Barcelona'},{name:'Lisbon',country:'Portugal',desc:'Colourful trams, riverside restaurants and Atlantic surf beaches nearby.',query:'Lisbon'},{name:'Cape Town',country:'South Africa',desc:'Mountain hikes, wine valleys, penguins and pristine ocean beaches.',query:'Cape Town'}],
};

const BEACH_ALTERNATIVES: Record<string,{name:string;country:string;desc:string;query:string}> = {
  'The Wild Explorer':       {name:'Fernando de Noronha',country:'Brazil',desc:'Remote volcanic archipelago with crystal-clear reefs and zero mass tourism.',query:'Fernando de Noronha'},
  'The Thrill Seeker':       {name:'Nazaré',country:'Portugal',desc:'Home of the biggest surfable waves on earth — a pilgrimage for the bold.',query:'Nazaré Portugal'},
  'The Cultural Adventurer': {name:'Zanzibar',country:'Tanzania',desc:'Spice-scented islands with a rich Swahili culture and white-sand beaches.',query:'Zanzibar'},
  'The Expedition Traveller':{name:'Galápagos Islands',country:'Ecuador',desc:'Volcanic islands with unique wildlife, pristine reefs and raw natural wonder.',query:'Galápagos Islands'},
  'The Mindful Wanderer':    {name:'Koh Lanta',country:'Thailand',desc:'Quiet long-beach island with mangroves, yoga retreats and true slow living.',query:'Koh Lanta Thailand'},
  'The Cultural Connoisseur':{name:'Essaouira',country:'Morocco',desc:'Windswept blue-and-white port city with a medina, surf and fresh seafood.',query:'Essaouira Morocco'},
  'The Cultured Traveller':  {name:'Amalfi Coast',country:'Italy',desc:'Dramatic cliffside villages, lemons and sapphire Mediterranean water.',query:'Amalfi Coast'},
  'The All-Rounder':         {name:'Bali',country:'Indonesia',desc:'Lush rice paddies, surf-ready beaches, temples and vibrant beach clubs.',query:'Bali'},
  'The Beach Lover':         {name:'Turks & Caicos',country:'Caribbean',desc:"Some of the world's most pristine beaches with zero development in sight.",query:'Turks and Caicos'},
};

function generateQuizQuestions(personaName:string, interests:string[], dining:string[], habits:Record<string,string>): string[] {
  const base: Record<string,string[]> = {
    'The Wild Explorer': [
      'Which national parks or wilderness areas offer the best multi-day trekking for independent travellers?',
      'Are there off-grid eco-lodges that feel truly remote yet are still safely reachable?',
      'What are the least-visited safari destinations that still offer incredible wildlife encounters?',
      'Can you suggest a route where I can hike from village to village without a tour group?',
      'Which destinations have the best conditions for wild camping, and what permits do I need?',
    ],
    'The Thrill Seeker': [
      'Which destinations pack the most adventure activities into a single trip?',
      'Where can I combine white-water rafting, bungee jumping, and mountain biking in one week?',
      'Are there lesser-known adventure spots that rival Queenstown or Interlaken but with fewer crowds?',
      'Can you recommend a guided multi-activity expedition for someone wanting a serious physical challenge?',
      'What safety certifications should I check for adventure operators in developing countries?',
    ],
    'The Cultural Adventurer': [
      'Which destinations combine a thriving contemporary art scene with deep historical heritage?',
      'Can you suggest cities where I can attend local festivals not listed in mainstream guidebooks?',
      'Are there heritage towns with historically restored guesthouses rather than modern hotels?',
      'What are the best ways to connect with local artisans or cultural practitioners during a trip?',
      'Which regions offer deep cultural immersion through homestays or community-based tourism?',
    ],
    'The Expedition Traveller': [
      "What iconic bucket-list sites are actually worth the hype, and what's the best way to visit them?",
      'Can you plan an active sightseeing route where I hike or cycle to landmarks instead of driving?',
      'Which UNESCO Heritage Sites can be combined efficiently in a two-week itinerary?',
      'Are there lesser-known viewpoints to famous landmarks that most tourists miss?',
      "What's the best time to visit major highlights while avoiding peak-season crowds?",
    ],
    'The Mindful Wanderer': [
      'Which coastal destinations offer peaceful villages with excellent independent hiking and cycling?',
      'Can you recommend a slow-travel itinerary where I spend 4–5 nights in each place rather than rushing?',
      'Are there wellness-focused destinations where yoga retreats sit alongside natural landscapes and culture?',
      'What are the quietest, most restorative beach destinations that still have interesting local life?',
      'Can you suggest a trip that balances solo exploration with optional guided experiences when I want company?',
    ],
    'The Beach Lover': [
      'Which beach destinations offer the best combination of beautiful water, local atmosphere, and good food?',
      'Can you recommend islands where I can island-hop easily without expensive flights between stops?',
      'Are there all-inclusive resorts that also give good access to local culture and authentic dining?',
      'What are the best snorkelling or diving spots suitable for beginners at a beach destination?',
      'Which beach towns come alive at night with a great food scene but without being too rowdy?',
    ],
    'The Cultural Connoisseur': [
      'Which cities have the richest neighbourhood-level culture — local markets, street art, and independent cafes?',
      'Can you suggest a trip that includes a cooking class, a food market tour, and a local home dinner experience?',
      'Are there lesser-known cultural capitals that feel authentic and uncrowded?',
      'What are the best ways to find local music, theatre, or performance events during a city visit?',
      'Can you recommend areas in a city where local life continues relatively undisturbed by tourism?',
    ],
    'The Cultured Traveller': [
      'Which cities offer the best combination of world-class museums, fine dining, and boutique accommodation?',
      'Can you plan a cultural city break with iconic galleries, acclaimed restaurants, and a bit of architecture?',
      'Are there food and wine regions where I can combine vineyard visits with strong cultural sightseeing?',
      'What are the most impressive performing arts venues worth planning a trip around?',
      'Which cities have the best private guided museum or heritage tours for a small group?',
    ],
    'The All-Rounder': [
      'Can you suggest a destination that works well for both beach days and cultural sightseeing in the same trip?',
      'Which cities act as great bases for day trips to nature, coast, and historic towns all within easy reach?',
      'Are there flexible itineraries that mix budget street food days with one or two special dining experiences?',
      'What destinations let me shift between being active (hiking, cycling) and relaxed (cafes, beaches) day by day?',
      'Can you recommend a trip where I can be spontaneous — not every activity pre-booked — and still have a great time?',
    ],
  };
  const questions = [...(base[personaName] || base['The All-Rounder'])].slice(0,5);
  if (interests.includes('nightlife')) questions[4] = 'Which destinations have the most vibrant nightlife scenes that stay lively well past midnight?';
  if (dining.includes('streetfood') || dining.includes('markets')) questions[3] = 'What are the best destinations for street food and local market dining that go beyond the usual tourist haunts?';
  if (interests.includes('photography')) questions[4] = 'What are the most photogenic destinations and the best times of day to shoot the iconic locations?';
  return questions;
}

function computePersona(
  vibes: Record<string,number>, accom: string[],
  habits: Record<string,string>, dining: string[], interests: string[],
) {
  const energy = vibes.energy ?? 2;
  const setting = vibes.setting ?? 2;
  const crowd = vibes.crowd ?? 2;
  const adv=energy<=1, rel=energy>=3, out=setting<=1, cul=setting>=3, hid=crowd>=3;

  type P = { name:string; icon:string; tagline:string; desc:string; tripStyles:string[] };
  let p: P;
  if      (adv&&out&&hid) p={name:'The Wild Explorer',       icon:'🌿',tagline:'Off the beaten path, close to nature',            desc:"You thrive on raw landscapes and remote places most travellers never find. Tourist crowds aren't your scene — give you a trail map and an adventure with no tour group in sight.",                         tripStyles:['Eco-tourism','Trekking','Wildlife Safari','Camping']};
  else if (adv&&out&&!hid) p={name:'The Thrill Seeker',      icon:'⛰️',tagline:'Living for the rush',                            desc:"Adrenaline is your travel currency. Whether it's bungee jumping, white-water rafting, or scaling a via ferrata, you want every day to push your limits and leave you buzzing.",                  tripStyles:['Adventure Sports','Extreme Activities','Group Tours','Road Trip']};
  else if (adv&&cul&&hid) p={name:'The Cultural Adventurer',  icon:'🗺️',tagline:'Curious, bold, and deeply engaged',              desc:"History books aren't enough — you want to live the story. You seek out off-map heritage sites, local festivals, and hidden corners of ancient cities that most tourists walk straight past.", tripStyles:['Cultural Immersion','Heritage Travel','Slow Travel','Photography']};
  else if (adv&&cul&&!hid) p={name:'The Expedition Traveller',icon:'🧭',tagline:'Iconic destinations, adventurous approach',       desc:"Bucket-list icons appeal to you, but on your own terms — climbing Machu Picchu at sunrise, cycling through Angkor Wat, or hiking the Cinque Terre rather than bussing it.",              tripStyles:['Bucket List','Active Sightseeing','Photography','City Break']};
  else if (rel&&out&&hid) p={name:'The Mindful Wanderer',     icon:'🌊',tagline:'Slow travel, deep connections',                  desc:"You travel to breathe. Untouched coastal paths, quiet fishing villages, and mornings with nothing planned but coffee and a view — these are the moments you'll still be talking about in 20 years.", tripStyles:['Wellness Retreat','Slow Travel','Eco-tourism','Coastal Escape']};
  else if (rel&&out&&!hid) p={name:'The Beach Lover',         icon:'🏖️',tagline:'Sun, sea, and pure relaxation',                  desc:"You know exactly what a great holiday looks like: a sunlounger, warm water, and a cocktail. Maybe a snorkel. Definitely no alarm clocks. You've perfected the art of doing very little, very well.", tripStyles:['Beach Resort','Island Hopping','All-Inclusive','Snorkelling & Diving']};
  else if (rel&&cul&&hid) p={name:'The Cultural Connoisseur', icon:'🎭',tagline:'Deep immersion in local life',                   desc:"You travel at the speed of curiosity. Hidden art exhibitions, restaurants the locals love, and learning a few words of the language before you arrive — that's your kind of trip.",              tripStyles:['Cultural Immersion','City Break','Culinary Tour','Local Experiences']};
  else if (rel&&cul&&!hid) p={name:'The Cultured Traveller',  icon:'🏛️',tagline:'Museums, wine, and memorable meals',            desc:"World-class museums, acclaimed restaurants, a comfortable hotel — your ideal trip blends culture with the finer things. You'll queue for the Louvre, but only after a proper croissant.",           tripStyles:['City Break','Culinary Tour','Luxury Travel','Heritage Sites']};
  else                     p={name:'The All-Rounder',          icon:'🌍',tagline:'Balanced, curious, and up for anything',         desc:"You refuse to be put in a box. Some days you want a beach, others a museum. Budget street food one night, a special dinner the next. This flexibility is your superpower — you thrive everywhere.", tripStyles:['Mixed Itinerary','City & Beach Combo','Flexible Travel','Cultural Highlights']};

  const budgetMap: Record<string,string> = { shoestring:'budget',budget:'budget',comfortable:'comfort',splurge:'premium',unlimited:'luxury' };
  const budget = budgetMap[habits.spend] || 'midrange';
  const styleMap: Record<string,string> = { beach:'beach',hiking:'adventure',wildlife:'nature',wellness:'wellness',history:'cultural',photography:'photography',nightlife:'nightlife',shopping:'shopping',cooking:'food',wine:'food',watersports:'adventure',cycling:'adventure',sports:'adventure',shows:'cultural',architecture:'cultural',markets:'cultural' };
  const styles = [...new Set(interests.slice(0,8).map(i=>styleMap[i]).filter(Boolean))];

  const traits: string[] = [];
  if (energy<=1) traits.push('Adventurous'); else if (energy>=3) traits.push('Laid-back'); else traits.push('Balanced');
  if (setting<=1) traits.push('Nature lover'); else if (setting>=3) traits.push('Culture seeker'); else traits.push('City & nature mix');
  if (crowd>=3) traits.push('Off the beaten path'); else if (crowd<=1) traits.push('Classic highlights'); else traits.push('Best of both worlds');
  if (habits.pace==='night') traits.push('Night owl'); else if (habits.pace==='early') traits.push('Early riser');
  if (habits.social==='social') traits.push('Group & social'); else if (habits.social==='solo') traits.push('Independent traveller');
  if (accom.includes('luxury')||accom.includes('boutique')) traits.push('Boutique stays');
  if (accom.includes('hostel')||accom.includes('camping')) traits.push('Budget-smart');
  if (dining.includes('streetfood')||dining.includes('markets')) traits.push('Street food fan');
  if (dining.includes('finedining')||dining.includes('farmtable')) traits.push('Foodie');

  const coast = vibes.coast ?? 2;
  const questions = generateQuizQuestions(p.name, interests, dining, habits);
  let destinations = [...(PERSONA_DESTINATIONS[p.name] || PERSONA_DESTINATIONS['The All-Rounder'])];
  if (coast >= 3 && p.name !== 'The Beach Lover') {
    const beachAlt = BEACH_ALTERNATIVES[p.name];
    if (beachAlt) destinations = [beachAlt, destinations[0], destinations[1]];
  } else if (coast >= 3 && p.name === 'The Beach Lover') {
    const extra = BEACH_ALTERNATIVES['The Beach Lover'];
    if (extra) destinations = [...destinations.slice(0,2), extra];
  }
  return { ...p, budget, styles, questions, traits, destinations };
}

export default function QuizPage() {
  const router = useRouter();
  const [quizStep,      setQuizStep]      = useState(0);
  const [quizDone,      setQuizDone]      = useState(false);
  const [quizVibes,     setQuizVibes]     = useState<Record<string,number>>({energy:2,setting:2,crowd:2,coast:2});
  const [quizAccom,     setQuizAccom]     = useState<string[]>([]);
  const [quizHabits,    setQuizHabits]    = useState<Record<string,string>>({});
  const [quizDining,    setQuizDining]    = useState<string[]>([]);
  const [quizInterests, setQuizInterests] = useState<string[]>([]);
  const [quizPersona,   setQuizPersona]   = useState<ReturnType<typeof computePersona>|null>(null);
  const [destPhotos,    setDestPhotos]    = useState<Record<string,string|null>>({});
  const [aiDestinations,setAiDestinations] = useState<Array<{name:string;country:string;desc:string;query:string}>|null>(null);
  const [aiDestsLoading,setAiDestsLoading] = useState(false);

  const go = (q: string) => router.push(`/plan?prompt=${encodeURIComponent(q)}`);

  const fetchAiDestinations = async (persona: ReturnType<typeof computePersona>) => {
    setAiDestsLoading(true);
    setAiDestinations(null);
    const vibeLabels = VIBE_SPECTRUMS.map(sp => `${sp.left}↔${sp.right}: ${sp.labels[quizVibes[sp.key] ?? 2]}`).join('; ');
    const accomNames = quizAccom.map(a => ACCOM_OPTIONS.find(o=>o.v===a)?.l||a).join(', ') || 'flexible';
    const diningNames = quizDining.map(d => DINING_OPTIONS.find(o=>o.v===d)?.l||d).join(', ') || 'varied';
    const interestNames = quizInterests.map(i => INTEREST_OPTIONS.find(o=>o.v===i)?.l||i).join(', ') || 'varied';
    const budgetLabel: Record<string,string> = {shoestring:'Shoestring',budget:'Budget-conscious',comfortable:'Comfortable',splurge:'Splurge often',unlimited:'No limits'};
    const paceLabel: Record<string,string> = {early:'Early bird',day:'Daytime explorer',afternoon:'Afternoon starter',night:'Night owl'};
    const socialLabel: Record<string,string> = {solo:'Solo & independent',couple:'Couple',mixed:'Mix of both',social:'Group & social'};
    const prompt = `You are a world-class travel expert. Suggest exactly 3 travel destinations that are a perfect match for this traveller. Make them diverse — ideally different continents or regions. Be creative and think beyond the obvious.

Return ONLY a valid JSON array with no other text, no markdown, no code blocks — just raw JSON:
[{"name":"City or Place","country":"Country or Region","desc":"One vivid sentence about why this place suits this exact traveller.","query":"Wikipedia article title for this place"}]

Traveller Profile:
- Persona: ${persona.name} — ${persona.tagline}
- Vibe dials: ${vibeLabels}
- Accommodation style: ${accomNames}
- Budget: ${budgetLabel[quizHabits.spend] || quizHabits.spend || 'comfortable'}
- Daily pace: ${paceLabel[quizHabits.pace] || quizHabits.pace || 'flexible'}
- Travel company: ${socialLabel[quizHabits.social] || quizHabits.social || 'flexible'}
- Dining preferences: ${diningNames}
- Interests: ${interestNames}`;
    try {
      const res = await fetch('/api/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ prompt }) });
      const data = await res.json();
      if (data.plan) {
        const match = data.plan.match(/\[[\s\S]*?\]/);
        if (match) {
          const dests = JSON.parse(match[0]);
          if (Array.isArray(dests) && dests.length > 0) { setAiDestinations(dests); return; }
        }
      }
    } catch { /* fall through */ }
    finally { setAiDestsLoading(false); }
    setAiDestinations(persona.destinations);
  };

  const finishQuiz = () => {
    const persona = computePersona(quizVibes, quizAccom, quizHabits, quizDining, quizInterests);
    setQuizPersona(persona);
    setQuizDone(true);
    trackQuizCompleted(persona.name);
    fetchAiDestinations(persona);
  };

  const resetQuiz = () => {
    setQuizStep(0); setQuizDone(false);
    setQuizVibes({energy:2,setting:2,crowd:2,coast:2}); setQuizAccom([]);
    setQuizHabits({}); setQuizDining([]); setQuizInterests([]); setQuizPersona(null);
    setDestPhotos({}); setAiDestinations(null); setAiDestsLoading(false);
  };

  useEffect(() => { trackQuizStarted(); }, []);

  useEffect(() => {
    if (!aiDestinations) return;
    setDestPhotos({});
    aiDestinations.forEach(async (d) => {
      try {
        const res = await fetch(`/api/place-photo?q=${encodeURIComponent(d.query)}`);
        const data = await res.json();
        setDestPhotos(prev => ({ ...prev, [d.name]: data.url ?? null }));
      } catch { setDestPhotos(prev => ({ ...prev, [d.name]: null })); }
    });
  }, [aiDestinations]); // eslint-disable-line

  return (
    <div style={{ fontFamily:'var(--font-body)', color:'#000', background:'#fff' }}>
      <NavBar />

      <section style={{ background:'var(--navy)', minHeight:'calc(100vh - 68px)', padding:'80px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 20% 50%, rgba(103,154,193,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,130,16,0.10) 0%, transparent 40%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
          <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:13, letterSpacing:2, textTransform:'uppercase', color:'var(--orange-light)', marginBottom:12 }}>Not Sure Where to Go?</p>
          <h1 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:'clamp(28px,4vw,40px)', color:'#fff', marginBottom:12, lineHeight:1.2 }}>Discover your traveller persona</h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:17, color:'rgba(255,255,255,0.55)', marginBottom:48 }}>
            5 quick questions. We&apos;ll define your travel style, suggest destinations, and point you to the right trips.
          </p>

          {!quizDone ? (
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'var(--r-lg)', padding:'40px 36px', textAlign:'left' }}>
              {/* Progress */}
              <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                {['Vibe','Stay','Habits','Dining','Interests'].map((label,i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                    <div style={{ width:'100%', height:4, borderRadius:100, background:i<quizStep?'var(--orange)':i===quizStep?'var(--orange-light)':'rgba(255,255,255,0.15)', transition:'background 0.3s' }} />
                    <span style={{ fontFamily:'var(--font-head)', fontSize:10, color:i<=quizStep?'var(--orange-light)':'rgba(255,255,255,0.25)', letterSpacing:0.5, textTransform:'uppercase' as const }}>{label}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, color:'rgba(255,255,255,0.3)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:28, marginTop:16 }}>Step {quizStep+1} of 5</p>

              {/* Step 0: Vibe sliders */}
              {quizStep === 0 && (
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:22, color:'#fff', marginBottom:8, textAlign:'center' }}>What is your ideal travel vibe?</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.50)', marginBottom:36, textAlign:'center' }}>Drag each slider to find your sweet spot — there are no wrong answers.</p>
                  {VIBE_SPECTRUMS.map(sp => {
                    const val = quizVibes[sp.key] ?? 2;
                    const pct = val * 25;
                    const currentLabel = sp.labels[val];
                    return (
                      <div key={sp.key} style={{ marginBottom:32 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:12, color:'rgba(255,255,255,0.55)' }}>{sp.leftIcon} {sp.left}</span>
                          <span style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:12, color:'var(--orange-light)', background:'rgba(255,130,16,0.12)', border:'1px solid rgba(255,130,16,0.25)', borderRadius:'var(--r-pill)', padding:'2px 10px' }}>{currentLabel}</span>
                          <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:12, color:'rgba(255,255,255,0.55)' }}>{sp.right} {sp.rightIcon}</span>
                        </div>
                        <input
                          type="range" min={0} max={4} step={1} value={val}
                          onChange={e => setQuizVibes(prev => ({...prev, [sp.key]: Number(e.target.value)}))}
                          className="quiz-slider"
                          style={{ '--fill': `${pct}%` } as React.CSSProperties}
                        />
                      </div>
                    );
                  })}
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                    <button onClick={()=>setQuizStep(1)} style={{ background:'var(--orange)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:'var(--r-pill)', border:'none', cursor:'pointer' }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 1: Accommodation */}
              {quizStep === 1 && (
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:22, color:'#fff', marginBottom:8 }}>How do you like to stay?</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.50)', marginBottom:28 }}>Select all that appeal to you.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:24 }}>
                    {ACCOM_OPTIONS.map(opt => {
                      const sel = quizAccom.includes(opt.v);
                      return (
                        <button key={opt.v} onClick={()=>setQuizAccom(p=>p.includes(opt.v)?p.filter(x=>x!==opt.v):[...p,opt.v])} style={{ background:sel?'rgba(255,130,16,0.18)':'rgba(255,255,255,0.06)', border:`1.5px solid ${sel?'var(--orange)':'rgba(255,255,255,0.12)'}`, borderRadius:'var(--r-md)', padding:'16px 10px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:8, transition:'all 0.15s' }}>
                          <span style={{ fontSize:26 }}>{opt.e}</span>
                          <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:12, color:sel?'var(--orange-light)':'rgba(255,255,255,0.75)', lineHeight:1.3, textAlign:'center' }}>{opt.l}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <button onClick={()=>setQuizStep(0)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-head)', fontSize:13, cursor:'pointer' }}>← Back</button>
                    <button onClick={()=>setQuizStep(2)} disabled={quizAccom.length===0} style={{ background:quizAccom.length>0?'var(--orange)':'rgba(255,255,255,0.15)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:'var(--r-pill)', border:'none', cursor:quizAccom.length>0?'pointer':'not-allowed' }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 2: Habits */}
              {quizStep === 2 && (
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:22, color:'#fff', marginBottom:8, textAlign:'center' }}>How do you travel?</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.50)', marginBottom:28, textAlign:'center' }}>One answer per question.</p>
                  {HABIT_QUESTIONS.map(hq => (
                    <div key={hq.key} style={{ marginBottom:24 }}>
                      <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:12, color:'var(--orange-light)', letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>{hq.label}</p>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                        {hq.opts.map(opt => {
                          const sel = quizHabits[hq.key] === opt.v;
                          return (
                            <button key={opt.v} onClick={()=>setQuizHabits(p=>({...p,[hq.key]:opt.v}))} style={{ background:sel?'rgba(255,130,16,0.18)':'rgba(255,255,255,0.06)', border:`1.5px solid ${sel?'var(--orange)':'rgba(255,255,255,0.12)'}`, borderRadius:10, padding:'10px 16px', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:18 }}>{opt.e}</span>
                              <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:13, color:sel?'var(--orange-light)':'rgba(255,255,255,0.75)' }}>{opt.l}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                    <button onClick={()=>setQuizStep(1)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-head)', fontSize:13, cursor:'pointer' }}>← Back</button>
                    <button onClick={()=>setQuizStep(3)} disabled={Object.keys(quizHabits).length<HABIT_QUESTIONS.length} style={{ background:Object.keys(quizHabits).length>=HABIT_QUESTIONS.length?'var(--orange)':'rgba(255,255,255,0.15)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:'var(--r-pill)', border:'none', cursor:Object.keys(quizHabits).length>=HABIT_QUESTIONS.length?'pointer':'not-allowed' }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 3: Dining */}
              {quizStep === 3 && (
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:22, color:'#fff', marginBottom:8 }}>What dining experiences do you love?</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.50)', marginBottom:28 }}>Select all that apply.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
                    {DINING_OPTIONS.map(opt => {
                      const sel = quizDining.includes(opt.v);
                      return (
                        <button key={opt.v} onClick={()=>setQuizDining(p=>p.includes(opt.v)?p.filter(x=>x!==opt.v):[...p,opt.v])} style={{ background:sel?'rgba(255,130,16,0.18)':'rgba(255,255,255,0.06)', border:`1.5px solid ${sel?'var(--orange)':'rgba(255,255,255,0.12)'}`, borderRadius:'var(--r-md)', padding:'14px 8px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.15s' }}>
                          <span style={{ fontSize:24 }}>{opt.e}</span>
                          <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:11, color:sel?'var(--orange-light)':'rgba(255,255,255,0.70)', lineHeight:1.3, textAlign:'center' }}>{opt.l}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <button onClick={()=>setQuizStep(2)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-head)', fontSize:13, cursor:'pointer' }}>← Back</button>
                    <button onClick={()=>setQuizStep(4)} disabled={quizDining.length===0} style={{ background:quizDining.length>0?'var(--orange)':'rgba(255,255,255,0.15)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:'var(--r-pill)', border:'none', cursor:quizDining.length>0?'pointer':'not-allowed' }}>Continue →</button>
                  </div>
                </div>
              )}

              {/* Step 4: Interests */}
              {quizStep === 4 && (
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:22, color:'#fff', marginBottom:8 }}>What are your favourite travel activities?</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.50)', marginBottom:28 }}>Select all that apply.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
                    {INTEREST_OPTIONS.map(opt => {
                      const sel = quizInterests.includes(opt.v);
                      return (
                        <button key={opt.v} onClick={()=>setQuizInterests(p=>p.includes(opt.v)?p.filter(x=>x!==opt.v):[...p,opt.v])} style={{ background:sel?'rgba(255,130,16,0.18)':'rgba(255,255,255,0.06)', border:`1.5px solid ${sel?'var(--orange)':'rgba(255,255,255,0.12)'}`, borderRadius:'var(--r-md)', padding:'14px 8px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6, transition:'all 0.15s' }}>
                          <span style={{ fontSize:24 }}>{opt.e}</span>
                          <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:11, color:sel?'var(--orange-light)':'rgba(255,255,255,0.70)', lineHeight:1.3, textAlign:'center' }}>{opt.l}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <button onClick={()=>setQuizStep(3)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.4)', fontFamily:'var(--font-head)', fontSize:13, cursor:'pointer' }}>← Back</button>
                    <button onClick={finishQuiz} disabled={quizInterests.length===0} style={{ background:quizInterests.length>0?'var(--orange)':'rgba(255,255,255,0.15)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:'var(--r-pill)', border:'none', cursor:quizInterests.length>0?'pointer':'not-allowed' }}>
                      Reveal my persona ✨
                    </button>
                  </div>
                </div>
              )}
            </div>

          ) : quizPersona ? (
            /* PERSONA RESULTS */
            <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'var(--r-lg)', padding:'40px', textAlign:'left' }}>
              <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:24, flexWrap:'wrap' }}>
                <div style={{ fontSize:56, lineHeight:1, flexShrink:0 }}>{quizPersona.icon}</div>
                <div>
                  <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, color:'var(--orange-light)', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Your Traveller Persona</p>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:30, color:'#fff', lineHeight:1.1, marginBottom:4 }}>{quizPersona.name}</h3>
                  <p style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:15, color:'rgba(255,255,255,0.55)' }}>{quizPersona.tagline}</p>
                </div>
              </div>
              <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'rgba(255,255,255,0.75)', lineHeight:1.75, marginBottom:28, borderLeft:'3px solid var(--orange)', paddingLeft:18 }}>{quizPersona.desc}</p>

              <div style={{ marginBottom:24 }}>
                <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, color:'var(--orange-light)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Your Travel Profile</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {quizPersona.traits.map((t:string) => (
                    <span key={t} style={{ background:'rgba(255,255,255,0.10)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:'var(--r-pill)', padding:'5px 14px', color:'#fff', fontFamily:'var(--font-head)', fontWeight:500, fontSize:13 }}>{t}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:28 }}>
                <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, color:'var(--orange-light)', letterSpacing:2, textTransform:'uppercase', marginBottom:12 }}>Suggested Trip Styles</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                  {quizPersona.tripStyles.map((s:string) => (
                    <span key={s} style={{ background:'rgba(255,130,16,0.15)', border:'1px solid rgba(255,130,16,0.30)', borderRadius:'var(--r-pill)', padding:'5px 14px', color:'var(--orange-light)', fontFamily:'var(--font-head)', fontWeight:600, fontSize:13 }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* AI-suggested destinations */}
              <div style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, color:'var(--orange-light)', letterSpacing:2, textTransform:'uppercase', margin:0 }}>Destinations for you</p>
                  {aiDestsLoading && (
                    <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(255,255,255,0.40)', display:'flex', alignItems:'center', gap:6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.9s linear infinite', flexShrink:0 }}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#FF8210" strokeWidth="3" strokeLinecap="round"/></svg>
                      AI is picking destinations…
                    </span>
                  )}
                </div>
                {aiDestsLoading && !aiDestinations ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ borderRadius:'var(--r-md)', overflow:'hidden', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ height:130, background:'rgba(255,255,255,0.06)', animation:'shimmer 1.6s ease-in-out infinite' }} />
                        <div style={{ padding:'12px 14px' }}>
                          <div style={{ height:13, background:'rgba(255,255,255,0.08)', borderRadius:4, marginBottom:8, width:'70%' }} />
                          <div style={{ height:10, background:'rgba(255,255,255,0.05)', borderRadius:4, marginBottom:6, width:'45%' }} />
                          <div style={{ height:10, background:'rgba(255,255,255,0.04)', borderRadius:4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                    {(aiDestinations ?? []).map((d) => {
                      const photo = destPhotos[d.name];
                      return (
                        <div key={d.name} onClick={()=>go(`Plan a trip to ${d.name}, ${d.country}`)}
                          style={{ cursor:'pointer', borderRadius:'var(--r-md)', overflow:'hidden', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', transition:'all 0.2s' }}
                          onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.border='1px solid rgba(255,130,16,0.45)';(e.currentTarget as HTMLDivElement).style.transform='translateY(-3px)';}}
                          onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.border='1px solid rgba(255,255,255,0.10)';(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';}}>
                          <div style={{ height:130, overflow:'hidden', background:'rgba(255,255,255,0.04)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {photo
                              ? <img src={photo} alt={d.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                              : <span style={{ fontSize:32, opacity:0.25 }}>📍</span>
                            }
                            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }} />
                            <div style={{ position:'absolute', bottom:8, right:10, fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, color:'rgba(255,255,255,0.7)' }}>Plan this →</div>
                          </div>
                          <div style={{ padding:'12px 14px 14px' }}>
                            <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color:'#fff', marginBottom:2 }}>{d.name}</div>
                            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'var(--orange-light)', marginBottom:6 }}>{d.country}</div>
                            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.55 }}>{d.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ marginBottom:32 }}>
                <p style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, color:'var(--orange-light)', letterSpacing:2, textTransform:'uppercase', marginBottom:14 }}>You might want to ask</p>
                <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:10 }}>
                  {quizPersona.questions.map((q:string, i:number) => (
                    <li key={i} style={{ display:'flex', gap:12, alignItems:'flex-start', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, padding:'12px 16px' }}>
                      <span style={{ color:'var(--orange)', fontFamily:'var(--font-head)', fontWeight:700, fontSize:16, flexShrink:0, lineHeight:1.4 }}>→</span>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.72)', lineHeight:1.65 }}>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <button onClick={()=>{ trackDestinationSelected(quizPersona?.name ?? 'quiz_result', 'quiz'); router.push('/start'); }} style={{ background:'var(--orange)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:'var(--r-pill)', border:'none', cursor:'pointer', boxShadow:'0 6px 20px rgba(255,130,16,0.35)' }}>
                  ✈ Plan my trip →
                </button>
                <button onClick={resetQuiz} style={{ background:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.8)', fontFamily:'var(--font-head)', fontWeight:500, fontSize:15, padding:'14px 24px', borderRadius:'var(--r-pill)', border:'1px solid rgba(255,255,255,0.20)', cursor:'pointer' }}>
                  ↺ Retake quiz
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <style>{`
        .quiz-slider { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:100px; outline:none; cursor:pointer; background:linear-gradient(to right, #FF8210 var(--fill,50%), rgba(255,255,255,0.15) var(--fill,50%)); }
        .quiz-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:26px; height:26px; border-radius:50%; background:#FF8210; cursor:pointer; box-shadow:0 0 0 5px rgba(255,130,16,0.25), 0 2px 8px rgba(0,0,0,0.3); transition:box-shadow 0.15s; }
        .quiz-slider::-webkit-slider-thumb:hover { box-shadow:0 0 0 8px rgba(255,130,16,0.30), 0 2px 8px rgba(0,0,0,0.3); }
        .quiz-slider::-moz-range-thumb { width:26px; height:26px; border-radius:50%; background:#FF8210; cursor:pointer; border:none; box-shadow:0 0 0 5px rgba(255,130,16,0.25); }
        .quiz-slider::-moz-range-progress { background:#FF8210; height:8px; border-radius:100px; }
        @keyframes shimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        @media (max-width: 600px) {
          .quiz-slider { height:6px; }
        }
      `}</style>
    </div>
  );
}
