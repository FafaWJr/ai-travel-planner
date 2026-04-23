# Luna Collaborative Trips: Master Implementation Plan

**Tier 1 Master Plan**
**Version:** 2.1 (adds viewer/editor permissions and comments)
**Date:** 22 April 2026
**Authors:** Wilson & Claude
**Status:** Planning, pre-implementation
**Supersedes:** v2.0 (22 April 2026), which superseded spec v1.1 (15 April 2026)

---

## 0. How to read this document

This is the single source of truth for the collaborative trips feature. It sits above the spec and the per-stage Claude Code prompts. When in doubt, this document wins.

- Tier 1 (this file): master plan, locked decisions, per-stage scope summaries.
- Tier 2: `docs/specs/collaborative-trips.md` v2.1, full technical spec.
- Tier 3: six per-stage Claude Code prompts, `luna-collab-stage-0.md` through `luna-collab-stage-5.md`.
- Tier 4: the CLAUDE.md regen prompt (prerequisite, ran before Stage 0).

---

## 1. Current state and decision log

### 1.1 What changed since spec v1.1 (15 April 2026)

| Area | Spec v1.1 assumed | Current reality | Impact |
|---|---|---|---|
| Feature flag pattern | `NEXT_PUBLIC_COLLAB_ENABLED` would be the first big flag | AI upgrade sprint shipped 4 flags already | Pattern is battle-tested, reuse conventions |
| Phase editing | Not mentioned | R5.1 shipped: cascade range edits, phase collapse, `edit_phase`, `split_phase`, `merge_phases`, `reorder_phases` | Patches must support phase-level ops |
| Long trips | Not mentioned | R6 shipped: short (day-only), medium (phases + days), long (phase-only with expansion) | Collab sync must work in all three modes |
| Luna chat architecture | `streamCompletion` + `%%TRIP_UPDATE%%` text markers | Same, plus AI Upgrade Stage 3 adds native tool-use alongside | Patch sources include both text markers AND tool-use events |
| Multilingual | Noted but no operational detail | Full rollout complete. `docs/i18n/multilang-reference.md` exists. `luna-multilang-translator` and `luna-multilang-qa` subagents live | Every stage uses the translator subagent for PT-BR and ES strings |
| QA process | Ad-hoc manual checks | `luna-qa-agent`, `luna-multilang-qa` subagents live | Every stage has a formal subagent QA pass |
| CLAUDE.md updates | Manual heredoc edits | `luna-context-updater` and `luna-release-writer` subagents live | Per-stage context updates become subagent calls |
| Luna chat in collab | Shared across all collaborators | Decision changed: per-user chat with cross-awareness | Section 3.6 rewritten (see 1.2 below) |

### 1.2 Locked scope decisions (confirmed by Wilson, 22-23 April 2026)

1. **Auth required.** No public preview page. Unauthenticated visitors to a share link are redirected to login, then returned to the trip post-auth.

2. **Collaborator limit.** Soft UI limit of 10. No DB cap. Can be raised by editing one UI string.

3. **Invite permissions.** Owner-only. Collaborators cannot regenerate or share invite tokens.

4. **Luna chat is per-user, with cross-awareness.**
   - Each user has their own private Luna thread.
   - When User A's Luna modifies the trip, the change broadcasts to all collaborators as a trip patch.
   - When User B opens Luna, the system prompt is built fresh with current trip state, so Luna automatically knows the trip already contains User A's change.
   - Additionally, the system prompt includes a short "collaborator context" summary (last 10 minutes: recent patches + recent comments + active presence) so Luna can reference them naturally.
   - Viewer Luna is read-only: viewers can chat with Luna, but Luna's mutation tools are disabled server-side for viewer sessions.

5. **Activity log scope.**
   - Table `trip_activity_log` is created and written to on every mutation.
   - Used for: (a) sync recovery after disconnection, (b) backend audit trail.
   - NOT used for: user-visible timeline UI. Deferred to post-launch.

6. **Landing page.** Lighter touch for v1. One homepage card/section plus navbar awareness. Not a full dedicated blog post or hero takeover. Revisit in Stage 5.

7. **Architectural refinement vs spec v1.1.** The "debounced save every 5s" + "subscribe to Postgres Changes" combo in v1.1 is redundant. Refined pattern: Broadcast is primary sync, `trip_activity_log` is recovery source, `saved_trips.trip_data` is written on debounce and only read on initial page load. No Postgres Changes subscription in normal operation.

8. **Viewer / editor / owner permission tiers.** Three-tier model with hybrid two-link invites (Option D from planning discussion).
   - **Owner:** full control. Invite, delete trip, manage collaborators, full edit, comment.
   - **Editor:** full edit, full Luna (with mutations), comment, cannot invite, cannot delete trip, cannot remove collaborators.
   - **Viewer:** read-only trip access, read-only Luna (chat only, no mutations), can comment. Cannot accept/modify activities, cannot add notes, cannot edit phases, cannot add hotels.
   - **Two invite tokens per trip:** `share_token_viewer` and `share_token_editor`. Only one active per role at a time (regenerating invalidates the previous).
   - **Per-person role override:** owner can promote/demote any individual collaborator in the InviteModal, overriding the link default they joined with.
   - **Migration safety:** existing `trip_collaborators` rows with role `collaborator` are migrated to `editor` in Stage 0. Since feature is pre-launch, this affects zero production rows but is safe for any test data.

