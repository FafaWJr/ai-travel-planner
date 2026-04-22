#!/usr/bin/env node
// scripts/i18n-translate/run-translate.mjs
//
// Orchestrator for luna-multilang-translator.
//
// Workflow:
//   1. Detect missing/changed keys in messages/pt-BR.json and messages/es.json
//      relative to messages/en.json.
//   2. Batch-draft translations for all missing keys in both locales in one pass.
//   3. Write drafts directly into the locale files.
//   4. Invoke the QA pipeline (scripts/i18n-check/run-qa.mjs).
//   5. On QA failure: revert locale files to HEAD state, preserve a
//      /tmp/luna-translation-fails.md log with the rejected drafts.
//   6. On QA pass: leave drafts in working tree for Wilson's review.

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { draftTranslations } from './translate.mjs';
import { loadEnvLocal } from '../i18n-check/shared/env-loader.mjs';

const EN_PATH = 'messages/en.json';
const LOCALE_PATHS = {
  'pt-BR': 'messages/pt-BR.json',
  es: 'messages/es.json',
};
const FAIL_LOG_PATH = '/tmp/luna-translation-fails.md';

async function main() {
  loadEnvLocal();

  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run']);
  const skipQa = Boolean(args['skip-qa']);
  const locales = args.locale ? [args.locale] : ['pt-BR', 'es'];
  const outPath = args.out;

  if (!existsSync(EN_PATH)) {
    console.error(`ERROR: ${EN_PATH} not found. Run from project root.`);
    process.exit(2);
  }
  for (const loc of locales) {
    if (!existsSync(LOCALE_PATHS[loc])) {
      console.error(`ERROR: ${LOCALE_PATHS[loc]} not found.`);
      process.exit(2);
    }
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set. Add it to .env.local.');
    process.exit(2);
  }

  const enData = JSON.parse(readFileSync(EN_PATH, 'utf-8'));
  const enKeys = flattenKeys(enData);

  const workPerLocale = {};
  for (const loc of locales) {
    const localeData = JSON.parse(readFileSync(LOCALE_PATHS[loc], 'utf-8'));
    const localeKeys = flattenKeys(localeData);
    const localeKeySet = new Set(localeKeys.map((k) => k.path));

    const missing = enKeys
      .filter((k) => typeof k.value === 'string' && k.value.length > 0)
      .filter((k) => !localeKeySet.has(k.path));

    workPerLocale[loc] = {
      missingKeys: Object.fromEntries(missing.map((k) => [k.path, k.value])),
      missingCount: missing.length,
    };
  }

  const totalMissing = Object.values(workPerLocale).reduce((sum, w) => sum + w.missingCount, 0);
  if (totalMissing === 0) {
    console.error('No missing translation keys detected. Nothing to translate.');
    const report = { status: 'no-work', workPerLocale };
    if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 2));
    process.exit(0);
  }

  console.error(`Detected missing keys: ${locales.map((l) => `${l}=${workPerLocale[l].missingCount}`).join(', ')}`);

  const drafts = {};
  let totalCost = 0;
  for (const loc of locales) {
    const work = workPerLocale[loc];
    if (work.missingCount === 0) {
      drafts[loc] = {};
      continue;
    }
    console.error(`\nDrafting ${work.missingCount} translations for ${loc}...`);
    try {
      const { translations, costEstimateUSD } = await draftTranslations({
        locale: loc,
        keysWithEnglish: work.missingKeys,
      });
      drafts[loc] = translations;
      totalCost += costEstimateUSD;
      console.error(`  Drafted ${Object.keys(translations).length} keys. Cost ~$${costEstimateUSD.toFixed(4)}`);
    } catch (err) {
      console.error(`\nFATAL: Drafting failed for ${loc}: ${err.message}`);
      process.exit(2);
    }
  }

  if (dryRun) {
    console.error('\n--- DRY RUN: drafts produced, no files written ---');
    for (const loc of locales) {
      console.error(`\n## ${loc}`);
      for (const [k, v] of Object.entries(drafts[loc])) {
        console.error(`  ${k}: "${v}"`);
      }
    }
    const report = { status: 'dry-run', workPerLocale, drafts, totalCostUSD: totalCost };
    if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  const backups = {};
  for (const loc of locales) {
    if (Object.keys(drafts[loc]).length === 0) continue;
    const backup = `/tmp/luna-${loc}-backup-${Date.now()}.json`;
    copyFileSync(LOCALE_PATHS[loc], backup);
    backups[loc] = backup;

    const localeData = JSON.parse(readFileSync(LOCALE_PATHS[loc], 'utf-8'));
    for (const [path, value] of Object.entries(drafts[loc])) {
      setByPath(localeData, path, value);
    }
    writeFileSync(LOCALE_PATHS[loc], JSON.stringify(localeData, null, 2) + '\n', 'utf-8');
    console.error(`Wrote ${Object.keys(drafts[loc]).length} drafts to ${LOCALE_PATHS[loc]}`);
  }

  if (skipQa) {
    console.error('\n--skip-qa flag set. Skipping QA pipeline. Drafts are in the working tree.');
    const report = {
      status: 'written-no-qa',
      workPerLocale,
      drafts,
      totalCostUSD: totalCost,
      backups,
    };
    if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  }

  console.error('\nRunning QA pipeline on fresh drafts...');
  const qaOutPath = '/tmp/luna-translator-qa-report.json';
  const qaResult = spawnSync(
    'node',
    ['scripts/i18n-check/run-qa.mjs', '--out', qaOutPath],
    { encoding: 'utf-8', stdio: ['inherit', 'pipe', 'inherit'] }
  );

  let qaReport = null;
  if (existsSync(qaOutPath)) {
    try {
      qaReport = JSON.parse(readFileSync(qaOutPath, 'utf-8'));
    } catch {
      // unparseable, treat as failure
    }
  }

  const qaPassed = qaResult.status === 0;

  if (!qaPassed) {
    console.error('\nQA FAILED. Reverting locale file writes...');
    for (const [loc, backupPath] of Object.entries(backups)) {
      copyFileSync(backupPath, LOCALE_PATHS[loc]);
      console.error(`  Reverted ${LOCALE_PATHS[loc]} from ${backupPath}`);
    }
    writeFailLog({ drafts, qaReport, workPerLocale });
    console.error(`\nFailure log written to ${FAIL_LOG_PATH}`);
    const report = {
      status: 'qa-failed-reverted',
      workPerLocale,
      drafts,
      totalCostUSD: totalCost,
      qaReport,
      failLogPath: FAIL_LOG_PATH,
    };
    if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.error('\nQA PASSED. Drafts are in the working tree for Wilson to review and commit.');
  const report = {
    status: 'qa-passed-ready-for-review',
    workPerLocale,
    drafts,
    totalCostUSD: totalCost,
    qaReport,
  };
  if (outPath) writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run' || arg === '--skip-qa') {
      args[arg.slice(2)] = true;
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

function setByPath(obj, path, value) {
  const parts = path.split('.');
  let cursor = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (cursor[parts[i]] == null || typeof cursor[parts[i]] !== 'object') {
      cursor[parts[i]] = {};
    }
    cursor = cursor[parts[i]];
  }
  cursor[parts[parts.length - 1]] = value;
}

function writeFailLog({ drafts, qaReport, workPerLocale }) {
  const lines = [];
  lines.push('# Luna Translation Failure Log');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('The translator drafted translations, but QA rejected them. Locale files have been reverted to HEAD state. This log preserves the rejected drafts and QA findings so Wilson can diagnose and hand-write fixes.');
  lines.push('');

  for (const [loc, locDrafts] of Object.entries(drafts)) {
    if (Object.keys(locDrafts).length === 0) continue;
    lines.push(`## Rejected drafts for ${loc}`);
    lines.push('');
    for (const [path, value] of Object.entries(locDrafts)) {
      const enValue = workPerLocale[loc].missingKeys[path];
      lines.push(`### \`${path}\``);
      lines.push(`- EN: "${enValue}"`);
      lines.push(`- Drafted ${loc}: "${value}"`);
      lines.push('');
    }
  }

  if (qaReport) {
    lines.push('## QA findings');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(qaReport.summary ?? qaReport, null, 2));
    lines.push('```');
    lines.push('');
    for (const loc of Object.keys(qaReport.results ?? {})) {
      const locResult = qaReport.results[loc];
      if (!locResult) continue;
      for (const layer of ['layer1', 'layer2']) {
        const layerResult = locResult[layer];
        if (!layerResult || !layerResult.failures) continue;
        for (const f of layerResult.failures) {
          lines.push(`- **${loc} / ${layer} / ${f.check}** (${f.severity}): \`${f.key}\` - ${f.message}`);
        }
      }
    }
  }

  writeFileSync(FAIL_LOG_PATH, lines.join('\n'), 'utf-8');
}

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(2);
});
