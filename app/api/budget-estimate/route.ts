import { NextRequest } from 'next/server';
import { streamCompletion } from '@/lib/ai-stream';
import { createClient } from '@/lib/supabase/server';
import { collectStream as collectText } from '@/lib/stream-utils';

// Stage 2c audit: route does NOT write to saved_trips (verified via
// grep for 'saved_trips'/'insert'/'update' — zero matches). Budget
// estimates are returned to the client which stores them in trip_data
// via /api/trips PATCH. That save path is already role-gated by RLS
// (only owner/editor can UPDATE saved_trips). No additional gate
// needed here. Viewers can request a budget estimate for informational
// purposes; any attempt to persist would be blocked by RLS.

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a travel budget estimator. Analyse the itinerary and return a cost estimate as a single compact JSON object.

ABSOLUTE OUTPUT RULES (must be followed):
1. Your ENTIRE response must be a single JSON object.
2. The very first character of your response must be \`{\`. The very last character must be \`}\`.
3. No prose. No greeting. No explanation. No closing remarks. No markdown code fences. No example fragments. Nothing but the JSON object itself.
4. Do not include comments inside the JSON. Do not use trailing commas.

ESTIMATION RULES:
- ACCEPTED items count toward confirmed totals. PENDING items count only toward pending_total. DECLINED items are already excluded from the input.
- Estimate realistic USD costs per activity. Add a daily "Meals" line if no meals are listed.
- Hotel cost: price_per_night × nights (per room) or × nights × travelers (per person). Use judgement.

OUTPUT SHAPE (omit optional fields you don't need; keep notes short):
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

Skip days that have zero items. Notes should be very short (e.g. "2x$45").

REMEMBER: First character \`{\`. Last character \`}\`. Nothing else.`;

/**
 * Extracts the first complete top-level JSON object from a string by
 * scanning for balanced braces. Handles cases where the model emits
 * extra prose before or after the JSON, or stray `{...}` fragments
 * inside that prose.
 *
 * Returns the substring of the first complete JSON object found, or
 * null if no balanced object exists. Strings (including escaped quotes)
 * are tracked so braces inside string literals don't confuse the scanner.
 */
function extractFirstJsonObject(text: string): string | null {
  let depth = 0;
  let startIdx = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      if (depth === 0) startIdx = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        return text.slice(startIdx, i + 1);
      }
      if (depth < 0) {
        depth = 0;
        startIdx = -1;
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  let raw = '';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { destination, startDate, endDate, nights, travelers, hotel, days, budgetLevel } = await request.json();

    const hotelNote = hotel
      ? `Hotel: ${hotel.name} (${hotel.neighborhood}), ${hotel.priceRange} - confirmed`
      : 'No hotel confirmed yet.';

    // Strip declined activities before sending - they're excluded from the budget anyway
    const daysText = (days as Array<{ number: number; title: string; activities: Array<{ status: string; slot: string; text: string }> }>)
      .map((d) => {
        const acts = d.activities
          .filter((a) => a.status !== 'declined')
          .map((a) => `  [${a.status.toUpperCase()}] ${a.slot}: ${a.text}`)
          .join('\n');
        return acts ? `Day ${d.number}: ${d.title}\n${acts}` : null;
      })
      .filter(Boolean)
      .join('\n\n');

    const userMessage = `Trip details:
Destination: ${destination}
Dates: ${startDate} to ${endDate} (${nights} nights)
Travelers: ${travelers}
Budget level: ${budgetLevel}
${hotelNote}

Itinerary:
${daysText}

Estimate the full budget in USD. Return only the JSON object, starting with { and ending with }.`;

    const stream = await streamCompletion(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage },
      ],
      'budgetEstimate'
    );
    raw = await collectText(stream);

    // Strip any markdown fences the model might still emit despite the prompt.
    const stripped = raw.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();

    // Use balanced-brace extraction instead of greedy regex.
    // Greedy `\{[\s\S]*\}` would grab from first `{` to last `}` and break
    // on any prose containing curly braces. Balanced extraction finds the
    // first complete JSON object regardless of surrounding text.
    const jsonString = extractFirstJsonObject(stripped);
    if (!jsonString) {
      console.error('[budget-estimate] no JSON object found. Raw response (first 500 chars):', raw.slice(0, 500));
      throw new Error('No JSON in AI response');
    }

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('[budget-estimate] JSON parse failed. Extracted string (first 500 chars):', jsonString.slice(0, 500));
      console.error('[budget-estimate] Raw response (first 500 chars):', raw.slice(0, 500));
      throw parseErr;
    }

    return Response.json(data);
  } catch (err: unknown) {
    console.error('[budget-estimate] error:', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
