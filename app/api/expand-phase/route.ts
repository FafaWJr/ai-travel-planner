import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamCompletion } from '@/lib/ai-stream';
import { AI_CONFIG, getLanguageInstruction, sanitizePromptInput, DEFINE_DAY_TOOL } from '@/lib/ai';

export const maxDuration = 60;

interface ExpandPhaseRequest {
  phase: {
    id: string;
    label: string;
    day_from: number;
    day_to: number;
    summary: string;
    highlights: string[];
  };
  destination: string;
  startDate?: string;
  endDate?: string;
  travellers?: string;
  travelStyles?: string[];
  budgetLevel?: string;
  alreadyPlannedSummary?: string;
  locale?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as ExpandPhaseRequest;

    if (!body.phase?.id || !body.phase?.label || body.phase.day_from == null || body.phase.day_to == null) {
      return Response.json({ error: 'Invalid phase data' }, { status: 400 });
    }

    const phase = body.phase;
    const dayCount = phase.day_to - phase.day_from + 1;
    const dayList = Array.from({ length: dayCount }, (_, i) => phase.day_from + i).join(', ');

    const locale = body.locale || 'en';
    const langInstruction = getLanguageInstruction(locale);

    const systemPrompt = `You are an expert travel planner expanding a single thematic phase into a detailed day-by-day plan.

Your only job is to call the define_day tool once per day in the phase. Do not write any narrative text.

CRITICAL RULES:
- Call define_day exactly ${dayCount} times, one for each of these day numbers: ${dayList}
- Each define_day must include: day (number), title (short evocative day theme), phase_id="${phase.id}", and full activities for morning/afternoon/evening/night (1-3 activities per slot, all realistic and locally accurate)
- Match the phase's vibe and pace described in the phase summary and highlights
- Do not call define_phase
- Do not write any text before or between tool calls
${langInstruction ? `\n${langInstruction}` : ''}`;

    const userPrompt = `Expand this phase into ${dayCount} fully-planned days.

## Phase
- ID: ${phase.id}
- Label: ${phase.label}
- Days: ${phase.day_from} to ${phase.day_to} (${dayCount} days)
- Summary: ${sanitizePromptInput(phase.summary, 1000)}
- Highlights: ${phase.highlights.map(h => `"${sanitizePromptInput(h, 200)}"`).join(', ')}

## Trip Context
- Destination: ${sanitizePromptInput(body.destination, 200)}
${body.travellers ? `- Travellers: ${sanitizePromptInput(body.travellers, 200)}` : ''}
${body.travelStyles?.length ? `- Travel Styles: ${body.travelStyles.join(', ')}` : ''}
${body.budgetLevel ? `- Budget Level: ${body.budgetLevel}` : ''}
${body.startDate && body.endDate ? `- Trip Dates: ${body.startDate} to ${body.endDate}` : ''}

${body.alreadyPlannedSummary ? `## What's Already Planned in Earlier Phases\n${sanitizePromptInput(body.alreadyPlannedSummary, 2000)}\n\nMake sure your suggestions for this phase don't duplicate activities already planned earlier.\n` : ''}
Now emit ${dayCount} define_day tool calls covering Day ${phase.day_from} through Day ${phase.day_to}. Match the phase vibe. Do not write any narrative text.`;

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        'expandPhase',
        [DEFINE_DAY_TOOL],
      );
    } catch (err: unknown) {
      console.error('[expand-phase] stream error:', err);
      return new Response(
        JSON.stringify({ error: 'Could not expand phase. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Phase-Id': phase.id,
      },
    });
  } catch (error) {
    console.error('[expand-phase] error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
