import { NextRequest } from 'next/server';
import { tripFormSchema } from '@/lib/validators';
import { getWeather } from '@/lib/weather';
import { buildTravelPrompt, SYSTEM_PROMPT, getLanguageInstruction } from '@/lib/ai';
import { streamCompletion } from '@/lib/ai-stream';
import { createClient } from '@/lib/supabase/server';

// Sonnet 4.6 is substantially stronger than the previous Gemini 2.0 Flash model
// but generates more slowly (~50-80 tok/s vs ~300 tok/s). A full 7-section
// itinerary can take 45-90s. Both modes now stream SSE directly to the client,
// eliminating the timeout constraint. 180s kept as safety net for edge cases.
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const locale = (body.locale as string) || 'en';
    const langInstruction = getLanguageInstruction(locale);
    const systemPromptWithLang = langInstruction
      ? `${SYSTEM_PROMPT}\n\n${langInstruction}`
      : SYSTEM_PROMPT;

    /* ── Simple prompt mode (used by the new homepage search bar) ── */
    if (typeof body.prompt === 'string' && body.prompt.trim()) {
      const structuredPrompt = body.prompt.trim() + `

Please provide a detailed, personalised travel plan in Markdown with exactly these 7 sections as H2 headers (no emojis in the headers):

## Destination Overview
## Travel Season & Weather
## Personalised Itinerary
## Where to Stay
## Getting Around
## Budget Estimator
## Practical Tips

For the ## Personalised Itinerary section, follow this structure strictly for every day:
- Use "### Day N: Title" as the day header.
- Inside each day include EXACTLY these four sub-headers in order: **Morning:**, **Afternoon:**, **Evening:**, **Night:**
- List at least one bullet-point activity under each sub-header.
- Do NOT repeat the time-of-day word inside the bullet text itself.

Make each section specific, practical and engaging. Use bullet points and bold text throughout.`;

      let stream: ReadableStream<Uint8Array>;
      try {
        stream = await streamCompletion(
          [
            { role: 'system', content: systemPromptWithLang },
            { role: 'user', content: structuredPrompt },
          ],
          'generate'
        );
      } catch (err: unknown) {
        console.error('[generate] stream error:', err);
        return new Response(
          JSON.stringify({ error: 'Something went wrong. Please try again.' }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    /* ── Structured form mode (legacy) ── */
    const validationResult = tripFormSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[generate] validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid form data. Please check your inputs and try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = validationResult.data;
    const weather = await getWeather(formData.destination, formData.startDate, formData.endDate);
    const userPrompt = buildTravelPrompt(formData, weather);

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        'generate'
      );
    } catch (err: unknown) {
      console.error('[generate] stream error:', err);
      return new Response(
        JSON.stringify({ error: 'Something went wrong. Please try again.' }),
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
