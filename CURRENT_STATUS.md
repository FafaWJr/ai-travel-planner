# Luna Project Status

> **Purpose.** This file is the single source of truth for which Luna project is active, which stage we are on, what shipped last, what is pending, and which detours are active. Upload this at the start of any working session. If a session-memory claim disagrees with this file, this file wins.

**Last updated:** 12 May 2026 (LP-2 memories landing redesign + HF-3/HF-5 + deps fix)
**Maintainer:** Wilson
**Repo location:** root of `ai-travel-planner` (commit alongside `CLAUDE.md` and `CONVENTIONS.md`)

---

## Active project

**Luna Collaborative Trips** (master plan v2.1, 22 April 2026, at `docs/specs/collab/00-master-plan.md`).

Six stages. Real-time multi-user trip planning with viewer/editor/owner permissions, per-user cross-aware Luna chat, and comments on activities/hotels. **All 6 stages are shipped or code-complete.**

**Current stage:** **Stage 5 code-complete; flag flip pending.** Stage 5 (`97e21507`, 3 May 2026) shipped homepage "Plan Together" section, `/api/og/trip/[tripId]` OG image route, and SEO metadata. The sole remaining production step is flipping `NEXT_PUBLIC_COLLAB_ENABLED=true` in Vercel after QA on the preview URL.

**Last shipped release:** Luna Memories LP-2 — /memories landing page redesign with photo hero and OG metadata (12 May 2026, `091c48e0`). Replaces the plain landing with a premium photo-hero layout: tropical beach hero image with gradient overlay and entrance animations, "What you will get" section (4 feature cards with hover glow), "How it works" section (3 numbered steps with connector lines), standalone form with synced date logic and orange CTA, "Already planned with Luna?" footer card. OG metadata via `generateMetadata` on `layout.tsx` with canonical URL and hreflang alternates. `memoriesLanding` namespace: 46 keys in EN/PT-BR/ES (parity verified, full diacritics). Also shipped same day: HF-5 PWA middleware fix (`a2346137`: excluded `manifest.json`/`sw.js`/`offline.html` from next-intl matcher in `proxy.ts` — PWA was 404ing in production), Phase 7 PWA layer (`88bd5523`), security hardening C2/C3/C4/H2/H3 (`e1f7491c`), HF-3 RouteMap hooks violation fix + section headings (`c2c1fa0e`), react-leaflet peer dep removal (`b68652e3`), Phase 6 PDF + Stripe paywall (`12103fa6` / `65a6f8f6`), HF-4 dual-lookup (`998d57de`).

