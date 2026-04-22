# Luna Skills & Subagents Sprint

**Reference document for the Luna skills and subagents implementation sprint.**

Prepared for Wilson, Luna Let's Go. April 2026.
Last updated: 2026-04-22.
**Status: SHIPPED.** All 8 deliverables complete. Sprint executed in a single session on 2026-04-21 / 2026-04-22 (originally planned as a two-week effort).

---

## Purpose of this document

This is the single source of truth for the Luna skills and subagents sprint.

During planning and execution, it captured every decision made so we didn't re-litigate anything during implementation. Post-sprint, it serves as a historical record of what was built, why it was built that way, what went well, and what lessons were learned.

Refer back to it:
- When onboarding a future Claude session to the agent architecture.
- When extending or modifying any of the 8 deliverables.
- When designing similar sprints for other projects.

If a decision here conflicts with something said mid-implementation, this document wins unless explicitly updated. Section 12 (Retrospective) is authoritative for what actually shipped.

---

## 1. Context and timing

### 1.1 Why now

Three gates had to clear before starting this sprint:

1. Track 2 complete (R5 hotfix, R6, R5.1 shipped and stable).
2. AI model and intelligence architecture project complete (5-stage AI Upgrade Plan).
3. Luna stable enough that further polish doesn't block this work.

All three cleared on 2026-04-21. Wilson confirmed the green light the same day.

### 1.2 Why this sprint matters

Luna is approaching its next major build: Collaborative Trips (~70 hours, 5 stages). That sprint will produce roughly 15 Claude Code prompts. Without codified skills and subagents, every prompt risks drift in format, missed architectural rules, and inconsistent smoke testing. The skills remove drift. The subagents remove repetitive manual work.

This sprint is the investment that makes Collaborative Trips ship cleanly.

### 1.3 Two-week total effort

- Week 1: Skills (3 deliverables, plus one small bonus)
- Week 2: Subagents (5 deliverables)

Total deliverables: 8 files, all Markdown, all copy-paste-ready.

---

## 2. Architecture: two-layer design

The system has two independent layers.

**Layer 1 — Skills.** Used by Claude (the AI in chat, during planning and prompt-writing sessions with Wilson). Skills load automatically when the context matches their trigger description. They codify rules and patterns so Claude applies them consistently without Wilson needing to paste them in every session.

**Layer 2 — Subagents.** Used by Wilson locally in Claude Code (the command-line tool). Subagents are specialized helpers Wilson invokes from the terminal to automate repetitive tasks during implementation.

**Dependency direction:** Subagents inherit format and convention from Skills. Skills do not depend on Subagents. This means updating a skill propagates to every subagent that references it. Updating a subagent stays local to that subagent.

---

## 3. Skills (Week 1)

### 3.1 `luna-prompt-writer` — ship first

**Purpose:** Codifies the Claude Code prompt format used for every release prompt.

**Why first:** Lowest risk, highest frequency. Every subsequent skill and subagent references this format. Also earns immediate payback on every prompt Claude writes from the moment it ships.

**Contents (planned):**
- Per-change section structure
- Summary table format (file, change type, lines affected)
- Numbered smoke test format
- Git commit command block format
- Rollback procedure format
- "Leave unrelated components untouched" guardrails
- When to use `.md` file delivery vs inline prompt
- Output location convention (`/mnt/user-data/outputs/`)

**Estimated size:** One `.md` file, roughly 3-4 KB.

**Risk:** Very low. It's a format document with no runtime behavior.

---

### 3.2 `luna-architecture` — ship second

**Purpose:** The rules skill. Documents every architectural rule, convention, and "don't do this" that applies to Luna code.

**Why second:** Depends on nothing from `luna-prompt-writer` but is much larger and more opinionated. Easier to write after the prompt format is locked in so the skill itself follows that format.

