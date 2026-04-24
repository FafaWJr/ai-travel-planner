# Luna Let's Go: Collaborative Trip Planning

## Technical Specification

**Tier 2 Spec**
**Version:** 2.1
**Date:** 23 April 2026
**Authors:** Wilson & Claude
**Status:** Planning, pre-implementation
**Supersedes:** v1.1 (15 April 2026) at the old path `docs/specs/collaborative-trips.md`
**Master plan:** `docs/specs/collab/00-master-plan.md`

---

## 1. Executive Summary

This document describes the full architecture, data model, API surface, risk analysis, and staged implementation plan for adding real-time collaborative trip planning to Luna Let's Go.

The Tier 1 master plan (`00-master-plan.md`) holds locked decisions and stage summaries. This Tier 2 spec is the working technical reference: schema SQL, RLS policy text, API contracts, component specs, realtime channels, patch format, migration scripts. Stage 0-5 Claude Code prompts cite this file for implementation detail.

**Feasibility verdict: confirmed.** The Next.js 16 + Supabase + Vercel stack supports the full feature with no infrastructure changes. Supabase Realtime on the free tier comfortably handles expected launch load.

---

## 2. Current State Analysis

### 2.1 Database Schema (as of 23 April 2026)

| Table | Key Columns | Notes |
|---|---|---|
| `profiles` | id (UUID, FK to auth.users), email, full_name, avatar_url | 14 rows, RLS enabled |
| `saved_trips` | id (UUID), user_id (FK to profiles), destination, trip_data (JSONB), chat_history (JSONB), title, is_favorite, start_date, end_date | 22 rows, RLS enabled. Single-owner model. |
| `blog_comments` | id, post_slug, user_id (FK to profiles), comment_text, is_approved | 8 rows |
| `user_preferences` | user_id (FK to auth.users), travel_persona, travel_style | 4 rows |

**Critical observation:** `saved_trips.user_id` is a single UUID. There is no concept of shared ownership, collaborators, permissions, or commentary. This is the core schema limitation addressed in Stage 0.

### 2.2 Frontend Architecture

The trip plan page is at `app/[locale]/plan/page.tsx`. Key local state:

- `tripData`: full itinerary as a JSONB object with `days[]`, `phases[]` (R5.1+), `overview`, `weather`, `transport`, `budget`, `tips`, `hotels[]`, `lunaHotels[]`.
- `chatHistory`: array of messages between user and Luna (flat array today; migrates to keyed object in Stage 3).
- `accepted / removed / notes`: per-activity per-day local state.

The page is client-side rendered, receives trip parameters via URL search params, calls `/api/generate-plan` on first load, and hydrates locally. Saved trips are loaded from `saved_trips.trip_data`.

Today, all trip state is local React state. There is no server-side synchronization. Saves write the entire `tripData` JSONB in one `upsert`. There are no granular writes.

### 2.3 Luna Chat Architecture

- `/api/chat/route.ts` handles SSE streaming from Anthropic Claude (Sonnet 4.5 primary, Haiku 4.5 fallback).
- Two patch sources after AI Upgrade Stage 3: `%%TRIP_UPDATE%%` text markers (parsed on full accumulated SSE response) AND native tool-use events (`add_activity`, `remove_activity`, `replace_activity`, etc.).
- The `onTripUpdate` handler in `plan/page.tsx` has branches for every patch type.
- Chat history is stored in `saved_trips.chat_history` (flat array today).
- `%%TRIP_UPDATE%%` rules live at the END of Luna's system prompt (prompt-caching requirement, regression-proof against Stage 2 of AI upgrade).

### 2.4 Authentication

- Supabase Auth with Google OAuth (PKCE flow).
- `@supabase/ssr` client, no `auth-helpers-nextjs`.
- `proxy.ts` middleware for locale detection and auth refresh (Next.js 16 requirement).
- Post-auth redirect via `luna_redirect_after_login` localStorage key (must not be renamed).

### 2.5 Reference Analysis: MindTrip

MindTrip's collaboration model (for competitive context):

1. Invite by link: owner generates, recipient joins via link.
2. Shared itinerary editing: all collaborators edit the same itinerary.
3. Shared chat: AI assistant responds in a single thread visible to all.
4. Presence indicators: who is currently viewing.
5. Simple permissions: "invited = full editor", no tiered model.

**Luna's divergence from MindTrip:**
- **Three tiers** (owner/editor/viewer) instead of two.
- **Per-user Luna threads** with cross-awareness summary, instead of single shared chat. Avoids the "who is Luna addressing" problem.
- **Comments on all entities** (activities, days, phases, hotels), which MindTrip does not offer.

---

## 3. Feature Design

### 3.1 User Flow

**Owner (User A):**
1. Creates a trip normally (via `/start` flow or loads a saved trip).
2. Clicks "Invite" button in the trip header.
3. Sees an InviteModal with two "Copy link" buttons (Viewer, Editor), a collaborator list with per-person role toggle, and regenerate-token buttons.
4. The viewer link: `lunaletsgo.com/trip/{tripId}?invite={share_token_viewer}`.
5. The editor link: `lunaletsgo.com/trip/{tripId}?invite={share_token_editor}`.

**Collaborator (User B):**
1. Receives a link via any messaging app.
2. Opens the link in their browser.
3. If not logged in: URL is stashed in `luna_redirect_after_login` (localStorage), redirected to `/auth/login`, returned to the share page post-auth. (Note: auth paths are NOT locale-prefixed; `/auth/login` is correct.)
4. Once authenticated, the share page **auto-joins**: calls `/api/trips/[tripId]/join?token={token}` on page load, briefly shows a "Joining..." state, then redirects to `/plan?savedTripId={tripId}`.
5. If the user is already a collaborator or the owner, the page short-circuits and redirects straight to `/plan?savedTripId={tripId}`.
6. `JoinTripPrompt` component exists in the repo at `components/collab/JoinTripPrompt.tsx` but is **NOT wired** in v1. It is reserved for a potential future "confirm before joining" flow if user feedback indicates auto-join feels too silent. v1 ships auto-join because the vast majority of users clicking an invite link are expecting to collaborate and a confirmation step adds friction without adding clarity.

**Owner promotes/demotes collaborators:**
1. Opens InviteModal.
2. Sees list of all current collaborators with role badges.
3. Clicks a role toggle next to any collaborator to switch them between viewer and editor.
4. Change takes effect on the collaborator's next page load.

**Auth path convention.** All auth routes (`/auth/login`, `/auth/signup`, `/auth/callback`, etc.) are outside the `[locale]` URL segment. The share page correctly redirects unauthenticated visitors to `/auth/login` without a locale prefix. Future features must follow this convention.

**URL param convention.** The plan page reads the URL param `tripId`, not `savedTripId`. The state variable in `plan/page.tsx` is named `savedTripId` for historical reasons, but it is populated from `searchParams.get('tripId')` and persists the trip ID after the user saves a new trip. All internal links to a saved trip must use `?tripId={uuid}`. Earlier Stage 1 and Stage 2b prompts incorrectly used `savedTripId=` as a URL param name; this bug surfaced during Stage 2b QA when invited collaborators landed on a "No trip prompt" empty state. Fixed in commit `collab-stage-2b-hotfix-url-param`.

