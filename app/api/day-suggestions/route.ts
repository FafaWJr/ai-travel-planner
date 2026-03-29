import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';

export const maxDuration = 30;

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '', buffer = '';
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
    const { tripPrompt, dayNumber, dayTitle, destination, existingActivities, allDaysContext = '' } = await request.json();

    const systemPrompt = `You are a travel activity suggester. You respond ONLY with a valid JSON array — no prose, no markdown, no explanation before or after. Just the raw JSON array.`;

    const userPrompt = `Trip context: "${tripPrompt}"
Day ${dayNumber}: ${dayTitle} in ${destination}

Existing activities already in this day's plan:
${(existingActivities as string[]).map((a, i) => `${i + 1}. ${a}`).join('\n')}
${allDaysContext ? `\nACTIVITIES ALREADY PLANNED ON OTHER DAYS — do NOT duplicate these:\n${allDaysContext}\n` : ''}
Suggest exactly 3 NEW activities for this day that are NOT already in the list above and NOT duplicates of other days. They must fit the trip style and budget.

Respond with ONLY a JSON array in this exact shape:
[
  {
    "title": "Short activity name",
    "description": "2-3 sentences: what it is, why it fits this trip, practical tip.",
    "timing": "e.g. Morning (2h) or Evening (1.5h)"
  }
]`;

    const stream = await streamCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ], 800);

    const raw = await collectStream(stream);

    // Extract JSON array from response (in case model adds any stray text)
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) {
      return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
    }

    const suggestions = JSON.parse(match[0]);
    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('day-suggestions error:', err);
    return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
  }
}
