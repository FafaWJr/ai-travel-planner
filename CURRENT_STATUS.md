# Luna Project Status

> **Purpose.** This file is the single source of truth for which Luna project is active, which stage we are on, what shipped last, what is pending, and which detours are active. Upload this at the start of any working session. If a session-memory claim disagrees with this file, this file wins.

**Last updated:** 27 April 2026
**Maintainer:** Wilson
**Repo location:** root of `ai-travel-planner` (commit alongside `CLAUDE.md` and `CONVENTIONS.md`)

---

## Active project

**Luna Collaborative Trips** (master plan v2.1, 22 April 2026, at `docs/specs/collab/00-master-plan.md`).

Six stages, ~78.5 hours total estimated. Real-time multi-user trip planning with viewer/editor/owner permissions, per-user cross-aware Luna chat, and comments on activities/days/phases/hotels.

**Current stage:** Stage 2 finishing kit. Sub-master plan items #3 through #11 reopened on 27 April 2026 after the recovery track (R1 + R2 + R4) closed. Stage 3 / 4 / 5 remain paused per master plan v2.1 sequence (they unblock after the Stage 2 finishing kit completes).
**Last shipped release:** R4 plan-render-smoke-guard (commit `e1c6a924`) on 27 April 2026.

---

## Stage status

| Stage | Name | Status | Evidence source |
|---|---|---|---|
| 0 | Foundation (DB schema, UUID migration, flag, RLS) | Shipped (formal QA pass not confirmed) | Supabase: 3 new tables exist, 5 new columns on `saved_trips` exist, `trip_data_pre_migration` populated. RLS policies present. |
| 1 | Share link, invite system, viewer/editor tokens | Shipped | Vercel build manifest: 7 collab API routes deployed. `share_token_viewer/_editor` columns populated on 33 of 38 trips. `useCollaborativeTrip` hook firing on `/plan`. |
| 2 | Realtime sync engine, role-gated mutations | Shipped (with 4 hotfixes, partial production exercise) | Vercel deploys: Stage 2f hotfixes 1-4 all in deploy history. Supabase: 33 rows in `trip_activity_log` from 5 trips. **7 of 21 patch types exercised in production.** Remaining 14 coded but untriggered. |
| 3 | Collaborative Luna chat (per-user, viewer-readonly, cross-aware) | Not started | No `chat_history` per-user keying yet. No viewer-readonly mutation strip in `/api/chat`. No `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED` flag. |
| 4 | Comments, My Trips integration, UX polish | Not started | Supabase: `trip_comments` table exists with 0 rows. No comment API routes in build manifest. No comment components. |
| 5 | Landing page and launch | Not started | No "Plan Together" homepage section. `NEXT_PUBLIC_COLLAB_ENABLED` not flipped to true in production. |

**Progress:** Stages 0, 1, 2 shipped. Stages 3, 4, 5 pending. Roughly 47% by hour estimate, 50% by stage count.

---

## Stage 2 detail (current high-water mark)

**Master plan deliverables for Stage 2:**

*Realtime core.*
- `lib/realtime.ts` (channel setup, Broadcast, Presence)
- `lib/trip-patches.ts` (JSON patch generation, application, merge)
- `hooks/useCollaborativeTrip.ts` (React hook wrapping realtime + state)
- `lib/activity-log.ts` (writes to `trip_activity_log` on every mutation)
- Supabase Realtime publication enabled for `saved_trips` (recovery fallback)
- Integration into `app/[locale]/plan/page.tsx` (hook activates when `is_collaborative=true` AND flag on)
- Presence display: avatars in trip header with role badges
- Syncing indicator in trip header
- Disconnect/reconnect handling: replay `trip_activity_log` since last-seen
- Debounced save: patches accumulate 5s, then merge into `saved_trips.trip_data`

