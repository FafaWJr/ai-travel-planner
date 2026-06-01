import { NextRequest } from 'next/server';
import { tripFormSchema } from '@/lib/validators';
import { getWeather } from '@/lib/weather';
import {
  SYSTEM_PROMPT,
  getLanguageInstruction,
  buildGenerateTools,
  parsePromptContext,
  buildStage4RulesBlock,
  derivePace,
  buildGenerateSystemBlocks,
  buildGenerateContextPreamble,
} from '@/lib/ai';
import type { SystemContentBlock } from '@/lib/ai-stream';
import { streamGenerateTwoPhase } from '@/lib/ai-stream';
import { summariseItineraryForNarrative } from '@/lib/normalizeToolInput';
import { createClient } from '@/lib/supabase/server';

// Stage 4: capped at 300s (Vercel Hobby plan max). Two-phase generation streams
// the itinerary first, then the narrative, both well before timeout.
export const maxDuration = 300;

/**
 * Extract approximate trip day count from a natural-language prompt string.
 * Returns null if the count can't be reliably detected.
 */
function extractTripDaysFromPrompt(prompt: string): number | null {
  const fromTo = prompt.match(/from\s+(\d{4}-\d{2}-\d{2}).*?to\s+(\d{4}-\d{2}-\d{2})/i);
  if (fromTo) {
    const days = Math.ceil(
      (new Date(fromTo[2]).getTime() - new Date(fromTo[1]).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    if (!isNaN(days) && days > 0) return days;
  }
  const dayWord = prompt.match(/(\d+)\s*-?\s*days?/i);
  if (dayWord) return parseInt(dayWord[1], 10);
  const weekWord = prompt.match(/(\d+)\s*-?\s*weeks?/i);
  if (weekWord) return parseInt(weekWord[1], 10) * 7;
  return null;
}

/**
 * Itinerary instruction for the tool-only phase. Branches by trip length to
 * match the tool array narrowed in buildGenerateTools.
 */
function buildStructuredItineraryInstruction(tripDays: number): string {
  // LONG TRIPS: phase-only. define_day is not in the tool array.
  if (tripDays >= 15) {
    return `CRITICAL OUTPUT MODE: PHASE-ONLY. This ${tripDays}-day trip uses phase-based planning.

You MUST call define_phase 3 to 6 times to cover ALL ${tripDays} days. Every day from Day 1 to Day ${tripDays} must belong to exactly one phase. Phase boundaries should be 5 to 10 days each. Choose phases that match the destination's natural geography (e.g. "Coastal Days", "Hinterland Escape", "Southern Beaches") OR temporal flow (e.g. "Settling In", "Big Hits", "Slow Beach Living").

Each define_phase call requires: phase_id, label, day_from, day_to, summary (2-3 sentences), and 3-5 highlights.

You MUST NOT call define_day for ANY day. The define_day tool is not available for this trip. All phases are intentionally left as expandable cards. The user expands each phase later by tapping a "Plan these days" button which calls a separate API.

Example for a 20-day trip with 4 phases:
- 4 define_phase calls covering Days 1-5, Days 6-10, Days 11-15, Days 16-20
- 0 define_day calls
- Total: 4 tool calls only.`;
  }

  // MEDIUM TRIPS: phases first, then all days.
  if (tripDays >= 7) {
    return `This ${tripDays}-day trip uses phase grouping for organisation. You MUST call define_phase 2 to 3 times BEFORE any define_day call.

STEP A: Call define_phase 2 to 3 times to cover ALL ${tripDays} days. Every day must belong to exactly one phase. Choose phase boundaries that reflect natural journey structure (e.g. "Arrival & City", "Day Trips", "Coastal Finale"). Each phase needs phase_id, label, day_from, day_to, summary (1-2 sentences), and 2-4 highlights.

STEP B: Call define_day with FULL activity content for ALL ${tripDays} days in order (Day 1 through Day ${tripDays}). Include the phase_id for each day matching the phase it belongs to. Each define_day call must include at least 1 activity per time slot (morning, afternoon, evening, night).

Example for a 10-day trip with 3 phases of Days 1-3, Days 4-7, Days 8-10:
- 3 define_phase calls (one per phase, covering all 10 days)
- 10 define_day calls (all days, each with its phase_id)
- Total: 13 tool calls.`;
  }

  // SHORT TRIPS: day-only.
  return `This is a ${tripDays}-day trip. Do NOT call define_phase. Just call define_day ONCE for EACH of the ${tripDays} days in order (Day 1 through Day ${tripDays}). Each call must include at least 1 activity per time slot (morning, afternoon, evening, night). Be specific and practical.`;
}

/** Directive appended to the itinerary phase prompt: tools only, no prose. */
function itineraryOnlyDirective(tripDays: number): string {
  const toolNames = tripDays >= 15
    ? 'define_phase'
    : tripDays >= 7
      ? 'define_phase and define_day'
      : 'define_day';
  return `OUTPUT MODE: ITINERARY ONLY. In this turn, output ONLY the structured itinerary via ${toolNames} tool calls. Do NOT write any markdown, prose, or narrative sections. The narrative is produced in a separate step.`;
}

/** Builds the grounded narrative-only prompt for the simple-prompt branch. */
function buildSimpleNarrativePrompt(rawPrompt: string, rulesBlock: string, summary: string): string {
  return `${rawPrompt}${rulesBlock ? `\n${rulesBlock}` : ''}

The day-by-day itinerary for this trip has ALREADY been generated. Here it is, for grounding. Keep every recommendation consistent with it:

ITINERARY ALREADY CREATED:
${summary || '(no structured days were produced; write destination-level guidance.)'}

Now write EXACTLY these six sections as Markdown H2 headers (no emojis in the headers), in this order, each complete with bullet points and bold text:

## Destination Overview
## Travel Season & Weather
## Where to Stay
## Getting Around
## Budget Estimator
## Practical Tips

Ground "Where to Stay" and "Getting Around" in the neighbourhoods, areas, and movements implied by the itinerary above. Do NOT include a "Personalised Itinerary" or any day-by-day section; that already exists. Output prose only, no tool calls.`;
}

/** Builds the grounded narrative-only prompt for the form branch. */
function buildFormNarrativePrompt(preamble: string, summary: string): string {
  return `${preamble}

---

The day-by-day itinerary for this trip has ALREADY been generated. Here it is, for grounding. Keep every recommendation consistent with it:

ITINERARY ALREADY CREATED:
${summary || '(no structured days were produced; write destination-level guidance.)'}

Now write EXACTLY these six sections as Markdown H2 headers (no emojis in the headers), in this order, each complete with bullet points and bold text:

## Destination Overview
## Travel Season & Weather
## Where to Stay
## Getting Around
## Budget Estimator
## Practical Tips

Ground "Where to Stay" and "Getting Around" in the neighbourhoods, areas, and movements implied by the itinerary above. The Getting Around and Practical Tips sections are required and must not be skipped. Do NOT include a "Personalised Itinerary" or any day-by-day section; that already exists. Output prose only, no tool calls.`;
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

    /* ── Simple prompt mode (used by the homepage search bar) ── */
    if (typeof body.prompt === 'string' && body.prompt.trim()) {
      const rawPrompt = body.prompt.trim();
      const tripDays = extractTripDaysFromPrompt(rawPrompt) ?? 7;
      const tools = buildGenerateTools(tripDays);

      // R2: parse audience context from the prompt string and inject rules block
      const parsedCtx = parsePromptContext(rawPrompt);
      const rulesBlock = buildStage4RulesBlock(parsedCtx);

      const simplePace = derivePace(parsedCtx.tripStyles, parsedCtx.notes);
      console.log(`[Luna Generate] pace=${simplePace} destination=${parsedCtx.destination || 'unknown'} days=${tripDays} (simple-prompt mode, two-phase)`);

      const langInstruction = getLanguageInstruction(locale);
      const dynamicContext = `TRIP DETAILS FOR THIS REQUEST:
- Destination: ${parsedCtx.destination || 'unspecified'}
- Duration: approximately ${tripDays} days
- Adults: ${parsedCtx.adultAges.length > 0 ? `${parsedCtx.adultAges.length} (ages: ${parsedCtx.adultAges.join(', ')})` : 'unspecified'}
- Children: ${parsedCtx.childrenAges.length > 0 ? `${parsedCtx.childrenAges.length} (ages: ${parsedCtx.childrenAges.join(', ')})` : '0'}
- Trip styles: ${parsedCtx.tripStyles.join(', ') || 'unspecified'}
- Locale: ${locale}

Based on this profile, your internal pace classification is: ${simplePace}${langInstruction ? `\n\n---\n\n${langInstruction}` : ''}`;

      const simpleSystemBlocks: SystemContentBlock[] = [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: dynamicContext },
      ];

      const itineraryUserPrompt = `${rawPrompt}${rulesBlock ? `\n${rulesBlock}` : ''}

${buildStructuredItineraryInstruction(tripDays)}

${itineraryOnlyDirective(tripDays)}`;

      let stream: ReadableStream<Uint8Array>;
      try {
        stream = await streamGenerateTwoPhase({
          system: simpleSystemBlocks,
          tools,
          itineraryUserPrompt,
          buildNarrativeUserPrompt: (summary) => buildSimpleNarrativePrompt(rawPrompt, rulesBlock, summary),
          collectSummary: summariseItineraryForNarrative,
        });
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

    const start = new Date(formData.startDate);
    const end   = new Date(formData.endDate);
    const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const tools = buildGenerateTools(tripDays);

    const pace = derivePace(formData.tripStyles as string[], formData.notes);
    console.log(`[Luna Generate] pace=${pace} destination=${formData.destination} days=${tripDays} budget=${formData.budgetLevel} (two-phase)`);

    const systemBlocks = buildGenerateSystemBlocks(formData, locale);
    const preamble = buildGenerateContextPreamble(formData, weather);

    const itineraryUserPrompt = `${preamble}

---

${buildStructuredItineraryInstruction(tripDays)}

${itineraryOnlyDirective(tripDays)}`;

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamGenerateTwoPhase({
        system: systemBlocks,
        tools,
        itineraryUserPrompt,
        buildNarrativeUserPrompt: (summary) => buildFormNarrativePrompt(preamble, summary),
        collectSummary: summariseItineraryForNarrative,
      });
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
