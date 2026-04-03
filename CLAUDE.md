# CLAUDE.md — Luna Let's Go

Persistent context for Claude Code. Read this before every task.

## Project Overview

**Luna Let's Go** (lunaletsgo.com) is an AI-powered travel planning platform. Users input a destination, dates, group size, budget, and travel style — Luna (the AI assistant) generates a full personalised itinerary in ~30 seconds. The platform includes hotel suggestions, budget estimates, day-by-day plans, weather data, and a conversational chat with Luna to refine trips.

**Repo:** `FafaWJr/ai-travel-planner` (public)
**Production:** `www.lunaletsgo.com`
**Stack:** Next.js 16.1.6 (Turbopack), TypeScript, Supabase, Anthropic AI, Vercel

---

## Project Structure

```
ai-travel-planner/
├── app/
│   ├── page.tsx                    # Homepage (landing page, SSR)
│   ├── layout.tsx                  # Root layout with metadata, fonts, analytics
│   ├── start/page.tsx              # Trip planning form (destination, dates, group, style)
│   ├── plan/page.tsx               # Main planner view (itinerary, stays, budget, chat)
│   ├── my-trips/page.tsx           # Saved trips dashboard (requires auth)
│   ├── quiz/page.tsx               # Travel persona quiz
│   ├── trip-ideas/page.tsx         # Curated trip inspiration cards
│   ├── about/page.tsx              # About page
│   ├── blog/page.tsx               # Blog (coming soon placeholder)
│   ├── deals/page.tsx              # Deals (coming soon placeholder)
│   ├── privacy-policy/page.tsx     # Privacy policy
│   ├── terms/page.tsx              # Terms of service
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── callback/route.ts       # OAuth callback (Supabase PKCE flow)
│   │   ├── returning/page.tsx
│   │   └── forgot-password/page.tsx
│   └── api/
│       ├── generate/route.ts       # Main itinerary generation (Anthropic)
│       ├── chat/route.ts           # Luna conversational chat (Anthropic)
│       ├── hotel-suggestions/route.ts  # AI hotel suggestions
│       ├── hotel-photos/route.ts   # Hotel photo search (Unsplash → Pexels → fallback)
│       ├── destination-photos/route.ts # Trip header photos (Unsplash → Pexels → fallback)
│       ├── budget-estimate/route.ts    # AI budget breakdown
│       ├── extra-ideas/route.ts    # Additional activity suggestions
│       ├── day-suggestions/route.ts    # AI day-specific suggestions
│       ├── weather/route.ts        # Destination weather data
│       ├── exchange-rates/route.ts # Currency conversion
│       ├── place-photo/route.ts    # Google Places photo proxy
│       ├── google-place-photo/route.ts # Google Places photo resolver
│       ├── brevo-sync/route.ts     # Email list sync (Brevo)
│       └── trips/route.ts          # Trip CRUD operations
├── robots.txt/route.ts
├── sitemap.xml/route.ts
├── components/                     # Shared React components
│   ├── FloatingChat.tsx            # Luna chat widget
│   ├── StayTab.tsx                 # Hotel suggestions tab in planner
│   ├── BookingCTAs.tsx             # Booking.com affiliate CTAs
│   └── ...
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   ├── affiliate.ts                # Booking.com AWIN affiliate constants
│   └── ...
├── proxy.ts                        # Next.js 16 middleware (replaces middleware.ts)
├── next.config.ts                  # Next.js config (remotePatterns, etc.)
└── public/
    ├── luna_letsgo_bigger_3.PNG    # Logo
    ├── luna_BLUE.png               # Luna character (navy background)
    ├── LUNA-LOGO.svg               # SVG logo
    └── favicon.ico
```

### Build Output (latest deploy)

**Static pages (○):** `/`, `/about`, `/blog`, `/deals`, `/my-trips`, `/plan`, `/start`, `/quiz`, `/trip-ideas`, `/privacy-policy`, `/terms`, `/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/returning`, `/robots.txt`, `/sitemap.xml`

**Dynamic routes (ƒ):** All `/api/*` routes, `/auth`, `/auth/callback`

**Middleware:** `proxy.ts` (Supabase session refresh)

---

## Coding Standards

### TypeScript
- Strict mode enabled
- Use `interface` for component props, `type` for unions/utility types
- No `any` unless absolutely necessary (add a comment explaining why)
- All API routes must have proper error handling with try/catch