*Role enforcement.*
- Server-side role check in every mutation-producing API route
- Viewer patch attempts rejected server-side with 403
- Client-side: viewer UI does not render edit controls

*Patch types supported (21 total per master plan):* `add_activity`, `remove_activity`, `replace_activity`, `accept_activity`, `unaccept_activity`, `add_note`, `update_note`, `remove_note`, `add_hotel`, `remove_hotel`, `edit_phase`, `split_phase`, `merge_phases`, `reorder_phases`, `update_budget`, `expand_phase`, `add_comment`, `edit_comment`, `delete_comment`, plus `decline_activity` (added in Stage 2f hotfix 1) and `reorder_activities_in_slot` (added in Stage 2f hotfix 3).

*Server-side UUID injection.*
- `/api/generate`, `/api/chat`, `/api/hotel-suggestions` post-processing.

*Second feature flag.*
- `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=true` (default on, separate flag for partial rollback).

**What is shipped (live evidence):**

- `trip_activity_log` table is being written to (33 rows). Confirmed via Supabase query 27 April 2026.
- Patch types observed in production logs: `accept_activity`, `decline_activity`, `add_activity`, `add_note`, `update_note`, `edit_phase`, `reorder_activities_in_slot`. Seven of 21 types have at least one production occurrence.
- `useCollaborativeTrip` hook firing on `/plan` page load (observed in browser DevTools network tab during session 27 April).
- 11 editor rows in `trip_collaborators` (real users have joined trips). Zero owner rows (owners tracked via `saved_trips.user_id`, by design). Zero viewer rows in production.
- Server-side UUID injection for new days confirmed in `app/api/trips/route.ts` POST handler via `injectMissingDayIds(trip_data)` from `@/lib/trip-ids`.
- Stage 2f hotfix 1 (closure race in `addActivity`): commit `38b770f2` shipped 26 April.
- Stage 2f hotfix 2 (day IDs missing): commit `7dde72ce` shipped 26 April.
- Stage 2f hotfix 3 (sender-side commutative re-apply removed, `reorder_activities_in_slot` added): commit `2f9ae017` shipped 26 April.
- Stage 2f hotfix 4 (stable activity IDs across browsers): commit `2ca47794` shipped 26 April.
- Destructive-PATCH guard at `/api/trips`: commit `eaf0f7e1` shipped 26 April. Refuses to overwrite non-empty `plan` or `photos` with empty values.

**What is NOT confirmed shipped or partially exercised:**

- 14 of 21 patch types coded but never triggered in production: `remove_activity`, `replace_activity`, `unaccept_activity`, `remove_note`, `add_hotel`, `remove_hotel`, `split_phase`, `merge_phases`, `reorder_phases`, `update_budget`, `expand_phase`, `add_comment`, `edit_comment`, `delete_comment`. The last three are Stage 4 territory by design. The other 11 have not been QA'd against real users.
- Viewer tier has zero production usage. Three-role permission model (`viewer/editor/owner`) is coded but the viewer path is not exercised.
- Disconnect/reconnect replay path: not directly verified in this status doc. Would need a manual disconnect test or runtime log evidence to confirm.
- Debounced 5s save: not directly verified.
- Presence avatars + syncing indicator: not directly verified in DOM during this session.
- `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` flag presence: not verified in code.
- Formal `luna-qa-agent` Stage 2 subagent QA pass: no evidence in deploy log of a dedicated QA-pass commit.

**What remains for Stage 2 to be considered fully done:**

1. Manual or scripted exercise of the 11 untested non-comment patch types so we have at least one production confirmation of each.
2. End-to-end viewer-tier test (one real session as viewer, confirm read-only enforcement).
3. End-to-end disconnect/reconnect test with `trip_activity_log` replay.
4. Run the formal `luna-qa-agent` subagent QA pass per master plan section 4 Stage 2.
5. Confirm `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` exists and works for partial rollback.

These are not blockers for moving to Stage 3, but they should be cleared before Stage 5 launch.

