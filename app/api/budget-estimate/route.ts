import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';

export const maxDuration = 45;

async function collectText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '', buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const delta = JSON.parse(json)?.choices?.[0]?.delta?.content;
        if (delta) result += delta;
      } catch { /* skip */ }
    }
  }
  return result;
}

const SYSTEM_PROMPT = `You are an intelligent travel budget estimator integrated into an AI travel planner.
Your job is to analyze the user's itinerary and generate a detailed, itemized cost estimate.

RULES:
1. Only count ACCEPTED items. DECLINED items must be completely excluded from all calculations.
   PENDING items go into a separate section and are NOT added to the confirmed total.
2. Estimate realistic costs for each activity based on destination, type, and traveler count.
   For local transport (metro, taxi, etc.) estimate daily totals per person.
   For meals not explicitly listed, add a reasonable "meals" line per day based on budget level.
3. Multiply per-person costs by the traveler count. Show the calculation clearly.
4. Hotel: multiply price_per_night × nights × travelers (if per-person) or just × nights (if per-room — use your judgment based on property type).
5. If a cost is truly unknown, mark as TBD and exclude from totals.
6. Return ONLY a valid JSON object (no markdown, no explanation).

OUTPUT FORMAT — return exactly this structure:
{
  "currency": "USD",
  "summary": {
    "accommodation": 0,
    "activities": 0,
    "meals": 0,
    "transport": 0,
    "other": 0,
    "confirmed_total": 0,
    "pending_total": 0
  },
  "by_day": [
    {
      "day": 1,
      "title": "Day title",
      "confirmed_total": 0,
      "items": [
        {
          "label": "Item name",
          "category": "accommodation|activity|meal|transport|other",
          "status": "accepted|pending",
          "unit_cost": 0,
          "travelers": 2,
          "subtotal": 0,
          "note": "2 people × $X"
        }
      ]
    }
  ],
  "no_hotel_warning": false
}

Use USD as the base currency for all estimates (the UI will handle conversions).
Be realistic: research-accurate costs, not inflated guesses.`;

export async function POST(request: NextRequest) {
  try {
    const { destination, startDate, endDate, nights, travelers, hotel, days, budgetLevel } = await request.json();

    const hotelNote = hotel
      ? `Hotel: ${hotel.name} (${hotel.neighborhood}), ${hotel.priceRange} — confirmed`
      : 'No hotel confirmed yet.';

    const daysText = (days as any[]).map((d: any) => {
      const acts = (d.activities as any[]).map((a: any) =>
        `    [${a.status.toUpperCase()}] ${a.slot}: ${a.text}`
      ).join('\n');
      return `Day ${d.number}: ${d.title}\n${acts || '    (no activities)'}`;
    }).join('\n\n');

    const userMessage = `Trip details:
Destination: ${destination}
Dates: ${startDate} to ${endDate} (${nights} nights)
Travelers: ${travelers}
Budget level: ${budgetLevel}
${hotelNote}

Itinerary:
${daysText}

Estimate the full budget. Use USD. Return only the JSON object.`;

    const stream = await streamCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userMessage },
    ], 4096);

    const raw = await collectText(stream);
    // Strip markdown code fences if present, then extract the outermost JSON object
    const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '');
    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');
    const data = JSON.parse(jsonMatch[0]);

    return Response.json(data);
  } catch (err: any) {
    console.error('budget-estimate error:', err);
    return Response.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}
