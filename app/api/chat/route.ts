import { NextRequest } from 'next/server';
import type { ChatMessage } from '@/types';
import { streamCompletion } from '@/lib/ai-stream';
import { buildLunaChatSystemBlocks, buildLunaChatTools } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { getRequestUserAndRole } from '@/lib/collaboration';
import { getRecentCollaboratorActivity, buildCollaboratorContextBlock } from '@/lib/collab-awareness';

export const maxDuration = 60;

/**
 * Strip Luna's mutation markers from a complete response.
 * Used for viewer role on collaborative trips (Stage 2c): viewers can
 * chat with Luna but mutations are filtered server-side. Editors and
 * owners see the full unfiltered response and their client parses the
 * markers as usual.
 */
function stripMutationMarkers(text: string): string {
  let cleaned = text.replace(/%%TRIP_UPDATE%%[\s\S]*?%%END_TRIP_UPDATE%%/g, '');
  cleaned = cleaned.replace(/\[\[ADD:[^\]]*\]\]/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
  return cleaned;
}

async function readStreamToText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, tripContext, userName, locale, tripId } = body as {
      messages: ChatMessage[];
      tripContext: string;
      userName?: string;
      locale?: string;
      tripId?: string | null;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stage 2c: resolve the requester's role on this trip if a tripId
    // was provided. Viewers get mutation markers stripped from Luna's
    // response server-side. Solo trips (no tripId) and owner/editor
    // requests skip the role lookup entirely.
    let isViewer = false;
    if (tripId) {
      const { role } = await getRequestUserAndRole(supabase, tripId);
      isViewer = role === 'viewer';
    }

    const hasPhaseContext = typeof tripContext === 'string' && tripContext.includes('## Trip Phases');
    console.info('[api/chat] request', {
      contextLength: tripContext?.length ?? 0,
      hasPhaseBlock: hasPhaseContext,
      phaseEditingFlag: process.env.NEXT_PUBLIC_PHASE_EDITING_ENABLED,
      isViewer,
    });

    const systemBlocks = buildLunaChatSystemBlocks(
      tripContext,
      userName,
      locale ?? 'en',
    );

    // Stage 3b: append COLLABORATOR CONTEXT to the dynamic block (block 1).
    // Block 0 is cached (cache_control: ephemeral) and must not be touched.
    // Block 1 is rebuilt every turn; appending here never breaks caching.
    if (tripId && user) {
      const recentActivity = await getRecentCollaboratorActivity(supabase, tripId, user.id);
      if (recentActivity && recentActivity.length > 0) {
        systemBlocks[1].text += buildCollaboratorContextBlock(recentActivity);
      }
    }

    let stream: ReadableStream<Uint8Array>;
    try {
      stream = await streamCompletion(
        [
          { role: 'system', content: systemBlocks },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        'chat',
        // Stage 2c: viewers never get mutation tools. Editors and owners
        // get the full tool set as before.
        isViewer ? [] : buildLunaChatTools(),
      );
    } catch (err: unknown) {
      console.error('[chat] stream error:', err);
      return new Response(
        JSON.stringify({ error: 'Something went wrong. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stage 2c viewer path: buffer the full stream, strip mutation
    // markers, return as plain text. Viewers lose the typing animation
    // but gain a guaranteed mutation-free response. Editor/owner path
    // below streams directly (unchanged).
    if (isViewer) {
      try {
        const raw = await readStreamToText(stream);
        const cleaned = stripMutationMarkers(raw);
        return new Response(cleaned, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'X-Luna-Viewer-Filtered': '1',
          },
        });
      } catch (err) {
        console.error('[chat] viewer stream buffer error:', err);
        return new Response(
          JSON.stringify({ error: 'Something went wrong. Please try again.' }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }
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
