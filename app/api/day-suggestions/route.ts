import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';
import { getLanguageInstruction, sanitizePromptInput } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { collectStream } from '@/lib/stream-utils';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tripPrompt, dayNumber, dayTitle, destination, existingActivities, allDaysContext = '', locale = 'en' } = await request.json();
    const safeDestination = sanitizePromptInput(destination);
    const safeTripPrompt = sanitizePromptInput(tripPrompt);
    const safeAllDaysContext = sanitizePromptInput(allDaysContext, 4000);
    const safeActivities = Array.isArray(existingActivities)
      ? existingActivities.map((a: unknown) => sanitizePromptInput(String(a), 200))
      : [];
    const langInstruction = getLanguageInstruction(locale);

    const systemPrompt = `You are a travel activity suggester. You respond ONLY with a valid JSON array — no prose, no markdown, no explanation before or after. Just the raw JSON array.${langInstruction ? `\n\n${langInstruction}` : ''}`;

    const userPrompt = `Trip context: "${safeTripPrompt}"
Day ${dayNumber}: ${dayTitle} in ${safeDestination}

Existing activities already in this day's plan:
${safeActivities.map((a, i) => `${i + 1}. ${a}`).join('\n')}
${safeAllDaysContext ? `\nACTIVITIES ALREADY PLANNED ON OTHER DAYS — do NOT duplicate these:\n${safeAllDaysContext}\n` : ''}
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
