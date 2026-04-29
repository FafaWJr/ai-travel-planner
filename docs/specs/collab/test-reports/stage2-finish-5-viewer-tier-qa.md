# Stage 2 Finishing Kit #5: Viewer tier end-to-end QA

**Date (source-level pre-flight):** 29 April 2026
**Verified by:** Claude (source-level pre-flight); live two-browser exercise pending Wilson runtime QA.
**Status:** **PRE-FLIGHT PARTIAL.** Source review predicts robust API enforcement and weak UI enforcement. Live exercise expected to PASS API checks (V-API-1 through V-API-3) and FAIL or PARTIAL most UI checks (V-UI-1, V-UI-2, V-UI-4, V-UI-5, V-UI-7). The UI shortfall is contained: every viewer click that hits the API is rejected with HTTP 403, so the read-only invariant holds at the data layer. The visible defect is that the viewer sees clickable controls and gets local optimistic updates that revert when broadcast confirmation never arrives.

This report records the pre-flight findings so Wilson can run the live exercise quickly and either confirm the predictions or capture any divergence as evidence for a follow-up hotfix prompt.

---

## 1. Source-level architecture summary

### 1a. UI viewer-role gates that exist

The `myRole` state in `app/[locale]/plan/page.tsx:278` is loaded from `getUserTripRole` after the trip and collab subscription resolve. The state is consumed by exactly ONE UI gate:

- `app/[locale]/plan/page.tsx:1299`: `{COLLAB_ENABLED && myRole === 'owner' && savedTripId && (...invite button...)}`. Viewers (and editors) do not see the Invite button.

