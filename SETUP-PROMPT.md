# Luna Let's Go - Claude Code Session Setup

**PASTE THIS AT THE START OF EVERY CLAUDE CODE SESSION**

---

## Pre-Work Discovery Protocol

Before writing ANY code, execute this discovery sequence:

### 1. Read Core Context Files

```bash
# Essential reading before ANY work
cat /CLAUDE.md
cat /CONVENTIONS.md
git log -10 --oneline
```

**Why:** These files contain current project state, immutable rules, and recent changes.

### 2. Verify Current Deployment State

Use Vercel MCP tools to confirm live route structure:

```
Vercel:list_deployments
  project_id: prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG
  team_id: team_uFD2kaJDUmZtpI2rSCIMy7kW
```

Then get the latest deployment ID and fetch build logs:

```
Vercel:get_deployment_build_logs
  deployment_id: [from list_deployments result]
```

**Why:** Build logs show the ACTUAL route structure currently deployed.

### 3. Verify File Locations

NEVER assume file locations. Always verify:

```bash
# Check if route exists
find app -name "page.tsx" | grep [route-name]

# Check if API exists
find app/api -name "route.ts" | grep [api-name]

# List all API routes
find app/api -name "route.ts" | sort

# List all pages
find app -name "page.tsx" | grep -v "node_modules" | sort
```

**Why:** File locations may have changed since last session.

### 4. Check Supabase Schema (if database work involved)

```
Supabase:list_tables
  project_id: qhpxejzoxfruuositwzo
```

**Why:** Confirms current table structure before writing queries.

---

## Critical Reminders (Read Before Every Session)

### File Naming
- ✅ Middleware: `proxy.ts`
- ❌ NEVER: `middleware.ts`

### Auth Library
- ✅ Use: `@supabase/ssr`
- ❌ NEVER use: `@supabase/auth-helpers-nextjs`

### Brand Rules
- ✅ Colors: #FF8210 (orange), #00447B (navy)
- ✅ Fonts: Poppins (headings), Inter (body)
- ✅ Icons: Lucide React SVGs in brand colors
- ❌ NO EMOJIS in UI

### Luna AI Rules
- ✅ ALL AI features receive full itinerary as `tripContext`
- ✅ Luna edits via `%%TRIP_UPDATE%%` JSON payloads
- ❌ NEVER say "I am not able to directly edit your plan"

### Photo Pipeline
- ✅ Tier 1: Unsplash (randomize via `page` param + shuffle)
- ✅ Tier 2: Pexels (use `p.src.landscape`)
- ❌ NO Google Places in photo pipeline

---

## Pre-Coding Checklist

Before writing code, confirm:

- [ ] I have read `/CLAUDE.md` (current state)
- [ ] I have read `/CONVENTIONS.md` (immutable rules)
- [ ] I have checked recent commits: `git log -10 --oneline`
- [ ] I have verified file locations with `find` commands
- [ ] I have confirmed deployment state with Vercel tools (if relevant)
- [ ] I understand the task and have a clear plan
- [ ] I will NEVER deploy directly (only `git push origin main` after approval)

---

## During Development

### Code Quality Standards
- Follow existing patterns in the codebase
- Use TypeScript types (no `any` unless absolutely necessary)
- Follow Next.js 16 App Router conventions
- Match existing code style (prettier/eslint)

### Testing Approach
- Test locally before committing
- Verify auth flows work (if touching auth)
- Check photo loading (if touching photo pipeline)
- Confirm affiliate links work (if touching partner integrations)

### Common Issues to Avoid
- Don't create static pages for auth routes
- Don't use Google Places for photos
- Don't use deprecated Supabase auth helpers
- Don't deploy directly from Claude Code
- Don't assume file locations without verification

---

## Post-Work Checklist

After completing the task:

```bash
# 1. Review all changes
git status
git diff

# 2. Test locally (if applicable)
npm run dev
# Test the specific feature changed

# 3. Update project context
./scripts/update-context.sh

# 4. Review context changes
git diff CLAUDE.md

# 5. Stage everything
git add -A

# 6. Commit with descriptive message
git commit -m "feat: [brief description]

- [detailed change 1]
- [detailed change 2]
- Updated CLAUDE.md context"

# 7. STOP HERE
# DO NOT PUSH AUTOMATICALLY
# Wilson will review and push manually
```

---

## End-of-Session Summary Template

When work is complete, provide this summary to Wilson:

```
## Session Summary

**Task:** [what was requested]

**Changes Made:**
- File 1: [what changed]
- File 2: [what changed]
- etc.

**Files Modified:**
[list all modified files]

**Testing Recommendations:**
- [ ] Test [specific feature]
- [ ] Verify [specific behavior]
- [ ] Check [specific integration]

**Next Steps for Wilson:**
1. Review changes: `git diff`
2. Test locally if needed
3. Update context: `./scripts/update-context.sh`
4. Review context: `git diff CLAUDE.md`
5. Commit: `git add -A && git commit -m "..."`
6. Push when ready: `git push origin main`

**Known Issues/Warnings:**
[any caveats or things to watch for]
```

---

## Emergency Rollback

If changes break something after push:

```bash
# Find the last working commit
git log --oneline

# Rollback (creates new commit that undoes changes)
git revert [bad-commit-hash]
git push origin main

# OR hard reset (use with caution)
git reset --hard [good-commit-hash]
git push origin main --force
```

---

## Current Project Context (Quick Reference)

**Live URL:** https://www.lunaletsgo.com

**Key IDs:**
- Vercel Project: `prj_zZ7eJAIUitbJQcY4vYTTEeUxdZnG`
- Vercel Team: `team_uFD2kaJDUmZtpI2rSCIMy7kW`
- Supabase Project: `qhpxejzoxfruuositwzo`
- GitHub Repo: `FafaWJr/ai-travel-planner` (branch: `main`)

**Tech Stack:**
- Next.js 16.1.6 (App Router)
- TypeScript
- Supabase (auth + database)
- Anthropic Claude API
- Vercel (deployment via GitHub integration)

**Brand Assets:**
- Logo: `LUNA-LOGO.svg`
- Character: `luna_BLUE.png`
- Colors: #FF8210, #00447B, #FFBD59, #679AC1
- Fonts: Poppins, Inter

---

## Current Task

**[WILSON: DESCRIBE YOUR TASK HERE WHEN YOU PASTE THIS PROMPT]**

Example:
> Fix the photo loading bug on the saved trips page where photos aren't updating when users load previously saved itineraries.

---

**Remember:** Discovery first, code second. Verify everything. Never push automatically.

**Ready to start? Complete the Pre-Coding Checklist above, then proceed with the task.**