9. **Comments on activities, days, phases, and hotels.**
   - Four target types: `activity`, `day`, `phase`, `hotel`. Not on budget, overview, transport, weather, or trip-level.
   - All three roles (owner, editor, viewer) can add comments. Viewers gain a voice through comments.
   - Author can edit or soft-delete their own comments. Owner can soft-delete any comment.
   - 500 character limit. Plain text only. No formatting, mentions, attachments, reactions, or threaded replies. Single level.
   - **UI surface:** comment icon with count next to each entity. Click to expand inline thread. Compose field appears only when expanded. Max 5 visible before "Show more". No modal, no overlay.
   - **Realtime:** comments broadcast via the Stage 2 channel alongside trip patches.
   - **Luna awareness:** comments feed into Luna's cross-awareness summary (Stage 3).

10. **Stable UUIDs on all commentable entities.**
    - Every activity, day, phase, and hotel carries an `id: UUID` field in `trip_data`.
    - Comments reference `(target_type, target_id)`. No positional indexing.
    - **Server-side UUID injection:** the client never generates IDs. The server (in `/api/generate`, `/api/chat` post-processing, `/api/hotel-suggestions` accept flow, and phase edit operations) injects UUIDs before the data reaches the client or is persisted.
    - **ID preservation rules:**
      - Day ID preserved across day regeneration (the day is still "Day 3", only contents change).
      - Phase ID preserved across phase edits (add/remove activities within the phase) and phase regeneration. Lost only on phase deletion or merge.
      - Activity ID lost on `replace_activity` (new activity gets a new ID). Comments orphan naturally.
      - Hotel ID lost on `remove_hotel`.
    - **Orphaned comments:** if a comment's target entity no longer exists, the comment is shown in an "orphaned" section on its original day (tracked via `original_day_id`) with a clear "this comment referred to an item that was removed" indicator. Not deleted.
    - **Migration in Stage 0:** one-time script injects UUIDs into every activity, day, phase, and hotel in the 22 existing `saved_trips.trip_data` JSONBs. Idempotent (skips entities with existing `id`). Audit backup in `trip_data_pre_migration` column, kept 30 days.

### 1.3 What is NOT in scope for v1

- Email notifications when someone joins (Brevo integration). Deferred.
- User-visible activity timeline ("Wilson added X 3 mins ago"). Deferred.
- Comment reactions, mentions, threaded replies, attachments. Deferred.
- Comments on budget, overview, transport, weather. Deferred.
- Voting on suggestions. Deferred.
- Mobile push notifications. Deferred.

---

## 2. Stage plan summary

Six stages, Stage 0 through Stage 5. Each stage is independently shippable behind the feature flag. Each stage has its own QA pass, rollback, and context update.

| Stage | Name | Effort | Risk |
|---|---|---|---|
| 0 | Foundation (DB schema, UUID migration, flag, RLS) | 7h | Medium-high (RLS change + migration) |
| 1 | Share link, invite system, viewer/editor tokens | 14h | Low |
| 2 | Realtime sync engine, role-gated mutations | 23.5h | Medium |
| 3 | Collaborative Luna chat (per-user, viewer-readonly, cross-aware) | 10h | Low |
| 4 | Comments, My Trips integration, UX polish | 18h | Low-medium |
| 5 | Landing page and launch | 6h | Very low |
| | **Total** | **~78.5h** | |

Total effort is approximately 3 weeks of focused Wilson execution time. Comments and permissions add ~16.5h over v2.0, offset by the simpler per-user Luna architecture.

---

## 3. Prerequisites (before Stage 0)

### 3.1 CLAUDE.md regeneration

**Status: complete.** Ran via `luna-context-updater` subagent on 23 April 2026 with the `luna-claude-md-regen.md` prompt. Captured 11 days of drift. All spot-checks passed.

### 3.2 Commit the Tier 1 master plan to the repo

**Status: in progress (this commit).** Document lives at `docs/specs/collab/00-master-plan.md`.

### 3.3 Remove stale root `update-context.sh`

**Status: in progress (this commit).** Canonical version at `scripts/update-context.sh`.

---

## 4. Stage details

Every stage follows the same shape. Subsections below are terse; the Tier 3 prompt for each stage contains the full file-level detail.

### Stage 0: Foundation

**Goal.** Database schema, UUID migration, feature flag, RLS policies. No UI changes. No new routes. No behavior changes visible to users.

**Deliverables.**

*Schema.*
- New table `trip_collaborators` (with three-role CHECK: `owner`, `editor`, `viewer`).
- New table `trip_activity_log`.
- New table `trip_comments` (with four target types: `activity`, `day`, `phase`, `hotel`).
- New columns on `saved_trips`: `share_token_viewer`, `share_token_editor`, `is_collaborative`, `last_synced_at`, `trip_data_pre_migration` (audit, 30-day lifespan).
- Updated RLS policies on `saved_trips`: SELECT allows owner + any role; UPDATE allows owner + editor only; DELETE owner only.
- RLS policies on `trip_collaborators`, `trip_activity_log`, `trip_comments`.

*UUID migration.*
- One-time migration script that walks all existing `saved_trips.trip_data` JSONBs and injects UUIDs into every activity, day, phase, and hotel.
- Idempotent (skips entities with existing `id`).
- Dry-run first via `BEGIN; ... ROLLBACK;` wrapper. Wilson inspects diff on one trip, confirms, then commits.
- Audit backup written to `saved_trips.trip_data_pre_migration` column.
- Verification query: every entity in every trip has a UUID post-migration. Entity counts match pre-migration.

