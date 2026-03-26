import { NextRequest } from 'next/server';
import type { ChatMessage } from '@/types';
import { streamCompletion } from '@/lib/ai-stream';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, tripContext } = body as { messages: ChatMessage[]; tripContext: string };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemMessage = `You are Luna, a warm and knowledgeable AI travel assistant. The user has generated the following trip plan:

---
${tripContext}
---

Your role is to help the user refine and improve this specific trip. Answer questions about the destination, suggest alternatives, recommend restaurants, activities, hidden gems, or practical tips — all tailored to what's already in their plan.

If the trip context includes a "Confirmed Accommodation" section, the user has already chosen their hotel. Factor this into every suggestion: recommend activities near that hotel, mention walking distances or convenient transport from it, and avoid suggesting stays elsewhere.

IMPORTANT FORMATTING RULES:
- Write in clear, conversational paragraphs. Each paragraph should be 2–4 sentences. Never write a wall of text on one line.
- Use a blank line between paragraphs.
- When you suggest a specific activity, place, restaurant, or experience that the user could add to their itinerary, always append an add-marker immediately after the suggestion in this exact format:
  [[ADD: Descriptive activity title | day: N | slot: morning|afternoon|evening|night]]
  Where N is the day number in the plan and slot reflects the best time of day for it.
- Only include an [[ADD:]] marker when you are suggesting something concrete and addable (not for general advice or answers to factual questions).
- You may include multiple [[ADD:]] markers in one response if you suggest multiple things.
- Keep your tone friendly, enthusiastic, and specific to this trip.`;



    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion([
        { role: 'system', content: systemMessage },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ], 2500);
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err.message }),
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
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
