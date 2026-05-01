# Luna Collaborative Trips: Stage 4 Implementation Plan
**Tier 2.5 Stage Plan**
**Version:** 1.0
**Date:** 2 May 2026
**Maintainer:** Wilson
**References:** `docs/specs/collab/00-master-plan.md` (Tier 1, v2.1, section 4 Stage 4, lines 458-553)
**Predecessor:** Stage 3 (COMPLETE, 2 May 2026)
**Status:** Planning

---

## 0. Purpose

Stage 4 is the polish and feature-completion stage of Luna Collaborative Trips. It ships comments, fixes the My Trips page, and closes every UX edge before the Stage 5 launch.

The master plan (section 4, Stage 4) defines the scope. This document breaks it into three sub-stages (4a, 4b, 4c) with implementation detail, execution order, and acceptance criteria for each. When this document and the master plan disagree, the master plan wins.

---

## 1. What already exists (infrastructure from Stages 0-3)

**Database layer (Stage 0, ready to use):**
- `trip_comments` table: `id` (UUID, PK), `trip_id` (FK to saved_trips, CASCADE), `user_id` (FK to profiles), `target_type` (CHECK: activity|day|phase|hotel), `target_id` (text), `original_day_id` (UUID, nullable), `comment_text` (CHECK: max 500 chars), `created_at`, `updated_at`, `deleted_at` (soft delete).
- RLS policies: INSERT for any collaborator (owner + editor + viewer), SELECT for any collaborator (excludes soft-deleted), UPDATE for author only.
- Indexes: `idx_trip_comments_trip` (trip_id WHERE deleted_at IS NULL), `idx_trip_comments_target` (trip_id, target_type, target_id WHERE deleted_at IS NULL).
- No DELETE policy exists (soft delete via UPDATE `deleted_at` column).

**Missing from RLS:** Owner soft-delete of other users' comments. Current UPDATE policy only allows `user_id = auth.uid()`. The master plan says "Owner can soft-delete any comment." This needs a migration in Stage 4a.

**Realtime layer (Stage 2, ready to extend):**
- `hooks/useCollaborativeTrip.ts` handles Supabase Broadcast, patch dispatch, activity log.
- `lib/trip-patches.ts` defines `PatchType` union, `PatchPayload`, `applyPatch`, `PATCH_COMMUTATIVITY`.
- Comment patch types (`add_comment`, `edit_comment`, `delete_comment`) are listed in the master plan but NOT yet in the `PatchType` union or the dispatch switch. These must be added.

**My Trips page (Stage 1, needs fix):**
- RLS policy `saved_trips_select_own_or_collab` returns both owned AND collaborated trips in a single result set.
- The client-side split is broken: shared trips appear mixed with owned trips for collaborator accounts.
- The `user_id` column on `saved_trips` identifies the owner. Trips where `user_id != auth.uid()` are shared trips.

**Profile data (Stage 0):**
- `profiles` table: `id`, `email`, `full_name`, `avatar_url`, `created_at`, `updated_at`.
- `trip_comments.user_id` FK to `profiles(id)`. Supabase JS `.select('*, profiles(full_name, avatar_url)')` join works.

---

## 2. Sub-stage breakdown

### Stage 4a: Comments data layer and API (~6h, low risk)
### Stage 4b: Comments UI components (~6h, low-medium risk)
### Stage 4c: My Trips fix + UX polish (~6h, low risk)

Each sub-stage ships independently behind the existing `NEXT_PUBLIC_COLLAB_ENABLED` flag. Each has its own Claude Code prompt, smoke tests, and commit.

---

## 3. Stage 4a: Comments data layer and API

**Goal:** Ship the complete server-side comments system. API routes, RLS migration, realtime broadcast, Luna cross-awareness integration. Zero UI changes.

**What gets built:**

### 3.1 RLS migration: owner can soft-delete any comment

The current UPDATE policy (`user_id = auth.uid()`) prevents owners from moderating. Add an OR branch: `user_id = auth.uid() OR trip_is_owned_by_user(trip_id)`.

