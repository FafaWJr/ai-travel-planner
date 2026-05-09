# Collab Patch Pipeline Conventions

These are locked conventions from hard-won hotfixes. Violating any of them recreates a known incident.

## Entity IDs

- **Every Day object MUST have a stable `id`.** Markdown parser, `defineDayInputToDay`, and `setDays` wrapper all enforce this. Never construct a Day without an id. `setDays` backstop auto-injects on any Day missing one.
- **Patch payloads carry entity ids.** Any patch payload referencing an entity (activity, day, phase, hotel) MUST carry that entity's stable id. Receivers MUST use the patch-carried id, not generate their own.

## React State in Imperative Handles

- **`useImperativeHandle` handle methods MUST read state via `*Ref.current`.** Never use closure-captured state variables inside handle methods.
- **State updaters MUST be pure.** Never assign to outer-scope variables from inside a `setState(prev => ...)` updater.
- **Pre-compute values from `daysRef.current` before `setDays`.** React 18 runs functional state updaters in the batch queue after the synchronous function body completes. Snapshot `dayId`, `confirmed`, `activityId`, etc. from refs in the function body, then pass by closure.
- **Any `useImperativeHandle` whose handle methods reference props MUST use the ref-of-prop pattern** (`onPatchEmitRef`).

## Emit Conventions

- **`emitPatch` does NOT auto-apply commutative patches on the sender.** Every emit site must have already applied the change locally before calling `emitPatch`.
- **Every inline `setDays` in a user-action handler MUST have a matching `emitFromInline` call.**
- **`applyPatchToRef` passes `suppressEmit:true`** to prevent ping-pong re-broadcast. Rate limit: 10 emits / 5s.
- **`removeActivitiesMatching` MUST broadcast.** Snapshot matching activities before `setDays`, then emit a `remove_activity` patch for each.

## Drag

- **Drag source slot must be captured at `handleDragStart`** via `dragSourceSlotRef.current`. `handleDragOver` mutates the activity's slot mid-drag for live preview. `handleDragEnd` reading `from.slot` sees the post-preview slot — always read the ref.
- Within-slot vs cross-slot drag emit different patch types — do not collapse them.

## Viewer Role

- **New edit affordances must check `!readOnly`** before rendering.
- The page-level Save button is gated by `!isViewerRole`.
- Luna chat stays visible (the API strips mutation tools server-side for viewers).

## Save Guards

- Client `validateTripPayloadForSave` blocks save when `planLen < 100 AND itineraryDays.length > 0`.
- Server `REFUSED_INCONSISTENT_TRIP` on POST + PATCH `/api/trips` fires only when BOTH `plan` and `itineraryDays` are in the body — collab partial-patches are not blocked.

## Patch Library

22 types as of Stage 3. 4 non-commutative: `split_phase`, `merge_phases`, `reorder_phases`, `reorder_activities_in_slot`. `confirm_day` is commutative (idempotent toggle). `lib/trip-patches.ts` exports `PATCH_COMMUTATIVITY` and `isCommutative(type)`.

## Chat History

Chat history shape: `{ userId: [messages...] }` (keyed object, not flat array). `readUserChatHistory` dual-reads: keyed access first, flat array fallback for legacy solo trips. Editor chat persistence via dedicated `PATCH /api/trips/[tripId]/chat-history` (service-role client merges thread without overwriting other users'). Do not use general `PATCH /api/trips` for editor chat — it uses `.eq('user_id', ...)` and matches only the owner row.

## Feature Flags (Collab)

| Flag | Default | Scope |
|---|---|---|
| `NEXT_PUBLIC_COLLAB_ENABLED` | `false` | Master toggle |
| `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` | `true` | Realtime sync only |
| `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED` | `true` | Cross-awareness summary |
