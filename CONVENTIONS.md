# Luna Let's Go - Immutable Conventions

**These rules NEVER change, regardless of updates or new features.**

---

## File Naming & Structure

### Critical Files
- **Middleware:** `proxy.ts` (NOT `middleware.ts` - Next.js 16 requirement)
- **API Routes:** `/app/api/[name]/route.ts`
- **Page Routes:** `/app/[name]/page.tsx`
- **Environment:** `.env.local` (never commit)

### Directory Structure
```
app/
  api/           (all API endpoints)
  [routes]/      (page routes)
  layout.tsx     (root layout)
lib/
  supabase/      (auth utilities)
  anthropic/     (AI utilities)
public/
  LUNA-LOGO.svg  (primary logo)
  luna_BLUE.png  (character image for Meet Luna section)
```

---

## Brand Identity (NEVER Deviate)

### Colors (Exact Hex Values)
- **Orange:** `#FF8210` (primary brand color)
- **Navy:** `#00447B` (secondary brand color)
- **Orange Light:** `#FFBD59` (accent)
- **Navy Mid:** `#679AC1` (accent)
- **Gray Dark:** `#6C6D6F` (text)
- **Gray Light:** `#C0C0C0` (borders)

### Typography
- **Headings/Titles:** Poppins
- **Body Text:** Inter Regular

### Icons & Images
- **Icons:** Flat Lucide React SVGs using ONLY `#FF8210` and `#00447B`
- **NO EMOJIS** anywhere in user-facing UI (looks "too AI built")
- **Logo files:** `LUNA-LOGO.svg` (primary), `luna_BLUE.png` (Meet Luna section)

### Brand Name
- **Public:** "Luna Let's Go" (ONLY this form)
- **Internal design system:** "GOTO" (NEVER in user-facing UI)

---

## Database Schema (Supabase)

### Tables (Production)
```
profiles
  - id (uuid, FK to auth.users)
  - email (text)
  - created_at (timestamp)
  
saved_trips
  - id (uuid)
  - user_id (uuid, FK to profiles.id)
  - destination (text)
  - title (text)
  - is_favorite (boolean)
  - start_date (date)
  - end_date (date)
  - trip_data (jsonb) -- Full itinerary structure
  - created_at (timestamp)
  - updated_at (timestamp)
  
travel_personas
  - id (uuid)
  - user_id (uuid)
  - persona_data (jsonb)
  - created_at (timestamp)
  
trip_history
  - id (uuid)
  - user_id (uuid)
  - trip_details (jsonb)
  - created_at (timestamp)
  
user_preferences
  - id (uuid)
  - user_id (uuid)
  - preferences (jsonb)
  - created_at (timestamp)
```

### JSONB Structure for `saved_trips.trip_data`
Full itinerary with:
- destination
- dates (startDate, endDate)
- days array (activities, hotels, notes per day)
- budget breakdown
- photos (frozen at save time)

---

## Authentication Pattern

### Libraries
- **USE:** `@supabase/ssr` (current, supported)
- **NEVER USE:** `@supabase/auth-helpers-nextjs` (deprecated)

### Key Patterns
```typescript
// Client-side auth check
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

// Server component auth
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### OAuth Redirect Handling
- **localStorage key:** `luna_redirect_after_login`
- **Flow:** Save destination → OAuth → callback reads localStorage → redirect → clear localStorage
- **Why:** Supabase strips query params for security; localStorage persists across OAuth

### Auth Routes
- **Callback:** `/auth/callback/route.ts` (handles OAuth return)
- **Returning user:** `/auth/returning` (must be dynamic, NOT static)

---

## Luna AI Integration

### Character Rules
- **Name:** Luna (AI travel assistant character)
- **Tone:** Warm, casual, opinionated, persona-aware
- **Capabilities:** Direct itinerary editing, hotel suggestions, trip-specific answers
- **NEVER say:** "I am not able to directly edit your plan" (explicitly prohibited)

### Trip Context Pattern
**ALL AI-powered features MUST receive full itinerary as `tripContext`:**
- `/api/chat` (Luna conversation)
- `/api/hotel-suggestions`
- `/api/budget-estimate`
- `/api/extra-ideas`
- `/api/day-suggestions`

This ensures:
- Hotels suggested near activity areas
- Budget only includes accepted items
- No duplicate suggestions
- Luna can reference specific trip details

### Update Protocol
Luna edits itineraries via structured JSON payloads:
```
%%TRIP_UPDATE%%
{
  "action": "add_hotel" | "update_activity" | "etc",
  "day": 1,
  "data": { ... }
}
%%TRIP_UPDATE_END%%
```

Frontend parses these markers and updates shared planner state.

### Hotel Check-in Default
Unless user specifies otherwise, hotel check-in defaults to Day 1 of the trip/city segment.

---

## Photo Pipeline

### Tier System
1. **Tier 1:** Unsplash (primary source)
2. **Tier 2:** Pexels (fallback only)
3. **Google Places:** REMOVED entirely from pipeline

### Unsplash Configuration
- **Determinism:** Identical queries always return same results
- **Randomization:** Vary `page` parameter (1-5) + shuffle results
- **Resolution:** Use standard API response

### Pexels Configuration
- **Resolution field:** `p.src.landscape` (NOT `p.src.large2x`)
- **Use only when:** Unsplash fails or returns insufficient results

### Saved Trip Photos
- **Behavior:** Photos stored in `saved_trips.trip_data` JSONB freeze at save time
- **Loading saved trips:** Must re-fetch photos for freshness
- **Cache headers:** `Cache-Control: no-store` on photo API routes

### Hotel Photo Route
- **Location:** `/api/hotel-photos/route.ts`
- **NEVER:** Return hardcoded generic images
- **Always:** Return actual hotel photos from Unsplash/Pexels by hotel name

---

## Affiliate Partner Links

### Booking.com (AWIN)
```
Base URL: https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding

