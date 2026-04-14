# Luna Let's Go - Claude Code Context
**Last Updated:** 2026-04-12 17:50:17
**Current Branch:** main
**Last Commit:** a29d521 fix: remove all em dashes from Rio post, fix badge and caption
**Deployment:** https://www.lunaletsgo.com

---

## Critical IDs & Endpoints

**Vercel:**
- Project ID: `prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG`
- Team ID: `team_uFD2kaJDUmZtpI2rSCIMy7kW`

**Supabase:**
- Project ID: `qhpxejzoxfruuositwzo`

**GitHub:**
- Repo: `FafaWJr/ai-travel-planner`
- Branch: `main`

---

## Active API Routes

```
app/api/blog-comments/route.ts
app/api/brevo-sync/route.ts
app/api/budget-estimate/route.ts
app/api/chat/route.ts
app/api/day-suggestions/route.ts
app/api/destination-photos/route.ts
app/api/exchange-rates/route.ts
app/api/extra-ideas/route.ts
app/api/generate/route.ts
app/api/google-place-photo/route.ts
app/api/hotel-photos/route.ts
app/api/hotel-suggestions/route.ts
app/api/place-photo/route.ts
app/api/trips/route.ts
app/api/weather/route.ts
```

---

## Active Pages

```
app/about/page.tsx
app/auth/forgot-password/page.tsx
app/auth/login/page.tsx
app/auth/page.tsx
app/auth/returning/page.tsx
app/auth/signup/page.tsx
app/blog/fiji-oct-2024/page.tsx
app/blog/page.tsx
app/blog/rio-de-janeiro-5-days/page.tsx
app/deals/page.tsx
app/my-trips/page.tsx
app/page.tsx
app/plan/page.tsx
app/privacy-policy/page.tsx
app/quiz/page.tsx
app/start/page.tsx
app/terms/page.tsx
app/trip-ideas/page.tsx
```

---

## Recent Changes (Last 10 Commits)

```
a29d521 (HEAD -> main, origin/main, origin/HEAD) fix: remove all em dashes from Rio post, fix badge and caption
c230283 fix: Rio blog tweaks - portrait images, Funk party copy, card badge
e4aa19c feat: Rio de Janeiro 5-day blog post with comments API
cf9fd66 (origin/feat/save-button-right, feat/save-button-right) feat: move Save trip button to far right of card header
c35074e docs: document unsaved changes guard system in CLAUDE.md
eb61007 fix: suppress Chrome native dialog after user confirms Luna unsaved changes modal
d713a8b fix: unsaved guard v3 - click capture phase replaces pushState patching
2dbc652 fix: unsaved changes guard - markDirty, popstate, same-page filter, generatePlan dirty
837ad85 feat: unsaved changes guard on /plan page with branded modal
0cdad3b feat: add blog CTA after final paragraph on About page
```

---

## Database Schema (Supabase Tables)

Current tables in production:
- `profiles` (user profile data)
- `saved_trips` (columns: destination, is_favorite, start_date, end_date, trip_data JSONB, title)
- `travel_personas` (user travel preferences)
- `trip_history` (past trip records)
- `user_preferences` (user settings)

---

## Immutable Conventions (READ CONVENTIONS.md)

These NEVER change:
- Middleware file: `proxy.ts` (NOT middleware.ts - Next.js 16 requirement)
- Brand colors: #FF8210 (orange), #00447B (navy), #FFBD59 (orange-light), #679AC1 (navy-mid)
- Fonts: Poppins (headings), Inter Regular (body)
- Logo: `LUNA-LOGO.svg`, Character: `luna_BLUE.png`
- NO EMOJIS in UI - use Lucide React SVGs only
- Auth: `@supabase/ssr` (NOT @supabase/auth-helpers-nextjs)
- localStorage key: `luna_redirect_after_login`

---

## Critical Patterns

### Luna AI Integration
- All AI features receive full itinerary as `tripContext`
- Luna edits via structured `%%TRIP_UPDATE%%` JSON payloads
- Hotel check-in defaults to Day 1 unless specified

### Photo Pipeline
- Tier 1: Unsplash (randomize via `page` param 1-5 + shuffle 5 results, pick 3)
- Tier 2: Pexels (use `p.src.landscape` NOT `p.src.large2x`)
- Google Places: REMOVED from pipeline
- Cache-Control: no-store on all photo API responses

