'use client';
import { useState } from 'react';
import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { trackDestinationSelected } from '@/lib/analytics';

const CATEGORIES = ['All','Beach','Mountains','City','Culture','Adventure','Family','Romance','Nature','Party'];

const DESTINATIONS = [
  // Beach
  { name:'Maldives',            country:'Indian Ocean',       days:'7–10 days', category:'Beach',     tag:'Luxury',      photo:'photo-1514282401047-d79a71a590e8', tags:['Beach','Resort','Snorkelling'] },
  { name:'Bali',                country:'Indonesia',          days:'10 days',   category:'Beach',     tag:'Budget pick', photo:'photo-1537996194471-e657df975ab4', tags:['Nature','Temples','Beach'] },
  { name:'Phuket',              country:'Thailand',           days:'7 days',    category:'Beach',     tag:'Trending',    photo:'photo-1506665531195-3566af2b4dfa', tags:['Beach','Nightlife','Food'] },
  { name:'Algarve',             country:'Portugal',           days:'7 days',    category:'Beach',     tag:'Europe pick', photo:'photo-1559827291-72ee739d0d9a', tags:['Beaches','Cliffs','Food'] },
  { name:'Tulum',               country:'Mexico',             days:'7 days',    category:'Beach',     tag:'Boho',        photo:'photo-1552465011-b4e21bf6e79a', tags:['Beach','Ruins','Wellness'] },
  { name:'Maui',                country:'Hawaii, USA',        days:'10 days',   category:'Beach',     tag:'Dream',       photo:'photo-1542259009477-d625272157b7', tags:['Beach','Hiking','Nature'] },
  { name:'Zanzibar',            country:'Tanzania',           days:'8 days',    category:'Beach',     tag:'Hidden gem',  photo:'photo-1547471080-7cc2caa01a7e', tags:['Beach','Culture','Spice'] },
  { name:'Mykonos',             country:'Greece',             days:'5 days',    category:'Beach',     tag:'Party',       photo:'photo-1570077188670-e3a8d69ac5ff', tags:['Beach','Nightlife','Views'] },
  { name:'Seychelles',          country:'East Africa',        days:'10 days',   category:'Beach',     tag:'Luxury',      photo:'photo-1482938289607-e9573fc25ebb', tags:['Beach','Nature','Diving'] },
  { name:'Cancun',              country:'Mexico',             days:'7 days',    category:'Beach',     tag:'All-inclusive',photo:'photo-1520454974749-a9decf0c8e3e', tags:['Beach','Resort','Nightlife'] },
  // Mountains
  { name:'Banff',               country:'Canada',             days:'7 days',    category:'Mountains', tag:'Adventure',   photo:'photo-1508193638397-1c4234db14d8', tags:['Hiking','Mountains','Lakes'] },
  { name:'Patagonia',           country:'Argentina & Chile',  days:'10–14 days',category:'Mountains', tag:'Epic',        photo:'photo-1501854140801-50d01698950b', tags:['Trekking','Glaciers','Wildlife'] },
  { name:'Swiss Alps',          country:'Switzerland',        days:'8 days',    category:'Mountains', tag:'Classic',     photo:'photo-1476514525535-07fb3b4ae5f1', tags:['Ski','Hiking','Scenic'] },
  { name:'Queenstown',          country:'New Zealand',        days:'7 days',    category:'Mountains', tag:'Adrenaline',  photo:'photo-1507699622108-4be3abd695ad', tags:['Adventure','Ski','Bungee'] },
  { name:'Himalayas',           country:'Nepal',              days:'14 days',   category:'Mountains', tag:'Bucket list', photo:'photo-1464822759023-fed622ff2c3b', tags:['Trekking','Culture','Views'] },
  { name:'Dolomites',           country:'Italy',              days:'7 days',    category:'Mountains', tag:'Scenic',      photo:'photo-1516483638261-f4dbaf036963', tags:['Hiking','Views','Food'] },
  { name:'Scottish Highlands',  country:'Scotland, UK',       days:'7 days',    category:'Mountains', tag:'Wild',        photo:'photo-1584132967334-10e028bd69f7', tags:['Hiking','Castles','Whisky'] },
  // City
  { name:'Tokyo',               country:'Japan',              days:'7 days',    category:'City',      tag:'Culture',     photo:'photo-1540959733332-eab4deabeeaf', tags:['Food','Markets','Art'] },
  { name:'New York City',       country:'USA',                days:'6 days',    category:'City',      tag:'Iconic',      photo:'photo-1496442226666-8d4d0e62e6e9', tags:['Culture','Food','Nightlife'] },
  { name:'Paris',               country:'France',             days:'5 days',    category:'City',      tag:'Romance',     photo:'photo-1502602898657-3e91760cbb34', tags:['Art','Food','Fashion'] },
  { name:'Barcelona',           country:'Spain',              days:'5 days',    category:'City',      tag:'Vibrant',     photo:'photo-1539037116277-4db20889f2d4', tags:['Architecture','Beach','Food'] },
  { name:'Singapore',           country:'Singapore',          days:'5 days',    category:'City',      tag:'Modern',      photo:'photo-1525625293386-3f8f99389edd', tags:['Food','Architecture','Gardens'] },
  { name:'Istanbul',            country:'Turkey',             days:'6 days',    category:'City',      tag:'Historic',    photo:'photo-1524492412937-b28074a5d7da', tags:['Culture','Food','History'] },
  { name:'Amsterdam',           country:'Netherlands',        days:'4 days',    category:'City',      tag:'Charming',    photo:'photo-1534351590666-13e3e96b5702', tags:['Canals','Museums','Cycling'] },
  { name:'Seoul',               country:'South Korea',        days:'7 days',    category:'City',      tag:'Trendy',      photo:'photo-1546874177-9e664107314e', tags:['Food','K-culture','Shopping'] },
  // Culture
  { name:'Kyoto',               country:'Japan',              days:'5 days',    category:'Culture',   tag:'Timeless',    photo:'photo-1493976040374-85c8e12f0c0e', tags:['Temples','Gardens','History'] },
  { name:'Marrakech',           country:'Morocco',            days:'5 days',    category:'Culture',   tag:'Vibrant',     photo:'photo-1539020140153-e479b8c22e70', tags:['Souks','History','Food'] },
  { name:'Rome',                country:'Italy',              days:'5 days',    category:'Culture',   tag:'Ancient',     photo:'photo-1552832230-c0197dd311b5', tags:['History','Food','Art'] },
  { name:'Petra',               country:'Jordan',             days:'5 days',    category:'Culture',   tag:'Wonder',      photo:'photo-1539108220543-67e2716f1e28', tags:['History','Desert','Ruins'] },
  { name:'Machu Picchu',        country:'Peru',               days:'8 days',    category:'Culture',   tag:'Bucket list', photo:'photo-1526392060635-9d6019884377', tags:['Ruins','Hiking','History'] },
  { name:'Angkor Wat',          country:'Cambodia',           days:'5 days',    category:'Culture',   tag:'Ancient',     photo:'photo-1569580023943-0a0f8d3ff7a7', tags:['Temples','History','Jungle'] },
  { name:'Athens',              country:'Greece',             days:'4 days',    category:'Culture',   tag:'Cradle',      photo:'photo-1555993539-1732b0258235', tags:['History','Ruins','Food'] },
  // Adventure
  { name:'Costa Rica',          country:'Central America',    days:'10 days',   category:'Adventure', tag:'Wild',        photo:'photo-1518259102261-b40117eabbc9', tags:['Jungle','Wildlife','Surf'] },
  { name:'Iceland',             country:'Iceland',            days:'8 days',    category:'Adventure', tag:'Epic',        photo:'photo-1531366936337-7c912a4589a7', tags:['Northern Lights','Geysers','Waterfalls'] },
  { name:'Galápagos Islands',   country:'Ecuador',            days:'10 days',   category:'Adventure', tag:'Unique',      photo:'photo-1559825481-12a05cc00344', tags:['Wildlife','Diving','Nature'] },
  // Family
  { name:'Orlando',             country:'USA',                days:'7 days',    category:'Family',    tag:'Theme parks', photo:'photo-1565361195430-c26fe99d1e38', tags:['Theme Parks','Fun','Kids'] },
  { name:'Gold Coast',          country:'Australia',          days:'7 days',    category:'Family',    tag:'Sun & fun',   photo:'photo-1523482580672-f109ba8cb9be', tags:['Beach','Theme Parks','Nature'] },
  { name:'Punta Cana',          country:'Dominican Republic', days:'8 days',    category:'Family',    tag:'All-inclusive',photo:'photo-1572978118769-86a5b2cda0cd', tags:['Beach','Resort','Water Sports'] },
  // Romance
  { name:'Santorini',           country:'Greece',             days:'6 days',    category:'Romance',   tag:'Dreamy',      photo:'photo-1570077188670-e3a8d69ac5ff', tags:['Sunsets','Wine','Views'] },
  { name:'Lisbon',              country:'Portugal',           days:'5 days',    category:'Romance',   tag:'Charming',    photo:'photo-1548707309-dcebeab9ea9b', tags:['Trams','Food','Sunsets'] },
  { name:'Bora Bora',           country:'French Polynesia',   days:'8 days',    category:'Romance',   tag:'Luxury',      photo:'photo-1589394815804-964ed0be2eb5', tags:['Overwater','Beach','Diving'] },
  // Nature
  { name:'Serengeti',           country:'Tanzania',           days:'9 days',    category:'Nature',    tag:'Safari',      photo:'photo-1523805009345-7448845a9e53', tags:['Safari','Wildlife','Savanna'] },
  { name:'Amazon Rainforest',   country:'Brazil',             days:'8 days',    category:'Nature',    tag:'Wild',        photo:'photo-1501854140801-50d01698950b', tags:['Jungle','Wildlife','Adventure'] },
  { name:'Azores',              country:'Portugal',           days:'8 days',    category:'Nature',    tag:'Hidden gem',  photo:'photo-1528360983277-13d401cdc186', tags:['Volcanic','Whales','Nature'] },
  // Party
  { name:'Ibiza',               country:'Spain',              days:'5 days',    category:'Party',     tag:'Legendary',   photo:'photo-1533174072545-7a4b6ad7a6c3', tags:['Nightlife','Beach','Music'] },
  { name:'Miami',               country:'USA',                days:'5 days',    category:'Party',     tag:'Vibrant',     photo:'photo-1506929562872-bb421503ef21', tags:['Beach','Nightlife','Art'] },
  { name:'Rio de Janeiro',      country:'Brazil',             days:'7 days',    category:'Party',     tag:'Carnival',    photo:'photo-1483729558449-99ef09a8c325', tags:['Beach','Carnival','Culture'] },
  { name:'Bangkok',             country:'Thailand',           days:'6 days',    category:'Party',     tag:'Non-stop',    photo:'photo-1508009603885-50cf7c579365', tags:['Food','Nightlife','Temples'] },
];

