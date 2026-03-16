import { NextRequest } from 'next/server';

interface ImageInfo {
  url: string;
  width: number;
  height: number;
  mime: string;
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get('city') || '';
  if (!city.trim()) return Response.json({ photos: [], description: null });

  try {
    // Step 1: get the canonical Wikipedia title + main description via summary
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city.trim())}`,
      { next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
    );
    const summary = await summaryRes.json();
    const description: string | null = summary.description ?? null;
    const canonicalTitle: string = summary.title ?? city.trim();
    const mainPhoto: string | null =
      summary.originalimage?.source ?? summary.thumbnail?.source ?? null;

    // Step 2: get all images from the Wikipedia article
    const imagesRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&generator=images&titles=${encodeURIComponent(canonicalTitle)}&prop=imageinfo&iiprop=url|dimensions|mime&gimlimit=40&format=json&origin=*`,
      { next: { revalidate: 86400 }, headers: { 'User-Agent': 'AITravelPlanner/1.0' } }
    );
    const imagesData = await imagesRes.json();
    const pages = imagesData?.query?.pages ?? {};

    // Filter for high-quality landscape JPEG/PNG photos
    const candidates: string[] = [];
    for (const page of Object.values(pages) as any[]) {
      const info: ImageInfo = page.imageinfo?.[0];
      if (!info) continue;
      if (info.mime !== 'image/jpeg' && info.mime !== 'image/png') continue;
      if (info.width < 600 || info.height < 300) continue; // minimum size
      if (info.height > info.width * 1.2) continue; // skip portraits
      candidates.push(info.url);
    }

    // Build the final photo array: main photo first, then up to 2 extras
    const photos: string[] = [];
    if (mainPhoto) photos.push(mainPhoto);

    for (const url of candidates) {
      if (photos.length >= 3) break;
      if (!photos.includes(url)) photos.push(url);
    }

    return Response.json({ photos, description });
  } catch {
    return Response.json({ photos: [], description: null });
  }
}
