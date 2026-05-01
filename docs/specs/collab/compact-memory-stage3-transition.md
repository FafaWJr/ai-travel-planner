# Luna Collaborative Trips: Compact Memory Block
## As of 30 April 2026, transitioning to Stage 3

---

## Goal
Complete Luna Collaborative Trips through Stage 5 launch. Currently transitioning from Phase 2 polish to Stage 3 implementation.

## Completed

**Stages 0, 1, 2: ALL SHIPPED AND VERIFIED.**

Stage 2 finishing kit (8/8 items closed, commit `d28ee72f` for final item #8 CLAUDE.md regen). Stage 2f hotfix arc: 9 hotfixes (#5 through #9) shipped during QA. Recovery track R1-R5 closed.

**Phase 2 polish (3 of 4 items done):**
- P2-1 DONE (commit `27674047`): Server-side JSONB merge in `/api/trips/route.ts`. Partial collab PATCHes now preserve sibling keys (`plan`, `prompt`, `photos`). Error toast variant (red, z-index 10000 above modal).
- P2-2 DONE: `visibilitychange` listener in collab hook. Triggers catchup query on tab refocus. 500ms delay. Known limitation: `add_note` patches don't replay correctly on catchup.
- P2-3/P2-3b: Cross-slot drag. DEFERRED after 3 attempts. Emit side works (first ever `replace_activity` row in DB), but dispatcher payload shape mismatch persists. Needs a dedicated deep-dive session reading the full drag handler lifecycle. NOT blocking Stage 3.
- P2-4: Viewer PATCH explicit 403. Low priority. Not started.

## Current State
**Ready to start Stage 3: Per-user collaborative Luna chat (~10h).**

Stage 3 master plan spec (section 4) defines 5 deliverables:
1. Per-user chat threads (chat_history shape migration: flat array -> keyed object by user_id, dual-read pattern, lazy migration)
2. Viewer-readonly Luna (PARTIALLY DONE: /api/chat already strips mutation tools + removes %%TRIP_UPDATE%% for viewers per #5 pre-flight)
3. Cross-awareness summary (append recent collaborator activity to end of system prompt, capped at 5 events from trip_activity_log in last 10 min)
4. Third feature flag: NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED
5. Patch broadcast from Luna (%%TRIP_UPDATE%% from any user's Luna -> Stage 2 realtime channel; already working for owner)

QA spec: 13 numbered checks in master plan section 4 Stage 3.
Multilingual: viewer read-only message in EN/PT-BR/ES.
Critical rule: cross-awareness summary at END of system prompt to preserve prompt caching.

## Next Steps: Stage 3 Sub-stages

### Stage 3a (~3h): Chat history migration + per-user threads
The data layer. Change `chat_history` from flat array to keyed object `{ "user_abc": [...messages], "user_def": [...messages] }`. Dual-read pattern (try keyed first, fall back to flat for existing solo trips). Lazy migration: when an existing solo trip first gains a collaborator, the flat array migrates to `{ ownerId: [...existing] }` on next save. FloatingChat reads/writes only the current user's thread. This is the foundation everything else in Stage 3 builds on.

### Stage 3b (~4h): Cross-awareness summary + feature flag
The AI layer. Query `trip_activity_log` for the last 10 minutes of activity on this trip. Format as a terse "COLLABORATOR CONTEXT" block (capped at 5 most-recent events: patches, comments, presence). Append to the END of the system prompt (preserves prompt caching of the stable block). Gate with `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED` (default true, for quick rollback if it confuses users). Verify cache hits in Anthropic console for consecutive messages.

### Stage 3c (~3h): Viewer-readonly Luna + patch broadcast + QA
Polish and verification. Strengthen the existing viewer-readonly Luna (add "I can't modify the trip in viewer mode. Ask an editor to add it." fallback message in EN/PT-BR/ES). Ensure any user's Luna chat patches broadcast via Stage 2 realtime channel (`%%TRIP_UPDATE%%` from editor A's Luna produces patches visible to editor B and viewer). Run the 13 QA checks from master plan section 4 Stage 3. Multilingual QA pass (owner in EN, viewer in PT-BR: each gets Luna in own language, no contamination).

### After Stage 3
- Stage 4 (~18h): Comments, My Trips integration, mobile polish.
- Stage 5 (~6h): Landing page, flag flip, launch.

## Key Artifacts
- Repo: `github.com/FafaWJr/ai-travel-planner`, main branch
- Vercel: `prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG`, team `team_uFD2kaJDUmZtpI2rSCIMy7kW`
- Supabase: project `qhpxejzoxfruuositwzo`
- Master plan: `docs/specs/collab/00-master-plan.md` (v2.1)
- Sub-master plan: `docs/specs/collab/01-sub-master-plan-finishing-kit.md` (all 8 items closed)
- Luna chat 502s: were transient, resolved themselves. Scratched from blockers list.
- R4 prebuild gate: `npm run smoke:render` (32/32 assertions)
- All prompts in `/mnt/user-data/outputs/`

## Preferences and Constraints
- No em-dashes. Australian English or Brazilian Portuguese.
- Quality over ease. Robust long-term solutions.
- Per-prompt handoff protocol. One prompt at a time.
- Evidence-first diagnosis. Never claim shipped state without live verification.
- Wilson communicates in EN/PT-BR mix. Active user is Wilson.
- Luna brand: #FF8210 orange, #00447B navy, Poppins/Inter, no emojis in UI.

## Resume Prompt
> Phase 2 functionally complete (P2-1 JSONB merge, P2-2 tab refocus done; P2-3 cross-slot drag deferred; P2-4 low priority). Ready for Stage 3: per-user collaborative Luna chat. Master plan spec read and understood. Five deliverables, two partially done. Break into sub-stages and write the first prompt. Estimated ~10h total across multiple sessions.
