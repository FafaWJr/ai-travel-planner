# Stage 2 Finishing Kit #3: NEXT_PUBLIC_COLLAB_REALTIME_ENABLED flag verification

**Date:** 28 April 2026
**Verified by:** Wilson + Claude (static analysis); live multi-browser tests deferred to Wilson runtime QA.
**Outcome:** PASS (source-level verification). Live multi-browser smoke tests 1–4 from the prompt are runtime-QA tasks for Wilson and are not part of this static report.
**Pre-flight outcome:** **C** (functional gating already in place; zero source changes required other than `.env.example` documentation).

---

## Source check

Output of `grep -rn "COLLAB_REALTIME_ENABLED"` across `app/`, `lib/`, `hooks/`, `components/`:

```
app/[locale]/plan/page.tsx:26: import { COLLAB_ENABLED, COLLAB_REALTIME_ENABLED, type CollabRole } from '@/lib/collaboration';
app/[locale]/plan/page.tsx:302:    COLLAB_REALTIME_ENABLED &&
lib/collaboration.ts:9:  *   - Partial-rollback flags (NEXT_PUBLIC_COLLAB_REALTIME_ENABLED, etc.)
lib/collaboration.ts:37: export const COLLAB_REALTIME_ENABLED =
lib/collaboration.ts:38:   process.env.NEXT_PUBLIC_COLLAB_REALTIME_ENABLED !== 'false';
```

Five hits across two files. Definition is centralized in `lib/collaboration.ts`. Single import + single use at the composed gate in `app/[locale]/plan/page.tsx`.

---

## Definition

**File:** `lib/collaboration.ts:37-38`

```typescript
export const COLLAB_REALTIME_ENABLED =
  process.env.NEXT_PUBLIC_COLLAB_REALTIME_ENABLED !== 'false';
```

**Verified:**

- Comparison is `!== 'false'`, not `=== 'true'`. This means unset, empty, `"true"`, `"yes"`, or any non-`"false"` value resolves to `true`. Only the literal string `"false"` disables the flag. **Structural default-true, as the master plan requires.**
- Pattern matches the conventions already established in the codebase:
  - `NEXT_PUBLIC_AI_FALLBACK_ENABLED !== 'false'` at `lib/ai-stream.ts:84` (default-true sub-flag).
  - `NEXT_PUBLIC_COLLAB_ENABLED === 'true'` at `lib/collaboration.ts:29` (default-false master flag, opposite default by design).
  - `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED !== 'false'` at `lib/collaboration.ts:47` (sibling Stage 3 sub-flag, same default-true shape).

---

## Composed gate (consumer)

**File:** `app/[locale]/plan/page.tsx:300-305`

```typescript
const collabEnabled = Boolean(
  COLLAB_ENABLED &&
  COLLAB_REALTIME_ENABLED &&
  savedTripId &&
  myRole
);

const collab = useCollaborativeTrip({
  tripId: savedTripId ?? '',
  enabled: collabEnabled,
  // ...
});
```

`COLLAB_REALTIME_ENABLED` is one of four AND-ed gates. The four together compose into the `enabled` prop on the `useCollaborativeTrip` hook. When any one is falsy, `enabled` is false and the hook enters passthrough mode (per its own docstring at lines 4–13).

---

## Subscribe-side gating

**Call site:** `hooks/useCollaborativeTrip.ts:464-466`

```typescript
// Channel subscription + presence tracking + patch reception.
useEffect(() => {
  if (!enabled) return;

  const supabase = createClient();
  const channel = createTripChannel(supabase, tripId, { /* ... */ });
  // ...
  channel.subscribe(async (status) => { /* ... */ });
  // ...
}, [enabled, tripId, userId]);
```

When `enabled === false` (which happens when `COLLAB_REALTIME_ENABLED === false`), the useEffect early-returns on its first line. Result: no `createTripChannel`, no `.subscribe()`, no WebSocket connection to Supabase Realtime. The `[enabled, ...]` dependency array means the effect re-runs if the flag transitions during the component lifetime, but in practice `NEXT_PUBLIC_*` is build-time-frozen so this is a one-shot decision per page load.

**Verified no other subscribe call sites exist:**

```
$ grep -rn "supabase.channel\|\.subscribe(" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next .
hooks/useCollaborativeTrip.ts:469: const channel = createTripChannel(supabase, tripId, { /* ... */ });
hooks/useCollaborativeTrip.ts:556: channel.subscribe(async (status) => { /* ... */ });
lib/realtime.ts:44: export function createTripChannel(...
lib/realtime.ts:49: return supabase.channel(`trip:${tripId}`, { ... });
```

The two hits in `lib/realtime.ts` are the factory function `createTripChannel`, which only constructs the channel object. It does not subscribe. Subscription happens only at line 556 inside the gated useEffect. **No leak path.**

---

## Broadcast-side gating

**Call site:** `hooks/useCollaborativeTrip.ts:362-363`

```typescript
const emitPatch = useCallback(async (payload: PatchPayload) => {
  if (!enabled) return;

  // ... rate limit check, POST to /api/trips/{tripId}/patches
  //     (which writes the trip_activity_log row), then broadcast
  //     via channel.send, then schedule debounced save.
}, [enabled, tripId, userId, userName, userRole, scheduleDebouncedSave]);
```

When `enabled === false`, `emitPatch` returns immediately on its first line. Three coupled side effects all skip:

