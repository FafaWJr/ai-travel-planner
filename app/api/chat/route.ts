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

    const systemMessage = `You are a helpful travel assistant. The user has the following trip plan:

${tripContext}

Answer questions about this trip, provide additional recommendations, help refine the itinerary, suggest alternatives, and give practical advice. Be conversational, friendly, and specific. Use markdown formatting in your responses.`;

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion([
        { role: 'system', content: systemMessage },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ], 1500);
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
