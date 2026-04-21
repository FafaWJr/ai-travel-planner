# Luna Skills & Subagents Sprint

**Reference document for the Luna skills and subagents implementation sprint.**

Prepared for Wilson, Luna Let's Go. April 2026.
Last updated: 2026-04-21.

---

## Purpose of this document

This is the single source of truth for the Luna skills and subagents sprint. It captures every decision made during planning so we don't re-litigate anything during implementation. Refer back to this document at the start of each phase.

If a decision here conflicts with something said mid-implementation, this document wins unless explicitly updated.

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
| 1 | `luna-prompt-writer` | Not started | — | — |
| 2 | `luna-architecture` | Not started | — | — |
| 3 | `luna-diagnostic` | Not started | — | — |
| 4 | `luna-qa-agent` | Not started | — | — |
| 5 | `luna-context-updater` | Not started | — | — |
| 6 | `luna-multilang-qa` | Not started | — | — |
| 7 | `luna-multilang-translator` | Not started | — | — |
| 8 | `luna-release-writer` | Not started | — | — |

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

- None at sprint start.

---

## 11. Post-sprint

After all 8 deliverables ship and bake for one Collaborative Trips stage:

- Review each skill/subagent for drift, errors, or gaps.
- Refine based on actual Collaborative Trips usage.
- Consider `luna-commit-message` skill if drift appears.
- Consider additional subagents for Collaborative Trips-specific tasks (realtime sync debugger, trip state differ, etc.).

---

*End of reference document. Update Section 5 decisions log, Section 8 status table, and Section 10 open questions as the sprint progresses.*
