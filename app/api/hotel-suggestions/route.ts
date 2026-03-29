import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';

export const maxDuration = 60;

// ─── SSE collector ────────────────────────────────────────────────────────────

async function collectText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const delta = JSON.parse(json)?.choices?.[0]?.delta?.content;
        if (delta) result += delta;
      } catch { /* skip */ }
    }
  }
  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Estimate the number of days in the trip from itinerary text. */
function countDays(itineraryText: string): number {
  const nums = (itineraryText.match(/\bday\s*\d+/gi) ?? [])
    .map(m => parseInt(m.replace(/\D/g, ''), 10))
    .filter(Boolean);
  return nums.length > 0 ? Math.max(...nums) : 1;
}

interface Segment {
  location: string;
  label: string;
  checkIn: string;
  checkOut: string;
  dayRange: [number, number];
}

interface Hotel {
  id: string;
  name: string;
  stars: number;
  description: string;
  priceRange: string;
  neighborhood: string;
  amenities: string[];
  googleMapsQuery: string;
}

// ─── Phase 1: detect overnight location segments ──────────────────────────────
// Small, fast call — outputs only segment metadata (no hotel data).
// Max output is ~600 tokens even for a 30-city trip.

async function detectSegments(
  itineraryText: string,
  checkIn: string,
  checkOut: string,
): Promise<Segment[]> {
  const stream = await streamCompletion(
    [
      {
        role: 'system',
        content: 'You are a travel itinerary parser. Output ONLY valid JSON. No markdown.',
      },
      {
        role: 'user',
        content:
          `Identify every distinct overnight stay location in this itinerary.\n` +
          `Trip dates: ${checkIn || 'unknown'} → ${checkOut || 'unknown'}\n\n` +
          `${itineraryText}\n\n` +
          `RULES:\n` +
          `- Only include cities/areas where the traveller actually sleeps overnight.\n` +
          `- Day trips and excursions do NOT create a new segment — only overnight stops.\n` +
          `- A new segment starts when the traveller moves to a different city to sleep.\n\n` +
          `Return ONLY this JSON (no extra text):\n` +
          `{"segments":[{"location":"city name","label":"City — Days X–Y","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","dayRange":[1,3]}]}`,
      },
    ],
    1000, // segment metadata is tiny — 1000 tokens is enough even for 30-day trips
  );

  const raw = await collectText(stream);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];

  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed.segments) ? parsed.segments : [];
  } catch {
    return [];
  }
}

// ─── Phase 2: generate 5 hotels for a single segment ─────────────────────────
// Each call is bounded to one city, 5 hotels ≈ 2000–2500 tokens output.
// Running N of these in parallel scales to any trip length.

async function hotelsForSegment(
  segment: Segment,
  tripPrompt: string,
  budget: string,
  excludeNames: string[],
  filters: string[],
): Promise<Segment & { hotels: Hotel[] }> {
  const excludeNote = excludeNames.length
    ? `\nDo NOT suggest any of these (already shown): ${excludeNames.join(', ')}.`
    : '';
  const filtersNote = filters.length
    ? `\nRequired filters: ${filters.join(', ')}.`
    : '';

  const prompt =
    `Trip context: ${tripPrompt}\n` +
    `Location: ${segment.location} (${segment.label})\n` +
    `Dates: ${segment.checkIn || 'unknown'} → ${segment.checkOut || 'unknown'}\n` +
    `Budget level: ${budget}${filtersNote}${excludeNote}\n\n` +
    `Suggest exactly 5 real, well-known hotels located in ${segment.location}, covering a range of price tiers:\n` +
    `- 1-2 budget options (~$80-150/night)\n` +
    `- 2 mid-range options (~$150-300/night)\n` +
    `- 1-2 premium/luxury options ($300+/night)\n\n` +
    `Return ONLY valid JSON (no markdown, no extra text):\n` +
    `{"hotels":[{"id":"unique-slug","name":"Full Hotel Name","stars":4,` +
    `"description":"2 sentences: why this hotel fits THIS traveller","priceRange":"~$150/night",` +
    `"neighborhood":"area name","amenities":["Pool","Free WiFi"],"googleMapsQuery":"Hotel Name City Country"}]}`;

  try {
    const stream = await streamCompletion(
      [
        {
          role: 'system',
          content: 'You are a luxury travel concierge AI. Respond ONLY with valid JSON. No markdown code fences.',
        },
        { role: 'user', content: prompt },
      ],
      2500, // 5 hotels × ~500 tokens — sufficient for full descriptions
    );

    const raw = await collectText(stream);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { ...segment, hotels: [] };

    const parsed = JSON.parse(match[0]);
    const hotels = Array.isArray(parsed.hotels) ? parsed.hotels : [];
    return { ...segment, hotels };
  } catch {
    // Return the segment with empty hotels rather than killing the whole request
    return { ...segment, hotels: [] };
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const {
      prompt = '',
      destination = '',
      checkIn = '',
      checkOut = '',
      budget = 'comfortable',
      excludeNames = [] as string[],
      filters = [] as string[],
      itineraryText = '',
    } = await request.json();

    // Phase 1: identify all overnight location segments from the itinerary.
    // This is a lightweight call — its output is just metadata, not hotel data.
    const days = countDays(itineraryText);
    const rawSegments = itineraryText
      ? await detectSegments(itineraryText, checkIn, checkOut)
      : [];

    // If segment detection finds nothing, fall back to a single-destination segment.
    const segments: Segment[] = rawSegments.length > 0
      ? rawSegments
      : [{ location: destination, label: destination, checkIn, checkOut, dayRange: [1, days] }];

    // Phase 2: generate 3 hotels per segment, all in parallel.
    // Each call is bounded to ~1200 tokens regardless of trip length,
    // so this scales to 30-day, multi-city trips without hitting token limits.
    const segmentsWithHotels = await Promise.all(
      segments.map(seg =>
        hotelsForSegment(seg, prompt, budget, excludeNames, filters)
      ),
    );

    // Validate that at least one segment has hotels before returning
    const hasAny = segmentsWithHotels.some(s => s.hotels.length > 0);
    if (!hasAny) {
      throw new Error('No hotel suggestions could be generated. Please try again.');
    }

    return Response.json({ segments: segmentsWithHotels });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not generate hotel suggestions. Please try again.';
    console.error('hotel-suggestions error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
