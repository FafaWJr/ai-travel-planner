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
    } = await request.json();

    const filtersNote = filters.length ? `Active filters the user applied: ${filters.join(', ')}.` : '';
    const excludeNote = excludeNames.length
      ? `Do NOT suggest any of these hotels (already shown to user): ${excludeNames.join(', ')}.`
      : '';

    const userPrompt = `Trip details: ${prompt}
Destination: ${destination}
Check-in: ${checkIn || 'not specified'}
Check-out: ${checkOut || 'not specified'}
Budget level: ${budget}
${filtersNote}
${excludeNote}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:

{
  "segments": [
    {
      "location": "city or area name",
      "label": "e.g. Phuket — Days 1–5",
      "checkIn": "YYYY-MM-DD or empty string",
      "checkOut": "YYYY-MM-DD or empty string",
      "dayRange": [1, 5],
      "hotels": [
        {
          "id": "unique-kebab-slug",
          "name": "Full Hotel Name",
          "stars": 4,
          "description": "2 sentences: why this hotel fits THIS specific traveller — mention proximity to planned activities or areas, budget match, traveller type",
          "priceRange": "approx per night in local currency, e.g. THB 4,500–8,000/night",
          "neighborhood": "neighbourhood or beach/area name",
          "amenities": ["Pool", "Free Breakfast"],
          "googleMapsQuery": "Hotel Name City Country"
        }
      ]
    }
  ]
}

Rules:
- Single-destination trip → one segment. Multi-city trip → one segment per city with correct day ranges.
- Exactly 3 hotels per segment, each a real well-known property that exists at this destination.
- Stars: integer 1–5 matching the budget level (budget→2-3★, comfortable→3-4★, premium/luxury→4-5★).
- Amenities: pick 3–5 from: Pool, Free Breakfast, Spa, Gym, Beach Access, Pet Friendly, Rooftop Bar, Airport Shuttle, Restaurant, Bar, Kid Friendly, Sea View, City View, Free WiFi.
- Description must feel personal to this exact trip, not generic.`;

    const stream = await streamCompletion([
      { role: 'system', content: 'You are a luxury travel concierge AI. Respond ONLY with valid JSON. No markdown code fences, no extra text.' },
      { role: 'user', content: userPrompt },
    ], 2000);

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
