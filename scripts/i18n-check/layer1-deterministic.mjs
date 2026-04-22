// scripts/i18n-check/layer1-deterministic.mjs
//
// Layer 1: Deterministic rule checks for PT-BR and ES translations.
// No API calls. Fast. Free. Runs in milliseconds.
//
// Checks:
//   1. UTF-8 encoding validity
//   2. Required accent presence (PT-BR)
//   3. Bare "e" vs "é" detection in ser-verb contexts (PT-BR)
//   4. Crasis "a" → "à" before feminine nouns (PT-BR)
//   5. Proper noun preservation (both locales)
//   6. Key parity (every EN key exists in target locale)
//   7. JSON structure validity
//   8. Length sanity (translation within bounds of English source)

import { readFileSync } from 'node:fs';
import {
  REQUIRED_ACCENTS_PT_BR,
  SER_VERB_TRAPS_PT_BR,
  CRASIS_TRAPS_PT_BR,
  PROTECTED_NOUNS,
  LENGTH_BOUNDS,
} from './shared/accent-rules.mjs';

/**
 * Run Layer 1 checks on a single locale file.
 *
 * @param {object} params
 * @param {string} params.enPath - Path to messages/en.json
 * @param {string} params.localePath - Path to messages/pt-BR.json or messages/es.json
 * @param {string} params.locale - 'pt-BR' or 'es'
 * @param {string[]} [params.keysToCheck] - If provided, only check these dot-paths. If omitted, check all.
 * @returns {{ passed: boolean, failures: Array, checked: number }}
 */
export function runLayer1(params) {
  const { enPath, localePath, locale, keysToCheck } = params;
  const failures = [];
  let checked = 0;

  // Check 1: UTF-8 + JSON validity
  let enData, localeData;
  try {
    const enRaw = readFileSync(enPath);
    assertNoBom(enRaw, enPath);
    enData = JSON.parse(enRaw.toString('utf-8'));
  } catch (err) {
    failures.push({
      severity: 'fatal',
      check: 'json-validity',
      key: null,
      locale: 'en',
      message: `Cannot parse ${enPath}: ${err.message}`,
    });
    return { passed: false, failures, checked: 0 };
  }

  try {
    const localeRaw = readFileSync(localePath);
    assertNoBom(localeRaw, localePath);
    localeData = JSON.parse(localeRaw.toString('utf-8'));
  } catch (err) {
    failures.push({
      severity: 'fatal',
      check: 'json-validity',
      key: null,
      locale,
      message: `Cannot parse ${localePath}: ${err.message}`,
    });
    return { passed: false, failures, checked: 0 };
  }

  // Check 2: Key parity - every EN key must exist in target
  const enKeys = flattenKeys(enData);
  const localeKeys = flattenKeys(localeData);
  const enKeySet = new Set(enKeys.map((k) => k.path));
  const localeKeySet = new Set(localeKeys.map((k) => k.path));

  const missingInLocale = [...enKeySet].filter((k) => !localeKeySet.has(k));
  for (const path of missingInLocale) {
    failures.push({
      severity: 'error',
      check: 'key-parity',
      key: path,
      locale,
      message: `Key present in en.json but missing in ${locale}`,
    });
  }

  // Filter which keys to run content checks on
  const targetPaths = keysToCheck
    ? new Set(keysToCheck.filter((k) => localeKeySet.has(k)))
    : localeKeySet;

  // Check 3-7: Content checks per key
  for (const { path, value } of localeKeys) {
    if (!targetPaths.has(path)) continue;
    if (typeof value !== 'string' || value.length === 0) continue;

    checked++;
    const enEntry = enKeys.find((k) => k.path === path);
    const enValue = enEntry?.value;

    // Length sanity (only if we have the EN value)
    if (typeof enValue === 'string' && enValue.length > 0) {
      const ratio = value.length / enValue.length;
      if (ratio < LENGTH_BOUNDS.minRatio || ratio > LENGTH_BOUNDS.maxRatio) {
        failures.push({
          severity: 'warn',
          check: 'length-sanity',
          key: path,
          locale,
          message: `Translation length ratio ${ratio.toFixed(2)} outside bounds [${LENGTH_BOUNDS.minRatio}, ${LENGTH_BOUNDS.maxRatio}]. EN: "${enValue.slice(0, 60)}" / ${locale}: "${value.slice(0, 60)}"`,
        });
      }
    }

    // Proper noun preservation (both locales)
    for (const noun of PROTECTED_NOUNS) {
      if (typeof enValue === 'string' && enValue.includes(noun) && !value.includes(noun)) {
        failures.push({
          severity: 'error',
          check: 'protected-noun',
          key: path,
          locale,
          message: `Protected noun "${noun}" present in EN but missing or translated in ${locale}. Value: "${value}"`,
        });
      }
    }

    // PT-BR-specific checks
    if (locale === 'pt-BR') {
      // Required accents
      const lowerValue = value.toLowerCase();
      for (const { unaccented, accented, context } of REQUIRED_ACCENTS_PT_BR) {
        if (context === 'ser-verb') continue; // Handled by SER_VERB_TRAPS separately
        const unaccentedRegex = new RegExp(`\\b${escapeRegex(unaccented)}\\b`, 'i');
        const accentedRegex = new RegExp(`\\b${escapeRegex(accented)}\\b`, 'i');
        if (unaccentedRegex.test(value) && !accentedRegex.test(value)) {
          failures.push({
            severity: 'error',
            check: 'required-accent',
            key: path,
            locale,
            message: `Unaccented "${unaccented}" found where "${accented}" was expected. Value: "${value}"`,
          });
        }
      }

      // Bare "e" vs "é" traps
      for (const trap of SER_VERB_TRAPS_PT_BR) {
        if (trap.test(value)) {
          failures.push({
            severity: 'error',
            check: 'ser-verb-trap',
            key: path,
            locale,
            message: `Likely "é" (is/are) written as bare "e" (and). Pattern: ${trap}. Value: "${value}"`,
          });
        }
      }

      // Crasis "a" → "à"
      for (const trap of CRASIS_TRAPS_PT_BR) {
        if (trap.test(value)) {
          failures.push({
            severity: 'warn',
            check: 'crasis-trap',
            key: path,
            locale,
            message: `Preposition "a" before feminine noun may need to contract to "à". Pattern: ${trap}. Value: "${value}"`,
          });
        }
      }
    }
  }

  const hasFatalOrError = failures.some((f) => f.severity === 'fatal' || f.severity === 'error');
  return {
    passed: !hasFatalOrError,
    failures,
    checked,
  };
}

// ---------- Helpers ----------

function assertNoBom(buffer, path) {
  if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    throw new Error(`${path} has a UTF-8 BOM. Remove it, file must be plain UTF-8.`);
  }
}

function flattenKeys(obj, prefix = '', out = []) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenKeys(value, path, out);
    } else {
      out.push({ path, value });
    }
  }
  return out;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