**Other active tracks (parallel to Collab):**
- **Place Preview** (Phase 1 + 2 shipped; Phase 3 not started): ~20 commits, feature flag `NEXT_PUBLIC_PLACE_PREVIEW_ENABLED`, spec at `docs/specs/Place Preview/luna-place-preview-master-plan.md`.
- **Itinerary Generation V2**: shipped `177d1024` (3 May). 6-step planning methodology, schema enforcement, prompt caching on `/api/generate`.
- **Homepage V2**: shipped `d2e26263` + `bf656a69` (4 May). Hero redesign, /start form redesign, all "30 seconds" claims removed.
- **How to Use Luna guide page**: shipped `99d3cc84` (3 May). `/[locale]/how-to-use-luna`, full i18n, footer Quick Links entry.
- **Multi-agent orchestration**: 11 specialist subagents, `1f66f44f` (5 May). `luna-status-updater` added `e79bd132` (6 May).
- **TECH_DEBT.md register**: created `70de3ef1` (5 May), 10 active items.
- **Luna Memories Phases 1+2+3+4+5+6+7+LP-2 shipped** (12 May 2026): `trip_memories` table + RLS, memory capture page, streaming AI narrative, shareable public link + OG image, mid-trip capture banner, photo storage foundation (`memory-photos` bucket, exif.ts, compress.ts, photos API), photo upload UI with EXIF auto-sort + day grid + lightbox (`BulkPhotoUpload`, `DayPhotoGrid`, `lib/memories/types.ts`, 18 locale keys), GPS route map (`RouteMap.tsx`, Leaflet + OpenStreetMap, day-coloured markers + polylines), photo gallery on public share page (grouped by day, responsive hero grid), `/memories` landing page + standalone memory creation (`POST /api/memories/standalone`) + AI day skeleton (`POST /api/memories/skeleton`) + dual-lookup on GET/PUT + Memories nav link, 15 new locale keys per locale + nav.memories, locale diacritics fix, branded Stories + carousel sharing cards + 4-button share panel, premium PDF export via Puppeteer + @sparticuz/chromium, Stripe $10 one-off paywall, PWA layer (manifest, service worker, offline page, maskable icons, `PwaInstallBanner`), security hardening (private PDF bucket, IDOR guard, share data stripping, HF-5 PWA 404 fix), LP-2 premium photo-hero landing redesign + OG metadata (`memoriesLanding` 46 keys EN/PT-BR/ES). Phase LP-2 complete. Next: Phase 8 (Peecho print book) or Phase 9 (re-engagement loop). Spec at `docs/specs/memories/session_anchor.md`.

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
| Luna Memories LP-2: /memories landing page redesign | Closed | `091c48e0` | 12 May | Photo-hero V2 layout (beach hero, 4 feature cards, 3 steps, standalone form, OG metadata); memoriesLanding namespace 46 keys EN/PT-BR/ES |
| HF-5: manifest.json/sw.js 404 in production (PWA broken) | Closed | `a2346137` | 12 May | next-intl middleware matcher intercepted /manifest.json and /sw.js before Next.js could serve them from /public; added to negative lookahead in proxy.ts |
| HF-3: RouteMap hooks violation + section headings | Closed | `c2c1fa0e` | 12 May | Early-return before useEffect violated React rules; crashed when days prop transitioned from 0 to 2+ GPS points. Also wired mapLabel/photosLabel locale keys as section headings |
| react-leaflet peer dep conflict (Vercel build broken) | Closed | `b68652e3` | 12 May | react-leaflet@4.2.1 requires react@^18; project uses react@19.2.3; removed dep — RouteMap uses vanilla leaflet via dynamic import |
| Luna Memories security hardening C2/C3/C4/H2/H3 | Closed | `e1f7491c` | 12 May | Dropped anon-enumeration RLS; private memory-pdfs bucket; auth redirect fix; IDOR .eq guard; share stripping of private day fields |
| Luna Memories Phase 7: PWA layer | Closed | `88bd5523` | 12 May | manifest.json, sw.js (cache-first static/network-first pages), offline.html, maskable icons, ServiceWorkerRegistration + PwaInstallBanner components |
| Luna Memories HF-4: photos + narrative dual-lookup for standalone | Closed | `998d57de` | 12 May | Both routes used trip_id lookup only; standalone memories have trip_id=null; dual-lookup (trip_id then id) added to POST/DELETE photos and narrative |
| Luna Memories Phase 6.2: Stripe paywall | Closed | `65a6f8f6` + `3649f4b9` | 12 May | POST /api/payments/create-session + POST /api/webhooks/stripe; $10 one-off; pdf_purchased flag on trip_memories; paywall modal + success detection; 16 locale keys EN/PT-BR/ES |
| Luna Memories Phase 6.1: PDF export pipeline | Closed | `12103fa6` | 12 May | lib/memories/pdf-template.ts; POST /api/memories/export/pdf (Puppeteer + @sparticuz/chromium); Supabase Storage cache; narrative gate; 2 locale keys EN/PT-BR/ES |
| Luna Memories Phase 5: sharing cards + share panel | Closed | `8eec5bd7` | 12 May | 1080x1920 Stories card + 1080x1350 per-day carousel card (both edge runtime); 4-button share panel (copy link, download Stories, download carousel, Share to Instagram); 5 locale keys EN/PT-BR/ES |
| Luna Memories Phase 4: locale diacritics fix | Closed | `0d056d45` | 12 May | 11 accent/punctuation errors in PT-BR and ES Phase 4 keys corrected by multilang-qa pass |
| Luna Memories Phase 4: landing page + standalone flow + nav | Closed | `e7910c2c` | 12 May | /memories landing page (two paths), POST /api/memories/standalone, POST /api/memories/skeleton (Claude Sonnet destination-aware day titles), dual-lookup on GET/PUT /api/memories/[tripId], Memories nav link desktop+mobile, 15 new locale keys + nav.memories |
| Luna Memories Phase 3.3: GPS route map + share page gallery | Closed | `66722db5` | 12 May | RouteMap.tsx (Leaflet + OSM, day-coloured markers, polylines), photo gallery on share page by day, leaflet@1.9.4 + react-leaflet@4.2.1, mapLabel + photosLabel in EN/PT-BR/ES |
| Luna Memories Phase 3.2: photo upload UI + day grid | Closed | `34b5ddfb` | 12 May | BulkPhotoUpload, DayPhotoGrid, lightbox, lib/memories/types.ts, 18 locale keys EN/PT-BR/ES |
| Luna Memories Phase 3.1: photo storage foundation | Closed | `e3c9a97b` | 12 May | memory-photos bucket + RLS, exif.ts, compress.ts, /api/memories/photos POST+DELETE, exifr dep |
| Phase 2 HF-1: MemoryBanner false Saved guard | Closed | `6b013dd9` | 12 May | dayIndex < 0 path called setSaved(true) on unchanged PUT; moved inside dayIndex >= 0 block |
| Luna Memories Phase 2: mid-trip capture banner | Closed | `1da8df1b` | 12 May | Date-aware MemoryBanner on Plan page; expandable note, 24h dismiss, journal link |
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

