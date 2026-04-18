import { NextRequest } from 'next/server';
import type { ChatMessage } from '@/types';
import { streamCompletion } from '@/lib/ai-stream';
import { buildLunaChatSystemBlocks, LUNA_CHAT_TOOLS } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, tripContext, userName, locale } = body as {
      messages: ChatMessage[];
      tripContext: string;
      userName?: string;
      locale?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemBlocks = buildLunaChatSystemBlocks(
      tripContext,
      userName,
      locale ?? 'en',
    );

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion(
        [
          { role: 'system', content: systemBlocks },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        'chat',
        LUNA_CHAT_TOOLS,
      );
    } catch (err: unknown) {
      console.error('[chat] stream error:', err);
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
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
