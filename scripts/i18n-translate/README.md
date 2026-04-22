# i18n Translate — Luna Let's Go Auto-Translation

Batch-translates new English keys into PT-BR and ES. Integrates with `scripts/i18n-check/` as a hard safety gate.

## What this does

When new strings are added to `messages/en.json`, this pipeline:

1. Detects missing keys in `messages/pt-BR.json` and `messages/es.json`.
2. Drafts translations for all missing keys in a single Haiku API call per locale (batch mode).
3. Writes the drafts directly into the locale files.
4. Runs the QA pipeline (`scripts/i18n-check/run-qa.mjs`) on the fresh drafts.
5. On QA pass: leaves the drafts in the working tree for Wilson to review and commit manually.
6. On QA fail: reverts the locale files to HEAD state and writes a failure log to `/tmp/luna-translation-fails.md` so Wilson can hand-fix.

The QA gate is non-negotiable. Bad translations never reach the committed state because they never survive QA.

## Usage

From the project root:

```bash
# Default: draft + write + QA both locales
node scripts/i18n-translate/run-translate.mjs

# Dry run: draft only, show on stdout, do NOT write or run QA
node scripts/i18n-translate/run-translate.mjs --dry-run

# Only one locale
node scripts/i18n-translate/run-translate.mjs --locale pt-BR

# Write drafts without running QA (use only for debugging)
node scripts/i18n-translate/run-translate.mjs --skip-qa

# Write JSON orchestration report to disk
node scripts/i18n-translate/run-translate.mjs --out translation-report.json
```

## Exit codes

- `0` — translations drafted, QA passed, working tree has drafts ready for review
- `1` — QA failed, writes were reverted, see `/tmp/luna-translation-fails.md`
- `2` — script-level error (missing file, API key, no work to do, etc.)

## Environment

Requires `ANTHROPIC_API_KEY` in your environment. Add to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Architecture

```
scripts/i18n-translate/
├── run-translate.mjs       # Orchestrator (CLI entry point)
├── translate.mjs           # Translation drafting via Haiku
└── README.md               # This file
```

Depends on `scripts/i18n-check/shared/` (accent rules, Haiku client).

## Workflow integration

Typical cycle when you add new EN strings:

```bash
# 1. Add new strings to messages/en.json
# 2. Run translator
node scripts/i18n-translate/run-translate.mjs

# 3a. If QA passes, review the drafts:
git diff messages/pt-BR.json messages/es.json

# 3b. If you're happy, commit:
git add messages/*.json
git commit -m "i18n: translate new strings for <feature>"
git push origin main

# 3c. If QA failed, check the failure log:
cat /tmp/luna-translation-fails.md
# Hand-fix the flagged strings, then re-run translator or write them manually
```

## Cost

Haiku calls are cheap. Typical releases:

- 10 new strings → ~$0.002
- 50 new strings → ~$0.01
- 500 new strings → ~$0.05

Batching both locales into one run is always cheaper than two separate runs.

## Known limitations

- Batch mode sends all missing keys in a single request per locale. If Haiku hallucinates a missing key in its response, the entire draft is rejected (shape verification). For very large batches (>50 keys), consider splitting.
- The failure log captures Haiku's draft for human review but does not attempt to auto-fix. Wilson fixes by hand, or invokes the translator again after fixing `shared/accent-rules.mjs` if a new rule is needed.
- No cross-key consistency check. If Haiku translates "trip" as "viagem" in one key and "jornada" in another, QA won't flag it. Consistency audits are a future enhancement.

## Invoked by

Two entry points:

1. **Direct CLI usage** (Wilson runs it locally when new EN strings are ready).
2. **`luna-multilang-translator` subagent** (in `.claude/agents/luna-multilang-translator.md`).

Both entry points produce the same underlying JSON output and the same QA gate.
