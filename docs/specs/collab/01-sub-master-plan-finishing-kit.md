# Luna Collaborative Trips: Sub-Master Plan (Finishing Kit + Remaining Stages)

**Tier 1.5 sub-master plan**
**Version:** 1.0
**Date:** 27 April 2026
**Last updated:** 27 April 2026
**Maintainer:** Wilson
**Linked from:** `docs/specs/collab/00-master-plan.md` (Tier 1, v2.1)
**Status:** Active. Items #3 through #11 reopened on 27 April 2026 after the recovery track (R1 + R2 + R4) closed. Item #1 shipped. Item #2 superseded by R1. See `docs/specs/collab/02-recovery-plan-april-27-regressions.md`.

---

## 0. Purpose

The Tier 1 master plan (`00-master-plan.md`) defines the six-stage architecture for Luna Collaborative Trips. By 27 April 2026, Stages 0, 1, and 2 had shipped to production, but Stage 2 left several deliverables untested and two UX gaps surfaced after the saved-trip-load detour:

1. The CSS for `.plan-section` paragraphs lost vertical margins, flattening every bold sub-header in the Overview, Weather, Transport, and Tips tabs (regression discovered 27 April).
2. The Stage 1 InviteModal Copy buttons have no success feedback (no "Copied" state, no animation), confirmed via live browser inspection 27 April.

This sub-master plan tracks the finishing kit (Tracks A, B, C below) plus the remaining master-plan stages (3, 4, 5) as a single ordered checklist with status per item. It is the single source of truth for "what is left to ship."

When this document and the Tier 1 master plan disagree on stage scope, the master plan wins. When this document and `CURRENT_STATUS.md` disagree on what has shipped, this document wins (it is the more detailed tracker; `CURRENT_STATUS.md` is the executive summary).

---

## 1. Tracking convention

Every item below has one of four statuses:

- `[ ]` Pending: not started.
- `[~]` In progress: prompt written, not yet shipped or smoke tests not yet passed.
- `[x]` Done: shipped to production, smoke tests pass, recorded in commit history.
- `[!]` Blocked: cannot proceed without something else (note the blocker).

When an item ships, update the row with the commit SHA, the date, and tick the box. Update `CURRENT_STATUS.md` in the same commit.

---

## 2. The eleven items, in execution order

### Track C: Stage 1 polish (Copy link UX)

- `[x]` **#1. Copy link feedback motion** (`luna-copy-link-ux.md`, ~1.5h, very low risk)
  Adds a "Copied" state with brief animation to both Copy buttons in InviteModal (editor link and viewer link). Includes 1.5s reset timer, accessible aria-live announcement, and EN / PT-BR / ES translations for the new string. Single component touched.
  Commit: `ceacd6fa`  Date: 27 April 2026

### Track B: Format restore (CSS regression from detour aftermath)

- `[!]` **#2. Restore prose spacing in `.plan-section`** (`luna-prose-format-restore.md`, ~1.5h, very low risk)
  **Status:** SUPERSEDED BY R1 (`luna-r1-sanitize-html-style-allowlist.md`, commit `69d271d5`, 27 April 2026).
  **Why:** This item was based on a wrong root-cause diagnosis (a missing `<style jsx>` block for `.plan-section`). The actual cause was sanitize-html stripping inline styles by default after commit `2a791e34` swapped libraries. R1 fixed the real root cause: an explicit allowlist in `PLAN_SANITIZE_CONFIG`. Do not pursue the original CSS-regeneration approach. The styles were never missing from `markdownToHtml`'s output; they were being stripped at sanitization time. See `docs/specs/collab/02-recovery-plan-april-27-regressions.md` Regression 1 for full diagnosis.
  Original prompt scope is preserved above for archival reference. Do not execute.

### Track A: Stage 2 finishing kit (close out master plan Stage 2)