### Styling
- Inline styles preferred over Tailwind when Tailwind has caused misinterpretation in past sessions
- CSS custom properties defined in root: `--orange: #FF8210`, `--navy: #00447B`, `--orange-light: #FFBD59`, `--navy-mid: #679AC1`, `--gray-dark: #6C6D6F`, `--gray-light: #C0C0C0`
- Fonts: Poppins (headings/titles), Lato/Inter (body)
- Icons: Flat Lucide React SVGs using only `#FF8210` and `#00447B` — never emojis, never AI-style icons

### Brand Rules
- Public-facing name is always **"Luna Let's Go"** — internal design system name "GOTO" must never appear in user-facing UI
- Luna character image: `luna_BLUE.png` (navy `#00447B` background)
- Every hotel suggested by Luna must include a Booking.com affiliate link (AWIN link from `lib/affiliate.ts`)

### API Route Patterns
- Every AI-powered feature receives the full generated itinerary as `tripContext` on every API call — this is the foundational intelligence layer
- Photo routes use a tiered waterfall: Unsplash (Tier 1) → Pexels (Tier 2) → curated fallbacks → generic fallbacks. Do NOT use Google Places for photo search.
- Env vars: server-side only keys have no `NEXT_PUBLIC_` prefix (e.g., `BREVO_API_KEY`, `UNSPLASH_ACCESS_KEY`, `PEXELS_ACCESS_KEY`)

### Component Patterns
- Luna persona: warm, casual, opinionated travel agent. Can and does edit the itinerary. Never says she cannot edit the plan
- Welcome message in chat is display-only and excluded from API conversation history (saves tokens)
- Destination photos: append "travel tourism" to Unsplash queries; filter out metadata tagged "flag", "map", "military", "illustration"

---

## Environment Variables

### Server-side (no NEXT_PUBLIC_ prefix)
- `ANTHROPIC_API_KEY` — Claude API for itinerary generation + chat
- `GOOGLE_PLACES_API_KEY` — Google Places (place-photo proxy only, NOT for photo search)
- `UNSPLASH_ACCESS_KEY` — Unsplash photo search (Tier 1)
- `PEXELS_ACCESS_KEY` — Pexels photo fallback (Tier 2)
- `BREVO_API_KEY` — Email list sync
- `OPENWEATHERMAP_API_KEY` — Weather data

### Client-side (NEXT_PUBLIC_ prefix)
- `NEXT_PUBLIC_SUPABASE_URL` — `https://qhpxejzoxfruuositwzo.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — Supabase publishable key

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build (validates TypeScript)
npm run lint             # ESLint check

# Deployment — NEVER deploy from Claude Code directly
git add .
git commit -m "fix: description"
git push origin main     # Triggers Vercel GitHub integration automatically

# Cache management (if needed)
# Use Vercel dashboard or CLI: vercel cache purge
```

---

## Testing Instructions

### Before Committing
1. Run `npm run build` — must succeed with zero TypeScript errors
2. Verify no regressions in the checklist below
3. Test any modified API routes with curl

### API Route Testing
```bash
# Destination photos (should return Unsplash photos)
curl "https://www.lunaletsgo.com/api/destination-photos?destination=Tokyo%2C%20Japan"

# Hotel photos (should return unique photos per hotel, NOT a generic fallback)
curl "https://www.lunaletsgo.com/api/hotel-photos?name=Hilton&destination=Tokyo"

# Chat
curl -X POST "https://www.lunaletsgo.com/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello Luna"}],"tripContext":"..."}'
```

### Regression Checklist
After any change, verify these are intact:
- [ ] Homepage loads: hero carousel, all sections, footer with legal links
- [ ] `/start` form → `/plan` with generated itinerary
- [ ] Trip header photo grid: 3 photos (1 large left + 2 stacked right)
- [ ] Hotel cards: name, stars, neighborhood, description, amenities, price, "Choose This Stay", "Book on Booking.com" affiliate button
- [ ] "Ready to book your stay?" banner with Booking.com link
- [ ] Luna chat: opens, sends, receives, does not send welcome message to API
- [ ] Auth: Google OAuth login → redirect back to pre-login page
- [ ] Saved trips load from `/my-trips`
- [ ] Footer: Privacy Policy + Terms of Service links present
- [ ] No emojis in UI (Lucide icons only)
- [ ] Brand name: "Luna Let's Go" everywhere (never "GOTO")

