// scripts/i18n-check/shared/haiku-client.mjs
//
// Thin wrapper around the Anthropic SDK for Haiku 4.5 calls.
// Auto-loads .env.local so plain `node` invocations work.

import Anthropic from '@anthropic-ai/sdk';
import { loadEnvLocal } from './env-loader.mjs';

const MODEL = 'claude-haiku-4-5-20251001';

let client = null;

function getClient() {
  if (client) return client;
  loadEnvLocal();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local at the project root, or export it in your shell before running this script.'
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

export async function askHaiku(systemPrompt, userMessage, options = {}) {
  const { maxTokens = 1024, temperature = 0 } = options;
  const c = getClient();

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content.find((b) => b.type === 'text');
  if (!block) throw new Error('Haiku returned no text block');
  return block.text;
}

export function parseHaikuJson(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Haiku response is not valid JSON.\nResponse: ${text.slice(0, 500)}\n\nParse error: ${err.message}`
    );
  }
}

export { MODEL };
