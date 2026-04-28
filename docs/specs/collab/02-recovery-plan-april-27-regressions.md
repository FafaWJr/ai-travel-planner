# Luna Recovery Plan: April 27 regressions

**Status:** Closed. R1 + R2 + R4 shipped to production. R3 deferred (kept open in case real users hit broken rows post-launch). R5 (this bookkeeping pass) committed with this commit.
**Created:** 27 April 2026
**Closed:** 27 April 2026
**Maintainer:** Wilson
**Context:** During the SSR + saved-trip-load detour earlier on 27 April 2026, three production regressions surfaced. Wilson reported all three after seeing screenshots that showed degraded formatting and empty saved-trip tabs. This document captures the diagnosis, the order of operations, the as-shipped status of each item, and the boundary line: master plan stages stayed paused until R1 + R2 + R4 shipped.

---

## What I got wrong earlier on 27 April, stated plainly

When Wilson first reported the formatting issue, I claimed it was pre-existing and explained it as the AI emitting `**bold**` instead of `### heading`. That was wrong. The `**bold**` observation was real but it was not the cause. The actual cause is that `sanitize-html` (which we shipped earlier on 27 April as the SSR fix) strips inline `style` attributes by default, while the previous library `isomorphic-dompurify` allowed them. The `markdownToHtml` function in `app/[locale]/plan/page.tsx` (now extracted to `lib/plan-render.ts` per R4) generates HTML with rich inline styles for navy headings, orange bullet dots, paragraph margins, and bordered H2 underlines. The SSR fix gutted all of those styles. I should have read `markdownToHtml` AND the new `sanitize-html` config before claiming "pre-existing." I did not. Wilson was right to push back.

I also told Wilson "saved trips render fine, the AI just writes content differently." That was also wrong. New trips have been saved with empty `plan` markdown intermittently for at least 24 hours, and the saved-trip-load `hasContent` fix exposed this by letting the page mount even when `plan` is empty. The empty Overview/Weather/Transport/Tips tabs Wilson reported are exactly that: trips with no markdown narrative ever persisted at save time.

---

## The three real regressions

### Regression 1: `sanitize-html` strips inline styles

**Symptom.** Every `<h2>`, `<p>`, `<ul>`, `<li>` rendered inside `.plan-section` shows with `margin: 0`, default browser styling, no navy color, no underline, no orange bullets, no indentation. Confirmed live in production 27 April via DevTools computed-style inspection on Bali trip Weather tab.

**Evidence.**
- `markdownToHtml` emits inline styles like `style="color:#00447B;margin:32px 0 14px;border-bottom:2px solid rgba(0,68,123,0.10)"` on H2.
- Live DOM on production showed H2 with `color: rgb(0, 0, 0)`, `margin-top: 0`, `margin-bottom: 0`, `border-bottom: 0px none`.
- Live DOM on production showed `<ul>` with `padding-left: 0` and `<li>` with `list-style-type: disc` (browser default).
- Production stylesheet contained only one rule for `.plan-section` and it was a mobile media query. Zero rules style desktop H2/P/UL/LI inside `.plan-section`.
- The only thing that processes that HTML between generation and render is `sanitizeHtml(markdownToHtml(sectionContent))`. `sanitize-html` strips `style` attributes by default unless explicitly allowed.
- The SSR fix (commit `2a791e34`, 27 April) swapped `isomorphic-dompurify` (which allowed inline styles) for `sanitize-html` (which strips them).

**Root cause.** Default `sanitize-html` config rejects all inline `style` attributes. The XSS-protection swap was correct in spirit; the omission was failing to whitelist the inline styles we actually use.

### Regression 2: New trips intermittently save with empty `plan`

**Symptom.** Of 4 trips created on 27 April 2026 by the same user, 2 had full plan markdown (Bali 12592 chars, earlier Brasilia 13628 chars) and 2 had empty plan (Phuket 0 chars, later Brasilia 0 chars). Same code path; intermittent outcome. Reported by Wilson as "Overview/Weather/Transport/Tips tabs are empty."

**Evidence.**
- Database query confirmed 4 trips created same day, 2 with full `plan`, 2 with `plan_len = 0`. Same user.
- The save flow at `buildTripPayload` in `app/[locale]/plan/page.tsx` writes whatever React state holds for `plan`. There was no validation, no fallback, no error if `plan` was empty.
- The AI generation flow at `generatePlan` sets React `plan` state by accumulating text tokens from the SSE stream. If the AI session emits only `tool_use` events (structured-itinerary mode), zero text tokens arrive, `plan` stays empty string, save persists empty.
- The destructive-PATCH guard (commit `eaf0f7e1`) only triggers on PATCH that EXPLICITLY sends `plan: ""` for a row whose stored `plan` is non-empty. It does NOT trigger on POST creation with empty `plan`, because there's no prior non-empty value to protect.

**Root cause.** Two cooperating issues. (2a) The AI structured-itinerary mode is supposed to emit BOTH a markdown narrative (text tokens) AND structured days (tool_use). In practice it sometimes emits only one or the other. When it emits only `tool_use`, `plan` is never populated. (2b) The save path had no minimum-content guard. It would happily persist `plan_len = 0` even when the user clearly expected a full narrative.

