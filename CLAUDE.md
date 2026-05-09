# Luna Let's Go — Claude Code Context

**Deployment:** https://www.lunaletsgo.com
**Repo:** `FafaWJr/ai-travel-planner` (branch: `main`)

> **Project status, active stages, and recent detours → `CURRENT_STATUS.md`** (source of truth; wins over any session memory).

---

## Critical IDs

| Service | ID |
|---|---|
| Vercel Project | `prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG` |
| Vercel Team | `team_uFD2kaJDUmZtpI2rSCIMy7kW` |
| Supabase Project | `qhpxejzoxfruuositwzo` |
| Google Analytics | `G-YZV7GHDQ0T` |

---

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **Language:** TypeScript
- **Database:** Supabase (auth + PostgreSQL)
- **AI:** Anthropic Claude API
- **Deployment:** Vercel (auto-deploy on push to `main`)
- **Middleware file:** `proxy.ts` (NOT `middleware.ts` — Next.js 16 requirement)

---

## Immutable Conventions

> Full rules: `CONVENTIONS.md`. These are the prohibitions most likely to cause silent bugs:

- **NO EMOJIS in UI** — Lucide React SVGs only
- **Auth:** `@supabase/ssr` (NEVER `@supabase/auth-helpers-nextjs`)
- **Auth paths are NOT locale-prefixed** — use `/auth/login`, never `/${locale}/auth/login`
- **Plan page URL param is `tripId`**, not `savedTripId` (state var is a legacy name)
- **localStorage key:** `luna_redirect_after_login`
- **Brand colors:** #FF8210 (orange), #00447B (navy), #FFBD59 (orange-light), #679AC1 (navy-mid)
- **Fonts:** Poppins (headings), Inter Regular (body)
- **Logo:** `LUNA-LOGO.svg` | Character: `luna_BLUE.png`

---

## AI Models — CRITICAL

- **Primary:** `claude-sonnet-4-5-20250929`
- **Fallback:** `claude-haiku-4-5-20251001`
- **DO NOT upgrade to Sonnet 4.6** — anthropic-sdk-typescript#956 (parallel tool-use emits incomplete blocks) is unresolved. Model IDs centralized in `lib/ai.ts`; never hard-code inline.

### Two-path architecture (never straddle both)

| Path | Entry points | Edit format |
|---|---|---|
| Generate | `/api/generate`, `/api/expand-phase`, `/api/regenerate-day` | Anthropic tools API (`define_phase`, `define_day`) |
| Chat | `/api/chat` (Luna) | SSE stream + `%%TRIP_UPDATE%%` markers parsed client-side |

> Detailed AI integration patterns → `docs/claude/ai-patterns.md`

---

## Critical Rules (most likely to cause prod incidents)

- **`%%TRIP_UPDATE%%` rules MUST be at the END of the system prompt** (`app/api/chat/route.ts`)
- **`getLanguageInstruction(locale)` appended at END** of all AI route system prompts
- **`## Trip Phases` block at FRONT** of FloatingChat context (truncation is from the end)
- **`remove_activity` is index-based** (`activityIndex`, 0-based within slot) — NOT text-based
- **Every Day object MUST have a stable `id`** — `setDays` wrapper enforces this; never construct a Day without one
- **Patch payloads carry entity ids** — receivers MUST use patch-carried id, never generate their own
- **`useImperativeHandle` handle methods MUST read state via `*Ref.current`** — never closure-captured state
- **Pre-compute values from `daysRef.current` before `setDays`** — React 18 runs updaters async
- **`emitPatch` does NOT auto-apply on the sender** — always apply locally first, then emit
- **New edit affordances must check `!readOnly`** (viewer role)
- **`PLAN_SANITIZE_CONFIG` must always be passed** to `sanitizeHtml()` — never call without config
- **Cross-table RLS MUST use SECURITY DEFINER helpers** — direct subqueries cause `42P17` infinite recursion

> Collab patch conventions → `docs/claude/collab-patterns.md`
> DB schema + RLS details → `docs/claude/database.md`

---

## Photo Pipeline

- Tier 1: Unsplash (randomize `page` 1-5, shuffle 5 results, pick 3)
- Tier 2: Pexels (`p.src.landscape` NOT `p.src.large2x`)
- Google Places: REMOVED from activity/destination pipeline
- My Trips cards: Google Places via `/api/destination-header/[slug]` (7-day TTL), gated by `NEXT_PUBLIC_PLACE_PREVIEW_ENABLED`
- Cache-Control: `no-store` on all photo API responses

