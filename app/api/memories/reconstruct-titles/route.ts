import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { AI_MODELS } from '@/lib/ai';
import { batchReverseGeocode } from '@/lib/memories/geocode';
import { clusterPhotos } from '@/lib/memories/clustering';
import type { GpsPhoto } from '@/lib/memories/clustering';
import type { GeoCoordinate, GeocodedLocation, DayLocationData } from '@/lib/memories/geocode-types';

export const maxDuration = 120; // geocoding (up to 60s) + Claude call (~5-10s) + DB update

// Rate limit: 1 reconstruction per memory per 5 minutes (in-memory, resets on cold start)
const recentCalls = new Map<string, number>();

const TITLE_SYSTEM_PROMPT = `You are generating day titles for a personal travel memory journal.

Rules:
- Each title MUST reference actual place names from the location data provided. Never invent locations.
- Titles should feel like memory captions, not itinerary headings.
- Use neighbourhood, landmark, or district names. Never use just the city name alone.
- Include time-of-day hints or atmospheric tone when the data supports it (morning photos, sunset timestamps, late-night clusters).
- Keep each title under 60 characters.
- Never use generic phrases: "Exploring [City]", "Day in [Place]", "Adventure Continues", "City Discovery".
- If a day has multiple location clusters, the title should reference the most prominent one (highest photo count) or capture the movement pattern.
- For days without GPS data, create an honest placeholder using the destination name. Example: "Your [destination] day" or "Untitled day [N]". Never hallucinate specific locations.

Good examples:
- "Sunset in Santorini's Cliffside Villages"
- "Quiet Morning Around Kyoto's Eastern Temples"
- "Late Night Food Crawl in Dotonbori"
- "Beach Hopping Along the Amalfi Coast"
- "Rainy Afternoon Cafes in Shibuya"

Bad examples:
- "Exploring Tokyo"
- "Day in Paris"
- "Adventure Continues"
- "Fun in Rome"
- "City Discovery"

Respond with ONLY a JSON array of objects, one per day, in this exact format:
[
  { "dayNumber": 1, "title": "Your generated title here" },
  { "dayNumber": 2, "title": "Your generated title here" }
]

No markdown, no backticks, no explanation. Only the JSON array.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { memoryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { memoryId } = body;
  if (!memoryId) {
    return NextResponse.json({ error: 'memoryId required' }, { status: 400 });
  }

  // Rate limit check
  const rateKey = `${user.id}:${memoryId}`;
  const lastCall = recentCalls.get(rateKey);
  if (lastCall && Date.now() - lastCall < 5 * 60 * 1000) {
    return NextResponse.json(
      { error: 'Please wait a few minutes before regenerating titles' },
      { status: 429 },
    );
  }

  // Fetch the memory (must belong to the user)
  const { data: memory, error: fetchErr } = await supabase
    .from('trip_memories')
    .select('id, memory_data, standalone_destination, standalone_start_date, standalone_end_date, trip_id, user_id')
    .eq('id', memoryId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !memory) {
    return NextResponse.json({ error: 'Memory not found' }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const days = (memory as any).memory_data?.days;
  if (!Array.isArray(days) || days.length === 0) {
    return NextResponse.json({ error: 'Memory has no days' }, { status: 400 });
  }

  const destination = (memory as Record<string, unknown>).standalone_destination as string | null
    || 'Unknown destination';

  // ── Step 1: Collect GPS photos per day ──────────────────────────────────────
  const dayLocationData: DayLocationData[] = [];

  for (const day of days) {
    const dayNumber = day.dayNumber as number;
    const photos = (day.photos || []) as Array<{
      exifLat?: number | null;
      exifLng?: number | null;
      exifDate?: string | null;
    }>;

    const gpsPhotos: GpsPhoto[] = photos
      .filter((p): p is { exifLat: number; exifLng: number; exifDate: string } =>
        typeof p.exifLat === 'number' && typeof p.exifLng === 'number' && !!p.exifDate,
      )
      .map(p => ({ lat: p.exifLat, lng: p.exifLng, timestamp: p.exifDate }));

    // ── Step 2: Cluster GPS points ───────────────────────────────────────────
    const clusters = clusterPhotos(gpsPhotos);

    let overallConfidence: DayLocationData['overallConfidence'] = 'none';
    if (gpsPhotos.length >= 3) overallConfidence = 'high';
    else if (gpsPhotos.length >= 1) overallConfidence = 'medium';
    else if (photos.length > 0) overallConfidence = 'low';

    dayLocationData.push({
      dayNumber,
      clusters,
      locations: [],
      overallConfidence,
      gpsPhotoCount: gpsPhotos.length,
      totalPhotoCount: photos.length,
    });
  }

  // ── Step 3: Collect all unique cluster centroids for batch geocoding ─────────
  const allCentroids: GeoCoordinate[] = [];
  const centroidToDayCluster: { dayIdx: number; clusterIdx: number }[] = [];

  dayLocationData.forEach((dayData, dayIdx) => {
    dayData.clusters.forEach((_cluster, clusterIdx) => {
      allCentroids.push({
        lat: dayData.clusters[clusterIdx].centroidLat,
        lng: dayData.clusters[clusterIdx].centroidLng,
      });
      centroidToDayCluster.push({ dayIdx, clusterIdx });
    });
  });

  // ── Step 4: Batch reverse geocode ───────────────────────────────────────────
  let geocodedResults: GeocodedLocation[] = [];
  if (allCentroids.length > 0) {
    try {
      for (let i = 0; i < allCentroids.length; i += 50) {
        const batch = allCentroids.slice(i, i + 50);
        const batchResults = await batchReverseGeocode(batch);
        geocodedResults = geocodedResults.concat(batchResults);
      }

      geocodedResults.forEach((result, idx) => {
        const { dayIdx } = centroidToDayCluster[idx];
        dayLocationData[dayIdx].locations.push(result);
      });
    } catch (err) {
      console.error('[reconstruct-titles] Geocoding error:', err);
      // Non-blocking: days without geocoded data use the destination fallback
    }
  }

  // ── Step 5: Build Claude prompt with per-day location data ───────────────────
  const perDayPromptLines: string[] = [];

  dayLocationData.forEach(dayData => {
    const { dayNumber, clusters, locations, overallConfidence, gpsPhotoCount, totalPhotoCount } = dayData;

    const originalDay = days.find((d: { dayNumber: number }) => d.dayNumber === dayNumber);
    if (originalDay?.dayTitleSource === 'user') {
      perDayPromptLines.push(
        `Day ${dayNumber}: [SKIP - user edited title, keep "${originalDay.dayTitle as string}"]`,
      );
      return;
    }

    if (locations.length > 0) {
      const locationDescs = locations.map((loc, i) => {
        const cluster = clusters[i];
        const timeInfo = cluster?.startTime && cluster?.endTime
          ? ` (${new Date(cluster.startTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}-${new Date(cluster.endTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })})`
          : '';
        return `  - ${loc.displayName}${timeInfo}, ${cluster?.photoCount ?? 0} photos`;
      });

      perDayPromptLines.push(
        `Day ${dayNumber}: ${gpsPhotoCount} GPS photos, ${totalPhotoCount} total, confidence: ${overallConfidence}\n` +
        `  Locations:\n${locationDescs.join('\n')}`,
      );
    } else {
      perDayPromptLines.push(
        `Day ${dayNumber}: ${totalPhotoCount} photos (no GPS data), confidence: ${overallConfidence}`,
      );
    }
  });

  const mem = memory as Record<string, unknown>;
  const userPrompt = `Destination: ${destination}
