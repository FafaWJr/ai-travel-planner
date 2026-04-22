// scripts/i18n-translate/translate.mjs
//
// Translation drafting for Luna Let's Go.
// Uses Haiku via the shared client. Applies the accent rules and
// protected nouns from the shared module. Produces a draft set of
// translations for the caller to write or reject.
//
// This module does NOT write files. It only returns drafts.
// The orchestrator (run-translate.mjs) handles writes + QA integration.

import { askHaiku, parseHaikuJson } from '../i18n-check/shared/haiku-client.mjs';
import { PROTECTED_NOUNS } from '../i18n-check/shared/accent-rules.mjs';

const SYSTEM_PROMPT_PT_BR = `You are a Brazilian Portuguese translator for Luna Let's Go, a consumer-facing AI travel planning platform with a warm, conversational brand voice.

Translate the given English keys into Brazilian Portuguese following these rules:

1. BRAND VOICE: Luna speaks directly, warmly, and conversationally. Never corporate, never stiff. Use "você" (never "tu").
2. ACCENTS: Always use proper accents. Common traps:
   - "é" (is/are), not bare "e" when the meaning is the verb "to be"
   - "você", "não", "à" before feminine nouns, "só", "já"
   - "família", "crianças", "início", "único", "próxima"
   - "Japão", "Tóquio", "Índia", "manhã"
3. PROTECTED NOUNS: Never translate these, keep them verbatim: ${PROTECTED_NOUNS.join(', ')}.
4. LENGTH: Stay close to the English length. PT-BR naturally runs ~10-20% longer; going more than 80% longer or 40% shorter is wrong.
5. REGISTER: Match the emotional energy of the English. Enthusiasm stays enthusiasm. Calm stays calm.
6. NO EM-DASH: Never use em-dash (—). Use period, comma, or colon instead.
7. NO EMOJI: Never introduce emoji in translations.

You respond ONLY with valid JSON: an object whose keys are the dot-path identifiers you were given, and whose values are the translated strings.

Example:
Input keys: { "hero.title": "Your trip. Your rules.", "cta.button": "Let's go" }
Output: { "hero.title": "Sua viagem. Suas regras.", "cta.button": "Vamos lá" }

No preamble. No code fences. Just the JSON object.`;

const SYSTEM_PROMPT_ES = `You are a Latin American Spanish translator for Luna Let's Go, a consumer-facing AI travel planning platform with a warm, conversational brand voice.

Translate the given English keys into Latin American Spanish following these rules:

1. BRAND VOICE: Luna speaks directly, warmly, and conversationally. Never corporate, never stiff. Use "tú" (Latin American Spanish), not "vos" or "usted".
2. ACCENTS: Always use proper accents. Common words needing accents: más, también, está, aquí, día, así, después, próximo, útil.
3. PROTECTED NOUNS: Never translate these, keep them verbatim: ${PROTECTED_NOUNS.join(', ')}.
4. LENGTH: Stay close to the English length. ES generally runs similar length to EN. Going more than 80% longer or 40% shorter is wrong.
5. REGISTER: Match the emotional energy of the English. Enthusiasm stays enthusiasm. Calm stays calm.
6. NO EM-DASH: Never use em-dash (—). Use period, comma, or colon instead.
7. NO EMOJI: Never introduce emoji in translations.

You respond ONLY with valid JSON: an object whose keys are the dot-path identifiers you were given, and whose values are the translated strings.

Example:
Input keys: { "hero.title": "Your trip. Your rules.", "cta.button": "Let's go" }
Output: { "hero.title": "Tu viaje. Tus reglas.", "cta.button": "Vamos" }

No preamble. No code fences. Just the JSON object.`;

/**
 * Draft translations for a set of keys.
 *
 * @param {object} params
 * @param {string} params.locale - 'pt-BR' or 'es'
 * @param {Record<string, string>} params.keysWithEnglish - Map of dot-path to English source string
 * @returns {Promise<{ translations: Record<string, string>, costEstimateUSD: number }>}
 */
export async function draftTranslations(params) {
  const { locale, keysWithEnglish } = params;
  const keyCount = Object.keys(keysWithEnglish).length;
  if (keyCount === 0) {
    return { translations: {}, costEstimateUSD: 0 };
  }

  const systemPrompt = locale === 'pt-BR' ? SYSTEM_PROMPT_PT_BR : SYSTEM_PROMPT_ES;
  const userMessage = `Translate the following English strings into ${locale === 'pt-BR' ? 'Brazilian Portuguese' : 'Latin American Spanish'}:\n\n${JSON.stringify(keysWithEnglish, null, 2)}`;

  const response = await askHaiku(systemPrompt, userMessage, {
    maxTokens: Math.min(4096, keyCount * 200),
    temperature: 0.3, // Low but non-zero so translations don't feel robotic
  });

  const translations = parseHaikuJson(response);

  // Verify shape: every input key should appear in output
  const missingKeys = Object.keys(keysWithEnglish).filter((k) => !(k in translations));
  if (missingKeys.length > 0) {
    throw new Error(
      `Haiku response is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? '...' : ''}`
    );
  }

  // Rough cost estimate: input ~prompt+keys bytes, output ~translated bytes
  const costEstimateUSD = (keyCount * 200 * 0.000001) + (keyCount * 150 * 0.000005);

  return { translations, costEstimateUSD };
}
