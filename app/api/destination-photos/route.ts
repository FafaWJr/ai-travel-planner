import { NextRequest } from 'next/server';

interface ImageInfo {
  url: string;
  width: number;
  height: number;
  mime: string;
}

// Generic fallback photos - beautiful travel/landscape shots, always available
const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80',
  'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&q=80',
];

async function fetchWikipediaPhotos(query: string): Promise<string[]> {
  const summaryRes = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
    { next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
  );
  const summary = await summaryRes.json();
  if (summary.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') return [];
  if (!summary.title) return [];

  const description: string | null = summary.description ?? null;
  const canonicalTitle: string = summary.title;
  const mainPhoto: string | null =
    summary.originalimage?.source ?? summary.thumbnail?.source ?? null;

  const imagesRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&generator=images&titles=${encodeURIComponent(canonicalTitle)}&prop=imageinfo&iiprop=url|dimensions|mime&gimlimit=40&format=json&origin=*`,
    { next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
  );
  const imagesData = await imagesRes.json();
  const pages = imagesData?.query?.pages ?? {};

  const candidates: string[] = [];
  for (const page of Object.values(pages) as any[]) {
    const info: ImageInfo = page.imageinfo?.[0];
    if (!info) continue;
    if (info.mime !== 'image/jpeg' && info.mime !== 'image/png') continue;
    if (info.width < 600 || info.height < 300) continue;
    if (info.height > info.width * 1.2) continue; // skip portraits
    candidates.push(info.url);
  }

  const photos: string[] = [];
  if (mainPhoto) photos.push(mainPhoto);
  for (const url of candidates) {
    if (photos.length >= 5) break;
    if (!photos.includes(url)) photos.push(url);
  }

  void description; // used in future enhancements
  return photos;
}

export async function GET(request: NextRequest) {
  const rawCity = request.nextUrl.searchParams.get('city') || '';
  if (!rawCity.trim()) return Response.json({ photos: FALLBACK_PHOTOS.slice(0,3), source: 'fallback' });

  // Always extract just the primary city name for best Wikipedia match
  // "Barcelona, Catalonia, Spain" -> "Barcelona"
  // "Gold Coast, Queensland, Australia" -> "Gold Coast"
  const cityName = rawCity.split(',')[0].trim();
  console.log(`[destination-photos] raw="${rawCity}" cityName="${cityName}"`);

  try {
    // Attempt 1: city name only (most reliable)
    let photos = await fetchWikipediaPhotos(cityName);
    console.log(`[destination-photos] attempt 1 (cityName) returned ${photos.length} photos`);

    // Attempt 2: full destination string if city name alone failed
    if (photos.length === 0 && rawCity !== cityName) {
      photos = await fetchWikipediaPhotos(rawCity.trim());
      console.log(`[destination-photos] attempt 2 (full string) returned ${photos.length} photos`);
    }

    if (photos.length > 0) {
      return Response.json({ photos: photos.slice(0,5), source: 'wikipedia' });
    }

    // Fallback: guaranteed photos
    console.log(`[destination-photos] all attempts failed for "${cityName}", using fallback`);
    return Response.json({ photos: FALLBACK_PHOTOS.slice(0,3), source: 'fallback' });
  } catch (err) {
    console.error(`[destination-photos] error for "${cityName}":`, err);
    return Response.json({ photos: FALLBACK_PHOTOS.slice(0,3), source: 'fallback' });
  }
}
