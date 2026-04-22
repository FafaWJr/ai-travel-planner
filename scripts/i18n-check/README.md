# i18n Check — Luna Let's Go Multilang QA

Deterministic and semantic quality checks for PT-BR and ES translations.

## What this does

Two-layer pipeline that catches translation errors before they reach production.

**Layer 1 — Deterministic (free, instant):**
- UTF-8 encoding validity (no BOM)
- Required accent presence (PT-BR): `você`, `não`, `é`, `está`, `só`, `já`, `grátis`, `orçamento`, `opções`, `sugestões`, `hotéis`, `estações`, `preferências`, `localização`, `confiança`, `distância`, `alimentação`, `horários`, `início`, `único`, `próxima`, `começa`, `Japão`, `Tóquio`, `Índia`, `manhã`, `almoços`, `são`, `família`, `crianças`, `econômico`, `românticas`, `programação`, `táxis`, `até`
- Bare `e` vs `é` detection in ser-verb contexts
- Crasis `a` → `à` trap detection before feminine nouns
- Proper noun preservation (Luna Let's Go, persona names)
- Key parity across locales
- JSON structure validity
- Length sanity (translation within ±40% of English)

**Layer 2 — Semantic (cheap, fast):**
- Haiku 4.5 reviews each translation for accuracy, register (Luna's voice), and idiom appropriateness
- Scores 1-5 per dimension; below 3 is a failure
- ~$0.0001 per key, less than $0.01 for a typical 20-key release

**Layer 3 (screenshot snapshot)** is a planned v2 enhancement, not shipped yet.

## Usage

From the project root:

```bash
# Default: git-diff mode, both locales, both layers
node scripts/i18n-check/run-qa.mjs

# Full scan (all keys, not just changed ones)
node scripts/i18n-check/run-qa.mjs --full

# Only one locale
node scripts/i18n-check/run-qa.mjs --locale pt-BR

# Only Layer 1 (skip API calls)
node scripts/i18n-check/run-qa.mjs --layer 1

# Write JSON report to disk
node scripts/i18n-check/run-qa.mjs --out i18n-qa-report.json
```

## Exit codes

- `0` — all checks passed (warnings allowed)
- `1` — one or more error/fatal findings
- `2` — script-level error (missing file, API key, etc.)

## Environment

Requires `ANTHROPIC_API_KEY` in your environment for Layer 2. Add it to `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

If Layer 2 is skipped (`--layer 1`), no API key is needed.

## Architecture

```
scripts/i18n-check/
├── run-qa.mjs                       # Orchestrator (CLI entry point)
├── layer1-deterministic.mjs         # Rule-based checks
├── layer2-semantic.mjs              # Haiku-based semantic review
├── shared/
│   ├── accent-rules.mjs             # PT-BR accent rules, protected nouns
│   └── haiku-client.mjs             # Anthropic SDK wrapper
└── README.md                        # This file
```

The `shared/` modules are designed to be imported by `luna-multilang-translator` when that agent ships. Single source of truth for rules, no duplication.

## Invoked by

Two entry points:

1. **Direct CLI usage** (Wilson runs it locally before committing translations).
2. **`luna-multilang-qa` subagent** (in `.claude/agents/luna-multilang-qa.md`). The subagent orchestrates the script and produces a human-readable report.

Both entry points produce the same underlying JSON output.

## Adding new rules

- **New required accent:** edit `shared/accent-rules.mjs`, add to `REQUIRED_ACCENTS_PT_BR`.
- **New bare-e trap pattern:** add to `SER_VERB_TRAPS_PT_BR` in the same file.
- **New protected noun:** add to `PROTECTED_NOUNS`.
- **New check layer:** create a new `layerN-*.mjs` module, wire it into `run-qa.mjs`.

## Known limitations

- Bare `e` detection uses heuristics; it will miss some real errors and flag some false positives. Always review Layer 1 `error` severity findings manually.
- Crasis (`à`) detection is intentionally conservative; it emits `warn` not `error`.
- Layer 2 cost scales linearly with changed keys. A 500-key translation refresh costs ~$0.05. Budget accordingly.
- Layer 2 requires network connectivity. Offline runs should use `--layer 1`.
