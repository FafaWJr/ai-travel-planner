import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';
import {
  DEFINE_DAY_TOOL,
  buildStage4RulesBlock,
  regenerationEnabled,
  type TripRulesContext,
} from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

type RegenerateDayRequest = {
  dayNumber: number;
  destination: string;
  tripPrompt?: string;
  currentDayTitle?: string;
  phase?: { id: string; label: string; summary?: string };
  adjacentDaysSummary?: string;
  travellers?: string;
  travelStyles?: string[];
  budgetLevel?: string;
  adultAges?: string[];
  childrenAges?: string[];
  children?: number;
  notes?: string;
  locale?: string;
  userHint?: string;
  mode?: 'replace-all' | 'keep-accepted';
  acceptedActivities?: {
    timeSlot: 'morning' | 'afternoon' | 'evening' | 'night';
    text: string;
  }[];
};

export async function POST(request: NextRequest) {
  try {
    if (!regenerationEnabled()) {
      return Response.json({ error: 'Regeneration is disabled' }, { status: 404 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as RegenerateDayRequest;
    const {
      dayNumber, destination, currentDayTitle,
      phase, adjacentDaysSummary, travellers,
      travelStyles, budgetLevel, adultAges, childrenAges, children, notes,
      userHint, mode, acceptedActivities,
    } = body;

    if (!dayNumber || !destination) {
      console.warn('[regenerate-day] 400 missing fields', {
        dayNumber: dayNumber ?? null,
        destination: destination ?? null,
        destinationType: typeof destination,
        destinationLength: typeof destination === 'string' ? destination.length : null,
        hasTripPrompt: typeof body.tripPrompt === 'string' && body.tripPrompt.length > 0,
        tripPromptPreview: typeof body.tripPrompt === 'string' ? body.tripPrompt.slice(0, 100) : null,
        bodyKeys: Object.keys(body),
      });
      return Response.json(
        { error: 'Missing required fields: dayNumber, destination' },
        { status: 400 },
      );
    }

    const rulesCtx: TripRulesContext = {
      adultAges, childrenAges, children,
      tripStyles: travelStyles, notes, destination,
    };
    const rulesBlock = buildStage4RulesBlock(rulesCtx);

    const pinInstruction = (mode === 'keep-accepted' && acceptedActivities && acceptedActivities.length > 0)
      ? `\n## CRITICAL: Keep these accepted activities in their exact time slots\nThe user has accepted the following activities. They MUST remain in Day ${dayNumber} at the exact slots listed. Design the rest of the day AROUND them.\n\n${acceptedActivities.map(a => `- **${a.timeSlot}:** ${a.text}`).join('\n')}\n\nInclude these EXACTLY in your define_day tool call alongside any new activities.\n`
      : '';

    const systemPrompt = `You are Luna, the AI travel planner behind Luna Let's Go. Regenerate ONE SPECIFIC DAY of an existing trip. Emit the new day via the define_day tool call. No markdown text — only the tool call.

Keep the day's style consistent with the trip's overall vibe. Do not repeat the exact same activities from adjacent days.`;

    const userPrompt = `Regenerate Day ${dayNumber} of this trip.

## Trip context
- Destination: ${destination}
${travellers ? `- Travellers: ${travellers}` : ''}
${(travelStyles ?? []).length ? `- Travel styles: ${travelStyles!.join(', ')}` : ''}
${budgetLevel ? `- Budget: ${budgetLevel}` : ''}
${notes ? `- User notes: ${notes}` : ''}

${phase ? `## Phase context\nThis day belongs to phase: **${phase.label}**${phase.summary ? ` (${phase.summary})` : ''}. The new day should fit the phase's theme.\n` : ''}
${adjacentDaysSummary ? `## Adjacent days (for continuity)\n${adjacentDaysSummary}\n\nAvoid duplicating these activities.\n` : ''}
${currentDayTitle ? `## Current day being replaced\n"${currentDayTitle}" — the user wants a fresh take.\n` : ''}
${userHint ? `## User's specific hint\n"${userHint}"\n\nThis is the most important signal. Honor it.\n` : ''}
${pinInstruction}
${rulesBlock}

## Your task
Emit ONE define_day tool call for Day ${dayNumber}. ${phase?.id ? `Use phase_id="${phase.id}".` : ''} Include activities for morning, afternoon, evening, and (per rules) night when appropriate. ${mode === 'keep-accepted' ? 'Keep pinned activities AND add new ones around them.' : 'Generate a completely fresh take.'}`;

    const stream = await streamCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      'regenerateDay',
      [DEFINE_DAY_TOOL],
      { type: 'tool', name: 'define_day' },
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[regenerate-day] error:', error);
    return Response.json(
      { error: 'Regeneration failed. Please try again.' },
      { status: 500 },
    );
  }
}