**Real-time sync (all three users connected):**
- Owner adds an activity via Luna chat. Editor and viewer see it appear within 2 seconds.
- Editor accepts a hotel suggestion. Owner and viewer see the acceptance state update.
- Viewer adds a comment. Owner and editor see the comment count badge update.
- All three see presence avatars in the trip header with role badges.

### 3.2 Permission Model

Three tiers with hybrid two-link invites:

| Action | Viewer | Editor | Owner |
|---|---|---|---|
| View itinerary | Yes | Yes | Yes |
| Chat with Luna (read-only) | Yes | Yes | Yes |
| Chat with Luna (mutations) | **No** | Yes | Yes |
| Accept / unaccept activities | No | Yes | Yes |
| Add / remove / replace activities | No | Yes | Yes |
| Add notes | No | Yes | Yes |
| Comment on any entity | **Yes** | Yes | Yes |
| Add / remove hotels | No | Yes | Yes |
| Edit phases (R5.1 ops) | No | Yes | Yes |
| Expand phase (R6 long-trip) | Yes (view only) | Yes | Yes |
| Invite others | No | No | Yes |
| Delete trip | No | No | Yes |
| Remove collaborators | No | No | Yes |
| Regenerate share tokens | No | No | Yes |
| Promote / demote roles | No | No | Yes |

**Three enforcement layers:**

1. **Database RLS** (authoritative). Viewer cannot UPDATE `saved_trips.trip_data`. Editor and owner can. Every role claim is server-verified.
2. **API route checks**. Each mutation route reads `trip_collaborators.role` for the authenticated user and enforces before acting.
3. **Client UI gating**. Edit controls do not render for viewers. Safety net only, not security.

Client-side gating alone is never sufficient. The RLS policy is the real gate.

### 3.3 Share Link Mechanism

Each trip carries two share tokens:

- `share_token_viewer`: anyone joining via this link becomes a viewer.
- `share_token_editor`: anyone joining via this link becomes an editor.

Token generation: `encode(gen_random_bytes(16), 'hex')`, 32 hex chars.

**Revocability.** Owner can regenerate either token independently. Regenerating `share_token_editor` does not affect `share_token_viewer`, and vice versa. Old links 404 after regeneration (the `/api/trips/[tripId]/join` endpoint returns "invalid token" for any token that does not match current values).

**Per-person override.** After joining, the owner can change any collaborator's role via `PATCH /api/trips/[tripId]/collaborators/[userId]`. This overrides the link default. Useful when a viewer proves helpful and deserves editor rights, or when an editor should be demoted.

**Route structure.**

- `/trip/[tripId]?invite={token}`: share landing page. Authenticates, validates token, shows Join prompt with correct role indicator, adds to `trip_collaborators` on accept, redirects to `/plan?savedTripId={tripId}`.
- `/plan?savedTripId={tripId}`: existing planner page, now role-aware via `useCollaborativeTrip` hook.

### 3.4 Data Architecture

**New tables.**

```sql
-- Table: trip_collaborators
CREATE TABLE trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor'
    CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_collaborators_trip ON trip_collaborators(trip_id);
CREATE INDEX idx_trip_collaborators_user ON trip_collaborators(user_id);

-- Table: trip_activity_log (for sync recovery and audit trail)
CREATE TABLE trip_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_trip_activity_log_trip_time
  ON trip_activity_log(trip_id, created_at DESC);

-- Table: trip_comments
CREATE TABLE trip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  target_type TEXT NOT NULL
    CHECK (target_type IN ('activity', 'day', 'phase', 'hotel')),
  -- TEXT, not UUID, because existing activity/phase/hotel IDs are not UUID-formatted.
  -- Accepts: UUID day IDs (post Stage 0a migration), "d1-a0-fgfj" activity IDs,
  -- "phase-1" phase IDs, "hotel-arts-barcelona" hotel IDs.
  target_id TEXT NOT NULL,
  -- Denormalized for display when original item is removed
  original_day_id UUID,
  comment_text TEXT NOT NULL CHECK (length(comment_text) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_trip_comments_trip
  ON trip_comments(trip_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trip_comments_target
  ON trip_comments(trip_id, target_type, target_id) WHERE deleted_at IS NULL;
```

**New columns on `saved_trips`.**

```sql
ALTER TABLE saved_trips
  ADD COLUMN share_token_viewer TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN share_token_editor TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN is_collaborative BOOLEAN DEFAULT false,
  ADD COLUMN last_synced_at TIMESTAMPTZ DEFAULT now(),
  -- Audit backup for the UUID migration, dropped after 30 days
  ADD COLUMN trip_data_pre_migration JSONB;
```

**RLS policies on `saved_trips` (updated, uses SECURITY DEFINER helpers).**

The original v2.1 spec had these policies querying `trip_collaborators` via subquery. In practice this caused mutual recursion with `trip_collaborators_select` (which must query `saved_trips` to check trip ownership). The recursion was caught during Stage 0a Batch 7 and fixed with two SECURITY DEFINER helper functions that bypass RLS inside their bodies.

```sql
-- Helper functions: SECURITY DEFINER breaks the recursion cycle by running
-- as postgres (bypassing RLS) inside the function body.
CREATE OR REPLACE FUNCTION public.user_collaborates_on_trip(trip UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_collaborators
    WHERE trip_id = trip AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_editor_on_trip(trip UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_collaborators
    WHERE trip_id = trip
      AND user_id = auth.uid()
      AND role IN ('owner', 'editor')
  );
$$;

-- Drop old owner-only policies
DROP POLICY IF EXISTS saved_trips_select_own ON public.saved_trips;
DROP POLICY IF EXISTS saved_trips_update_own ON public.saved_trips;

-- SELECT: owner OR any collaborator (via helper)
CREATE POLICY saved_trips_select_own_or_collab
  ON public.saved_trips FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.user_collaborates_on_trip(id)
  );

-- INSERT: owner only (unchanged)
-- existing saved_trips_insert_own policy preserved

-- UPDATE: owner OR editor (via helper)
CREATE POLICY saved_trips_update_own_or_editor
  ON public.saved_trips FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.user_is_editor_on_trip(id)
  );

-- DELETE: owner only (unchanged)
-- existing saved_trips_delete_own policy preserved
```

**RLS policies on `trip_collaborators` (self-only).**

The original v2.1 spec had this policy querying `saved_trips`, which is exactly the other half of the recursion cycle. The shipped version is self-only: users see only their own row via RLS. The "fellow collaborators on a trip I own/collab on" use case is handled at the API layer via `/api/trips/[tripId]/collaborators`, which uses service role to bypass RLS.

```sql
-- SELECT: self only
CREATE POLICY trip_collaborators_select
  ON public.trip_collaborators FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: owner only
CREATE POLICY trip_collaborators_insert
  ON public.trip_collaborators FOR INSERT
  WITH CHECK (
    trip_id IN (SELECT id FROM public.saved_trips WHERE user_id = auth.uid())
  );

-- UPDATE: owner only (for role changes)
CREATE POLICY trip_collaborators_update
  ON public.trip_collaborators FOR UPDATE
  USING (
    trip_id IN (SELECT id FROM public.saved_trips WHERE user_id = auth.uid())
  );

-- DELETE: owner can remove anyone, self can remove self
CREATE POLICY trip_collaborators_delete
  ON public.trip_collaborators FOR DELETE
  USING (
    trip_id IN (SELECT id FROM public.saved_trips WHERE user_id = auth.uid())
    OR user_id = auth.uid()
  );
```