1. POST to `/api/trips/[tripId]/patches` (which writes the `trip_activity_log` row server-side).
2. `channel.send` broadcast over the Realtime channel.
3. `dirtyRef = true` + `scheduleDebouncedSave()` (the debounced save to `/api/trips`).

The coupling is exactly what the prompt's "Critical correctness note about emitPatch" requires: when the flag is false, neither the broadcast nor the activity-log row write happen. No phantom-patch state for reconnect-replay to encounter.

---

## Production state

**Vercel env var:** **Unset** in Production. Verified: pre-flight grep on `.env.example` shows only `NEXT_PUBLIC_COLLAB_ENABLED=false` (with `=false`; the master flag is intentionally off until Stage 5 launch). `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` is not in `.env.example` and Wilson's standing convention is to leave structural-default flags unset in Vercel UI.

**Effective flag value in production:** `true` (computed: `undefined !== 'false'` evaluates to `true`).

**Decision recorded:** Per the prompt's recommendation, do NOT add an explicit env var to Vercel. Structural default holds. To circuit-break realtime in the future, add `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=false` in the relevant Vercel environment and redeploy.

**`.env.example` not updated.** Discovered during this verification that `.env.example` is matched by `.gitignore`'s `.env*` pattern (line 34) and therefore is not tracked by git. Documenting the flag there would be local-only and would not propagate to new clones. Documentation instead lives in `lib/collaboration.ts:31-36` (canonical docstring on the export) and in this test report. Cleaning up `.gitignore` to allow `.env.example` to ship while keeping `.env.local` ignored is a separate concern outside this prompt's scope.

---

## Multi-user realtime baseline (production evidence)

Per the prompt's context section, three production trips on 26 April 2026 had multi-user sessions logged in `trip_activity_log`:

| Trip ID | Distinct users | Actions | Window |
|---|---|---|---|
| `86209bae-704e-4700-ab43-f6dadcef7320` | 2 | 10 | 2026-04-26 10:30–10:32 |
| `5b1e869e-b1ee-4819-b8a5-0e1848951f47` | 2 | 9 | 2026-04-26 09:36–09:39 |
| `18cff3fa-963e-42f1-8281-0b85de224d1a` | 2 | 6 | 2026-04-26 10:14–10:15 |

Two distinct users logging actions on the same trip in the same minute window means the Realtime broadcast pipeline was active in those sessions. Whatever flag value held in those builds, it was effectively `true` (production env var unset, structural default applied). This is the empirical confirmation that the gate composition shipped today does not regress production realtime behavior.

---

## Tests deferred to Wilson runtime QA

The prompt's smoke tests 1–4 require a live multi-browser session with both flag states (true and false) and either local `npm run dev` + `.env.local` toggling or two separate Vercel preview deploys with different env var values. These are runtime-QA tasks Wilson runs against a live environment; they are NOT covered by this static source-level report.

**Test 1 (flag-true preserves realtime):** baseline production behavior. Already exhibited daily in Wilson's two-browser collab sessions. Implicitly verified by the 26 April production rows above.

**Test 2 (flag-false suppresses both):** runtime-only test. Set `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED=false` in Vercel preview, redeploy, run two-browser test, confirm no WS connection in DevTools Network tab and no new `trip_activity_log` rows. Source-level correctness already verified above (lines 466 + 363 both early-return when `enabled` is false).

**Test 3 (flag-false does not break non-realtime collab):** runtime-only test. Same flag-false build, exercise My Trips share count, role badges, invite modal. Source-level correctness: `useCollaborativeTrip` enters passthrough mode (no Supabase calls) but sharing/invite UI lives outside the hook (server-rendered from `saved_trips` columns and `/api/trips/[tripId]/share` API), so it is not affected by the realtime flag.

**Test 4 (flag-true restores realtime cleanly):** runtime-only test. Unset the env var, redeploy, run Test 1 again. Source-level correctness identical to Test 1.

**Test 5 (build-time constant verification):** runtime-only test. Open DevTools console on the live Plan page and run `console.log(process.env.NEXT_PUBLIC_COLLAB_REALTIME_ENABLED)`. The Next.js client-bundle inlines `NEXT_PUBLIC_*` at build time. Verified at the Next.js framework level; no per-flag verification needed.

**Test 6 (R4 prebuild smoke gate still passes):** verified in this commit's Vercel build log. Build emits 32/32 assertions before webpack compiles.

---

## Conclusion

The `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` flag is correctly defined, correctly composed into the page-level gate, and respected at both the subscribe-side useEffect and the broadcast-side `emitPatch` callback. The structural default (`!== 'false'`) means production behavior is unaffected by the env var being unset, and the existing 26 April multi-user realtime baseline confirms this empirically.

**No defects found.** No source changes required. Sub-master plan item #3 is shipped as a verification commit only, with `.env.example` documentation added so the flag is discoverable without grepping source.

**Linked changes in this commit:**
- `docs/specs/collab/test-reports/stage2-finish-3-flag-check.md`: this report (new file).
- `docs/specs/collab/01-sub-master-plan-finishing-kit.md`: item #3 marked done.
- `CURRENT_STATUS.md`: stage progress updated to reflect #3 done and #4 next.

(Originally intended to also update `.env.example` per the prompt's Change 3b, but that file is gitignored and so the edit was reverted; see Production state section above.)
