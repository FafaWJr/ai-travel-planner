# PHASE-MODE-MATRIX.md

Luna classifies every trip into one of three length-based modes. Each mode has a different AI generation strategy, a different UI rendering, and a different set of user affordances.

Inconsistencies between mode layers caused the R6 two-hotfix saga. Use this matrix when modifying any mode-specific behavior.

---

## Classification

```ts
// lib/ai.ts and app/[locale]/plan/page.tsx (derived from dates)
const tripLengthMode: 'short' | 'medium' | 'long' =
  tripDays >= 15 ? 'long'
  : tripDays >= 7 ? 'medium'
  : 'short';
```

`tripDays` is always `endDate - startDate + 1` (inclusive of both arrival and departure days).

---

## The matrix

| | **Short (1–6 days)** | **Medium (7–14 days)** | **Long (15+ days)** |
|---|---|---|---|
| **Tool array passed to `/api/generate`** | `[DEFINE_DAY_TOOL]` only | `[DEFINE_PHASE_TOOL, DEFINE_DAY_TOOL]` | `[DEFINE_PHASE_TOOL]` only (day tool ABSENT) |
| **Source of truth for tool array** | `buildGenerateTools(tripDays)` in `lib/ai.ts` | same | same |
| **`buildTravelPrompt` itinerary section** | "Call define_day for each of N days" | "Call define_phase 2-3 times, then define_day for every day" | "Call define_phase 2-6 times, DO NOT call define_day" (instruction repeated 3× in prompt) |
| **`buildStructuredItineraryInstruction` in `route.ts`** | Day-only instruction | Phases first, then days | Phase-only instruction, emphatic |
| **Expected output from initial generate** | `N` `define_day` tool calls | 2-3 `define_phase` + `N` `define_day` tool calls | 3-6 `define_phase` tool calls, zero `define_day` calls |
| **Days present after initial generate?** | Yes (all days) | Yes (all days) | No (days fetched later via expand-phase) |
| **Vercel function `maxDuration`** | 300s | 300s | 300s |
| **Typical wall-clock generation time** | 10-20s | 20-40s | 8-15s |
| **Timeout risk** | None | Low | Was HIGH before R6; now safe because phase-only is fast |
| **Client render** | Flat list of day cards | Phases above day cards (interleaved: phase → its days → next phase) | Phases above range summary cards; days appear after "Plan these days" click |
| **Phase cards visible?** | No | Yes | Yes |
| **Day cards visible on initial load?** | Yes (all) | Yes (all) | No (summary card only until user expands a phase) |
| **Day cards default state** | Expanded | Collapsed | Collapsed (once fetched) |
| **Phase card `+ Add phase` button** | Hidden | Visible | Visible |
| **Phase card "Plan these days" button** | N/A | Available, triggers regeneration of that phase's days | Primary CTA — required for day content to exist |
| **Phase card "Regenerate" button** | N/A | Shown when phase has days | Shown when phase has days |
| **Phase card collapse caret** | Hidden | Visible | Visible |
| **Phase range inline editing** | N/A | Allowed | Allowed |
| **Phase label inline editing** | N/A | Allowed | Allowed |
| **Phase delete button** | N/A | Allowed (days become unassigned) | Allowed (days become unassigned) |
| **API route for day expansion** | N/A (days generated upfront) | `/api/expand-phase` (regen only) | `/api/expand-phase` (required for day content) |
| **API route for single-day regen** | `/api/regenerate-day` | `/api/regenerate-day` | `/api/regenerate-day` (only works for phases already expanded) |
| **Phase-aware day regen context** | N/A | Phase label + summary + highlights passed in | Phase label + summary + highlights passed in |
| **Tool narrowing rationale** | Phases don't help for <7 day trips. Simpler output. | Both phases AND days needed for organizational grouping + content. | Only phase-mode completes within Vercel 300s budget and avoids partial-state timeouts. Day generation is deferred to per-phase calls. |

---

## Rules that bind the layers together

### Rule 1: Tool array must match prompt intent

If the prompt says "do not emit `define_day`", the tool array MUST NOT include `DEFINE_DAY_TOOL`. Never trust the model to obey a negative prompt instruction when the forbidden tool is still listed. R6's initial failure was precisely this.

### Rule 2: Prompt branching must match tool narrowing

`buildTravelPrompt` branches by `tripLengthMode`. So does `buildStructuredItineraryInstruction` in `route.ts`. Both functions must produce mode-consistent instructions. If you add a fourth mode, both functions must gain a fourth branch. R6 hotfix #2 fixed a case where `buildStructuredItineraryInstruction` was using a generic instruction that overrode `buildTravelPrompt`'s careful mode branching.

