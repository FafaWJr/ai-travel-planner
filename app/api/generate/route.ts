import { NextRequest } from 'next/server';
import { tripFormSchema } from '@/lib/validators';
import { getWeather } from '@/lib/weather';
import { buildTravelPrompt, SYSTEM_PROMPT, getLanguageInstruction, buildGenerateTools, parsePromptContext, buildStage4RulesBlock } from '@/lib/ai';
import { streamCompletion } from '@/lib/ai-stream';
import { createClient } from '@/lib/supabase/server';

// Stage 4: capped at 300s (Vercel Hobby plan max). Structured tool-call generation
// streams incrementally so the client sees output well before timeout.
export const maxDuration = 300;

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
 * Branches by trip length to match the tool array narrowed in buildGenerateTools.
 */
function buildStructuredItineraryInstruction(tripDays: number): string {
  // LONG TRIPS: phase-only. define_day is not in the tool array.
  if (tripDays >= 15) {
    return `## Personalised Itinerary

CRITICAL OUTPUT MODE: PHASE-ONLY. This ${tripDays}-day trip uses phase-based planning.

You MUST call define_phase 3 to 6 times to cover ALL ${tripDays} days. Every day from Day 1 to Day ${tripDays} must belong to exactly one phase. Phase boundaries should be 5 to 10 days each. Choose phases that match the destination's natural geography (e.g. "Coastal Days", "Hinterland Escape", "Southern Beaches") OR temporal flow (e.g. "Settling In", "Big Hits", "Slow Beach Living").

Each define_phase call requires: phase_id, label, day_from, day_to, summary (2-3 sentences), and 3-5 highlights.

You MUST NOT call define_day for ANY day. The define_day tool is not available for this trip. All phases are intentionally left as expandable cards. The user expands each phase later by tapping a "Plan these days" button which calls a separate API.

Example for a 20-day trip with 4 phases:
- 4 define_phase calls covering Days 1-5, Days 6-10, Days 11-15, Days 16-20
- 0 define_day calls
- Total: 4 tool calls only

REMINDER: PHASE-ONLY. Do NOT call define_day. Just emit define_phase calls covering all ${tripDays} days.`;
  }

  // MEDIUM TRIPS: phases first, then all days.
  if (tripDays >= 7) {
    return `## Personalised Itinerary

This ${tripDays}-day trip uses phase grouping for organisation. You MUST call define_phase 2 to 3 times BEFORE any define_day call.

STEP A: Call define_phase 2 to 3 times to cover ALL ${tripDays} days. Every day must belong to exactly one phase. Choose phase boundaries that reflect natural journey structure (e.g. "Arrival & City", "Day Trips", "Coastal Finale"). Each phase needs phase_id, label, day_from, day_to, summary (1-2 sentences), and 2-4 highlights.

STEP B: Call define_day with FULL activity content for ALL ${tripDays} days in order (Day 1 through Day ${tripDays}). Include the phase_id for each day matching the phase it belongs to. Each define_day call must include at least 1 activity per time slot (morning, afternoon, evening, night).

Example for a 10-day trip with 3 phases of Days 1-3, Days 4-7, Days 8-10:
- 3 define_phase calls (one per phase, covering all 10 days)
- 10 define_day calls (all days, each with its phase_id)
- Total: 13 tool calls

REMINDER: phases FIRST, then days. Both are required.`;
  }

  // SHORT TRIPS: day-only.
  return `## Personalised Itinerary

This is a ${tripDays}-day trip. Do NOT call define_phase. Just call define_day ONCE for EACH of the ${tripDays} days in order (Day 1 through Day ${tripDays}). Each call must include at least 1 activity per time slot (morning, afternoon, evening, night). Be specific and practical.`;
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

      // R2: parse audience context from the prompt string and inject rules block
      const parsedCtx = parsePromptContext(rawPrompt);
      const rulesBlock = buildStage4RulesBlock(parsedCtx);

      const structuredPrompt = rawPrompt + (rulesBlock ? `\n${rulesBlock}` : '') + `

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
