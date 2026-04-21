# POST-R6-CHANGELOG.md

Durable release log for Luna Let's Go. Each entry: commit hash, deployment ID, UTC timestamp, summary, files touched.

Append new releases to the TOP of the list. Oldest at the bottom.

---

## R5.1 hotfix #1 · Cascade phase range edits + remove dismiss X

- **Commit:** `5f800c29`
- **Deployment:** `dpl_GPSMCNTah6LbnpoToMT2bsEWvewx`
- **Shipped:** 2026-04-21 07:14 UTC
- **Files:** `components/EditableItinerary.tsx`, `components/PhaseCard.tsx`

Two user-reported bugs after R5.1 final:

Editing a phase's day range was rejecting overlaps with a toast error instead of cascading into the adjacent phase. Replaced `validatePhaseRange` with `analyzeRangeEdit` returning a tagged union (`ok-no-cascade` | `ok-with-cascade` | `error`). `updatePhaseRange` became async: when cascade detected, shows a confirm dialog, atomically updates both phases, reassigns the moved day's `phase_id`, and fires `/api/regenerate-day` for moved days that have activities using the new phase's label + summary + highlights as context.

Medium-mode phase cards had both a dismiss X (hide all phases) and a delete trash (delete this phase) as small icons side-by-side. Users confused them. Removed the dismiss X entirely. If "hide phase grouping" is needed again, it belongs outside the phase card.

---

## R5.1 final · Interleaved phase+day layout + inline editing + Add phase button

- **Commit:** `3709584202`
- **Deployment:** `dpl_3GFCoJeePivwYjW2SoLN9JwADX3p`
- **Shipped:** 2026-04-21 07:07 UTC
- **Files:** `components/EditableItinerary.tsx`, `components/PhaseCard.tsx`, `components/AddPhaseButton.tsx` (new), `components/RangeSummaryCard.tsx` (new)

Day cards render UNDER their parent phase (indented, sorted by `dayFrom`), not in a flat list at the bottom. Each phase group is: `PhaseCard → day cards belonging to that phase`. Collapsed phases hide their day cards via `display:none` (state preserved).

Phase cards gained inline editing: click the label to rename, click the day-range badge to edit day_from / day_to via number inputs. Validation: no overlap with sibling phases, must stay within trip bounds, `from <= to`.

Each phase card has a "Plan these days" / "Regenerate" button (always visible; confirm dialog when regenerating over existing days).

Each phase has a Delete button. Days inside a deleted phase lose their `phase_id` but are not deleted.

New `+ Add phase` button below the last phase lets users create an empty phase from medium or long trip modes. New phase opens inline editor immediately for the label.

`validatePhaseRange` helper prevents overlap and OOB edits. `renderDayCard` extracted as a component-level function (fixes a broken IIFE pattern from the base commit).

---

## R5.1 base · Phase + day collapse, compact day cards, range summary

- **Commit:** `3d6d88b3`
- **Deployment:** `dpl_GYey2RA4B9XSjPE8NnMiLzPKhMGp`
- **Shipped:** 2026-04-21 06:14 UTC
- **Files:** `components/EditableItinerary.tsx`, `components/PhaseCard.tsx`

Phase cards gained a manual expand/collapse caret. Default expanded. Collapsed state hides day cards via `display:none` — day state preserved. State lifted to `EditableItinerary` via `collapsedPhaseIds: Set<string>`; PhaseCard is presentational.

Day cards gained a manual expand/collapse caret. Default expanded for short trips (1-6 days), default collapsed for medium and long trips to reduce vertical scroll on multi-day itineraries.

Day cards lost their hero photos entirely. They became compact text bars with badge + title + date + activity count. Phase card hero photos and trip-level photo strip remained unchanged.

Long-trip phases with no fetched days now show a single compact range summary card ("Days 8-14: Label · N days · Plan these days") instead of empty space. Once expanded, the summary disappears and real day cards populate.

Diagnostic log added in `/api/expand-phase` route: `[expand-phase] phase=X requested=Y received=Z` to track day count emission for the Bali 45-day discrepancy investigation.

---

## R6 hotfix #2 · Narrow tools by trip length + branch route prompt by mode

- **Commit:** `163c4aa6`
- **Deployment:** `dpl_3vmKGd6RTLqnp94HPEcBJyHkg2KC`
- **Shipped:** 2026-04-21 04:13 UTC
- **Files:** `lib/ai.ts`, `app/api/generate/route.ts`

Two compounding bugs from the R6 original:

`buildGenerateTools` returned `[DEFINE_PHASE_TOOL, DEFINE_DAY_TOOL]` for all trips `>= 7` days. Long trips had `define_day` available despite the prompt saying "do NOT call define_day". Narrowed the tool array so long trips receive `[DEFINE_PHASE_TOOL]` ONLY. Medium trips keep both tools. Short trips get `[DEFINE_DAY_TOOL]` only.