Create a helper function `trip_is_owned_by_user(trip_id UUID)` that returns true if `saved_trips.user_id = auth.uid()` for that trip. STABLE, SECURITY DEFINER, same pattern as `user_collaborates_on_trip`.

Apply via `Supabase:apply_migration`.

**File:** Supabase migration only. No application code.

### 3.2 Comment API routes

Four routes per the master plan:

**`POST /api/trips/[tripId]/comments`**
- Body: `{ target_type, target_id, comment_text, original_day_id? }`
- Auth: any collaborator (owner + editor + viewer). Use `getRequestUserAndRole` pattern from existing patch endpoint.
- Validate: `target_type` is one of activity|day|phase|hotel. `comment_text` length <= 500. `target_id` is non-empty.
- Insert into `trip_comments`. Return the created comment with profile join.
- Emit to `trip_activity_log` with action `add_comment`.

**`PATCH /api/trips/[tripId]/comments/[commentId]`**
- Body: `{ comment_text }`
- Auth: author only (`comment.user_id === user.id`).
- Validate: `comment_text` length <= 500. Comment not soft-deleted.
- Update `comment_text` and `updated_at`. Return updated comment.
- Emit to `trip_activity_log` with action `edit_comment`.

**`DELETE /api/trips/[tripId]/comments/[commentId]`**
- Auth: author OR trip owner.
- Soft delete: set `deleted_at = now()`. Do NOT hard delete.
- Return 200 with `{ deleted: true }`.
- Emit to `trip_activity_log` with action `delete_comment`.

**`GET /api/trips/[tripId]/comments`**
- Auth: any collaborator.
- Query: `trip_comments` WHERE `trip_id` AND `deleted_at IS NULL`, joined with `profiles(full_name, avatar_url)`.
- Order by `created_at ASC`.
- Return flat array. Client groups by `(target_type, target_id)`.

**File:** `app/api/trips/[tripId]/comments/route.ts` (GET + POST), `app/api/trips/[tripId]/comments/[commentId]/route.ts` (PATCH + DELETE).

### 3.3 Patch types for comments

Add to `lib/trip-patches.ts`:
- `add_comment` payload: `{ type: 'add_comment', commentId: string, targetType: string, targetId: string, commentText: string, userName: string, userAvatar?: string }`
- `edit_comment` payload: `{ type: 'edit_comment', commentId: string, commentText: string }`
- `delete_comment` payload: `{ type: 'delete_comment', commentId: string }`

All three are commutative (order-independent).

Add receive cases in `hooks/useCollaborativeTrip.ts` dispatch switch. These update a local `comments` state array (or trigger a refetch from the GET endpoint).

**Files:** `lib/trip-patches.ts`, `hooks/useCollaborativeTrip.ts`.

### 3.4 Luna cross-awareness: comment events

Add `add_comment`, `edit_comment`, `delete_comment` cases to `formatActionDetail` in `lib/collab-awareness.ts`.

Format examples:
- `add_comment`: `"commented on day-2-xyz: \"Can we eat earlier?\""` (preview first 40 chars)
- `edit_comment`: `"edited a comment"`
- `delete_comment`: `"deleted a comment"`

**File:** `lib/collab-awareness.ts`.

### 3.5 Acceptance criteria (Stage 4a)

1. `POST /api/trips/[tripId]/comments` creates a comment, returns it with profile data, logs to `trip_activity_log`.
2. `GET /api/trips/[tripId]/comments` returns all non-deleted comments with profile joins.
3. `PATCH .../comments/[id]` updates text. Author-only. Returns updated comment.
4. `DELETE .../comments/[id]` soft-deletes. Author OR owner. Returns 200.
5. Viewer can create comments (all three roles can INSERT).
6. Editor cannot delete viewer's comment (403). Owner CAN.
7. Comment broadcasts via realtime channel to other connected browsers.
8. Luna cross-awareness includes comment events in the summary.
9. RLS migration: owner can soft-delete any collaborator's comment.

