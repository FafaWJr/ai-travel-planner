# Release Writer — Luna Let's Go Memory Updates

Drafts `<recent_updates>` bullet entries for Wilson's Claude.ai userMemories.

## What this does

Reads git commits since the last memory-update marker, sends them to Haiku with a style prompt, and produces dash-prefixed bullets in the exact format Wilson's memory uses. Saves to `/tmp/luna-memory-update-YYYYMMDD.md` and prints to stdout for copy-paste.

## Why this exists

After every release Wilson needs to update his Claude.ai userMemories so future sessions have accurate ground truth about what shipped. Writing the bullets by hand is repetitive and token-costly. This agent drafts them in the right format every time.

## Marker file

The agent tracks what has already been summarized via `.claude/last-memory-update.txt`, a single-line file containing the last commit hash that was summarized into memory.

Workflow:

1. Run the script. It reads the marker, drafts bullets for commits since that hash.
2. Review the output.
3. Paste the bullets into Claude.ai → Settings → userMemories → `<recent_updates>` section.
4. Re-run with `--advance` to move the marker to HEAD.

The marker stays out of sync until you explicitly advance it. That's intentional: the agent cannot tell whether you actually pasted the output into memory, so it never auto-advances without confirmation.

## Usage

From the project root:

```bash
# Default: draft bullets since last marker, save to /tmp, do NOT advance marker
node scripts/release-writer/run-release-writer.mjs

# After pasting bullets into Claude.ai memory, advance the marker
node scripts/release-writer/run-release-writer.mjs --advance

# Override the cutoff (one-off summaries from a specific point)
node scripts/release-writer/run-release-writer.mjs --since a1b2c3d

# Dry run (draft + print, do NOT save file, do NOT touch marker)
node scripts/release-writer/run-release-writer.mjs --dry-run
```

## Exit codes

- `0` — entries drafted successfully
- `1` — no new commits since last marker (nothing to do)
- `2` — script-level error

## Environment

Requires `ANTHROPIC_API_KEY` in `.env.local` or exported. Auto-loaded via the shared `env-loader.mjs`.

## Architecture

```
scripts/release-writer/
├── run-release-writer.mjs    # Single orchestrator script
└── README.md                  # This file
```

Depends on `scripts/i18n-check/shared/` for the Haiku client and env loader. Zero additional dependencies.

## First-run behavior

If `.claude/last-memory-update.txt` does not exist yet (first-time use), the script defaults to the last 20 commits. Review the output carefully the first time, then run with `--advance` to establish the marker.

## Invoked by

Two entry points:

1. **Direct CLI usage** (Wilson runs it locally after each release).
2. **`luna-release-writer` subagent** (in `.claude/agents/luna-release-writer.md`).

Both entry points produce identical output.

## Cost

One Haiku call per run. Typical release (5-15 commits) costs ~$0.001 to $0.003.
