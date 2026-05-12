# Luna Project Status

> **Purpose.** This file is the single source of truth for which Luna project is active, which stage we are on, what shipped last, what is pending, and which detours are active. Upload this at the start of any working session. If a session-memory claim disagrees with this file, this file wins.

**Last updated:** 12 May 2026
**Maintainer:** Wilson
**Repo location:** root of `ai-travel-planner` (commit alongside `CLAUDE.md` and `CONVENTIONS.md`)

---

## Active project

**Luna Collaborative Trips** (master plan v2.1, 22 April 2026, at `docs/specs/collab/00-master-plan.md`).

Six stages. Real-time multi-user trip planning with viewer/editor/owner permissions, per-user cross-aware Luna chat, and comments on activities/hotels. **All 6 stages are shipped or code-complete.**

**Current stage:** **Stage 5 code-complete; flag flip pending.** Stage 5 (`97e21507`, 3 May 2026) shipped homepage "Plan Together" section, `/api/og/trip/[tripId]` OG image route, and SEO metadata. The sole remaining production step is flipping `NEXT_PUBLIC_COLLAB_ENABLED=true` in Vercel after QA on the preview URL.

**Last shipped release:** Multi-agent orchestration + My Trips landmark photos (5 May 2026, `1f66f44f` / `bd5ddec9`). 11 specialist subagents + orchestration protocol at `docs/architecture/multi-agent-orchestration.md`; Google Places landmark photos on My Trips trip cards via `/api/destination-header/[slug]` (feature-flag gated by `NEXT_PUBLIC_PLACE_PREVIEW_ENABLED`). Also: TECH_DEBT.md register (`70de3ef1`, 5 May) and luna-status-updater subagent (`e79bd132`, 6 May).

**Other active tracks (parallel to Collab):**
- **Place Preview** (Phase 1 + 2 shipped; Phase 3 not started): ~20 commits, feature flag `NEXT_PUBLIC_PLACE_PREVIEW_ENABLED`, spec at `docs/specs/Place Preview/luna-place-preview-master-plan.md`.
- **Itinerary Generation V2**: shipped `177d1024` (3 May). 6-step planning methodology, schema enforcement, prompt caching on `/api/generate`.
- **Homepage V2**: shipped `d2e26263` + `bf656a69` (4 May). Hero redesign, /start form redesign, all "30 seconds" claims removed.
- **How to Use Luna guide page**: shipped `99d3cc84` (3 May). `/[locale]/how-to-use-luna`, full i18n, footer Quick Links entry.
- **Multi-agent orchestration**: 11 specialist subagents, `1f66f44f` (5 May). `luna-status-updater` added `e79bd132` (6 May).
- **TECH_DEBT.md register**: created `70de3ef1` (5 May), 10 active items.
- **Luna Memories Phase 1** (all 4 sub-phases shipped 11-12 May 2026): `trip_memories` table + RLS, memory capture page, streaming AI narrative, shareable public link + OG image. Phase 2 (mid-trip capture banner) not started.

---

## Stage status

| Stage | Name | Status |
|---|---|---|
| 0 | Foundation (DB schema, UUID migration, flag, RLS) | Shipped |
| 1 | Share link, invite system, viewer/editor tokens | Shipped |
| 2 | Realtime sync engine, role-gated mutations | Shipped and QA verified (30 April 2026) |
| 3 | Collaborative Luna chat (per-user, viewer-readonly, cross-aware) | Shipped and QA verified (1-2 May 2026) |
| 4 | Comments, My Trips integration, UX polish | Shipped (2-3 May 2026) |
| 5 | Landing page and launch | Code complete; flag flip pending (3 May 2026) |

**Progress:** All 6 stages shipped or code-complete. `NEXT_PUBLIC_COLLAB_ENABLED=true` flip is the sole remaining production step.

---

## Stage 2 detail (archive)

Stage 2 is fully shipped and QA verified (30 April 2026). All 5 items that were listed as "What remains" are now closed:

