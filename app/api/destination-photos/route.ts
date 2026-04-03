import { NextRequest, NextResponse } from 'next/server';

// Curated destination-specific fallback photos — only used if all APIs fail
const DESTINATION_FALLBACKS: Record<string, string[]> = {
  'new york': [
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&q=80',
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
    'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=1200&q=80',
  ],
  'miami': [
    'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=1200&q=80',
    'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1200&q=80',
    'https://images.unsplash.com/photo-1567402924834-3c2d2e6e8aad?w=1200&q=80',
  ],
  'paris': [
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&q=80',
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80',
    'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=1200&q=80',
  ],
  'london': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200&q=80',
    'https://images.unsplash.com/photo-1486299267070-83823f5448dd?w=1200&q=80',
    'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=1200&q=80',
  ],
  'tokyo': [
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80',
    'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1200&q=80',
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1200&q=80',
  ],
  'bali': [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80',
    'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&q=80',
    'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=1200&q=80',
  ],
  'barcelona': [
    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&q=80',
  ],
  'rome': [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80',
    'https://images.unsplash.com/photo-1529154036614-a60975f5c760?w=1200&q=80',
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1200&q=80',
  ],
  'sydney': [
    'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1200&q=80',
    'https://images.unsplash.com/photo-1524293581917-878a6d017c71?w=1200&q=80',
    'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?w=1200&q=80',
  ],
  'dubai': [
    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80',
    'https://images.unsplash.com/photo-1526495124232-a04e1849168c?w=1200&q=80',
    'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=80',
  ],
  'los angeles': [
    'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1200&q=80',
    'https://images.unsplash.com/photo-1580655653885-65763b2597d1?w=1200&q=80',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=1200&q=80',
  ],
  'amsterdam': [
    'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1200&q=80',
    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200&q=80',
    'https://images.unsplash.com/photo-1584003564911-1ad5c00e5ad1?w=1200&q=80',
  ],
  'maldives': [
    'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80',
    'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1200&q=80',
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
  ],
  'bangkok': [
    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=1200&q=80',
    'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&q=80',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80',
  ],
  'singapore': [
    'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&q=80',
    'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?w=1200&q=80',
    'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=1200&q=80',
  ],
};

const GENERIC_FALLBACKS = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
];

const NO_CACHE_HEADERS = { 'Cache-Control': 'no-store, no-cache, must-revalidate' };

function getFallbackForDestination(city: string): string[] {
  const cityLower = city.toLowerCase();
  for (const [key, photos] of Object.entries(DESTINATION_FALLBACKS)) {
    if (cityLower.includes(key) || key.includes(cityLower)) return photos;
  }
  return GENERIC_FALLBACKS;
}

async function fetchUnsplashPhotos(city: string): Promise<string[]> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return [];

  try {
    const query = encodeURIComponent(`${city} travel tourism`);
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&per_page=5&page=${randomPage}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${accessKey}` }, signal: AbortSignal.timeout(6000) },
    );
    if (!res.ok) {
      console.error(`[destination-photos] Unsplash error ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data.results?.length) return [];
    // Shuffle and pick 3 from the 5 results
    const shuffled = (data.results as { urls: { full: string }; links?: { download_location?: string } }[])
      .sort(() => Math.random() - 0.5);
    const results = shuffled.slice(0, 3);
    // Fire-and-forget download triggers (required by Unsplash API guidelines)
    for (const photo of results) {
      if (photo.links?.download_location) {
        fetch(`${photo.links.download_location}&client_id=${accessKey}`, { method: 'GET' }).catch(() => {});
      }
    }
    const urls = results.map((p) => p.urls.full);
    console.log(`[destination-photos] Unsplash: ${urls.length} photos for "${city}" (page ${randomPage})`);
    return urls;
  } catch (err) {
    console.error('[destination-photos] Unsplash fetch failed:', err);
    return [];
  }
}

async function fetchPexelsPhotos(city: string): Promise<string[]> {
  const key = process.env.PEXELS_ACCESS_KEY;
  if (!key) return [];
  try {
    const query = encodeURIComponent(`${city} travel tourism`);
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${query}&per_page=5&page=${randomPage}&orientation=landscape`,
      { headers: { Authorization: key } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const shuffled = ((data.photos || []) as { src: { landscape: string } }[])
      .sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map((p) => p.src.landscape);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  // Support both ?city= (current frontend) and ?destination= (prompt spec)
  const rawCity =
    request.nextUrl.searchParams.get('city') ||
    request.nextUrl.searchParams.get('destination') ||
    '';

  if (!rawCity.trim()) {
    return NextResponse.json({ photos: GENERIC_FALLBACKS, source: 'fallback' }, { headers: NO_CACHE_HEADERS });
  }

  const city = rawCity.split(',')[0].trim();
  console.log(`[destination-photos] Fetching photos for city="${city}"`);

  // Tier 1: Unsplash API
  const unsplashPhotos = await fetchUnsplashPhotos(city);
  if (unsplashPhotos.length >= 3) {
    return NextResponse.json(
      { photos: unsplashPhotos.slice(0, 3), source: 'unsplash' },
      { headers: NO_CACHE_HEADERS },
    );
  }

  // Tier 2: Pexels
  const pexelsPhotos = await fetchPexelsPhotos(city);
  const afterPexels = [...new Set([...unsplashPhotos, ...pexelsPhotos])];
  if (afterPexels.length >= 3) {
    return NextResponse.json(
      { photos: afterPexels.slice(0, 3), source: 'pexels' },
      { headers: NO_CACHE_HEADERS },
    );
  }

  // Tier 3: Destination-specific curated fallbacks
  const fallbacks = getFallbackForDestination(city);
  if (afterPexels.length >= 1) {
    const final = [...new Set([...afterPexels, ...fallbacks])].slice(0, 3);
    return NextResponse.json({ photos: final, source: 'mixed' }, { headers: NO_CACHE_HEADERS });
  }

  // Tier 4: Generic fallbacks
  console.log(`[destination-photos] Using destination fallback for "${city}"`);
  return NextResponse.json({ photos: fallbacks, source: 'fallback' }, { headers: NO_CACHE_HEADERS });
}
