'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ── Destination autocomplete (geocoding-api.open-meteo.com, no API key) ── */
interface GeoResult { id:number; name:string; country:string; country_code:string; admin1?:string; }

function flagEmoji(code:string) {
  if (!code || code.length!==2) return '🌍';
  return String.fromCodePoint(...[...code.toUpperCase()].map(c=>0x1F1E6+c.charCodeAt(0)-65));
}

function DestinationInput({ value, onChange }: { value:string; onChange:(v:string)=>void }) {
  const [query,       setQuery]       = useState(value);
  const [results,     setResults]     = useState<GeoResult[]>([]);
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const [thumbs,      setThumbs]      = useState<Record<number,string>>({});
  const containerRef  = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);
  const listRef       = useRef<HTMLUListElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout>|null>(null);
  const skipRef       = useRef(false);

  useEffect(() => { if (value !== query) setQuery(value); }, [value]); // eslint-disable-line

  const fetchSuggestions = useCallback(async (q:string) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=7&language=en&format=json`);
      const data = await res.json();
      const items: GeoResult[] = data.results ?? [];
      setResults(items); setActiveIdx(-1); setThumbs({});
      setOpen(items.length > 0);
      // fetch thumbnails in background
      Promise.allSettled(items.map(r =>
        fetch(`/api/place-photo?q=${encodeURIComponent(r.name)}`).then(r=>r.json()).then(d=>({id:r.id,url:d.url as string|null}))
      )).then(settled => {
        const m: Record<number,string> = {};
        settled.forEach(r => { if (r.status==='fulfilled'&&r.value.url) m[r.value.id]=r.value.url; });
        setThumbs(m);
      });
    } catch { setResults([]); setOpen(false); }
    finally { setLoading(false); }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value; setQuery(v); onChange(v); skipRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (!skipRef.current) fetchSuggestions(v); }, 300);
  };

  const select = (r: GeoResult) => {
    const parts = [r.name]; if (r.admin1&&r.admin1!==r.name) parts.push(r.admin1); parts.push(r.country);
    const label = parts.join(', ');
    skipRef.current = true; setQuery(label); onChange(label); setOpen(false); setResults([]); setActiveIdx(-1);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key==='ArrowDown') { e.preventDefault(); setActiveIdx(i=>Math.min(i+1,results.length-1)); }
    else if (e.key==='ArrowUp') { e.preventDefault(); setActiveIdx(i=>Math.max(i-1,-1)); }
    else if (e.key==='Enter'&&activeIdx>=0) { e.preventDefault(); select(results[activeIdx]); }
    else if (e.key==='Escape') { setOpen(false); setActiveIdx(-1); }
  };

  useEffect(() => {
    if (activeIdx>=0&&listRef.current) (listRef.current.children[activeIdx] as HTMLElement)?.scrollIntoView({block:'nearest'});
  }, [activeIdx]);

  useEffect(() => {
    const h = (e:MouseEvent) => { if (containerRef.current&&!containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return ()=>document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={containerRef} style={{ position:'relative' }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:18, pointerEvents:'none', zIndex:1 }}>📍</span>
        <input
          ref={inputRef} type="text" autoComplete="off" value={query}
          onChange={handleChange} onKeyDown={handleKey}
          placeholder="Paris, France · Tokyo, Japan · Bali, Indonesia…"
          style={{
            width:'100%', paddingLeft:48, paddingRight:40, paddingTop:15, paddingBottom:15,
            border:'1.5px solid rgba(0,68,123,0.15)', borderRadius:'var(--r-md)',
            fontFamily:'var(--font-body)', fontSize:16, color:'#000', background:'#fff', outline:'none',
            transition:'border-color 0.18s', boxSizing:'border-box',
          }}
          onFocus={e=>(e.target.style.borderColor='var(--navy)')}
          onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')}
        />
        {loading && (
          <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.8s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(0,68,123,0.2)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--navy)" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul ref={listRef} role="listbox" style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:200,
          background:'#fff', borderRadius:'var(--r-md)', border:'1px solid rgba(0,68,123,0.12)',
          boxShadow:'0 8px 32px rgba(0,68,123,0.14)', maxHeight:280, overflowY:'auto',
          listStyle:'none', padding:0, margin:0,
        }}>
          {results.map((r,i) => {
            const active = i===activeIdx;
            const parts = [r.name]; if (r.admin1&&r.admin1!==r.name) parts.push(r.admin1); parts.push(r.country);
            return (
              <li key={r.id} role="option" aria-selected={active}
                onMouseDown={e=>{e.preventDefault();select(r);}}
                onMouseEnter={()=>setActiveIdx(i)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 14px', cursor:'pointer',
                  background: active ? 'rgba(0,68,123,0.05)' : '#fff',
                  borderBottom: i<results.length-1 ? '1px solid rgba(0,68,123,0.06)' : 'none',
                  transition:'background 0.12s',
                }}>
                <div style={{
                  width:40, height:40, borderRadius:10, overflow:'hidden', flexShrink:0,
                  background:'#F4F7FB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20,
                }}>
                  {thumbs[r.id]
                    ? <img src={thumbs[r.id]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span>{flagEmoji(r.country_code)}</span>
                  }
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:13 }}>{flagEmoji(r.country_code)}</span>
                    <span style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:14, color:'#000', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</span>
                  </div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--gray-dark)', marginTop:1 }}>
                    {parts.slice(1).join(', ')}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Brand Icon components (flat, 2-colour: #FF8210 + #00447B) ── */
const IconCompass = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="14" stroke="#00447B" strokeWidth="2"/>
    <polygon points="16,6 19,16 16,14 13,16" fill="#FF8210"/>
    <polygon points="16,26 13,16 16,18 19,16" fill="#00447B"/>
  </svg>
);
const IconBolt = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M18 4L8 18h8l-2 10 14-16h-8l2-8z" fill="#FF8210"/>
  </svg>
);
const IconMap = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M4 6l8 4 8-4 8 4v20l-8-4-8 4-8-4V6z" fill="#00447B" opacity=".15"/>
    <path d="M12 10l8-4v20l-8 4V10z" fill="#00447B"/>
    <path d="M4 6l8 4v20L4 26V6z" fill="#679AC1"/>
    <path d="M20 6l8 4v20l-8-4V6z" fill="#FF8210" opacity=".7"/>
  </svg>
);
const IconStar = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M16 4l3 8h8l-6.5 5 2.5 8L16 20l-7 5 2.5-8L5 12h8z" fill="#FF8210"/>
  </svg>
);
const IconChat = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <rect x="4" y="6" width="24" height="16" rx="4" fill="#00447B"/>
    <path d="M10 28l4-6h8l4 6H10z" fill="#00447B"/>
    <rect x="9" y="11" width="14" height="2" rx="1" fill="#FF8210"/>
    <rect x="9" y="15" width="10" height="2" rx="1" fill="white" opacity=".6"/>
  </svg>
);
const IconShield = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="8" fill="#F4F7FB"/>
    <path d="M16 4l10 4v8c0 6-4 10-10 12C10 26 6 22 6 16V8l10-4z" fill="#00447B" opacity=".15"/>
    <path d="M16 4l10 4v8c0 6-4 10-10 12C10 26 6 22 6 16V8l10-4z" stroke="#00447B" strokeWidth="1.5"/>
    <path d="M11 16l3 3 7-7" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Data ── */
const HERO_IMAGES = [
  { url:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1800&q=90', label:'The world is waiting.' },
  { url:'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=90', label:'Mountains call.' },
  { url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=90', label:'Beach escapes await.' },
  { url:'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1800&q=90', label:'Cities never sleep.' },
  { url:'https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=1800&q=90', label:'Snow & adventure.' },
  { url:'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1800&q=90', label:'Desert wonders.' },
];

const QUICK_IDEAS = [
  { icon:'🏖️', label:'Beach escape',   query:'A relaxing 7-day beach escape' },
  { icon:'🗺️', label:'Road trip',       query:'An epic road trip adventure' },
  { icon:'🏔️', label:'Mountain trek',   query:'A mountain trekking adventure' },
  { icon:'🏛️', label:'Culture tour',    query:'A cultural and history tour' },
  { icon:'💑', label:'Romantic',        query:'A romantic couple getaway' },
  { icon:'👨‍👩‍👧', label:'Family fun',  query:'A fun family vacation' },
];

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
  'The Wild Explorer':       [{name:'Patagonia',     country:'Argentina & Chile', desc:'Glaciers, granite peaks and raw Andean wilderness with virtually no crowds.',   query:'Patagonia'},{name:'Faroe Islands',  country:'Denmark',           desc:'Dramatic sea cliffs, waterfalls and mist-shrouded volcanic seascapes.',       query:'Faroe Islands'},{name:'Kyrgyzstan',     country:'Central Asia',       desc:'Untouched mountain valleys, nomadic yurt camps and silk-road culture.',      query:'Kyrgyzstan'}],
  'The Thrill Seeker':       [{name:'Queenstown',    country:'New Zealand',        desc:'The adventure capital of the world — bungee, skydive, raft, all in one week.',query:'Queenstown New Zealand'},{name:'Interlaken',     country:'Switzerland',        desc:'Alpine adventure hub ringed by lakes, glaciers and extreme sports.',         query:'Interlaken Switzerland'},{name:'Moab',          country:'Utah, USA',          desc:'Red-rock canyon country built for climbing, mountain biking and off-road.',  query:'Moab Utah'}],
  'The Cultural Adventurer': [{name:'Tbilisi',        country:'Georgia',            desc:'Ancient cave monasteries, Soviet street art and world-class natural wine.',   query:'Tbilisi'},{name:'Oaxaca',         country:'Mexico',             desc:'Rich indigenous heritage, ancient ruins and a world-renowned food scene.',   query:'Oaxaca'},{name:'Luang Prabang',  country:'Laos',               desc:'Golden temples, saffron-robed monks at dawn and Mekong river sunsets.',      query:'Luang Prabang'}],
  'The Expedition Traveller':[{name:'Machu Picchu',   country:'Peru',               desc:'Iconic Inca citadel perched high in the cloud-covered Andes mountains.',     query:'Machu Picchu'},{name:'Angkor Wat',     country:'Cambodia',           desc:"The world's largest religious monument, deep in the jungle.",               query:'Angkor Wat'},{name:'Cappadocia',     country:'Turkey',             desc:'Hot-air balloons at sunrise over fairy-chimney rock formations.',            query:'Cappadocia'}],
  'The Mindful Wanderer':    [{name:'Azores',         country:'Portugal',           desc:'Volcanic island paradise with thermal pools, whale watching and wild coasts.',query:'Azores'},{name:'Chiang Mai',     country:'Thailand',           desc:'Jungle temples, elephant sanctuaries, wellness retreats and farm cuisine.',  query:'Chiang Mai'},{name:'Sintra',         country:'Portugal',           desc:'Fairy-tale palaces, misty forests and clifftop castles near Lisbon.',       query:'Sintra'}],
  'The Beach Lover':         [{name:'Maldives',       country:'Indian Ocean',       desc:'Overwater bungalows, crystal-clear lagoons and pristine coral reefs.',        query:'Maldives'},{name:'Bali',           country:'Indonesia',          desc:'Lush rice paddies, surf-ready beaches and vibrant sunset beach clubs.',      query:'Bali'},{name:'Seychelles',     country:'East Africa',        desc:'Granite-boulder beaches, turquoise bays and tropical marine paradise.',      query:'Seychelles'}],
  'The Cultural Connoisseur':[{name:'Havana',         country:'Cuba',               desc:"1950s cars, salsa rhythms, crumbling colonial grandeur and street art.",     query:'Havana'},{name:'Bologna',        country:'Italy',              desc:"Italy's food capital with medieval arcades, markets and student energy.",    query:'Bologna'},{name:'Fez',            country:'Morocco',            desc:"The world's oldest living medieval city, full of hidden souks and craft.",   query:'Fez'}],
  'The Cultured Traveller':  [{name:'Paris',          country:'France',             desc:'The city of art, gastronomy, fashion and unmatched cultural grandeur.',       query:'Paris'},{name:'Florence',       country:'Italy',              desc:'Renaissance art, leather markets, extraordinary trattorias and wine bars.',  query:'Florence'},{name:'Kyoto',          country:'Japan',              desc:'Ancient temples, geisha districts and immaculate seasonal gardens.',          query:'Kyoto'}],
  'The All-Rounder':         [{name:'Barcelona',      country:'Spain',              desc:'Gaudí architecture, tapas bars, beach days and world-class nightlife.',       query:'Barcelona'},{name:'Lisbon',         country:'Portugal',           desc:'Colourful trams, riverside restaurants and Atlantic surf beaches nearby.',   query:'Lisbon'},{name:'Cape Town',      country:'South Africa',       desc:'Mountain hikes, wine valleys, penguins and pristine ocean beaches.',         query:'Cape Town'}],
};

const BEACH_ALTERNATIVES: Record<string,{name:string;country:string;desc:string;query:string}> = {
  'The Wild Explorer':       {name:'Fernando de Noronha', country:'Brazil',         desc:'Remote volcanic archipelago with crystal-clear reefs and zero mass tourism.',     query:'Fernando de Noronha'},
  'The Thrill Seeker':       {name:'Nazaré',              country:'Portugal',       desc:'Home of the biggest surfable waves on earth — a pilgrimage for the bold.',        query:'Nazaré Portugal'},
  'The Cultural Adventurer': {name:'Zanzibar',            country:'Tanzania',       desc:'Spice-scented islands with a rich Swahili culture and white-sand beaches.',        query:'Zanzibar'},
  'The Expedition Traveller':{name:'Galápagos Islands',   country:'Ecuador',        desc:'Volcanic islands with unique wildlife, pristine reefs and raw natural wonder.',    query:'Galápagos Islands'},
  'The Mindful Wanderer':    {name:'Koh Lanta',           country:'Thailand',       desc:'Quiet long-beach island with mangroves, yoga retreats and true slow living.',      query:'Koh Lanta Thailand'},
  'The Cultural Connoisseur':{name:'Essaouira',           country:'Morocco',        desc:'Windswept blue-and-white port city with a medina, surf and fresh seafood.',        query:'Essaouira Morocco'},
  'The Cultured Traveller':  {name:'Amalfi Coast',        country:'Italy',          desc:'Dramatic cliffside villages, lemons and sapphire Mediterranean water.',            query:'Amalfi Coast'},
  'The All-Rounder':         {name:'Bali',                country:'Indonesia',      desc:'Lush rice paddies, surf-ready beaches, temples and vibrant beach clubs.',          query:'Bali'},
  'The Beach Lover':         {name:'Turks & Caicos',      country:'Caribbean',      desc:'Some of the world\'s most pristine beaches with zero development in sight.',       query:'Turks and Caicos'},
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
      'What iconic bucket-list sites are actually worth the hype, and what\'s the best way to visit them?',
      'Can you plan an active sightseeing route where I hike or cycle to landmarks instead of driving?',
      'Which UNESCO Heritage Sites can be combined efficiently in a two-week itinerary?',
      'Are there lesser-known viewpoints to famous landmarks that most tourists miss?',
      'What\'s the best time to visit major highlights while avoiding peak-season crowds?',
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
  const adv=energy<=1, rel=energy>=3, out=setting<=1, cul=setting>=3, hid=crowd>=3, pop=crowd<=1;

  type P = { name:string; icon:string; tagline:string; desc:string; tripStyles:string[] };
  let p: P;
  if      (adv&&out&&hid) p={name:'The Wild Explorer',       icon:'🌿',tagline:'Off the beaten path, close to nature',            desc:"You thrive on raw landscapes and remote places most travellers never find. Tourist crowds aren't your scene — give you a trail map and an adventure with no tour group in sight.",                         tripStyles:['Eco-tourism','Trekking','Wildlife Safari','Camping']};
  else if (adv&&out&&pop) p={name:'The Thrill Seeker',        icon:'⛰️',tagline:'Living for the rush',                            desc:"Adrenaline is your travel currency. Whether it's bungee jumping, white-water rafting, or scaling a via ferrata, you want every day to push your limits and leave you buzzing.",                  tripStyles:['Adventure Sports','Extreme Activities','Group Tours','Road Trip']};
  else if (adv&&cul&&hid) p={name:'The Cultural Adventurer',  icon:'🗺️',tagline:'Curious, bold, and deeply engaged',              desc:"History books aren't enough — you want to live the story. You seek out off-map heritage sites, local festivals, and hidden corners of ancient cities that most tourists walk straight past.", tripStyles:['Cultural Immersion','Heritage Travel','Slow Travel','Photography']};
  else if (adv&&cul&&pop) p={name:'The Expedition Traveller', icon:'🧭',tagline:'Iconic destinations, adventurous approach',       desc:"Bucket-list icons appeal to you, but on your own terms — climbing Machu Picchu at sunrise, cycling through Angkor Wat, or hiking the Cinque Terre rather than bussing it.",              tripStyles:['Bucket List','Active Sightseeing','Photography','City Break']};
  else if (rel&&out&&hid) p={name:'The Mindful Wanderer',     icon:'🌊',tagline:'Slow travel, deep connections',                  desc:"You travel to breathe. Untouched coastal paths, quiet fishing villages, and mornings with nothing planned but coffee and a view — these are the moments you'll still be talking about in 20 years.", tripStyles:['Wellness Retreat','Slow Travel','Eco-tourism','Coastal Escape']};
  else if (rel&&out&&pop) p={name:'The Beach Lover',          icon:'🏖️',tagline:'Sun, sea, and pure relaxation',                  desc:"You know exactly what a great holiday looks like: a sunlounger, warm water, and a cocktail. Maybe a snorkel. Definitely no alarm clocks. You've perfected the art of doing very little, very well.", tripStyles:['Beach Resort','Island Hopping','All-Inclusive','Snorkelling & Diving']};
  else if (rel&&cul&&hid) p={name:'The Cultural Connoisseur', icon:'🎭',tagline:'Deep immersion in local life',                   desc:"You travel at the speed of curiosity. Hidden art exhibitions, restaurants the locals love, and learning a few words of the language before you arrive — that's your kind of trip.",              tripStyles:['Cultural Immersion','City Break','Culinary Tour','Local Experiences']};
  else if (rel&&cul&&pop) p={name:'The Cultured Traveller',   icon:'🏛️',tagline:'Museums, wine, and memorable meals',            desc:"World-class museums, acclaimed restaurants, a comfortable hotel — your ideal trip blends culture with the finer things. You'll queue for the Louvre, but only after a proper croissant.",           tripStyles:['City Break','Culinary Tour','Luxury Travel','Heritage Sites']};
  else                    p={name:'The All-Rounder',          icon:'🌍',tagline:'Balanced, curious, and up for anything',         desc:"You refuse to be put in a box. Some days you want a beach, others a museum. Budget street food one night, a special dinner the next. This flexibility is your superpower — you thrive everywhere.", tripStyles:['Mixed Itinerary','City & Beach Combo','Flexible Travel','Cultural Highlights']};

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

  const coast = vibes.coast ?? 2; // 0=inland … 4=beach
  const questions = generateQuizQuestions(p.name, interests, dining, habits);
  let destinations = [...(PERSONA_DESTINATIONS[p.name] || PERSONA_DESTINATIONS['The All-Rounder'])];
  // If user leans coastal (coast >= 3), inject a beach-specific destination
  if (coast >= 3 && !['The Beach Lover'].includes(p.name)) {
    const beachAlt = BEACH_ALTERNATIVES[p.name];
    if (beachAlt) destinations = [beachAlt, destinations[0], destinations[1]];
  } else if (coast >= 3 && p.name === 'The Beach Lover') {
    // Already beach-focused — add extra beach gem
    const extra = BEACH_ALTERNATIVES['The Beach Lover'];
    if (extra) destinations = [...destinations.slice(0,2), extra];
  }
  return { ...p, budget, styles, questions, traits, destinations };
}

const ALL_TRIP_IDEAS = [
  { title:'10 Days in Japan', sub:'Tokyo to Kyoto', img:'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=600&q=80', tags:['Culture','Food'], dur:'10 days', bud:'Mid-range', q:'Plan a 10-day trip in Japan from Tokyo to Kyoto focusing on culture and food' },
  { title:'Greek Island Hopping', sub:'Santorini, Mykonos & Rhodes', img:'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80', tags:['Romance','Beach'], dur:'14 days', bud:'Premium', q:'Plan a 14-day Greek island hopping trip' },
  { title:'Patagonia Adventure', sub:'Argentina & Chile', img:'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80', tags:['Adventure','Hiking'], dur:'12 days', bud:'Mid-range', q:'Plan a 12-day Patagonia adventure covering Argentina and Chile' },
  { title:'Morocco Highlights', sub:'Marrakech to Sahara', img:'https://images.unsplash.com/photo-1489493512598-d08130f49bea?auto=format&fit=crop&w=600&q=80', tags:['Culture','Desert'], dur:'8 days', bud:'Budget', q:'Plan an 8-day Morocco trip from Marrakech to the Sahara' },
  { title:'Bali Wellness Retreat', sub:'Ubud & Seminyak', img:'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=600&q=80', tags:['Wellness','Beach'], dur:'10 days', bud:'Mid-range', q:'Plan a 10-day Bali wellness retreat in Ubud and Seminyak' },
  { title:'Amalfi Coast Drive', sub:'Naples to Positano', img:'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80', tags:['Scenic','Food'], dur:'7 days', bud:'Premium', q:'Plan a 7-day Amalfi Coast road trip from Naples to Positano' },
  { title:'Iceland Ring Road', sub:'Reykjavik & Beyond', img:'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=600&q=80', tags:['Adventure','Nature'], dur:'10 days', bud:'Mid-range', q:'Plan a 10-day Iceland ring road trip from Reykjavik' },
  { title:'Safari in Kenya', sub:'Masai Mara & Amboseli', img:'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=600&q=80', tags:['Wildlife','Safari'], dur:'9 days', bud:'Premium', q:'Plan a 9-day safari in Kenya covering Masai Mara and Amboseli' },
  { title:'Peru & Machu Picchu', sub:'Lima, Cusco & Inca Trail', img:'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=600&q=80', tags:['History','Hiking'], dur:'12 days', bud:'Mid-range', q:'Plan a 12-day Peru trip including Lima, Cusco and Machu Picchu' },
  { title:'New Zealand South Island', sub:'Queenstown to Fiordland', img:'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=600&q=80', tags:['Adventure','Scenic'], dur:'14 days', bud:'Mid-range', q:'Plan a 14-day New Zealand South Island road trip from Queenstown to Fiordland' },
  { title:'Thailand Island Tour', sub:'Bangkok, Chiang Mai & Koh Samui', img:'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=600&q=80', tags:['Beach','Culture'], dur:'14 days', bud:'Budget', q:'Plan a 14-day Thailand trip covering Bangkok, Chiang Mai and Koh Samui' },
  { title:'Portugal Road Trip', sub:'Lisbon, Porto & Algarve', img:'https://images.unsplash.com/photo-1513735492246-483525079686?auto=format&fit=crop&w=600&q=80', tags:['Culture','Food'], dur:'10 days', bud:'Budget', q:'Plan a 10-day Portugal road trip from Lisbon to Porto and the Algarve' },
  { title:'Maldives Overwater Escape', sub:'North & South Malé Atolls', img:'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=600&q=80', tags:['Beach','Luxury'], dur:'7 days', bud:'Luxury', q:'Plan a 7-day luxury Maldives trip with overwater bungalow and snorkelling' },
  { title:'Vietnam Street Food Trail', sub:'Hanoi, Hội An & Saigon', img:'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=600&q=80', tags:['Food','Culture'], dur:'12 days', bud:'Budget', q:'Plan a 12-day Vietnam street food and culture trip from Hanoi to Ho Chi Minh City' },
  { title:'Swiss Alps Winter', sub:'Zermatt, Interlaken & St Moritz', img:'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80', tags:['Winter','Ski'], dur:'8 days', bud:'Premium', q:'Plan an 8-day Swiss Alps winter trip covering Zermatt, Interlaken and St Moritz' },
  { title:'Costa Rica Wildlife', sub:'Arenal, Manuel Antonio & Tortuguero', img:'https://images.unsplash.com/photo-1518259102261-b40117eabbc9?auto=format&fit=crop&w=600&q=80', tags:['Wildlife','Adventure'], dur:'10 days', bud:'Mid-range', q:'Plan a 10-day Costa Rica wildlife and adventure trip' },
  { title:'India Golden Triangle', sub:'Delhi, Agra & Jaipur', img:'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80', tags:['Culture','History'], dur:'8 days', bud:'Budget', q:'Plan an 8-day India Golden Triangle trip covering Delhi, Agra and Jaipur' },
  { title:'Romantic Paris Getaway', sub:'Paris & Versailles', img:'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80', tags:['Romance','Culture'], dur:'5 days', bud:'Premium', q:'Plan a 5-day romantic Paris trip including Versailles day trip' },
  { title:'Tanzania Safari & Zanzibar', sub:'Serengeti, Ngorongoro & Zanzibar', img:'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=600&q=80', tags:['Safari','Beach'], dur:'12 days', bud:'Premium', q:'Plan a 12-day Tanzania safari in the Serengeti and Ngorongoro followed by Zanzibar beach' },
  { title:'Spain Food & Culture', sub:'Madrid, Seville & Barcelona', img:'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=600&q=80', tags:['Food','Culture'], dur:'10 days', bud:'Mid-range', q:'Plan a 10-day Spain road trip covering Madrid, Seville and Barcelona with food focus' },
];

const FEATURES = [
  { icon:<IconCompass/>, title:'Destination Overview',  desc:'What makes it special and must-see highlights' },
  { icon:<IconBolt/>,    title:'Generated in 30s',       desc:'AI crafts your full plan in under 30 seconds' },
  { icon:<IconMap/>,     title:'Day-by-Day Itinerary',   desc:'Morning, afternoon, and evening activities' },
  { icon:<IconStar/>,    title:'Accommodation Picks',    desc:'Curated stays matching your budget' },
  { icon:<IconChat/>,    title:'AI Chat Refinement',     desc:'Ask follow-up questions or tweak any detail' },
  { icon:<IconShield/>,  title:'Practical Tips',         desc:'Visas, safety, culture, local apps and more' },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery]         = useState('');
  const [quizStep,       setQuizStep]       = useState(0);
  const [showQuiz,       setShowQuiz]       = useState(false);
  const [quizDone,       setQuizDone]       = useState(false);
  const [quizVibes,      setQuizVibes]      = useState<Record<string,number>>({energy:2,setting:2,crowd:2,coast:2});
  const [quizAccom,      setQuizAccom]      = useState<string[]>([]);
  const [quizHabits,     setQuizHabits]     = useState<Record<string,string>>({});
  const [quizDining,     setQuizDining]     = useState<string[]>([]);
  const [quizInterests,  setQuizInterests]  = useState<string[]>([]);
  const [quizPersona,    setQuizPersona]    = useState<ReturnType<typeof computePersona>|null>(null);
  const [destPhotos,     setDestPhotos]     = useState<Record<string,string|null>>({});
  const [aiDestinations, setAiDestinations] = useState<Array<{name:string;country:string;desc:string;query:string}>|null>(null);
  const [aiDestsLoading, setAiDestsLoading] = useState(false);
  const [preFilledData, setPreFilledData] = useState<{budget:string; styles:string[]} | null>(null);
  const [heroImgIdx, setHeroImgIdx] = useState(0);
  const [tripIdeas] = useState(() => [...ALL_TRIP_IDEAS].sort(()=>Math.random()-0.5));
  const carouselRef = useRef<HTMLDivElement>(null);
  const carouselIdxRef = useRef(0);

  const go = (q?: string) => {
    const s = (q || query).trim();
    if (!s) return;
    router.push(`/plan?prompt=${encodeURIComponent(s)}`);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior:'smooth' });
  };

  useEffect(() => {
    const t = setInterval(() => setHeroImgIdx(i => (i+1) % HERO_IMAGES.length), 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const CARD_W = 320 + 20; // card width + gap
    const t = setInterval(() => {
      const maxIdx = tripIdeas.length - 1;
      carouselIdxRef.current = carouselIdxRef.current >= maxIdx ? 0 : carouselIdxRef.current + 1;
      if (carouselIdxRef.current === 0) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: CARD_W, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(t);
  }, [tripIdeas.length]);

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
    setAiDestinations(persona.destinations); // static fallback
  };

  const finishQuiz = () => {
    const persona = computePersona(quizVibes, quizAccom, quizHabits, quizDining, quizInterests);
    setQuizPersona(persona);
    setPreFilledData({ budget: persona.budget, styles: persona.styles });
    setQuizDone(true);
    fetchAiDestinations(persona);
  };

  const resetQuiz = () => {
    setQuizStep(0); setShowQuiz(false); setQuizDone(false);
    setQuizVibes({energy:2,setting:2,crowd:2,coast:2}); setQuizAccom([]);
    setQuizHabits({}); setQuizDining([]); setQuizInterests([]); setQuizPersona(null);
    setDestPhotos({}); setAiDestinations(null); setAiDestsLoading(false);
  };

  // Fetch Wikipedia photos whenever AI destinations resolve
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

  /* ── Shared styles ── */
  const S = {
    section: { padding:'96px 0' } as React.CSSProperties,
    label:   { fontFamily:'var(--font-head)', fontWeight:600, fontSize:13, letterSpacing:2, textTransform:'uppercase' as const, color:'var(--orange)', marginBottom:12 },
    h2:      { fontFamily:'var(--font-head)', fontWeight:500, fontSize:'var(--fs-h2)', color:'#000', lineHeight:1.3, marginBottom:16 } as React.CSSProperties,
    chip: (active=false): React.CSSProperties => ({
      display:'inline-flex', alignItems:'center', gap:6,
      background: active ? 'rgba(255,130,16,0.1)' : '#F4F7FB',
      border:`1.5px solid ${active ? 'var(--orange)' : 'transparent'}`,
      color: active ? 'var(--orange)' : '#000',
      fontFamily:'var(--font-head)', fontWeight:500, fontSize:14,
      padding:'8px 16px', borderRadius:'var(--r-pill)', cursor:'pointer',
      transition:'all 0.18s',
    }),
  };

  return (
    <div style={{ fontFamily:'var(--font-body)', color:'#000', background:'#fff', overflowX:'hidden' }}>

      {/* ───── NAV ───── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:68, padding:'0 40px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        background:'rgba(255,255,255,0.92)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--border)',
      }}>
        <a href="/" style={{ display:'flex', alignItems:'center' }}>
          <img src="/lunaletsgo-logo.jpeg" alt="Luna Let's Go" style={{ height:44, width:'auto' }} />
        </a>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {['Trip Ideas','Quiz'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}
               style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:14, color:'var(--gray-dark)', padding:'8px 14px', borderRadius:8 }}>
              {l}
            </a>
          ))}
          <a href="#" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}} style={{
            marginLeft:12, background:'var(--navy)', color:'#fff',
            fontFamily:'var(--font-head)', fontWeight:600, fontSize:14,
            padding:'10px 22px', borderRadius:'var(--r-pill)',
          }}>Plan a Trip</a>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section style={{ position:'relative', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', overflow:'visible', padding:'80px 24px' }}>
        {/* Photo — rotates every 10s */}
        {HERO_IMAGES.map((img,i) => (
          <div key={img.url} style={{ position:'absolute', inset:0, backgroundImage:`url(${img.url})`, backgroundSize:'cover', backgroundPosition:'center 40%', transition:'opacity 1.5s ease', opacity:i===heroImgIdx?1:0 }} />
        ))}
        {/* Overlay */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(0,40,90,0.80) 0%, rgba(0,68,123,0.65) 50%, rgba(0,20,60,0.82) 100%)' }} />

        <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:960, width:'100%' }}>

          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.22)', borderRadius:'var(--r-pill)', padding:'6px 18px', marginBottom:24, animation:'fadeIn 0.6s ease both' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#4ADE80', flexShrink:0 }} />
            <span style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:13, color:'rgba(255,255,255,0.92)' }}>AI-powered · Free · No account required</span>
          </div>

          {/* H1 */}
          <h1 style={{ color:'#fff', marginBottom:14, animation:'fadeUp 0.65s 0.1s ease both' }}>
            Plan your trip<br/>
            <span style={{ color:'var(--orange-light)' }}>in 30 seconds.</span>
          </h1>

          <p style={{ fontFamily:'var(--font-body)', fontWeight:400, fontSize:17, color:'rgba(255,255,255,0.70)', marginBottom:32, animation:'fadeUp 0.65s 0.2s ease both' }}>
            Tell us where you want to go — we'll handle the rest.
          </p>

          {/* Form */}
          <div style={{ display:'inline-block', width:'100%', maxWidth:560, animation:'fadeUp 0.65s 0.3s ease both', textAlign:'left' }}>
            <HeroStepForm onSubmit={go} preFilledData={preFilledData} />
          </div>

        </div>

        {/* Luna 3 — desktop only, bottom of viewport */}
        <img
          src="/luna_3.png"
          alt="Luna — AI travel assistant"
          className="luna2-avatar"
          style={{
            position:'absolute', right:'calc(50% - 580px)',
            top:'calc(100vh - 235px)', bottom:'auto',
            width:235, height:'auto', objectFit:'contain',
            pointerEvents:'none', zIndex:3,
          }}
        />
      </section>

      {/* ───── STATS BAR ───── */}
      <section style={{ background:'var(--navy)', padding:'0' }}>
        <div style={{ maxWidth:960, margin:'0 auto', padding:'0 32px', display:'flex', justifyContent:'center', flexWrap:'wrap' }}>
          {[['30s','Plan generated'],['7','Plan sections'],['12','Trip styles'],['100%','Personalised']].map(([v,l],i,arr)=>(
            <div key={l} style={{ flex:'1 1 140px', textAlign:'center', padding:'28px 32px', borderRight: i<arr.length-1?'1px solid rgba(255,255,255,0.12)':'none' }}>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:32, color:'var(--orange-light)' }}>{v}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:'rgba(255,255,255,0.55)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>


      {/* ───── HOW IT WORKS ───── */}
      <section style={{ ...S.section, background:'var(--bg-section)' }}>
        <div className="container" style={{ textAlign:'center' }}>
          <p style={S.label}>Simple Process</p>
          <h2 style={{ ...S.h2, textAlign:'center', marginBottom:56 }}>How it works</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:40 }}>
            {[
              { n:'01', icon:'✏️', t:'Tell us your dream trip', d:'Destination, travel style, dates, group and budget — all in one natural sentence or our smart form.' },
              { n:'02', icon:'⚡', t:'AI crafts your plan',     d:'Your personalised itinerary is generated in under 30 seconds with 7 detailed sections tailored to you.' },
              { n:'03', icon:'✨', t:'Explore & refine',        d:'Chat with AI to adjust any detail. Add activities, change hotels, tweak the budget — all in real time, for free.' },
            ].map(s=>(
              <div key={s.n} style={{ textAlign:'center' }}>
                <div style={{ width:72, height:72, borderRadius:20, background:'#fff', border:'1.5px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 16px', boxShadow:'var(--shadow-card)' }}>{s.icon}</div>
                <p style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, color:'var(--gray-light)', letterSpacing:2, marginBottom:10 }}>{s.n}</p>
                <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:'var(--fs-h3)', color:'#000', marginBottom:10 }}>{s.t}</h3>
                <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'var(--gray-dark)', lineHeight:1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── QUIZ ───── */}
      <section id="quiz" style={{ ...S.section, background:'var(--navy)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 20% 50%, rgba(103,154,193,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,130,16,0.10) 0%, transparent 40%)', pointerEvents:'none' }} />
        <div className="container" style={{ maxWidth:820, textAlign:'center', position:'relative', zIndex:1 }}>
          <p style={{ ...S.label, color:'var(--orange-light)' }}>Not Sure Where to Go?</p>
          <h2 style={{ ...S.h2, color:'#fff', fontSize:32, marginBottom:12 }}>Discover your traveller persona</h2>
          <p style={{ fontFamily:'var(--font-body)', fontSize:17, color:'rgba(255,255,255,0.55)', marginBottom:48 }}>
            5 quick questions. We&apos;ll define your travel style, suggest destinations, and pre-fill your planner.
          </p>

          {!showQuiz && !quizDone ? (
            <button onClick={()=>setShowQuiz(true)} style={{ background:'var(--orange)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:16, padding:'18px 44px', borderRadius:'var(--r-pill)', border:'none', cursor:'pointer', boxShadow:'0 8px 32px rgba(255,130,16,0.40)', letterSpacing:0.3 }}>
              🎯 Find my travel persona
            </button>

          ) : quizDone && quizPersona ? (
            /* ── PERSONA RESULTS ── */
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
                  {aiDestsLoading && <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'rgba(255,255,255,0.40)', display:'flex', alignItems:'center', gap:6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation:'spin 0.9s linear infinite', flexShrink:0 }}><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/><path d="M12 2a10 10 0 0 1 10 10" stroke="#FF8210" strokeWidth="3" strokeLinecap="round"/></svg>
                    AI is picking destinations…
                  </span>}
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
                <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} style={{ background:'var(--orange)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, padding:'14px 32px', borderRadius:'var(--r-pill)', border:'none', cursor:'pointer', boxShadow:'0 6px 20px rgba(255,130,16,0.35)' }}>
                  ✈ Go to my planner ↑
                </button>
                <button onClick={resetQuiz} style={{ background:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.8)', fontFamily:'var(--font-head)', fontWeight:500, fontSize:15, padding:'14px 24px', borderRadius:'var(--r-pill)', border:'1px solid rgba(255,255,255,0.20)', cursor:'pointer' }}>
                  ↺ Retake quiz
                </button>
              </div>
            </div>

          ) : (
            /* ── QUIZ IN PROGRESS ── */
            <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'var(--r-lg)', padding:'40px 36px' }}>
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
                <div style={{ textAlign:'left' }}>
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
                <div style={{ textAlign:'left' }}>
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
          )}
        </div>
      </section>

      {/* ───── TRIP IDEAS ───── */}
      <section id="trip-ideas" style={{ ...S.section, background:'#fff', overflow:'hidden' }}>
        <div className="container" style={{ paddingBottom:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40, flexWrap:'wrap', gap:16 }}>
            <div>
              <p style={S.label}>Curated Itineraries</p>
              <h2 style={S.h2}>Ready-made trip ideas.</h2>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <a href="#" onClick={e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}} style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:15, color:'var(--navy)', borderBottom:'2px solid var(--navy)', paddingBottom:2 }}>Create a custom trip →</a>
              <div style={{ display:'flex', gap:8 }}>
                <button
                  aria-label="Previous"
                  onClick={()=>{
                    const el=carouselRef.current; if(!el) return;
                    const CARD_W=320+20;
                    carouselIdxRef.current=Math.max(0,carouselIdxRef.current-1);
                    el.scrollBy({left:-CARD_W,behavior:'smooth'});
                  }}
                  style={{ width:40,height:40,borderRadius:'50%',border:'1.5px solid var(--border)',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'var(--navy)',transition:'all 0.18s' }}
                >‹</button>
                <button
                  aria-label="Next"
                  onClick={()=>{
                    const el=carouselRef.current; if(!el) return;
                    const CARD_W=320+20; const maxIdx=tripIdeas.length-1;
                    if(carouselIdxRef.current>=maxIdx){carouselIdxRef.current=0;el.scrollTo({left:0,behavior:'smooth'});}
                    else{carouselIdxRef.current+=1;el.scrollBy({left:CARD_W,behavior:'smooth'});}
                  }}
                  style={{ width:40,height:40,borderRadius:'50%',border:'1.5px solid var(--border)',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'var(--navy)',transition:'all 0.18s' }}
                >›</button>
              </div>
            </div>
          </div>
        </div>
        {/* Full-bleed scroll track */}
        <div
          ref={carouselRef}
          className="carousel-scroll"
          style={{ display:'flex', gap:20, overflowX:'auto', scrollSnapType:'x mandatory', paddingLeft:32, paddingRight:32, paddingBottom:24, cursor:'grab' }}
        >
          {tripIdeas.map(t=>(
            <div
              key={t.title}
              onClick={()=>go(t.q)}
              style={{ flexShrink:0, width:320, scrollSnapAlign:'start', background:'#fff', borderRadius:'var(--r-lg)', overflow:'hidden', cursor:'pointer', border:'1px solid var(--border)', boxShadow:'var(--shadow-card)', transition:'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 36px rgba(0,0,0,0.12)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='var(--shadow-card)';}}
            >
              <div style={{ position:'relative', height:200, overflow:'hidden' }}>
                <img src={t.img} alt={t.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <div style={{ position:'absolute', top:12, left:12, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {t.tags.map(tag=>(
                    <span key={tag} style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', color:'#fff', fontFamily:'var(--font-head)', fontWeight:600, fontSize:11, padding:'3px 10px', borderRadius:'var(--r-pill)', textTransform:'uppercase', letterSpacing:0.4 }}>{tag}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding:'18px 20px 20px' }}>
                <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:'var(--fs-h3)', color:'#000', marginBottom:4 }}>{t.title}</h3>
                <p style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:14, marginBottom:14 }}>{t.sub}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ display:'flex', gap:14 }}>
                    <span style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:13 }}>📅 {t.dur}</span>
                    <span style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:13 }}>💰 {t.bud}</span>
                  </div>
                  <span style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:13, color:'var(--orange)' }}>Plan this ↗</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ───── FEATURES ───── */}
      <section style={{ ...S.section, background:'#fff' }}>
        <div className="container">
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <p style={S.label}>Full Coverage</p>
            <h2 style={{ ...S.h2, textAlign:'center' }}>Everything in every plan</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:20 }}>
            {FEATURES.map(f=>(
              <div key={f.title} style={{ background:'var(--bg-section)', borderRadius:'var(--r-md)', padding:'24px 22px', display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ flexShrink:0 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:'var(--fs-h3)', color:'#000', marginBottom:6 }}>{f.title}</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:'var(--gray-dark)', lineHeight:1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer style={{ background:'var(--navy)', padding:'48px 40px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <img src="/lunaletsgo-logo.jpeg" alt="Luna Let's Go" style={{ height:42, width:'auto' }} />
        <p style={{ fontFamily:'var(--font-body)', color:'rgba(255,255,255,0.45)', fontSize:13 }}>
          © 2026 GOTO AI Travel Planner. Built with Next.js &amp; OpenRouter.{' '}
          <a href="https://open-meteo.com" style={{ color:'rgba(255,255,255,0.5)', textDecoration:'underline' }}>Weather by Open-Meteo</a>
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        button:hover { opacity:0.88; }
        .container { max-width:1200px; margin:0 auto; padding:0 32px; }
        .quiz-slider { -webkit-appearance:none; appearance:none; width:100%; height:8px; border-radius:100px; outline:none; cursor:pointer; background:linear-gradient(to right, #FF8210 var(--fill,50%), rgba(255,255,255,0.15) var(--fill,50%)); }
        .quiz-slider::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:26px; height:26px; border-radius:50%; background:#FF8210; cursor:pointer; box-shadow:0 0 0 5px rgba(255,130,16,0.25), 0 2px 8px rgba(0,0,0,0.3); transition:box-shadow 0.15s; }
        .quiz-slider::-webkit-slider-thumb:hover { box-shadow:0 0 0 8px rgba(255,130,16,0.30), 0 2px 8px rgba(0,0,0,0.3); }
        .quiz-slider::-moz-range-thumb { width:26px; height:26px; border-radius:50%; background:#FF8210; cursor:pointer; border:none; box-shadow:0 0 0 5px rgba(255,130,16,0.25); }
        .quiz-slider::-moz-range-progress { background:#FF8210; height:8px; border-radius:100px; }
        @keyframes shimmer { 0%,100% { opacity:0.5; } 50% { opacity:1; } }
        .carousel-scroll { -ms-overflow-style:none; scrollbar-width:none; }
        .carousel-scroll::-webkit-scrollbar { display:none; }
        .carousel-scroll:active { cursor:grabbing; }
        @media (max-width: 768px) {
          .hero-layout { flex-direction: column !important; align-items: center !important; }
          .hero-maya-col { width: 100% !important; flex-direction: row !important; align-items: flex-end !important; gap: 16px; }
          .hero-maya-col img { max-width: 140px !important; margin-top: 0 !important; }
        }
        @media (max-width: 400px) {
          .step-label { font-size: 9px !important; }
          .step-header { padding: 12px 14px !important; }
        }
        .luna2-avatar { display: none; }
        @media (min-width: 1024px) {
          .luna2-avatar { display: block; }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
function HeroStepForm({ onSubmit, preFilledData }: { onSubmit:(q:string)=>void; preFilledData?:{budget:string;styles:string[]}|null }) {
  const [step, setStep] = useState(0);
  const [dest, setDest] = useState('');
  const [dep, setDep] = useState('');
  const [ret, setRet] = useState('');
  const [adults, setAdults] = useState(2);
  const [kids, setKids] = useState(0);
  const [adultAges, setAdultAges] = useState<string[]>(['','']);
  const [childAges, setChildAges] = useState<string[]>([]);
  const [companion, setCompanion] = useState('couple');
  const [depTime, setDepTime] = useState('');
  const [retTime, setRetTime] = useState('');
  const [styles, setStyles] = useState<string[]>(preFilledData?.styles ?? []);
  const [budget, setBudget] = useState(preFilledData?.budget ?? 'comfort');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string,string>>({});

  const today = new Date().toISOString().split('T')[0];

  const goNext = (nextStep: number) => {
    const errs: Record<string,string> = {};
    if (!dest.trim()) errs.dest = 'Please enter your destination.';
    if (!dep) errs.dep = 'Please choose a start date.';
    setErrors(errs);
    if (Object.keys(errs).length === 0) setStep(nextStep);
  };

  useEffect(() => {
    if (preFilledData) { setStyles(preFilledData.styles); setBudget(preFilledData.budget); setStep(1); }
  }, [preFilledData]); // eslint-disable-line

  const setAdultsChecked = (n:number) => {
    setAdults(n);
    setAdultAges(prev=>{const a=[...prev];while(a.length<n)a.push('');return a.slice(0,n);});
    if(n===1&&kids===0) setCompanion('solo'); else if(companion==='solo') setCompanion('couple');
  };
  const setKidsChecked = (n:number) => {
    setKids(n);
    setChildAges(prev=>{const a=[...prev];while(a.length<n)a.push('');return a.slice(0,n);});
    if(adults===1&&n===0) setCompanion('solo');
    else if(n>0&&companion!=='family') setCompanion('family');
    else if(n===0&&companion==='family') setCompanion('couple');
  };
  const toggle = (v:string) => setStyles(p=>p.includes(v)?p.filter(s=>s!==v):[...p,v]);

  const submit = () => {
    if (!dest) { setStep(0); return; }
    const bLabels: Record<string,string> = {budget:'budget-friendly',comfort:'comfortable',premium:'premium',luxury:'luxury'};
    const tripStyles = styles.length ? `focusing on ${styles.join(', ')}` : '';
    const dates = dep ? `from ${dep}${depTime?` at ${depTime}`:''}${ret?` to ${ret}`:''}${ret&&retTime?` arriving ${retTime}`:''}` : '';
    const group = `for ${adults} adult${adults>1?'s':''}${kids>0?` and ${kids} child${kids>1?'ren':''}`:''}`;
    const cLabel: Record<string,string> = {solo:'travelling solo',couple:'travelling as a couple',partner:'travelling as a couple',family:'travelling with family',friends:'travelling with friends'};
    const filledAdultAges = adultAges.filter(Boolean);
    const filledChildAges = childAges.filter(Boolean);
    const ageParts = [filledAdultAges.length?`adults aged ${filledAdultAges.join(', ')}`:'',...(filledChildAges.length?[`children aged ${filledChildAges.join(', ')}`]:[])].filter(Boolean);
    const ageCtx = ageParts.length ? `. Traveller ages: ${ageParts.join('; ')}` : '';
    onSubmit(`Plan a trip to ${dest} ${dates} ${group}, ${cLabel[companion]||''}, with ${bLabels[budget]||budget} budget ${tripStyles}${ageCtx}${notes?`. Additional context: ${notes}`:''}`);
  };

  const styleOpts = [
    {v:'cultural',label:'🏛️ Cultural'},{v:'food',label:'🍽️ Food & Drink'},
    {v:'nightlife',label:'🎉 Nightlife'},{v:'shopping',label:'🛍️ Shopping'},
    {v:'family',label:'👨‍👩‍👧 Family'},{v:'adventure',label:'🏔️ Adventure'},
    {v:'beach',label:'🏖️ Beach'},{v:'wellness',label:'🧘 Wellness'},
    {v:'romance',label:'💑 Romance'},{v:'nature',label:'🌿 Nature'},
    {v:'luxury',label:'💎 Luxury'},{v:'photography',label:'📸 Photography'},
    {v:'ski',label:'🎿 Winter Sports'},{v:'safari',label:'🦁 Safari'},
    {v:'roadtrip',label:'🚗 Road Trip'},{v:'citybreak',label:'🏙️ City Break'},
  ];
  const inp: React.CSSProperties = {width:'100%',boxSizing:'border-box' as const,border:'1.5px solid rgba(0,68,123,0.15)',borderRadius:'var(--r-md)',padding:'11px 14px',fontFamily:'var(--font-body)',fontSize:14,color:'#000',background:'#fff',outline:'none',transition:'border-color 0.18s'};
  const lbl: React.CSSProperties = {fontFamily:'var(--font-head)',fontWeight:600,fontSize:11,color:'var(--navy)',marginBottom:6,display:'block',textTransform:'uppercase',letterSpacing:0.8};
  const cBox: React.CSSProperties = {display:'flex',alignItems:'center',background:'#F4F7FB',border:'1.5px solid rgba(0,68,123,0.12)',borderRadius:'var(--r-md)',overflow:'hidden'};
  const cBtn: React.CSSProperties = {width:40,height:40,background:'none',border:'none',color:'var(--navy)',fontSize:20,cursor:'pointer',flexShrink:0};
  const navBtn = (primary=true): React.CSSProperties => ({
    fontFamily:'var(--font-head)',fontWeight:700,fontSize:14,padding:'12px 28px',borderRadius:'var(--r-pill)',border:primary?'none':'1.5px solid rgba(0,68,123,0.15)',
    background:primary?'var(--navy)':'none',color:primary?'#fff':'var(--navy)',cursor:'pointer',transition:'all 0.18s',
  });
  const STEPS = ['Where & When','Travel Style','Budget & Trip'];

  return (
    <div style={{ background:'#fff', borderRadius:'var(--r-lg)', boxShadow:'0 32px 80px rgba(0,0,0,0.28)', overflow:'hidden', textAlign:'left' }}>
      {/* Step header */}
      <div className="step-header" style={{ background:'var(--navy)', padding:'14px 28px', display:'flex', alignItems:'center' }}>
        {STEPS.map((label,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', flex:i<STEPS.length-1?1:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              <div style={{ width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center', background:i<step?'var(--orange)':i===step?'#fff':'rgba(255,255,255,0.15)', fontFamily:'var(--font-head)',fontWeight:700,fontSize:11, color:i<step?'#fff':i===step?'var(--navy)':'rgba(255,255,255,0.35)', flexShrink:0,transition:'all 0.2s' }}>
                {i<step?'✓':i+1}
              </div>
              <span className="step-label" style={{ fontFamily:'var(--font-head)',fontWeight:i===step?600:400,fontSize:12,color:i===step?'#fff':'rgba(255,255,255,0.40)',whiteSpace:'nowrap' }}>{label}</span>
            </div>
            {i<STEPS.length-1 && <div style={{ flex:1,height:1,background:'rgba(255,255,255,0.15)',margin:'0 10px' }} />}
          </div>
        ))}
      </div>

      <div style={{ padding:'24px 28px' }}>
        {/* Step 0: Where & When */}
        {step===0 && (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {/* Destination */}
            <div>
              <label style={lbl}>Destination <span style={{ color:'var(--orange)' }}>*</span></label>
              <DestinationInput value={dest} onChange={v=>{setDest(v);if(v.trim())setErrors(p=>({...p,dest:''}));}} />
              {errors.dest && <p style={{ fontFamily:'var(--font-body)',fontSize:12,color:'#E53E3E',marginTop:5,display:'flex',alignItems:'center',gap:4 }}>⚠ {errors.dest}</p>}
            </div>

            {/* From date + arrival time */}
            <div>
              <label style={lbl}>From <span style={{ color:'var(--orange)' }}>*</span></label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:0 }}>
                  <input type="date" value={dep} min={today}
                    onChange={e=>{setDep(e.target.value);if(ret&&e.target.value>ret)setRet('');if(e.target.value)setErrors(p=>({...p,dep:''}));}}
                    style={{...inp,borderColor:errors.dep?'#E53E3E':'rgba(0,68,123,0.15)'}}
                    onFocus={e=>(e.target.style.borderColor=errors.dep?'#E53E3E':'var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor=errors.dep?'#E53E3E':'rgba(0,68,123,0.15)')} />
                </div>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',whiteSpace:'nowrap',flexShrink:0 }}>Est. arrival</span>
                <div style={{ position:'relative', width:110, flexShrink:0 }}>
                  <input type="time" value={depTime} onChange={e=>setDepTime(e.target.value)}
                    style={{...inp,padding:'11px 8px'}}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
              </div>
              {errors.dep && <p style={{ fontFamily:'var(--font-body)',fontSize:12,color:'#E53E3E',marginTop:5,display:'flex',alignItems:'center',gap:4 }}>⚠ {errors.dep}</p>}
            </div>

            {/* To date + end time */}
            <div>
              <label style={lbl}>To <span style={{ fontFamily:'var(--font-body)',fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--gray-dark)' }}>(optional)</span></label>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ position:'relative', flex:1, minWidth:0 }}>
                  <input type="date" value={ret} min={dep || today}
                    onChange={e=>setRet(e.target.value)}
                    style={inp}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
                <span style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',whiteSpace:'nowrap',flexShrink:0 }}>Est. return</span>
                <div style={{ position:'relative', width:110, flexShrink:0 }}>
                  <input type="time" value={retTime} onChange={e=>setRetTime(e.target.value)}
                    style={{...inp,padding:'11px 8px'}}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')}
                    onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
                </div>
              </div>
            </div>

            {/* Travellers */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
              {([['Adults',adults,setAdultsChecked,1],['Children',kids,setKidsChecked,0]] as const).map(([l,val,set,min])=>(
                <div key={l as string}>
                  <label style={lbl}>{l as string}</label>
                  <div style={cBox}>
                    <button onClick={()=>(set as (n:number)=>void)(Math.max(min as number,(val as number)-1))} style={cBtn}>−</button>
                    <span style={{ flex:1,textAlign:'center',fontFamily:'var(--font-head)',fontWeight:700,fontSize:18,color:'var(--navy)' }}>{val as number}</span>
                    <button onClick={()=>(set as (n:number)=>void)((val as number)+1)} style={cBtn}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Ages */}
            {(adults>0||kids>0) && (
              <div>
                <p style={{ fontFamily:'var(--font-head)',fontWeight:500,fontSize:10,color:'var(--gray-dark)',textTransform:'uppercase',letterSpacing:0.8,marginBottom:8 }}>Ages <span style={{ fontWeight:400,textTransform:'none',letterSpacing:0 }}>(optional)</span></p>
                <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                  {adultAges.map((age,i)=>(
                    <div key={`a${i}`} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <input type="number" min={1} max={99} value={age} placeholder="—" onChange={e=>setAdultAges(p=>{const a=[...p];a[i]=e.target.value;return a;})} style={{ width:46,padding:'6px 0',textAlign:'center',background:'#F4F7FB',border:'1.5px solid rgba(0,68,123,0.12)',borderRadius:8,fontFamily:'var(--font-head)',fontWeight:600,fontSize:13,color:'var(--navy)',outline:'none' }} onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.12)')} />
                      <span style={{ fontFamily:'var(--font-body)',fontSize:9,color:'var(--gray-dark)' }}>Adult {adults>1?i+1:''}</span>
                    </div>
                  ))}
                  {childAges.map((age,i)=>(
                    <div key={`c${i}`} style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                      <input type="number" min={1} max={17} value={age} placeholder="—" onChange={e=>setChildAges(p=>{const a=[...p];a[i]=e.target.value;return a;})} style={{ width:46,padding:'6px 0',textAlign:'center',background:'rgba(255,130,16,0.06)',border:'1.5px solid rgba(255,130,16,0.20)',borderRadius:8,fontFamily:'var(--font-head)',fontWeight:600,fontSize:13,color:'var(--navy)',outline:'none' }} onFocus={e=>(e.target.style.borderColor='var(--orange)')} onBlur={e=>(e.target.style.borderColor='rgba(255,130,16,0.20)')} />
                      <span style={{ fontFamily:'var(--font-body)',fontSize:9,color:'var(--gray-dark)' }}>Child {kids>1?i+1:''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display:'flex',justifyContent:'flex-end',paddingTop:4 }}>
              <button onClick={()=>goNext(1)} style={navBtn()}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 1: Travelling With + Trip Style */}
        {step===1 && (
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>Travelling with</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {[{v:'solo',icon:'🧳',l:'Solo'},{v:'couple',icon:'💑',l:'Couple'},{v:'family',icon:'👨‍👩‍👧',l:'Family'},{v:'friends',icon:'🧑‍🤝‍🧑',l:'Friends'}].map(opt=>{
                  const active=companion===opt.v;
                  return (
                    <button key={opt.v} onClick={()=>setCompanion(opt.v)} style={{ background:active?'rgba(0,68,123,0.07)':'#F4F7FB',border:`2px solid ${active?'var(--navy)':'transparent'}`,borderRadius:'var(--r-md)',padding:'12px 6px',cursor:'pointer',textAlign:'center',transition:'all 0.15s' }}>
                      <div style={{ fontSize:20,marginBottom:4 }}>{opt.icon}</div>
                      <div style={{ fontFamily:'var(--font-head)',fontWeight:active?700:500,fontSize:12,color:active?'var(--navy)':'#333' }}>{opt.l}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>Trip Style {styles.length>0&&<span style={{ fontFamily:'var(--font-body)',fontWeight:400,fontSize:10,color:'var(--orange)',textTransform:'none',letterSpacing:0,marginLeft:4 }}>{styles.length} selected</span>}</label>
              <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                {styleOpts.map(o=>{const active=styles.includes(o.v);return(<button key={o.v} onClick={()=>toggle(o.v)} style={{ background:active?'rgba(255,130,16,0.10)':'#F4F7FB',border:`1.5px solid ${active?'var(--orange)':'rgba(0,68,123,0.10)'}`,color:active?'var(--orange)':'#333',fontFamily:'var(--font-head)',fontWeight:active?600:400,fontSize:12,borderRadius:'var(--r-pill)',padding:'6px 13px',cursor:'pointer',transition:'all 0.15s' }}>{o.label}</button>);})}
              </div>
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',paddingTop:4 }}>
              <button onClick={()=>setStep(0)} style={navBtn(false)}>← Back</button>
              <button onClick={()=>setStep(2)} style={navBtn()}>Next →</button>
            </div>
          </div>
        )}

        {/* Step 2: Budget + Notes */}
        {step===2 && (
          <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
            <div>
              <label style={{ ...lbl,marginBottom:10 }}>Budget Level</label>
              <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                {[{v:'budget',e:'🎒',l:'Budget',s:'< $80 / day'},{v:'comfort',e:'🏨',l:'Comfort',s:'$80–150 / day'},{v:'premium',e:'🌟',l:'Premium',s:'$150–350 / day'},{v:'luxury',e:'💎',l:'Luxury',s:'$350+ / day'}].map(b=>{
                  const active=budget===b.v;
                  return(<button key={b.v} onClick={()=>setBudget(b.v)} style={{ background:active?'rgba(0,68,123,0.07)':'#F4F7FB',border:`2px solid ${active?'var(--navy)':'transparent'}`,borderRadius:'var(--r-md)',padding:'14px 8px',cursor:'pointer',textAlign:'center',transition:'all 0.15s' }}>
                    <div style={{ fontSize:22,marginBottom:5 }}>{b.e}</div>
                    <div style={{ fontFamily:'var(--font-head)',fontWeight:700,fontSize:12,color:active?'var(--navy)':'#000',marginBottom:2 }}>{b.l}</div>
                    <div style={{ fontFamily:'var(--font-body)',color:'var(--gray-dark)',fontSize:10 }}>{b.s}</div>
                  </button>);
                })}
              </div>
            </div>
            <div>
              <label style={lbl}>Describe your ideal trip <span style={{ fontFamily:'var(--font-body)',fontWeight:400,textTransform:'none',letterSpacing:0,color:'var(--gray-dark)' }}>(optional)</span></label>
              <p style={{ fontFamily:'var(--font-body)',fontSize:11,color:'var(--gray-dark)',marginBottom:8,lineHeight:1.5 }}>Vibe, pace, must-see spots, dietary needs, occasions — anything that makes this trip special.</p>
              <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Slow-paced honeymoon focused on local food and hidden gems. One of us is vegetarian. Avoid big tourist crowds." maxLength={600} rows={3} style={{ ...inp,resize:'vertical' }} onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
            </div>
            <div style={{ display:'flex',justifyContent:'space-between',paddingTop:4 }}>
              <button onClick={()=>setStep(1)} style={navBtn(false)}>← Back</button>
              <button onClick={submit} style={{ ...navBtn(),background:'var(--orange)',boxShadow:'0 6px 20px rgba(255,130,16,0.30)',letterSpacing:0.3 }}>✈ Generate My Travel Plan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────── */
function PlanForm({ onSubmit, preFilledData }: { onSubmit:(q:string)=>void; preFilledData?: {budget:string; styles:string[]} | null }) {
  const [dest,   setDest]   = useState('');
  const [dep,    setDep]    = useState('');
  const [ret,    setRet]    = useState('');
  const [adults,     setAdults]     = useState(2);
  const [kids,       setKids]       = useState(0);
  const [adultAges,  setAdultAges]  = useState<string[]>(['', '']);
  const [childAges,  setChildAges]  = useState<string[]>([]);
  const [companion,  setCompanion]  = useState('partner');
  const [styles,    setStyles]    = useState<string[]>(preFilledData?.styles ?? []);
  const [budget,    setBudget]    = useState(preFilledData?.budget ?? 'comfort');
  const [notes,     setNotes]     = useState('');

  // Sync pre-fill when quiz completes
  useState(() => { if (preFilledData) { setStyles(preFilledData.styles); setBudget(preFilledData.budget); } });

  const styleOpts = [
    {v:'cultural',   label:'🏛️ Cultural'},
    {v:'food',       label:'🍽️ Food & Drink'},
    {v:'nightlife',  label:'🎉 Nightlife'},
    {v:'shopping',   label:'🛍️ Shopping'},
    {v:'family',     label:'👨‍👩‍👧 Family'},
    {v:'adventure',  label:'🏔️ Adventure'},
    {v:'beach',      label:'🏖️ Beach'},
    {v:'wellness',   label:'🧘 Wellness'},
    {v:'romance',    label:'💑 Romance'},
    {v:'nature',     label:'🌿 Nature'},
    {v:'luxury',     label:'💎 Luxury'},
    {v:'photography',label:'📸 Photography'},
    {v:'ski',        label:'🎿 Winter Sports'},
    {v:'safari',     label:'🦁 Safari'},
    {v:'roadtrip',   label:'🚗 Road Trip'},
    {v:'citybreak',  label:'🏙️ City Break'},
  ];

  const toggle = (v:string) => setStyles(p=>p.includes(v)?p.filter(s=>s!==v):[...p,v]);

  const setAdultsChecked = (n: number) => {
    setAdults(n);
    setAdultAges(prev => { const a=[...prev]; while(a.length<n) a.push(''); return a.slice(0,n); });
    if (n === 1 && kids === 0) setCompanion('solo');
    else if (companion === 'solo') setCompanion('partner');
  };
  const setKidsChecked = (n: number) => {
    setKids(n);
    setChildAges(prev => { const a=[...prev]; while(a.length<n) a.push(''); return a.slice(0,n); });
    if (adults === 1 && n === 0) setCompanion('solo');
    else if (n > 0 && companion !== 'family') setCompanion('family');
    else if (n === 0 && companion === 'family') setCompanion('partner');
  };

  const companionLabel: Record<string,string> = {
    solo:'travelling solo', partner:'travelling as a couple', family:'travelling with family', friends:'travelling with friends',
  };

  const submit = () => {
    if (!dest) return;
    const bLabels: Record<string,string> = { budget:'budget-friendly', comfort:'comfortable', premium:'premium', luxury:'luxury' };
    const tripStyles = styles.length ? `focusing on ${styles.join(', ')}` : '';
    const dates = dep ? `from ${dep}${ret?` to ${ret}`:''}` : '';
    const group = `for ${adults} adult${adults>1?'s':''}${kids>0?` and ${kids} child${kids>1?'ren':''}`:''}`;
    const companionCtx = companionLabel[companion] || '';
    const filledAdultAges = adultAges.filter(Boolean);
    const filledChildAges = childAges.filter(Boolean);
    const ageParts = [
      filledAdultAges.length ? `adults aged ${filledAdultAges.join(', ')}` : '',
      filledChildAges.length ? `children aged ${filledChildAges.join(', ')}` : '',
    ].filter(Boolean);
    const ageCtx = ageParts.length ? `. Traveller ages: ${ageParts.join('; ')}` : '';
    onSubmit(`Plan a trip to ${dest} ${dates} ${group}, ${companionCtx}, with ${bLabels[budget]||budget} budget ${tripStyles}${ageCtx}${notes?`. Additional context about what they're looking for: ${notes}`:''}`);
  };

  const inp: React.CSSProperties = {
    width:'100%', background:'#fff',
    border:'1.5px solid rgba(0,68,123,0.15)',
    borderRadius:'var(--r-md)', padding:'13px 16px',
    fontFamily:'var(--font-body)', fontSize:15, color:'#000', outline:'none',
    transition:'border-color 0.18s',
  };
  const lbl: React.CSSProperties = {
    fontFamily:'var(--font-head)', fontWeight:600, fontSize:12,
    color:'var(--navy)', marginBottom:8, display:'flex', alignItems:'center', gap:6,
    textTransform:'uppercase', letterSpacing:0.8,
  };
  const divider = { borderTop:'1px solid rgba(0,68,123,0.08)', margin:'0' } as React.CSSProperties;

  return (
    <div style={{ background:'#fff', borderRadius:'var(--r-lg)', boxShadow:'0 8px 48px rgba(0,68,123,0.12)', overflow:'hidden' }}>

      {/* Destination */}
      <div style={{ padding:'28px 32px 24px' }}>
        <label style={lbl}>Destination <span style={{ color:'var(--orange)' }}>*</span></label>
        <DestinationInput value={dest} onChange={setDest} />
      </div>

      <hr style={divider} />

      {/* Dates */}
      <div style={{ padding:'24px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div>
          <label style={lbl}>Departure Date</label>
          <input type="date" value={dep} onChange={e=>setDep(e.target.value)} style={inp}
            onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
        </div>
        <div>
          <label style={lbl}>Return Date</label>
          <input type="date" value={ret} onChange={e=>setRet(e.target.value)} style={inp}
            onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
        </div>
      </div>

      <hr style={divider} />

      {/* Travellers */}
      <div style={{ padding:'24px 32px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {([['Adults', adults, setAdultsChecked, 1], ['Children', kids, setKidsChecked, 0]] as const).map(([l,val,set,min])=>(
            <div key={l as string}>
              <label style={lbl}>{l as string}</label>
              <div style={{ display:'flex', alignItems:'center', gap:0, background:'var(--bg-section)', borderRadius:'var(--r-md)', border:'1.5px solid rgba(0,68,123,0.12)', overflow:'hidden' }}>
                <button onClick={()=>(set as (n:number)=>void)(Math.max(min as number,(val as number)-1))}
                  style={{ width:44, height:44, background:'none', border:'none', color:'var(--navy)', fontSize:22, cursor:'pointer', fontFamily:'var(--font-head)', fontWeight:500, flexShrink:0 }}>−</button>
                <span style={{ flex:1, textAlign:'center', fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, color:'var(--navy)' }}>{val as number}</span>
                <button onClick={()=>(set as (n:number)=>void)((val as number)+1)}
                  style={{ width:44, height:44, background:'none', border:'none', color:'var(--navy)', fontSize:22, cursor:'pointer', fontFamily:'var(--font-head)', fontWeight:500, flexShrink:0 }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Age inputs — optional */}
        {(adults > 0 || kids > 0) && (
          <div style={{ marginTop:16 }}>
            <p style={{ fontFamily:'var(--font-head)', fontWeight:500, fontSize:11, color:'var(--gray-dark)', textTransform:'uppercase', letterSpacing:0.8, marginBottom:10 }}>
              Ages <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional — helps personalise your plan)</span>
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {adultAges.map((age, i) => (
                <div key={`adult-${i}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <input
                    type="number" min={1} max={99} value={age}
                    onChange={e => setAdultAges(prev => { const a=[...prev]; a[i]=e.target.value; return a; })}
                    placeholder="—"
                    style={{ width:52, padding:'7px 0', textAlign:'center', background:'var(--bg-section)', border:'1.5px solid rgba(0,68,123,0.12)', borderRadius:10, fontFamily:'var(--font-head)', fontWeight:600, fontSize:15, color:'var(--navy)', outline:'none' }}
                    onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.12)')}
                  />
                  <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'var(--gray-dark)' }}>Adult {adults>1?i+1:''}</span>
                </div>
              ))}
              {childAges.map((age, i) => (
                <div key={`child-${i}`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  <input
                    type="number" min={1} max={17} value={age}
                    onChange={e => setChildAges(prev => { const a=[...prev]; a[i]=e.target.value; return a; })}
                    placeholder="—"
                    style={{ width:52, padding:'7px 0', textAlign:'center', background:'rgba(255,130,16,0.06)', border:'1.5px solid rgba(255,130,16,0.20)', borderRadius:10, fontFamily:'var(--font-head)', fontWeight:600, fontSize:15, color:'var(--navy)', outline:'none' }}
                    onFocus={e=>(e.target.style.borderColor='var(--orange)')} onBlur={e=>(e.target.style.borderColor='rgba(255,130,16,0.20)')}
                  />
                  <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'var(--gray-dark)' }}>Child {kids>1?i+1:''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <hr style={divider} />

      {/* Travelling with */}
      <div style={{ padding:'24px 32px' }}>
        <label style={{ ...lbl, marginBottom:14 }}>Travelling with</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { v:'solo',    icon:'🧳', l:'Solo' },
            { v:'partner', icon:'👫', l:'Partner' },
            { v:'family',  icon:'👨‍👩‍👧', l:'Family' },
            { v:'friends', icon:'🧑‍🤝‍🧑', l:'Friends' },
          ].map(opt => {
            const active = companion === opt.v;
            return (
              <button key={opt.v} onClick={()=>setCompanion(opt.v)} style={{
                background: active ? 'rgba(0,68,123,0.06)' : 'var(--bg-section)',
                border: `2px solid ${active ? 'var(--navy)' : 'transparent'}`,
                borderRadius:'var(--r-md)', padding:'14px 8px', cursor:'pointer', textAlign:'center',
                transition:'all 0.15s',
              }}>
                <div style={{ fontSize:22, marginBottom:6 }}>{opt.icon}</div>
                <div style={{ fontFamily:'var(--font-head)', fontWeight: active ? 700 : 500, fontSize:13, color: active ? 'var(--navy)' : '#333' }}>{opt.l}</div>
              </button>
            );
          })}
        </div>
        {companion === 'solo' && adults > 1 && (
          <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--gray-dark)', marginTop:8 }}>
            You have {adults} adults selected — consider adjusting the traveller count.
          </p>
        )}
      </div>

      <hr style={divider} />

      {/* Trip Style */}
      <div style={{ padding:'24px 32px' }}>
        <label style={{ ...lbl, marginBottom:14 }}>
          Trip Style
          {styles.length > 0 && <span style={{ fontFamily:'var(--font-body)', fontWeight:400, fontSize:11, color:'var(--orange)', textTransform:'none', letterSpacing:0, marginLeft:4 }}>{styles.length} selected</span>}
        </label>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {styleOpts.map(o=>{
            const active = styles.includes(o.v);
            return (
              <button key={o.v} onClick={()=>toggle(o.v)} style={{
                background: active ? 'rgba(255,130,16,0.10)' : 'var(--bg-section)',
                border: `1.5px solid ${active ? 'var(--orange)' : 'rgba(0,68,123,0.10)'}`,
                color: active ? 'var(--orange)' : '#333',
                fontFamily:'var(--font-head)', fontWeight: active ? 600 : 400, fontSize:13,
                borderRadius:'var(--r-pill)', padding:'7px 15px', cursor:'pointer', transition:'all 0.15s',
              }}>{o.label}</button>
            );
          })}
        </div>
      </div>

      <hr style={divider} />

      {/* Budget */}
      <div style={{ padding:'24px 32px' }}>
        <label style={{ ...lbl, marginBottom:14 }}>Budget Level</label>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            {v:'budget',  e:'🎒', l:'Budget',   s:'< $80 / day'},
            {v:'comfort', e:'🏨', l:'Comfort',  s:'$80–150 / day'},
            {v:'premium', e:'🌟', l:'Premium',  s:'$150–350 / day'},
            {v:'luxury',  e:'💎', l:'Luxury',   s:'$350+ / day'},
          ].map(b=>{
            const active = budget===b.v;
            return (
              <button key={b.v} onClick={()=>setBudget(b.v)} style={{
                background: active ? 'rgba(0,68,123,0.06)' : 'var(--bg-section)',
                border: `2px solid ${active ? 'var(--navy)' : 'transparent'}`,
                borderRadius:'var(--r-md)', padding:'16px 10px', cursor:'pointer', textAlign:'center',
                transition:'all 0.15s',
              }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{b.e}</div>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, color: active?'var(--navy)':'#000', marginBottom:3 }}>{b.l}</div>
                <div style={{ fontFamily:'var(--font-body)', color:'var(--gray-dark)', fontSize:11 }}>{b.s}</div>
              </button>
            );
          })}
        </div>
      </div>

      <hr style={divider} />

      {/* Notes */}
      <div style={{ padding:'24px 32px 8px' }}>
        <label style={lbl}>Describe your ideal trip <span style={{ fontFamily:'var(--font-body)', fontWeight:400, textTransform:'none', letterSpacing:0, color:'var(--gray-dark)' }}>(optional)</span></label>
        <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--gray-dark)', marginBottom:10, lineHeight:1.5 }}>
          What kind of experience are you after? Mention the vibe, pace, must-see places, dietary needs, occasions, or anything that will make this trip special.
        </p>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="e.g. We want a slow-paced trip focused on local food and hidden gems. It's our honeymoon so something romantic. Avoid touristy spots. One of us is vegetarian."
          maxLength={600} rows={4} style={{ ...inp, resize:'vertical' }}
          onFocus={e=>(e.target.style.borderColor='var(--navy)')} onBlur={e=>(e.target.style.borderColor='rgba(0,68,123,0.15)')} />
      </div>

      {/* Submit */}
      <div style={{ padding:'24px 32px 32px' }}>
        <button onClick={submit} disabled={!dest} style={{
          background: dest ? 'var(--orange)' : 'var(--gray-light)', color:'#fff',
          fontFamily:'var(--font-head)', fontWeight:700, fontSize:16,
          padding:'18px', borderRadius:'var(--r-pill)', border:'none',
          cursor: dest ? 'pointer' : 'not-allowed', width:'100%',
          boxShadow: dest ? '0 8px 28px rgba(255,130,16,0.30)' : 'none',
          transition:'all 0.2s', letterSpacing:0.3,
        }}>
          ✈ Generate My Travel Plan
        </button>
        {!dest && <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--gray-dark)', textAlign:'center', marginTop:10 }}>Enter a destination to get started</p>}
      </div>
    </div>
  );
}