**Active phase:** LP-2 shipped. Phase 8 (Peecho print book) or Phase 9 (re-engagement loop) next — Wilson to confirm.
**Phase status:** Phases 1–7 and LP-2 (landing redesign) fully complete. Phase 8 and Phase 9 not started.
**Last completed phase:** LP-2 — /memories landing page photo-hero redesign + OG metadata (shipped 12 May 2026, commit `091c48e0`). Also shipped same session: HF-5 PWA middleware fix (`a2346137`), Phase 7 PWA layer (`88bd5523`), security hardening C2–H3 (`e1f7491c`), HF-3 RouteMap hooks fix (`c2c1fa0e`), react-leaflet removal (`b68652e3`), Phase 6.1+6.2 (`12103fa6` / `65a6f8f6`), HF-4 (`998d57de`).
**Hotfixes in current phase:** 0
**Known issues:** None
**Master plan:** docs/specs/memories/session_anchor.md (immutable during sessions)

**Phase 1 deliverables (all shipped):**
- 1.1 (`74dbc159`, 11 May): `trip_memories` Supabase table, RLS policies, indexes, `AI_CONFIG` narrative route at 4000 tokens.
- 1.2 (`638408cc`, 12 May): Memory capture page, My Trips CTA change (`Capture memories` for expired trips), `GET`/`PUT /api/memories/[tripId]` routes, per-day notes/mood/highlight, debounced auto-save, i18n EN/PT-BR/ES.
- 1.3 (`808a6a8a`, 12 May): Streaming AI narrative (`POST /api/memories/narrative`), generate/re-roll/edit/auto-save, narrative persisted to `trip_memories.narrative`, i18n.
- 1.4 (`58cb636f`, 12 May): Public share API (`/api/memories/share/[token]`), share page (`/memories/share/[token]`), OG image route (`/api/og/memory/[token]`), share button + clipboard copy, per-token `generateMetadata`, i18n.

**Phase 2 deliverables (all shipped):**
- 2.0 (`1da8df1b`, 12 May): `MemoryBanner` component on Plan page — date-aware detection shows banner when today is within the trip's date range; expandable textarea saves quick day note to `trip_memories` row; dismissable for 24h via localStorage key per `tripId`; "Full journal" link to `/memories/[tripId]`; EN/PT-BR/ES locale strings.

