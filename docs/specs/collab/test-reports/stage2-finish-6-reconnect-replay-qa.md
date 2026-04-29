# Stage 2 Finishing Kit #6: Reconnect replay QA

**Date (source-level pre-flight):** 29 April 2026
**Verified by:** Claude (source-level pre-flight); live four-test exercise pending Wilson runtime QA.
**Status:** **STATIC PASS / LIVE PENDING.** The reconnect-replay code path is implemented end to end via `seq` tracking (not timestamp). The SUBSCRIBED handler distinguishes initial connect from reconnect via `wasConnectedRef.current` and triggers `backfillFromApi(lastAppliedSeqRef.current)` when reconnecting after at least one applied patch. Live exercise will confirm the path runs and converges Browser B in production conditions.

This report records the pre-flight findings so Wilson can run the live tests quickly and either confirm the predictions or capture any divergence.

---

## 1. Pre-flight findings

### 1a. Replay endpoint

`GET /api/trips/[tripId]/patches?since=N` (`app/api/trips/[tripId]/patches/route.ts:83-121`). Returns rows from `trip_activity_log` with `seq > N`, ordered by seq ascending, capped at 500 rows with a `truncated` flag in the response body. Read-only; allowed for any collaborator (including viewer).

### 1b. Backfill function in the hook