Note: the `saved_trips` subqueries here do NOT cause recursion because `saved_trips`'s own policies use the SECURITY DEFINER helpers, which bypass `trip_collaborators` RLS on the return path.

**RLS policies on `trip_activity_log`.**

```sql
-- SELECT: any collaborator can read log for their trips
CREATE POLICY "Collaborators can view activity log"
  ON trip_activity_log FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM saved_trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

-- INSERT: any collaborator can write (server-side validation ensures actions are legal for role)
CREATE POLICY "Collaborators can write activity log"
  ON trip_activity_log FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND trip_id IN (
      SELECT id FROM saved_trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

-- UPDATE and DELETE: no one. Log is append-only.
```

**RLS policies on `trip_comments`.**

```sql
-- SELECT: any collaborator can read comments
CREATE POLICY "Collaborators can view comments"
  ON trip_comments FOR SELECT
  USING (
    deleted_at IS NULL
    AND trip_id IN (
      SELECT id FROM saved_trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

-- INSERT: any collaborator (including viewer) can add comments
CREATE POLICY "Collaborators can insert comments"
  ON trip_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND trip_id IN (
      SELECT id FROM saved_trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid()
    )
  );

-- UPDATE: author only (for editing own comment)
CREATE POLICY "Authors can edit own comments"
  ON trip_comments FOR UPDATE
  USING (user_id = auth.uid() AND deleted_at IS NULL);

-- DELETE (hard delete never used; soft delete via UPDATE setting deleted_at)
-- Soft delete authorization handled in UPDATE policy above + API layer
-- for the owner-can-delete-any-comment case.
```

Note on comment soft delete: API route checks `user_id = auth.uid() OR trip_owner = auth.uid()` before issuing the UPDATE that sets `deleted_at`. RLS policy alone allows only the author; the owner-delete path uses a service-role or RPC pattern.

### 3.5 Real-Time Synchronization Strategy

The sync architecture uses Supabase Realtime Broadcast + Presence. Postgres Changes subscription is NOT used in normal operation (refined from v1.1 which had it as a redundant second path).

**Broadcast (primary sync).**
- JSON patches emitted on every mutation.
- All connected collaborators receive the patch via the trip's Broadcast channel.
- Patch is applied optimistically on the emitter, applied on arrival for receivers.

**Presence (online indicators).**
- Tracks who is currently viewing the trip.
- Payload: `{ userId, name, avatar, role, activeTab, online_at }`.
- Emits on `sync`, `join`, `leave` events.

**Activity log (recovery source).**
- Every patch also writes a row to `trip_activity_log` via a server-side API call (not via Broadcast, which is ephemeral).
- On reconnect after disconnection, client fetches log rows since `last_seen` timestamp and replays missed patches.
- Log is append-only. Never updated or deleted.

**Debounced save (persistence).**
- Patches accumulate in memory for 5 seconds of inactivity.
- Then a single `saved_trips.trip_data` UPDATE commits the merged state.
- Reduces write amplification compared to per-patch persistence.
- `saved_trips.trip_data` is read only on initial page load, not subscribed to in normal flow.

**Conflict resolution: Last-Write-Wins with Granular Patches.**

Patch example (RFC 6902-inspired):

```json
{
  "id": "patch-uuid",
  "tripId": "trip-uuid",
  "userId": "user-uuid",
  "userName": "Wilson",
  "userRole": "editor",
  "timestamp": 1713168000000,
  "operations": [
    {
      "op": "replace",
      "path": "/days/2/activities/afternoon/1/accepted",
      "value": true
    }
  ]
}
```

Each mutation generates one patch. Patches are:

1. Applied optimistically on the emitting client.
2. Broadcast to all connected clients via Supabase Broadcast.
3. Written to `trip_activity_log` for persistence.
4. Merged into `saved_trips.trip_data` on debounce.

If two patches collide on the same path, the later timestamp wins. The activity log preserves both sides for manual recovery.

### 3.6 Luna Chat in Collaborative Mode (per-user, cross-aware)

**Critical departure from v1.1.** The v1.1 spec assumed a single shared chat thread. v2.1 uses per-user threads with cross-awareness.

**Per-user chat history.**
- `saved_trips.chat_history` shape changes from flat array to keyed object:
  ```json
  {
    "user_abc": [{ "role": "user", "content": "..." }, ...],
    "user_def": [{ "role": "user", "content": "..." }, ...]
  }
  ```
- Each user reads and writes only their own key.
- **Dual-read pattern** for backward compat: if `chat_history` is a flat array (existing solo trip), code reads it as the current user's thread. On next save, it's lazily migrated to `{ ownerId: [...] }` format.

**Cross-awareness summary (injected into system prompt).**

When the trip is collaborative AND `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED=true`, the system prompt is extended with a short summary of recent activity. Format:

```
COLLABORATOR CONTEXT (last 10 minutes):
- Wilson (editor) added "Dinner at Ichiran Shinjuku" to Day 2 evening
- Fafa (owner) commented on Day 3: "Let's keep this day flexible"
- Fafa (owner) commented on Phase 2: "Relaxed pace, no early starts"
- Wilson (editor) is currently viewing the Stays tab
```

**Rules for the summary:**
- Capped at 5 most-recent events combined across patches, comments, and presence.
- Terse format, one line per event.
- Role included in parentheses for each user.
- Injected at the **end** of the system prompt (preserves prompt caching for the stable block).
- Skipped if no events in the last 10 minutes (empty section not included).

**Viewer Luna (read-only).**

When the authenticated user's role on the trip is `viewer`, the `/api/chat/route.ts` handler strips all mutation tools from the Anthropic tools array before the API call:

```typescript
const role = await getCollaboratorRole(tripId, userId);
let tools = baseTools;
if (role === 'viewer') {
  tools = tools.filter(t => !MUTATION_TOOL_NAMES.includes(t.name));
}
```

Luna still responds conversationally. She can suggest, describe, plan, and answer questions. She simply cannot emit tool calls that would mutate the trip. If a viewer asks for a mutation, Luna falls back to:

> "I can't modify the trip in viewer mode. Ask an editor to add it."