**Phase 3.1 deliverables (all shipped):**
- 3.1 (`e3c9a97b`, 12 May): `memory-photos` Supabase Storage bucket (public read, 5MB limit, JPEG/PNG/WebP/HEIC); 3 RLS policies (INSERT/DELETE owner-scoped to `auth.uid()` path prefix, SELECT public); `lib/memories/exif.ts` — browser-side EXIF extraction via `exifr` + `sortPhotosByDay` helper; `lib/memories/compress.ts` — Canvas API compression (max 2000px, JPEG 85%) + blur placeholder generator; `app/api/memories/photos/route.ts` — POST (upload + metadata) and DELETE (remove + cleanup + re-index sortOrder); `exifr ^7.1.3` npm dependency.

**Phase 3.2 deliverables (all shipped):**
- 3.2 (`34b5ddfb`, 12 May): `lib/memories/types.ts` — canonical `PhotoMeta` and `PhotoUploadItem` interfaces (imported by API route and components); `components/memories/BulkPhotoUpload` — file picker, EXIF-based auto-sort preview, sequential upload with progress bar, unsorted-photo warning; `components/memories/DayPhotoGrid` — 3-column thumbnail grid, lightbox with prev/next navigation, delete confirmation modal; memories capture page wired with `handleDayPhotosAdded`, `handlePhotoDelete`, `refetchMemory` callbacks, `BulkPhotoUpload` inserted after progress bar, `DayPhotoGrid` inside expanded day cards, photo count badge in collapsed day header; 18 new locale keys (`photosSection`, `addPhotos`, `uploading`, `uploadDone`, `uploadError`, `uploadPhotosBtn`, `deletePhoto`, `deletePhotoConfirm`, `deleteCancel`, `deleteConfirm`, `photosAutoSorted`, `photosUnsorted`, `photoCount`, `closeLightbox`, `addMorePhotos`, `photoOf`, `dayAssignment`) in EN/PT-BR/ES.

**Phase 3.3 deliverables (all shipped):**
- 3.3 (`66722db5`, 12 May): `components/memories/RouteMap.tsx` — Leaflet + OpenStreetMap GPS route map; day-coloured markers; dashed polylines connecting GPS points in chronological order; dynamic import (`ssr: false`) for Next.js App Router compatibility; self-contained Leaflet CSS injection; returns null when fewer than 2 GPS points are available. Route map placed above day cards on the capture page (auto-hides without GPS data). `SharedMemory` interface extended with `MemoryDay` + `PhotoMeta`; share page (`/memories/share/[token]`) gains photo grids grouped by day with responsive hero layout (1-col / 2-col / 3-col with landscape hero for first photo when 3+ photos exist); route map rendered between narrative and photo gallery on share page; both sections hidden when no photos exist. `leaflet@1.9.4`, `react-leaflet@4.2.1`, `@types/leaflet` installed. 2 new locale keys (`mapLabel`, `photosLabel`) in EN/PT-BR/ES.
- HF-3 (`c2c1fa0e`, 12 May): Moved early-return guard in `RouteMap.tsx` to after all hooks — placing it before `useEffect` violated React rules of hooks and crashed when the `days` prop transitioned from 0 to 2+ GPS points during sequential photo upload. Also wired `mapLabel`/`photosLabel` locale keys as section headings on both capture and share pages (hardcoded EN on share, `t()` on capture).
- deps fix (`b68652e3`, 12 May): Removed `react-leaflet@4.2.1` — requires `react@^18` but project uses `react@19.2.3`; Vercel strict `npm install` was failing with ERESOLVE. `RouteMap` uses vanilla `leaflet` via dynamic import inside `useEffect`; `react-leaflet` was unused at runtime. Phase 3 complete.