**Track A status (#3 through #7):** Reopened 27 April 2026 after the recovery track (R1 + R2 + R4) closed. These items were paused during the recovery track per the original recovery plan ordering. Original execution order preserved. **#3 done 28 April 2026.**

- `[x]` **#3. Verify second realtime flag** (`luna-stage2-finish-flag-check.md`, ~30m, very low risk)
  Confirms `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` exists, defaults to true, and gates the realtime subscribe path correctly. **Outcome C** (already correctly wired); only `.env.example` documentation line added plus test report. Test report: `docs/specs/collab/test-reports/stage2-finish-3-flag-check.md`. Live multi-browser smoke tests 1–4 deferred to Wilson runtime QA; source-level verification confirms both subscribe-side (`hooks/useCollaborativeTrip.ts:466`) and broadcast-side (`hooks/useCollaborativeTrip.ts:363`) early-return when `enabled === false`.
  Commit: (this commit)  Date: 28 April 2026

- `[x]` **#4. Patch coverage QA** (`luna-stage2-patch-coverage-qa.md`, ~3h, medium risk)
  Walks through the patch types coded but never triggered in production. Source-level pre-flight done 28 April 2026: the canonical patch library is 21 types. Of the 14 untriggered types, **7 are dead by design or deferral** and require no exercise. The 7 LIVE targets each had a per-type test card.
  **Live exercise produced 4 hotfixes:** Stage 2f hotfix #5 / #5b (Luna phase context), #6 (merge_phases broadcast), #7 / #7b / #7c (remove_activity matching), #8 (cross-slot drag broadcast). Card 1 (replace_activity cross-slot) shipped with hotfix #8 commit `fa4ddca6` on 29 April 2026; root cause was `handleDragOver` mutating slot mid-drag and hiding the cross-slot intent from `handleDragEnd`. Card 3 (remove_activity) shipped with hotfix #7c commit `6e5e8781` on 29 April 2026; switched to position-based `activityIndex` matching after three text-based attempts failed against Luna's paraphrasing.
  Test report: `docs/specs/collab/test-reports/stage2-finish-4-patch-coverage-qa.md` (Card 1 evidence captured).
  All 14 LIVE patch types now have shipped emit paths; 7 dead types classified.
  Static-pass commit: 28 April 2026 (sub-master plan)  Hotfixes raised: 5, 5b, 6, 7, 7b, 7c, 8  Closed: 29 April 2026

- `[x]` **#5. Viewer tier end-to-end QA** (`luna-stage2-viewer-tier-qa.md`, ~1h, low risk)
  Source-level pre-flight 29 April 2026 found strong API enforcement and weak UI gating. Hotfix #9 shipped 29 April 2026 (commit `0f6ef49d`) to close the UI gap. All viewer UI checks (V-UI-1 through V-UI-10) PASSED in Wilson's live exercise. Editor regression (V-REG-1, V-REG-2) PASSED. Note: Luna chat 502s observed during this QA pass; tracked separately as a known issue (see CURRENT_STATUS.md). Not viewer-specific and unrelated to hotfix #9.
  Test report: `docs/specs/collab/test-reports/stage2-finish-5-viewer-tier-qa.md`.
  Static-pass commit: `e57631f9`  Live-pass commit: `0f6ef49d`  Date: 29 April 2026  Hotfixes raised: 9

- `[x]` **#6. Reconnect replay QA** (`luna-stage2-reconnect-qa.md`, ~1h, low risk)
  Source-level pre-flight 29 April 2026 mapped the reconnect-replay path end to end (`backfillFromApi`, SUBSCRIBED handler, gap detection, seq tracking). Live exercise: R-1 (simple disconnect, three mutations) PASS, R-2 (no-changes edge case) PASS, R-3 (rapid burst of five mutations) PASS, R-4 (backgrounded tab) carry-forward as Phase 2 item 4 (visibilitychange listener). Test report: `docs/specs/collab/test-reports/stage2-finish-6-reconnect-replay-qa.md`.
  Static-pass commit: `0faff17d`  Live-pass commit: (this commit)  Date: 30 April 2026  Hotfixes raised: 0

- `[x]` **#7. Formal Stage 2 QA pass** (`luna-stage2-formal-qa-pass.md`, ~1h, very low risk)
  Final Stage 2 verification gate. Maps all 14 master-plan checks to evidence from finishing kit items #3 through #6 plus the Stage 2f hotfix arc. **12 PASS, 1 PASS with documented limitation (check 6 / R-4 tab refocus), 1 N/A by design (check 12 / `expand_phase` is per-user UI state).** Six known limitations carried forward, none security issues. Test report: `docs/specs/collab/test-reports/stage2-finish-7-formal-qa-pass.md`.
  Commit (test report): (this commit)  Date: 30 April 2026

### Bookkeeping before Stage 3

**Bookkeeping + Master plan stages status (#8 through #11):** Reopened 27 April 2026. Queued behind Track A items #3 through #7 per the original execution order.

- `[ ]` **#8. CLAUDE.md regen** (`luna-claude-md-regen.md`, ~30m, very low risk)
  Catches up `CLAUDE.md` and `CONVENTIONS.md` with the Stage 2f hotfix arc, the destructive-PATCH guard, the SSR fix, the saved-trip-load fix, this sub-master plan, and any patch types that surfaced through Tracks A.4 / A.5 / A.6 above. Runs the existing `./scripts/update-context.sh`.
  Commit: __________  Date: __________

### Master plan stages

- `[ ]` **#9. Stage 3: Per-user collaborative Luna chat** (`luna-collab-stage-3.md`, ~10h, low risk)
  Per master plan section 4 Stage 3. Per-user chat threads, viewer-readonly Luna (mutation tools stripped server-side), cross-awareness summary at end of system prompt, `chat_history` shape migration with dual-read pattern, third feature flag `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED`. Preserves prompt caching by appending the awareness summary at the end.
  Commit: __________  Date: __________

- `[ ]` **#10. Stage 4: Comments + My Trips + UX polish** (`luna-collab-stage-4.md`, ~18h, low-medium risk)
  Per master plan section 4 Stage 4. Comments on activities, days, phases, hotels (4 target types). Comment API routes, realtime broadcast as patches, orphan handling on `original_day_id`, count aggregation. My Trips two-section layout (owned + shared) with role badges. CollabToast, leave trip flow, owner dashboard, PDF export collaborator line, mobile responsive audit at 375 / 768 / 1280.
  Commit: __________  Date: __________

- `[ ]` **#11. Stage 5: Landing page + launch** (`luna-collab-stage-5.md`, ~6h, very low risk)
  Per master plan section 4 Stage 5. "Plan Together" homepage section, OG image route at `/api/og/trip/[tripId]`, SEO metadata, flag flip `NEXT_PUBLIC_COLLAB_ENABLED=true` in production, 48h Supabase Realtime monitoring window.
  Commit: __________  Date: __________

---

## 3. Effort estimate

| Item set | Items | Estimated effort |
|---|---|---|
| Track C polish | #1 | 1.5h |
| Track B polish | #2 | 1.5h |
| Track A finishing kit | #3 to #7 | 6.5h |
| Bookkeeping | #8 | 0.5h |
| Stage 3 | #9 | 10h |
| Stage 4 | #10 | 18h |
| Stage 5 | #11 | 6h |
| **Total remaining** | 11 items | **~44h** |

Down from the 78.5h in the original master plan because Stages 0, 1, and 2 are largely shipped.

---

## 4. Order rationale

1. Polish first (#1, #2): smallest, most visible, builds confidence after the long detour day.
2. Finishing kit next (#3 to #7): closes Stage 2 gaps before Stage 3 starts on top of it. Better to surface latent Stage 2 bugs now, while we still remember the architecture, than during Stage 3 development.
3. Bookkeeping (#8): keeps me on track in future sessions. The single highest-leverage hour we can spend before Stage 3.
4. Master plan stages (#9, #10, #11): in the order the master plan defines.

Items #1 and #2 can be shipped on the same day. Items #3 to #7 take roughly a week of part-time exercise. Items #9, #10, #11 are the bulk of the remaining work.

---

## 5. Per-prompt handoff protocol

Each item below ships as a single Claude Code prompt file in `/mnt/user-data/outputs/`. Wilson runs the prompt locally, reviews changes, runs smoke tests, commits, and pushes. Then this document and `CURRENT_STATUS.md` are updated in the same commit.

Claude writes prompts one at a time. The next prompt is not written until the previous has shipped and Wilson confirms it works in production.

This protocol is intentional: it keeps the active context narrow, prevents the eleven-prompt-batch problem, and gives Wilson a natural checkpoint between every item.

---

## 6. Cross-cutting notes

**Detours during this sub-plan.** If a production hotfix is needed mid-track (as happened twice on 27 April), it gets logged in `CURRENT_STATUS.md` under "Recent detours" with a commit SHA. The current sub-master plan item is paused (not abandoned) and resumes after the hotfix ships. No item below is silently dropped.

**QA subagent.** Items #4, #5, #6, #7 produce test reports rather than code changes. The formal subagent QA pass at #7 references the 14 numbered checks in master plan section 4 Stage 2.

**Multilingual.** Items #1 (one new string), #9, #10, #11 require `luna-multilang-translator` subagent passes per master plan section 7. Items #2 to #8 have no user-visible string changes.

**Master plan checkpoints.** Master plan section 6 mandates a `luna-context-updater` subagent pass after every stage merge. That cadence applies to items #9, #10, #11.

---

## 7. Outcomes

When all eleven items are ticked off:

- Stage 2 will be fully verified, not just shipped.
- The two UX regressions discovered 27 April will be closed.
- `CLAUDE.md` will be current.
- Stages 3, 4, and 5 of the master plan will be shipped in production.
- The collab feature will be live with the flag flipped to `true`.

At that point this sub-master plan can be archived, marked superseded by the next sub-plan if there is one, or closed as complete.

---

*End of sub-master plan v1.0. Linked from Tier 1 master plan section 11 step 5.*