`buildStructuredItineraryInstruction` in `app/api/generate/route.ts` overrode the carefully-branched prompt from `buildTravelPrompt` with a single weak generic instruction telling the model to "call define_day for each day". Long trips received this weak prompt with only a footnote suggesting `define_phase`. Branched `buildStructuredItineraryInstruction` into long / medium / short modes matching the tool array. Long branch repeats the "do NOT call define_day" instruction at top, middle, and end.

For prompt-mode (homepage search bar), `buildTravelPrompt` is never called; the route's local instruction is the ONLY itinerary guidance the model sees. The mode-aware version replaces the weak default there too.

Resolved: 10-day Rio showed zero phases → now shows 2-3 phase headers. 20-day Rio showed 1 phase + Day 1 activities + Vercel timeout → now phase-only, no timeout.

---

## R6 original · Unified phase experience across trip lengths

- **Commit:** `bd67282e`
- **Deployment:** `dpl_5aVZvEb3Jn8t8q7p1vJWpBeE8YXq`
- **Shipped:** 2026-04-21 03:52 UTC
- **Status:** broken — superseded by hotfix #2 above
- **Files:** `lib/ai.ts`, `app/api/generate/route.ts`, `types/index.ts`, `components/EditableItinerary.tsx`, `components/PhaseCard.tsx`, `app/[locale]/plan/page.tsx`

Introduced trip-length-mode classification: short (1-6 days), medium (7-14), long (15+).

`buildGenerateTools` now includes `define_phase` for all trips `>= 7` days (BUG: should have removed `define_day` for long trips).

`TripLengthMode = 'short' | 'medium' | 'long'` exported from `types/index.ts`.

`tripLengthMode` prop threaded through `EditableItinerary` → `PhaseCard`.

UI supported three modes visually, but generation path did not narrow tools per mode.

---

## R5 hotfix #4 · Phase editing `%%TRIP_UPDATE%%` formats in chat prompt

- **Commit:** `1b1b30e`
- **Deployment:** `dpl_JDNbZhEU4pdFZA5eYhu8CjDi3b4g`
- **Shipped:** 2026-04-21 02:01 UTC
- **Files:** `lib/ai.ts` (new `LUNA_CHAT_STATIC_PROMPT` constant), `app/api/chat/route.ts` (now imports the constant via `buildLunaChatSystemBlocks`)