1. Patch type coverage: 14 LIVE types QA'd (7 dead types classified by design). Test report: `docs/specs/collab/test-reports/stage2-finish-4-patch-coverage-qa.md`.
2. Viewer-tier end-to-end: confirmed via hotfix #9 (`0f6ef49d`) + formal viewer QA pass. Test report: `docs/specs/collab/test-reports/stage2-finish-5-viewer-tier-qa.md`.
3. Disconnect/reconnect replay: R-1/R-2/R-3 PASS; R-4 (backgrounded tab) closed by `visibilitychange` backfill (`2e8230d6`, 30 April). Test report: `docs/specs/collab/test-reports/stage2-finish-6-reconnect-replay-qa.md`.
4. Formal `luna-qa-agent` Stage 2 QA pass: **12 PASS, 1 PASS-with-limitation (check 6/R-4), 1 N/A by design (check 12/`expand_phase`).** Test report: `docs/specs/collab/test-reports/stage2-finish-7-formal-qa-pass.md`.
5. `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` flag presence and wiring: confirmed correct (Stage 2 finish #3, `2f400656`).

For full patch library, hotfix history, and implementation notes see `CLAUDE.md` Collaborative Trips section.

---

## Recent detours (off master plan)

| Detour | Status | Commit | Date | One-line cause |
|---|---|---|---|---|
| Luna Memories Phase 1.4: shareable link + OG image | Closed | `58cb636f` | 12 May | Public share page, OG image route, share button + clipboard, per-token generateMetadata |
| Luna Memories Phase 1.3: streaming AI narrative | Closed | `808a6a8a` | 12 May | Streaming Claude Sonnet 4.5 narrative via /api/memories/narrative; editable + re-roll + auto-save |
| Luna Memories Phase 1.2: capture page + My Trips CTA | Closed | `638408cc` | 12 May | Memory capture page with day cards + auto-save; My Trips CTA replaced for expired trips |
| Luna Memories Phase 1.1: trip_memories table + AI_CONFIG | Closed | `74dbc159` | 11 May | trip_memories Supabase table, RLS, indexes, narrative token limit in AI_CONFIG |
| Luna Memories infrastructure setup | Closed | `2b9966fb` | 11 May | session_anchor, hotfix_log, ideas_backlog, two new subagents, CURRENT_STATUS section |
| luna-status-updater subagent | Closed | `e79bd132` | 6 May | New subagent for keeping CURRENT_STATUS.md current |
| TECH_DEBT.md register | Closed | `70de3ef1` | 5 May | 10 active tech debt items catalogued; added to update-context.sh heredoc |
| Multi-agent orchestration | Closed | `1f66f44f` | 5 May | 11 specialist subagents + orchestration protocol in .claude/agents/ |
| My Trips landmark photos | Closed | `bd5ddec9` | 5 May | Google Places landmark photos on My Trips cards via /api/destination-header/ |
| Google Places hotel suggestions | Closed | `ba670fdb` | 5 May | Real hotel names from Google Places Text Search replacing AI-generated names |
| Place Preview fix: country validation + tab scoping | Closed | `f67b1ec2` | 5 May | Country validation with city-name enrichment; non-itinerary tabs get plain bold (no data-place) |
| Place Preview: Overview tab fix + Booking.com dates | Closed | `4d3ae0fd` | 5 May | Removed onMouseOver from plan section div; threaded tripCheckin/tripCheckout for affiliate URL dates |
| Place Preview Phase 2: post-gen + viewport batch | Closed | `0f8bc74c` | 5 May | Batch resolution on planner load; post-generation resolution for instant hover previews |
| Place Preview: landmark-based planner header | Closed | `244f8954` | 5 May | Planner header photos replaced with landmark-first pipeline via /api/destination-header/[slug] |
| Place Preview Phase 2 extras: galleries, blur-up, Unsplash hero, wrong-place override | Closed | `3f122766` | May | Multi-photo galleries, blur-up placeholders, Unsplash hero, wrong-place user override |
| Place Preview: hotel photos + place preview card | Closed | `259df58c` | Apr-May | Real Google Places photos for hotel cards; hotel photo gallery in place preview card |
| Place Preview Phase 1: frontend + planner integration | Closed | `267205f6` | Apr | 5 client components wired into plan/page.tsx via data-place event delegation |
| Place Preview Phase 1: DB, resolver, cache, photo proxy | Closed | `31700e8e` | Apr | 3 Supabase tables, resolver, cache, photo proxy, Storage host added to next.config.ts |
| Homepage V2 Part 2: /start redesign + 30s removal | Closed | `bf656a69` | 4 May | Two-column desktop form, compact mobile header; all "30 seconds" removed site-wide |
| Homepage V2 Part 1: hero + social proof + collab section | Closed | `d2e26263` | 4 May | Hero copy, social proof strip, feature cards, Plan Together section, FAQ additions |
| How to Use Luna guide page | Closed | `99d3cc84` | 3 May | /[locale]/how-to-use-luna, full i18n, footer Quick Links entry |
| iOS Safari date picker min constraint | Closed | `e5e1d18e` | 3 May | iOS ignores min attribute on date inputs; onChange guard added |
| Collab Stage 5: Plan Together + OG + launch prep | Closed (code) | `97e21507` | 3 May | Homepage collab section, /api/og/trip/[tripId], SEO metadata; flag flip pending |
| Itinerary Generation V2 + UX clarity | Closed | `177d1024` | 3 May | 6-step methodology, schema enforcement, prompt caching; one-sentence descriptions, duration spans |
| Collab Stage 4 UI polish | Closed | `baa199c8` | 2-3 May | Share icon (Lucide, navy), comment icon inline, shared card dates, comment icons refresh on join |
| Collab Stage 4c: My Trips + CollabToast + Leave Trip + PDF | Closed | `418c7131` | 2 May | Owned/shared split, collab badge, CollabToast, Leave Trip button, PDF collaborators line |
| Collab Stage 4b: comments UI | Closed | `4b948f26` | 2 May | CommentIcon/Compose/Item/Thread; soft-delete 500 fix; emitPatch in StayTab |
| Collab Stage 4a: comments API | Closed | `c4a36439` | 2 May | POST/GET/PATCH/DELETE comments routes; trip_is_owned_by_user SECURITY DEFINER helper |
| Luna intelligence recovery P0 (3 root causes) | Closed | `5b10b289` | 1 May | Slot-structured context; structured itinerary as primary FloatingChat source; liveActivitiesText at send time |
| Collab replace_activity broadcast fix | Closed | `97c7eb51` | 2 May | %%TRIP_UPDATE%% lacked replace_activity format; removeActivitiesMatching had no onPatchEmitRef |
| Collab Stage 3c: viewer-readonly Luna + Stage 3 QA | Closed | `2745a1d0` | 1 May | Viewer-readonly instruction; 11 PASS, 2 N/A -- closes Stage 3 |
| confirm_day broadcast | Closed | `4cdefdc6` | 1 May | commutative patch type; pre-compute dayId before setDays (React 18 stale-closure fix) |
| Collab Stage 3a/3b: per-user chat + cross-awareness | Closed | `ed377cf0` | 30 Apr | lib/chat-history.ts dual-read; /api/trips/[tripId]/chat-history PATCH; lib/collab-awareness.ts |
| Stage 3 pre-blockers: PATCH merge, tab refocus, P2-3 dispatcher | Closed | `27674047` | 30 Apr | Server JSONB merge; visibilitychange backfill (closes Stage 2 R-4); P2-3 cross-slot drag dispatcher fix (confirmed resolved by Wilson) |
| Stage 2 finish #8 CLAUDE.md regen | Closed | (context-updater commit) | 30 Apr | `luna-context-updater --apply` regenerated `scripts/update-context.sh` heredoc + `CLAUDE.md` to capture 18 days of releases. Closes Stage 2 finishing kit. |
| Stage 2 finish #7 formal Stage 2 QA pass | Closed | `37a10f87` | 30 Apr | 12 PASS, 1 PASS-with-limitation (check 6/R-4), 1 N/A by design (check 12/expand_phase). Stage 2 considered shipped and verified. |
| Stage 2 finish #6 reconnect replay QA | Closed | `0faff17d` | 29-30 Apr | R-1/R-2/R-3 PASS, R-4 carry-forward (closed by visibilitychange backfill). |
| Stage 2f hotfix #9 viewer read-only UI | Closed | `0f6ef49d` | 29 Apr | Threads `readOnly` prop into `EditableItinerary`; hides all edit affordances for viewer role. |
| Stage 2 finish #5 viewer tier QA | Closed | `e57631f9` + `0f6ef49d` | 29 Apr | Source-level pre-flight predicted UI gap; hotfix #9 closed it. |
| Stage 2f hotfix #8 cross-slot drag broadcast | Closed | `fa4ddca6` | 29 Apr | Cross-slot drag emitted wrong patch type; captured original slot at handleDragStart in a ref. |
| Stage 2f hotfix #7c remove_activity index-based | Closed | `6e5e8781` | 29 Apr | Switched to activityIndex (0-based within slot) as primary identifier; text matching demoted to fallback. |
| Stage 2 finish #4 patch coverage QA | Closed | (28 Apr commit) | 28 Apr | 7 dead types classified; 7 LIVE untriggered exercised via hotfixes #5-#8. |
| Stage 2 finish #3 flag check | Closed | `2f400656` | 28 Apr | `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` already correctly wired (Outcome C). |
| R5 recovery-track bookkeeping | Closed | `0b7c1af6` + `4bf7176b` | 27 Apr | Bookkeeping pass that closed the 27 April recovery track. |
| R4 plan-render-smoke-guard | Closed | `e1c6a924` | 27 Apr | Extracted pure rendering pipeline to `lib/plan-render.ts`; 32-assertion prebuild smoke gate. |
| R2 empty-plan-save-guard | Closed | `cc769a0a` | 27 Apr | Two-layer guard against saving trips with empty `plan` markdown when `itineraryDays.length > 0`. |
| R1 sanitize-html-style-allowlist | Closed | `69d271d5` | 27 Apr | Restored Plan tab visual hierarchy stripped by the SSR fix. |
| SSR HTTP 500 on `/plan` | Closed | `2a791e34` | 27 Apr | `isomorphic-dompurify` dragged in ESM-only `@exodus/bytes`. Replaced with `sanitize-html`. |
| Saved trip view spins forever | Closed | `958ac160` | 27 Apr | Render gate now uses `hasContent` (plan or `itineraryDays` or `itineraryPhases`). |

**2026-04-27 Recovery track summary (R1 + R2 + R4 shipped, R3 deferred, R5 closed bookkeeping).** Wilson reported degraded formatting and empty saved-trip tabs from screenshots. Live diagnosis isolated three regressions: (1) sanitize-html stripping inline styles after the SSR fix swapped libraries, (2) AI generation intermittently emitting only tool_use without text deltas causing empty `plan` saves, (3) the existing `/plan` smoke not catching visual regressions and letting R1 ship undetected for 5 hours. R1 restored the inline-style allowlist; R2 added two-layer guards against empty-plan saves; R4 extracted the rendering pipeline into `lib/plan-render.ts` and added a prebuild smoke gate that runs 32 contract assertions before every webpack build. R3 (backfill of two existing broken test trips) was deferred by Wilson's decision because the trips are personal test data; the saved-trip-load fix from earlier in the day already lets them open without spinning. Full diagnosis and rationale: `docs/specs/collab/02-recovery-plan-april-27-regressions.md`.

---

## Open polish items (not blockers)

- **Markdown sub-header styling on Transport/Tips/Weather tabs.** AI writes `**bold paragraphs**` instead of `### headings`, which `markdownToHtml` renders as `<p><strong>` with no visual hierarchy. Pre-existing, only became visible after the saved-trip-load fix. Would benefit from a styled pass over the rendered prose container. Defer until after Collab Stage 5 launch unless a user complains.

- **`NEXT_PUBLIC_COLLAB_ENABLED` flag flip.** Stage 5 code deployed (`97e21507`) but env var not yet confirmed `true` in Vercel production. Manual ops step: set the flag in Vercel dashboard after QA on the preview URL.

---

## Active hotfixes

None.

---

## Known issues (untriaged)

- **Luna chat 502s on `POST /api/chat`** (29 April 2026, observed during sub-master plan #5 viewer QA exercise). **RESOLVED** -- fixed by `27674047` (30 April 2026, server-side PATCH merge in `/api/trips`). Root cause: collab PATCH was overwriting trip_data with a partial object, causing subsequent chat calls to fail. Server-side JSONB merge now preserves all keys. Visible R2b error toast added.

---

## Update protocol

Update this file whenever:
- A stage merges to `main`.
- A detour opens or closes.
- A polish item is added, completed, or reprioritised.
- The master plan version changes.

Always include the date in the **Last updated** field at the top.

---

## Luna Memories project

**Active phase:** Phase 2: Mid-trip capture banner
**Phase status:** Not started
**Last completed phase:** Phase 1 — Memory mode on existing trips (all of 1.1-1.4 shipped, 12 May 2026)
**Hotfixes in current phase:** 0
**Known issues:** None
**Master plan:** docs/specs/memories/session_anchor.md (immutable during sessions)

**Phase 1 deliverables (all shipped):**
- 1.1 (`74dbc159`, 11 May): `trip_memories` Supabase table, RLS policies, indexes, `AI_CONFIG` narrative route at 4000 tokens.
- 1.2 (`638408cc`, 12 May): Memory capture page, My Trips CTA change (`Capture memories` for expired trips), `GET`/`PUT /api/memories/[tripId]` routes, per-day notes/mood/highlight, debounced auto-save, i18n EN/PT-BR/ES.
- 1.3 (`808a6a8a`, 12 May): Streaming AI narrative (`POST /api/memories/narrative`), generate/re-roll/edit/auto-save, narrative persisted to `trip_memories.narrative`, i18n.
- 1.4 (`58cb636f`, 12 May): Public share API (`/api/memories/share/[token]`), share page (`/memories/share/[token]`), OG image route (`/api/og/memory/[token]`), share button + clipboard copy, per-token `generateMetadata`, i18n.
