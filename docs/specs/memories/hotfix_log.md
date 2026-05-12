# Luna Memories: Hotfix Log

This log tracks all hotfixes applied during the Memories project.
Claude Code must record here BEFORE applying any hotfix, and confirm the active phase did not change AFTER.

Format per entry:

---

## HF-[number] [date]

**Active phase at time of hotfix:** Phase [N]: [name]
**Problem:** [description of what broke or what needs fixing]
**Root cause:** [why it happened]
**Proposed fix:** [what will be changed]
**Files affected:** [list of files]
**Phase changed?** No. (If the fix would require changing the active phase, STOP and escalate to Wilson.)
**Fix confirmed:** [date]
**Notes:** [any additional context]

---

## Log entries

## HF-1 2026-05-12

**Active phase at time of hotfix:** Phase 3: Photo upload + EXIF auto-sort
**Problem:** `MemoryBanner.handleSave` calls `setSaved(true)` even when `dayIndex < 0` (day not found in memory row), giving user a false "Saved to your trip memories" confirmation while no data is actually written. The PUT fires with an unchanged days array.
**Root cause:** `dayIndex >= 0` guard only wraps the `days[dayIndex]` mutation, not the subsequent PUT call or `setSaved(true)`.
**Proposed fix:** Wrap the PUT call, `setSaved(true)`, `setNote('')`, and the setTimeout inside the `if (dayIndex >= 0)` block. When dayIndex < 0, exit the try block cleanly without showing the false confirmation; the expanded textarea remains open so the user can navigate to the full journal.
**Files affected:** `components/MemoryBanner.tsx`
**Phase changed?** No.
**Fix confirmed:** 2026-05-12
**Notes:** Edge case only — standard trips always have sequential day numbers built by `buildDaysFromTrip` (1..N), so `currentDayNumber` will always match. Hotfix prevents trust violation in the unlikely non-sequential day number edge case.