Hotels: [base URL as-is]

Flights: [base URL] + &ued=https%3A%2F%2Fwww.booking.com%2Fflights%2Findex.en-us.html

Cars: [base URL] + &ued=https%3A%2F%2Fwww.booking.com%2Fcars%2Findex.en-us.html
```

**Embed in:** Hotel suggestion cards, Luna chat (when mentioning hotels/flights/cars), any accommodation UI

### Tours & Experiences
```
GoWithGuide (guided tours):
https://tidd.ly/4s8kRkI

Xcaret (Mexico parks/experiences):
https://tidd.ly/4sH1xfw

Klook (activities/attractions):
https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F
```

**Embed in:** Luna chat (when suggesting tours/activities), Deals page, experience recommendation sections

---

## Email Marketing (Brevo)

### Configuration
- **List ID:** 17
- **Integration:** Native `fetch` (no SDK)
- **Server route:** `/api/brevo-sync/route.ts`
- **Helper:** `lib/brevo.ts` (fire-and-forget)
- **Env var:** `BREVO_API_KEY` (server-side only, NO `NEXT_PUBLIC_` prefix)

### Trigger Points
1. Email signup forms
2. New Google OAuth users (detected via `created_at` within 60 seconds of auth)

---

## Analytics

### Google Analytics
- **Measurement ID:** `G-YZV7GHDQ0T`
- **Stream ID:** `14283055688`
- **Implementation:** Next.js `<Script>` with `strategy="afterInteractive"` in `app/layout.tsx`

---

## Deployment & Version Control

### Workflow
1. Develop locally
2. Test changes
3. Update context: `./scripts/update-context.sh`
4. Review: `git diff`
5. Commit: `git add -A && git commit -m "..."`
6. **ONLY THEN:** `git push origin main`

### Deployment
- **Method:** Vercel GitHub integration (automatic on push to main)
- **NEVER:** Deploy directly from Claude Code
- **NEVER:** Use Vercel CLI for production deployments
- **ALWAYS:** Review before push

### Branch Strategy
- **Main branch:** `main` (production)
- **All changes:** Committed to main (small team, rapid iteration)
- **Tags:** Use for pre/post-update snapshots

---

## API Routes (Standard Patterns)

### Core AI Routes
- `/api/chat` (Luna conversation)
- `/api/generate` (initial itinerary generation)
- `/api/hotel-suggestions`
- `/api/budget-estimate`
- `/api/extra-ideas`
- `/api/day-suggestions`

### Data Routes
- `/api/destination-photos`
- `/api/hotel-photos`
- `/api/exchange-rates`
- `/api/place-photo`
- `/api/weather`

### Integration Routes
- `/api/brevo-sync` (email marketing)

### Auth Routes
- `/auth/callback` (OAuth return handler)

---

## Common Pitfalls (Lessons Learned)

### Static vs Dynamic Rendering
**Problem:** Pre-rendered static pages break auth (session drops post-OAuth)
**Solution:** All auth-adjacent routes MUST use dynamic rendering
**Example:** `/auth/returning` must NOT be static

### Photo Determinism
**Problem:** Unsplash always returns same photos for identical queries
**Solution:** Randomize via `page` parameter (1-5) + shuffle results

### Saved Trip Photo Freshness
**Problem:** Photos stored in JSONB are stale on load
**Solution:** Re-fetch photos when loading saved trips

### Supabase OAuth Param Stripping
**Problem:** Query params like `?next=/dashboard` stripped by Supabase security
**Solution:** Use localStorage to persist redirect destination through OAuth flow

### Footer Regressions
**Problem:** Fixes to other areas accidentally remove footer legal links
**Solution:** Always test full page render after changes, not just targeted area

---

## Version Information

**Next.js:** 16.1.6 (App Router)
**React:** (as per Next.js 16 requirements)
**TypeScript:** Latest stable
**Supabase JS:** Latest with SSR support
**Anthropic SDK:** Latest stable

---

**Last Updated:** 2025-01-XX (update manually when conventions change)
**Authority:** This document overrides all other instructions when conflicts arise
**Maintenance:** Review quarterly, update only for architectural changes
