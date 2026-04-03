import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';
import { ACTIVITY_AFFILIATE } from '@/lib/affiliate';

export const maxDuration = 30;

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<string> {
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
        const parsed = JSON.parse(json);
        const delta = parsed?.choices?.[0]?.delta?.content;
        if (delta) result += delta;
      } catch { /* skip */ }
    }
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, existingActivities = [], seenIdeas = [], itineraryContext = '' } = await request.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
    }

    const systemPrompt = `You are a travel assistant. When asked, you return only a plain bullet-point list of extra travel ideas — nothing else. No introductions, no section headers, no summaries. Just the bullet list.

Where relevant, append an affiliate CTA link at the end of a bullet (after the description sentence):
- For tours or guided experiences, add: [Find a Guide on GoWithGuide](${ACTIVITY_AFFILIATE.goWithGuide})
- For activities, attractions, or day trips, add: [Book on Klook](${ACTIVITY_AFFILIATE.klook})
- For Mexico-specific experiences (Cancun, Playa del Carmen, Riviera Maya, Tulum, etc.), add: [Explore Xcaret Parks](${ACTIVITY_AFFILIATE.xcaret})
Only add a link when it genuinely fits the suggestion. Do not add multiple links to a single bullet.`;

    const userPrompt = `Trip: ${prompt}
${itineraryContext ? `\nFULL ITINERARY:\n${itineraryContext}\n` : ''}
List 7 extra places, activities or experiences the traveller could consider that would NOT typically be included in a standard itinerary for this trip. These could be nearby day-trip spots, a local neighbourhood worth walking, a food market, a viewpoint, a lesser-known attraction, a type of local restaurant, etc.

${existingActivities.length > 0 ? `ALREADY IN PLANNER — do NOT suggest these or anything similar:\n${existingActivities.map((a: string) => `- ${a}`).join('\n')}\n\n` : ''}${seenIdeas.length > 0 ? `ALREADY SUGGESTED — do NOT repeat these:\n${seenIdeas.map((n: string) => `- ${n}`).join('\n')}\n\n` : ''}Format each as:
- **Place or Activity Name** — one sentence on why it suits this trip.

Only the list. Nothing else.`;

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], 600);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 502 });
    }

    const ideas = await collectStream(stream);
    return new Response(JSON.stringify({ ideas }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