export default function TripIdeasPage() {
  const [active, setActive] = useState('All');
  const filtered = active === 'All' ? DESTINATIONS : DESTINATIONS.filter(d => d.category === active);

  return (
    <div style={{ fontFamily:"'Lato',sans-serif", color:'#333', background:'#fff' }}>
      <NavBar />

      {/* Hero */}
      <section style={{ background:'#FFF8F0', padding:'72px 24px 56px', textAlign:'center' }}>
        <p style={{ fontFamily:"'Poppins',sans-serif", fontSize:12, fontWeight:700, color:'#FF8210', letterSpacing:'0.12em', textTransform:'uppercase', borderBottom:'2px solid #FF8210', display:'inline-block', paddingBottom:3, marginBottom:16 }}>Explore the world</p>
        <h1 style={{ fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:'clamp(32px,5vw,56px)', color:'#00447B', lineHeight:1.1, marginBottom:16, letterSpacing:'-1px' }}>
          Get Inspired.<br /><span style={{ color:'#FF8210', fontStyle:'italic' }}>Go Anywhere.</span>
        </h1>
        <p style={{ fontSize:17, fontWeight:300, color:'#6C6D6F', maxWidth:520, margin:'0 auto', lineHeight:1.7 }}>
          Hand-picked destinations for every kind of traveller, every kind of trip.
        </p>
      </section>

      {/* Filter pills */}
      <div style={{ position:'sticky', top:68, zIndex:50, background:'#fff', borderBottom:'1px solid rgba(0,68,123,0.08)', padding:'12px 24px', overflowX:'auto', display:'flex', gap:8, whiteSpace:'nowrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            style={{
              fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:active===cat?700:500,
              padding:'7px 18px', borderRadius:100, border:'1.5px solid',
              borderColor: active===cat ? '#FF8210' : 'rgba(0,68,123,0.15)',
              background: active===cat ? '#FF8210' : 'white',
              color: active===cat ? 'white' : '#00447B',
              cursor:'pointer', transition:'all 0.15s', flexShrink:0,
            }}
          >{cat}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'48px 24px 80px' }}>
        <p style={{ fontFamily:"'Lato',sans-serif", fontSize:13, color:'#6C6D6F', marginBottom:32 }}>{filtered.length} destination{filtered.length !== 1 ? 's' : ''}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:24 }}>
          {filtered.map(dest => (
            <div key={dest.name} style={{ borderRadius:16, overflow:'hidden', border:'0.5px solid rgba(0,68,123,0.1)', background:'#fff', transition:'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(-4px)';(e.currentTarget as HTMLDivElement).style.boxShadow='0 12px 36px rgba(0,0,0,0.12)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.transform='translateY(0)';(e.currentTarget as HTMLDivElement).style.boxShadow='none';}}
            >
              {/* Photo */}
              <div style={{ height:200, backgroundImage:`url('https://images.unsplash.com/${dest.photo}?w=600&q=80')`, backgroundSize:'cover', backgroundPosition:'center', position:'relative' }}>
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)' }} />
                <span style={{ position:'absolute', top:12, left:12, background:'#FF8210', color:'white', fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:10 }}>{dest.tag}</span>
              </div>
              {/* Body */}
              <div style={{ padding:'18px 20px 20px' }}>
                <h3 style={{ fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:18, color:'#00447B', marginBottom:2 }}>{dest.name}</h3>
                <p style={{ fontFamily:"'Lato',sans-serif", fontSize:12, color:'#6C6D6F', marginBottom:6, fontWeight:300 }}>{dest.country} · {dest.days}</p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
                  {dest.tags.map(t => (
                    <span key={t} style={{ background:'#EEF4FB', color:'#00447B', fontFamily:"'Lato',sans-serif", fontSize:11, fontWeight:400, padding:'4px 10px', borderRadius:8 }}>{t}</span>
                  ))}
                </div>
                <Link
                  href={`/start?destination=${encodeURIComponent(dest.name)}`}
                  style={{ display:'block', textAlign:'center', background:'#FF8210', color:'white', fontFamily:"'Poppins',sans-serif", fontSize:13, fontWeight:600, padding:'10px 0', borderRadius:50, textDecoration:'none', transition:'background 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='#e06e00')}
                  onMouseLeave={e=>(e.currentTarget.style.background='#FF8210')}
                  onClick={() => trackDestinationSelected(dest.name, dest.category)}
                >
                  Plan this trip →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media(max-width:600px){
          div[style*="gridTemplateColumns"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}
