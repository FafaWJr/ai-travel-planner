# Luna AI Integration Patterns

## System Prompt Rules

- `%%TRIP_UPDATE%%` rules MUST be at the **END** of the system prompt in `app/api/chat/route.ts`. The client regex matches on the complete accumulated response after stream-end, not on individual chunks. Moving these rules earlier causes silent edit failures.
- `getLanguageInstruction(locale)` appended at **END** of all AI route system prompts. Locale instructions placed earlier get buried under trip context.
- `## Trip Phases` block goes at the **FRONT** of FloatingChat context. `sanitizePromptInput` truncates from the end; plan markdown follows phases. Without this, Luna doesn't see phases on long trips and emits stale `merge_phases`/`split_phase` payloads.

## Context Assembly Order (FloatingChat)

1. `## Trip Phases` (front — survives truncation)
2. Structured slot-itinerary labelled **SOURCE OF TRUTH**
3. Plan markdown (supplementary, truncated last)

Structured itinerary is the primary source. User edits are reflected here; the stale plan prose is no longer Luna's primary source.

## Activity Context

- Slot-structured itinerary context: Morning / Afternoon / Evening per day with 0-based indices.
- Declined activities included so Luna can reference items the user mentioned.
- Luna MUST NOT reclassify a user-specified slot based on activity type (e.g. cocktail bar stays in its assigned slot).
- `liveActivitiesText` computed at **send time** (useCallback getter), not at render time (was stale useMemo).

## `remove_activity` — Index-Based (Not Text-Based)

- Field: `activityIndex` (0-based within slot). `activityText` survives as legacy fallback only.
- System prompt instructs Luna to count positions: first = 0, second = 1, ...
- Bulk removal emits highest index first.
- Three text-matching attempts all failed against Luna paraphrasing; position is deterministic.

## `%%TRIP_UPDATE%%` Formats

`lib/ai.ts` system prompt block documents all formats including `replace_activity` (between the `remove_activity` rules and the hotel block). Without this block, Sonnet's fallback-to-marker path emits nothing for cross-slot drags.

## Two-Path Architecture

Never straddle both paths. Pick one per feature.

| Path | Entry points | Edit format |
|---|---|---|
| Generate | `/api/generate`, `/api/expand-phase`, `/api/regenerate-day` | Anthropic tools API (`define_phase`, `define_day`) |
| Chat | `/api/chat` (Luna) | SSE stream + `%%TRIP_UPDATE%%` markers parsed client-side |

SSE streaming doesn't deliver complete tool blocks mid-stream, so `%%TRIP_UPDATE%%` text markers remain the chat edit format.

## Phase Mode Matrix

| Trip length | Tool array | Phase behavior |
|---|---|---|
| Short (1-6d) | `[define_day]` | Day-only, no phases |
| Medium (7-14d) | `[define_phase, define_day]` | Phases as headers, days always visible |
| Long (15+d) | `[define_phase]` | Phase-only, on-demand `/api/expand-phase` |

Full matrix: `docs/architecture/phase-mode-matrix.md`.

## Viewer Role in Chat

`/api/chat` viewer path (buffered): tools array empty for viewers; full stream buffered, `%%TRIP_UPDATE%%` and `[[ADD:]]` markers stripped, returned as `text/plain` with `X-Luna-Viewer-Filtered: 1` header. Editor/owner path is unchanged SSE.

Viewer-readonly Luna instruction appended to dynamic system prompt for viewer role — Luna explains she cannot modify the trip.

## Prompt Caching

`cache_control: { type: 'ephemeral' }` on large system blocks and on the last entry of every tools array. Cache hit rate visible in Anthropic dashboard.

## Collab Cross-Awareness

`lib/collab-awareness.ts` queries `trip_activity_log` for last 10 minutes of other collaborators' actions (capped at 5, newest first). Appended to END of Luna's dynamic system prompt block (block 1), preserving prompt caching on the stable block (block 0). Gated by `NEXT_PUBLIC_COLLAB_LUNA_AWARENESS_ENABLED`.
