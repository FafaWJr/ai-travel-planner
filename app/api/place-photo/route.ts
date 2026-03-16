import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (!q.trim()) return Response.json({ url: null });

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q.trim())}`,
      {
        next: { revalidate: 86400 }, // cache 24h
        headers: { 'User-Agent': 'AITravelPlanner/1.0 (educational project)' },
      }
    );
    const data = await res.json();
    if (data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
      return Response.json({ url: null });
    }
    return Response.json({
      url: data.originalimage?.source || data.thumbnail?.source || null,
      description: data.description || null,
      title: data.title || null,
    });
  } catch {
    return Response.json({ url: null });
  }
}
