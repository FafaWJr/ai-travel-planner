# Stage 2 Finishing Kit #4: Patch coverage QA test report

**Date (static analysis pass):** 28 April 2026
**Verified by:** Claude (static analysis); live multi-browser exercise pending Wilson runtime QA.
**Status:** **STATIC PASS / LIVE PENDING.** Source-level pre-flight is complete. The 7 live untriggered patch types each have a per-type test card ready to execute below. Wilson runs the cards on a two-browser session against the chosen test trip, then fills in PASS/FAIL evidence per card. The 7 dead patch types are documented and require no exercise.

This report is structured so Wilson can either execute the cards inline (pasting evidence as he goes), OR run the cards and ask Claude to amend this report with the captured evidence. Either path closes #4.

---

## 1. Patch library snapshot (canonical)

Source: `lib/trip-patches.ts:41-69`. Total: **21 types.**

```
// Activity ops (7)
add_activity, remove_activity, replace_activity, accept_activity,
unaccept_activity, decline_activity, reorder_activities_in_slot

// Note ops (3)
add_note, update_note, remove_note

// Hotel ops (2)
add_hotel, remove_hotel

// Phase ops (4)
edit_phase, split_phase, merge_phases, reorder_phases

// Budget (1)
update_budget

// R6 long-trip expansion (1)
expand_phase

// Comments, Stage 4 deferred (3)
add_comment, edit_comment, delete_comment
```

