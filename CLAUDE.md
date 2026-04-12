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
