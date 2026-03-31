import { NextRequest } from 'next/server';

// High-quality generic travel fallbacks - used only if all strategies fail
const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=1200&q=80',
  'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1200&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&q=80',
];

// Filename/URL fragments that identify non-tourism content
const EXCLUDED = /flag|coat.of.arm|emblem|seal|coa_|arms_of|logo|icon|symbol|stamp|portrait|bust|military|war|battle|bomb|napalm|soldier|army|navy|communist|rally|protest|politic|propaganda|election|weapon|gun|tank|artillery|massacre|execution|president|premier|minister|inauguration|signing|handshake|meeting|summit|conference|satellite|locator|location|map_of|map\.svg|route_|diagram|plan_of|schematic|chart|graph|wikivoyage|wv_banner|banner_|relief_map|blank_map|geograph_of|topograph|geological|tectonic|administrative|postage_stamp|currency|banknote|coin_|census|statistic|coat_of|heraldry|verwaltung|karte_/i;

/**
 * Extracts a clean, tourism-search-ready city name.
 * Handles "Vietnam, Vietnam" (country-only destination) by appending "tourism"
 * so searches return travel content instead of national symbols.
 */
function extractCityForSearch(rawDestination: string): { searchTerm: string; displayCity: string } {
  const parts = rawDestination.split(',').map(s => s.trim()).filter(Boolean);
  const city = parts[0] ?? rawDestination.trim();
  const country = parts[parts.length - 1] ?? city;

  // "Vietnam, Vietnam" or "France, France" - destination is just a country name
  // Appending "tourism" forces travel results and avoids national flag/emblem results
  if (parts.length >= 2 && city.toLowerCase() === country.toLowerCase()) {
    console.log(`[photos] Country-only destination detected: "${city}" - using "${city} tourism"`);
    return { searchTerm: `${city} tourism`, displayCity: city };
  }

  return { searchTerm: city, displayCity: city };
}

/**
 * Tourism-specific search queries in priority order.
 * Never searches bare city name alone - always forces travel/scenic intent.
 */
function buildTourismQueries(searchTerm: string): string[] {
  return [
    `${searchTerm} travel tourism`,
    `${searchTerm} scenic landscape`,
    `${searchTerm} tourist attraction`,
    `${searchTerm} landmark beauty`,
    `${searchTerm} nature panorama`,
    `${searchTerm} old town architecture`,
    `${searchTerm} beach coast`,
  ];
}

function isGoodTravelPhoto(info: { url: string; width: number; height: number; mime: string }): boolean {
  if (info.mime !== 'image/jpeg' && info.mime !== 'image/png') return false;
  if (!info.width || !info.height) return false;
  if (info.width < 800) return false;
  // Must be landscape orientation
  if (info.width < info.height * 1.2) return false;
  // Reject non-travel filenames
  if (EXCLUDED.test(info.url)) return false;
  return true;
}

/**
 * Wikipedia article hero image - always the single most iconic shot.
 * Vietnam → Ha Long Bay, Barcelona → Sagrada Família, Paris → Eiffel Tower.
 * Uses the base city name (without "tourism" suffix) for the article lookup.
 */
async function fetchWikipediaHeroImage(displayCity: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(displayCity)}`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.type?.includes('not_found')) return null;
    const url: string | null = data.originalimage?.source ?? data.thumbnail?.source ?? null;
    if (!url) return null;
    if (EXCLUDED.test(url)) {
      console.log(`[photos] Hero image rejected (EXCLUDED match): ${url.split('/').pop()}`);
      return null;
    }
    // Extra check: reject if URL looks like an SVG-derived PNG (usually flags/emblems)
    if (/\.svg\.(png|jpg)/i.test(url)) {
      console.log(`[photos] Hero image rejected (SVG-derived): ${url.split('/').pop()}`);
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/**
 * Wikimedia Commons tourism-focused search.
 * Uses travel/scenic/tourism-appended queries and strict quality + content filters.
 */
async function fetchCommonsPhotos(searchTerm: string, needed: number): Promise<string[]> {
  const queries = buildTourismQueries(searchTerm);
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

      // Prefer highest resolution (largest width = best quality)
      pages.sort((a, b) => (b.imageinfo?.[0]?.width ?? 0) - (a.imageinfo?.[0]?.width ?? 0));

      let addedThisRound = 0;
      for (const page of pages) {
        if (photos.length >= needed) break;
        const info = page.imageinfo?.[0];
        if (!info?.url) continue;
        if (!isGoodTravelPhoto(info)) continue;
        if (!photos.includes(info.url)) {
          photos.push(info.url);
          addedThisRound++;
        }
      }
      console.log(`[photos] Query "${query}" → ${addedThisRound} accepted`);
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

  const { searchTerm, displayCity } = extractCityForSearch(rawCity);
  console.log(`[photos] raw="${rawCity}" displayCity="${displayCity}" searchTerm="${searchTerm}"`);

  const photos: string[] = [];

  // Step 1: Wikipedia hero - the single most iconic shot, using the real city name
  const hero = await fetchWikipediaHeroImage(displayCity);
  if (hero) {
    photos.push(hero);
    console.log(`[photos] Hero accepted: ${hero.split('/').pop()?.slice(0, 60)}`);
  } else {
    console.log(`[photos] No valid hero image for "${displayCity}"`);
  }

  // Step 2: Tourism-targeted Commons search to fill remaining slots
  const scenic = await fetchCommonsPhotos(searchTerm, 5 - photos.length);
  console.log(`[photos] Commons returned ${scenic.length} scenic photos`);
  for (const url of scenic) {
    if (!photos.includes(url)) photos.push(url);
  }

  // Step 3: If still not enough, retry with just the bare city name
  if (photos.length < 3 && searchTerm !== displayCity) {
    const extra = await fetchCommonsPhotos(displayCity, 3 - photos.length);
    for (const url of extra) {
      if (!photos.includes(url)) photos.push(url);
    }
  }

  const finalPhotos = photos.slice(0, 5);
  console.log(`[photos] Final count: ${finalPhotos.length} for "${displayCity}" (source: ${finalPhotos.length > 0 ? 'travel' : 'fallback'})`);

  if (finalPhotos.length === 0) {
    console.warn(`[photos] WARNING: No valid tourism photos found for "${rawCity}" - using generic fallback`);
    return Response.json({ photos: FALLBACK_PHOTOS.slice(0, 3), source: 'fallback' });
  }

  return Response.json({ photos: finalPhotos, source: 'travel' });
}
