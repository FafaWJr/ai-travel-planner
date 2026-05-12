import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { streamCompletion } from '@/lib/ai-stream';
import { getLanguageInstruction, sanitizePromptInput } from '@/lib/ai';
import type { SystemContentBlock } from '@/lib/ai-stream';

export const maxDuration = 60;

// ─── Narrative system prompt (static, cached) ─────────────────────────────────

const NARRATIVE_STATIC_PROMPT = `You are a gifted travel writer working for Luna Let's Go. Your job is to turn a traveller's trip notes and itinerary into a warm, personal, first-person narrative that reads like a story told to a close friend over coffee.

VOICE AND TONE:
- First person ("I", "we"). Write as if the traveller is telling their own story.
- Warm, nostalgic, specific. Never generic. Never clinical.
- Short, rhythmic sentences mixed with longer flowing ones. Vary your cadence.
- Sensory details: sounds, smells, textures, light, temperature. Not just what was seen, but what was felt.
- Emotional anchors: how moments felt, not just what happened. "The kind of sunset that makes you go quiet" is better than "we watched the sunset."
- Humour and honesty welcome. Real trips have awkward moments, wrong turns, and unexpected discoveries. Include them when the notes suggest it.

STRUCTURE:
- Open with a short, evocative paragraph that captures the essence of the whole trip. Not a summary. A feeling.
- One section per day, flowing naturally from day to day without forced transitions.
- Each day section: 2-4 paragraphs. Lead with the emotional tone of the day (the mood the user selected, if any). Weave in the specific activities from the itinerary and any personal notes the user wrote.
- If the user marked a day as their highlight ("best moment"), give it extra weight and emotional depth. Make the reader feel why this mattered.
- Close with a reflective paragraph that looks back on the whole journey. Not a list of things done. A feeling of what the trip meant.

GROUNDING RULES (STRICT):
- Use the EXACT place names, restaurant names, and activity descriptions from the itinerary. Never invent or substitute.
- If the user wrote a specific detail in their notes (a joke, a person they met, a dish they loved), preserve it verbatim or weave it in naturally. These details are gold.
- Reference the time of day naturally (morning light, afternoon heat, evening breeze) based on the activity's time slot.
- If a mood was selected for a day, let it colour the entire day's narrative. An "exhausted" day reads differently than an "excited" one.
- Do not mention the trip planning app, AI, or technology. Write as if this is a pure human memoir.
- Never use em-dashes. Use commas, periods, or colons instead.
- Never use emoji.

LENGTH:
- For trips 1-3 days: 600-1000 words total.
- For trips 4-7 days: 1000-2000 words total.
- For trips 8-14 days: 1500-2500 words total.
- For trips 15+ days: 2000-3500 words total.
- These are guidelines, not hard limits. Quality and flow matter more than word count.

WHAT NOT TO DO:
- Do not write a bulleted itinerary or list of activities.
- Do not start every paragraph with the same structure.
- Do not use travel cliches: "hidden gem", "off the beaten path", "bucket list", "melting pot", "feast for the senses".
- Do not write generic descriptions that could apply to any trip. Every sentence should be specific to THIS trip.
- Do not mention things the itinerary or notes do not include. If there are no notes for a day, use the itinerary activities as the skeleton and keep the narrative lighter for that day.
- Do not fabricate experiences, people, or conversations the user did not mention.`;

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tripId, locale } = body as { tripId: string; locale?: string };

    if (!tripId) {
      return Response.json({ error: 'tripId is required' }, { status: 400 });
    }

    // Dual-lookup on trip_memories first: linked (trip_id=tripId) or standalone (id=tripId)
    let memory = null as {
      trip_id: string | null;
      memory_data: Record<string, unknown>;
      standalone_destination: string | null;
      standalone_start_date: string | null;
      standalone_end_date: string | null;
    } | null;

    const { data: byTripId } = await supabase
      .from('trip_memories')
      .select('trip_id, memory_data, standalone_destination, standalone_start_date, standalone_end_date')
      .eq('trip_id', tripId)
      .eq('user_id', user.id)
      .single();

    if (byTripId) {
      memory = byTripId as typeof memory;
    } else {
      const { data: byId } = await supabase
        .from('trip_memories')
        .select('trip_id, memory_data, standalone_destination, standalone_start_date, standalone_end_date')
        .eq('id', tripId)
        .eq('user_id', user.id)
        .single();
      memory = byId as typeof memory;
    }

    if (!memory) {
      return Response.json({ error: 'Memory not found. Capture some notes first.' }, { status: 404 });
    }

    // Build trip context: for linked memories fetch saved_trips; for standalone use memory columns
    let tripContext: {
      destination: string | null;
      start_date: string | null;
      end_date: string | null;
      trip_data: Record<string, unknown> | null;
    };

    if (memory.trip_id) {
      const { data: savedTrip, error: tripError } = await supabase
        .from('saved_trips')
        .select('destination, start_date, end_date, trip_data')
        .eq('id', memory.trip_id)
        .single();

      if (tripError || !savedTrip) {
        return Response.json({ error: 'Trip not found' }, { status: 404 });
      }
      tripContext = savedTrip as typeof tripContext;
    } else {
      const memData = memory.memory_data as {
        tripDestination?: string;
        tripStartDate?: string;
        tripEndDate?: string;
      } | null;
      tripContext = {
        destination: memData?.tripDestination ?? memory.standalone_destination,
        start_date: memData?.tripStartDate ?? memory.standalone_start_date,
        end_date: memData?.tripEndDate ?? memory.standalone_end_date,
        trip_data: null,
      };
    }

    const dynamicContext = buildNarrativeDynamicContext(tripContext, memory.memory_data as { days: MemoryDayData[] }, locale ?? 'en');

    const systemBlocks: SystemContentBlock[] = [
      {
        type: 'text',
        text: NARRATIVE_STATIC_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
      {
        type: 'text',
        text: dynamicContext,
      },
    ];

    const stream = await streamCompletion(
      [
        { role: 'system', content: systemBlocks },
        { role: 'user', content: 'Write my trip story based on the itinerary and notes provided.' },
      ],
      'narrative',
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[memories/narrative] error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate narrative' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// ─── Dynamic context builder ──────────────────────────────────────────────────

interface ItineraryDay {
  number?: number;
  title?: string;
  activities?: Array<{ text?: string; slot?: string; status?: string }>;
}

interface MemoryDayData {
  dayNumber: number;
  dayTitle: string;
  notes: string;
  mood: string | null;
  highlight: boolean;
}

function buildNarrativeDynamicContext(
  trip: {
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    trip_data: Record<string, unknown> | null;
  },
  memoryData: { days: MemoryDayData[] },
  locale: string,
): string {
  const dest = trip.destination ?? 'the destination';
  const startDate = trip.start_date
    ? new Date(trip.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'unknown';
  const endDate = trip.end_date
    ? new Date(trip.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'unknown';

  const tripData = trip.trip_data as { itineraryDays?: ItineraryDay[] } | null;
  const itineraryDays = tripData?.itineraryDays ?? [];

  const dayBlocks = memoryData.days.map(memDay => {
    const itinDay = itineraryDays.find(d => d.number === memDay.dayNumber);

    const activities = (itinDay?.activities ?? [])
      .filter(a => a.status !== 'declined')
      .map(a => {
        const slotLabel = a.slot ? `[${a.slot}]` : '';
        const text = (a.text ?? '').split('\n')[0].slice(0, 200);
        return `  ${slotLabel} ${text}`;
      })
      .join('\n');

    const moodLine = memDay.mood ? `Mood: ${memDay.mood}` : '';
    const highlightLine = memDay.highlight ? 'HIGHLIGHT: This was the best moment of the entire trip.' : '';
    const notesLine = memDay.notes
      ? `Personal notes: "${sanitizePromptInput(memDay.notes, 2000)}"`
      : 'No personal notes for this day.';

    return `--- Day ${memDay.dayNumber}: ${memDay.dayTitle} ---
${moodLine}
${highlightLine}
${notesLine}
Activities from itinerary:
${activities || '  (no structured activities)'}`;
  }).join('\n\n');

  const langInstruction = getLanguageInstruction(locale);
  const langSection = langInstruction ? `\n\n---\n\n${langInstruction}` : '';

  return `TRIP DETAILS:
- Destination: ${dest}
- Dates: ${startDate} to ${endDate}
- Total days: ${memoryData.days.length}

DAY-BY-DAY CONTEXT:

${dayBlocks}${langSection}`;
}