`myRole` is also passed into `useCollaborativeTrip` as `userRole` (line 313) for presence broadcast and emit-permission checks inside the hook (the hook's `emitPatch` itself does not gate by role; the server side does).

### 1b. UI viewer-role gates that DO NOT exist

`EditableItinerary` accepts an `isGuest` prop. `isGuest` is wired as `!user` in `plan/page.tsx:1434` and `plan/page.tsx:1977`. This means the prop is true ONLY for logged-out users, not for authenticated viewer collaborators. Every `if (isGuest) ...` early-return inside `EditableItinerary` (lines 1224, 1263, 1397, 1475) therefore does NOT block viewer-role mutations.

Consequence: viewers can:
- Click accept and decline buttons on activity cards.
- Drag activities within and across slots.
- Open Luna chat and send messages.
- Edit notes on day cards.
- Edit phase labels and trigger phase splits / merges.

Each click runs the local handler (`setDays(...)`) AND calls `emitFromInline` or an imperative ref method that fires `onPatchEmit`. `onPatchEmit` is `collab.emitPatch` when `collab.enabled === true`. `emitPatch` calls `POST /api/trips/[tripId]/patches`, which returns 403 for viewers (see 1c). The emit then logs an error and the broadcast never goes out, so other browsers do not see the change. The viewer's local state still reflects the optimistic edit until they refresh, at which point it reverts to the server-stored (unmutated) state.

This is a defect: viewers see active controls that produce visible local changes that silently revert. It is NOT a security defect; the server enforces correctly. It IS a UX defect.

### 1c. Server-side viewer enforcement

| Endpoint | Viewer behaviour | Source |
|---|---|---|
| `POST /api/trips/[tripId]/patches` | Returns `403 { error: 'Viewers cannot emit patches' }` | `app/api/trips/[tripId]/patches/route.ts:35-37` |
| `GET /api/trips/[tripId]/patches?since=N` | Allowed (read-only replay; viewers need it to stay in sync) | line 89-95 |
| `POST /api/chat` | Tools array empty for viewers (`isViewer ? [] : buildLunaChatTools()`); response buffered, mutation markers stripped, returned as `text/plain` with `X-Luna-Viewer-Filtered: 1` header | `app/api/chat/route.ts:66-128` |
| `PATCH /api/trips` (full save) | NO explicit role check. The query has `.eq('user_id', user.id)` so a viewer's PATCH affects 0 rows and returns 200 OK (silent no-op). Not a security gap, but not a clean 403 either. | `app/api/trips/route.ts:254-258` |
| `POST /api/trips/[tripId]/share?role=viewer\|editor` | `requireTripOwner` 403s anyone but the owner | `app/api/trips/[tripId]/share/route.ts:43-46` |
| `PATCH /api/trips/[tripId]/collaborators/[userId]` | `requireTripOwner` 403s anyone but the owner | `app/api/trips/[tripId]/collaborators/[userId]/route.ts:31-33` |
| `POST /api/trips/[tripId]/join?token=...` | Public (the token IS the auth); resolves to viewer or editor by token match | `app/api/trips/[tripId]/join/route.ts:52-58` |

### 1d. Supabase RLS on `trip_activity_log`

Per `docs/specs/collab/01-technical-spec.md:341-354`:

- INSERT policy: `user_id = auth.uid() AND trip_id IN (saved_trips.user_id = auth.uid() UNION trip_collaborators.user_id = auth.uid())`. **Allows ANY collaborator (including viewer) to INSERT a row.** Role check is at the API layer only. Per spec comment: "server-side validation ensures actions are legal for role".
- SELECT policy: same set, allows viewer to read.
- UPDATE / DELETE: not allowed (append-only log).

Implication: a viewer can theoretically bypass `/api/trips/[tripId]/patches` and call `supabase.from('trip_activity_log').insert(...)` directly from the browser. The RLS policy will accept the row. The broadcast channel will replay it to other browsers. **This is a known gap noted in the spec.** Mitigation: the Realtime broadcast subscription dispatches by `payload.type`, and the dispatcher can be hardened to ignore patches whose originator is a viewer (cross-check via `userRole` in the patch envelope). Stage 2 ships without this defense; closing it is queued behind Stage 3.

### 1e. Viewer share URL pattern

InviteModal generates `${origin}/${locale}/trip/${tripId}?invite=${viewerToken}` (`components/collab/InviteModal.tsx:25`). The viewer pastes this URL, which lands on `app/[locale]/trip/[tripId]/page.tsx`. That page auto-calls `POST /api/trips/[tripId]/join?token=...` and redirects to `/plan?tripId={tripId}`. No explicit Accept / Decline prompt; the join is silent.

---

## 2. Test bench setup (for Wilson live exercise)

1. **Choose a test trip.** Any saved collaborative trip with multi-day itinerary content. Recommended: the trips used for #4 patch coverage QA (`5b1e869e-b1ee-4819-b8a5-0e1848951f47` or `86209bae-704e-4700-ab43-f6dadcef7320`).

2. **Browser A (owner).** Sign in as Wilson. Open the trip plan page. Click the Invite button. In the modal, copy the VIEWER share URL.

3. **Browser B (viewer).** Open Chrome incognito or a different profile. Sign in as Fafa (or any second test user). Paste the viewer URL. Observe brief "Joining..." then redirect to `/plan?tripId=...`.

4. **Verify the viewer row exists:**
   ```sql
   SELECT user_id, role, created_at
   FROM trip_collaborators
   WHERE trip_id = '<test trip id>' AND role = 'viewer';
   ```

5. **Capture pre-test row count for assertions:**
   ```sql
   SELECT count(*) FROM trip_activity_log WHERE trip_id = '<test trip id>';
   ```

---

## 3. UI enforcement checks

| Check | Description | Pre-flight prediction | Live result | Notes |
|---|---|---|---|---|
| V-UI-1 | Accept/Decline buttons absent | **FAIL predicted** | `[FILL IN]` | UI does not gate viewer; buttons render. Click triggers local optimistic update; emit POST 403s; state reverts on next reload. Visible defect. |
| V-UI-2 | Drag handles absent | **FAIL predicted** | `[FILL IN]` | UI does not gate viewer; drag works locally; emit POST 403s. Same revert-on-reload behaviour. |
| V-UI-3 | Luna chat mutation restricted | **PASS predicted** | `[FILL IN]` | `/api/chat` strips mutation tools for viewer; response buffered and `%%TRIP_UPDATE%%` markers removed. Luna will narrate but not mutate. Header `X-Luna-Viewer-Filtered: 1` present. |
| V-UI-4 | Add note controls absent | **FAIL predicted** | `[FILL IN]` | Note input renders; viewer can type; emit POST 403s. |
| V-UI-5 | Phase edit controls absent | **FAIL predicted** | `[FILL IN]` | Phase rename input and split / merge controls render; viewer can interact; emit POST 403s. |
| V-UI-6 | Invite button absent | **PASS predicted** | `[FILL IN]` | `myRole === 'owner'` gate at `plan/page.tsx:1299` correctly hides the Invite button for viewers. |
| V-UI-7 | Save trip button behaviour | **PARTIAL predicted** | `[FILL IN]` | `PATCH /api/trips` filters by `user_id = user.id`; for a viewer, the update affects 0 rows and returns 200. Save APPEARS to succeed but does nothing. The button should be hidden or disabled to avoid confusion. |
| V-UI-8 | All tabs readable | **PASS predicted** | `[FILL IN]` | Read-only views are not role-gated; all tabs render the trip content. |

---

## 4. API enforcement checks

| Check | Description | Pre-flight prediction | Live result | Notes |
|---|---|---|---|---|
| V-API-1 | Direct PATCH `/api/trips` rejected | **PARTIAL predicted** | `[FILL IN]` | Returns 200 with 0 rows updated (silent no-op via `.eq('user_id', user.id)`). Not a clean 403 but data is safe. |
| V-API-2 | Forced `POST /api/trips/[tripId]/patches` rejected | **PASS predicted** | `[FILL IN]` | Returns `403 { error: 'Viewers cannot emit patches' }`. Verified in source at `app/api/trips/[tripId]/patches/route.ts:35`. |
| V-API-3 | RLS on `trip_activity_log` blocks viewer inserts | **FAIL predicted (by design)** | `[FILL IN]` | Per spec, the INSERT policy allows any collaborator. Role enforcement is API-layer only. Direct browser-side `supabase.from('trip_activity_log').insert(...)` from a viewer session would succeed. Stage 2 known gap. |

**For Wilson:** if you have time, run V-API-3 by opening DevTools in Browser B (viewer session) and pasting:

```javascript
const { data: { user } } = await window.supabase.auth.getUser();
window.supabase.from('trip_activity_log').insert({
  trip_id: '<test trip id>',
  user_id: user.id,
  action: 'add_activity',
  payload: { type: 'add_activity', dayId: '<any day id>', activity: { id: 'test', text: 'INJECTED', slot: 'morning', status: 'pending' } },
}).select();
```

If the row is inserted, V-API-3 is FAIL (as predicted); the gap is then a candidate for Stage 3 hardening (filter incoming patches by originator role at the dispatcher). If the RLS rejects, Supabase has been hardened beyond the spec and we should update the spec.

---

## 5. Editor regression checks

| Check | Description | Pre-flight prediction | Live result | Notes |
|---|---|---|---|---|
| V-REG-1 | Editor full controls | **PASS predicted** | `[FILL IN]` | No code change since editor session was last verified. All affordances render. |
| V-REG-2 | Editor mutations broadcast to viewer | **PASS predicted** | `[FILL IN]` | Realtime subscription is role-agnostic; viewers receive broadcasts and apply via dispatcher. |

---

## 6. Failures and follow-up prompts

**If pre-flight predictions hold:** the live exercise will produce UI defects (V-UI-1, V-UI-2, V-UI-4, V-UI-5, V-UI-7) and one PARTIAL (V-API-1). These are not security blockers. They are UX polish: the viewer should not see clickable controls that silently no-op.

**Predicted hotfix scope: Stage 2f hotfix #9 (viewer UI gating).** A small change in `plan/page.tsx` that derives a `viewerReadOnly = myRole === 'viewer'` flag and threads it into `EditableItinerary` as a `readOnly` prop alongside `isGuest`. `EditableItinerary` then short-circuits or hides:

- Accept / decline buttons in the activity card row.
- Drag handle visibility (or pointer-events: none).
- Note textarea (read-only attribute).
- Phase edit / split / merge controls.
- Save Trip button.

`/api/chat` viewer path is already correct; no change needed there. The Invite button gate is already correct.

**Estimated effort for hotfix #9:** ~2-3 hours. Risk: low (additive prop with default value).

**Wilson confirms scope before hotfix #9 is written.** This report only documents the prediction; it does not commit to implementing the fix.

---

## 7. Conclusion

Source-level review of the Stage 2 viewer tier confirms strong API and Luna-chat enforcement, weak UI enforcement, and one known RLS gap (deliberate per spec). The data layer is safe: viewers cannot persist any mutation through the supported API surface. The user experience layer leaks: viewers see clickable controls that silently no-op when their emit attempts hit the API.

Sub-master plan #5 closes with this report. The recommended follow-up is hotfix #9 to add explicit UI-level read-only gating, after which sub-master plan #6 (reconnect replay QA) can proceed.