`backfillFromApi(sinceSeq)` at `hooks/useCollaborativeTrip.ts:336-366`. Fetches the replay endpoint, iterates each missed patch, applies via `applyPatchToRef` (the same dispatcher used for live broadcasts), advances `lastAppliedSeqRef.current` to the highest applied seq, and warns to console if `truncated === true`. Skips any seq present in `emittedSeqsRef.current` (this client's own emits already applied locally).

### 1c. SUBSCRIBED handler

`hooks/useCollaborativeTrip.ts:563-584`. On Realtime channel subscribe (fires on initial connect AND on every reconnect after CLOSED/CHANNEL_ERROR), the handler:

1. Tracks presence via `channel.track(payload)`.
2. Sets `setIsConnected(true)`.
3. **Reconnect detection:** if `wasConnectedRef.current === true` AND `lastAppliedSeqRef.current > 0`, calls `void backfillFromApi(lastAppliedSeqRef.current)`. This skips backfill on the very first connect (nothing to replay yet) but fires on every subsequent reconnect.
4. Sets `wasConnectedRef.current = true` so the next SUBSCRIBED is treated as a reconnect.

When the channel transitions to `CLOSED` or `CHANNEL_ERROR`, the handler sets `setIsConnected(false)` (line 581-583). Reconnection itself is handled by Supabase Realtime automatically; the client does not need to call `subscribe()` again.

### 1d. Live broadcast gap detection

`hooks/useCollaborativeTrip.ts:542-551`. Even during a live connection, if a broadcast arrives with `seq > lastAppliedSeqRef.current + 1` (gap detected, e.g. a patch was lost), the receiver triggers `backfillFromApi(lastAppliedSeqRef.current)` before applying the new patch. This is a defense-in-depth path that does NOT require disconnect/reconnect.

### 1e. Tracking key

The client tracks by `seq` (BIGSERIAL from `trip_activity_log`), not by timestamp. The original master plan referenced `last_seen` timestamp but the shipped Stage 2d implementation (`trip_activity_log.seq` BIGSERIAL added in commit history, indexed unique per trip) made seq the canonical ordering. The replay endpoint and the backfill function both use seq. Timestamp is preserved on each row but is not used for replay ordering.

### 1f. Truncation safety

Backfill is capped at 500 rows. If a client missed more than 500 patches (e.g. the laptop slept for a week and 600 mutations happened), the response carries `truncated: true` and the hook logs a warning recommending reload. Stage 2 does not auto-reload; the user must refresh to rehydrate from `saved_trips.trip_data`. This is a known scope decision; the cap is high enough that real-world disconnects should rarely hit it.

---

## 2. Test bench setup (for Wilson live exercise)

1. **Choose a test trip.** Any saved collaborative trip with both Wilson and Fafa as editors. The trips used for #4 patch coverage QA work.

2. **Browser A (Wilson, editor).** Sign in, open trip plan page. Confirm activities visible.

3. **Browser B (Fafa, editor).** Sign in (different profile or incognito), open the same trip URL. Confirm identical state.

4. **Network simulation tools.** Chrome DevTools Network tab has an "Offline" toggle that drops the WebSocket without affecting the browser process. Use it on Browser B for tests R-1 through R-3.

5. **Diagnostic logging.** Browser B's DevTools console should show `[useCollaborativeTrip] backfill ...` messages when the backfill function runs. `process.env.NODE_ENV !== 'production'` gates the seq-gap debug log; on the production deploy this won't show but the `backfill fetch failed`, `backfill apply failed`, `backfill truncated` warnings/errors WILL show in production.

---

## 3. Test cards

### Test R-1: Simple disconnect and replay

- **Pre-test state:** Browser A and B both showing identical Day 1 activities.
- **Disconnect:** Browser B DevTools Network tab > Offline.
- **Mutations in Browser A:**
  - Accept one activity (green checkmark).
  - Decline another activity (red X).
  - Reorder two activities within the same morning slot via drag.
- **DB confirmation:** `SELECT seq, action FROM trip_activity_log WHERE trip_id = '<test trip id>' ORDER BY seq DESC LIMIT 5;`
  - Expected: 3 new rows with action `accept_activity`, `decline_activity`, `reorder_activities_in_slot`.
- **Reconnect:** Browser B DevTools Network tab > uncheck Offline.
- **Convergence:** Within 5 seconds, Browser B shows all three changes.
- **Console evidence:** Browser B may log `[useCollaborativeTrip] backfill ...` lines, or remain silent if the backfill ran cleanly.

| Field | Result |
|---|---|
| Pre-test row count | `[FILL IN]` |
| Mutations applied in Browser A | `[FILL IN]` |
| Post-test row count | `[FILL IN]` |
| Browser B convergence (PASS/PARTIAL/FAIL) | `[FILL IN]` |
| Time to convergence | `[FILL IN seconds]` |
| Console log evidence | `[FILL IN]` |
| Verdict | `[FILL IN]` |

### Test R-2: No changes during disconnect

- **Disconnect Browser B**, do nothing in Browser A for 10 seconds, **reconnect Browser B**.
- **Expected:** Browser B reconnects cleanly, no errors in console, no visual changes. The backfill query returns zero rows and the loop is a no-op.

| Field | Result |
|---|---|
| Console errors on reconnect (PASS=none / FAIL=present) | `[FILL IN]` |
| Visual state (PASS=unchanged / FAIL=glitched) | `[FILL IN]` |
| Verdict | `[FILL IN]` |

### Test R-3: Multiple rapid changes

- **Disconnect Browser B.**
- **In Browser A:** within 10 seconds, perform 5 mutations:
  - Accept 2 activities.
  - Decline 1 activity.
  - Add a note to Day 1.
  - Reorder activities in afternoon slot.
- **Reconnect Browser B.**
- **Expected:** all 5 changes appear in Browser B within 5 seconds. No duplication, no toggle-back glitches.

| Field | Result |
|---|---|
| Mutations applied in Browser A | `[FILL IN]` |
| Browser B convergence (PASS/PARTIAL/FAIL) | `[FILL IN]` |
| Duplicate or glitched state observed | `[FILL IN yes/no + description]` |
| Verdict | `[FILL IN]` |

### Test R-4: Backgrounded tab

- **Switch Browser B to a different tab** (do not close). Wait 30 seconds.
- **In Browser A:** accept one activity.
- **Switch back to Luna tab in Browser B.**
- **Expected:** the accepted activity shows the accepted state. May arrive via live broadcast (Realtime stayed connected through tab switch) or via reconnect-replay (if the tab was throttled enough to drop the WebSocket). Either path is correct.

| Field | Result |
|---|---|
| Convergence on tab refocus (PASS/FAIL) | `[FILL IN]` |
| Distinguishable delivery method (broadcast vs replay) | `[FILL IN]` |
| Verdict | `[FILL IN]` |

---

## 4. Known issue: Luna chat 502s

During the #5 viewer QA exercise, Luna chat reportedly returned "Sorry, I had trouble with that" for both editor (Browser A) and viewer (Browser B) sessions. Wilson observed five consecutive 502 responses from `POST /api/chat` in Vercel runtime logs.

This is NOT related to:
- The reconnect-replay mechanism (this report's scope).
- Stage 2f hotfix #9 viewer UI gating (commit `0f6ef49d` only touched UI components, no API change).
- Viewer-specific behaviour (the failure affects editors equally).

Likely causes (untriaged):
- Anthropic API timeout (transient).
- Vercel serverless function timeout on the chat route.
- A regression introduced in an earlier commit that the smoke gate doesn't catch.

Separate investigation queued. Does NOT block #6, #7, or Stage 3 planning. Stage 3 implementation will block on this being resolved.

---

## 5. Failures and follow-up prompts

If pre-flight predictions hold, all four tests PASS in live exercise. The implementation is straightforward and the gap-detection defense-in-depth at line 542 means even partial broadcast losses self-heal without explicit disconnect.

If a test FAILS, the most likely culprits are:
- **Wasn't actually reconnected:** Supabase Realtime auto-reconnect may take longer than expected. Check `[useCollaborativeTrip] backfill ...` console lines to confirm the SUBSCRIBED handler ran.
- **Backfill returned zero rows when changes existed:** check that Browser B's `lastAppliedSeqRef.current` was correctly tracking. If it was 0 (initial connect treated as such), the gate at line 577 prevents backfill.
- **Truncation triggered:** unlikely with only 5 mutations but worth checking the console for `truncated` warning.

---

## 6. Conclusion

Source-level review confirms the reconnect-replay path is end-to-end wired: replay endpoint, backfill function, SUBSCRIBED-as-reconnect detection, and live-broadcast gap detection. The implementation uses seq (BIGSERIAL) as the canonical ordering, not timestamp. Wilson's four-test live exercise will confirm convergence in production conditions. Sub-master plan #6 closes with this report once Wilson amends with PASS/FAIL evidence.