This fallback message is translated in all three locales (EN, PT-BR, ES). The `%%TRIP_UPDATE%%` text markers are also suppressed for viewers (Luna's system prompt is extended with a role-aware instruction when viewer).

**Patch broadcast from Luna.**

When editor or owner Luna produces a mutation (via tool-use or `%%TRIP_UPDATE%%`), the resulting patch is broadcast via the Stage 2 realtime channel. All collaborators see the change. Viewer Luna never produces patches because tools are stripped upstream.

### 3.7 Presence System

Using Supabase Realtime Presence on the `trip:{tripId}` channel:

```typescript
const channel = supabase.channel(`trip:${tripId}`);

channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  // state = { 'user-abc': [{ name, avatar, role, activeTab, online_at }] }
});

channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      name: user.full_name,
      avatar: user.avatar_url,
      role: currentUserRole, // 'owner', 'editor', or 'viewer'
      activeTab: currentTab,
      online_at: new Date().toISOString()
    });
  }
});
```

**UI.** The trip header shows small avatars for each connected collaborator. Each avatar has a role-colored border (owner: navy `#00447B`, editor: orange `#FF8210`, viewer: gray). Hover tooltip shows name + role. Mobile collapses to `+N` when more than 3 avatars.

### 3.8 Supabase Realtime: Plan Limits & Realistic Usage

**Official Supabase Realtime limits (April 2026):**

| Metric | Free ($0) | Pro ($25/mo) | Pro (no spend cap) |
|---|---|---|---|
| Concurrent connections | 200 | 500 | 10,000 |
| Messages per second | 100 | 500 | 2,500 |
| Channel joins per second | 100 | 500 | 2,500 |
| Channels per connection | 100 | 100 | 100 |
| Presence messages/sec | 20 | 50 | 1,000 |
| Broadcast payload size | 256 KB | 3,000 KB | 3,000 KB |
| Postgres change payload size | 1,024 KB | 1,024 KB | 1,024 KB |

**Realistic usage analysis.** Concurrent connections is the binding metric. Typical travel planning has 1-3 users viewing a collaborative trip at the same moment. Free plan supports roughly 100 collaborative trips with 2 people online each at 200 connections total.

**Message throughput.** Each patch (accept, note, comment) is ~200-500 bytes. One patch = one Broadcast message. Three users actively editing produces 1-2 messages/sec. 50+ trips actively editing simultaneously would be needed to approach 100 msg/sec on the free plan.

**Full trip_data payload.** A 10-day trip is typically 50-80 KB JSONB, well within 256 KB free plan Broadcast payload limit. Granular patches are much smaller (hundreds of bytes).

**Verdict.** Free plan comfortably supports launch. Upgrade to Pro only when concurrent collaborative trips grow beyond ~100. Pro upgrade is a billing toggle, no code change.

### 3.9 Multilingual Behavior in Collaborative Mode

Three layers affected when collaborators use different locales:

**Layer 1: UI chrome (per-user, no issue).** Tabs, buttons, labels render per-user via `next-intl` and the `[locale]` URL segment. User A on `/en/plan` sees English, User B on `/pt-BR/plan` sees Portuguese. No shared state, no changes needed.

**Layer 2: Trip data content (stored in original generation language).** The itinerary (`trip_data` JSONB) is generated once by Luna in the language of the creator. Activity names, descriptions, tips stay in that language. UI labels around them adapt per user. Matches every collaborative travel tool including MindTrip.

**Layer 3: Luna chat (naturally bilingual).** `getLanguageInstruction()` in `lib/ai.ts` already sets Luna's response language per user. In collaborative mode:
- User A asks Luna in English. Luna responds in English.
- User B asks Luna in Portuguese. Luna responds in Portuguese.
- Each user's thread stays in their own locale. No contamination.

**Edge case: mixed-language additions.** When User B asks Luna in Portuguese to add a restaurant, the resulting activity text is in Portuguese. That card appears in User A's itinerary alongside English activities. For bilingual groups this is natural; place names and restaurant names are universal.

**Future polish (not needed for v1).** If mixed-language activities ever become confusing, add one line to Luna's system prompt: "When adding activities via mutations, always write activity text in `{original_trip_language}`, even if the user is chatting in a different language." Trivial addition deferred to post-launch.

### 3.10 UUID Architecture

**Why.** Comments anchor to entities by stable UUID, not positional index. When activities are added, removed, or reordered, comments survive cleanly without relying on fragile indexes.

**Stage 0a reality note.** When the UUID migration ran on 24 April 2026, ground truth differed from the original v2.1 spec:
- Activities already had stable IDs in format `d1-a0-fgfj`. No UUID replacement needed.
- Phases already had stable IDs in format `phase-1`. No replacement needed.
- Hotels already had stable IDs in format `hotel-arts-barcelona`. No replacement needed.
- Days had no ID field. Migration injected `gen_random_uuid()` on 284 days across 34 existing trips.

The comment system treats all of these as opaque stable strings. `trip_comments.target_id` is TEXT, accepting any of the above formats as a valid target.

**Entities that carry a UUID.**

| Entity | Location in `trip_data` | ID field |
|---|---|---|
| Day | `trip_data.days[N]` | `days[N].id` |
| Phase | `trip_data.phases[N]` (R5.1+) | `phases[N].id` |
| Activity | `trip_data.days[N].activities[slot][M]` | `activities[slot][M].id` |
| Luna-added hotel | `lunaHotels[N]` (client state) + embedded in days | `lunaHotels[N].id` |
| Stays-tab hotel | `trip_data.hotels[N]` | `hotels[N].id` |

**Server-side injection points.**

1. `/api/generate` (itinerary creation).
   - Post-process the structured `emit_itinerary` tool output (AI Upgrade Stage 4) before returning.
   - Walk the JSON, inject a fresh UUID into every activity, day, phase, and hotel where `id` is missing.
   - Implementation in `lib/trip-ids.ts` as `injectMissingIds(tripData)`.

2. `/api/chat` (Luna mutations).
   - Tool-use event `add_activity` → server attaches a new UUID to the activity before broadcasting the patch.
   - `%%TRIP_UPDATE%%` marker with `add_activity` → same treatment.
   - `add_hotel` via Luna → same.

3. `/api/hotel-suggestions` (Stays tab).
   - Accept flow attaches a new UUID to the hotel before writing.

4. Phase edit operations (R5.1 ops).
   - `add_phase`, `split_phase` create new phases → fresh UUIDs injected server-side.
   - `edit_phase`, `reorder_phases` preserve existing IDs.

**ID preservation rules.**

| Operation | Day ID | Phase ID | Activity IDs | Hotel IDs |
|---|---|---|---|---|
| Day regenerated (new AI pass) | Preserved | Preserved | New (activities inside are new) | Preserved if outside regen scope |
| Phase regenerated | Preserved | Preserved | New | Preserved if outside scope |
| Phase added | N/A | New | N/A | N/A |
| Phase deleted | N/A | Lost | N/A | N/A |
| Phase split | N/A | Original preserved, new phase gets new ID | Preserved | Preserved |
| Phases merged | N/A | One ID wins (earlier), other is lost | Preserved | Preserved |
| Activity added | N/A | N/A | New | N/A |
| Activity replaced | N/A | N/A | New (old ID lost) | N/A |
| Activity removed | N/A | N/A | Lost | N/A |
| Hotel added | N/A | N/A | N/A | New |
| Hotel removed | N/A | N/A | N/A | Lost |

**Orphaned comments.**

When a comment's `target_id` no longer exists in `trip_data`, the comment is "orphaned." Not deleted.

- Comment's `original_day_id` column tracks the day it originally belonged to (for activity, day, phase, or hotel targets, all map to a day for display purposes).
- UI shows orphaned comments in a collapsed "Orphaned comments" section on that day, with a subtitle: "(referred to an item that was removed)".
- Original `comment_text` preserved verbatim.

**Stage 0 UUID migration.**

One-time script that walks all existing `saved_trips.trip_data` JSONBs and injects UUIDs:

```sql
-- Pseudocode; actual implementation is a function that processes JSONB
-- Audit step first
UPDATE saved_trips
  SET trip_data_pre_migration = trip_data
  WHERE trip_data_pre_migration IS NULL;

-- Migration step (implemented as a Postgres function or script)
-- For each trip:
--   For each day: if day.id missing, set day.id = gen_random_uuid()
--   For each phase (if present): if phase.id missing, set phase.id = gen_random_uuid()
--   For each activity in each slot of each day: if activity.id missing, set activity.id = gen_random_uuid()
--   For each hotel: if hotel.id missing, set hotel.id = gen_random_uuid()

-- Verification query
SELECT id, jsonb_path_query_array(trip_data, '$..id') AS ids FROM saved_trips;
-- Every entity should have an id. Count must match pre-migration entity count.
```

**Migration properties.**
- **Dry-run first.** Migration wrapped in `BEGIN; ... ROLLBACK;` by default. Wilson inspects the diff on one trip, then re-runs with `COMMIT`.
- **Idempotent.** Re-running after initial migration makes no changes (skips entities with existing `id`).
- **Audit-backed.** `trip_data_pre_migration` preserves the original JSONB for 30 days. Dropped in a follow-up cleanup.
- **Verifiable.** Post-migration query confirms every entity has a UUID and entity counts match.

### 3.11 Comments Architecture

**Target types.** Four: `activity`, `day`, `phase`, `hotel`. Not on budget, overview, transport, weather, or trip-level.

**Who can comment.** All three roles (owner, editor, viewer). Viewers gain a voice exclusively through comments.

**Edit and delete.** Author can edit or soft-delete their own comments. Owner can soft-delete any comment. Soft delete sets `deleted_at`; the row is preserved for audit but hidden from queries and UI.

**Size.** 500 character limit. Plain text only. No formatting, mentions, attachments, reactions, threaded replies. Single level.

**UI surface.**

- **Collapsed state (default).** Every commentable entity shows a small comment icon with count badge.
  - Activity card: icon inline next to activity title.
  - Day header: icon shows total count across the day (day-level comments + all activity-level within the day).
  - Phase header: icon shows total count across the phase.
  - Hotel card: icon inline next to hotel title.
- **Expanded state.** Click icon, thread opens inline beneath the entity. Compose field appears. Up to 5 comments visible. "Show N more" reveals the rest. Click icon again or click outside to collapse.
- **No modals. No overlays. No persistent compose fields.**

**Count aggregation logic.**

```typescript
function dayCommentCount(day: Day, allComments: Comment[]): number {
  const dayLevel = allComments.filter(c =>
    c.target_type === 'day' && c.target_id === day.id
  ).length;

  const activityLevel = allComments.filter(c => {
    if (c.target_type !== 'activity') return false;
    return day.activities.some(slot =>
      slot.items.some(act => act.id === c.target_id)
    );
  }).length;

  return dayLevel + activityLevel;
}

function phaseCommentCount(phase: Phase, allDays: Day[], allComments: Comment[]): number {
  const phaseLevel = allComments.filter(c =>
    c.target_type === 'phase' && c.target_id === phase.id
  ).length;
  const dayCounts = allDays
    .filter(d => phase.dayIds.includes(d.id))
    .reduce((sum, d) => sum + dayCommentCount(d, allComments), 0);
  return phaseLevel + dayCounts;
}
```

**Realtime integration.** Comment mutations broadcast via Stage 2 realtime channel as patch types `add_comment`, `edit_comment`, `delete_comment`. Count badges update live across all collaborators.

**Rate limit (optional).** Max 1 comment per 5 seconds per user per trip, enforced server-side in the POST comment route. Soft guard against accidental spam.

### 3.12 Role Enforcement: Three Layers

Every mutation passes through three independent enforcement layers. Any one layer failing is non-fatal; all three together make the security model robust.

**Layer 1: Database RLS (authoritative).**
- `saved_trips` UPDATE policy requires owner or editor role.
- Even if API layer has a bug, the database refuses the write.
- Never relaxed or bypassed.

**Layer 2: API route checks.**
- Every mutation-producing route (`/api/chat`, `/api/hotel-suggestions`, patch endpoints) reads `trip_collaborators.role` before acting.
- For viewer role, returns 403 without attempting the mutation.
- Tool-use handlers in `/api/chat` strip mutation tools for viewers before the Anthropic API call.

**Layer 3: Client UI gating.**
- Viewer UI does not render edit controls (accept button, add note, remove button, phase edit handles).
- Safety net only, NOT security.
- Assumes a malicious client could bypass the UI and call API directly; Layers 1-2 catch that.

**Stage 2c corrigendum (24 April 2026): implementation reality.**

Stage 2c shipped the Layer 2 API enforcement. The specifics differ from the original design and are locked in here:

- **`getRequestUserAndRole(supabase, tripId)` helper** in `lib/collaboration.ts` returns `{ user, role }` for a tripId. Use this in any future API route that needs role-aware behavior. Returns `role: null` when the user has no access; returns `role: 'owner'` for solo trip owners (preserving solo flows unchanged).
- **`/api/chat` uses Path A (buffered) for viewers**, not 403. Viewers can chat with Luna; the server buffers Luna's full response, strips `%%TRIP_UPDATE%%` and `[[ADD:]]` markers, and returns the cleaned text as `text/plain`. Editor/owner path continues to stream SSE unchanged. Tools array is empty for viewers so no tool-use events can leak. Trade-off: viewer loses the typing animation but gains a guaranteed mutation-free response.
- **`/api/trips` POST and PATCH** apply `injectMissingDayIds` (from `lib/trip-ids.ts`) to incoming `trip_data` before write. This closes the "new trip / new day" UUID gap at the DB boundary. The original Stage 2c plan called for injection at `/api/generate`, but that route streams raw Anthropic SSE to the client; mutating tool-use events server-side would require re-parsing and re-emitting SSE (high risk). The `/api/trips` boundary catches every trip regardless of generation path.
- **`/api/hotel-suggestions`, `/api/extra-ideas`, `/api/day-suggestions`, `/api/budget-estimate`** are deliberately NOT gated. They don't write to `saved_trips`; persistence happens through `/api/trips` PATCH which is RLS-gated. Decision documented in each route's file.
- **Solo trips unchanged.** When `tripId` is absent from the chat body (the path used by solo trips), the role lookup is skipped entirely and the stream goes through the editor/owner path.

---

## 4. Risk Analysis

### 4.1 High Risk

| Risk | Impact | Mitigation | Rollback |
|---|---|---|---|
| RLS policy change breaks existing solo trips | Users unable to access own trips | Additive OR clauses, pre-deploy test on all 22 existing trips | `DROP POLICY ... CREATE POLICY` with original definitions |
| UUID migration corrupts existing `trip_data` | Data loss, broken itineraries | Dry-run first, audit backup in `trip_data_pre_migration`, idempotent, verification query | Restore from `trip_data_pre_migration` column |
| Concurrent writes corrupt trip_data JSONB | Data loss for collaborators | JSON patches + activity_log as source of truth. Reconstruct from log if corruption detected. | Replay activity_log to restore last known good state |
| Supabase Realtime connection limit breached | Users cannot sync | Free plan 200 concurrent covers ~100 active trips. Monitor post-launch. Graceful poll-based fallback. Pro upgrade ($25/mo) if needed. | `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=false` disables realtime, keeps sharing |

### 4.2 Medium Risk

| Risk | Impact | Mitigation | Rollback |
|---|---|---|---|
| Share link token leaks | Unwanted joiners | Token + auth required. Owner regenerates token to revoke. | Regenerate token per role via API |
| Role enforcement bypassed at API | Viewer forces a write | Three layers. DB RLS is authoritative. Test viewer attempting UPDATE via direct API call in QA. | RLS refuses the write regardless of API bug |
| Luna cross-awareness confuses users | Poor UX | Short summary (5 events, last 10 min). Flag-gated via `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED`. QA validates tone. | Flip flag to false; Luna works per-user without summary |
| chat_history migration breaks existing solo trip chats | Users lose history | Dual-read pattern (try keyed, fall back to array). Non-destructive. Lazy migration on next save. | Dual-read allows instant rollback; data remains unchanged |
| Prompt cache invalidation from summary injection | Cost spike on Luna | Summary at END of prompt after the stable block. Verify cache_read_input_tokens in Anthropic console after deploy. | Move summary to a separate non-cached section or flag off |
| Comment orphaning annoys users | Confused UX | Clear "referred to removed item" indicator, grouped in "Orphaned" section on original day | Orphaned comments can be manually deleted by owner |

### 4.3 Low Risk

| Risk | Impact | Mitigation | Rollback |
|---|---|---|---|
| Multilingual: collaborators in different locales | Mixed language in chat and activities | Three layers handled independently (UI per-user, trip data in original language, chat bilingual per user). Future single-line prompt addition forces original-language activities if needed. | N/A inherent; prompt fix is trivial |
| Affiliate links in shared context | Commission attribution unclear | Links same regardless of clicker. No change needed. | N/A |
| Comment spam | Noise | 500 char cap. Optional 1/5s rate limit. Owner soft-delete of any comment. | Tighten rate limit, disable viewer comments as last resort |
| Mobile comment thread fails at 375px | Unusable on phone | Explicit 375/768/1280 test, per blog mobile rules. Collapse to narrow inline view. | CSS hotfix |
| Flag flip causes homepage layout jump | Visual regression | Test preview before production flip. Keep section DOM structure stable; CTA conditional. | Vercel instant rollback |

### 4.4 Global Rollback Plan

All changes are behind feature flags. Three flags total:

- `NEXT_PUBLIC_COLLAB_ENABLED` (master). Default off pre-launch, on after Stage 5.
- `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` (Stage 2). Default on. Disables realtime sync only.
- `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED` (Stage 3). Default on. Disables cross-awareness summary only.

**Full kill switch.** Set master flag false, redeploy. All collab UI disappears, existing trips stay intact. No data loss. Tables remain dormant.

**Partial rollback scenarios.** See Section 5.2 of the Tier 1 master plan for six named scenarios and their rollback paths.

---

## 5. Implementation Plan: Staged Approach

Six stages. Each independently shippable behind the master flag. Full per-stage QA subagent call, rollback, and context update defined in Tier 1 master plan Section 4.

### Stage 0: Foundation

**Goal.** Database schema, UUID migration, feature flag, RLS policies. No UI.

| # | Task | Files/Tools | Est. Effort |
|---|---|---|---|
| 0.1 | Create `trip_collaborators` table with three-role CHECK | Supabase migration | 30 min |
| 0.2 | Create `trip_activity_log` table | Supabase migration | 30 min |
| 0.3 | Create `trip_comments` table with four target_types | Supabase migration | 30 min |
| 0.4 | Add columns to `saved_trips` (2 tokens + 3 others + audit) | Supabase migration | 20 min |
| 0.5 | Update RLS policies on `saved_trips` | Supabase migration | 1 hour |
| 0.6 | RLS policies on new tables | Supabase migration | 45 min |
| 0.7 | UUID migration script (dry-run + apply, idempotent) | SQL function / script | 2 hours |
| 0.8 | `NEXT_PUBLIC_COLLAB_ENABLED` env var, default false | Vercel dashboard | 5 min |
| 0.9 | Scaffold files: `lib/collaboration.ts`, `lib/trip-ids.ts` | New files | 15 min |
| 0.10 | Verify existing trip CRUD unaffected | Manual + SQL | 1 hour |
| 0.11 | Update CLAUDE.md via `luna-context-updater` | Subagent | 20 min |

**Total: ~7 hours.**

### Stage 1: Share Link & Invite System

**Goal.** Share, join, manage collaborators with viewer/editor roles.

| # | Task | Files/Tools | Est. Effort |
|---|---|---|---|
| 1.1 | `POST /api/trips/[tripId]/share?role=X` | API route | 1 hour |
| 1.2 | `POST /api/trips/[tripId]/share/regenerate?role=X` | API route | 45 min |
| 1.3 | `POST /api/trips/[tripId]/join?token=X` | API route | 1.5 hours |
| 1.4 | `GET /api/trips/[tripId]/collaborators` | API route | 45 min |
| 1.5 | `PATCH /api/trips/[tripId]/collaborators/[userId]` (role change) | API route | 1 hour |
| 1.6 | `DELETE /api/trips/[tripId]/collaborators/[userId]` | API route | 45 min |
| 1.7 | `POST /api/trips/[tripId]/leave` | API route | 30 min |
| 1.8 | `app/[locale]/trip/[tripId]/page.tsx` (share landing) | New page | 2 hours |
| 1.9 | `InviteModal` with two Copy buttons + list + toggle | Component | 3 hours |
| 1.10 | `CollaboratorAvatars`, `RoleBadge`, `JoinTripPrompt`, `CollaboratorList` | Components | 2 hours |
| 1.11 | "My Trips" page: "Shared with me" section with role badges | Modify existing | 1 hour |
| 1.12 | i18n strings for EN/PT-BR/ES via `luna-multilang-translator` | messages/*.json | 1 hour |

**Total: ~14 hours.**

### Stage 2: Realtime Sync Engine

**Goal.** Changes propagate in real time. Role enforcement at API layer.

| # | Task | Files/Tools | Est. Effort |
|---|---|---|---|
| 2.1 | `lib/realtime.ts` (channel setup, Broadcast, Presence) | New file | 3 hours |
| 2.2 | `lib/trip-patches.ts` (JSON patch gen/apply/merge, all 15+ types) | New file | 4 hours |
| 2.3 | `hooks/useCollaborativeTrip.ts` (React hook) | New file | 4 hours |
| 2.4 | Supabase Realtime publication on `saved_trips` (recovery only) | Migration | 20 min |
| 2.5 | Integrate hook into `plan/page.tsx` (role-aware) | Modify existing | 4 hours |
| 2.6 | Presence display with role-colored avatars and +N overflow | Component | 2 hours |
| 2.7 | `lib/activity-log.ts` (server-side log writer) | New file | 1.5 hours |
| 2.8 | Debounced save (5s idle merge into trip_data) | Part of hook | 1.5 hours |
| 2.9 | Role enforcement in all mutation API routes | Modify existing routes | 2 hours |
| 2.10 | Server-side UUID injection in /api/generate, /api/chat, /api/hotel-suggestions | Modify existing + use `lib/trip-ids.ts` | 1 hour |
| 2.11 | Syncing indicator, reconnect UI, viewer read-only tooltips | UI components | 1 hour |
| 2.12 | Disconnect/reconnect: replay log since last_seen | Part of hook | 2 hours |
| 2.13 | `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` env var | Vercel dashboard | 5 min |
| 2.14 | i18n strings for EN/PT-BR/ES | messages/*.json | 30 min |

**Total: ~23.5 hours.**

### Stage 3: Collaborative Luna Chat (per-user, cross-aware)

**Goal.** Per-user Luna threads. Cross-awareness for context. Viewer Luna read-only.

| # | Task | Files/Tools | Est. Effort |
|---|---|---|---|
| 3.1 | `chat_history` schema: flat array → keyed object. Dual-read pattern | Save logic + read logic | 2 hours |
| 3.2 | `/api/chat/route.ts`: read collaborator role, strip mutation tools for viewer | API route | 1.5 hours |
| 3.3 | Cross-awareness summary builder (last 10 min aggregator) | New function in `lib/ai.ts` or `lib/collaboration.ts` | 2 hours |
| 3.4 | System prompt extension at END (preserves cache) | `lib/ai.ts` | 1 hour |
| 3.5 | Viewer fallback message (EN/PT-BR/ES) | System prompt + messages/*.json | 1 hour |
| 3.6 | Patch broadcast from Luna tool-use and %%TRIP_UPDATE%% | Integrate with Stage 2 channel | 1.5 hours |
| 3.7 | `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED` env var | Vercel dashboard | 5 min |
| 3.8 | Verify prompt caching remains intact via Anthropic console | Manual testing | 30 min |

**Total: ~10 hours.**

### Stage 4: Comments, My Trips, Polish

**Goal.** Full commenting UX, My Trips two-section layout, mobile polish.

| # | Task | Files/Tools | Est. Effort |
|---|---|---|---|
| 4.1 | `CommentThread` component (expandable inline thread) | Component | 3 hours |
| 4.2 | `CommentIcon` with count badge (reusable at all 4 levels) | Component | 1 hour |
| 4.3 | `CommentCompose` (textarea, 500 limit, submit) | Component | 1.5 hours |
| 4.4 | `CommentItem` (avatar, role badge, timestamp, edit/delete) | Component | 1.5 hours |
| 4.5 | Orphaned comments panel with original_day_id lookup | Component + logic | 1.5 hours |
| 4.6 | Count aggregation (day + phase totals) | Utility | 1 hour |
| 4.7 | `POST/PATCH/DELETE/GET /api/trips/[tripId]/comments` routes | API routes | 2 hours |
| 4.8 | Comment mutations as realtime patches (add/edit/delete_comment) | Extend `lib/trip-patches.ts` | 1 hour |
| 4.9 | `CollabToast` (throttled 1/3s) | Component | 1 hour |
| 4.10 | "My Trips" two-section layout with role badges | Modify existing | 1.5 hours |
| 4.11 | PDF export: Collaborators line with roles | Modify existing | 45 min |
| 4.12 | Leave trip API + UI | API route + confirmation dialog | 45 min |
| 4.13 | Owner dashboard in InviteModal (regenerate per token, remove, role toggle) | Extend InviteModal | 1 hour |
| 4.14 | Mobile responsive audit (375/768/1280) | CSS + manual testing | 2 hours |
| 4.15 | i18n strings (heaviest translation batch) for EN/PT-BR/ES | messages/*.json | 1.5 hours |

**Total: ~18 hours.**

### Stage 5: Landing Page & Launch

**Goal.** Homepage section, OG image, flag flip.

| # | Task | Files/Tools | Est. Effort |
|---|---|---|---|
| 5.1 | "Plan Together" section on homepage (after "Meet Luna") | Modify `app/[locale]/page.tsx` | 2 hours |
| 5.2 | i18n strings for section (EN/PT-BR/ES) | messages/*.json | 45 min |
| 5.3 | `/api/og/trip/[tripId]` OG image generator | New route | 1.5 hours |
| 5.4 | SEO metadata keywords update | Layout metadata | 30 min |
| 5.5 | Production env var `NEXT_PUBLIC_COLLAB_ENABLED=true` | Vercel dashboard | 5 min |
| 5.6 | Run `luna-release-writer` for R8 release note | Subagent | 30 min |
| 5.7 | Full CLAUDE.md regen via `luna-context-updater --apply` | Subagent | 30 min |
| 5.8 | 48h Realtime monitoring post-launch | Dashboard | Ongoing |

**Total: ~6 hours.**

**Project total: ~78.5 hours.**

---

## 6. Documentation Plan

### 6.1 Per-stage CLAUDE.md updates

After each stage merges to `main`, the `scripts/update-context.sh` heredoc gets updated via the `luna-context-updater` subagent and `CLAUDE.md` regenerates from it. The full cadence is in Tier 1 master plan Section 6.

### 6.2 Per-stage memory updates

Captured in the context-updater invocation at each stage. See Tier 1 master plan Section 4 for per-stage invocation text.

### 6.3 Existing functionality protection

These must never break during implementation. Every stage QA pass includes a regression check against:

1. Solo trip creation and generation (`/start` → `/plan` flow).
2. Solo trip saving and loading (My Trips page).
3. Luna chat in solo mode (no regression in `%%TRIP_UPDATE%%` handling).
4. Hotel suggestions and acceptance flow.
5. Budget estimation.
6. PDF export.
7. Blog and blog comments (separate system, must remain independent).
8. Authentication (Google OAuth flow).
9. Multilingual support (all three locales).
10. Affiliate links (all CTAs and Luna chat recommendations).
11. Phase editing (R5.1 operations).
12. Long-trip phase-only / phase-day-hybrid / day-only modes (R6).
13. Sonnet 4.5 primary + Haiku 4.5 fallback (AI upgrade Stage 1).
14. Prompt caching on Luna system prompt (AI upgrade Stage 2).
15. Tool-use alongside text markers (AI upgrade Stage 3).
16. Structured itinerary generation (AI upgrade Stage 4).

Feature flag ensures new code paths only activate with `NEXT_PUBLIC_COLLAB_ENABLED=true`.

---

## 7. Effort Estimate Summary

| Stage | Description | Hours |
|---|---|---|
| 0 | Foundation (DB + UUID migration + RLS + flag) | 7 |
| 1 | Share link, invite, role system | 14 |
| 2 | Realtime sync, role enforcement, UUID injection | 23.5 |
| 3 | Per-user Luna with cross-awareness, viewer readonly | 10 |
| 4 | Comments, My Trips integration, mobile polish | 18 |
| 5 | Landing page, launch, flag flip | 6 |
| | **Total** | **~78.5 hours** |

Approximately 3 weeks of focused development. Each stage independently deployable and rollbackable.

---

## 8. Technical Decisions Summary

| Decision | Choice | Reasoning |
|---|---|---|
| Realtime engine | Supabase Realtime (Broadcast + Presence) | Already in stack, no new infrastructure, handles ephemeral + presence. Postgres Changes NOT used in normal flow (refined v2.0). |
| Conflict resolution | Last-Write-Wins with JSON patches + activity log | Simple, predictable, no CRDT complexity. Activity log provides recovery and audit. |
| Permission model | Three-tier (owner/editor/viewer) with hybrid two-link invites | Matches Google Docs mental model. Viewers gain voice via comments. Owner retains full control. |
| Invite mechanism | Two tokens per trip (viewer + editor), owner-only regenerate, per-person role override | Fast common case (send appropriate link), full control for exceptions. |
| Collaborator limit | No hard DB cap, soft UI limit of 10 | Zero extra code. Protects Realtime pool. Realistic usage is 1-3 concurrent per trip. Can raise anytime. |
| Auth requirement | Authenticated users only | Simplifies Stage 1. Uses existing `luna_redirect_after_login` pattern. |
| Share token format | 32-char hex from `gen_random_bytes(16)` | Standard, cryptographically strong, readable in URLs. |
| Feature isolation | Master flag + two partial flags | Zero-risk deployment, instant rollback, granular partial rollback. |
| Route for shared trips | `/trip/[tripId]` separate from `/plan` | Clean separation: "landing for shared trip" vs "edit existing trip". |
| Luna chat model | Per-user thread with cross-awareness summary | Avoids "who is Luna addressing" confusion. Each user gets own history. Luna knows recent collaborator changes. |
| Viewer Luna | Chat-only (mutation tools stripped server-side) | Viewers engage conversationally without accidental trip damage. |
| Comment targets | Activity, day, phase, hotel (4 types) | Covers all meaningful units of trip planning. Budget/overview/transport/weather deferred. |
| Comment UI | Expandable inline thread, collapsed default, max 5 before "Show more" | Minimal visual noise. No modals. Click icon to reveal. |
| Comment UUIDs vs indexes | Stable UUIDs on all entities, server-side injection | Survives any edit/reorder/regeneration. Orphan handling for removed targets. |
| UUID migration | One-time script with dry-run, audit backup, idempotent, verification | Non-destructive. Reversible for 30 days via audit column. |
| Chat history schema | Keyed by user_id with dual-read backward compat | Zero-downtime migration. Existing solo trips work unchanged. |

---

## 9. Open Questions (Resolved)

All spec v1.1 open questions are resolved in Tier 1 decisions (Section 1.2). Listed here for traceability.

1. **Unauthenticated preview of shared trip?** No. Auth required.
2. **Maximum collaborators?** No hard cap. Soft UI limit 10.
3. **Collaborators invite others?** No. Owner-only.
4. **Email notifications on join?** Deferred.
5. **`/plan?savedTripId=X` redirect for collab trips?** Use `/trip/X` for share landing, redirect to `/plan` for editing. Both preserved.
6. **Realtime sync for budget tab?** Yes. Budget recalc broadcasts via `update_budget` patch type.
7. **Viewer permissions scope?** Full read + comments + read-only Luna. No mutations.
8. **Comments on budget/overview/transport/weather?** Deferred. v1 supports activity, day, phase, hotel only.

---

## Appendix A: API Routes Reference

| Method | Route | Purpose | Role required |
|---|---|---|---|
| POST | `/api/trips/[tripId]/share?role=viewer\|editor` | Return or generate share token | Owner |
| POST | `/api/trips/[tripId]/share/regenerate?role=viewer\|editor` | Invalidate + regenerate token | Owner |
| POST | `/api/trips/[tripId]/join?token=X` | Validate token, add as collaborator | Authenticated |
| GET | `/api/trips/[tripId]/collaborators` | List collaborators with roles | Any collaborator |
| PATCH | `/api/trips/[tripId]/collaborators/[userId]` | Promote/demote role | Owner |
| DELETE | `/api/trips/[tripId]/collaborators/[userId]` | Remove collaborator | Owner |
| POST | `/api/trips/[tripId]/leave` | Self-remove | Any non-owner collaborator |
| POST | `/api/trips/[tripId]/comments` | Create comment | Any collaborator |
| GET | `/api/trips/[tripId]/comments` | List all non-deleted comments | Any collaborator |
| PATCH | `/api/trips/[tripId]/comments/[commentId]` | Edit comment | Author only |
| DELETE | `/api/trips/[tripId]/comments/[commentId]` | Soft-delete comment | Author OR owner |
| GET | `/api/og/trip/[tripId]` | Open Graph image for share link | Public (read-only from token) |

## Appendix B: Realtime Channel Reference

| Channel | Purpose | Type |
|---|---|---|
| `trip:{tripId}` | Main trip sync: patches + presence | Broadcast + Presence |
| `trip:{tripId}:comments` | Optional separate channel for comment mutations (may be folded into main) | Broadcast |

Decision on single vs split channel deferred to Stage 2 implementation. Single channel is simpler; split reduces message volume on busy trips. Default to single, split if performance requires.

## Appendix C: JSON Patch Format

**Envelope:**

```json
{
  "id": "patch-uuid",
  "tripId": "trip-uuid",
  "userId": "user-uuid",
  "userName": "Wilson",
  "userRole": "editor",
  "timestamp": 1713168000000,
  "operations": [
    { "op": "replace", "path": "/days/2/activities/afternoon/1/accepted", "value": true }
  ]
}
```

**Supported patch types (by operation):**

- `add_activity`, `remove_activity`, `replace_activity`
- `accept_activity`, `unaccept_activity`
- `add_note`, `update_note`, `remove_note`
- `add_hotel`, `remove_hotel`
- `edit_phase`, `split_phase`, `merge_phases`, `reorder_phases`, `expand_phase`
- `update_budget`
- `add_comment`, `edit_comment`, `delete_comment`

**Path format.** RFC 6902 JSON Pointer. Paths target the `trip_data` object shape:

- `/days/{index}` (day-level ops)
- `/days/{index}/activities/{slot}/{index}` (activity-level ops)
- `/phases/{index}` (phase-level ops)
- `/hotels/{index}` (hotel-level ops)
- `/lunaHotels/{index}` (Luna-added hotels, separate array)
- `/budget` (budget recalc)

**Operations.** `add`, `remove`, `replace`. No `copy`, `move`, or `test` in v1.

## Appendix D: Schema Migration File Layout

Stage 0 migrations (suggested file order in `supabase/migrations/`):

1. `20260424_001_create_trip_collaborators.sql`
2. `20260424_002_create_trip_activity_log.sql`
3. `20260424_003_create_trip_comments.sql`
4. `20260424_004_alter_saved_trips_columns.sql`
5. `20260424_005_update_saved_trips_rls.sql`
6. `20260424_006_rls_trip_collaborators.sql`
7. `20260424_007_rls_trip_activity_log.sql`
8. `20260424_008_rls_trip_comments.sql`
9. `20260424_009_uuid_migration_existing_trips.sql` (dry-run first, then commit)

Dates use actual deployment date. Numbering within date allows strict ordering.

## Appendix E: Component Reference (Stage 1-4)

| Component | Purpose | Stage |
|---|---|---|
| `InviteModal` | Owner's share + manage collaborators UI | 1 |
| `CollaboratorAvatars` | Presence avatars in trip header | 1 |
| `RoleBadge` | Small role indicator (owner/editor/viewer) | 1 |
| `JoinTripPrompt` | "Join this trip as {role}?" confirmation | 1 |
| `CollaboratorList` | List of collaborators with role toggle | 1 |
| `CollabToast` | Throttled notification of collaborator edits | 4 |
| `CommentIcon` | Icon + count badge | 4 |
| `CommentThread` | Expandable inline thread | 4 |
| `CommentCompose` | Textarea + 500 char limit | 4 |
| `CommentItem` | Individual comment display | 4 |
| `SyncIndicator` | "Syncing..." / "Synced" indicator | 2 |
| `PresenceTooltip` | Hover info on presence avatar | 2 |

---

*End of Tier 2 technical spec v2.1. Implementation detail lives here; executive decisions live in `00-master-plan.md`.*