### Favicon
- `app/favicon.ico` is the Luna logo (handled by Next.js with content hash)
- `public/luna-favicon.ico` is the static copy served via metadata icons field
- Metadata `icons` field in `app/layout.tsx` points to `/luna-favicon.ico`
- `/favicon.ico` CDN cache may show old Vercel icon (harmless, expires naturally)

### Affiliate Links
- Booking.com hotels: `https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding`
- Booking.com flights: same base + `&ued=https%3A%2F%2Fwww.booking.com%2Fflights%2Findex.en-us.html`
- Booking.com cars: same base + `&ued=https%3A%2F%2Fwww.booking.com%2Fcars%2Findex.en-us.html`
- GoWithGuide tours: `https://tidd.ly/4s8kRkI`
- Xcaret experiences: `https://tidd.ly/4sH1xfw`
- Klook activities: `https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F`
- Europcar AU/NZ: `https://www.awin1.com/cread.php?s=4703163&v=10777&q=567194&r=2825924`
- All exported from `lib/affiliate.ts` as `BOOKING_AFFILIATE` and `ACTIVITY_AFFILIATE`

---

## Pre-Session Discovery Checklist

Before coding in Claude Code, ALWAYS:

1. **Fetch latest deployment state:**
   ```
   Vercel:list_deployments with project_id prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG
   Get latest deployment ID -> Vercel:get_deployment_build_logs
   ```

2. **Verify file locations:**
   ```bash
   find app -name "page.tsx" | grep [route-name]
   find app/api -name "route.ts" | grep [api-name]
   ```

3. **Check recent commits:**
   ```bash
   git log -10 --oneline
   ```

4. **Read core files:**
   - `/CONVENTIONS.md` (immutable rules)
   - `/app/layout.tsx` (app structure)
   - `/lib/supabase/` (auth patterns)

**NEVER assume file locations. ALWAYS verify first.**

---

## Post-Work Checklist

After Claude Code finishes changes:

- [ ] Review all changes: `git diff`
- [ ] Test locally if needed
- [ ] Update this context: `./scripts/update-context.sh`
- [ ] Review context changes: `git diff CLAUDE.md`
- [ ] Commit everything: `git add -A && git commit -m "feat: [description] + context update"`
- [ ] **ONLY THEN push:** `git push origin main` (triggers Vercel deploy)

**NEVER let Claude Code push automatically.**

---

## Known Active Issues

**Recently Fixed:**
- Luna sync bug (fixed via %%TRIP_UPDATE%% JSON payloads)
- Photo pipeline (Unsplash -> Pexels, removed Google Places, added randomization)
- Auth static rendering (fixed /auth/returning with dynamic rendering)
- Luna character image (updated to luna_BLUE.png with preload)
- Affiliate links updated to new AWIN cread.php URLs
- Deals page rebuilt with partner cards (Booking.com, Klook, GoWithGuide, Xcaret, Europcar)
- Favicon: browser tab now shows Luna logo via /luna-favicon.ico

**Current Work:**
- Brevo email integration (list ID 17, /api/brevo-sync/route.ts)
- Blog page (coming soon placeholder)
- PDF export (jsPDF + html2canvas, branded itinerary)

---

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (auth + PostgreSQL)
- **AI:** Anthropic Claude API
- **Deployment:** Vercel (GitHub integration, auto-deploy on push to main)
- **Analytics:** Google Analytics (G-YZV7GHDQ0T)

---

**For detailed conventions, see CONVENTIONS.md**
**For session setup, see SETUP-PROMPT.md**

---

## Unsaved Changes Guard Architecture

Implemented in `app/plan/page.tsx`. Intercepts all navigation away from an
unsaved trip and shows a branded Luna modal instead of the native browser dialog.

### State