### Regression 3: SSR detour shipped without parallel format-regression catch

**Symptom.** Regression 1 above shipped to production for 5 hours before Wilson noticed it from screenshots. Production smoke tests for /plan checked HTTP 200 and absence of error shell, but did NOT verify that rendered prose has the expected inline styles intact.

**Root cause.** `scripts/smoke-plan-route.mjs` (added with the destructive-PATCH guard, commit `eaf0f7e1`) only validates HTTP status and absence of Next.js error shell. It does not validate visual rendering of any saved trip's content tabs. There was no automated check that would have caught the missing styles.

---

## Recovery sequence

Five items in original plan order. R1 + R2 + R4 shipped, R3 deferred, R5 closes the track via this bookkeeping pass.

### Item R1: Restore inline styles in sanitize-html

**Status:** SHIPPED.
**Shipped via:** commit `69d271d5`, deploy `dpl_9Tz5Ldg5tevTVoohX954XnuWp2j3`, 27 April 2026.
**Verification:** Live DOM on Bali trip Weather tab confirms H2 navy color rgb(0, 68, 123), border-bottom 2px solid rgba(0, 68, 123, 0.1), paragraph margin 4px 0, orange bullet span background rgb(255, 130, 16). All four markers present. XSS regression tests passed on production: scripts, iframe, on* event handlers, and javascript: URIs all blocked.

Configured `sanitize-html` to allow the specific inline style attributes that `markdownToHtml` emits. Allowlist scope:
- On any element: `font-family`, `font-weight`, `font-size`, `color`, `background`, `background-color`, `margin`/`-top`/`-right`/`-bottom`/`-left`, `padding`/`-top`/`-right`/`-bottom`/`-left`, `border`/`-top`/`-right`/`-bottom`/`-left`, `border-radius`, `text-transform`, `letter-spacing`, `line-height`, `display`, `position`, `top`/`left`/`right`/`bottom`, `width`/`height`, `min-width`/`max-width`, `text-align`, `list-style`/`-type`, `align-items`, `justify-content`, `cursor`, `transition`, `counter-reset`, `overflow`, `white-space`, `opacity`.
- Allowed CSS values: hex colors (`#[0-9a-fA-F]{3,8}`), rgba/rgb (`rgba?\([^)]+\)`), pixel values (`-?\d+(\.\d+)?(px|em|rem|%)`), keywords (`center|left|right|top|bottom|none|inline|block|inline-block|flex|inline-flex|relative|absolute|fixed|inherit|initial|unset|auto|bold|600|700|400|500|300`), shorthand combos (multiple of the above space-separated), font names in single quotes.
- URL values: not allowed in style values (no `url()` or `@import`). Safer XSS posture.

Applied at the call site `sanitizeHtml(markdownToHtml(sectionContent))` in `app/[locale]/plan/page.tsx`. Same config also at the `extraIdeas` call site.

### Item R2: Diagnose why AI sometimes emits no text tokens, then guard the save path

**Status:** SHIPPED.
**Shipped via:** commit `cc769a0a`, deploy `dpl_CoP55t7KgFCieTpjJBDWKaP96yA9`, 27 April 2026.
**Hypothesis confirmed:** H1 via static analysis. H4 (model non-determinism) cannot be fully ruled out yet because no real users have generated trips since deploy and only Wilson + Fafa generate during pre-launch testing. The R2b/R2c guards block any residual H4 case without data loss; if a real user ever hits the empty-narrative state post-launch, the toast surfaces "Trip not fully generated. Please regenerate before saving." instead of corrupting their library.
**Verification:** 12 prompt smoke tests passed on Vercel preview. Direct POST/PATCH with empty plan + days returns HTTP 400 REFUSED_INCONSISTENT_TRIP. Collab partial PATCHes (only itineraryDays in body) still return 200 (carve-out works).

R2a (the proper fix). Static analysis identified two anchor points where the AI prompt was ambiguous about whether narrative text was required alongside tool calls. Tightened both: (1) a new first item in the SYSTEM_PROMPT Absolute rules block in `lib/ai.ts` declaring a response with only tool calls (or only narrative) is INCOMPLETE and INVALID; (2) a terminal MANDATORY OUTPUT FORMAT block appended at the end of the user prompt in `app/api/generate/route.ts` for both the simple-prompt mode and the structured-form mode. The terminal block is the last text the model reads before generating, which maximises adherence.

R2b (defense in depth, client). Added `validateTripPayloadForSave` helper in `app/[locale]/plan/page.tsx` and integrated into `saveTrip`. Refuses save when `planLen < 100 && itineraryDays.length > 0`. Threshold at 100 chars (not 0) to catch partial-stream artefacts. Genuine narratives are >5000 chars.

R2c (defense in depth, server). POST `/api/trips` now returns HTTP 400 `REFUSED_INCONSISTENT_TRIP` when the same condition holds. PATCH same, but only fires when both `plan` and `itineraryDays` are explicitly in the body. Collab partial patches (which often send only `itineraryDays` after an accept_activity edit) are not blocked.

