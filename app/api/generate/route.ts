import { NextRequest } from 'next/server';
import { tripFormSchema } from '@/lib/validators';
import { getWeather } from '@/lib/weather';
import { buildTravelPrompt, SYSTEM_PROMPT } from '@/lib/ai';
import { streamCompletion } from '@/lib/ai-stream';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validationResult = tripFormSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid form data', details: validationResult.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = validationResult.data;
    const weather = await getWeather(formData.destination, formData.startDate, formData.endDate);
    const userPrompt = buildTravelPrompt(formData, weather);

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ]);
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };
    if (weather) {
      headers['X-Weather-Data'] = encodeURIComponent(JSON.stringify(weather));
    }

    return new Response(stream, { headers });
  } catch (error) {
    console.error('Generate API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