### Rule 3: Client rendering must match server output

For long trips, the client expects zero days on initial render. If the server somehow emits a `define_day` for a long trip (tool-array bug, prompt-override bug, etc.), the client WILL render it — creating the "phases AND days AND timeout" state seen before R6 hotfix #2. The client does not re-validate mode consistency.

### Rule 4: Add-phase validation must respect trip bounds

`validatePhaseRange` (now `analyzeRangeEdit` post-R5.1-hotfix-1) enforces:
- `from >= 1`
- `to <= tripDays`
- `from <= to`
- No overlap with sibling phases (unless cascading — R5.1 hotfix #1 behavior)

These rules apply equally across all three modes.

### Rule 5: Cascade edits preserve day coverage

When a user expands Phase 1 into Phase 2's territory (R5.1 hotfix #1), the day that moves between phases has its `phase_id` reassigned AND (for medium trips where the day has activities) is regenerated via `/api/regenerate-day` with the new phase's context. Long-trip cascades don't trigger regeneration because the day has no activities yet — it just moves.

---

## Testing checklist when modifying mode behavior

For each of short, medium, and long:

1. Generate a representative trip (e.g. 5-day Paris, 10-day Rome, 20-day Japan).
2. Verify the expected tool calls fire by checking the browser devtools Network tab or Vercel runtime logs.
3. Verify the DOM renders match the "Client render" row of the matrix.
4. Try editing a phase range (medium + long only). Cascade should fire if overlap. Short trips should show no phase cards at all.
5. Try deleting a phase (medium + long only). Days should survive with `phase_id: undefined`.
6. For long trips: click "Plan these days" on one phase. Verify only that phase's days appear, other phases untouched.
7. Query Supabase after saving:
   ```sql
   SELECT
     (end_date - start_date + 1) AS trip_days,
     jsonb_array_length(COALESCE(trip_data->'itineraryPhases', '[]')) AS phases,
     jsonb_array_length(COALESCE(trip_data->'itineraryDays',   '[]')) AS days
   FROM saved_trips WHERE id = '<id>';
   ```
   Expected shape per mode:
   - Short: `phases=0, days=N`
   - Medium: `phases=2-3, days=N`
   - Long (before any expand-phase click): `phases=3-6, days=0`
   - Long (after one expand): `phases=3-6, days=(size of that phase)`

---

## Known cross-mode edge cases

### Edge 1: Trip crossing a mode boundary via date edit

If a user somehow edits start/end dates to push a trip across a mode boundary (e.g. 14-day trip extended to 16 days), the stored phases and days do not automatically reshape. Phase coverage may become inconsistent with the new length. Current product decision: this doesn't happen via UI — dates are set once at generation. If we add post-generation date editing, this edge needs explicit handling.

### Edge 2: User deletes all phases on a medium trip

Medium-trip days remain visible (flat list) because the render logic falls back to `days.map(renderDayCard)` when `phases.length === 0 || phasesDismissed`. No data is lost.

### Edge 3: User adds a phase to a short trip via `+ Add phase`

Short trips don't show the `+ Add phase` button per the matrix. But if the button were ever made visible, creating a phase on a <7-day trip would work — the UI has no mode-specific gate on phase creation itself, only on the button visibility.

### Edge 4: Long trip with zero phases

If the initial generation fails to emit any `define_phase` calls, a long trip renders as flat days (per the fallback logic). The user has no way to regenerate just the phases without regenerating the entire trip. Consider adding a "Suggest phases for this trip" action if this becomes common (it hasn't been reported).

---

## History

- **R6 (original)** — added `DEFINE_PHASE_TOOL` to `buildGenerateTools` for trips >= 7 days. Did NOT remove `DEFINE_DAY_TOOL` for long trips. Model defaulted to day-by-day generation and either skipped phases (medium) or timed out mid-stream (long). Took two hotfixes to resolve.
- **R6 hotfix #1** — attempted to fix via prompt instructions alone. Insufficient.
- **R6 hotfix #2** — narrowed tool array per mode (long = `[DEFINE_PHASE_TOOL]` only). Hardened `buildStructuredItineraryInstruction` to branch per mode with repeated instructions. This doc is the consequence of that investigation.
- **R5.1** — added inline phase editing (label, range), delete, `+ Add phase`, expand/collapse carets on phases and days. Interleaved day cards under their parent phase.
- **R5.1 hotfix #1** — cascade range edits (instead of reject-on-overlap). Removed confusable dismiss X button from phase cards.

---

Last updated: 2026-04-21 after R5.1 hotfix #1 (commit `5f800c29`).
