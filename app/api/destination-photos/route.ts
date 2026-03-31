import { NextRequest } from 'next/server';

// Generic travel landscape fallbacks - always available, no API key needed
const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
];

// Filenames containing these terms are almost never travel photos
const EXCLUDED_FILENAME_TERMS = /flag|coat.of.arm|emblem|seal|\.svg|coa_|arms_of|logo|icon|symbol|stamp|portrait|bust|military|war|battle|bomb|napalm|napalm|soldier|army|navy|communist|party.congress|rally|protest|politic|propaganda|election|weapon|gun|tank|artillery|massacre|execution|president|premier|minister|inauguration|signing|handshake|meeting|summit|conference|satellite|locator|location|map|route|diagram|plan_of|layout|schematic/i;

/**
 * Strategy 1: Teleport API - curated travel city photos, no API key needed.
 * Covers ~260 major urban areas worldwide.
 */
async function fetchTeleportPhotos(cityName: string): Promise<string[]> {
  try {
    const searchRes = await fetch(
      `https://api.teleport.org/api/cities/?search=${encodeURIComponent(cityName)}&embed=city%3Asearch-results%2Fcity%3Aitem%2Fcity%3Aurban_area`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } }
    );
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();

    const results: any[] = searchData?._embedded?.['city:search-results'] ?? [];
    if (!results.length) return [];

    // Walk the embedded HAL links to find an urban area slug
    let slug: string | null = null;
    for (const result of results.slice(0, 3)) {
      const ua = result?._embedded?.['city:item']?._embedded?.['city:urban_area'];
      if (ua?.slug) { slug = ua.slug; break; }
    }
    if (!slug) return [];

    const photosRes = await fetch(
      `https://api.teleport.org/api/urban_areas/slug:${slug}/images/`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 } }
    );
    if (!photosRes.ok) return [];
    const photosData = await photosRes.json();

    const photos: string[] = [];
    for (const p of photosData?.photos ?? []) {
      const url = p?.image?.web || p?.image?.mobile;
      if (url && typeof url === 'string') photos.push(url);
    }
    return photos;
  } catch {
    return [];
  }
}

/**
 * Strategy 2: Wikimedia Commons *text search* for travel/landmark photos.
 * Uses the search API (not article images) so results are query-targeted.
 * Aggressively filters filenames to exclude flags, maps, political imagery.
 */
async function fetchCommonsSearchPhotos(cityName: string): Promise<string[]> {
  const queries = [
    `${cityName} landmark`,
    `${cityName} tourism`,
    `${cityName} skyline`,
    `${cityName} aerial view`,
  ];

  const photos: string[] = [];

  for (const query of queries) {
    if (photos.length >= 5) break;
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|dimensions|mime&gsrlimit=25&format=json&origin=*`,
        { signal: AbortSignal.timeout(6000), next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const pages = data?.query?.pages ?? {};

      for (const page of Object.values(pages) as any[]) {
        if (photos.length >= 5) break;
        const info = page.imageinfo?.[0];
        if (!info?.url) continue;
        // JPEG only - eliminates SVG flags, diagrams, icons
        if (info.mime !== 'image/jpeg') continue;
        // Require true landscape orientation
        if (!info.width || !info.height) continue;
        if (info.width < 1000) continue;
        if (info.width < info.height * 1.4) continue;
        // Filter by filename
        if (EXCLUDED_FILENAME_TERMS.test(info.url)) continue;
        if (!photos.includes(info.url)) photos.push(info.url);
      }
    } catch {
      continue;
    }
  }

  return photos;
}

export async function GET(request: NextRequest) {
  const rawCity = request.nextUrl.searchParams.get('city') || '';
  if (!rawCity.trim()) {
    return Response.json({ photos: FALLBACK_PHOTOS.slice(0, 3), source: 'fallback' });
  }

  // Use only the primary city name: "Da Nang, Vietnam" -> "Da Nang"
  const cityName = rawCity.split(',')[0].trim();
  console.log(`[destination-photos] raw="${rawCity}" cityName="${cityName}"`);

  // Strategy 1: Teleport curated travel photos
  let photos = await fetchTeleportPhotos(cityName);
  console.log(`[destination-photos] teleport returned ${photos.length} for "${cityName}"`);

  // Strategy 2: Wikimedia Commons search with strict travel filtering
  if (photos.length < 3) {
    const commons = await fetchCommonsSearchPhotos(cityName);
    console.log(`[destination-photos] commons search returned ${commons.length} for "${cityName}"`);
    // Merge: Teleport photos first, then fill with Commons
    for (const url of commons) {
      if (photos.length >= 5) break;
      if (!photos.includes(url)) photos.push(url);
    }
  }

  if (photos.length > 0) {
    console.log(`[destination-photos] returning ${photos.length} photos for "${cityName}"`);
    return Response.json({ photos: photos.slice(0, 5), source: photos.length > 0 ? 'travel' : 'fallback' });
  }

  // Strategy 3: Generic travel fallback - always succeeds
  console.log(`[destination-photos] all strategies failed for "${cityName}", using fallback`);
  return Response.json({ photos: FALLBACK_PHOTOS.slice(0, 3), source: 'fallback' });
}