**Phase 4 deliverables (all shipped):**
- 4.0 (`e7910c2c`, 12 May): `/memories` landing page (`app/[locale]/memories/page.tsx`) — two entry paths: continue from a Luna trip (existing `trip_memories` rows listed) or capture any trip standalone. `POST /api/memories/standalone` — creates a `trip_memories` row with `trip_id=NULL`; uses five standalone columns already in DB (`is_standalone`, `standalone_destination`, `standalone_start_date`, `standalone_end_date`, `standalone_travellers`). `POST /api/memories/skeleton` — calls Claude Sonnet to generate destination-aware day titles (e.g. "Alfama and Baixa" instead of "Day 1 in Lisbon"). Dual-lookup on `GET`/`PUT /api/memories/[tripId]` — resolves by `trip_id` OR by `memory.id`, supporting both linked and standalone memories. Memories nav link added to `NavBar` (desktop + mobile, visible to all users). 15 new locale keys per locale in EN/PT-BR/ES, plus `nav.memories` key.
- 4.1 (`0d056d45`, 12 May): i18n fix — 11 accent/punctuation errors in PT-BR and ES Phase 4 keys corrected (PT-BR: história, não, você, início, família, Começar, memórias ×3, Memórias; ES: ¿A dónde?, ¿Quiénes?, Aún, sesión, missing ¿ opening marks). Phase 4 complete.

**Phase 5 deliverables (all shipped):**
- 5.0 (`8eec5bd7`, 12 May): `GET /api/memories/card/[token]` — 1080x1920 Instagram Stories card: navy gradient, destination name, trip dates, pull quote with orange left border, Luna branding; edge runtime, service-role Supabase, `Cache-Control: public, max-age=86400`. `GET /api/memories/card/day/[token]/[dayNumber]` — 1080x1350 per-day carousel card: warm white background, orange day badge, day title, day narrative summary; same edge/cache pattern. Share panel on memory capture page (condition: `memory.status === 'complete'`) replaced simple copy-link button with a 4-button grid: copy link, download Stories card (single fetch + blob download), download day carousel (sequential per-day downloads), Share to Instagram (downloads image + shows camera roll hint on mobile). 5 new locale keys per locale in EN/PT-BR/ES: `copyLink`, `downloadStoryCard`, `downloadCarousel`, `shareInstagram`, `instagramShareHint`. Phase 5 complete.

**Phase 6 deliverables (all shipped):**
- 6.1 (`12103fa6`, 12 May): `lib/memories/pdf-template.ts` — editorial HTML template (cover page with hero photo, stats overview, day-by-day sections with hero photo + grid + narrative + pull quote, highlight day accent, reflections closing page). `app/api/memories/export/pdf/route.ts` — POST endpoint using `@sparticuz/chromium` + `puppeteer-core`; dual-lookup memory fetch; narrative gate (refuses export if no narrative generated); Supabase Storage cache (`pdfs/{userId}/{memoryId}.pdf`) — cache-hit path downloads binary and streams binary back (not a public URL, after C3 fix). Returns binary PDF response. Capture page: `generatingPdf` state, `downloadPdf` handler, full-width PDF download button spanning share panel grid. 2 new locale keys (`downloadPdf`, `generatingPdf`) in EN/PT-BR/ES.
- 6.2 (`65a6f8f6` + `3649f4b9`, 12 May): `POST /api/payments/create-session` — creates Stripe Checkout Session with memory metadata; dual-lookup (trip_id then id); $10 one-off payment; returns `checkoutUrl` or `alreadyPurchased` for idempotency. `POST /api/webhooks/stripe` — verifies `stripe-signature` header using raw body (`request.text()`); marks `pdf_purchased=true` on `checkout.session.completed`; uses service-role client (no user session in webhook context); idempotent. `MemoryData` interface gains `pdf_purchased` + `trip_id` made nullable. Capture page: `showPdfPreview` + `paymentProcessing` state; `?payment=success` detection; `handlePurchase` callback; PDF button conditional (orange CTA unpurchased, navy direct download purchased); editorial paywall modal with 5-item inclusion list. Stripe instantiation moved inside handlers (deferred to request time; env var not available at build time). 16 locale keys per locale in EN/PT-BR/ES. Phase 6 complete.

