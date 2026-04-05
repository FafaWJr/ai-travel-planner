# Luna Let's Go - Claude Code Context
**Last Updated:** 2025-01-10 (Initial Setup)
**Current Branch:** main
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

## Current File Structure

**Note:** Run `./scripts/update-context.sh` to regenerate this section with live data.

Expected structure:
```
app/
  api/
    chat/route.ts
    generate/route.ts
    hotel-suggestions/route.ts
    budget-estimate/route.ts
    extra-ideas/route.ts
    day-suggestions/route.ts
    destination-photos/route.ts
    hotel-photos/route.ts
    exchange-rates/route.ts
    place-photo/route.ts
    weather/route.ts
    brevo-sync/route.ts
  auth/
    callback/route.ts
    returning/
  [various page routes]/
  layout.tsx
  page.tsx
lib/
  supabase/
  anthropic/
  brevo.ts
public/
  LUNA-LOGO.svg
  luna_BLUE.png
proxy.ts (middleware)
```

---

## Active API Routes

**Core AI Routes:**
- `/api/chat` - Luna conversation with trip context
- `/api/generate` - Initial itinerary generation
- `/api/hotel-suggestions` - Hotel recommendations with trip context
- `/api/budget-estimate` - Budget calculation with trip context
- `/api/extra-ideas` - Additional suggestions with trip context
- `/api/day-suggestions` - Day-specific recommendations with trip context

**Data Routes:**
- `/api/destination-photos` - Destination photos (Unsplash → Pexels)
- `/api/hotel-photos` - Hotel-specific photos (Unsplash → Pexels)
- `/api/exchange-rates` - Currency conversion
- `/api/place-photo` - Single place photo lookup
- `/api/weather` - Weather data

**Integration Routes:**
- `/api/brevo-sync` - Email marketing list sync

**Auth Routes:**
- `/auth/callback` - OAuth callback handler
- `/auth/returning` - Returning user landing (MUST be dynamic)

---

## Recent Changes (Last 10 Commits)

**Note:** Run `./scripts/update-context.sh` to regenerate this section.

Recent major changes:
- Luna planner sync via `%%TRIP_UPDATE%%` JSON payloads
- Photo pipeline fix (Unsplash Tier 1 → Pexels Tier 2, removed Google Places)
- Hotel photos route rewrite (no more hardcoded generic images)
- Auth fix using `@supabase/ssr` (deprecated auth-helpers removed)
- Luna character image update to `luna_BLUE.png`

---

## Database Schema (Supabase Tables)

Current tables in production:
- `profiles` - User profile data
- `saved_trips` - User's saved itineraries
  - Columns: `id`, `user_id`, `destination`, `title`, `is_favorite`, `start_date`, `end_date`, `trip_data` (JSONB), `created_at`, `updated_at`
  - `trip_data` contains full itinerary structure with frozen photos
- `travel_personas` - User travel preferences and styles
- `trip_history` - Past trip records
- `user_preferences` - User settings

---

## Immutable Conventions (READ CONVENTIONS.md)

These NEVER change:
- **Middleware file:** `proxy.ts` (NOT middleware.ts - Next.js 16 requirement)
- **Brand colors:** #FF8210 (orange), #00447B (navy), #FFBD59 (orange-light), #679AC1 (navy-mid)
- **Fonts:** Poppins (headings), Inter Regular (body)
- **Logo:** `LUNA-LOGO.svg`, Character: `luna_BLUE.png`
- **NO EMOJIS** in UI - use Lucide React SVGs only in brand colors
- **Auth:** `@supabase/ssr` (NOT @supabase/auth-helpers-nextjs)
- **localStorage key:** `luna_redirect_after_login`
- **Public brand name:** "Luna Let's Go" (internal "GOTO" NEVER in UI)

---

## Critical Patterns

### Luna AI Integration
- **ALL AI features receive full itinerary as `tripContext`**
- Luna edits via structured `%%TRIP_UPDATE%%` JSON payloads appended to responses
- Frontend parses these markers and updates shared planner state
- Hotel check-in defaults to Day 1 unless user specifies otherwise
- **NEVER say:** "I am not able to directly edit your plan"

### Photo Pipeline (Tier System)
- **Tier 1:** Unsplash (deterministic - randomize via `page` param 1-5 + shuffle)
- **Tier 2:** Pexels (use `p.src.landscape` NOT `p.src.large2x`)
- **Google Places:** REMOVED from pipeline entirely
- **Saved trips:** Photos stored in JSONB freeze at save time, re-fetch on load
- **Cache headers:** `Cache-Control: no-store` on photo API routes
- **Hotel photos:** `/api/hotel-photos/route.ts` returns actual hotel photos, NOT generic images

### Affiliate Links (Embed Throughout)
**Booking.com (AWIN):**
- Hotels: `https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding`
- Flights: [base] + `&ued=https%3A%2F%2Fwww.booking.com%2Fflights%2Findex.en-us.html`
- Cars: [base] + `&ued=https%3A%2F%2Fwww.booking.com%2Fcars%2Findex.en-us.html`

**Tours & Experiences:**
- GoWithGuide: `https://tidd.ly/4s8kRkI`
- Xcaret: `https://tidd.ly/4sH1xfw`
- Klook: `https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F`