---

## 4. Stage 4b: Comments UI components

**Goal:** Ship the four UI components that render comments inline on the trip plan page. Comments appear next to activities, days, phases, and hotel cards.

**What gets built:**

### 4.1 `CommentIcon` component

Reusable icon + count badge. Placed inline next to entity titles.

- Props: `targetType`, `targetId`, `count`, `onClick`.
- Renders a Lucide `MessageCircle` icon (from the project's icon set) with a small count badge.
- Count 0: icon renders in gray, no badge.
- Count > 0: icon renders in navy `#00447B`, badge shows count in orange `#FF8210`.
- Clicking toggles the thread open/closed.

**Placement (per master plan):**
- Activity cards: next to the activity text, before the accept/decline buttons.
- Day headers: next to the day title.
- Phase headers: next to the phase title.
- Hotel cards (Stays tab): next to hotel name.

### 4.2 `CommentCompose` component

Single textarea + Submit button. Appears only when thread is expanded.

- Props: `tripId`, `targetType`, `targetId`, `originalDayId?`, `onSubmit`.
- Textarea: 500 char limit with live counter. Placeholder: "Add a comment..." (EN), "Adicionar um comentario..." (PT-BR), "Agregar un comentario..." (ES).
- Submit button: disabled when empty or over 500 chars.
- Calls `POST /api/trips/[tripId]/comments` on submit. On success, clears textarea and calls `onSubmit` to refresh the thread.

### 4.3 `CommentItem` component

Single comment display.

- Props: `comment` (the comment object with profile data), `currentUserId`, `isOwner`, `onEdit`, `onDelete`.
- Layout: avatar (32px circle), name + role badge + relative timestamp, comment text below.
- Edit/delete buttons: render on hover, only for author (edit + delete) or owner (delete only).
- Edit mode: textarea replaces text, Save/Cancel buttons. Calls `PATCH` on save.
- Delete: confirmation prompt, then calls `DELETE`.

### 4.4 `CommentThread` component

Expandable inline thread that wraps CommentIcon + list of CommentItems + CommentCompose.

- Props: `tripId`, `targetType`, `targetId`, `originalDayId?`, `comments` (filtered array for this target), `currentUserId`, `isOwner`.
- Collapsed: shows only `CommentIcon` with count.
- Expanded: shows list of `CommentItem` components + `CommentCompose` at bottom.
- Max 5 visible. If more, "Show N more" toggle above the visible items.
- Clicking outside does NOT auto-collapse (user controls collapse via the icon).

### 4.5 Count aggregation

- Day header count = day-level comments + all activity-level comments within that day's slots.
- Phase header count = sum of all day header counts within the phase.
- Computed client-side from the flat comments array returned by GET.

### 4.6 Orphaned comments

When a comment's `target_id` no longer exists in `trip_data` (activity was removed, hotel was declined):
- Show in a collapsed "Orphaned comments" section at the bottom of the day identified by `original_day_id`.
- Subtitle: "This comment referred to an item that was removed."
- Uses the same `CommentItem` rendering. No edit allowed on orphaned comments (the context is gone).

### 4.7 Locale strings

All new UI strings in EN, PT-BR, ES. Expected namespace: `plan.comments`.

Strings needed:
- `addComment`, `editComment`, `deleteComment`, `showMore`, `orphanedTitle`, `orphanedSubtitle`, `charCount`, `cancel`, `save`, `deleteConfirm`, `commentPlaceholder`.

### 4.8 Integration into existing components

- `EditableItinerary.tsx`: add `CommentThread` to each activity card, day header, and phase header. Pass filtered comments.
- Stays tab hotel cards: add `CommentThread` next to hotel name.
- All placements gated by `NEXT_PUBLIC_COLLAB_ENABLED` (solo trips show no comment icons).

### 4.9 Acceptance criteria (Stage 4b)

1. Comment icon with count renders on activities, days, phases, and hotels.
2. Click icon: thread expands inline. Click again: collapses.
3. Compose textarea appears at bottom of expanded thread. 500 char counter.
4. Submit creates comment. Comment appears immediately. Broadcasts to other browsers.
5. Edit (author only): inline textarea replaces text. Save persists. Cancel reverts.
6. Delete (author or owner): confirmation, then soft-delete. Comment disappears for all.
7. Max 5 visible + "Show N more" toggle.
8. Orphaned comments: appear on the correct day with subtitle.
9. Count aggregation: day counts include child activity counts. Phase counts include child day counts.
10. Mobile 375px: thread fits, compose fits, no horizontal overflow.
11. All strings render correctly in EN, PT-BR, ES.
12. Viewer can comment. Viewer's comment broadcasts to editor and owner.

---

## 5. Stage 4c: My Trips fix + UX polish

**Goal:** Fix the My Trips page shared trip classification, add UX polish items from the master plan.

**What gets built:**

### 5.1 My Trips page: owned vs shared split

**The bug:** RLS returns all trips (owned + collaborated) in a single query. The client-side split is broken. Shared trips appear in the "My Trips" section.

**The fix (two approaches, choose during source read):**

**Approach A (preferred): Server-side differentiation.**
Modify the `/api/trips` GET endpoint (or the My Trips page query) to include an `is_owned` computed field:
```sql
SELECT *, (user_id = auth.uid()) AS is_owned FROM saved_trips
```
Client splits on `is_owned`: true goes to "My Trips", false goes to "Shared with me".

**Approach B: Client-side differentiation.**
The My Trips page already has access to the current user's ID. Compare `trip.user_id` against `currentUser.id`. If they don't match, the trip is shared.

Both approaches are correct. Approach A is cleaner because the split happens at the data layer and the client just renders two arrays. The source read during implementation will determine which fits the existing query pattern better.

**Additional My Trips enhancements (per master plan + Wilson's feedback):**
- Shared trip cards show owner name (from profiles join or trip_collaborators).
- Role badge on each shared trip card (EDITOR / VIEWER).
- Collaborator count on owner's trip cards (e.g. "Shared with 2 people").
- Optional: creation date on trip cards.

### 5.2 CollabToast

Subtle toast notification when a collaborator makes a change: "Wilson added an activity" / "Fatima commented on Day 3".

- Throttled: max 1 toast per 3 seconds.
- Triggered by incoming patches in `useCollaborativeTrip`.
- Positioned bottom-right, auto-dismisses after 3 seconds.
- Brand-styled: navy background, white text, orange accent.

**File:** New component `components/CollabToast.tsx`, integrated into `plan/page.tsx`.

### 5.3 Leave trip flow

"Leave this trip" option for collaborators (not owner).

- Accessible from a menu on the trip plan page (e.g. settings dropdown or InviteModal).
- Calls `POST /api/trips/[tripId]/leave` (already specified in master plan Stage 1).
- Confirmation dialog: "Are you sure you want to leave this trip? You will lose access."
- On confirm: removes the user from `trip_collaborators`, redirects to My Trips.

**Check during source read:** Does `/api/trips/[tripId]/leave` already exist from Stage 1? If yes, only the UI trigger is needed. If not, create the route.

### 5.4 Mobile responsive audit

Per master plan: audit at 375px, 768px, and 1280px.

Targets:
- InviteModal: fits on 375px without horizontal scroll.
- Presence avatars: collapse to "+N" when more than 3 on mobile.
- Comment thread expand: fits within 375px card width.
- CollabToast: full width on mobile, positioned above bottom nav if present.

### 5.5 PDF export collaborator line

When exporting a collaborative trip to PDF, add a "Collaborators:" line in the header with names and roles.

**Check during source read:** Where is the PDF export function? Add the collaborator line after the trip title/destination.

### 5.6 Acceptance criteria (Stage 4c)

1. My Trips page: owned trips in "My Trips" section, shared trips in "Shared with me" section.
2. Shared trip cards show owner name and role badge.
3. Owner's trip cards show collaborator count ("Shared with N people").
4. CollabToast appears when collaborator makes a change. Throttled to 1 per 3s.
5. Leave trip: collaborator can leave. Trip disappears from their My Trips. Owner still sees it.
6. Mobile: all collab elements render correctly at 375px.
7. PDF export: "Collaborators:" line with names and roles.

---

## 6. Execution order and dependencies

```
Stage 4a (comments data)
    |
    v
Stage 4b (comments UI)     [depends on 4a: API routes must exist]
    |
    v
Stage 4c (My Trips + polish) [independent of 4a/4b, but ships last for clean QA]
```

Stage 4c is technically independent of 4a/4b (My Trips fix, CollabToast, leave trip, mobile audit don't depend on comments). But shipping it last allows the Stage 4 QA pass to cover everything in one sweep.

---

## 7. Effort estimate

| Sub-stage | Estimated effort | Risk |
|---|---|---|
| 4a: Comments data + API | 6h | Low |
| 4b: Comments UI | 6h | Low-medium |
| 4c: My Trips + polish | 6h | Low |
| **Total Stage 4** | **~18h** | **Low-medium** |

---

## 8. QA pass (after all three sub-stages ship)

Run the master plan's 19-check QA spec (section 4, Stage 4 QA subagent call, lines 502-530).

Additionally:
- Verify all Stage 3 checks still pass (no regression from Stage 4 changes).
- Verify cross-awareness now includes comment events (Stage 3 QA check 7 and 8, previously N/A).
- Run `luna-multilang-qa` on all new strings.

---

## 9. Rollback

Per master plan:
- Option A: Vercel instant rollback.
- Option C: `NEXT_PUBLIC_COLLAB_ENABLED=false`. All Stage 4 UI hides. Existing comments in DB remain but inaccessible via UI.

---

## 10. Context update (after Stage 4 ships)

Run `luna-context-updater` subagent per master plan mandate (section 6).

---

## 11. Implementation principles

These apply to every Stage 4 prompt:

1. **Source read before code write.** Every Claude Code prompt must read the actual code before modifying it. No assumptions about function signatures, component props, or state shapes.
2. **Preserve existing functionality.** Every prompt includes regression checks for features that already work (activity accept/decline, day confirm, Luna chat, realtime sync).
3. **Use existing patterns.** Comment API routes follow the same `getRequestUserAndRole` auth pattern as the existing patch endpoint. Comment broadcasts use the same `useCollaborativeTrip` dispatch pattern as activity patches.
4. **Type safety.** All new types are added to the existing discriminated unions in `lib/trip-patches.ts`. No `any` casts, no runtime-only validation where TypeScript can enforce.
5. **Incremental delivery.** Each sub-stage ships and is verified before the next begins. No big-bang deploys.
6. **Brand compliance.** All UI uses Luna brand colours (#FF8210 orange, #00447B navy), Poppins/Inter fonts, Lucide React icons, inline styles only. No emoji in UI.
7. **Multilingual.** All user-visible strings in EN, PT-BR, ES. PT-BR accents verified via Node JSON roundtrip.

---

## 12. Known issues carried into Stage 4

| Issue | Source | Addressed in |
|---|---|---|
| My Trips: shared trips mixed with owned | Stage 1 bug | 4c |
| My Trips: missing creation date on cards | Wilson feedback | 4c |
| My Trips: missing "shared with..." on owner cards | Wilson feedback | 4c |
| P2-3 cross-slot drag dispatcher mismatch | Phase 2 deferral | NOT in Stage 4 (deferred) |
| P2-4 viewer PATCH explicit 403 | Phase 2 low priority | NOT in Stage 4 (deferred) |
| CLAUDE.md out of date | Last regen 30 April | Pre-4a bookkeeping |

---

*End of Stage 4 plan v1.0. Linked from Tier 1 master plan section 4 Stage 4.*