R2d (translations). `plan.errors.emptyPlanFullDays` added in EN/PT-BR/ES with accents verified via Node JSON roundtrip.

### Item R3: Backfill empty-plan trips by regenerating just the narrative

**Status:** DEFERRED (not closed).
**Decision:** Wilson 27 April 2026. The two known broken trips (Phuket `4f3a8618`, later Brasilia `464db15b`) are personal test data created during the recovery diagnosis. The saved-trip-load fix from commit `958ac160` already lets them open without spinning. Their Itinerary tab renders correctly; only the prose tabs (Overview/Weather/Transport/Tips) are empty. R3 stays open in case a real user post-launch reports a broken row, at which point the regeneration script becomes worth writing. R2's guards prevent the class from happening to new trips.

Original plan: re-run the narrative generation against the existing structured itinerary and patch `trip_data.plan`. Server-side script, idempotent, gated behind a manual run command.

### Item R4: Visual smoke test that catches style regressions

**Status:** SHIPPED.
**Shipped via:** commit `e1c6a924`, deploy `dpl_BPVtmoEFoh2HDj3u17dn757QV5eb`, 27 April 2026.
**Verification:** Vercel build log for the deploy shows the npm prebuild hook firing BEFORE webpack: `> travel-planner@0.1.0 prebuild`, `> npm run smoke:render`, `> node --experimental-strip-types scripts/smoke-plan-render.mjs`, then `[Inline-style preservation contract (R1)]` 12 PASS lines, `[XSS protection contract]` 16 PASS lines, `[End-to-end pipeline]` 4 PASS lines, `smoke-plan-render: 32/32 assertions passed`, `All contracts intact. Plan rendering pipeline is healthy.`, then `> next build --webpack`. Gate is structurally in place.

**Wilson scope deviation:** Original prompt asked to extract `SECTIONS` and `SECTION_KEYWORDS` from page.tsx into `lib/plan-render.ts`. Wilson kept SECTIONS in page.tsx because it references Lucide React icons (Icon.Overview etc.) which would pollute a pure module. Added internal SECTION_LABEL_MAP in `lib/plan-render.ts` so extractSection's fallback works without the Icon dep. Net result: cleaner purity boundary than the prompt specified. Behavior identical.

What landed:
1. Extracted `inlineMd`, `markdownToHtml`, `extractSection`, `PLAN_SANITIZE_CONFIG` from `app/[locale]/plan/page.tsx` into `lib/plan-render.ts` (server-importable, pure, no React).
2. Added `scripts/smoke-plan-render.mjs` with 32 assertions across positive markers (R1 contract), negative markers (XSS still blocked), and end-to-end pipeline. Plain ESM, uses Node's `--experimental-strip-types` to import the .ts source directly.
3. Added `prebuild` and `smoke:render` scripts in `package.json`. Vercel's `next build --webpack` runs prebuild automatically, gating every deploy on the smoke passing.

### Item R5: Update CURRENT_STATUS.md and sub-master plan

**Status:** SHIPPED.
**Shipped via:** commit `0b7c1af6`, deploy `dpl_7xQ9rKbbpUVwA8pY7TaQcFjdTiry`, 27 April 2026.

Adds R1+R2+R4 entries to `CURRENT_STATUS.md`'s "Recent detours" table, adds a recovery-track summary entry, and removes any stale "active detour" references. Marks sub-master plan item #2 (`luna-prose-format-restore.md`) as superseded by R1. Reopens sub-master plan items #3 through #11 from their paused state.

---

## What stays paused

None. The recovery track is closed. Sub-master plan items #3 through #11 are reopened. Stage 3 / 4 / 5 remain paused per the original master plan v2.1 sequence (they unblock after the Stage 2 finishing kit completes per `docs/specs/collab/01-sub-master-plan-finishing-kit.md`).

---

## Order of operations (as executed)

1. R1 first (visible fix that restored formatting for everyone).
2. R2 second (stopped the bleeding on new trips).
3. R3 deferred by Wilson decision.
4. R4 (regression guard so this class of bug cannot ship silently again).
5. R5 (this bookkeeping pass).
6. Resume sub-master plan from item #3.

---

## Lessons for the prompt-writer skill

Adding to the queue for the eventual `luna-prompt-writer-skill-update.md`:

- When a fix prompt swaps a library that processes user-visible HTML, **the smoke tests must include a visual rendering check on a representative trip with full content**, not just an HTTP 200 check.
- When the user reports "this looks broken," the diagnosis must include reading the actual rendering pipeline end to end (markdown to HTML emit to sanitize to DOM) before claiming "pre-existing" or "AI behavior." I claimed the latter on 27 April and it cost trust.
- When a save flow can persist incomplete data (empty `plan` while `itineraryDays` is full), there must be a guard at the save layer, not just at the read layer. Read-side defensiveness covers display; write-side defensiveness prevents the bad state ever reaching the database.