---

## Recent detours (off master plan)

| Detour | Status | Commit | Date | One-line cause |
|---|---|---|---|---|
| R5 recovery-track bookkeeping | Closed | (this commit) | 27 Apr | Bookkeeping pass that closed the 27 April recovery track (R1 + R2 + R4 shipped, R3 deferred). Reopened sub-master plan items #3 through #11. |
| R4 plan-render-smoke-guard | Closed | `e1c6a924` | 27 Apr | Extracted pure rendering pipeline to `lib/plan-render.ts`. Added `prebuild` smoke gate running 32 contract assertions before every webpack build. Wilson scope deviation: SECTIONS stayed in page.tsx because it imports Lucide React icons; internal SECTION_LABEL_MAP serves extractSection's fallback. |
| R2 empty-plan-save-guard | Closed | `cc769a0a` | 27 Apr | Two-layer guard against saving trips with empty `plan` markdown when `itineraryDays.length > 0`. R2a tightens AI system prompt (H1 confirmed via static analysis). R2b adds client-side validateTripPayloadForSave. R2c adds server-side `REFUSED_INCONSISTENT_TRIP` on POST + PATCH (with collab partial-patch carve-out). R2d adds `plan.errors.emptyPlanFullDays` in EN/PT-BR/ES. |
| R1 sanitize-html-style-allowlist | Closed | `69d271d5` | 27 Apr | Restored Plan tab visual hierarchy stripped by the SSR fix. Added `PLAN_SANITIZE_CONFIG` with `allowedAttributes` for `style` + `data-place` and a tight `allowedStyles` allowlist. XSS posture preserved. |
| SSR HTTP 500 on `/plan` | Closed | `2a791e34` | 27 Apr | `isomorphic-dompurify` dragged in ESM-only `@exodus/bytes`. Replaced with `sanitize-html`. |
| Saved trip view spins forever | Closed | `958ac160` | 27 Apr | Render gate at `app/[locale]/plan/page.tsx` line 1270 required non-empty `plan` markdown. Structured-only AI output produces empty `plan`. Gate now uses `hasContent` (plan or `itineraryDays` or `itineraryPhases`). Loader defensively normalised. |

**2026-04-27 Recovery track summary (R1 + R2 + R4 shipped, R3 deferred, R5 closed bookkeeping).** Wilson reported degraded formatting and empty saved-trip tabs from screenshots. Live diagnosis isolated three regressions: (1) sanitize-html stripping inline styles after the SSR fix swapped libraries, (2) AI generation intermittently emitting only tool_use without text deltas causing empty `plan` saves, (3) the existing `/plan` smoke not catching visual regressions and letting R1 ship undetected for 5 hours. R1 restored the inline-style allowlist; R2 added two-layer guards against empty-plan saves; R4 extracted the rendering pipeline into `lib/plan-render.ts` and added a prebuild smoke gate that runs 32 contract assertions before every webpack build. R3 (backfill of two existing broken test trips) was deferred by Wilson's decision because the trips are personal test data; the saved-trip-load fix from earlier in the day already lets them open without spinning. Full diagnosis and rationale: `docs/specs/collab/02-recovery-plan-april-27-regressions.md`.

---

## Open polish items (not blockers)

- **Markdown sub-header styling on Transport/Tips/Weather tabs.** AI writes `**bold paragraphs**` instead of `### headings`, which `markdownToHtml` renders as `<p><strong>` with no visual hierarchy. Pre-existing, only became visible after the saved-trip-load fix. Would benefit from a styled pass over the rendered prose container. Defer until Stage 3 ships unless a user complains.

---

## Active hotfixes

None.

---

## Update protocol

Update this file whenever:
- A stage merges to `main`.
- A detour opens or closes.
- A polish item is added, completed, or reprioritised.
- The master plan version changes.

Always include the date in the **Last updated** field at the top.
