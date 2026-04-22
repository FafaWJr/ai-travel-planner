// scripts/i18n-check/layer2-semantic.mjs
//
// Layer 2: Semantic QA via Haiku 4.5.
// Checks each translation for:
//   - Accuracy (does it mean the same as the English?)
//   - Register (is it warm and conversational, matching Luna's voice?)
//   - Idiom appropriateness (does it read natural in the target locale?)
//
// Each check returns a score 1-5 and a note. Scores below a threshold fail.
//
// Cost: approximately $0.0001 per string. A typical 20-string release
// costs less than 1 cent in Haiku API calls.

import { readFileSync } from 'node:fs';
import { askHaiku, parseHaikuJson } from './shared/haiku-client.mjs';

const THRESHOLD = 3; // Scores below 3 are failures

const SYSTEM_PROMPT = `You are a translation QA reviewer for Luna Let's Go, a consumer-facing AI travel planning platform with a warm, conversational brand voice.

You evaluate translations across three dimensions, each scored 1-5:

1. ACCURACY: Does the translation preserve the meaning of the English source? 5 = perfect, 1 = meaning distorted.
2. REGISTER: Does the translation match Luna's warm, conversational, direct voice? Not corporate, not stiff, not overly formal. 5 = perfect brand voice match, 1 = tone is wrong.
3. IDIOM: Does the translation read naturally in the target language? 5 = a native speaker would write it this way, 1 = awkward literal translation.

Brand voice notes:
- Luna speaks directly to the user ("você" in PT-BR, "tú" in ES Latin America).
- Luna is friendly but never casual to the point of slang.
- Luna avoids corporate jargon and travel-industry clichés.

You respond ONLY with valid JSON in this exact shape:
{
  "accuracy": { "score": <1-5>, "note": "<short reason>" },
  "register": { "score": <1-5>, "note": "<short reason>" },
  "idiom": { "score": <1-5>, "note": "<short reason>" }
}

No preamble. No code fences. Just the JSON object.`;

/**
 * Run Layer 2 semantic QA on a set of translation keys.
 *
 * @param {object} params
 * @param {string} params.enPath - Path to messages/en.json
 * @param {string} params.localePath - Path to messages/pt-BR.json or messages/es.json
 * @param {string} params.locale - 'pt-BR' or 'es'
 * @param {string[]} params.keysToCheck - Dot-paths of keys to check
 * @returns {Promise<{ passed: boolean, failures: Array, checked: number, totalCostEstimateUSD: number }>}
 */
export async function runLayer2(params) {
  const { enPath, localePath, locale, keysToCheck } = params;

  const enData = JSON.parse(readFileSync(enPath, 'utf-8'));
  const localeData = JSON.parse(readFileSync(localePath, 'utf-8'));

  const failures = [];
  let checked = 0;
  let costEstimate = 0;

  for (const keyPath of keysToCheck) {
    const enValue = getByPath(enData, keyPath);
    const localeValue = getByPath(localeData, keyPath);

    if (typeof enValue !== 'string' || typeof localeValue !== 'string') continue;
    if (enValue.length === 0 || localeValue.length === 0) continue;

    checked++;

    const userMessage = buildUserMessage({
      locale,
      enValue,
      localeValue,
    });

    let result;
    try {
      const response = await askHaiku(SYSTEM_PROMPT, userMessage, { maxTokens: 400 });
      result = parseHaikuJson(response);
      // Rough cost estimate: ~400 input tokens + ~100 output tokens at Haiku rates
      costEstimate += 0.0001;
    } catch (err) {
      failures.push({
        severity: 'warn',
        check: 'layer2-api-error',
        key: keyPath,
        locale,
        message: `Haiku call failed: ${err.message}. Skipping this key.`,
      });
      continue;
    }

    for (const dim of ['accuracy', 'register', 'idiom']) {
      const entry = result[dim];
      if (!entry || typeof entry.score !== 'number') {
        failures.push({
          severity: 'warn',
          check: 'layer2-malformed-response',
          key: keyPath,
          locale,
          message: `Haiku response missing or malformed for dimension "${dim}".`,
        });
        continue;
      }
      if (entry.score < THRESHOLD) {
        failures.push({
          severity: 'error',
          check: `layer2-${dim}`,
          key: keyPath,
          locale,
          message: `${dim} score ${entry.score}/5: ${entry.note}. EN: "${enValue}" / ${locale}: "${localeValue}"`,
        });
      }
    }
  }

  const hasFatalOrError = failures.some((f) => f.severity === 'fatal' || f.severity === 'error');
  return {
    passed: !hasFatalOrError,
    failures,
    checked,
    totalCostEstimateUSD: costEstimate,
  };
}

// ---------- Helpers ----------

function buildUserMessage({ locale, enValue, localeValue }) {
  const localeName = locale === 'pt-BR' ? 'Brazilian Portuguese' : 'Spanish (Latin American)';
  return `Target locale: ${localeName}

English source:
"${enValue}"

Translation to review:
"${localeValue}"

Evaluate the translation on accuracy, register (Luna's warm conversational voice), and idiom. Return JSON only.`;
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

export { THRESHOLD };
