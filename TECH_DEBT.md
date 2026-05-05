# Luna Let's Go: Tech Debt Register

Owned by `luna-agent-architect`. Updated whenever a shortcut is taken or a known limitation is identified. Reviewed at the start of every major feature.

Last updated: May 2026

---

## Format

Each entry follows this structure:

- **What:** Brief description of the shortcut or limitation.
- **Why accepted:** The reason it shipped this way (time pressure, complexity, dependency, deferred scope).
- **Proper solution:** What the clean fix would look like.
- **Severity:** Low (cosmetic or minor), Medium (functional limitation), High (architectural risk).
- **Added:** Date and context (release tag or session reference).

---

## Active items

### TD-001: remove_activity uses 0-based activityIndex with shift-on-removal bug

- **What:** `remove_activity` tool in `LUNA_CHAT_TOOLS` identifies activities by `activityIndex` (0-based offset within a time slot). When one activity is removed, all subsequent indexes shift, so consecutive removals in the same response can target the wrong item.
- **Why accepted:** Shipped with Stage 3 tool-use to unblock the core mutation path. Index-based matching was the simplest correct approach for single removals, which covers 95%+ of real usage.
- **Proper solution:** Upgrade to `(day, timeSlot, activityText)` matching as the primary identifier. Keep `activityIndex` as a fallback for backwards compatibility. Luna's system prompt already instructs "remove highest index first for bulk removal" as a workaround.
- **Severity:** Medium
- **Added:** April 2026, Stage 3 tool-use (AI Upgrade Plan)

### TD-002: replace_activity tool not shipped

- **What:** The `replace_activity` tool was specced in the AI Upgrade PDF (Stage 3) but is not yet implemented in `LUNA_CHAT_TOOLS`. Swaps currently happen via `remove_activity` + `add_activity` in the same response.
- **Why accepted:** Deferred to R1 (Stage 4 rules) to ship Stage 3 core functionality first. The remove+add pattern works reliably for single swaps.
- **Proper solution:** Add `replace_activity({ day, timeSlot, oldActivityIndex, newActivity, newLocation })` to `LUNA_CHAT_TOOLS` in `lib/ai.ts`. Add the corresponding `onTripUpdate` dispatch branch in `plan/page.tsx`. Add the format to Luna's system prompt.
- **Severity:** Low (functional workaround exists)
- **Added:** April 2026, Stage 3 tool-use

### TD-003: Stage 5 coherence pass not shipped

- **What:** Post-generation Haiku 4.5 validation pass for geography, pacing, and audience appropriateness. Feature flag `NEXT_PUBLIC_COHERENCE_CHECK_ENABLED` exists but defaults to false. No implementation code shipped.
- **Why accepted:** Deferred as R2-B after Stage 4 rules (R1) shipped. The structured itinerary generation (Stage 4) already enforces many of the same rules at generation time, reducing the urgency.
- **Proper solution:** Implement the coherence pass as specced in the AI Upgrade PDF (Stage 5). Run Haiku 4.5 against each day post-generation, validate three dimensions (geography clustering, pacing vs travel style, audience appropriateness). Cost: ~$0.001 per trip. Latency: 1-2s post-generation. Cap total cost per trip at $0.05 server-side.
- **Severity:** Low (quality improvement, not a bug)
- **Added:** April 2026, AI Upgrade Plan

### TD-004: P2-3 cross-slot drag dispatcher mismatch (collaborative trips)

- **What:** When a user drags an activity card from one time slot to another, the local state updates correctly but the Supabase Broadcast patch does not reach the other collaborator's browser. The emit fires but the receive handler does not process it.
- **Why accepted:** Identified during Stage 2 QA. Single-user drag works, and collaborative editing via Luna chat (tool-use) works. The drag-and-drop path is a secondary interaction pattern.
- **Proper solution:** Trace the full emit-receive pipeline for the `replace_activity` patch type in `lib/trip-patches.ts`. The emit side is confirmed working. The receive handler likely has a type mismatch or missing branch for the drag-originated `replace_activity` shape.
- **Severity:** Medium
- **Added:** April 2026, Collaborative Trips Stage 2

### TD-005: P2-4 viewer PATCH explicit 403 (collaborative trips)

