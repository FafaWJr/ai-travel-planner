#!/usr/bin/env node
// scripts/i18n-check/run-qa.mjs
//
// Orchestrator for Luna multilang QA.
// Runs Layer 1 (deterministic) then Layer 2 (semantic) and emits a
// structured JSON report + human-readable summary.
//
// Usage:
//   node scripts/i18n-check/run-qa.mjs [options]
//
// Options:
//   --locale <locale>   Target locale: pt-BR or es or both. Default: both
//   --full              Check all keys instead of just git-diff keys
//   --layer <n>         Run only layer 1 or only layer 2. Default: both
//   --en-path <path>    Path to messages/en.json. Default: messages/en.json
//   --out <path>        Write JSON report to this path. Default: stdout only
//
// Exit codes:
//   0 = all checks passed
//   1 = one or more failures (error or fatal severity)
//   2 = script-level error (missing file, API key, etc.)

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { runLayer1 } from './layer1-deterministic.mjs';
import { runLayer2 } from './layer2-semantic.mjs';

const DEFAULT_EN_PATH = 'messages/en.json';
const LOCALE_PATHS = {
  'pt-BR': 'messages/pt-BR.json',
  es: 'messages/es.json',
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const enPath = args['en-path'] ?? DEFAULT_EN_PATH;
  const locales = args.locale === 'both' || !args.locale ? ['pt-BR', 'es'] : [args.locale];
  const layersToRun = args.layer ? [Number(args.layer)] : [1, 2];
  const outPath = args.out;
  const fullScan = Boolean(args.full);

  if (!existsSync(enPath)) {
    console.error(`ERROR: English source not found at ${enPath}`);
    process.exit(2);
  }

  // Determine which keys to check
  let keysToCheck;
  if (fullScan) {
    keysToCheck = null; // null = all keys
    console.error('Mode: full scan (all keys)');
  } else {
    keysToCheck = getChangedKeysFromGitDiff(enPath, locales);
    if (keysToCheck.length === 0) {
      console.error('No changed translation keys detected in git diff. Nothing to check.');
      const emptyReport = { status: 'no-changes', checked: 0, failures: [] };
      if (outPath) writeFileSync(outPath, JSON.stringify(emptyReport, null, 2));
      process.exit(0);
    }
    console.error(`Mode: git-diff scan (${keysToCheck.length} changed keys)`);
  }

  const report = {
    timestamp: new Date().toISOString(),
    mode: fullScan ? 'full' : 'git-diff',
    locales,
    layersRun: layersToRun,
    results: {},
    summary: { totalChecked: 0, totalFailures: 0, errors: 0, warnings: 0, costUSD: 0 },
  };

  for (const locale of locales) {
    const localePath = LOCALE_PATHS[locale];
    if (!existsSync(localePath)) {
      console.error(`ERROR: Locale file not found at ${localePath}`);
      process.exit(2);
    }

    report.results[locale] = { layer1: null, layer2: null };

    // Layer 1
    if (layersToRun.includes(1)) {
      console.error(`\n[${locale}] Running Layer 1 (deterministic)...`);
      const l1 = runLayer1({ enPath, localePath, locale, keysToCheck });
      report.results[locale].layer1 = l1;
      report.summary.totalChecked += l1.checked;
      report.summary.totalFailures += l1.failures.length;
      report.summary.errors += l1.failures.filter((f) => f.severity === 'error' || f.severity === 'fatal').length;
      report.summary.warnings += l1.failures.filter((f) => f.severity === 'warn').length;
      console.error(`[${locale}] Layer 1: ${l1.passed ? 'PASS' : 'FAIL'} (${l1.checked} checked, ${l1.failures.length} findings)`);
    }

    // Layer 2 — only run if Layer 1 passed (or Layer 1 was skipped)
    const l1Passed = !report.results[locale].layer1 || report.results[locale].layer1.passed;
    if (layersToRun.includes(2) && l1Passed) {
      console.error(`\n[${locale}] Running Layer 2 (semantic via Haiku)...`);
      const keysForL2 = keysToCheck ?? flattenKeyList(readFileSync(localePath, 'utf-8'));
      const l2 = await runLayer2({ enPath, localePath, locale, keysToCheck: keysForL2 });
      report.results[locale].layer2 = l2;
      report.summary.totalChecked += l2.checked;
      report.summary.totalFailures += l2.failures.length;
      report.summary.errors += l2.failures.filter((f) => f.severity === 'error' || f.severity === 'fatal').length;
      report.summary.warnings += l2.failures.filter((f) => f.severity === 'warn').length;
      report.summary.costUSD += l2.totalCostEstimateUSD;
      console.error(`[${locale}] Layer 2: ${l2.passed ? 'PASS' : 'FAIL'} (${l2.checked} checked, ${l2.failures.length} findings, ~$${l2.totalCostEstimateUSD.toFixed(4)})`);
    } else if (layersToRun.includes(2) && !l1Passed) {
      console.error(`\n[${locale}] Skipping Layer 2 because Layer 1 failed. Fix Layer 1 issues first.`);
    }
  }

  // Human-readable summary to stderr
  console.error('\n========== SUMMARY ==========');
  console.error(`Total keys checked: ${report.summary.totalChecked}`);
  console.error(`Total findings: ${report.summary.totalFailures} (${report.summary.errors} errors, ${report.summary.warnings} warnings)`);
  if (report.summary.costUSD > 0) {
    console.error(`Layer 2 API cost: $${report.summary.costUSD.toFixed(4)}`);
  }

  if (report.summary.errors > 0) {
    console.error('\nFAILED. See findings above or in the JSON report.');
  } else if (report.summary.warnings > 0) {
    console.error('\nPASSED with warnings.');
  } else {
    console.error('\nPASSED clean.');
  }

  // Write JSON report
  if (outPath) {
    writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.error(`\nFull report written to ${outPath}`);
  }

  // Print JSON report to stdout (so it can be piped)
  console.log(JSON.stringify(report, null, 2));

  process.exit(report.summary.errors > 0 ? 1 : 0);
}

