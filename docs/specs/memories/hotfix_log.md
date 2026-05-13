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

## HF-8 2026-05-13
**Active phase at time of hotfix:** G3 complete
**Problem:** HEIC/HEIF photos (default iPhone format) rejected by upload pipeline. Chrome/Firefox cannot decode HEIC via the Canvas API used by compressPhoto/generateBlurPlaceholder. Blocks G3 testing since AirDropped iPhone photos with GPS are typically HEIF.
**Root cause:** compress.ts uses `new Image()` + Canvas to resize photos. Browsers other than Safari cannot decode HEIC natively. The file picker accepts `image/*` (which includes HEIC), but compression silently fails for HEIC files.
**Proposed fix:** Add heic2any npm package. Create lib/memories/heic-convert.ts with isHeicFile() + convertHeicToJpeg(). In BulkPhotoUpload: extract EXIF from original HEIC first (exifr supports HEIC natively), then convert to JPEG before compression. Cache EXIF per localId in a ref so GPS data is preserved across the conversion that strips metadata.
**Files affected:** components/memories/BulkPhotoUpload.tsx, lib/memories/heic-convert.ts, package.json, types/heic2any.d.ts (if types not bundled)
**Phase changed?** No.

---

## HF-7 2026-05-13
**Active phase at time of hotfix:** LP-3 complete
**Problem:** User profile photo in NavBar shows broken image icon instead of Google avatar. Google avatar URLs from lh3.googleusercontent.com return 403 when the Referer header is sent. No onError fallback exists, so the browser renders the broken image icon with truncated alt text.
**Proposed fix:** Add referrerPolicy="no-referrer" and onError fallback to Avatar component img tag.
**Files affected:** components/NavBar.tsx
**Phase changed?** No.

---

## HF-6 2026-05-13
**Active phase at time of hotfix:** LP-3 complete
**Problem:** Three form issues on /memories landing page:
  1. Mobile (375px): date inputs overflow their grid cells, overlapping and breaking alignment
  2. Desktop: destination text overlaps the MapPin icon — `padding: '13px 16px'` shorthand from `inputBase` is applied after `paddingLeft: 42` in React's style iteration, resetting left padding to 16px (insufficient for the 18px-wide icon at left:14)
  3. End date picker opens to the current month instead of the start date's month
**Proposed fix:** (1) `minWidth: 0` on grid container + date inputs, CSS `min-width: 0 !important` on `input[type="date"]` in mobile media query. (2) Move `paddingLeft: 42` to AFTER `...inputStyle` spread in DestinationInput.tsx so it is always the last declaration. (3) Add `onFocus` pre-fill on end date input: when empty and startDate is set, set to startDate+1 so calendar opens to the correct month.
**Files affected:** `app/[locale]/memories/page.tsx`, `components/DestinationInput.tsx`
**Phase changed?** No.

---

## HF-5 2026-05-12

**Active phase at time of hotfix:** Phase 7: PWA layer (shipped, post-QA)
**Problem:** `manifest.json`, `sw.js`, and `offline.html` return HTTP 404 in production. The PWA cannot install — no manifest, no service worker registration, install banner never fires.
**Root cause:** The next-intl middleware matcher in `proxy.ts` did not exclude `.json` or `.js` file extensions. The middleware intercepts `GET /manifest.json` and `GET /sw.js` before Next.js can serve them from `/public`, causing a routing failure.
**Proposed fix:** Add `manifest\\.json|sw\\.js|offline\\.html|` to the negative lookahead in the `config.matcher` pattern in `proxy.ts`.
**Files affected:** `proxy.ts`
**Phase changed?** No.
**Fix confirmed:** 2026-05-12
**Notes:** Identified by `luna-memories-qa` post-deploy QA run. Security hardening (C2/C3/C4/H2/H3) was unaffected — this was PWA-only. The source-level implementation (manifest content, SW strategy, icons, install banner) was correct; only the middleware exclusion was missing.

---

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

---

## HF-3 2026-05-12

**Active phase at time of hotfix:** Phase 3.3: Route map + share page photos
**Problem:** Two issues found by memories-qa after Phase 3.3 ship: (F1) `RouteMap.tsx` placed `if (points.length < 2) return null` before the `useEffect` call — a React rules-of-hooks violation causing a runtime crash when the `days` prop transitions from no GPS points to 2+ GPS points (normal happy path for sequential photo uploads); (F2) `mapLabel` and `photosLabel` locale keys defined in all three locales but not used as section headings anywhere.
**Root cause:** F1: Early-return guard placed before hooks instead of inside the effect body and after all hooks. F2: Keys added speculatively during Phase 3.3 but corresponding headings never wired up in JSX.
**Proposed fix:** F1: Move the guard inside `useEffect` body; move `if (points.length < 2) return null` to after all hooks (after `useEffect`). F2: Add "Your route" heading (`t('mapLabel')`) above `<RouteMap>` on the capture page (conditional on any photo having GPS data); add "Photos" heading (`t('photosLabel')`) above `<DayPhotoGrid>` inside expanded day cards. Share page uses hardcoded English strings (no `useTranslations` context available on the public share page).
**Files affected:** `components/memories/RouteMap.tsx`, `app/[locale]/memories/[tripId]/page.tsx`, `app/[locale]/memories/share/[token]/page.tsx`
**Phase changed?** No.
**Fix confirmed:** 2026-05-12
**Notes:** F1 is a crash-path fix (hooks violation). F2 is a locale consistency fix.

---

## HF-4 2026-05-12

**Active phase at time of hotfix:** Phase 6: PDF export (first monetisation)
**Problem:** POST /api/memories/photos returns 404 for standalone memories. The route queries trip_memories using `.eq('trip_id', tripId)`, but standalone memories have trip_id=null. Same gap exists in /api/memories/narrative: it first fetches saved_trips by `.eq('id', tripId)` (which does not exist for standalone), then fetches trip_memories by `.eq('trip_id', tripId)` (also fails for standalone).
**Root cause:** Both routes were created before Phase 4 introduced standalone memories and the dual-lookup pattern. The photos route (Phase 3.1) and narrative route (Phase 1) predate dual-lookup entirely.
**Proposed fix:** Photos route: dual-lookup (trip_id then id) in both POST and DELETE fetch steps; update by memory.id (canonical, avoids silent no-op when trip_id=null). Narrative route: dual-lookup on trip_memories first; for linked memories fetch saved_trips via memory.trip_id; for standalone build synthetic trip object from standalone_* columns.
**Files affected:** app/api/memories/photos/route.ts, app/api/memories/narrative/route.ts, docs/specs/memories/hotfix_log.md
**Phase changed?** No.
**Fix confirmed:** 2026-05-12
**Notes:** Photos route update steps now use `.eq('id', memory.id)` (canonical, never null) rather than `trip_id`, avoiding silent no-op when trip_id=null. Narrative route restructured to dual-lookup memory first, then branch: linked fetches saved_trips via memory.trip_id; standalone builds synthetic trip from standalone_* columns. The narrative generator already handles null trip_data (empty itineraryDays), so standalone stories generate from notes alone. Systematic audit: all other /api/memories/* routes (share, card, card/day, export/pdf, standalone, skeleton) were checked — none use .eq('trip_id', tripId) with user_id; the dual-lookup gap was limited to photos and narrative.