- **What:** Viewers who attempt to save trip changes via the PATCH endpoint receive a generic error instead of an explicit 403 with a user-friendly message.
- **Why accepted:** Low priority. Viewers are already blocked from editing in the UI via role-gated mutations. The PATCH endpoint rejection is a server-side safety net that rarely triggers.
- **Proper solution:** Return a structured `{ error: 'viewer_cannot_edit', message: 'Viewers cannot modify this trip.' }` response with HTTP 403 status from the trip PATCH endpoint.
- **Severity:** Low
- **Added:** April 2026, Collaborative Trips

### TD-006: Frankfurter API CORS error breaks Budget tab currency conversion

- **What:** `api.frankfurter.app` returns CORS errors when called from the client, breaking the currency conversion feature on the Budget tab.
- **Why accepted:** Spotted during R4 QA but unrelated to the itinerary generation work. Budget tab still shows local currency estimates.
- **Proper solution:** Either proxy the Frankfurter API through a Luna Route Handler (`/api/exchange-rates`) to avoid CORS, or switch to a CORS-friendly exchange rate API. The proxy approach is cleaner since it lets us cache rates server-side (rates change daily, not per-request).
- **Severity:** Medium
- **Added:** April 2026, spotted during R4 QA

### TD-007: Locale switch wipes trip on /plan page

- **What:** Switching the locale (EN/PT-BR/ES) via the NavBar while on the `/plan` page causes the current trip state to be lost. The page re-renders and the in-memory trip data is cleared.
- **Why accepted:** Deferred to pre-launch polish. Spec exists at `docs/specs/known-issue-locale-switch-wipes-trip.md`. Workaround: users can reload from saved trip.
- **Proper solution:** Persist trip state to `sessionStorage` or the URL before locale switch, then rehydrate after the re-render. Alternatively, use `next-intl`'s locale switching without a full page navigation.
- **Severity:** Medium
- **Added:** April 2026, deferred to pre-launch polish

### TD-008: CLAUDE.md is stale (last regenerated April 12, 2026)

- **What:** `CLAUDE.md` was last generated by `scripts/update-context.sh` on 2026-04-12. Multiple releases have shipped since then (Place Preview Phase 1+2, Itinerary Generation V2, Collaborative Trips Stages 3-5, multi-agent orchestration setup). The file does not reflect the current state of the project.
- **Why accepted:** Context regeneration was deferred during rapid feature shipping. The heredoc template in `update-context.sh` also needs updating before regeneration.
- **Proper solution:** Update the heredoc template in `scripts/update-context.sh` with all missing releases, then run `luna-context-updater` with `--apply`.
- **Severity:** Medium (impacts Claude Code session accuracy)
- **Added:** May 2026

### TD-009: luna-architecture skill Sections 5 and 12 need update for Place Preview

- **What:** The `luna-architecture` skill still contains a prohibition on Google Places API in Section 12 that was reversed when Place Preview shipped. Section 5 (Photo pipeline) needs the Phase 2 additions (hotel gallery, multi-photo, destination header landmarks, viewport batch resolve, post-gen resolve).
- **Why accepted:** Skill was last updated during the skills sprint (April 2026) before Place Preview Phase 2 shipped.
- **Proper solution:** Update the luna-architecture skill file with current Place Preview architecture. Remove the outdated prohibition. Add the Phase 2 tables, routes, and components.
- **Severity:** Low (skill content, not runtime code)
- **Added:** May 2026

### TD-010: Remaining subagents from skills sprint not shipped

- **What:** Two of eight deliverables from the skills/subagents sprint remain: `luna-multilang-translator` (#7) and `luna-release-writer` (#8).
- **Why accepted:** Sprint paused after six deliverables shipped to prioritise Place Preview and Itinerary Generation V2.
- **Proper solution:** Resume the sprint. `luna-multilang-translator` auto-translates EN keys to PT-BR/ES using Claude with the 3-layer QA pipeline. `luna-release-writer` generates release notes from git log and smoke test results.
- **Severity:** Low (developer tooling, not user-facing)
- **Added:** May 2026

---

## Resolved items

Move items here when the proper solution ships. Keep the entry for historical context.

(No resolved items yet.)

---

## Review schedule

- Review this file at the start of every major feature.
- When a shortcut is taken under time pressure, add it here in the same commit.
- When an item is fixed, move it to "Resolved items" with the release tag and date.