Trip dates: ${(mem.standalone_start_date as string | null) || 'unknown'} to ${(mem.standalone_end_date as string | null) || 'unknown'}
Number of days: ${days.length}

Day data:
${perDayPromptLines.join('\n\n')}

Generate one title per day. For days marked [SKIP], return the existing title unchanged.`;

  // ── Step 6: Call Claude for title generation ─────────────────────────────────
  let generatedTitles: { dayNumber: number; title: string }[] = [];

  try {
    const anthropic = new Anthropic();
    const aiResponse = await anthropic.messages.create({
      model: AI_MODELS.primary,
      max_tokens: 1000,
      system: TITLE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = aiResponse.content.find(b => b.type === 'text');
    if (textBlock && textBlock.type === 'text') {
      const cleaned = textBlock.text.replace(/```json\s*|```\s*/g, '').trim();
      generatedTitles = JSON.parse(cleaned);
    }
  } catch (err) {
    console.error('[reconstruct-titles] Claude error:', err);
    return NextResponse.json({ error: 'Title generation failed' }, { status: 500 });
  }

  if (!Array.isArray(generatedTitles) || generatedTitles.length === 0) {
    return NextResponse.json({ error: 'No titles generated' }, { status: 500 });
  }

  // ── Step 7: Update memory_data with new titles and location data ─────────────
  const memoryData = (memory as Record<string, unknown>).memory_data as Record<string, unknown>;

  const updatedDays = days.map((day: Record<string, unknown>) => {
    const dayNum = day.dayNumber as number;

    if (day.dayTitleSource === 'user') return day;

    const generated = generatedTitles.find(t => t.dayNumber === dayNum);
    const locationData = dayLocationData.find(d => d.dayNumber === dayNum);

    return {
      ...day,
      dayTitle: generated?.title || day.dayTitle,
      dayTitleSource: locationData && locationData.gpsPhotoCount > 0 ? 'gps' : 'skeleton',
      locations: locationData?.locations.map((loc, i) => ({
        name: loc.displayName,
        type: loc.neighbourhood ? 'neighbourhood' : loc.district ? 'district' : 'city',
        lat: loc.lat,
        lng: loc.lng,
        photoCount: locationData.clusters[i]?.photoCount ?? 0,
        timeRange: locationData.clusters[i]?.startTime && locationData.clusters[i]?.endTime
          ? `${new Date(locationData.clusters[i].startTime!).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}-${new Date(locationData.clusters[i].endTime!).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: false })}`
          : null,
      })) || [],
      confidence: locationData?.overallConfidence || 'none',
    };
  });

  const { error: updateErr } = await supabase
    .from('trip_memories')
    .update({
      memory_data: { ...memoryData, days: updatedDays },
      updated_at: new Date().toISOString(),
    })
    .eq('id', memory.id)
    .eq('user_id', user.id);

  if (updateErr) {
    console.error('[reconstruct-titles] Update error:', updateErr);
    return NextResponse.json({ error: 'Failed to save titles' }, { status: 500 });
  }

  recentCalls.set(rateKey, Date.now());

  const responseDays = updatedDays.map((day: Record<string, unknown>) => ({
    dayNumber: day.dayNumber,
    title: day.dayTitle,
    locations: day.locations || [],
    confidence: day.confidence || 'none',
    source: day.dayTitleSource || 'skeleton',
  }));

  return NextResponse.json({ days: responseDays });
}