**Phase 7 deliverables (all shipped):**
- 7.0 (`88bd5523`, 12 May): `public/manifest.json` — app metadata, theme `#00447B`, background `#F4F7FB`, scope `/`, three icon sizes. `public/icons/luna-{192,512,maskable-512}.png` — Sharp-rasterised LUNA-LOGO.svg on navy background; maskable icon has 20% safe-zone padding per PWA spec. `public/sw.js` — service worker: cache-first for static assets (`/_next/static/`, `/icons/`, fonts, images); network-first with offline fallback for pages; skips non-GET requests, API routes, auth routes, and Supabase entirely. `public/offline.html` — branded offline fallback (navy logo badge, orange CTA, Poppins/Inter fonts). `components/ServiceWorkerRegistration.tsx` — client component registers `sw.js` on mount via `navigator.serviceWorker.register`. `components/PwaInstallBanner.tsx` — navy bottom banner shown after 2+ visits; triggers native `beforeinstallprompt`; dismissable via `luna_pwa_dismissed` localStorage key; `zIndex 9998` (below modals at 9999). `app/[locale]/layout.tsx` updated: manifest linked via metadata export, `apple-mobile-web-app-*` meta tags + `apple-touch-icon` in `<head>`, `icons.apple` updated to `/icons/luna-192.png`, both components rendered outside `NextIntlClientProvider`. Phase 7 complete.

**Security hardening (post-Phase-7, same day):**
- C2 (`e1f7491c`, 12 May): Dropped `trip_memories_public_read_shared` RLS policy that allowed anonymous enumeration of all complete memories by `share_token`. Share route was already using service-role client with explicit token lookup; the policy was redundant and a security gap.
- C3+M19 (`e1f7491c`, 12 May): PDF export switched from public `memory-photos` bucket to private `memory-pdfs` bucket. Cache-hit path now downloads binary and streams it back instead of returning a public URL. `memory-pdfs` bucket created with user-scoped storage policies via migration.
- C4 (`e1f7491c`, 12 May): Memory capture page auth redirect now sets `luna_redirect_after_login` localStorage key (immutable convention per `CONVENTIONS.md`) before pushing to `/auth/login`, ensuring users land back on their memory after signing in.
- H2 (`e1f7491c`, 12 May): Added `.eq('user_id', user.id)` guard to `saved_trips` queries in the memories GET handler and narrative POST handler, blocking IDOR for users supplying a foreign trip UUID.
- H3 (`e1f7491c`, 12 May): Share route strips `notes`, `mood`, and `highlight` from `memory_data.days` before returning to public viewers; only `dayNumber`, `dayTitle`, and `photos` are exposed on share links.

**HF-5 (post-Phase-7, same day):**
- HF-5 (`a2346137`, 12 May): The next-intl middleware matcher in `proxy.ts` was intercepting GET requests for `/manifest.json`, `/sw.js`, and `/offline.html` before Next.js could serve them from `/public`, causing HTTP 404 in production and making PWA install completely non-functional. Added `manifest\.json|sw\.js|offline\.html` to the matcher's negative lookahead.

**Phase LP-2 deliverables (all shipped):**
- LP-2 (`091c48e0`, 12 May): Full redesign of `app/[locale]/memories/page.tsx` and `app/[locale]/memories/layout.tsx`. Photo-hero section: `public/images/memories-hero.jpg` (1600x1064 tropical beach JPEG, 213KB) with gradient overlay, noise texture, and `heroLoaded`-gated entrance animations. "What you will get" section: 4 feature cards with hover lift, orange border glow, and icon background transition to orange gradient. "How it works" section: 3 numbered steps with connector lines (hidden on mobile via `.step-connector` CSS class). Standalone form: destination, synced dates (end auto-fills to start+1d on change), travellers dropdown, orange CTA with `Loader2` spinner during submission. "Already planned with Luna?" footer card linking to My Trips. Same single-column layout for authenticated and anonymous users. Anonymous error: orange login-error message with Sign in link; `luna_redirect_after_login` written to localStorage before redirect (per `CONVENTIONS.md`); `isLoginError` boolean tracks error type (avoids fragile string comparison); error clears on destination/date input change. Accessibility: `aria-busy` on submit button, `role="alert"` on error paragraph, `htmlFor`/`id` on all form fields, `prefers-reduced-motion` in style block. `layout.tsx`: `generateMetadata` with OG title/description/image, canonical URL, hreflang alternates (en/pt-BR/es), Twitter card, `robots index/follow`. `memoriesLanding` namespace: 46 keys in EN, PT-BR, ES (parity verified, full diacritics in PT-BR and ES). Phase LP-2 complete.
