import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';

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
    const { prompt } = await request.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Missing prompt' }), { status: 400 });
    }

    const systemPrompt = `You are a travel assistant. When asked, you return only a plain bullet-point list of extra travel ideas — nothing else. No introductions, no section headers, no summaries. Just the bullet list.`;

    const userPrompt = `Trip: ${prompt}

List 7 extra places, activities or experiences the traveller could consider that would NOT typically be included in a standard itinerary for this trip. These could be nearby day-trip spots, a local neighbourhood worth walking, a food market, a viewpoint, a lesser-known attraction, a type of local restaurant, etc.

Format each as:
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
