import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';

export const maxDuration = 30;

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

    const filtersNote = filters.length ? `\nActive filters: ${filters.join(', ')}.` : '';
    const excludeNote = excludeNames.length
      ? `\nDo NOT suggest any of these hotels (already shown): ${excludeNames.join(', ')}.`
      : '';

    const itinerarySection = itineraryText
      ? `\n\nFull day-by-day itinerary (use this to detect EVERY location change):\n${itineraryText}`
      : '';

    const userPrompt = `Trip: ${prompt}
Destination: ${destination}
Overall check-in: ${checkIn || 'see itinerary'}
Overall check-out: ${checkOut || 'see itinerary'}
Budget level: ${budget}${filtersNote}${excludeNote}${itinerarySection}

TASK: Identify ALL distinct overnight locations in the itinerary and create one hotel segment per location.

Segment detection rules:
1. Read every day title and activity. Clues like "Travel to X", "Arrive in X", "Ferry to X", "Fly to X" or simply day titles mentioning a new place signal a location transition.
2. Each segment starts on the day the traveller ARRIVES at that location and ends the day before they move to the next location (or the last day of the trip).
3. dayRange[0] = arrival day number, dayRange[1] = last full day at that location.
4. checkIn / checkOut dates: derive from the trip's start date (${checkIn}) and the day numbers. If dates are unknown, use empty strings.
5. For single-destination trips with no transitions → exactly one segment.

Return ONLY a valid JSON object (no markdown, no explanation):

{
  "segments": [
    {
      "location": "city or island name",
      "label": "e.g. Mykonos — Days 1–4",
      "checkIn": "YYYY-MM-DD or empty string",
      "checkOut": "YYYY-MM-DD or empty string",
      "dayRange": [1, 4],
      "hotels": [
        {
          "id": "unique-kebab-slug",
          "name": "Full Hotel Name",
          "stars": 4,
          "description": "2 sentences: why this hotel fits THIS specific traveller — mention proximity to planned activities or the local area, budget match, traveller type",
          "priceRange": "approx per night in local currency",
          "neighborhood": "neighbourhood or beach/area name",
          "amenities": ["Pool", "Free Breakfast"],
          "googleMapsQuery": "Hotel Name City Country"
        }
      ]
    }
  ]
}

Additional rules:
- Exactly 3 hotels per segment, each a real well-known property at that specific location (not the overall destination).
- Stars: integer 1–5 matching budget level (budget→2-3★, comfortable→3-4★, premium/luxury→4-5★).
- Amenities: pick 3–5 from: Pool, Free Breakfast, Spa, Gym, Beach Access, Pet Friendly, Rooftop Bar, Airport Shuttle, Restaurant, Bar, Kid Friendly, Sea View, City View, Free WiFi.
- Hotel must be in the correct specific location (e.g. a Santorini hotel must be in Santorini, not Mykonos).
- Description must feel personal to this exact trip and location.`;

    const stream = await streamCompletion([
      { role: 'system', content: 'You are a luxury travel concierge AI. Respond ONLY with valid JSON. No markdown code fences, no extra text.' },
      { role: 'user', content: userPrompt },
    ], 4000);

    const raw = await collectText(stream);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON returned');
    const data = JSON.parse(jsonMatch[0]);

    return Response.json(data);
  } catch (err: any) {
    console.error('hotel-suggestions error:', err);
    return Response.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
