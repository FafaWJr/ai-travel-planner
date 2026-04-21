# Luna Let's Go: Collaborative Trip Planning

## Feature Specification & Implementation Plan

**Version:** 1.1
**Date:** 15 April 2026
**Authors:** Wilson & Claude (Architecture)
**Status:** Planning / Pre-Implementation

### Decisions Log (v1.1)
- **Auth required:** Only authenticated users can access shared trips. No public/unauthenticated preview.
- **Collaborator limit:** No hard cap in DB/API. Soft UI limit of 10 with friendly message. Can be raised anytime.
- **Invite permissions:** Owner-only. Collaborators cannot generate or share invite links.

---

## 1. Executive Summary

This document describes the full architecture, implementation plan, risk analysis, and testing strategy for adding **real-time collaborative trip planning** to Luna Let's Go. The feature allows a trip owner to share a link with other people, who can then view the same trip, make edits, chat with Luna, and see each other's changes in real time.

The approach uses **Supabase Realtime** (Broadcast + Postgres Changes) as the synchronisation backbone, a new **trip collaborators** permission model in the database, and a **share link system** with invite tokens. No third-party collaboration libraries are needed. The feature builds on top of the existing `saved_trips` table and `plan/page.tsx` architecture.

**Feasibility verdict: YES, this is fully doable** with the current tech stack (Next.js 16 + Supabase + Vercel). No infrastructure changes required. The Supabase free/pro tier supports Realtime out of the box.

---

## 2. Current State Analysis

### 2.1 Database Schema (as of today)

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `profiles` | id (UUID, FK to auth.users), email, full_name, avatar_url | 14 rows, RLS enabled |
| `saved_trips` | id (UUID), user_id (FK to profiles), destination, trip_data (JSONB), chat_history (JSONB), title, is_favorite, start_date, end_date | 22 rows, RLS enabled. **Single-owner model.** |
| `blog_comments` | id, post_slug, user_id (FK to profiles), comment_text, is_approved | 8 rows |
| `user_preferences` | user_id (FK to auth.users), travel_persona, travel_style | 4 rows |

**Critical observation:** `saved_trips.user_id` is a single UUID. There is no concept of shared ownership, collaborators, or permissions. Every trip belongs to exactly one user. This is the core schema limitation that must be addressed.

### 2.2 Frontend Architecture

The trip plan page lives at `/[locale]/plan/page.tsx`. Key state:

- `tripData` (the full itinerary, stored as a large JSONB object with `days[]`, `overview`, `weather`, `transport`, `budget`, `tips`)
- `chatHistory` (array of messages between user and Luna)
- `lunaHotels` (hotels added by Luna via chat, rendered as activity cards)
- `accepted/removed/notes` state per activity per day

The plan page is a **client-side rendered** page that receives trip parameters via URL search params (`?destination=X&...`), calls the `/api/generate-plan` endpoint, and hydrates locally. When loading a saved trip, it reads from `saved_trips.trip_data`.

**Important:** All state is local React state. There is no server-side synchronisation. When a user saves a trip, the entire `tripData` JSONB blob is written to Supabase in a single `upsert`. There are no granular writes.

### 2.3 Luna Chat Architecture

- `/api/chat/route.ts` handles SSE streaming from Anthropic Claude
- `%%TRIP_UPDATE%%` markers in the response stream trigger itinerary mutations
- The `onTripUpdate` handler in `plan/page.tsx` has branches for `add_activity`, `remove_activity`, `replace_activity`
- Chat history is stored alongside the trip in `saved_trips.chat_history`

### 2.4 Authentication

- Supabase Auth with Google OAuth (PKCE flow)
- `@supabase/ssr` client
- `proxy.ts` middleware for locale detection and auth refresh
- Post-auth redirect via `luna_redirect_after_login` localStorage key

### 2.5 What MindTrip Does (Reference Analysis)

Based on research, MindTrip's collaboration model includes:

1. **Invite by link:** Owner generates a shareable link. Recipients join via the link.
2. **Shared itinerary editing:** All collaborators see the same itinerary and can add/remove/reorder items.
3. **Group chat:** Collaborators can chat within the trip context. The AI assistant responds in the shared chat visible to all.
4. **Presence indicators:** Users can see who else is currently viewing/editing the trip.
5. **No complex permissions:** It appears to be a simple "invited = full editor" model, not a viewer/editor/admin tiered system.

---

## 3. Feature Design: How Collaborative Trips Will Work

### 3.1 User Flow