---

## Feature Flags

| Flag | Default | Scope |
|---|---|---|
| `NEXT_PUBLIC_COLLAB_ENABLED` | `false` | Master collab toggle |
| `NEXT_PUBLIC_COLLAB_REALTIME_ENABLED` | `true` | Realtime sync |
| `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED` | `true` | Cross-awareness in Luna |
| `NEXT_PUBLIC_AI_FALLBACK_ENABLED` | `true` | Haiku fallback on Sonnet error |
| `NEXT_PUBLIC_LUNA_TOOLS_ENABLED` | `true` | Tool-use in generate path |
| `NEXT_PUBLIC_STRUCTURED_ITINERARY_ENABLED` | `true` | Structured itinerary generation |
| `NEXT_PUBLIC_PLACE_PREVIEW_ENABLED` | `false` | Place preview + landmark photos |

---

## i18n

All user-facing strings in `messages/{en,pt-BR,es}.json`. Never add a string to one locale without adding to all three in the same commit. Canonical rules: `docs/i18n/multilang-reference.md`.

---

## Affiliate Links (`lib/affiliate.ts`)

- Booking.com hotels: `https://www.awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding`
- GoWithGuide: `https://tidd.ly/4s8kRkI` | Xcaret: `https://tidd.ly/4sH1xfw`
- Klook: `https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F`
- Europcar AU/NZ: `https://www.awin1.com/cread.php?s=4703163&v=10777&q=567194&r=2825924`

---

## Agents & Subagents (`.claude/agents/`)

**Governance:** `luna-qa-agent`, `luna-context-updater`, `luna-multilang-qa`, `luna-multilang-translator`, `luna-release-writer`, `luna-code-reviewer`, `luna-status-updater`

**Specialist:** `luna-agent-backend`, `luna-agent-frontend`, `luna-agent-ai`, `luna-agent-media`, `luna-agent-database`, `luna-agent-auth`, `luna-agent-devops`, `luna-agent-seo`, `luna-agent-analytics`, `luna-agent-architect`

Orchestration protocol: `docs/architecture/multi-agent-orchestration.md`

---

## Reference Docs

Read before modifying the respective area:

| File | Read before... |
|---|---|
| `CONVENTIONS.md` | Any UI or code change |
| `CURRENT_STATUS.md` | Every session — source of truth |
| `TECH_DEBT.md` | Starting any major feature |
| `docs/claude/ai-patterns.md` | Adding any Luna/AI capability |
| `docs/claude/collab-patterns.md` | Touching collab sync or patch pipeline |
| `docs/claude/database.md` | Schema, RLS, or Supabase queries |
| `docs/claude/build.md` | Build, deploy, or plan rendering |
| `docs/architecture/ai-paths.md` | Adding a new AI path or capability |
| `docs/architecture/phase-mode-matrix.md` | Any trip-length-mode behavior |
| `docs/architecture/post-r6-changelog.md` | Historical release context |
| `docs/architecture/multi-agent-orchestration.md` | Spawning subagents |
| `docs/specs/collab/00-master-plan.md` | Collab features |
| `docs/specs/collab/01-technical-spec.md` | Collab schema, RLS, API contracts |
| `docs/i18n/multilang-reference.md` | Any user-facing string |

---

## Pre-Session Checklist

1. Read `CURRENT_STATUS.md` first.
2. `git log -10 --oneline` — check recent commits.
3. Verify file locations before assuming: `find app -name "page.tsx" | grep [name]`
4. For deployment state: `list_deployments` with Vercel project ID above.

**NEVER assume file locations. ALWAYS verify first.**

---

## Post-Work Checklist

- [ ] `git diff` — review all changes
- [ ] `./scripts/update-context.sh` — regenerate if needed
- [ ] Commit: `git add -A && git commit -m "feat: ..."`
- [ ] **ONLY THEN push** — `git push origin main` triggers Vercel deploy

**NEVER let Claude Code push automatically.**

---

## Build Hygiene

- `npm run smoke:render` must pass before every build (prebuild hook, 32 assertions on plan rendering)
- On `next-intl` errors: `rm -rf node_modules .next && npm ci`
- Full details: `docs/claude/build.md`

---

*Auto-regenerated by `scripts/update-context.sh`. Edit the heredoc template in the script, not this file.*