Memory's "21 as of 27 April" is confirmed. Sub-master plan #4's contextual list of 11 names was incomplete (predates the 2026-04-26 Stage 2f hotfix #3 commit `2f9ae017` which added `decline_activity` and `reorder_activities_in_slot`); the source enumeration above is authoritative.

---

## 2. Production coverage at start of QA (28 April 2026)

| Action | Hits | Last seen UTC |
|---|---|---|
| `reorder_activities_in_slot` | 10 | 2026-04-27 06:25 |
| `accept_activity` | 9 | 2026-04-27 10:27 |
| `decline_activity` | 5 | 2026-04-27 04:43 |
| `add_activity` | 5 | 2026-04-27 06:25 |
| `update_note` | 2 | 2026-04-26 10:15 |
| `add_note` | 2 | 2026-04-26 10:31 |
| `edit_phase` | 2 | 2026-04-27 10:27 |

(Replicated from prompt context; Wilson can refresh by running the SQL in section 6 below.)

**Triggered: 7. Untriggered: 14.**

---

## 3. Untriggered set and dead-patch-type analysis

### 3a. Live untriggered types (7), Wilson exercise targets

These have at least one emit call site in source. They have not produced a production row but ARE expected to fire when the right UI affordance is exercised.

| Type | Emit call site | UI affordance to trigger |
|---|---|---|
| `remove_activity` | `components/EditableItinerary.tsx:988` (inside `removeActivityById` ref method) | Triggered via Luna chat tool call (`remove_activity`). No direct UI button currently invokes the ref method. **Easiest exercise: ask Luna to remove a specific activity.** |
| `replace_activity` | `components/EditableItinerary.tsx:1022` (replaceActivityById ref) AND `components/EditableItinerary.tsx:1282` (handleDragEnd cross-slot) | **Easiest exercise: drag an activity from one time slot (e.g. morning) to another (e.g. afternoon) on the same day.** |
| `unaccept_activity` | `components/EditableItinerary.tsx:1347` (setActivityStatus toggle) | **Click an already-accepted activity to toggle it back to pending.** |
| `remove_note` | `components/EditableItinerary.tsx:1076` (setNoteForDay with empty string) AND `components/EditableItinerary.tsx:1478` (handleNoteChange empty path) | **Open a day with an existing note, clear the note textarea entirely (delete all characters).** |
| `split_phase` | `components/EditableItinerary.tsx:891` (splitPhase ref) AND `components/FloatingChat.tsx:245` (Luna tool dispatch) | **Easiest: ask Luna in chat: "split phase 1 after day 3".** Or use AddPhaseButton inline phase split UI. |
| `merge_phases` | `components/EditableItinerary.tsx:933` (mergePhases ref) AND `components/FloatingChat.tsx:261` | **Easiest: ask Luna: "merge phases 1 and 2".** |
| `reorder_phases` | `components/EditableItinerary.tsx:965` (reorderPhases ref) AND `components/FloatingChat.tsx:270` | **Easiest: ask Luna: "reorder phases so phase 2 comes first".** |

### 3b. Dead patch types (7), no exercise possible or needed

These patch types have a definition in `lib/trip-patches.ts`, a dispatcher case in `hooks/useCollaborativeTrip.ts`, but **zero emit call sites anywhere in the codebase.** A grep for `type: 'add_hotel'`, `type: 'remove_hotel'`, `type: 'update_budget'`, `type: 'expand_phase'`, `type: 'add_comment'`, `type: 'edit_comment'`, `type: 'delete_comment'` across `app/`, `components/`, `hooks/`, `lib/` (excluding `lib/trip-patches.ts` and `lib/collaboration.ts` themselves) returns no results other than dispatcher case labels.

| Type | Reason |
|---|---|
| `add_hotel` | Hotels go through `StayTab` and the page-level `acceptedHotels` state setter, not through the patch pipeline. The dispatcher case at `hooks/useCollaborativeTrip.ts:188` exists so received broadcasts can be applied to local state, but the local hotel-add path bypasses `emitPatch`. Architecture finding: receive-only by current design. |
| `remove_hotel` | Same as `add_hotel`. Dispatcher case at `hooks/useCollaborativeTrip.ts:199`. Receive-only. |
| `update_budget` | Dispatcher case at `hooks/useCollaborativeTrip.ts:229` is a no-op with comment: "Budget lives in trip_data; not wired through the ref yet. Stage 2e can add a page-level onBudgetChange callback if realtime budget sync is needed. Deferred." Per source comment, this is a deliberate Stage 2 deferral. |
| `expand_phase` | Dispatcher case at `hooks/useCollaborativeTrip.ts:234` is a no-op with comment: "UI-only; per-user state. Not synced via ref." Per source comment, this is per-user UI state by design and is correctly never broadcast. |
| `add_comment` | Dispatcher cases at `hooks/useCollaborativeTrip.ts:237-239` are a shared no-op with comment: "Comments live in trip_comments and are rendered by Stage 4 via a separate subscription. This dispatcher is a no-op." Stage 4 deferred. |
| `edit_comment` | Same as `add_comment`. |
| `delete_comment` | Same as `add_comment`. |

**Architectural assessment.** The 7 dead types fall into 3 groups:
- 2 receive-only-by-design (hotels): would be cleaner to either remove the dispatcher cases until emitting paths exist, or wire an emit path through StayTab. Filing as a Stage 4 polish opportunity.
- 2 deferred deliberately (budget, expand_phase): correct as documented. No action.
- 3 Stage 4 (comments): correct as documented. Will be exercised when Stage 4 ships.

**No hotfix #5 needed for the 7 dead types.** Their inertness is by design or by deliberate deferral, not a regression.

### 3c. Wilson exercise list

Run the 7 cards in section 5 below. Expected outcome: production patch coverage moves from **7/21 → 14/21** (the 7 dead types remain at 0 production hits, which is correct).

---

## 4. Test bench setup

**Recommended trip:** `5b1e869e-b1ee-4819-b8a5-0e1848951f47` (9 prior actions, 2 distinct users on 2026-04-26). Or `86209bae-704e-4700-ab43-f6dadcef7320` (10 prior actions). Either works as long as both Wilson and Fafa appear as editors.

**Verify trip access (run before exercise):**

```sql
SELECT user_id, role FROM trip_collaborators
WHERE trip_id = '<chosen trip>';
```

Expected: at least one editor row, and Wilson's `auth.uid()` either appears here OR is the trip's `saved_trips.user_id` (owner). If Wilson is the owner, Fafa's user_id must appear as editor here. Otherwise create a fresh trip and invite the other user via the editor share link.

**Browsers:** Chrome profile 1 + Chrome profile 2 (or Chrome + Firefox / Chrome + private window). Both signed in to different accounts. Both on the same trip URL.

**Pre-test row count:**

```sql
SELECT count(*) FROM trip_activity_log WHERE trip_id = '<test trip>';
```

Note this number; each card below should add exactly 1 row.

---

## 5. Per-type test cards

Each card is self-contained. Run them in order. After each card, fill in the FILL-IN markers with observed evidence and mark PASS/FAIL.

### Card 1: `replace_activity` (cross-slot drag)

**Source-level pre-flight (29 April 2026, hotfix #8 attempt):** hotfix #8 was scoped on the assumption that the cross-slot drag did not call `emitPatch`. Source review found the emit pipeline is already wired end-to-end:

- `components/EditableItinerary.tsx:1295-1309`: `handleDragEnd` cross-slot branch fires `emitFromInline({ type: 'replace_activity', dayId, activityId, newActivity: { slot: to.slot, ... } })` immediately after `setDays`.
- `components/EditableItinerary.tsx:1188-1191`: `emitFromInline` calls `onPatchEmit` when the prop is defined.
- `app/[locale]/plan/page.tsx:1444`: `onPatchEmit={collab.enabled ? collab.emitPatch : undefined}` threads the hook's `emitPatch` into `EditableItinerary`.
- `hooks/useCollaborativeTrip.ts:151-161`: dispatcher case for `replace_activity` resolves `dayId` to a day number and calls `replaceActivityById` with `SUPPRESS` to apply the slot change without re-broadcasting.

The original "zero `replace_activity` rows in production" symptom was caused by the line 1295 guard `if (act && day?.id && typeof active.id === 'string')`. Before hotfix #2 (commit `7dde72ce`), markdown-parsed days did not carry `id`, so the guard returned early and no broadcast occurred. After hotfix #2 every Day has a stable id (markdown parser, `defineDayInputToDay`, and the `setDays` backstop all enforce it), so the guard passes and the emit fires.

No code change shipped for hotfix #8. Card 1 is expected to PASS in live multi-browser QA. If it does not, capture evidence and re-open with a diagnostic prompt.

**Pre-test row count:** `[FILL IN]`

**Steps:**
1. Browser A: open the test trip, navigate to any day with at least one activity in the morning slot.
2. Browser A: drag that activity from the morning slot to the afternoon slot.
3. Browser A local: confirm the activity now sits in afternoon. `[FILL IN: PASS / FAIL]`
4. Browser B (within 2 seconds): confirm the activity now sits in afternoon. `[FILL IN: PASS / FAIL with elapsed-time observation]`
5. Database:
   ```sql
   SELECT seq, action, payload, user_id, created_at
   FROM trip_activity_log
   WHERE trip_id = '<test trip>'
   ORDER BY seq DESC LIMIT 1;
   ```
   Expected: 1 new row with `action = 'replace_activity'`. Payload contains `dayId`, `activityId`, `newActivity` with `slot: 'afternoon'`. `[FILL IN: paste relevant fields from the row]`
6. Activity-ID stability check (Stage 2f hotfix #4 contract): the `activityId` in the payload must equal the activity's id in BOTH Browser A's React state AND Browser B's React state after the patch applies. `[FILL IN: matches / divergent]`

**Verdict:** `[FILL IN: PASS / FAIL]` (expected PASS based on source-level pre-flight)

---

### Card 2: `unaccept_activity` (toggle accepted activity)

**Pre-test row count:** `[FILL IN]` (= post-Card-1 count)

**Steps:**
1. Browser A: find an activity that is currently in `status = 'accepted'` (visible as a green checkmark or accepted-state styling).
2. Browser A: click the activity (or its accept toggle) to flip it back to pending.
3. Browser A local: confirm activity is now pending. `[FILL IN: PASS / FAIL]`
4. Browser B (within 2 seconds): confirm activity is now pending. `[FILL IN: PASS / FAIL]`
5. Database query (same as Card 1).
   Expected: `action = 'unaccept_activity'`. Payload contains `dayId`, `activityId`. `[FILL IN]`
6. Activity-ID stability check. `[FILL IN]`

**Verdict:** `[FILL IN: PASS / FAIL]`

---

### Card 3: `remove_activity` (Luna chat command)

**Pre-test row count:** `[FILL IN]`

**Steps:**
1. Browser A: open Luna chat panel.
2. Browser A: send "Remove the morning activity from day 1" (or pick a specific activity by name).
3. Browser A: wait for Luna's confirmation in chat AND for the activity card to disappear from day 1 morning slot. `[FILL IN: PASS / FAIL]`
4. Browser B (within 2 seconds of Browser A's UI confirmation): confirm activity is gone from day 1 morning. `[FILL IN: PASS / FAIL]`
5. Database query.
   Expected: `action = 'remove_activity'`. Payload contains `dayId`, `activityId`. `[FILL IN]`
6. Activity-ID stability check: the `activityId` in the payload must match what Browser A's React state had before the removal AND what Browser B successfully removed. `[FILL IN]`

**Verdict:** `[FILL IN: PASS / FAIL]`

**Note:** if Luna does not actually emit a remove_activity patch when asked, that's a finding worth recording. Luna's tool-use protocol may instead modify text via the SSE stream and let `removeActivitiesMatching(pattern)` clean up. In that case the patch may emit through a different path. The `removeActivityById` ref method at `EditableItinerary.tsx:988` IS wired to emit, but check whether anyone actually CALLS it from Luna's chat dispatcher.

---

### Card 4: `remove_note` (clear note textarea)

**Pre-test row count:** `[FILL IN]`

**Steps:**
1. Browser A: open a day. If no day has a note yet, first add one (this fires `add_note`, expected and fine; bumps row count by 1 and exercises a re-fire of an already-triggered type for free).
2. Browser A: click the note's edit affordance, select all text in the textarea, delete it, click outside (or hit save / blur to commit).
3. Browser A local: note is gone or rendered empty. `[FILL IN: PASS / FAIL]`
4. Browser B (within 2 seconds; note debounce is 800ms per Stage 2e so allow up to ~3s total): confirm note is gone. `[FILL IN: PASS / FAIL]`
5. Database query.
   Expected: `action = 'remove_note'` (NOT `update_note` with empty string). Payload contains `dayId`. `[FILL IN]`

**Verdict:** `[FILL IN: PASS / FAIL]`

**Note:** EditableItinerary `setNoteForDay(dayNumber, '')` distinguishes between "had a note → clear" (emits `remove_note`) and "no note → still empty" (emits nothing). Confirm the trip's day actually had a note before clearing.

---

### Card 5: `split_phase` (Luna chat command)

**Pre-test row count:** `[FILL IN]`

**Steps:**
1. Browser A: confirm the trip has at least one multi-day phase (e.g. phase 1 covering days 1–4). Trips of 7+ days typically have phases.
2. Browser A: in Luna chat, send "Split phase 1 after day 2" (or whatever day boundary makes sense).
3. Browser A: wait for Luna's confirmation. The phase header should now show two phases. `[FILL IN: PASS / FAIL]`
4. Browser B (within 2 seconds): confirm the same two-phase view. `[FILL IN: PASS / FAIL]`
5. Database query.
   Expected: `action = 'split_phase'`. Payload contains `phaseId`, `splitAfterDay`, `newPhaseId`, `newPhaseLabel`. `[FILL IN]`
6. **Non-commutative integrity check** (per `lib/trip-patches.ts` PATCH_COMMUTATIVITY): split_phase is non-commutative. The hook's `applyPatchToRef` for non-commutative types defers local apply until the seq response. Confirm Browser A's local state did NOT update before the POST returned (subtle: hard to observe directly, but if visible it would be a "wait then update" flicker rather than an immediate change). `[FILL IN: observed instant / observed deferred / not observable]`

**Verdict:** `[FILL IN: PASS / FAIL]`

---

### Card 6: `merge_phases` (Luna chat command)

**Pre-test row count:** `[FILL IN]`

**Steps:**
1. Browser A: confirm the trip has at least 2 adjacent phases (Card 5's split should have produced this, or the trip already had multiple phases).
2. Browser A: in Luna chat, send "Merge phases 1 and 2".
3. Browser A: wait for Luna's confirmation. Phases should now be combined. `[FILL IN: PASS / FAIL]`
4. Browser B (within 2 seconds): confirm same combined view. `[FILL IN: PASS / FAIL]`
5. Database query.
   Expected: `action = 'merge_phases'`. Payload contains `phaseIds: [a, b]` and `mergedLabel`. `[FILL IN]`
6. Non-commutative integrity check: merge_phases is non-commutative. `[FILL IN]`

**Verdict:** `[FILL IN: PASS / FAIL]`

---

### Card 7: `reorder_phases` (Luna chat command)

**Pre-test row count:** `[FILL IN]`

**Steps:**
1. Browser A: confirm the trip has at least 2 phases. If Card 6 merged everything down to 1, run another split first to get back to ≥2 (this re-fires `split_phase`, harmless).
2. Browser A: in Luna chat, send "Move phase 2 to be first" or "reorder phases".
3. Browser A: confirm the order changed in the UI. `[FILL IN: PASS / FAIL]`
4. Browser B (within 2 seconds): confirm same. `[FILL IN: PASS / FAIL]`
5. Database query.
   Expected: `action = 'reorder_phases'`. Payload contains `phaseIdOrder` array. `[FILL IN]`
6. Non-commutative integrity check: reorder_phases is non-commutative. `[FILL IN]`

**Verdict:** `[FILL IN: PASS / FAIL]`

---

## 6. Post-QA coverage statement

Run after all 7 cards complete:

```sql
SELECT action, count(*) AS hits, max(created_at) AS last_seen
FROM trip_activity_log
GROUP BY action
ORDER BY hits DESC;
```

`[FILL IN: paste output]`

**Expected post-QA:**
- `replace_activity`, `unaccept_activity`, `remove_activity`, `remove_note`, `split_phase`, `merge_phases`, `reorder_phases` each have ≥1 row.
- The 7 previously-triggered types (reorder_activities_in_slot, accept_activity, etc) have +0 to +N rows depending on incidental triggers during QA.
- Total distinct `action` values now covers **14 of 21** patch types.
- The 7 dead types (`add_hotel`, `remove_hotel`, `update_budget`, `expand_phase`, `add_comment`, `edit_comment`, `delete_comment`) remain at 0 hits and SHOULD remain at 0; this is correct.

**Patch types with at least one production row:** `[FILL IN: M]`
**Patch types defined in source:** **21**
**Live coverage (excluding dead types):** `[FILL IN: M / 14]`
**Total coverage including deads:** `[FILL IN: M / 21]`

---

## 7. Failures and follow-up prompts

`[FILL IN: one entry per FAIL card, OR "No failures observed."]`

If any failure surfaces, the failure becomes its own prompt: `luna-stage2f-hotfix-5-[patch-name].md`. Each hotfix prompt is written and shipped one at a time per the per-prompt handoff protocol. Do NOT bundle multiple hotfixes into one commit even if they share a root cause; each gets its own ship + verify cycle.

---

## 8. Multi-user collaboration baseline (post-QA)

`[FILL IN: SQL output filtered to test trip]`

```sql
SELECT action, count(*) AS hits
FROM trip_activity_log
WHERE trip_id = '<test trip>'
GROUP BY action
ORDER BY hits DESC;
```

The test trip after QA should show every previously-untriggered LIVE type with hits ≥ 1.

---

## 9. Conclusion

`[FILL IN: one paragraph]`

If all 7 LIVE cards PASS: "Stage 2 patch coverage moved from 7/21 to 14/21 in production; the 7 dead types are documented as correct-by-design (receive-only hotels, deferred budget/expand-phase, Stage 4 deferred comments). No hotfix-5 follow-ups needed. Sub-master plan #4 closed."

If any FAIL: "Stage 2 patch coverage moved from 7/21 to N/21. M failures observed: [list types]. Hotfix-5 prompts queued: [list filenames]. #4 stays open until hotfix-5 chain closes."

---

## 10. Source-level completeness statement (pre-live-exercise)

This section is intentionally separate from the live-QA outcome. It records what static analysis already confirms as of 28 April 2026:

- **Patch library is complete:** 21 types canonically declared in `lib/trip-patches.ts:41-69`.
- **Dispatcher is complete:** every type has a case in `hooks/useCollaborativeTrip.ts` `applyPatchToRef` switch (verified by grep). The TypeScript discriminated-union `_never` exhaustiveness check at the end of the switch (line ~243) means missing a case would fail compile.
- **Emit coverage:** 14 of 21 types have at least one emit call site. 7 are dead by design or by deferral (see section 3b).
- **Convention compliance:**
  - Every emit site that calls `onPatchEmitRef.current?.(...)` is inside an `ItineraryHandle` ref method that has been refactored to read `*Ref.current` (Stage 2f hotfix #1 convention).
  - Every emit site that calls `emitFromInline(...)` is in a user-action inline handler that has already updated local state via `setDays` (Stage 2e convention).
  - The `add_activity` patch payload always carries the activity's stable `id` (Stage 2f hotfix #4 convention; verified at EditableItinerary:745, 1414).
- **No leak path identified:** the only emit pathway is via `EditableItinerary.tsx`'s `onPatchEmit` prop, which the plan page wires to `collab.emitPatch` only when `collabEnabled` is true (per Stage 2 finishing kit #3 verification, commit `2f400656`).

If Wilson runs the cards and finds discrepancies between this static analysis and runtime behavior, that is itself an interesting finding and should be captured in section 7.
