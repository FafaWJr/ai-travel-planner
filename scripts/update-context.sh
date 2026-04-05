#!/bin/bash

# Luna Let's Go - Context Update Script
# Updates CLAUDE.md with current project state
# Run this manually after approving changes, BEFORE git push

echo "📝 Regenerating CLAUDE.md with current project state..."

cat > CLAUDE.md << 'EOF'
# Luna Let's Go - Claude Code Context
**Last Updated:** $(date +"%Y-%m-%d %H:%M:%S")
**Current Branch:** $(git branch --show-current)
**Last Commit:** $(git log -1 --oneline)
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

\`\`\`
$(tree -I 'node_modules|.next|.git|.vercel|dist|build' -L 3 --dirsfirst)
\`\`\`

---

## Active API Routes

\`\`\`
$(find app/api -name "route.ts" 2>/dev/null | sort || echo "No API routes found in app/api")
\`\`\`

---

## Active Pages

\`\`\`
$(find app -name "page.tsx" 2>/dev/null | grep -v "node_modules" | sort || echo "No pages found")
\`\`\`

---

## Recent Changes (Last 10 Commits)

\`\`\`
$(git log -10 --oneline --decorate)
\`\`\`

---

## Database Schema (Supabase Tables)

Current tables in production:
- \`profiles\` (user profile data)
- \`saved_trips\` (columns: destination, is_favorite, start_date, end_date, trip_data JSONB, title)
- \`travel_personas\` (user travel preferences)
- \`trip_history\` (past trip records)
- \`user_preferences\` (user settings)

---

## Immutable Conventions (READ CONVENTIONS.md)

These NEVER change:
- Middleware file: \`proxy.ts\` (NOT middleware.ts - Next.js 16 requirement)
- Brand colors: #FF8210 (orange), #00447B (navy), #FFBD59 (orange-light), #679AC1 (navy-mid)
- Fonts: Poppins (headings), Inter Regular (body)
- Logo: \`LUNA-LOGO.svg\`, Character: \`luna_BLUE.png\`
- NO EMOJIS in UI - use Lucide React SVGs only
- Auth: \`@supabase/ssr\` (NOT @supabase/auth-helpers-nextjs)
- localStorage key: \`luna_redirect_after_login\`

---

## Critical Patterns

### Luna AI Integration
- All AI features receive full itinerary as \`tripContext\`
- Luna edits via structured \`%%TRIP_UPDATE%%\` JSON payloads
- Hotel check-in defaults to Day 1 unless specified

### Photo Pipeline
- Tier 1: Unsplash (deterministic, randomize via \`page\` param 1-5 + shuffle)
- Tier 2: Pexels (use \`p.src.landscape\` NOT \`p.src.large2x\`)
- Google Places: REMOVED from pipeline
- Saved trips: Photos freeze at save time, re-fetch on load

### Affiliate Links
- Booking.com hotels: \`awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding\`
- GoWithGuide tours: \`https://tidd.ly/4s8kRkI\`
- Xcaret experiences: \`https://tidd.ly/4sH1xfw\`
- Klook activities: \`https://affiliate.klook.com/redirect?aid=117089&aff_adid=1248864&k_site=https%3A%2F%2Fwww.klook.com%2F\`

---

## Pre-Session Discovery Checklist

Before coding in Claude Code, ALWAYS:

1. **Fetch latest deployment state:**
   \`\`\`
   Vercel:list_deployments with project_id prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG
   Get latest deployment ID → Vercel:get_deployment_build_logs
   \`\`\`

2. **Verify file locations:**
   \`\`\`bash
   find app -name "page.tsx" | grep [route-name]
   find app/api -name "route.ts" | grep [api-name]
   \`\`\`

3. **Check recent commits:**
   \`\`\`bash
   git log -10 --oneline
   \`\`\`

4. **Read core files:**
   - \`/CONVENTIONS.md\` (immutable rules)
   - \`/app/layout.tsx\` (app structure)
   - \`/lib/supabase/\` (auth patterns)

**NEVER assume file locations. ALWAYS verify first.**

---

## Post-Work Checklist

After Claude Code finishes changes:

- [ ] Review all changes: \`git diff\`
- [ ] Test locally if needed
- [ ] Update this context: \`./scripts/update-context.sh\`
- [ ] Review context changes: \`git diff CLAUDE.md\`
- [ ] Commit everything: \`git add -A && git commit -m "feat: [description] + context update"\`
- [ ] **ONLY THEN push:** \`git push origin main\` (triggers Vercel deploy)

**NEVER let Claude Code push automatically.**

---

## Known Active Issues

(Update this section manually when new recurring issues are discovered)

**Recently Fixed:**
- ✅ Luna sync bug (fixed via %%TRIP_UPDATE%% JSON payloads)
- ✅ Photo pipeline (Unsplash → Pexels, removed Google Places)
- ✅ Auth static rendering (fixed /auth/returning with dynamic rendering)
- ✅ Luna character image (updated to luna_BLUE.png with preload)

**Current Work:**
- Brevo email integration (list ID 17, /api/brevo-sync/route.ts)
- Blog page (coming soon placeholder)
- Deals page (needs real Unsplash photos, affiliate partners)
- PDF export (jsPDF + html2canvas, branded itinerary)

---

## Tech Stack

- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (auth + PostgreSQL)
- **AI:** Anthropic Claude API
- **Deployment:** Vercel (GitHub integration)
- **Analytics:** Google Analytics (G-YZV7GHDQ0T)

---

**For detailed conventions, see CONVENTIONS.md**
**For session setup, see SETUP-PROMPT.md**

EOF

echo "✅ CLAUDE.md regenerated successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Review changes: git diff CLAUDE.md"
echo "   2. Commit with your changes: git add -A && git commit -m '...'"
echo "   3. Push when ready: git push origin main"
echo ""
echo "⚠️  This script does NOT deploy. You control when to push."
