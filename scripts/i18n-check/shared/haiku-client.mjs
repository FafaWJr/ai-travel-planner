// scripts/i18n-check/shared/haiku-client.mjs
//
// Thin wrapper around the Anthropic SDK for Haiku 4.5 calls.
// Used by Layer 2 semantic QA and future luna-multilang-translator.
//
// Requires: ANTHROPIC_API_KEY in process.env.
// The Luna codebase already uses this var for production API calls,
// so local .env.local should mirror it.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5-20251001';

let client = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local or export it in your shell before running i18n QA.'
    );
  }
  client = new Anthropic({ apiKey });
  return client;
}

/**
 * Send a single message to Haiku and return the text response.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {object} [options]
 * @param {number} [options.maxTokens=1024]
 * @param {number} [options.temperature=0]
 * @returns {Promise<string>}
 */
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

  // Extract text from the first content block
  const block = response.content.find((b) => b.type === 'text');
  if (!block) throw new Error('Haiku returned no text block');
  return block.text;
}

/**
 * Parse a JSON object from Haiku's response, tolerant to code fences.
 *
 * @param {string} text
 * @returns {object}
 */
export function parseHaikuJson(text) {
  // Strip ```json ... ``` fences if present
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