*Application.*
- New env var `NEXT_PUBLIC_COLLAB_ENABLED=false` (default off in all environments).
- Empty scaffold file `lib/collaboration.ts`.
- Empty scaffold file `lib/trip-ids.ts` (UUID injection helpers for new trip generation).

**Multilingual impact.** None. No user-visible strings.

**QA subagent call.**
```
/agents luna-qa-agent

Stage 0 foundation. Test only data layer.

1. Confirm RLS: user A cannot SELECT user B's trips (baseline preserved).
2. Confirm RLS: insert user A as editor in trip_collaborators for user B's trip. User A can now SELECT and UPDATE.
3. Confirm RLS: insert user A as viewer. User A can SELECT but NOT UPDATE.
4. Confirm DELETE RLS: only owner can delete, not editor, not viewer.
5. Confirm all 22 existing trips have unique share_token_viewer and share_token_editor values.
6. Confirm UUID migration: every activity, day, phase, and hotel in every existing trip has an id field.
7. Confirm migration idempotency: re-run the migration, verify no changes.
8. Confirm audit backup: trip_data_pre_migration column populated for all 22 trips.
9. Confirm trip_comments RLS: viewers can INSERT comments, viewers cannot INSERT trip_data mutations.
10. Confirm existing solo trip CRUD (create, save, load, delete) is unaffected.

Do NOT check UI behavior. Stage 0 has no UI changes.
```

**Rollback.**
- Option A: Vercel instant rollback to previous deployment.
- Option B: Schema rollback SQL (provided in Tier 3 prompt). Drops new tables/columns, reverts RLS, restores `trip_data` from `trip_data_pre_migration`. This is reversible because of the audit backup.
- Option C: N/A. Feature flag is already off.

**Context update.** After merge:
```
/agents luna-context-updater

Stage 0 collab foundation shipped. Update CLAUDE.md and memory with:
- New tables: trip_collaborators (three roles: owner/editor/viewer), trip_activity_log, trip_comments (four target types).
- New columns on saved_trips: share_token_viewer, share_token_editor, is_collaborative, last_synced_at, trip_data_pre_migration (30-day audit).
- Updated RLS: SELECT (owner + any role), UPDATE (owner + editor), DELETE (owner only).
- UUID migration complete: all entities in trip_data have stable id fields.
- Server-side ID injection scaffold at lib/trip-ids.ts.
- Feature flag NEXT_PUBLIC_COLLAB_ENABLED added, default false.
```

**Release note for `docs/architecture/post-r6-changelog.md`.** Append Stage 0 entry with migration files referenced.

---

### Stage 1: Share link and invite system (viewer + editor tokens)

**Goal.** Owner can generate viewer and editor share links. Recipients join as viewer or editor. Owner can promote/demote individual collaborators. No realtime sync yet.

**Deliverables.**

*API routes.*
- `POST /api/trips/[tripId]/share?role=viewer|editor` — generates or returns the role-specific share token.
- `POST /api/trips/[tripId]/share/regenerate?role=viewer|editor` — invalidates old token, generates new one.
- `POST /api/trips/[tripId]/join?token=X` — validates token, adds user as viewer or editor based on which token matched.
- `GET /api/trips/[tripId]/collaborators` — lists all collaborators with role.
- `PATCH /api/trips/[tripId]/collaborators/[userId]` — owner promotes/demotes role.
- `DELETE /api/trips/[tripId]/collaborators/[userId]` — owner removes collaborator.
- `POST /api/trips/[tripId]/leave` — self-remove (collaborator only, not owner).