// ---------- Helpers ----------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--full') {
      args.full = true;
    } else if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

/**
 * Returns dot-paths of translation keys that have changed in the working
 * tree vs HEAD. Looks at both the English file (new keys) and each
 * locale file (updated translations).
 */
function getChangedKeysFromGitDiff(enPath, locales) {
  const filesToCheck = [enPath, ...locales.map((l) => LOCALE_PATHS[l])];
  const changedKeys = new Set();

  for (const file of filesToCheck) {
    if (!existsSync(file)) continue;
    let diff;
    try {
      diff = execSync(`git diff HEAD -- "${file}"`, { encoding: 'utf-8' });
    } catch (err) {
      console.error(`Warning: git diff failed for ${file}: ${err.message}`);
      continue;
    }

    // Extract JSON key paths from the diff.
    // Naive approach: look for `"keyname":` lines in added/removed sections.
    // For nested keys, this misses the full path, so we re-parse HEAD and
    // working tree versions and diff the key sets.
    const workingKeys = flattenKeyListFromFile(file);
    let headContent;
    try {
      headContent = execSync(`git show HEAD:"${file}"`, { encoding: 'utf-8' });
    } catch {
      headContent = '{}'; // File is new
    }
    const headKeys = flattenKeyList(headContent);

    // Added keys
    for (const k of workingKeys) {
      if (!headKeys.has(k)) changedKeys.add(k);
    }

    // Changed values (keys present in both but with different content)
    try {
      const workingJson = JSON.parse(readFileSync(file, 'utf-8'));
      const headJson = JSON.parse(headContent);
      for (const k of workingKeys) {
        if (headKeys.has(k)) {
          const wv = getByPath(workingJson, k);
          const hv = getByPath(headJson, k);
          if (wv !== hv) changedKeys.add(k);
        }
      }
    } catch {
      // Ignore parse errors here, the main checks will catch them
    }
  }

  return [...changedKeys];
}

function flattenKeyList(jsonString) {
  const set = new Set();
  try {
    const obj = JSON.parse(jsonString);
    walk(obj, '', set);
  } catch {
    // Ignore
  }
  return set;
}

function flattenKeyListFromFile(path) {
  return flattenKeyList(readFileSync(path, 'utf-8'));
}

function walk(obj, prefix, set) {
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      walk(v, p, set);
    } else {
      set.add(p);
    }
  }
}

function getByPath(obj, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), obj);
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(2);
});