Use in hotel suggestions, Luna chat, Deals page, and anywhere flights/car rentals/tours are mentioned.

---

## Pre-Session Discovery Checklist

Before coding in Claude Code, ALWAYS:

1. **Fetch latest deployment state:**
   ```
   Vercel:list_deployments with project_id prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG
   Get latest deployment ID → Vercel:get_deployment_build_logs
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
   - `/SETUP-PROMPT.md` (session setup guide)
   - `/app/layout.tsx` (app structure)
   - `/lib/supabase/` (auth patterns)

**NEVER assume file locations. ALWAYS verify first.**

---

## Post-Work Checklist

After Claude Code finishes changes:

- [ ] Review all changes: `git diff`
- [ ] Test locally if needed: `npm run dev`
- [ ] Update this context: `./scripts/update-context.sh`
- [ ] Review context changes: `git diff CLAUDE.md`
- [ ] Commit everything: `git add -A && git commit -m "feat: [description] + context update"`
- [ ] **ONLY THEN push:** `git push origin main` (triggers Vercel deploy)

**NEVER let Claude Code push automatically.**

---

## Known Active Issues & Current Work

**Recently Fixed:**
- ✅ Luna sync bug (fixed via `%%TRIP_UPDATE%%` JSON payloads)
- ✅ Photo pipeline (Unsplash → Pexels, removed Google Places)
- ✅ Auth static rendering (fixed /auth/returning with dynamic rendering)
- ✅ Luna character image (updated to luna_BLUE.png with preload in <head>)
- ✅ Hotel photos route (rewrote to return actual hotel photos, not generic)

**Current Work (In Progress):**
- Brevo email integration (list ID 17, /api/brevo-sync/route.ts, lib/brevo.ts)
  - Server-side only: `BREVO_API_KEY` (no NEXT_PUBLIC_ prefix)
  - Triggers: email signup + new Google OAuth users (created_at within 60 seconds)
- Blog page (currently "Coming Soon" placeholder)
- Deals page (needs real Unsplash photos, feature GoWithGuide/Xcaret/Klook)
- `/trip-ideas` page (30+ destinations with category filters - scoped but not confirmed)
- PDF export (branded itinerary using jsPDF + html2canvas)
  - Must include Luna Let's Go logo
  - "Crafted by Luna Let's Go" attribution
  - Brand colors: #FF8210, #00447B
  - Typography: Poppins/Inter
  - Footer with website URL on every page

**Known Regression Patterns:**
- Footer legal links sometimes removed during fixes (always test full page)
- Static pages break auth (all auth routes must be dynamic)
- Photo determinism requires randomization (page param + shuffle)

---

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (auth + PostgreSQL)
- **AI:** Anthropic Claude API
- **Deployment:** Vercel (GitHub integration - automatic on push to main)
- **Analytics:** Google Analytics (G-YZV7GHDQ0T, Stream ID 14283055688)

---

## Discovery Tools (Vercel MCP)

### Most Useful for Diagnosis:
1. **`Vercel:web_fetch_vercel_url`** on live site
   - Best for diagnosing API behavior and rendered HTML
   - Call endpoint twice to reveal caching vs determinism

2. **`Vercel:get_deployment_build_logs`**
   - After `Vercel:list_deployments` to get latest ID
   - Most reliable for full route structure

3. **`Vercel:get_runtime_logs`**
   - Useful but messages frequently truncate
   - Use broad query terms

### Supabase MCP:
- **`Supabase:get_logs`** with `service=api` or `service=auth`
  - REST calls and OAuth event data
- **`Supabase:apply_migration`**
  - Executes immediately in production (no deployment needed)

---

## Key Learnings & Principles

### Full Context on Every AI Call
Every AI-powered feature (hotel suggestions, budget estimator, extra ideas, day suggestions, Luna chat) MUST receive the full generated itinerary as `tripContext`. This is the core intelligence layer:
- Hotels suggested near activity areas
- Budget only includes accepted items
- No duplicate suggestions
- Luna can reference the specific trip

### Photo Determinism & Freshness
- Unsplash search is deterministic - identical queries always return same results
- Randomization requires varying `page` parameter (1-5) and shuffling results
- Saved trip photos stored in `saved_trips.trip_data` JSONB freeze when saved
- Re-fetching on load required for freshness

### Auth & OAuth
- Static pages break auth - `/auth/returning` was pre-rendered static, causing session drops post-OAuth
- Dynamic rendering required for all auth-adjacent routes
- Supabase OAuth strips query params - use localStorage to persist redirect destination
- localStorage key: `luna_redirect_after_login`

### UI Philosophy
- Emoji-free UI - emojis look "too AI built"
- Replace all with flat Lucide React SVGs in brand colors (#FF8210, #00447B)

### Workflow Pattern
Wilson identifies issues (often via live screenshots) → Claude diagnoses using Vercel/Supabase tools → Claude generates structured implementation prompt as `.md` file → Wilson runs through Claude Code against local repo → Review → `git push origin main` triggers Vercel's GitHub integration

**Never deploy directly from Claude Code or Vercel CLI.**

---

**For detailed conventions, see CONVENTIONS.md**
**For session setup, see SETUP-PROMPT.md**
**For context regeneration, run: ./scripts/update-context.sh**
