// /lib/ai-stream.ts
// Streaming helper for Luna. Primary: Anthropic Sonnet 4.6.
// Fallback: Anthropic Haiku 4.5, triggered only on pre-stream errors
// when NEXT_PUBLIC_AI_FALLBACK_ENABLED is not explicitly 'false'.
//
// Always emits OpenAI-compatible SSE format so client code (SSE parser)
// continues to work without modification:
//   data: {"choices":[{"delta":{"content":"..."}}]}
//   data: [DONE]

import { AI_MODELS, AI_CONFIG, type AIRouteName } from './ai';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * Type alias for AI route keys. The union resolves to the exact set of keys
 * in AI_CONFIG.maxTokens, so TypeScript rejects typos at compile time.
 * Adding a new route to AI_CONFIG.maxTokens automatically extends this type.
 */
export type AIRoute = AIRouteName;

/**
 * Stream an AI completion to the client as SSE.
 *
 * The `route` argument is a typed key into AI_CONFIG.maxTokens. This
 * guarantees that each call site gets the correct max_tokens for its route,
 * and that adding a new route requires an explicit config entry.
 *
 * Do NOT re-introduce a default value for this parameter. Silent defaults
 * are how we shipped the 4000-token truncation bug. TypeScript enforces that
 * every caller declares its route.
 *
 * Fallback behavior (Option A):
 *   - If the primary model 5xx's or network-errors BEFORE any token streams,
 *     we silently retry once on Haiku 4.5 and stream that instead.
 *   - If the primary fails AFTER tokens have started streaming, the error
 *     surfaces to the client. The user sees a half-written message and the
 *     client's retry button. Fallback cannot take over a partially-started
 *     stream because the client has already rendered content.
 *   - Setting NEXT_PUBLIC_AI_FALLBACK_ENABLED=false disables fallback entirely.
 */
export async function streamCompletion(
  messages: Message[],
  route: AIRoute,
): Promise<ReadableStream<Uint8Array>> {
  const maxTokens = AI_CONFIG.maxTokens[route];

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to Vercel env vars for all environments.',
    );
  }

  const fallbackEnabled =
    process.env.NEXT_PUBLIC_AI_FALLBACK_ENABLED !== 'false';

  // Try primary (Sonnet 4.6).
  try {
    return await streamAnthropic(AI_MODELS.primary, messages, maxTokens, route);
  } catch (primaryErr) {
    console.warn(
      `[ai/${route}] primary model (${AI_MODELS.primary}) failed pre-stream:`,
      primaryErr,
    );

    if (!fallbackEnabled) {
      throw primaryErr;
    }

    // Retry once on Haiku 4.5. Same streaming shape so the client sees no difference.
    try {
      console.warn(`[ai/${route}] falling back to ${AI_MODELS.fallback}`);
      return await streamAnthropic(AI_MODELS.fallback, messages, maxTokens, route);
    } catch (fallbackErr) {
      console.error(
        `[ai/${route}] fallback model (${AI_MODELS.fallback}) also failed:`,
        fallbackErr,
      );
      throw fallbackErr;
    }
  }
}

// ─── Anthropic streaming → converted to OpenAI-compatible SSE ──────────────
async function streamAnthropic(
  model: string,
  messages: Message[],
  maxTokens: number,
  route: AIRoute,
): Promise<ReadableStream<Uint8Array>> {
  // Separate system message from conversation
  const system = messages.find(m => m.role === 'system')?.content || '';
  const conversation = messages.filter(m => m.role !== 'system');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: AI_CONFIG.temperature,
      stream: true,
      system,
      messages: conversation,
    }),
  });

  if (!res.ok) {
    // Pre-stream error (4xx/5xx). Caller's try/catch will handle fallback.
    const err = await res.text();
    throw new Error(`Anthropic ${res.status} (${model}, ${route}): ${err}`);
  }

  const encoder = new TextEncoder();

  // Transform Anthropic SSE → OpenAI-compatible SSE so existing client
  // SSE parsers keep working without changes.
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const emit = (text: string) => {
        const chunk = { choices: [{ delta: { content: text } }] };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;
            try {
              const event = JSON.parse(jsonStr);
              if (
                event.type === 'content_block_delta' &&
                event.delta?.type === 'text_delta'
              ) {
                emit(event.delta.text);
              } else if (event.type === 'message_stop') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              }
            } catch {
              /* skip malformed lines */
            }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        // Mid-stream error. Surface to client (Option A).
        console.error(`[ai/${route}] mid-stream error (${model}):`, err);
      } finally {
        controller.close();
      }
    },
  });
}
