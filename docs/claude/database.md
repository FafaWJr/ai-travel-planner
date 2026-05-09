# Database Schema & RLS

## Tables

| Table | Key columns |
|---|---|
| `profiles` | user profile data |
| `saved_trips` | destination, is_favorite, start_date, end_date, trip_data JSONB, title; Collab columns: share_token_viewer, share_token_editor, is_collaborative, last_synced_at, trip_data_pre_migration |
| `trip_collaborators` | trip_id, user_id, role CHECK (owner\|editor\|viewer), joined_at |
| `trip_activity_log` | append-only log keyed by (trip_id, created_at); seq BIGSERIAL with unique index on (trip_id, seq) |
| `trip_comments` | target_type CHECK (activity\|day\|phase\|hotel), target_id TEXT (not UUID), 500-char comment_text, soft-delete via deleted_at |
| `blog_comments` | blog post comments |
| `user_preferences` | travel_persona, travel_style |

## RLS Pattern: SECURITY DEFINER Helpers (CRITICAL)

Any cross-table RLS policy that needs to check collaborator membership MUST use these helpers:

- `public.user_collaborates_on_trip(trip UUID) RETURNS BOOLEAN` — SECURITY DEFINER, STABLE, SET search_path = public
- `public.user_is_editor_on_trip(trip UUID) RETURNS BOOLEAN` — same qualifiers
- `public.trip_is_owned_by_user(trip UUID) RETURNS BOOLEAN` — added Stage 4a; used for comment ownership

**Why:** Direct subqueries between `saved_trips` RLS and `trip_collaborators` RLS cause `42P17 infinite recursion detected`. Confirmed incident during Stage 0a Batch 7: 90s blast radius, emergency rollback. The helpers bypass RLS inside their bodies and break the cycle.

`trip_collaborators_select` is self-only (`user_id = auth.uid()`). Fellow-collaborator list reads happen at the API layer with service role, not RLS.

**Future cross-table RLS changes MUST include a recursion smoke test (stranger SELECT on all four tables) before deploy.**

## Collab Permissions Model

Three-tier: owner / editor / viewer. Hybrid two-link invites (`share_token_viewer` + `share_token_editor`). Per-person role override via owner dashboard.

`getRequestUserAndRole(supabase, tripId)` in `lib/collaboration.ts` resolves `{ user, role }` for any API route. Returns `role: 'owner'` for solo-trip owners so solo flows are unchanged.

## Comments

- All three roles can create/read comments.
- Author can edit/delete own. Owner can soft-delete any comment.
- Soft-delete uses service-role client for UPDATE to bypass RLS WITH CHECK on `deleted_at IS NULL`.
- `target_id` is TEXT (not UUID) — accepts all existing ID formats.

## Suggestion Routes (Not Role-Gated)

`/api/hotel-suggestions`, `/api/extra-ideas`, `/api/day-suggestions`, `/api/budget-estimate` — deliberately not role-gated; they don't write to `saved_trips`.

## Trip Data Write Rules

- `/api/trips` POST and PATCH apply `injectMissingDayIds` from `lib/trip-ids.ts` before write.
- Collab PATCH uses service-role client and server-merges `trip_data` JSONB preserving all keys. Never overwrite with partial object.
- `PATCH /api/trips` uses `.eq('user_id', ...)` — matches owner row only; editors must use `/api/trips/[tripId]/chat-history` for chat persistence.