```ts
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

`hasUnsavedChanges` is set to `true` via `markDirty()` on any trip
modification. It resets to `false` after a successful save.

### Triggers that call markDirty()

- Accepting or rejecting a day
- Accepting or rejecting an activity
- Any Luna chat trip update (%%TRIP_UPDATE%% parsed successfully)
- Adding or removing hotels via the Stays tab
- Generating a new plan (generatePlan resets dirty then marks dirty once
  generation completes)

### Navigation interception

Uses a **click capture phase listener** on `document` (not pushState patching,
which caused regressions with Next.js router). When a click reaches the capture
phase and `hasUnsavedChanges` is true, the guard:

1. Checks if the click target resolves to an `<a>` tag pointing to a different
   path than the current one.
2. If yes: calls `e.preventDefault()` and `e.stopPropagation()`, stores the
   intended `href` in `pendingNavHref` state, and shows the modal.
3. If no (same-page links, buttons, non-navigation clicks): lets the event
   through normally.

Also handles `beforeunload` for browser tab close / refresh. The native dialog
is suppressed after the user confirms leave in the Luna modal by removing the
`beforeunload` listener before calling `router.push(pendingNavHref)`.

### Modal

Branded modal (not native browser dialog). Orange "Leave anyway" button,
navy "Stay and save" button. Renders conditionally when `showUnsavedModal`
state is true. Clicking "Stay and save" closes the modal and focuses the
Save Trip button. Clicking "Leave anyway" removes the `beforeunload` listener
then navigates to `pendingNavHref`.

### Key constraint

Do NOT patch `window.history.pushState` or `window.history.replaceState`.
Next.js 16 App Router intercepts these and the patching causes double-navigation
and race conditions. The click capture phase approach is the correct solution.

---

## Persona System

The quiz at `/quiz` calculates one of 12 travel personas based on the user's
multi-select answers across 7 steps (5 card questions + budget slider +
duration slider).

### 12 Personas

| Persona | Profile |
|---|---|
| The Culture Seeker | History, museums, local food, slow travel |
| The Adventure Junkie | Outdoor extremes, hiking, water sports |
| The Luxury Traveller | High-end stays, fine dining, exclusive experiences |
| The Budget Explorer | Hostels, street food, local transport, value-focused |
| The Beach Bum | Sand, sea, sunsets, water activities |
| The City Slicker | Urban exploration, nightlife, food scenes, architecture |
| The Eco Wanderer | Sustainable travel, nature reserves, low-impact stays |
| The Family Voyager | Kid-friendly, safe, structured, educational |
| The Solo Nomad | Independent, flexible, authentic, off-the-beaten-path |
| The Romantic Escapist | Couples travel, intimate settings, special occasions |
| The Foodie Pilgrim | Culinary-led travel, local markets, cooking classes |
| The Festival Fanatic | Events, music, cultural celebrations, nightlife |

### Scoring

All multi-select answers across steps 1-5 are collected into a flat array.
Each answer maps to one or more persona tags. The persona with the highest
tag count wins. Budget and duration sliders do not affect persona scoring;
they are passed as separate context to Luna.

### Persistence

On quiz completion, the calculated persona is saved to `user_preferences`
table (column: `travel_persona`) for the authenticated user. For guests,
it is stored in `localStorage` as `luna_travel_persona`.

### Luna integration

The Luna system prompt in `app/api/chat/route.ts` reads the persona from
the trip context (passed by the frontend) and uses it to colour responses.
A "Culture Seeker" gets museum and food-first suggestions; an "Adventure
Junkie" gets outdoor and active recommendations instead of sightseeing.

### DestinationCard component

`components/quiz/DestinationCard.tsx` fetches live photos via
`/api/destination-photos` (Unsplash Tier 1, Pexels fallback) and renders
clickable destination suggestions at the results screen. Each card links to
`/plan?luna_prompt=...` with a pre-filled prompt matching the persona style.

### Results screen

Shows: persona name, one-line description, travel profile tags, trip style
summary, 3 DestinationCard suggestions, "Ask Luna" prompt pills, and a
Deals CTA block linking to `/deals`.

---

## Multilingual Implementation (EN / PT-BR / ES) — STATUS: COMPLETE

All user-facing pages are fully translated. The permanent reference document
is `MULTILANG-REFERENCE.md` in the repo root. Read it before building anything
new. This section summarises the critical rules.

### Locales and URL structure

- EN: no prefix — `lunaletsgo.com/blog`
- PT-BR: `/pt-BR/` prefix — `lunaletsgo.com/pt-BR/blog`
- ES: `/es/` prefix — `lunaletsgo.com/es/blog`

Configured in `i18n/routing.ts` with `localePrefix: 'as-needed'`.

### Files

- `messages/en.json` — English (source of truth)
- `messages/pt-BR.json` — Brazilian Portuguese
- `messages/es.json` — Spanish
- `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts` — next-intl config
- `proxy.ts` — middleware (NEVER rename to middleware.ts)

### Non-negotiable rules for every future change

**1. All 3 JSON files in every commit that adds UI text**
Never add a string to en.json without adding the same key to pt-BR.json and es.json
in the same commit. No exceptions, no "add translations later" workflow.

**2. Every new page: translate from day one**
Add the namespace to all 3 JSON files at the same time the page is built.
Use `getTranslations('namespace')` in Server Components and `useTranslations('namespace')`
in Client Components.

**3. Auth links use plain `<a>`, never locale-aware `Link`**
`app/auth/` is outside `app/[locale]/`. Auth links must be `<a href="/auth/login">`.
The locale-aware `Link` from `@/i18n/navigation` would prefix `/pt-BR/auth/login` — 404.

**4. proxy.ts: guard `/auth/*` before intlMiddleware**
The current implementation already has this guard. Never remove it:
```ts
if (pathname.startsWith('/auth')) return await updateSession(request)
// intlMiddleware runs AFTER this guard
```

**5. AI API routes must receive locale**
Every route that calls Claude must:
- Accept `locale` in the request body
- Append a language instruction at the END of the system prompt (after all other content)
- The shared helper `getLanguageInstruction(locale)` in `lib/ai.ts` does this

Client-side fetch calls to AI routes must always include `locale: useLocale()`.

**6. Language instruction position: END of system prompt**
If a language instruction is placed at the beginning, Claude ignores it — the long
trip context buries it. It must be the very last thing in the system prompt,
after `%%TRIP_UPDATE%%` rules in the chat route.

**7. Self-contained pages must import NavBar explicitly**
Pages that render their own footer inline (currently: privacy-policy, terms)
are not wrapped by the locale layout's NavBar. They must `import NavBar` and
render `<NavBar />` + `paddingTop: 68` on the main wrapper.

**8. Module-level data arrays: use Pattern A**
Constants defined outside component functions cannot use `useTranslations`.
Add a `key` field to each item and translate at the render point using
`` t(`namespace.${item.key}.field`) ``. See MULTILANG-REFERENCE.md section 4f.

**9. Date formatting: use toDateLocale() helper**
Never hardcode `"en-US"` or `"en-GB"` in interactive UI date calls. Use the
`toDateLocale(locale)` helper in plan/page.tsx. Replicate this pattern for any
new date display. Exception: print/PDF templates stay hardcoded in English.

**10. English-only content: add a notice for PT-BR and ES**
Blog posts and legal pages stay in English permanently. Any time content
intentionally stays in EN, add a locale-aware info banner for PT-BR/ES visitors.
Pattern documented in MULTILANG-REFERENCE.md section 4l.

### Namespaces (what lives where)

```
nav, footer, language     — NavBar, Footer, language switcher
hero, howItWorks, features, yourway, meetLuna, tripIdeas, quiz, faq, finalCta — Home page
start                     — /start form
quizPage                  — /quiz (includes personaContent)
tripIdeasPage             — /trip-ideas
deals                     — /deals
about                     — /about
blogIndex                 — /blog (includes engOnlyNotice)
myTrips                   — /my-trips
plan                      — /plan (large: tabs, activity, notes, chat, partners, etc.)
legal                     — /privacy-policy, /terms
```

New namespaces follow the page route. Sub-objects for nested data.

### What is and isn't translated

TRANSLATED (i18n): All static UI text — labels, buttons, headings, placeholders,
tooltips, modals, badges, error messages, date labels.

NOT TRANSLATED (AI-generated): Day titles, activity descriptions, weather content,
transport content, tips content, Luna chat responses. These are generated by Claude
with a language instruction — do not create i18n keys for them.

NOT TRANSLATED (editorial): Blog post titles, excerpts, article bodies. Legal page
body text. Partner brand names. Destination proper nouns.

### Translation status

| Page | Status |
|------|--------|
| NavBar + Footer | DONE |
| `/` Home | DONE |
| `/start` | DONE |
| `/quiz` | DONE |
| `/trip-ideas` | DONE |
| `/deals` | DONE |
| `/about` | DONE |
| `/blog` | DONE (UI chrome + EN-only notice) |
| `/my-trips` | DONE |
| `/plan` | DONE (full page, all sub-components) |
| `/privacy-policy` | DONE (NavBar + EN-only banner + date labels) |
| `/terms` | DONE (NavBar + EN-only banner + date labels) |

### PT-BR grammar quick-check (run before every commit)

```bash
node -e "const f=require('./messages/pt-BR.json'); console.log(f.namespace.key)"
```
Output must show accented characters. If plain ASCII: UTF-8 encoding issue. Fix first.

Key rules: "é" not bare "e" for verb ser. "à" before feminine nouns. All mandatory
accents: você, não, é, está, orçamento, opções, etc. No em dashes anywhere.

### Full reference

See `MULTILANG-REFERENCE.md` for: complete namespace inventory, all bug fixes,
date formatting rules, self-contained page pattern, EN-only notice pattern,
ES grammar rules, module-level array patterns, and Claude Code quick reference.