**Owner (User A):**
1. Creates a trip normally (via `/start` flow or loads a saved trip)
2. Clicks "Invite" button in the trip header (similar to MindTrip's screenshot)
3. Sees a modal with: "Copy trip link" button, and optionally email invite
4. The link looks like: `lunaletsgo.com/trip/abc123-def456` (public share URL using trip ID + invite token)

**Collaborator (User B):**
1. Receives the link via text, email, or any messaging app
2. Opens the link in their browser
3. If not logged in: redirected to login page (using `luna_redirect_after_login` localStorage pattern to return to the trip after auth)
4. If logged in but not yet a collaborator: sees a "Join this trip?" confirmation, then is added as a collaborator
5. If logged in and already a collaborator: loads the full interactive trip directly
6. Can now edit activities, accept/remove items, add notes, and chat with Luna
7. All changes sync in real time to all connected collaborators

**Real-time sync (both users connected):**
- User A adds an activity via Luna chat. User B sees it appear within 1-2 seconds.
- User B accepts a hotel suggestion. User A sees the acceptance state update.
- Both users see a "collaborators online" indicator showing who is currently viewing the trip.

### 3.2 Permission Model

A simple two-tier model (matching MindTrip's approach):

| Role | Can View | Can Edit Itinerary | Can Chat with Luna | Can Delete Trip | Can Invite Others |
|------|----------|--------------------|--------------------|-----------------|-------------------|
| **Owner** | Yes | Yes | Yes | Yes | Yes |
| **Collaborator** | Yes | Yes | Yes | No | No |

The owner is the original creator (`saved_trips.user_id`). Collaborators are tracked in a new `trip_collaborators` table.

### 3.3 Share Link Mechanism

Each trip gets a **share token** (a cryptographically random string, 32 chars). The share link format:

```
https://www.lunaletsgo.com/trip/{trip_id}?invite={share_token}
```

The token serves two purposes:
1. **Validation:** Only people with the correct token can join as collaborators
2. **Revocability:** The owner can regenerate the token to invalidate all previous links

The `/trip/[tripId]` route is a NEW route (not the existing `/plan` route). It acts as:
- The "shared trip view" page for collaborators
- A redirect to `/plan?tripId=X` for authenticated collaborators
- A public preview page for unauthenticated visitors

### 3.4 Data Architecture

**New tables:**

```sql
-- Table: trip_collaborators
CREATE TABLE trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Table: trip_activity_log (for real-time sync and audit trail)
CREATE TABLE trip_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES saved_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL, -- 'add_activity', 'remove_activity', 'accept_activity', 'add_note', 'chat_message', 'update_hotel', etc.
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Columns added to saved_trips
ALTER TABLE saved_trips
  ADD COLUMN share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN is_collaborative BOOLEAN DEFAULT false,
  ADD COLUMN last_synced_at TIMESTAMPTZ DEFAULT now();
```

**Modified RLS policies on saved_trips:**

Current: user can only read/update their own trips (`user_id = auth.uid()`).
New: user can read/update trips where they are a collaborator OR the owner.

```sql
-- Read: owner OR collaborator
CREATE POLICY "Users can view own or collaborated trips"
  ON saved_trips FOR SELECT
  USING (
    user_id = auth.uid()
    OR id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

-- Update: owner OR collaborator
CREATE POLICY "Users can update own or collaborated trips"
  ON saved_trips FOR UPDATE
  USING (
    user_id = auth.uid()
    OR id IN (SELECT trip_id FROM trip_collaborators WHERE user_id = auth.uid())
  );

-- Delete: owner only (unchanged)
CREATE POLICY "Users can delete own trips"
  ON saved_trips FOR DELETE
  USING (user_id = auth.uid());
```

### 3.5 Real-Time Synchronisation Strategy

The sync architecture uses **two Supabase Realtime mechanisms** working together:

**1. Broadcast (for low-latency, ephemeral events):**
- Cursor/presence: who is online, what section they are viewing
- Typing indicators in Luna chat
- Optimistic UI updates (immediate visual feedback before DB write)

**2. Postgres Changes (for persistent state changes):**
- Subscribes to `saved_trips` table changes filtered by `trip_id`
- When any collaborator writes to `trip_data`, all subscribers receive the update
- This is the "source of truth" sync, ensuring no data is lost even if Broadcast messages are missed

**Conflict resolution strategy: Last-Write-Wins with Granular Patches**

Instead of overwriting the entire `trip_data` JSONB blob on every change, the system will use **JSON patch operations** (RFC 6902 style). Each edit generates a patch like:

```json
{
  "op": "replace",
  "path": "/days/2/activities/1/accepted",
  "value": true,
  "userId": "abc-123",
  "timestamp": 1713168000
}
```

These patches are:
1. Applied optimistically on the local client
2. Broadcast to all connected clients via Supabase Broadcast
3. Written to `trip_activity_log` for persistence
4. Periodically merged into `saved_trips.trip_data` (debounced, every 5 seconds of inactivity)

This approach avoids the classic "two people save at the same time and one overwrites the other" problem.

### 3.6 Luna Chat in Collaborative Mode

When a trip is collaborative:
- Chat history is shared (all collaborators see all messages)
- Each message is tagged with the sender's `user_id` and `full_name`
- Luna's responses include the name of who asked: "Based on Wilson's request, I've added..."
- The `%%TRIP_UPDATE%%` blocks from Luna trigger patches that are broadcast to all collaborators
- Chat messages are written to `trip_activity_log` with action type `chat_message` and also appended to `saved_trips.chat_history`

### 3.7 Presence System

Using Supabase Realtime Presence:

```typescript
const channel = supabase.channel(`trip:${tripId}`)
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  // state = { 'user-abc': [{ name: 'Wilson', avatar: '...', activeTab: 'itinerary' }] }
})
channel.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      name: user.full_name,
      avatar: user.avatar_url,
      activeTab: currentTab,
      online_at: new Date().toISOString()
    })
  }
})
```

The UI shows small avatars of connected collaborators in the trip header, similar to Google Docs.

### 3.8 Supabase Realtime: Plan Limits & Realistic Usage

**Official Supabase Realtime limits by plan (April 2026):**

| Metric | Free ($0) | Pro ($25/mo) | Pro (no spend cap) |
|--------|-----------|-------------|---------------------|
| Concurrent connections | 200 | 500 | 10,000 |
| Messages per second | 100 | 500 | 2,500 |
| Channel joins per second | 100 | 500 | 2,500 |
| Channels per connection | 100 | 100 | 100 |
| Presence messages/sec | 20 | 50 | 1,000 |
| Broadcast payload size | 256 KB | 3,000 KB | 3,000 KB |
| Postgres change payload size | 1,024 KB | 1,024 KB | 1,024 KB |

**Realistic usage analysis for Luna Let's Go:**

The key metric is **concurrent connections** (users actively viewing a collaborative trip at the same moment). This is NOT total registered users or total collaborators. A collaborator who is not on the page uses zero connections.

Typical travel planning pattern: one person works on the itinerary, saves it, shares the link. The other person opens it later, makes their adjustments. Occasionally 2-3 friends hop on at the same time to finalize plans. This means realistic concurrent connections per trip are 1-3, not 10.

**Free plan capacity examples:**
- 100 collaborative trips, average 2 people online each = 200 connections (at the limit)
- 50 collaborative trips, average 1-2 people online each = 50-100 connections (comfortable)
- Solo users not viewing collaborative trips = 0 Realtime connections

**Message throughput:** Each itinerary edit (accept activity, add note, chat message) generates ~1 Broadcast message. A single JSON patch is ~200 bytes, well within the 256 KB free plan payload limit. Even 3 people actively editing the same trip produce 1-2 messages/second. You would need 50+ trips being actively edited simultaneously to approach 100 msg/sec.

**Full trip_data payload:** A 10-day trip with all activities, hotels, and budget data is typically 50-80 KB as JSONB. This is well within the 256 KB Broadcast limit on the free plan. The debounced save (Postgres Changes) uses the 1,024 KB limit, which is more than sufficient.

**Verdict:** The free plan comfortably supports collaborative trips at launch and through early growth. Upgrading to Pro ($25/mo) only becomes necessary when you have hundreds of active collaborative trips being edited concurrently. The upgrade is a billing toggle with no code changes.

### 3.9 Multilingual Behaviour in Collaborative Mode

When collaborators use different locales (e.g., User A in English, User B in PT-BR), three layers are affected:

**Layer 1: UI chrome (zero issue).** Buttons, tabs, labels, and navigation are rendered per-user via `next-intl` and the `[locale]` URL segment. User A on `/en/plan` sees English UI. User B on `/pt-BR/plan` sees Portuguese UI. This is already built, per-user, and no shared state is involved. No changes needed.

**Layer 2: Trip data content (stored in one language).** The itinerary (`trip_data` JSONB) is generated once by Luna when the trip is first created. All activity names, descriptions, tips, and budget text are stored in the language of the user who created the trip. When User B opens the same trip, the UI labels adapt to their locale (e.g., "Manhã", "Tarde", "Noite" for time-of-day headers) but the actual itinerary content stays in the original language. This is standard behaviour and matches every collaborative travel tool including MindTrip. No changes needed.

**Layer 3: Luna chat (naturally bilingual).** The existing `getLanguageInstruction()` in `lib/ai.ts` tells Luna to respond in the user's locale. In collaborative mode:
- User A asks Luna something in English. Luna responds in English.
- User B asks Luna something in Portuguese. Luna responds in Portuguese.
- The chat thread becomes bilingual, which is natural for a multilingual travel group.

**Edge case: mixed-language activity additions.** When User B asks Luna in Portuguese to add a restaurant, the `%%TRIP_UPDATE%%` activity text will be in Portuguese (e.g., "Jantar: Restaurante Sarong (Seminyak)"). That card now appears in User A's itinerary alongside English activities. In practice this is not a problem: restaurant names, place names, and locations are universal. For a bilingual group, this is natural.

**Future polish option (not needed for v1):** If mixed-language activities ever become confusing, add one line to the Luna system prompt: "When adding activities to the itinerary via %%TRIP_UPDATE%%, always write the activity text in {original_trip_language}, even if the user is chatting in a different language." This is a trivial change that can be added post-launch if user feedback warrants it.

---

## 4. Risk Analysis

### 4.1 High Risk

| Risk | Impact | Mitigation | Rollback |
|------|--------|------------|----------|
| **RLS policy change breaks existing solo trips** | Users unable to access own trips | Test exhaustively with existing data before deploying. New policies are additive (OR clause), not replacing existing logic. Migration includes a verification query. | Revert migration via `DROP POLICY ... CREATE POLICY` with original definition |
| **Concurrent writes corrupt trip_data JSONB** | Data loss for collaborators | JSON patch approach with activity log as source of truth. If corruption detected, reconstruct from activity log. | Restore trip_data from last known good state via activity log replay |
| **Supabase Realtime connection limits** | Users unable to sync | Free plan allows 200 concurrent connections, which supports ~100 collaborative trips with 2 users online each. Realistic usage (1-3 concurrent users per trip) gives ample headroom. Monitor usage via Supabase dashboard. Implement graceful degradation (poll-based fallback). Upgrade to Pro ($25/mo, 500 connections) if growth demands it. | Feature works without Realtime (manual refresh fallback) |

### 4.2 Medium Risk

| Risk | Impact | Mitigation | Rollback |
|------|--------|------------|----------|
| **Share link token leaks** | Unwanted people join trips | Token is required + user must be authenticated. Owner can regenerate token to revoke access. Add "Remove collaborator" feature. | Owner regenerates share token, removing all pending invites |
| **Luna chat confusion with multiple users** | Luna loses context | System prompt includes all collaborator names and who asked what. Each message is tagged. | Revert to single-user chat (disable shared chat) |
| **Performance: large trip_data + Realtime** | Slow updates on large itineraries | Granular patches instead of full JSONB writes. Debounced save. | Increase debounce interval, reduce patch frequency |

### 4.3 Low Risk

| Risk | Impact | Mitigation | Rollback |
|------|--------|------------|----------|
| **Multilingual: collaborators in different locales** | Mixed language in shared chat and itinerary activities | Three layers handled independently: (1) UI chrome adapts per-user via next-intl, no issue. (2) Trip data stays in the original generation language. (3) Luna chat becomes naturally bilingual, each user gets responses in their own locale. Activities added by Luna via %%TRIP_UPDATE%% are written in the language of the person who asked. Future polish: a one-line system prompt addition can force all %%TRIP_UPDATE%% content to match the original trip language. See Section 3.9. | N/A, inherent in design. System prompt fix is trivial if needed. |
| **Affiliate links in shared context** | Commission attribution unclear | Affiliate links remain the same regardless of who clicks. No change needed. | N/A |

### 4.4 Global Rollback Plan

All changes are behind a feature flag (`NEXT_PUBLIC_COLLAB_ENABLED`). If anything goes catastrophically wrong:

1. Set `NEXT_PUBLIC_COLLAB_ENABLED=false` in Vercel env vars
2. Redeploy (2-minute process)
3. All collaborative UI elements disappear
4. Existing trips continue to work in single-user mode
5. `trip_collaborators` and `trip_activity_log` tables remain but are dormant
6. No data loss, no schema rollback needed

---

## 5. Implementation Plan: Staged Approach

### Stage 0: Foundation (Database + Feature Flag)

**Goal:** Lay the groundwork without touching any existing functionality.

**Tasks:**

| # | Task | Files/Tools | Est. Effort |
|---|------|-------------|-------------|
| 0.1 | Create `trip_collaborators` table with RLS | Supabase migration | 30 min |
| 0.2 | Create `trip_activity_log` table with RLS | Supabase migration | 30 min |
| 0.3 | Add `share_token`, `is_collaborative`, `last_synced_at` columns to `saved_trips` | Supabase migration | 20 min |
| 0.4 | Update RLS policies on `saved_trips` (read/update for collaborators) | Supabase migration | 45 min |
| 0.5 | Add `NEXT_PUBLIC_COLLAB_ENABLED` env var to Vercel (default: false) | Vercel dashboard | 5 min |
| 0.6 | Create `lib/collaboration.ts` utility module (empty scaffold) | New file | 15 min |
| 0.7 | Verify all existing trip CRUD operations still work with new RLS | Manual testing + SQL queries | 1 hour |
| 0.8 | Update `CLAUDE.md` and memory with new schema | Script / memory edit | 20 min |

**Test Plan (Stage 0):**
- Run all existing trip operations (create, save, load, delete, update) and confirm no regressions
- Verify that `share_token` column has unique values for all 22 existing trips
- Verify new RLS: user A cannot read user B's trips (unchanged behavior)
- Verify new RLS: if user A is added to `trip_collaborators` for user B's trip, user A can now read it
- Verify delete: only owner can delete, not collaborator

---

### Stage 1: Share Link & Invite System

**Goal:** Users can generate share links, and other users can join trips.

**Tasks:**

| # | Task | Files/Tools | Est. Effort |
|---|------|-------------|-------------|
| 1.1 | Create API route `POST /api/trips/[tripId]/share` (generates/returns share link) | `app/api/trips/[tripId]/share/route.ts` | 1 hour |
| 1.2 | Create API route `POST /api/trips/[tripId]/join` (validates token, adds collaborator) | `app/api/trips/[tripId]/join/route.ts` | 1.5 hours |
| 1.3 | Create API route `GET /api/trips/[tripId]/collaborators` (lists collaborators) | `app/api/trips/[tripId]/collaborators/route.ts` | 45 min |
| 1.4 | Create API route `DELETE /api/trips/[tripId]/collaborators/[userId]` (remove collaborator) | Nested route | 45 min |
| 1.5 | Create the `/trip/[tripId]` page (share landing page) | `app/[locale]/trip/[tripId]/page.tsx` | 2 hours |
| 1.6 | Build "Invite" button + modal component in trip header | `components/plan/InviteModal.tsx` | 2 hours |
| 1.7 | Build collaborator avatars display in trip header | `components/plan/CollaboratorAvatars.tsx` | 1.5 hours |
| 1.8 | Update "My Trips" page to show collaborative trips (trips user is invited to) | `app/[locale]/my-trips/page.tsx` | 1.5 hours |
| 1.9 | Add i18n strings for all new UI text (EN, PT-BR, ES) | `messages/*.json` | 1 hour |

**Test Plan (Stage 1):**
- Owner clicks "Invite", a share link is generated and can be copied
- Share link contains valid trip ID and token
- Unauthenticated user visiting share link is redirected to login, then returned to the trip after auth
- Authenticated user visiting share link sees "Join this trip?" confirmation
- After joining, collaborator sees the trip in their "My Trips" page
- Collaborator can open and view the trip (read-only at this stage, editing comes in Stage 2)
- Owner can see list of collaborators and remove one
- Removing a collaborator revokes their access (they get a "trip not found" when refreshing)
- Regenerating share token invalidates all previous links
- Duplicate join attempts (same user, same trip) are handled gracefully (no error, just no-op)
- Collaborator cannot see the "Invite" button (owner-only)
- Soft limit: when 10 collaborators already exist, UI shows a friendly message
- Test with 3+ collaborators on a single trip

---

### Stage 2: Real-Time Sync Engine

**Goal:** Changes made by any collaborator are visible to all in real time.

**Tasks:**

| # | Task | Files/Tools | Est. Effort |
|---|------|-------------|-------------|
| 2.1 | Create `lib/realtime.ts` (Supabase channel setup, Broadcast, Presence) | New file | 3 hours |
| 2.2 | Create `lib/trip-patches.ts` (JSON patch generation, application, merge) | New file | 3 hours |
| 2.3 | Create `hooks/useCollaborativeTrip.ts` (React hook wrapping realtime + state) | New file | 4 hours |
| 2.4 | Add Realtime publication for `saved_trips` table | Supabase migration | 20 min |
| 2.5 | Integrate `useCollaborativeTrip` into `plan/page.tsx` (conditional on collab mode) | Modify existing | 4 hours |
| 2.6 | Implement Presence display (online collaborators, active tab indicator) | Component + hook | 2 hours |
| 2.7 | Implement activity log writer (all mutations write to `trip_activity_log`) | `lib/activity-log.ts` | 2 hours |
| 2.8 | Implement debounced save (merge patches into trip_data every 5s of inactivity) | Part of hook | 1.5 hours |
| 2.9 | Add "syncing" indicator in trip header (shows when changes are being pushed) | UI component | 1 hour |
| 2.10 | Handle disconnection/reconnection (resubscribe, fetch latest state) | Part of hook | 2 hours |

**Test Plan (Stage 2):**
- Open same trip in two browser tabs (different users). User A accepts an activity. User B sees the acceptance within 2 seconds.
- User A adds a note to Day 1. User B sees the note appear.
- User A removes an activity. User B sees it removed.
- Both users make changes simultaneously. No data is lost. Both changes are reflected.
- Disconnect one user's network. Reconnect. The user receives all missed changes.
- Presence: both users see each other's avatars in the header. When one closes the tab, the other sees them disappear.
- Activity log: all changes are recorded in `trip_activity_log` with correct user attribution.
- Performance: test with a large itinerary (10+ days) to verify patch-based sync is fast.
- Verify the debounced save writes to `saved_trips.trip_data` correctly.

---

### Stage 3: Collaborative Luna Chat

**Goal:** Luna chat becomes shared. All collaborators see the conversation and can interact.

**Tasks:**

| # | Task | Files/Tools | Est. Effort |
|---|------|-------------|-------------|
| 3.1 | Modify `/api/chat/route.ts` to include collaborator context in system prompt | API route | 1.5 hours |
| 3.2 | Tag each chat message with sender name and avatar | Chat component + API | 1.5 hours |
| 3.3 | Broadcast chat messages via Realtime (not just via SSE) | `lib/realtime.ts` extension | 2 hours |
| 3.4 | Handle `%%TRIP_UPDATE%%` from Luna in collaborative context (broadcast the patch) | `plan/page.tsx` + hook | 2 hours |
| 3.5 | Show "User is typing..." indicator for collaborators | Broadcast event | 1 hour |
| 3.6 | Sync chat history to `saved_trips.chat_history` (shared, not per-user) | Save logic update | 1 hour |
| 3.7 | Ensure Luna addresses users by name when multiple collaborators are chatting | System prompt update | 45 min |

**Test Plan (Stage 3):**
- User A sends a message to Luna. User B sees the message and Luna's response in real time.
- User B sends a follow-up. Luna maintains context from both users.
- Luna's `%%TRIP_UPDATE%%` (e.g., add_activity) is reflected in both users' itineraries.
- "Typing" indicator appears when a collaborator is composing a message.
- Chat history is persisted correctly and loads for both users on page refresh.
- Luna addresses users by name: "Great suggestion, Fafa! I've added..."
- Concurrent messages from both users do not break the chat flow or cause duplicates.

---

### Stage 4: My Trips Integration & UX Polish

**Goal:** Full integration with existing features, polished collaborative UX.

**Tasks:**

| # | Task | Files/Tools | Est. Effort |
|---|------|-------------|-------------|
| 4.1 | "My Trips" page: separate section for "Trips shared with me" | `my-trips/page.tsx` | 2 hours |
| 4.2 | Trip card: show collaborator count badge and owner name | `components/TripCard.tsx` | 1 hour |
| 4.3 | Notification system: toast when collaborator makes a change | `components/plan/CollabToast.tsx` | 1.5 hours |
| 4.4 | "Leave trip" option for collaborators | API route + UI | 1 hour |
| 4.5 | Owner dashboard: manage collaborators, toggle "allow invites" | Modal extension | 1.5 hours |
| 4.6 | PDF export: include collaborator names in the export | Export logic update | 45 min |
| 4.7 | Budget tab: show who accepted which items (attribution) | Budget component update | 1 hour |
| 4.8 | Mobile responsive: ensure invite modal, presence avatars, collab toast work on mobile | CSS/responsive fixes | 2 hours |
| 4.9 | Unsaved changes warning: adapt for collaborative mode (auto-save means less friction) | Warning component update | 45 min |
| 4.10 | Loading states: "Syncing with collaborators..." skeleton | UI states | 1 hour |

**Test Plan (Stage 4):**
- "My Trips" page shows two sections: "My Trips" and "Shared with Me"
- Trip cards for shared trips show the owner's name and collaborator count
- Toasts appear when a collaborator makes a change while you are on the page
- "Leave trip" removes the user from collaborators and the trip disappears from their "My Trips"
- PDF export includes a "Collaborators" line in the header
- Mobile: invite modal is usable on 375px screens. Presence avatars collapse into a "+N" overflow.
- Full end-to-end flow works on mobile Safari and Chrome

---

### Stage 5: Landing Page Update & Launch

**Goal:** Announce the feature publicly on the main page and enable it for all users.

**Tasks:**

| # | Task | Files/Tools | Est. Effort |
|---|------|-------------|-------------|
| 5.1 | Add "Plan Together" section to homepage (after "Meet Luna" or as part of features) | `app/[locale]/page.tsx` | 3 hours |
| 5.2 | Add i18n strings for the new section (EN, PT-BR, ES) | `messages/*.json` | 1 hour |
| 5.3 | Create OG image for shared trip links (trip name + Luna branding) | Image generation route | 2 hours |
| 5.4 | Update SEO metadata: add "collaborative trip planning" keywords | Layout metadata | 30 min |
| 5.5 | Set `NEXT_PUBLIC_COLLAB_ENABLED=true` in production | Vercel env vars | 5 min |
| 5.6 | Update `CLAUDE.md` with full collab architecture documentation | Script/heredoc update | 1 hour |
| 5.7 | Update memory edits with new tables, patterns, and constraints | Memory tool | 30 min |
| 5.8 | Monitor Supabase Realtime connections and performance for 48 hours | Dashboard + logs | Ongoing |

**Test Plan (Stage 5):**
- Homepage loads with the new "Plan Together" section in all three languages
- Shared trip links generate correct OG metadata when pasted into social media
- SEO audit: new keywords are indexed, canonical URLs are correct
- Feature flag flip enables the feature without redeployment
- Monitor for 48 hours: no Realtime connection errors, no RLS policy failures, no data corruption

---

## 6. Homepage Section Design

When the feature is live, add this section to the homepage (suggested placement: after "Meet Luna" section).

**Section: Plan Together**

Heading: "Plan together, from anywhere."
Subheading: "Share your trip with friends, family, or travel partners. Everyone edits the same itinerary in real time. Luna keeps up with all of you."

Feature bullets (rendered as visual cards, not a list):
- **Share a link** . Send your trip to anyone with a single link. No app download required.
- **Edit together** . Add activities, swap hotels, accept suggestions. Everyone sees every change instantly.
- **Chat with Luna as a group** . Ask Luna to add a restaurant, change the pace, or plan a free afternoon. She responds to the whole group.
- **Your trip, your crew** . See who is online, who accepted what, and keep everyone aligned.

CTA button: "Start Planning Together" (links to `/start`)

---

## 7. Documentation Plan

### 7.1 CLAUDE.md Updates (per stage)

After each stage is merged to `main`, the `CLAUDE.md` heredoc template must be updated with:

- New tables and their FK relationships
- New API routes
- New components and their props
- New RLS policies
- Realtime channel naming conventions
- Patch format documentation

### 7.2 Memory Updates (per stage)

After each stage, update Claude project memory with:

| Stage | Memory Update |
|-------|---------------|
| 0 | New tables: `trip_collaborators`, `trip_activity_log`. New columns on `saved_trips`: `share_token`, `is_collaborative`, `last_synced_at`. Updated RLS policies. |
| 1 | Share link API routes. `/trip/[tripId]` route. InviteModal component. |
| 2 | Realtime architecture: Broadcast for ephemeral, Postgres Changes for persistent. `useCollaborativeTrip` hook. JSON patch format. Debounced save pattern. |
| 3 | Collaborative chat: messages tagged with sender. Luna system prompt includes collaborators. `%%TRIP_UPDATE%%` broadcast flow. |
| 4 | My Trips integration. CollabToast. Leave trip flow. PDF collaborator attribution. |
| 5 | Homepage section. Feature flag enabled. OG image for shared links. |

### 7.3 Existing Functionality Protection

**CRITICAL: These must never break during implementation:**

1. Solo trip creation and generation (the `/start` to `/plan` flow)
2. Solo trip saving and loading (My Trips page)
3. Luna chat in solo mode (no regressions in `%%TRIP_UPDATE%%` handling)
4. Hotel suggestions and acceptance flow
5. Budget estimation
6. PDF export
7. Blog and comments
8. Authentication (Google OAuth flow)
9. Multilingual support (all three locales)
10. Affiliate links (all CTAs and Luna chat recommendations)

**Protection strategy:** Every stage includes a regression test checklist covering all 10 items above. The feature flag ensures the new code paths are only activated when `NEXT_PUBLIC_COLLAB_ENABLED=true`.

---

## 8. Effort Estimate Summary

| Stage | Description | Estimated Effort |
|-------|-------------|------------------|
| 0 | Foundation (DB + flag) | 4 hours |
| 1 | Share link & invite system | 12 hours |
| 2 | Real-time sync engine | 23 hours |
| 3 | Collaborative Luna chat | 10 hours |
| 4 | My Trips integration & UX polish | 12.5 hours |
| 5 | Landing page & launch | 8 hours |
| **Total** | | **~70 hours** |

This represents approximately **2-3 weeks of focused development** depending on pace. Each stage can be deployed independently and tested in isolation before moving to the next.

---

## 9. Technical Decisions Summary

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Realtime engine | Supabase Realtime (Broadcast + Postgres Changes) | Already in the stack, no additional infrastructure, handles both ephemeral and persistent sync |
| Conflict resolution | Last-Write-Wins with JSON patches | Simple, predictable, avoids CRDT complexity. Activity log provides audit trail for recovery. |
| Permission model | Two-tier (owner/collaborator), owner-only invites | Simple, secure. Collaborators cannot share the trip link. Reduces risk of uncontrolled access. |
| Collaborator limit | No hard cap, soft UI limit of 10 | Zero extra code vs a hard cap. Protects Supabase Realtime pool (200 on free, 500 on Pro). Realistic concurrent usage is 1-3 per trip, so free plan is comfortable at launch. Can be raised anytime without migration. |
| Auth requirement | Authenticated users only | Simplifies Stage 1 (no preview page). Uses existing `luna_redirect_after_login` pattern. |
| Share mechanism | Token-based link | Simplest UX (no email invites required), revocable, works across platforms |
| Feature isolation | Feature flag (`NEXT_PUBLIC_COLLAB_ENABLED`) | Zero-risk deployment, instant rollback, allows gradual rollout |
| New route for shared trips | `/trip/[tripId]` (separate from `/plan`) | Clean separation between "generating a new trip" and "viewing/editing a shared trip" |
| Chat in collab mode | Shared chat visible to all | Matches MindTrip, simplest mental model, Luna maintains full context |

---

## 10. Open Questions (Resolved)

1. ~~**Should unauthenticated users see a read-only preview of the shared trip?**~~ **RESOLVED: No.** Auth is required. Unauthenticated users are redirected to login, then returned to the trip after auth.

2. ~~**Maximum collaborators per trip?**~~ **RESOLVED: No hard cap.** Soft UI limit of 10 with a friendly message ("Trips work best with up to 10 collaborators"). No database constraint. Supabase Free plan supports 200 concurrent Realtime connections (Pro: 500). Realistic usage is 1-3 concurrent users per trip, so the free plan comfortably handles early growth. The soft UI limit is a UX decision, not a technical one.

3. ~~**Should collaborators be able to invite others, or only the owner?**~~ **RESOLVED: Owner-only.** This reduces the risk of uncontrolled token sharing. The share API endpoint validates `saved_trips.user_id = auth.uid()`.

4. **Email notifications when someone joins your trip?** Nice to have but not essential for v1. Could integrate with Brevo (already set up for the project). Deferred to post-launch.

5. **Should the existing `/plan?savedTripId=X` route redirect to `/trip/X` for collaborative trips?** Recommended yes, for URL consistency. To be confirmed during Stage 1.

6. **Real-time sync for the budget tab?** The budget is generated by an AI call. When one user triggers "Recalculate", should the result be broadcast? Recommended yes, treating it like any other trip_data update. To be confirmed during Stage 2.

---

## Appendix A: New API Routes Reference

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/trips/[tripId]/share` | Generate or regenerate share token |
| POST | `/api/trips/[tripId]/join` | Join a trip using invite token |
| GET | `/api/trips/[tripId]/collaborators` | List collaborators |
| DELETE | `/api/trips/[tripId]/collaborators/[userId]` | Remove a collaborator |
| POST | `/api/trips/[tripId]/leave` | Self-remove from a trip |

## Appendix B: Realtime Channel Naming

| Channel | Purpose | Type |
|---------|---------|------|
| `trip:{tripId}` | Main trip sync channel | Broadcast + Presence |
| `trip:{tripId}:chat` | Chat messages | Broadcast |

## Appendix C: JSON Patch Format

```json
{
  "id": "patch-uuid",
  "tripId": "trip-uuid",
  "userId": "user-uuid",
  "userName": "Wilson",
  "timestamp": 1713168000000,
  "operations": [
    {
      "op": "replace",
      "path": "/days/2/activities/1/accepted",
      "value": true
    }
  ]
}
```

Supported operations: `add`, `remove`, `replace`. Paths follow the `trip_data` JSONB structure.

---

*This document is the single source of truth for the collaborative trips feature. It will be updated as decisions are made and implementation progresses.*
