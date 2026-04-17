import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';
import { createClient } from '@/lib/supabase/server';
import { collectStream as collectText } from '@/lib/stream-utils';

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a travel budget estimator. Analyse the itinerary and return a cost estimate as compact JSON.

RULES:
1. ACCEPTED items → include in confirmed totals. PENDING items → include in pending section only. DECLINED items are already excluded from input.
2. Estimate realistic USD costs per activity. Add a daily "Meals" line if no meals are listed.
3. Hotel cost: price_per_night × nights (per room) or × nights × travelers (per person) — use judgment.
4. Return ONLY a valid JSON object. No markdown fences, no explanation, no extra text.

OUTPUT FORMAT (compact — omit optional fields you don't need):
{
  "currency": "USD",
  "summary": { "accommodation": 0, "activities": 0, "meals": 0, "transport": 0, "other": 0, "confirmed_total": 0, "pending_total": 0 },
  "by_day": [
    {
      "day": 1,
      "title": "Day title",
      "confirmed_total": 0,
      "items": [
        { "label": "Name", "category": "accommodation|activity|meal|transport|other", "status": "accepted|pending", "subtotal": 0, "note": "brief calc" }
      ]
    }
  ],
  "no_hotel_warning": false
}

Keep notes short (e.g. "2×$45"). Skip days that have zero items.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { destination, startDate, endDate, nights, travelers, hotel, days, budgetLevel } = await request.json();

    const hotelNote = hotel
      ? `Hotel: ${hotel.name} (${hotel.neighborhood}), ${hotel.priceRange} — confirmed`
      : 'No hotel confirmed yet.';

    // Strip declined activities before sending — they're excluded from the budget anyway
    const daysText = (days as any[]).map((d: any) => {
      const acts = (d.activities as any[])
        .filter((a: any) => a.status !== 'declined')
        .map((a: any) => `  [${a.status.toUpperCase()}] ${a.slot}: ${a.text}`)
        .join('\n');
      return acts ? `Day ${d.number}: ${d.title}\n${acts}` : null;
    }).filter(Boolean).join('\n\n');

    const userMessage = `Trip details:
Destination: ${destination}
Dates: ${startDate} to ${endDate} (${nights} nights)
Travelers: ${travelers}
Budget level: ${budgetLevel}
${hotelNote}

Itinerary:
${daysText}

Estimate the full budget. Use USD. Return only the JSON object.`;

    const stream = await streamCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      'budgetEstimate'
    );

    const raw = await collectText(stream);
    // Strip markdown code fences if present, then extract the outermost JSON object
    const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');
    const data = JSON.parse(jsonMatch[0]);

    return Response.json(data);
  } catch (err: unknown) {
    console.error('[budget-estimate] error:', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
