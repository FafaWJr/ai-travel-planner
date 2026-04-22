#!/usr/bin/env node
// scripts/release-writer/run-release-writer.mjs
//
// Drafts <recent_updates> bullet entries for Wilson's Claude.ai userMemories.
// Reads commits since the last memory-update marker, sends them to Haiku
// with a style prompt, and produces bullets in the exact format Wilson's
// memory uses.
//
// Output: printed to stdout AND saved to /tmp/luna-memory-update-YYYYMMDD.md
//
// Marker file: .claude/last-memory-update.txt (contains the last commit hash
// that was already summarized into memory).
//
// Usage:
//   node scripts/release-writer/run-release-writer.mjs [options]
//
// Options:
//   --advance           Update the marker file to HEAD after drafting.
//                       Use only after pasting entries into Claude.ai memory.
//   --since <hash>      Override marker, summarize commits since this hash.
//   --dry-run           Draft entries, print them, do NOT touch the marker.
//                       (Default behavior without --advance is already dry-run
//                       for the marker; --dry-run also suppresses the file save.)
//
// Exit codes:
//   0 = entries drafted successfully
//   1 = no new commits since last marker (nothing to do)
//   2 = script-level error

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { askHaiku } from '../i18n-check/shared/haiku-client.mjs';
import { loadEnvLocal } from '../i18n-check/shared/env-loader.mjs';

const MARKER_PATH = '.claude/last-memory-update.txt';
const FILE_OUT_DIR = '/tmp';

const SYSTEM_PROMPT = `You draft memory update entries for Wilson, a developer building Luna Let's Go (a consumer AI travel planning platform). These entries go into his Claude.ai userMemories under the "recent_updates" section so future Claude sessions have accurate ground truth about what shipped.

OUTPUT FORMAT: A plain list of dash-prefixed bullet lines. One line per shipped change. No preamble. No code fences. No markdown headers. Just bullets, separated by newlines.

STYLE RULES:
- Each bullet starts with "- " (dash, space).
- Past tense. Declarative. Concise.
- Include the commit hash (short form) at the end in parentheses, like: "... (a1b2c3d)".
- Include the release tag if mentioned in the commit (R7, R5.1-hotfix-1, collab-stage-1, etc.).
- No emoji. No em-dash. Use period, comma, or colon instead.
- If multiple commits describe the same logical change, combine into one bullet.
- Skip commits that do not produce memory-worthy facts: dependency bumps, pure formatting, test-only changes, merge commits.

WHAT TO INCLUDE:
- New features shipped (feat:)
- Fixes that revealed a new architectural rule (fix:)
- Refactors that changed how something works (refactor:)
- New skills, subagents, or infrastructure (chore: if architecturally significant)
- Migrations that changed schema or data contracts

Example output:
- R7 shipped: adds replace_activity tool to Luna chat (a1b2c3d)
- Fixed phase reorder dispatching stale day values, onTripUpdate now uses functional setState (e4f5g6h)
- Added luna-qa-agent subagent for release smoke testing (7h8i9j0)

Do NOT number the bullets. Do NOT add section headers. Do NOT add closing summary.`;

