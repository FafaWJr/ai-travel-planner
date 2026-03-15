// /lib/ai-stream.ts
// Unified streaming helper. Tries OpenRouter first, falls back to Anthropic.
// Always emits OpenAI-compatible SSE format: data: {"choices":[{"delta":{"content":"..."}}]}

type Message = { role: 'system' | 'user' | 'assistant'; content: string };

/** Returns a ReadableStream of OpenAI-format SSE chunks */
export async function streamCompletion(
  messages: Message[],
  maxTokens = 4000
): Promise<ReadableStream<Uint8Array>> {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      return await streamOpenRouter(messages, maxTokens);
    } catch (e) {
      console.warn('OpenRouter failed, trying Anthropic:', e);
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return streamAnthropic(messages, maxTokens);
  }
  throw new Error('No AI API key configured (set OPENROUTER_API_KEY or ANTHROPIC_API_KEY)');
}

// ─── OpenRouter (forwards raw SSE — already OpenAI-compatible) ────────────────
async function streamOpenRouter(messages: Message[], maxTokens: number): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
      'X-Title': 'AI Travel Planner',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
      messages,
      stream: true,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  return res.body!;
}

// ─── Anthropic streaming → converted to OpenAI SSE format ────────────────────
async function streamAnthropic(messages: Message[], maxTokens: number): Promise<ReadableStream<Uint8Array>> {
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
      model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      stream: true,
      system,
      messages: conversation,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err}`);
  }

  const encoder = new TextEncoder();

  // Transform Anthropic SSE → OpenAI SSE
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
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                emit(event.delta.text);
              } else if (event.type === 'message_stop') {
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              }
            } catch { /* skip malformed lines */ }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        console.error('Anthropic stream error:', err);
      } finally {
        controller.close();
      }
    },
  });
}
