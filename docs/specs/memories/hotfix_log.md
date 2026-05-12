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

---

## HF-2 2026-05-12

**Active phase at time of hotfix:** Phase 3.2: Photo upload UI + EXIF auto-sort + day grid
**Problem:** Three issues found by memories-qa after Phase 3.2 ship: (F1) unsorted photos silently skipped with no recourse — users who upload undated photos get 0 uploads with no explanation; (F2) em-dash character used in day-group label in BulkPhotoUpload, violating CONVENTIONS.md; (F3) `photoCount` locale key defined in all three locales but unused in components (badge rendered raw number).
**Root cause:** F1: `startUpload` filtered to `dayNumber !== null` but no UI allowed users to assign a day to unsorted items. F2: em-dash pasted directly into template string. F3: key defined speculatively but badge rendered `{count}` directly.
**Proposed fix:** F1: Replace unsorted warning block with per-item row (thumbnail + filename + day-select dropdown + remove button); add `assignToDay` locale key in EN/PT-BR/ES; update `photosUnsorted` text. F2: Replace `— ` with `- `. F3: Use `t('photoCount', { count })` in collapsed badge.
**Files affected:** `components/memories/BulkPhotoUpload.tsx`, `app/[locale]/memories/[tripId]/page.tsx`, `messages/en.json`, `messages/pt-BR.json`, `messages/es.json`
**Phase changed?** No.
**Fix confirmed:** 2026-05-12
**Notes:** Commit `92243395`. F1 is the substantive UX fix; F2+F3 are convention/consistency fixes flagged by QA.
