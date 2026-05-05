# Luna Multi-Agent Orchestration Protocol

Reference document for how Luna's Claude Code specialist agents coordinate. This protocol is followed by the main Claude Code session when decomposing tasks.

## Agent roster

### Specialist agents (domain-specific)

| Agent | Domain | Key files |
|---|---|---|
| luna-agent-backend | API routes, server logic | `/app/api/**`, `lib/supabase/server.ts` |
| luna-agent-frontend | UI, components, pages | `/components/**`, `/app/[locale]/**` |
| luna-agent-ai | AI prompts, tools, models | `lib/ai.ts`, `lib/ai-stream.ts` |
| luna-agent-media | Photo pipeline, place preview | `lib/places/**`, `components/place-preview/**` |
| luna-agent-database | Schema, migrations, RLS | Supabase project `qhpxejzoxfruuositwzo` |
| luna-agent-auth | Auth, OAuth, sessions | `proxy.ts`, `app/auth/callback/route.ts` |
| luna-agent-devops | Vercel, env vars, flags | Vercel project IDs, `.env.local` |
| luna-agent-seo | Metadata, OG tags, JSON-LD | `generateMetadata` per page |
| luna-agent-analytics | Tracking, funnels, A/B | Analytics event instrumentation |

### Governance agents (cross-cutting)

| Agent | Role |
|---|---|
| luna-agent-architect | Structural integrity, types, ADRs, tech debt. Does NOT write feature code. |
| luna-code-reviewer | Code review, regression detection, API contract validation. |

### Existing specialist agents (pre-orchestration)

| Agent | Role |
|---|---|
| luna-qa-agent | Runs smoke tests post-deploy with pass/fail evidence. |
| luna-context-updater | Regenerates CLAUDE.md via update-context.sh. |
| luna-multilang-qa | 3-layer i18n QA pipeline (deterministic + Haiku semantic). |

## Orchestration protocol

Every time a task comes in, follow this sequence:

1. **ANALYZE**: Understand the full scope of the change.
2. **ARCHITECT**: Consult luna-agent-architect if this is a major feature or if 5+ changes have accumulated since last audit.
3. **DECOMPOSE**: Break into subtasks per agent.
4. **SEQUENCE**: Define which tasks are parallel vs. sequential.
5. **ASSIGN**: Dispatch subtasks to agents with clear specs.
6. **VALIDATE**: luna-code-reviewer reviews all outputs. luna-agent-architect reviews structural impact.
7. **INTEGRATE**: Merge outputs harmonically.
8. **SUMMARIZE**: Produce a change summary with files modified, agents involved, ADRs updated, tech debt logged, and open risks.

## Decision tree

**Is this a new major feature?**
- YES: Consult luna-agent-architect first, then decompose.
- NO: Does it touch shared types or cross-agent files?
  - YES: Notify luna-agent-architect before proceeding.
  - NO: Proceed with relevant agents directly.

**Does the task involve the database schema?**
- YES: luna-agent-database leads, luna-agent-backend follows.

**Does it involve UI only?**
- YES: luna-agent-frontend leads, luna-code-reviewer validates.

**Does it involve a new third-party API?**
- YES: luna-agent-architect approves dependency. luna-agent-backend integrates. luna-agent-devops adds env vars. luna-code-reviewer validates.

**Does it involve deployment or environment config?**
- YES: luna-agent-devops leads, luna-agent-architect reviews.

**Is it a bug fix?**
- YES: Identify owning agent. luna-code-reviewer validates fix. If bug reveals structural issue, luna-agent-architect logs in TECH_DEBT.md.

## Cross-agent file ownership

Some files are touched by multiple agents. The primary owner has final say on structure. Other agents must declare changes to the orchestrator before modifying.

| File | Primary owner | Secondary |
|---|---|---|
| `lib/ai.ts` | luna-agent-ai | luna-agent-backend (imports tools) |
| `types/index.ts` | luna-agent-architect | all agents (consume types) |
| `app/[locale]/plan/page.tsx` | luna-agent-frontend | luna-agent-ai (onTripUpdate handler) |
| `lib/places/resolver.ts` | luna-agent-media | luna-agent-backend (API route calls it) |
| `messages/*.json` | luna-agent-frontend | luna-multilang-qa (validates), luna-agent-seo (metadata keys) |
| `proxy.ts` | luna-agent-auth | luna-agent-devops (deployment impact) |

## Standards enforced across all agents

- TypeScript strict mode. No `any`.
- Inline styles only. No Tailwind.
- No emoji. No em-dashes.
- Brand colors: #FF8210, #00447B, #FFBD59, #679AC1.
- Fonts: Poppins headings, Inter body.
- Icons: Lucide React only.
- Public brand name: "Luna Let's Go" (never abbreviated in user-facing copy).
- Environment variables never hardcoded.
- Middleware file is `proxy.ts`, never `middleware.ts`.
- FK rule: `user_id` -> `profiles(id)`, never `auth.users(id)`.