Three prior R5 hotfixes were treating symptoms. The actual root cause: the chat system prompt contained `%%TRIP_UPDATE%%` formats for activities and hotels but ZERO formats for phase editing. Luna received the Trip Phases context block (verified by hotfix #3 logs) but had no instruction or format connecting phases to any action, so she improvised "I don't see any phases."

Two edits to `LUNA_CHAT_STATIC_PROMPT`:
- After the hotel Rules block: added four phase formats (edit_phase, split_phase, merge_phases, reorder_phases) with correct TripUpdate field names (phaseId, splitAtDay, phaseA/B, phaseIdA/B, mergedPhase, orderedPhaseIds), explicit phase_id copy-verbatim instructions, and a worked rename example.
- MANDATORY OUTPUT RULE section: added the same four phase formats so Luna sees them in the final mandatory block she always reads.

Resolved: "Rename phase 1 to Food Vibes" in chat now works. Luna emits the correct `%%TRIP_UPDATE%%` block, client dispatches `edit_phase`, phase card re-renders with new label.

---

## R5 hotfix #3 · Instrumentation + cache-bust on /plan HTML

- **Commit:** `4b953d4`
- **Deployment:** `dpl_4H2dbHdPaJEtbXFpdPJ2yNWHBBsE`
- **Shipped:** ~2026-04-20 late UTC
- **Status:** partial fix; superseded by hotfix #4

Instrumentation: added `[FloatingChat] getPhases() returned length: N firstId: phase-M` and `[FloatingChat] phase context injected ctx length: N phases: K` diagnostic logs to verify phases were reaching the chat API.

Cache-bust: added `cache-control: private, no-cache, no-store, max-age=0, must-revalidate` to `/plan` HTML response in `next.config.ts` to ensure fresh bundle served after deploys.

Logs proved: client sent 20376-char trip context with 5 phases. Server received it. Luna still confabulated "I don't see any phases." This pointed directly to the system prompt as the missing link — fixed in hotfix #4.

---

## R5 hotfix #2 · Trip context injection into chat

- **Commit:** `e631e87`
- **Status:** partial fix; superseded by hotfix #4

Added trip context (phases list with IDs, day counts, activity counts) to Luna chat via `FloatingChat` → `tripContext` prop → `/api/chat` POST body → system prompt injection.

User feedback: "still doesn't work" — Luna saw the context but couldn't act on it because the system prompt didn't teach her the `%%TRIP_UPDATE%%` phase editing formats (that was hotfix #4's fix).

---

## R5 hotfix #1 · Feature flag fix

- **Commit:** `bc40d0b`
- **Status:** partial fix; superseded by hotfix #4

Feature flag `NEXT_PUBLIC_PHASE_EDITING_ENABLED` was gating phase editing in `lib/ai.ts` but the chat route didn't import from `lib/ai` — it had its own inline system prompt. The flag never actually reached the chat path. Hotfix corrected the flag's scope but didn't fix the underlying architectural gap (chat route using inline prompt instead of shared constant) — that came in hotfix #4.

---

## R5 original · Phase editing in Luna chat

- **Commit:** `fb2bfa3`
- **Deployment:** `dpl_7GRZfybbFDp8VamwPxY7P25kdA9Q`
- **Shipped:** 2026-04-20 ~morning UTC
- **Status:** client side only — server prompt was never updated
- **Files:** `components/FloatingChat.tsx` (tool-use converter), `app/[locale]/plan/page.tsx` (`onTripUpdate` dispatcher for `edit_phase`, `split_phase`, `merge_phases`, `reorder_phases`), `components/EditableItinerary.tsx` (imperatives: `editPhase`, `splitPhase`, `mergePhases`, `reorderPhases`, `removePhase`)

Added phase editing tool definitions to `lib/ai.ts` (`LUNA_PHASE_EDITING_TOOLS`) and wired up the client side completely. The chat route was expected to use these tools but never did — see `AI-PATHS.md` Pitfall 1. Required four hotfixes to fully ship.

---

## R4 · Single-day regeneration

- **Commits:** `b13c8ee` / `f54c7ab`
- **Deployment:** `dpl_Fr47tzNaXuAvRTysjHn2cNXzg8J7`
- **Shipped:** 2026-04-19
- **Files:** `app/api/regenerate-day/route.ts` (new), `app/api/expand-phase/route.ts` (regenerate mode), `components/EditableItinerary.tsx`, day-card regen button, phase three-dot menu regen

"Regenerate this day" affordance on day cards. Phase-aware: regen uses the day's phase label/summary/highlights as context so the new day stays thematically consistent. Used later by R5.1 hotfix #1's cascade flow.

Feature flag: `NEXT_PUBLIC_REGENERATION_ENABLED` (default ON).

---

## R3 · Slot hours canonicalization

- **Commit:** `6d95800`
- **Deployment:** `dpl_9yG3zvq2nvjwxB9RLtdMNZhfPkGt`
- **Shipped:** 2026-04-18
- **Files:** `lib/ai.ts` (`SLOT_HOURS` constant, `formatSlotHours`)

Single-source-of-truth for time-of-day slot definitions per LUNA-UPGRADE-PLAN.pdf Section 5:
- Morning: 6am–12pm
- Afternoon: 12pm–6pm
- Evening: 6pm–9pm
- Night: 9pm–6am

`formatSlotHours(slot)` displays them consistently. Never hard-code slot time strings.

---

## R2-A · `parsePromptContext`

- **Commit:** `83b1868`
- **Deployment:** `dpl_E5RZzbeMvvfn8Nk5j296Z5Uzjbm4`
- **Shipped:** 2026-04-17
- **Files:** `lib/ai.ts` (`parsePromptContext`)

Extracts structured trip context (adultAges, childrenAges, styles, notes, arrival/departure times) from natural-language prompt strings (the homepage search bar input). Used by the generate route to feed the Stage 4 Rules block when no validated form data exists.

---

## R1 · Stage 4 Rules block

- **Commit:** `b4edd18`
- **Deployment:** `dpl_8214fXggr9XYZh75sfjVJ26Az48c`
- **Shipped:** 2026-04-17
- **Files:** `lib/ai.ts` (`buildStage4RulesBlock`)

Injects an audience-aware rules block into every generate prompt. Covers child age sensitivity, adult-only-under-21 alcohol restrictions, arrival/departure time honoring, travel-style filtering, and notes propagation. Prompt-level ancestor of what LUNA-UPGRADE-PLAN.pdf Stage 5 (coherence pass) was meant to enforce post-hoc.

Feature flag: `NEXT_PUBLIC_STAGE4_RULES_ENABLED` (default ON).

---

## Release numbering conventions

- **R<N>** — major release from the post-LUNA-UPGRADE-PLAN roadmap.
- **R<N>.<m>** — minor follow-up release (e.g. R5.1 for UX polish on top of R5).
- **R<N> hotfix #<k>** — bugfix for the most recent R<N> or R<N>.<m> release. Numbered per parent release.

---

## What's next (not yet shipped)

Tracked in project memory + session briefs. In order:

1. **Stage 5 (PDF plan)** — Haiku coherence pass. Decision pending: build / build-light / skip.
2. **Frankfurter CORS fix** (~30 min) — Budget tab currency conversion.
3. **Locale-switch-wipes-trip polish** (~2h, pre-launch) — localStorage transfer key.
4. **Skills + subagents sprint** — deferred to separate projects per Wilson decision.
5. **Collaborative Trips** (~70h) — spec in `COLLABORATIVE-TRIPS-PLAN.md` v1.1.

---

Last updated: 2026-04-21 after R5.1 hotfix #1.
