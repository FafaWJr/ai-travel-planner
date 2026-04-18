import { NextRequest } from 'next/server';
import { tripFormSchema } from '@/lib/validators';
import { getWeather } from '@/lib/weather';
import { buildTravelPrompt, SYSTEM_PROMPT, getLanguageInstruction, buildGenerateTools } from '@/lib/ai';
import { streamCompletion } from '@/lib/ai-stream';
import { createClient } from '@/lib/supabase/server';

// Stage 4: maxDuration raised to 600s (10 min, Vercel Pro limit) to accommodate
// 20+ day trips where define_day tool calls can take much longer than 8-section markdown.
export const maxDuration = 600;

/**
 * Extract approximate trip day count from a natural-language prompt string.
 * Used to decide whether to include define_phase in the tool array (≥15 days).
 * Returns null if the count can't be reliably detected.
 */
function extractTripDaysFromPrompt(prompt: string): number | null {
  // "from 2025-01-01 to 2025-01-14" style
  const fromTo = prompt.match(/from\s+(\d{4}-\d{2}-\d{2}).*?to\s+(\d{4}-\d{2}-\d{2})/i);
  if (fromTo) {
    const days = Math.ceil(
      (new Date(fromTo[2]).getTime() - new Date(fromTo[1]).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    if (!isNaN(days) && days > 0) return days;
  }
  // "14 days", "14-day", "for 14 days"
  const dayWord = prompt.match(/(\d+)\s*-?\s*days?/i);
  if (dayWord) return parseInt(dayWord[1], 10);
  // "2 weeks"
  const weekWord = prompt.match(/(\d+)\s*-?\s*weeks?/i);
  if (weekWord) return parseInt(weekWord[1], 10) * 7;
  return null;
}

/**
 * Builds the user prompt for the itinerary section when using structured tool output.
 * Replaces the markdown day-by-day format instruction with a tool-use instruction.
 */
function buildStructuredItineraryInstruction(tripDays: number): string {
  const phaseNote = tripDays >= 15
    ? `\nFor this ${tripDays}-day trip, first call define_phase() to group the days into 3–5 thematic phases (e.g. "Coastal Escape: Days 1-5", "City Exploration: Days 6-10"). Then call define_day() for each day, including the phase_id it belongs to.`
    : '';
  return `## Personalised Itinerary
IMPORTANT: Do NOT write the itinerary days as markdown text. Instead, call define_day() ONCE for EACH of the ${tripDays} days in order (Day 1 through Day ${tripDays}).${phaseNote}
Each define_day call must include at least 1 activity per time slot (morning, afternoon, evening, night). Be specific and practical.`;
}

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

    /* ── Simple prompt mode (used by the homepage search bar) ── */
    if (typeof body.prompt === 'string' && body.prompt.trim()) {
      const rawPrompt = body.prompt.trim();
      const tripDays = extractTripDaysFromPrompt(rawPrompt) ?? 7;
      const tools = buildGenerateTools(tripDays);

      const structuredPrompt = rawPrompt + `

Please provide a detailed, personalised travel plan in Markdown with exactly these sections as H2 headers (no emojis in the headers):

## Destination Overview
## Travel Season & Weather
${buildStructuredItineraryInstruction(tripDays)}
## Where to Stay
## Getting Around
## Budget Estimator
## Practical Tips

Make each section specific, practical and engaging. Use bullet points and bold text throughout.`;

      let stream: ReadableStream<Uint8Array>;
      try {
        stream = await streamCompletion(
          [
            { role: 'system', content: systemPromptWithLang },
            { role: 'user', content: structuredPrompt },
          ],
          'generate',
          tools,
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

    /* ── Structured form mode ── */
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

    // Compute tripDays for the form path (exact date range)
    const start = new Date(formData.startDate);
    const end   = new Date(formData.endDate);
    const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const tools = buildGenerateTools(tripDays);

    // buildTravelPrompt produces the base structured user prompt.
    // We patch the Personalised Itinerary section to use tool calls.
    const baseUserPrompt = buildTravelPrompt(formData, weather);
    const userPromptWithTools = baseUserPrompt.replace(
      /## Personalised Itinerary\n[\s\S]*?(?=\n## Where to Stay)/,
      buildStructuredItineraryInstruction(tripDays) + '\n',
    );

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion(
        [
          { role: 'system', content: systemPromptWithLang },
          { role: 'user', content: userPromptWithTools },
        ],
        'generate',
        tools,
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