async function main() {
  loadEnvLocal();

  const args = parseArgs(process.argv.slice(2));
  const advance = Boolean(args.advance);
  const dryRun = Boolean(args['dry-run']);
  const sinceOverride = args.since;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set. Add it to .env.local.');
    process.exit(2);
  }

  // Determine the cutoff
  let cutoffHash;
  if (sinceOverride) {
    cutoffHash = sinceOverride;
    console.error(`Using cutoff override: ${cutoffHash}`);
  } else if (existsSync(MARKER_PATH)) {
    cutoffHash = readFileSync(MARKER_PATH, 'utf-8').trim();
    console.error(`Cutoff from marker file: ${cutoffHash}`);
  } else {
    // No marker yet, default to last 20 commits
    console.error('No marker file found. Defaulting to last 20 commits.');
    cutoffHash = execSync('git log -20 --format=%H | tail -1', { encoding: 'utf-8' }).trim();
    console.error(`Implicit cutoff: ${cutoffHash}`);
  }

  // Get the current HEAD for later use
  let headHash;
  try {
    headHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (err) {
    console.error(`ERROR: cannot read HEAD: ${err.message}`);
    process.exit(2);
  }

  if (cutoffHash === headHash) {
    console.error('Cutoff is already HEAD. No new commits to summarize.');
    process.exit(1);
  }

  // Gather commits
  let commitLog;
  try {
    commitLog = execSync(
      `git log ${cutoffHash}..HEAD --format="%h | %ad | %s%n%b%n---" --date=short --no-merges`,
      { encoding: 'utf-8' }
    ).trim();
  } catch (err) {
    console.error(`ERROR: git log failed: ${err.message}`);
    process.exit(2);
  }

  if (!commitLog) {
    console.error('No commits between cutoff and HEAD (or all merges). Nothing to draft.');
    process.exit(1);
  }

  const commitCount = commitLog.split('\n---').filter((c) => c.trim()).length;
  console.error(`\nFound ${commitCount} commits since ${cutoffHash.slice(0, 7)}. Drafting memory entries via Haiku...`);

  // Ask Haiku to draft the bullets
  const userMessage = `Summarize the following commits into memory-update bullets for Wilson's userMemories:

${commitLog}

Produce the bullets directly. No preamble.`;

  let draftedBullets;
  try {
    draftedBullets = await askHaiku(SYSTEM_PROMPT, userMessage, {
      maxTokens: 2048,
      temperature: 0.2,
    });
  } catch (err) {
    console.error(`\nFATAL: Haiku call failed: ${err.message}`);
    process.exit(2);
  }

  // Clean up the output (strip any accidental leading/trailing whitespace or fences)
  const cleaned = draftedBullets
    .replace(/^```(?:md|markdown)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  // Print to terminal
  console.error('\n========== DRAFTED MEMORY ENTRIES ==========\n');
  console.log(cleaned);
  console.error('\n============================================');

  // Save to file unless --dry-run
  let filePath = null;
  if (!dryRun) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    filePath = resolve(FILE_OUT_DIR, `luna-memory-update-${today}.md`);
    const fileContent = [
      `# Luna Memory Update Draft`,
      '',
      `Generated: ${new Date().toISOString()}`,
      `Cutoff: ${cutoffHash}`,
      `HEAD: ${headHash}`,
      `Commits summarized: ${commitCount}`,
      '',
      '## Bullets to paste into Claude.ai userMemories `<recent_updates>` section',
      '',
      cleaned,
      '',
      '---',
      '',
      '## Next step',
      '',
      advance
        ? 'Marker was advanced automatically (--advance flag set).'
        : `After pasting these bullets into Claude.ai memory, re-run with --advance to update the marker:
\`\`\`
node scripts/release-writer/run-release-writer.mjs --advance
\`\`\`
Or manually set the marker:
\`\`\`
echo '${headHash}' > ${MARKER_PATH}
\`\`\``,
    ].join('\n');
    writeFileSync(filePath, fileContent, 'utf-8');
    console.error(`\nSaved to ${filePath}`);
  }

  // Advance the marker if requested
  if (advance) {
    mkdirSync(dirname(MARKER_PATH), { recursive: true });
    writeFileSync(MARKER_PATH, headHash + '\n', 'utf-8');
    console.error(`\nMarker advanced to ${headHash}`);
  } else if (!dryRun) {
    console.error('\nMarker NOT advanced. After pasting entries into Claude.ai memory, re-run with --advance.');
  }

  process.exit(0);
}

// ---------- Helpers ----------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--advance' || arg === '--dry-run') {
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

main().catch((err) => {
  console.error(`FATAL: ${err.message}`);
  console.error(err.stack);
  process.exit(2);
});