*Pages and components.*
- New page: `app/[locale]/trip/[tripId]/page.tsx` (share landing, handles auth redirect + "Join this trip?" prompt, shows role they'll join as).
- New components: `InviteModal`, `CollaboratorAvatars`, `JoinTripPrompt`, `RoleBadge`, `CollaboratorList` (with role toggle).
- Trip header update: "Invite" button visible to owner only when `NEXT_PUBLIC_COLLAB_ENABLED=true`.
- InviteModal content: two "Copy link" buttons (Viewer, Editor), collaborator list with role toggle, regenerate buttons per token.
- My Trips page: "Shared with me" section, with role badge on each card.

*i18n.*
- All new UI strings in EN, PT-BR, ES via `luna-multilang-translator` subagent.

**Auth flow.**
- Unauthenticated visitor to `/trip/{tripId}?invite={token}`: store full URL in `luna_redirect_after_login`, redirect to login, return post-auth.
- Authenticated visitor, not yet collaborator: show "Join this trip as viewer/editor?" prompt (role determined by which token matched), on accept call join endpoint.
- Authenticated visitor, already collaborator: redirect to `/plan?savedTripId={tripId}`.
- Authenticated visitor, is owner: redirect to `/plan?savedTripId={tripId}`.

**QA subagent call.**
```
/agents luna-qa-agent

Stage 1 share link, invite, roles.

1. Owner clicks Invite, sees two Copy buttons (Viewer, Editor). Both generate valid URLs.
2. Unauth user opens editor link: redirected to login, returned to /trip/X, joins as editor.
3. Unauth user opens viewer link: redirected to login, returned, joins as viewer.
4. Auth user opens link: sees Join prompt with correct role indicator.
5. After join, collaborator sees trip in My Trips with correct role badge.
6. Viewer: Invite button not visible, edit controls not rendered.
7. Editor: Invite button not visible, edit controls rendered normally.
8. Owner promotes viewer to editor via InviteModal toggle: collaborator's UI updates on next load.
9. Owner demotes editor to viewer: collaborator loses edit controls on next load.
10. Owner removes collaborator: removed user loses access on next load.
11. Owner regenerates viewer token: old viewer link 404s, new link works. Editor token unaffected.
12. Owner regenerates editor token: old editor link 404s, new link works. Viewer token unaffected.
13. Soft limit of 10 total collaborators: friendly message on 11th join attempt.
14. Flag off: Invite button does not render, trip routes behave like before.

Also run /agents luna-multilang-qa for all three locales on new strings.
```

**Rollback.**
- Option A: Vercel instant rollback.
- Option C: Set `NEXT_PUBLIC_COLLAB_ENABLED=false`, redeploy. All collab UI hidden. DB unchanged.

**Context update.**
```
/agents luna-context-updater

Stage 1 shipped. Update:
- New API routes under /api/trips/[tripId]/.
- New page route /trip/[tripId].
- New components: InviteModal (two-token), CollaboratorAvatars, JoinTripPrompt, RoleBadge, CollaboratorList.
- Auth flow for share links (luna_redirect_after_login pattern extended).
- Role-based UI gating: viewer vs editor vs owner.
- Collab UI gated by NEXT_PUBLIC_COLLAB_ENABLED.
```

---

### Stage 2: Realtime sync engine, role-gated mutations

**Goal.** Changes by any editor or owner appear on all connected collaborators' screens within 2 seconds. Presence works. Viewers see changes but cannot make them.

**Deliverables.**

*Realtime core.*
- `lib/realtime.ts`: channel setup, Broadcast, Presence.
- `lib/trip-patches.ts`: JSON patch generation, application, merge.
- `hooks/useCollaborativeTrip.ts`: React hook wrapping realtime + state.
- `lib/activity-log.ts`: writes to `trip_activity_log` on every mutation.
- Supabase Realtime publication enabled for `saved_trips` (recovery fallback only).
- Integration into `app/[locale]/plan/page.tsx`: hook activates when trip has `is_collaborative=true` AND flag is on.
- Presence display: avatars in trip header, with role badges.
- Syncing indicator in trip header.
- Disconnect/reconnect handling: on resubscribe, replay activity log since last-seen timestamp.
- Debounced save: patches accumulate for 5 seconds, then merge into `saved_trips.trip_data`.

*Role enforcement.*
- Server-side role check in every mutation-producing API route (`/api/chat`, `/api/hotel-suggestions`, etc.) and every patch broadcast.
- Viewer patch attempts are rejected server-side with 403, even if the client somehow emits one.
- Client-side: viewer UI does not render edit controls (accept button, add note, remove button, phase edit handles).

*Patch types supported.*
- `add_activity`, `remove_activity`, `replace_activity` (Luna chat + manual).
- `accept_activity`, `unaccept_activity`.
- `add_note`, `update_note`, `remove_note`.
- `add_hotel`, `remove_hotel` (Stays tab + Luna).
- `edit_phase`, `split_phase`, `merge_phases`, `reorder_phases` (R5.1 phase ops).
- `update_budget` (budget recalc trigger).
- `expand_phase` (R6 long-trip phase expansion).
- `add_comment`, `edit_comment`, `delete_comment` (new, Stage 4 UI uses these).

*UUID injection server-side.*
- `/api/generate`: post-process structured emit_itinerary output, inject UUIDs into every activity/day/phase.
- `/api/chat`: when tool-use or `%%TRIP_UPDATE%%` produces `add_activity`, inject UUID before broadcasting patch.
- `/api/hotel-suggestions`: accept flow injects UUID for the hotel.

*Second feature flag.*
- `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=true` (default on, separate flag for partial rollback).

**Multilingual impact.** Low. Syncing toast, presence tooltip, reconnecting message, viewer read-only tooltip.

**Conflict resolution.** Last-write-wins via Broadcast timestamp. Activity log preserves both sides for manual recovery. No CRDT complexity in v1.

**QA subagent call.**
```
/agents luna-qa-agent

Stage 2 realtime sync + role-gated mutations. Use three sessions: owner, editor, viewer.

1. Owner accepts activity, editor and viewer see it within 2s.
2. Editor adds note, owner and viewer see it.
3. Viewer tries to accept an activity: no button rendered. If forced via API call, 403.
4. Editor removes activity, others see removal.
5. Owner and editor edit simultaneously. No data loss. Both changes present.
6. Viewer disconnects, reconnects, sees all missed changes.
7. Presence: all three avatars visible with role badges. Tab close removes avatar within 10s.
8. Large trip (10+ days): patches apply without lag.
9. Debounced save: trip_data reflects all patches after 5s idle.
10. activity_log: every patch creates a row with correct user_id and role.
11. R5.1 phase ops sync across editors. Viewer sees phase changes but cannot trigger them.
12. R6 long-trip expansion syncs (owner expands phase, viewer and editor see day cards appear).
13. UUID injection: every new activity from Luna has a UUID in the patch.
14. Realtime flag off (NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=false): sharing works, sync requires manual refresh.

Also run /agents luna-multilang-qa for new strings.
```

**Rollback.**
- Option A: Vercel instant rollback.
- Option C: `NEXT_PUBLIC_COLLAB_ENABLED=false`. All realtime code paths skip.
- Option D (partial): `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=false`. Collaborators can still access trips; changes require manual refresh.

**Context update.**
```
/agents luna-context-updater

Stage 2 shipped. Update:
- lib/realtime.ts: Broadcast + Presence architecture.
- lib/trip-patches.ts: JSON patch format, RFC 6902 ops, full supported types list.
- hooks/useCollaborativeTrip.ts: wraps realtime state + patches.
- Debounced save pattern: 5s idle, merge patches into saved_trips.trip_data.
- Disconnect recovery: replay activity_log since last_seen.
- Role-gated mutations: server-side 403 for viewer patches.
- UUID injection points: /api/generate, /api/chat, /api/hotel-suggestions.
- Second flag NEXT_PUBLIC_COLLAB_REALTIME_ENABLED for partial rollback.
```

---

### Stage 3: Collaborative Luna chat (per-user, viewer-readonly, cross-aware)

**Goal.** Each user has their own Luna thread. Luna is aware of recent changes and comments by other collaborators. Viewer Luna is chat-only (no mutation tools).

**Deliverables.**

*Luna chat route changes.*
- `app/api/chat/route.ts`: reads user's role on the trip. If `viewer`, disable mutation tools server-side (strip `add_activity`, `remove_activity`, etc. from the tools array before calling Anthropic). Viewer Luna can still suggest, describe, and plan, but cannot commit changes.
- System prompt extension when trip is collaborative: appended at END of prompt (preserves prompt caching).

*Cross-awareness summary format (last 10 minutes):*
```
COLLABORATOR CONTEXT (last 10 minutes):
- Wilson (editor) added "Dinner at Ichiran Shinjuku" to Day 2 evening
- Fafa (owner) commented on Day 3: "Let's keep this day flexible"
- Fafa (owner) commented on Phase 2: "Relaxed pace, no early starts"
- Wilson (editor) is currently viewing the Stays tab
```

Capped at 5 most-recent events combined across patches, comments, and presence. Formatted terse to conserve tokens and preserve prompt cache integrity.

*Chat history migration.*
- `saved_trips.chat_history` shape changes from flat array to keyed object: `{ "user_abc": [...messages], "user_def": [...messages] }`.
- Dual-read pattern: code tries keyed access first, falls back to flat array for existing solo trips. Zero data rewrite needed.
- When existing solo trip first gains a collaborator, the flat array is lazily migrated to `{ ownerId: [...existing] }` on next save.

*Patch broadcast from Luna.*
- `%%TRIP_UPDATE%%` text markers and tool-use outputs from any user's Luna produce trip patches via Stage 2 realtime channel.
- Viewer Luna produces no patches (tools disabled upstream).

*Third feature flag.*
- `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED=true` (default on, for quick rollback of cross-awareness if it confuses users).

**Critical rule.** The AI upgrade architecture (Sonnet 4.5 primary + Haiku 4.5 fallback, prompt caching) must continue working. Cross-awareness summary is added to the **end** of the system prompt alongside `getLanguageInstruction`, preserving the cached stable block.

**Multilingual impact.** Low. Cross-awareness summary is server-side (not user-visible UI). Viewer Luna "I can't modify the trip, ask an editor" fallback message needs EN, PT-BR, ES.

**QA subagent call.**
```
/agents luna-qa-agent

Stage 3 per-user Luna with cross-awareness and viewer readonly.

1. Owner opens Luna, chats about Day 2. Editor opens Luna, sees empty chat (not owner's thread).
2. Owner asks Luna to add a dinner to Day 3. Luna adds it. Patch broadcasts to editor and viewer within 2s.
3. Editor opens Luna. Luna's opening response mentions the recent dinner (awareness works).
4. Editor asks Luna to swap dinner for lunch. Luna swaps. Patch broadcasts.
5. Viewer opens Luna, asks "what restaurants are nearby?". Luna answers conversationally.
6. Viewer asks "add a sushi place to Day 2". Luna responds "I can't modify the trip in viewer mode. Ask an editor to add it." Mutation does not happen.
7. Viewer comments on Day 3: "Can we eat earlier?". Comment broadcasts.
8. Owner opens Luna. Cross-awareness includes viewer's comment. Luna can reference it.
9. Chat history persists per user. Refresh preserves own thread.
10. Migration: existing solo trip chat loads correctly under owner's user_id key.
11. Prompt caching active (verify cache hits in Anthropic console for consecutive owner messages).
12. Sonnet 4.5 fallback to Haiku 4.5 still triggers on simulated primary failure.
13. NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED=false: Luna works per-user without cross-awareness summary.

Also run /agents luna-multilang-qa:
- Owner in EN, viewer in PT-BR: each gets Luna in own language, no contamination.
- Viewer read-only message renders correctly in all three locales.
```

**Rollback.**
- Option A: Vercel instant rollback.
- Option C: `NEXT_PUBLIC_COLLAB_ENABLED=false`. Chat reverts to flat-array reads via dual-read fallback.
- Option E (partial): `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED=false`. Luna works per-user, skips cross-awareness summary. Use if summary confuses or breaks cache.

**Context update.**
```
/agents luna-context-updater

Stage 3 shipped. Update:
- Luna per-user in collab mode. chat_history keyed by user_id.
- Dual-read pattern for backward compat with existing flat-array chat_history.
- System prompt addition: cross-awareness summary (last 10 min, capped at 5 events).
- Viewer Luna: mutation tools stripped server-side, chat-only mode.
- %%TRIP_UPDATE%% and tool-use broadcast via Stage 2 realtime.
- Third flag NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED.
- Prompt caching preserved (summary at end of prompt).
```

---

### Stage 4: Comments, My Trips integration, UX polish

**Goal.** Commenting works at all four levels. Every edge around the feature is polished. Mobile works. PDF export attributes.

**Deliverables.**

*Comments UI.*
- `CommentThread` component: expandable inline thread under any entity. Collapsed by default. Click icon + count to expand. Compose box appears when expanded. Max 5 visible before "Show N more" toggle.
- `CommentIcon` component: reusable icon + count badge. Placed next to activity titles, day headers, phase headers, hotel cards.
- `CommentCompose` component: single textarea, 500 char limit, Submit button. Disabled state if not signed in (shouldn't happen inside a trip, but defensive).
- `CommentItem` component: avatar, name, role badge, relative timestamp, text, edit/delete on hover (author or owner only).
- Orphaned comments panel: if a comment's target UUID no longer exists in `trip_data`, show in a collapsed "Orphaned comments" section on its `original_day_id` day, with "(referred to an item that was removed)" subtitle.
- Count aggregation: day header shows total count across the day (day-level comments + all activity-level comments in that day's slots). Phase header aggregates across the phase.

*Comment API routes.*
- `POST /api/trips/[tripId]/comments` — create, body: `{ target_type, target_id, comment_text }`.
- `PATCH /api/trips/[tripId]/comments/[commentId]` — edit (author only).
- `DELETE /api/trips/[tripId]/comments/[commentId]` — soft delete (author or owner).
- `GET /api/trips/[tripId]/comments` — list all non-deleted comments for the trip.

*Realtime integration.*
- Comment mutations broadcast as `add_comment`, `edit_comment`, `delete_comment` patches via Stage 2 channel.
- Comment counts update in real time across all connected collaborators.

*Comment throttle.*
- Optional rate limit: max 1 comment per 5 seconds per user per trip (abuse prevention). Soft, can be disabled if not needed.

*My Trips page.*
- Two sections: "My Trips" (owned) and "Shared with Me" (collaborator).
- Trip card for shared trips shows owner name, role badge, collaborator count.
- Optional filter: all / owned / shared.

*Other polish.*
- `CollabToast`: subtle toast on edit from collaborator ("Wilson added an activity"). Throttled max 1 per 3s.
- Leave trip flow: "Leave this trip" option for collaborators (not owner).
- Owner dashboard (in InviteModal): collaborator list with role toggle, remove, regenerate tokens.
- PDF export: "Collaborators:" line in the header with names and roles.
- Mobile responsive audit: 375/768/1280px. Invite modal, presence avatars collapse to +N, comment thread expand, collab toast.
- Loading state: "Syncing with collaborators..." skeleton when joining.
- Unsaved changes warning suppressed in collab mode (auto-save via debounce makes it moot).

**Multilingual impact.** High. Every comment UI string (Add comment, Edit, Delete, Show more, Posted by X, Orphaned comments, X min ago, Cancel, Save) + all other polish strings in EN, PT-BR, ES.

**QA subagent call.**
```
/agents luna-qa-agent

Stage 4 comments + polish.

Comments:
1. Owner adds comment to activity. Editor and viewer see it within 2s.
2. Editor adds comment to Day 3. Count badge appears on day header and aggregates into parent phase header.
3. Viewer adds comment to hotel card. Comment visible to all.
4. Viewer adds comment to Phase 2. All see it, Luna cross-awareness picks it up in next Luna chat.
5. 500 char limit: textarea blocks input past 500, shows counter.
6. Author edits their own comment: change broadcasts.
7. Owner soft-deletes editor's comment: removed from all views. Editor cannot edit deleted.
8. Editor tries to delete viewer's comment: forbidden (403), edit/delete buttons not rendered.
9. Orphaned comment: owner removes an activity with comments. Comments appear in Orphaned section on that day with subtitle.
10. Count aggregation: day header count = day-level comments + activity-level comments within day. Phase header = all counts in phase.
11. Thread expand: click icon, thread opens inline, max 5 visible, Show more reveals rest.
12. Compose appears only when expanded. Clicking outside collapses.
13. Mobile 375px: thread fits, compose fits, no overflow.

Polish:
14. My Trips: two sections, correct categorization, role badges visible.
15. CollabToast appears, throttled.
16. Leave trip: collaborator leaves, trip gone from their My Trips, owner still sees it.
17. PDF export: Collaborators line with names and roles.
18. Owner regenerates both tokens separately.
19. Mobile: all elements usable.

Also run /agents luna-multilang-qa on all new strings (comments UI heaviest).
```

**Rollback.**
- Option A: Vercel instant rollback.
- Option C: `NEXT_PUBLIC_COLLAB_ENABLED=false`. All Stage 4 UI hides. Existing comments in DB remain but inaccessible via UI until flag flips back.

**Context update.**
```
/agents luna-context-updater

Stage 4 shipped. Update:
- Comments UI: CommentThread, CommentIcon, CommentCompose, CommentItem components.
- Comment targets: activity, day, phase, hotel. Four target_types in trip_comments.
- Orphaned comment handling: preserved on original_day_id with visual indicator.
- Count aggregation: day and phase headers aggregate child counts.
- Comment API routes under /api/trips/[tripId]/comments/.
- Comment mutations as realtime patches: add_comment, edit_comment, delete_comment.
- My Trips: owned + shared sections, role badges.
- CollabToast: throttle pattern 1 per 3s.
- Leave trip API: POST /api/trips/[tripId]/leave.
- PDF export includes Collaborators line with roles.
- Mobile: presence avatars +N, comment thread expand, collab toast responsive.
```

---

### Stage 5: Landing page and launch

**Goal.** Tell users the feature exists. Flip the flag on. Monitor for 48 hours.

**Deliverables (lighter touch, per Wilson's direction).**
- One "Plan Together" card/section on homepage, placed after "Meet Luna".
- Section copy (EN): headline "Plan together, from anywhere", subhead "Share your trip with friends and family. Everyone edits the same itinerary in real time, Luna keeps up with all of you.", CTA "Start Planning Together" linking to `/start`.
- Translated EN, PT-BR, ES via `luna-multilang-translator`.
- Open Graph image generation for shared trip links: `/api/og/trip/[tripId]` route produces an image with trip title + destination + Luna branding.
- SEO metadata: add "collaborative trip planning" keywords to homepage metadata.
- Flag flip: `NEXT_PUBLIC_COLLAB_ENABLED=true` in production Vercel env vars.
- Monitor Supabase Realtime connections via dashboard for 48h post-launch. Alert thresholds: >150 concurrent (free plan, 200 cap) or >400 on Pro.

**Multilingual impact.** High for this stage. Every homepage string needs translation. OG image text uses locale of the requester.

**QA subagent call.**
```
/agents luna-qa-agent

Stage 5 launch.

1. Homepage loads with Plan Together section visible.
2. Section copy renders in all three locales correctly.
3. CTA links to /start.
4. OG image generates for a shared trip link (paste in Slack, iMessage, or use opengraph.xyz).
5. Flag flip in production: all previously-hidden collab UI appears.
6. Existing solo users see no change in their experience.
7. Supabase Realtime dashboard: connection count baseline recorded for 48h monitoring.

Also run /agents luna-multilang-qa on homepage section.
```

**Rollback.**
- Option A: Vercel instant rollback (removes homepage section).
- Option C: `NEXT_PUBLIC_COLLAB_ENABLED=false`. Flag flips off, all collab disappears.

**Context update.**
```
/agents luna-context-updater

Stage 5 shipped, collab live.
- Homepage has Plan Together section.
- OG image route /api/og/trip/[tripId].
- Flag NEXT_PUBLIC_COLLAB_ENABLED=true in production.
- 48h monitoring window started.
```

**Release writer call.**
```
/agents luna-release-writer

Write the R8 collaborative trips release note. Cover:
- Full arc: Stages 0-5.
- Key decisions: per-user Luna with cross-awareness, three-tier permissions (viewer/editor/owner), commenting on all entities, stable UUIDs.
- Known limitations: no email notifications, no activity timeline UI, no reactions/threaded replies.
- Metrics to watch: Realtime connections, share link click-through, join conversion, comment usage rate.
```

---

## 5. Project-level rollback plan

### 5.1 Full kill switch (all stages off)

**Command.**
```
Vercel dashboard → project → Settings → Environment Variables → Production
Set NEXT_PUBLIC_COLLAB_ENABLED=false
Trigger redeploy
```

**What happens.**
- All collab UI disappears (Invite button, presence avatars, shared section in My Trips, comments, homepage Plan Together section).
- Existing collaborative trips still exist in DB. Owner retains access via normal solo flow.
- Collaborators lose UI access path but rows remain in `trip_collaborators`, re-enabled on flag flip back.
- No data loss.
- No schema rollback needed.
- Solo trips, Luna chat, all existing functionality unaffected.

### 5.2 Partial rollback scenarios

**Scenario: Realtime sync is buggy but sharing works.**
- Set `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=false` (second flag, Stage 2).
- Outcome: collaborators can still access trips, changes require manual refresh.

**Scenario: Luna cross-awareness confuses users or breaks prompt cache.**
- Set `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED=false` (third flag, Stage 3).
- Outcome: Luna works per-user without cross-awareness summary.

**Scenario: Viewer role has bugs but editor/owner works.**
- No dedicated flag. Options:
  1. Manually promote all affected viewers to editor in Supabase SQL (temporary).
  2. Disable the viewer token in code, leaving only editor token active.
  3. Full kill switch (most conservative).

**Scenario: Comments break.**
- No dedicated flag in v1. If critical: deploy a hotfix that renders CommentIcon hidden via a fourth flag, deferred if comments prove stable in QA. Document as follow-up.

**Scenario: RLS policy change broke solo trips.**
- Highest-risk scenario, caught at Stage 0.
- Rollback: re-apply original RLS policies via Supabase migration with reverse SQL.
- Verify: all 22 existing trips load for their owners.

**Scenario: UUID migration corrupted a trip.**
- Restore from `trip_data_pre_migration` audit column for that trip.
- Audit column lives 30 days before cleanup.

### 5.3 Schema rollback (last resort)

Only needed if Stage 0 itself breaks production. Execute in this order:
1. Revert `saved_trips` RLS policies to original definitions.
2. Restore `trip_data` from `trip_data_pre_migration` where needed.
3. Drop new columns on `saved_trips`.
4. Drop new tables: `trip_comments`, `trip_activity_log`, `trip_collaborators`.

After Stage 1 ships, schema rollback becomes destructive (tokens in use). Do not do this post-Stage-1.

---

## 6. CLAUDE.md update cadence

| Checkpoint | Action | Subagent |
|---|---|---|
| Before Stage 0 | Full regen, capture 9 days of shipped releases | `luna-release-writer` (complete 23 April 2026) |
| After Stage 0 merge | Incremental: tables, three roles, UUID migration, RLS | `luna-context-updater` |
| After Stage 1 merge | Incremental: API routes, share flow, RoleBadge | `luna-context-updater` |
| After Stage 2 merge | Incremental: realtime, patches, debounced save, role enforcement | `luna-context-updater` |
| After Stage 3 merge | Incremental: per-user Luna, viewer read-only, cross-awareness | `luna-context-updater` |
| After Stage 4 merge | Incremental: comments at all levels, orphaning, My Trips | `luna-context-updater` |
| After Stage 5 launch | Full release note | `luna-release-writer` |

---

## 7. Multilingual integration checklist

| Stage | Strings to translate | Subagent |
|---|---|---|
| 0 | None | N/A |
| 1 | Invite button, modal, viewer/editor copy buttons, role badges, avatars tooltip, Join prompt with role, My Trips shared section, role toggle, remove confirm, soft limit message | `luna-multilang-translator` |
| 2 | Syncing indicator, presence tooltip, reconnecting, viewer read-only tooltips | `luna-multilang-translator` |
| 3 | Viewer Luna "cannot modify in viewer mode" fallback message | `luna-multilang-translator` |
| 4 | Comments UI (Add comment, compose placeholder, Show N more, Edit, Delete, Posted by X, X min ago, Orphaned, Cancel, Save, 500 char warning), CollabToast, Leave confirm, PDF headers | `luna-multilang-translator` |
| 5 | Homepage Plan Together section (headline, subhead, CTA), OG image text | `luna-multilang-translator` |

Every PT-BR file save verified UTF-8 no BOM with established command from `docs/i18n/multilang-reference.md`.

Luna's bilingual behavior in collab preserved from spec v1.1 Section 3.9: per-user locale, activity text stays in requester's language.

---

## 8. Risk register (updated)

| Risk | Stage | Impact | Mitigation | Owner |
|---|---|---|---|---|
| RLS policy change breaks solo trips | 0 | Critical | Additive OR clause, test all 22 trips pre-deploy via Supabase SQL | Claude + Wilson |
| UUID migration corrupts trip_data | 0 | Critical | Dry-run + audit backup column, idempotent, verification query | Claude + Wilson |
| Concurrent edits corrupt trip_data | 2 | Data loss | Patches + activity_log as source of truth, reconstruct on corruption | Claude |
| Realtime connection limit breach | 2, 5 | Users cannot sync | Free plan 200 concurrent, monitor post-launch, Pro upgrade if needed | Wilson |
| Role enforcement bypassed | 1, 2 | Viewer edits trip | Three layers: DB RLS, API role check, UI hide. DB is authoritative | Claude |
| Luna cross-awareness confuses | 3 | Poor UX | Short summary (5 events), flag-gated, QA validates tone | Claude |
| Prompt cache invalidation from summary | 3 | Cost spike | Summary at end of prompt, verify cache hits in Anthropic console | Claude |
| chat_history migration breaks existing trips | 3 | Users lose chat | Dual-read pattern, non-destructive, lazy migration on next save | Claude |
| Comment orphaning annoys users | 4 | Confused UX | Clear "referred to removed item" indicator, grouped in orphaned section | Claude |
| Comment spam | 4 | Noise | 500 char cap, optional rate limit 1/5s, soft-delete owner override | Claude |
| Mobile comment thread fails at 375px | 4 | Unusable on phone | Explicit 375/768/1280 test, per blog mobile rules | Claude |
| Flag flip causes homepage layout jump | 5 | Visual regression | Test preview before production flip | Claude |
| PT-BR accents corrupt on save | All | Broken PT UI | Verification command after every PT-BR write | `luna-multilang-qa` |

---

## 9. Success criteria

14 days after Stage 5 launch:

- At least 5% of new trips created are collaborative (≥1 collaborator beyond owner).
- Comments feature used on at least 20% of collaborative trips.
- Zero data loss incidents.
- Zero P0 or P1 bugs.
- Supabase Realtime usage stays within free tier or is a conscious Pro upgrade.
- No regression in solo trip metrics (generation, save, PDF export success rates).

---

## 10. Outcomes of this plan

If approved and executed:

- Users plan trips with friends and family in real time.
- Three-tier permissions (owner/editor/viewer) give owners full control over who can change what, while keeping viewers engaged via comments.
- Per-user cross-aware Luna is an industry-first pattern that avoids MindTrip's shared-chat confusion.
- Commenting on activities, days, phases, and hotels makes trip planning truly personal and conversational, matching Luna's core mission.
- Stable UUIDs on every entity mean comments survive any edit, reorder, or regeneration.
- Every code change is flag-gated for instant rollback.
- Every stage has a formal QA pass via subagent.
- CLAUDE.md stays current after every stage.
- Multilingual parity is maintained throughout.
- Landing page tells users the feature exists without overcommitting marketing copy.

Total time investment: approximately 78.5 hours across 3 weeks of focused execution.

---

## 11. Next steps (proposed sequence)

1. **CLAUDE.md regen** (complete, 23 April 2026).
2. **Commit Tier 1 master plan to repo** (this commit, `docs/specs/collab/00-master-plan.md`).
3. **Claude produces Tier 2** (spec v2.1 replacing v1.1 at `docs/specs/collaborative-trips.md`).
4. **Claude produces Tier 3 Stage 0 prompt** (`luna-collab-stage-0.md`). Wilson executes. QA runs. Context update runs.
5. Repeat step 4 for Stages 1 through 5, one at a time, with approval gates between stages.

If context is lost mid-way: re-attach this Tier 1 document to restore full picture. All locked decisions and stage scopes are in sections 1-4.

---

*End of Tier 1 master plan v2.1. Single source of truth for the collaborative trips arc.*