**Scope decision:** Post-upgrade rules (reflects Luna's current state after AI Upgrade Plan). Not dual-path, not pre-upgrade-only.

**Contents (planned):**

Routing & framework:
- `proxy.ts` not `middleware.ts` (Next.js 16 requirement)
- `<Link>` uses `window.navigation` API, not `window.history.pushState`
- Static pre-rendered pages can't detect Supabase sessions

Auth:
- Google OAuth via Supabase `@supabase/ssr`
- `luna_redirect_after_login` localStorage key (do not rename)
- `/auth/callback/route.ts` uses async `cookies()`

Supabase:
- Any `user_id` FK joining profile data via JS client must point to `profiles(id)`, not `auth.users(id)`
- `execute_sql` and `apply_migration` execute immediately in production
- Project ID `qhpxejzoxfruuositwzo`

Luna AI architecture (post-upgrade):
- Primary model: Sonnet 4.6 via `createMessageWithFallback()` in `lib/ai-stream.ts`
- Fallback: Haiku 4.5 on pre-stream failures, gated by `NEXT_PUBLIC_AI_FALLBACK_ENABLED`
- Tool-use primary path for mutations: `add_activity`, `remove_activity`, `add_hotel`, `remove_hotel`, `replace_activity`, phase operations
- `%%TRIP_UPDATE%%` text markers remain as legacy fallback path
- Regex for legacy markers runs on complete accumulated response, not individual chunks
- System prompt stable block uses `cache_control: { type: 'ephemeral' }` for prompt caching
- Itinerary generation emits structured JSON via `emit_itinerary` tool (Stage 4)
- Coherence validation pass runs Haiku 4.5 post-generation (Stage 5)

Brand:
- Orange `#FF8210`, navy `#00447B`, plus `#FFBD59`, `#679AC1`, `#6C6D6F`, `#C0C0C0`
- Poppins Bold/Medium/SemiBold for headings, Inter Regular for body
- Lucide React icons only, no emoji anywhere
- No em-dash. Replace with ".", ",", or ":"
- Public brand name is exclusively "Luna Let's Go"

Photo pipeline:
- Unsplash Tier 1 (`UNSPLASH_ACCESS_KEY`)
- Pexels Tier 2 (`PEXELS_ACCESS_KEY`)
- Google Places removed entirely
- Landmark-specific queries outperform generic destination names
- `page` parameter randomized (1-5), results shuffled
- Re-fetch on saved trip load, not from stored URLs

PT-BR translation rules:
- `messages/pt-BR.json` saved as UTF-8 (no BOM)
- Verb "ser": "é" (is), "são" (are), "foi" (was). Never bare "e" when meaning "to be"
- Required accents list (você, não, à, é, está, só, já, grátis, orçamento, opções, sugestões, hotéis, estações, preferências, localização, confiança, distância, alimentação, horários, início, único, próxima, começa, Japão, Tóquio, manhã, almoços, são, família, crianças, econômico, românticas, programação, táxis, até)
- "a" before feminine nouns/names → "à" (à Luna, à viagem)

Affiliate links:
- Booking.com (hotels, flights, cars) — Awin links
- GoWithGuide, Xcaret, Klook, Europcar AU/NZ
- All open in new tabs with `rel="sponsored"`

**Estimated size:** One `.md` file, roughly 12-15 KB.

**Risk:** Low. Documentation only. Worst case: a rule is missing and Claude reverts to looking it up in memory like today.

**Estimated memory savings:** Replaces roughly 60% of what currently lives in `userMemories`. Frees memory for truly dynamic state (current release status, open questions, recent decisions).

---

### 3.3 `luna-diagnostic` — ship third

**Purpose:** The playbook Claude follows when diagnosing a Luna issue.

**Why third:** Depends on the architecture skill knowing what the "right" state looks like. Building it last in Week 1 lets it reference the architecture skill directly.

**Contents (planned):**

The diagnostic ladder (in order):
1. `web_fetch_vercel_url` on the live production URL to see actual rendered HTML / API JSON
2. `list_deployments` + `get_deployment_build_logs` with high `limit` for route structure
3. `execute_sql` on Supabase for state verification
4. Fetch live bundle if needed (GitHub Contents API, not `raw.githubusercontent.com` — that URL is blocked from the sandbox)
5. Reproduce in Node locally before writing any fix

Traps:
- `get_runtime_logs` is unreliable for specific string filtering; use unfiltered broad queries
- `raw.githubusercontent.com` not accessible from sandbox — use GitHub Contents API (base64-encoded)
- For large files, read in line-range chunks to avoid truncation
- Don't guess MCP tool parameter names — call `tool_search` first

When to escalate:
- Three failed hotfixes on the same release → root-cause investigation before hotfix #4
- Symptoms that don't match expected architecture → read the live source, don't trust memory

**Estimated size:** One `.md` file, roughly 4-5 KB.

**Risk:** Very low.

---

### 3.4 `luna-commit-message` — bonus skill (declined for now)

Originally proposed as a small skill locking in commit message format. Wilson's current preference is to not include it this sprint; format is consistent enough today that codifying it isn't urgent. Revisit if drift appears.

---

## 4. Subagents (Week 2)

### 4.1 `luna-qa-agent` — ship first

**Purpose:** Runs a release's smoke test list and reports pass/fail.

**Why first:** Low risk (read and report only), high payback during Collaborative Trips releases. Uses the smoke test format from `luna-prompt-writer` skill.

**Behavior:**
- Reads a smoke test list from a `.md` file or inline spec
- Executes each test (HTTP checks, DB queries, UI checks via headless browser where applicable)
- Reports pass/fail with failure detail
- Does not mutate state, does not commit

**Estimated size:** One `.md` file, roughly 4-5 KB.

**Risk:** Low.

---

### 4.2 `luna-context-updater` — ship second

**Purpose:** Keeps `CLAUDE.md`, `CONVENTIONS.md`, and the heredoc in `scripts/update-context.sh` current.

**Why second:** Addresses a current, measurable pain point. `CLAUDE.md` was last regenerated 2026-04-12 and is 9 days stale per Wilson's own tracking. Every week without this agent = another week of drift.

**Behavior:**
- Reads git log since last context update
- Parses release notes and commit messages
- Merges new entries into the heredoc template in `update-context.sh` (not into `CLAUDE.md` directly, per the existing rule that the heredoc is authoritative)
- Runs `update-context.sh` to regenerate `CLAUDE.md`
- Commits with a clear message

**Estimated size:** One `.md` file, roughly 4-5 KB.

**Risk:** Low-medium. Touches committed files. Must have a dry-run mode for first-week verification.

---

### 4.3 `luna-multilang-qa` — ship third (before translator)

**Purpose:** The three-layer QA pipeline that gates all translation changes. Ships before the translator so the safety net is always in place.

**Why before translator:** If the translator ships first, one careless afternoon = bad PT-BR in production. Building QA first means the net is there from day one.

**Behavior:**

Layer 1 — Deterministic rule checks (instant, free):
- UTF-8 encoding validation (Node check: `node -e "const f=require('./messages/pt-BR.json'); console.log(f.hero.subtitle)"`)
- Accent audit against required list from `luna-architecture` skill
- Bare "e" detection (flags occurrences in "to be" contexts)
- Proper noun preservation ("Luna Let's Go" verbatim, persona names not translated)
- Key parity (every key in `en.json` exists in `pt-BR.json` and `es.json`)
- JSON validity
- Length sanity (translated strings within ±40% of English length)

Layer 2 — Cross-model semantic QA (cheap, fast):
- Haiku 4.5 reviews each translation for accuracy, register match (warm and conversational), idiom appropriateness
- Threshold scoring; below threshold flags for review
- Roughly $0.0001 per string, less than 1 cent for a typical 20-string release

Layer 3 — Screenshot snapshot (optional, major releases):
- Renders key UI surfaces in all three locales
- Takes screenshots for manual eyeball review
- Only runs when > 50 new strings OR Layer 2 flagged issues

Failure handling:
- Any Layer 1 or Layer 2 failure rolls back the translator's commit
- Failed strings written to `translations-needs-review.md` with the English source, the failed translation, and the specific rule violated
- Wilson fixes the handful of flagged strings manually
- QA re-runs on the fix

**Estimated size:** One `.md` file, roughly 6-8 KB. Includes the code snippets for each check layer.

**Risk:** Medium. This is the safety-critical piece. Gets extra verification time in QA before the translator hooks into it.

---

### 4.4 `luna-multilang-translator` — ship fourth

**Purpose:** Auto-translates `messages/en.json` diffs into PT-BR and ES. Writes directly to locale files. Triggers the QA pipeline automatically. Reverts on QA failure.

**Why fourth:** Depends on `luna-multilang-qa` being verified working. Wilson chose Option 3 aggressiveness (full auto-translate) gated by the QA pipeline for safety.

**Behavior:**
- Reads `en.json` diff since last translator run
- Generates PT-BR and ES translations following rules in `luna-architecture` skill
- Writes directly to `messages/pt-BR.json` and `messages/es.json`
- Commits with clear message: `chore(i18n): auto-translate N keys via luna-multilang`
- Invokes `luna-multilang-qa`
- If QA passes: opens a PR, notifies Wilson
- If QA fails: reverts the auto-commit, preserves the failure report, notifies Wilson

**Estimated size:** One `.md` file, roughly 5-6 KB.

**Risk:** Medium, mitigated by QA pipeline acting as a hard gate.

---

### 4.5 `luna-release-writer` — ship fifth (bonus)

**Purpose:** Drafts the `<recent_updates>` bullet format entries for Wilson's `userMemories` after each release.

**Why last:** Small, nice-to-have. Saves token writing time every sprint but not critical to Collaborative Trips velocity.

**Behavior:**
- Reads the latest release's commit range
- Produces a single-line or multi-line entry in the exact bullet format used in `userMemories` `<recent_updates>`
- Outputs to a file Wilson can copy-paste into memory edits

**Estimated size:** One `.md` file, roughly 2-3 KB.

**Risk:** Very low.

---

## 5. Key decisions log

| Decision | Choice | Date | Notes |
|---|---|---|---|
| Ship order: skills first then subagents | Skills first | 2026-04-21 | Interleaved was alternative |
| `luna-architecture` scope | Post-upgrade rules | 2026-04-21 | Dual-path was alternative |
| Multilang agent aggressiveness | Option 3 (auto-translate + auto-commit) | 2026-04-21 | Gated by QA pipeline for safety |
| Build QA before translator | Yes | 2026-04-21 | Same sprint, QA first |
| QA pipeline scope | All 3 layers (deterministic + semantic + screenshot) | 2026-04-21 | +12 hours effort accepted |
| Format for this document | Markdown (not Word doc) | 2026-04-21 | Greppable, lives with other Luna reference docs |
| Delivery cadence | One deliverable at a time | 2026-04-21 | Review before next |
| `luna-commit-message` skill | Deferred | 2026-04-21 | Not urgent, revisit if drift appears |

---

## 6. Ship sequence

| # | Deliverable | Type | Week | Day | Depends on |
|---|---|---|---|---|---|
| 1 | `luna-prompt-writer` | Skill | 1 | 1-2 | Nothing |
| 2 | `luna-architecture` | Skill | 1 | 3-4 | Prompt-writer (format) |
| 3 | `luna-diagnostic` | Skill | 1 | 5 | Architecture (state reference) |
| 4 | `luna-qa-agent` | Subagent | 2 | 6-7 | Prompt-writer (test format) |
| 5 | `luna-context-updater` | Subagent | 2 | 8-9 | Architecture (what's current) |
| 6 | `luna-multilang-qa` | Subagent | 2 | 10-11 | Architecture (PT-BR rules) |
| 7 | `luna-multilang-translator` | Subagent | 2 | 12-13 | Multilang-qa (safety net) |
| 8 | `luna-release-writer` | Subagent | 2 | 14 | Prompt-writer (format) |

---

## 7. Verification checklist per deliverable

Every deliverable gets these checks before moving to the next:

- [ ] File written to `/mnt/user-data/outputs/` with clear name
- [ ] Wilson reviews the `.md` file directly
- [ ] Wilson confirms it covers the planned scope
- [ ] Wilson flags any rules or patterns missing
- [ ] Revisions applied and file re-delivered if needed
- [ ] Wilson marks the deliverable complete
- [ ] Claude updates this sprint document's "status" section (Section 8)
- [ ] Next deliverable begins

---

## 8. Sprint status

*Updated after each deliverable completes.*

| # | Deliverable | Status | Completed | Notes |
|---|---|---|---|---|
| 1 | `luna-prompt-writer` | Shipped | 2026-04-21 | Installed as Claude.ai skill (Option A) |
| 2 | `luna-architecture` | Shipped | 2026-04-21 | Installed as Claude.ai skill (Option A). Description trimmed to 948 chars under 1024 limit. |
| 3 | `luna-diagnostic` | Shipped | 2026-04-21 | Installed as Claude.ai skill (Option A). Description 937 chars. Week 1 skills phase complete. |
| 4 | `luna-qa-agent` | Shipped | 2026-04-21 | Committed to .claude/agents/. Requires Claude Code CLI (not VS Code extension) for agent invocation. YAML description wrapped in double quotes to prevent parser issues. |
| 5 | `luna-context-updater` | Shipped | 2026-04-21 | Committed to .claude/agents/. First write-capable agent. Dry-run ran clean on first invocation, --apply succeeded, diff reviewed and committed by Wilson. |
| 6 | `luna-multilang-qa` | Shipped | 2026-04-21 | Six-file bundle: subagent + 5 script files at scripts/i18n-check/. Layer 1 deterministic + Layer 2 Haiku semantic review. Layer 3 (screenshots) deferred to future v2. Shared modules (accent-rules, haiku-client) designed for reuse by translator. |
| 7 | `luna-multilang-translator` | Shipped | 2026-04-22 | Three-file bundle: subagent + 2 script files at scripts/i18n-translate/. Reuses shared/ modules from #6. Hybrid rollback on QA fail. Batched Haiku translation in one pass per locale. Required follow-up patch: added env-loader.mjs for auto .env.local loading since plain node does not load .env files. |
| 8 | `luna-release-writer` | Shipped | 2026-04-22 | Three-file bundle: subagent + 1 script file at scripts/release-writer/. Marker file .claude/last-memory-update.txt tracks what has been summarized into Claude.ai userMemories. --advance flag moves marker to HEAD only after Wilson confirms paste. First production run: 14 bullets drafted and pasted, marker advanced to 7d9e128d. |

---

## 9. Rollback and fallback

Each deliverable is a standalone `.md` file. Rollback is always: delete the file.

For subagents specifically:
- `luna-qa-agent`: safe to roll back, does not commit
- `luna-context-updater`: must have dry-run mode verified before trusting; if wrong, revert the commit and re-run manually
- `luna-multilang-qa`: the safety net. If it produces false positives, tune thresholds; if false negatives, add rules. Never disable without replacement
- `luna-multilang-translator`: disabling just means Wilson goes back to hand-writing translations. No user-facing impact
- `luna-release-writer`: disabling means Wilson hand-writes memory updates. No user-facing impact

---

## 10. Open questions (populate during implementation)

*Populated as questions arise during implementation. Resolved questions move to Section 5.*

Questions that came up during implementation:

- **Claude Code CLI vs VS Code extension for subagents** — resolved 2026-04-21. The VS Code extension cannot register agents; it requires Claude Code CLI running in a terminal at the project root. All subagent installation notes now include this requirement.
- **`.env.local` not loaded by plain `node`** — resolved 2026-04-22. Next.js auto-loads `.env.local`, but bare `node script.mjs` invocations do not. Added `scripts/i18n-check/shared/env-loader.mjs` as a shared dependency-free loader used by all script pipelines.
- **YAML description apostrophe parsing** — resolved 2026-04-21. Description fields containing `Luna Let's Go` need double-quote wrapping to prevent YAML parsers from choking on the apostrophe. Applied to all subagents.
- **Claude.ai skill description 1024-char limit** — resolved 2026-04-21. The Claude.ai skills UI caps the description field at 1024 characters. Applied to all three skills; all finalized descriptions are under 950 chars for headroom.

---

## 11. Post-sprint

After all 8 deliverables ship and bake for one Collaborative Trips stage:

- Review each skill/subagent for drift, errors, or gaps.
- Refine based on actual Collaborative Trips usage.
- Consider `luna-commit-message` skill if drift appears.
- Consider additional subagents for Collaborative Trips-specific tasks (realtime sync debugger, trip state differ, etc.).

---

## 12. Retrospective (added 2026-04-22)

### Actual timing vs planned

**Planned:** Two weeks, three skills in week 1, five subagents in week 2.
**Actual:** Single session on 2026-04-21 into 2026-04-22. All 8 deliverables shipped in roughly one working day of active collaboration.

The compressed timeline was possible because Wilson was available for rapid review cycles, most decisions had been pre-locked in the initial planning phase, and no deliverable required external blockers.

### What shipped

16 total files across 8 deliverables:

**Skills (Claude.ai, installed via UI):**
1. `luna-prompt-writer` (394 lines)
2. `luna-architecture` (377 lines)
3. `luna-diagnostic` (210 lines)

**Subagents and supporting infrastructure (Claude Code, committed to repo):**

4. `luna-qa-agent` — 1 file (175 lines) at `.claude/agents/luna-qa-agent.md`
5. `luna-context-updater` — 1 file (252 lines) at `.claude/agents/luna-context-updater.md`
6. `luna-multilang-qa` — 6 files:
   - `.claude/agents/luna-multilang-qa.md`
   - `scripts/i18n-check/run-qa.mjs`
   - `scripts/i18n-check/layer1-deterministic.mjs`
   - `scripts/i18n-check/layer2-semantic.mjs`
   - `scripts/i18n-check/shared/accent-rules.mjs`
   - `scripts/i18n-check/shared/haiku-client.mjs`
   - `scripts/i18n-check/README.md`
7. `luna-multilang-translator` — 3 files:
   - `.claude/agents/luna-multilang-translator.md`
   - `scripts/i18n-translate/run-translate.mjs`
   - `scripts/i18n-translate/translate.mjs`
   - `scripts/i18n-translate/README.md`
8. `luna-release-writer` — 3 files:
   - `.claude/agents/luna-release-writer.md`
   - `scripts/release-writer/run-release-writer.mjs`
   - `scripts/release-writer/README.md`

**Follow-up patch** added during sprint:
- `scripts/i18n-check/shared/env-loader.mjs` (auto-loads `.env.local` since plain `node` does not)

### What went well

**Dry-run-first pattern proved out.** `luna-context-updater` shipped cleanly because its first real invocation was a dry-run. Wilson reviewed the proposed changes, approved, and `--apply` did exactly what the dry-run showed. Zero rollback. This pattern became the template for `luna-multilang-translator` and `luna-release-writer`.

**Scripts-as-shared-modules beat inline logic.** Choosing separate script files for Layer 1 and Layer 2 QA (rather than inline shell in the agent prompt) paid off immediately. `scripts/i18n-check/shared/accent-rules.mjs` and `shared/haiku-client.mjs` were imported by both `luna-multilang-qa` AND `luna-multilang-translator` with zero duplication.

**QA-gate-first ordering was the right call.** Building `luna-multilang-qa` before `luna-multilang-translator` meant the translator shipped into a world where auto-writes always passed through a safety gate. The hybrid rollback (revert writes, preserve fail log) never needed to fire in testing, but the architecture guarantees bad PT-BR can't reach `main`.

**First production runs caught real issues without drama.** `luna-context-updater` on its first run correctly identified the 9-day-stale CLAUDE.md plus new architectural entries (deleted pre-locale stubs, new agents). `luna-release-writer` on its first run produced 14 clean bullets in the exact memory format. Neither required Claude to iterate.

### What went wrong

**Surgical `sed` patches on live files wasted time.** When `env-loader` needed to be wired into three existing scripts, I reached for `sed` instead of full-file overwrites. The multi-line paste through zsh duplicated imports, which triggered syntax errors, which triggered more `sed` fixes. Net cost: 30+ minutes and 4 redundant back-and-forths for what should have been one clean overwrite per file.

**Lesson locked in:** For any non-trivial change to an existing script, overwrite the whole file rather than patching surgically. Surgical patches are fine for single-line changes in simple files. Anything touching imports plus function bodies, just rewrite.

**VS Code extension surprise.** The very first `@luna-qa-agent` invocation failed because Wilson was using the Claude Code VS Code extension, which can't register agents (only the CLI can). This wasn't anticipated in the original sprint plan. Every subagent from #4 onward now ships with an installation note flagging this.

**`.env.local` not auto-loaded by `node`.** Another unanticipated gotcha. Next.js loads it automatically, which created a false mental model that plain `node` would too. The fix (`env-loader.mjs`) is now a shared module used by every script pipeline.

### Key lessons for future sprints

1. **Overwrite, don't patch.** For any multi-line edit to an existing file, rewrite the whole file. Surgical `sed` or `str_replace` is only safe for trivial single-line changes.

2. **Plain `node` ≠ Next.js.** Any script run outside the Next.js runtime needs explicit env loading. The env-loader pattern is now canonical for Luna.

3. **Claude Code CLI is the subagent registration surface.** The VS Code extension cannot register agents. Document this in every subagent installation note.

4. **Dry-run defaults keep write-capable agents safe.** Every agent that modifies files (context-updater, multilang-translator, release-writer) defaults to dry-run mode. Writing requires an explicit flag. This is the single best safety pattern from this sprint.

5. **Shared script modules reward the upfront work.** `scripts/i18n-check/shared/` is imported by QA, translator, AND release-writer. Three agents, one set of shared rules. Any future translation-adjacent agent should build on the same shared modules.

6. **Description-field apostrophes need quoting in YAML.** `Luna Let's Go` inside a YAML description field needs double-quote wrapping. Applied across all subagents.

7. **Claude.ai skills have a 1024-char description limit.** Claude Code agents do not. Different size budgets.

### Memory and CLAUDE.md handoff

After sprint completion, two follow-up actions were done by Wilson:

- **`userMemories` updated** via `luna-release-writer` on 2026-04-22. 14 bullets covering the full sprint pasted into `<recent_updates>`. Marker advanced to commit `7d9e128d`.
- **`CLAUDE.md` regenerated** via `luna-context-updater` on 2026-04-21 during the sprint, capturing the first batch of new agent additions. A second regeneration is expected after the full sprint commit history settles.

### What the sprint actually unlocks

The investment this sprint made pays off on the next major build: **Collaborative Trips (~70 hours, 5 stages).** Every Claude Code prompt I write for that build will follow the `luna-prompt-writer` skill format. Every release will be testable via `luna-qa-agent`. Every new UI string will flow through the QA-gated translation pipeline. Every release will produce memory updates via `luna-release-writer`.

Without this sprint, Collaborative Trips would have required ~15 hand-formatted prompts, manual smoke testing, hand-written translations, and hand-written memory bullets. With this sprint, those are automated or codified.

---

## 13. Post-sprint

Now that all 8 deliverables have shipped, the next checkpoints are:

- After the first Collaborative Trips stage ships, review each skill/subagent for drift, errors, or gaps surfaced during real use.
- Refine based on actual Collaborative Trips usage patterns.
- Consider `luna-commit-message` skill if commit-format drift appears.
- Consider additional subagents for Collaborative Trips-specific tasks (realtime sync debugger, trip state differ).
- Monitor Claude Code's subagent features; the ecosystem is evolving fast and new capabilities (memory, parallel execution, agent teams) may justify reworking specific agents.

### 13.1 Proposed quality and security agents (tracked, not actioned)

Discussed 2026-04-22. Three potential additions, deliberately split rather than combined into one mega-agent. Combining quality and security into a single agent was considered and rejected because the two domains require different skills (quality is rule-based and objective, security is contextual and adversarial), and a combined agent would dilute both.

**Sequencing principle:** none of these should be built before Collaborative Trips Stage 1 ships. The existing 8 agents need real production use to prove their value first. Build code-health first, then evaluate before adding the others.

**Proposed agent 1: `luna-code-health` (build first if any)**

Read-only orchestrator over existing tools (TypeScript, ESLint, knip, Next.js bundle analyzer). Reports:
- Unused exports across the codebase
- Files not imported anywhere (dead modules)
- Duplicate component patterns
- API routes with no client callers
- Hidden type errors and lint warnings
- File structure and naming convention drift
- Bundle size analysis per route

Effort estimate: 4-6 hours. Pattern matches `luna-multilang-qa`. Highest signal-to-effort ratio of the three.

**Proposed agent 2: `luna-security-audit` (build only if agent 1 proves valuable)**

Read-only deliberate security pass, not continuous monitoring. Reports:
- API routes with missing auth checks
- Hardcoded secrets (regex scan against repo)
- Supabase RLS policy audit for tables with `user_id`
- CSP header verification in `proxy.ts`
- `dangerouslySetInnerHTML` usage and sanitization patterns
- Endpoints handling user input without rate limiting
- OAuth callback handling against known abuse patterns

Explicitly NOT in scope:
- Real-time monitoring (use SaaS for that)
- Penetration testing (specialized tool category)
- Dependency CVE scanning (use `npm audit` and Dependabot)

Effort estimate: 6-8 hours. Wider research needed because security tooling has a broader ecosystem.

**Proposed agent 3: `luna-frontend-audit` (build only if 1 and 2 prove valuable)**

Read-only UI consistency pass. Reports:
- Hardcoded brand colors that should use CSS vars
- Hardcoded English strings that should be in `messages/en.json`
- Components missing accessibility attributes
- Images without `alt` text
- Buttons without proper semantics
- Hardcoded font sizes that should use the type scale
- Inline styles that should be extracted

Effort estimate: 4-6 hours. Lower priority because next-intl and visual review catch most of these naturally.

**Decision gate for actioning these:** after Collaborative Trips Stage 1 ships and the existing 8 agents have been used in real release cycles, evaluate whether the existing agents are paying off as expected. If yes, build `luna-code-health` next. If the existing agents need refinement first, do that before adding more surface area.

---

*End of reference document. Sprint shipped 2026-04-22. All 8 deliverables live in the ai-travel-planner repo at `.claude/agents/` and `scripts/`. Retrospective in Section 12 captures what shipped, what went well, what went wrong, and lessons locked in for future sprints. Section 13.1 tracks three proposed quality and security agents for post-Collaborative-Trips evaluation.*
