import { NextRequest } from 'next/server';

// Generic scenic travel fallbacks - used only if everything else fails
const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
];

// Filename fragments that identify non-travel content
const EXCLUDED = /flag|coat.of.arm|emblem|seal|coa_|arms_of|logo|icon|symbol|stamp|portrait|bust|military|war|battle|bomb|napalm|soldier|army|navy|communist|party.congress|rally|protest|politic|propaganda|election|weapon|gun|tank|artillery|massacre|execution|president|premier|minister|inauguration|signing|handshake|meeting|summit|conference|satellite|locator|location|map_of|map\.svg|route|diagram|plan_of|layout|schematic|chart|graph|wikivoyage|wv_banner|banner_|relief_map|blank_map|geograph_of/i;

function isGoodTravelPhoto(info: { url: string; width: number; height: number; mime: string }): boolean {
  // Accept JPEG and PNG (both can be excellent travel photos)
  if (info.mime !== 'image/jpeg' && info.mime !== 'image/png') return false;
  // Minimum size - needs to be big enough to look good in the UI
  if (!info.width || !info.height) return false;
  if (info.width < 800) return false;
  // Must be landscape orientation (wider than it is tall)
  if (info.width < info.height * 1.2) return false;
  // Filter out non-travel content by filename
  if (EXCLUDED.test(info.url)) return false;
  return true;
}

/**
 * Strategy 1: Wikipedia article HERO image.
 * The lead image on Wikipedia's article is always the most iconic representation
 * of the destination: Vietnam → Ha Long Bay, Barcelona → Sagrada Família, etc.
 */
async function fetchWikipediaHeroImage(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type?.includes('not_found')) return null;
    const url: string | null = data.originalimage?.source ?? data.thumbnail?.source ?? null;
    if (!url) return null;
    // Make sure the hero image itself isn't a flag or emblem
    if (EXCLUDED.test(url)) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Strategy 2: Wikimedia Commons scenic search.
 * Searches with landscape/nature/scenery-focused terms so results show
 * what makes the destination visually exciting - not city admin buildings.
 * Runs multiple queries to fill up to 5 slots with diverse scenic photos.
 */
async function fetchScenicPhotos(cityName: string, needed: number): Promise<string[]> {
  // Queries ordered from most scenic to most general
  const queries = [
    `${cityName} landscape`,
    `${cityName} nature scenery`,
    `${cityName} panorama`,
    `${cityName} travel`,
    `${cityName} beach coast`,
    `${cityName} mountains`,
    `${cityName} old town`,
  ];

  const photos: string[] = [];

  for (const query of queries) {
    if (photos.length >= needed) break;
    try {
      const res = await fetch(
        `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|dimensions|mime&gsrlimit=30&format=json&origin=*`,
        { signal: AbortSignal.timeout(7000), next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const pages = Object.values(data?.query?.pages ?? {}) as any[];

      // Sort by descending width so we prefer the highest-quality photos first
      pages.sort((a, b) => (b.imageinfo?.[0]?.width ?? 0) - (a.imageinfo?.[0]?.width ?? 0));

      for (const page of pages) {
        if (photos.length >= needed) break;
        const info = page.imageinfo?.[0];
        if (!info?.url) continue;
        if (!isGoodTravelPhoto(info)) continue;
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

  // Extract primary destination name: "Da Nang, Vietnam" → "Da Nang", "Vietnam" → "Vietnam"
  const cityName = rawCity.split(',')[0].trim();
  console.log(`[destination-photos] raw="${rawCity}" cityName="${cityName}"`);

  const photos: string[] = [];

  // Step 1: Wikipedia hero image - the single most iconic shot of the destination
  const hero = await fetchWikipediaHeroImage(cityName);
  if (hero) {
    photos.push(hero);
    console.log(`[destination-photos] hero image found for "${cityName}"`);
  } else {
    console.log(`[destination-photos] no hero image for "${cityName}"`);
  }

  // Step 2: Fill remaining slots with scenic landscape/nature photos from Commons
  const scenic = await fetchScenicPhotos(cityName, 5 - photos.length);
  console.log(`[destination-photos] scenic search returned ${scenic.length} for "${cityName}"`);
  for (const url of scenic) {
    if (!photos.includes(url)) photos.push(url);
  }

  // Step 3: If still short (rare), try the full destination string as a fallback query
  if (photos.length < 3 && rawCity !== cityName) {
    const extra = await fetchScenicPhotos(rawCity.trim(), 3 - photos.length);
    for (const url of extra) {
      if (!photos.includes(url)) photos.push(url);
    }
  }

  if (photos.length > 0) {
    console.log(`[destination-photos] returning ${photos.length} photos for "${cityName}"`);
    return Response.json({ photos: photos.slice(0, 5), source: 'scenic' });
  }

  console.log(`[destination-photos] all strategies failed for "${cityName}", using fallback`);
  return Response.json({ photos: FALLBACK_PHOTOS.slice(0, 3), source: 'fallback' });
}