---

## Dev Workflow Rules

### Prompt Delivery Model
All implementation is delivered as structured Claude Code prompts in `.md` files. Wilson commits and pushes manually. Never make direct code edits to the repo from Claude Code.

### Standing Constraints (apply to EVERY task)
- **Do not change colors, backgrounds, or layout** unless explicitly scoped
- **Do not touch `proxy.ts`** unless the task involves auth/middleware
- **Do not modify `next.config.ts` remotePatterns** unless adding a new image host
- **Preserve the response shape** of all API routes (`{ photos: string[] }`, etc.)
- **Do not add Google Places to photo search pipelines** — Unsplash is Tier 1, Pexels is Tier 2

### Regression Vigilance
Fixes frequently introduce regressions. Every prompt must explicitly list what must NOT change. Common regressions:
- Footer losing legal links
- Emojis reappearing in UI
- Booking.com affiliate links disappearing from hotel cards
- Luna welcome message being sent to API (wastes tokens)
- Auth redirect breaking after OAuth callback
- Hotel photos returning same generic fallback for every hotel

### Commit Messages
Use conventional commits:
```
fix: description of what was fixed
feat: description of new feature
```
Include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` in multi-line commits.

### Deployment Flow
1. Claude Code generates prompt as `.md` file
2. Wilson runs prompt in Claude Code on local repo
3. `git push origin main` triggers Vercel auto-deploy
4. Check Vercel dashboard for build status
5. If build fails — check build logs via `get_deployment_build_logs`

### Debugging Tools
- **Vercel runtime logs:** Filter by route path or full-text search. Log prefixes: `[destination-photos]`, `[hotel-photos]`, `[chat]`
- **Supabase auth logs:** `get_logs` with service `auth` — cross-reference with Vercel logs by timestamp
- **`x-matched-path` header:** Most reliable indicator of middleware interception
- **Live API testing:** `web_fetch_vercel_url` on production URLs to verify route output

---

## Database (Supabase)

**Project ID:** `qhpxejzoxfruuositwzo`

### Tables (public schema)
| Table | Purpose |
|-------|---------|
| `profiles` | Auto-created on signup (id, full_name, email, avatar_url) |
| `saved_trips` | User itineraries (destination, is_favorite, start_date, end_date, trip_data JSONB, title) |
| `user_preferences` | Travel preferences |
| `travel_personas` | Quiz results |
| `trip_history` | Historical trip data |

### Key Patterns
- `saved_trips.trip_data` is JSONB containing the full itinerary, hotel selections, photos, and all planner state
- Auth uses `@supabase/ssr` (NOT deprecated `@supabase/auth-helpers-nextjs`)
- OAuth callback uses PKCE flow with async `cookies()` in `/auth/callback/route.ts`
- Post-login redirect: `localStorage` key `luna_redirect_after_login`
- Supabase migrations execute immediately in production (no deployment needed)

---

## Integrations

| Service | Purpose | Key |
|---------|---------|-----|
| Anthropic | AI generation + Luna chat | `ANTHROPIC_API_KEY` |
| Supabase | Auth + database | `NEXT_PUBLIC_SUPABASE_URL` + publishable key |
| Unsplash | Photos Tier 1 | `UNSPLASH_ACCESS_KEY` |
| Pexels | Photos Tier 2 (fallback) | `PEXELS_ACCESS_KEY` |
| Google Places | Place-photo proxy only | `GOOGLE_PLACES_API_KEY` |
| Booking.com | Hotel affiliate (AWIN) | Hardcoded in `lib/affiliate.ts` |
| Brevo | Email sync (List ID 17) | `BREVO_API_KEY` |
| Google Analytics | Tracking | `G-YZV7GHDQ0T` |
| Vercel | Hosting + CI/CD | GitHub auto-deploy on push |

### Booking.com Affiliate Link
```
http://www.awin1.com/awclick.php?mid=18118&id=2825924
```
Every hotel name or "Book on Booking.com" CTA must use this link.

---

## Vercel / GitHub References

- **Vercel Project ID:** `prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG`
- **Vercel Team ID:** `team_uFD2kaJDUmZtpI2rSCIMy7kW`
- **GitHub Repo:** `FafaWJr/ai-travel-planner`
- **Production Domain:** `www.lunaletsgo.com`
- **Bundler:** Turbopack
