# AI-PATHS.md

Two parallel AI invocation paths. Both call Anthropic Claude via `streamCompletion` in `lib/ai-stream.ts`. They differ in how the model output is interpreted.

Confusing the two paths cost four hotfixes during R5. Read this before adding any new AI capability.

---

## Path 1 · Structured tool-call path

**Routes that use this path:**
- `/api/generate` — initial trip generation
- `/api/expand-phase` — on-demand day expansion for long trips
- `/api/regenerate-day` — single-day regeneration (R4)
- Other places where `streamCompletion` is called with a `tools` array argument

**How it works:**

1. Route calls `streamCompletion(messages, route, tools)` with a non-empty `tools` array.
2. Anthropic's API is invoked with `tools` + `tool_choice: { type: 'auto' }`.
3. The model emits `tool_use` content blocks (named tool calls with typed JSON input) alongside regular `text_delta` blocks.
4. `streamAnthropic` buffers the partial JSON for each tool block until `content_block_stop`, then emits a single complete tool event: `data: {"tool_use":{"id":..., "name":..., "input":...}}`.
5. The client SSE parser in `app/[locale]/plan/page.tsx` (and related) reads both text and tool_use events. Tool events drive structured state updates (add a Day object, add a Phase object, etc.).

**Tool definitions live in:**
`lib/ai.ts` — search for `DEFINE_DAY_TOOL`, `DEFINE_PHASE_TOOL`, and the `buildGenerateTools()` factory.

**Rule for adding a new capability on this path:**
Add a new `AnthropicTool` constant to `lib/ai.ts`. Include it in the appropriate `buildXxxTools()` factory. Update the client-side handler to dispatch on `tool_use.name`. The prompt does NOT need to describe tool call syntax — Anthropic's API handles that via the `input_schema`. The prompt only needs to TELL the model WHEN to call which tool (e.g. "call `define_phase` before `define_day` for 15+ day trips").

**Tool narrowing by trip mode (R6):**
For `/api/generate`, `buildGenerateTools(tripDays)` returns a different tool array based on trip length. Long trips (15+ days) receive ONLY `[DEFINE_PHASE_TOOL]` — `define_day` is physically absent, so the model cannot emit day-by-day content. This is structural, not instructional. Never re-add `define_day` to the long-trip array without understanding why it was removed.

---

## Path 2 · Text-marker path

**Routes that use this path:**
- `/api/chat` — Luna conversational replies
- `/api/day-suggestions` — per-day brainstorms
- `/api/extra-ideas` — alternative suggestions
- `/api/hotel-suggestions` — Stays tab recommendations
- `/api/budget-estimate` — budget breakdown

**How it works:**

1. Route calls `streamCompletion(messages, route)` WITHOUT the tools argument. Tools array defaults to undefined, which is equivalent to not passing `tools` at all.
2. The model emits only text. No `tool_use` blocks.
3. The client receives streamed text chunks and looks for sentinel markers:
   - `[[ADD: Title | day: N | slot: morning|afternoon|evening|night]]` — suggestion chips rendered inline in Luna's chat bubble
   - `%%TRIP_UPDATE%% { ... JSON ... } %%END_TRIP_UPDATE%%` — structured mutation block applied to trip state
4. The client parses these markers from the accumulated response (not individual chunks) and dispatches the mutation.

**Marker formats live in:**
`LUNA_CHAT_STATIC_PROMPT` inside `lib/ai.ts`. This prompt is a cached text block sent with every chat request. It defines:
- What `[[ADD:]]` is and when to emit it
- What each `%%TRIP_UPDATE%%` JSON shape looks like (`add_activity`, `remove_activity`, hotel add/remove, phase edit operations from R5)
- Rules for copying `phase_id` values verbatim from the trip context

**Rule for adding a new capability on this path:**
Add a new `%%TRIP_UPDATE%%` JSON shape to `LUNA_CHAT_STATIC_PROMPT`. Document the fields. Give a worked example. Add a MANDATORY OUTPUT RULE reminder near the end of the prompt. Add a handler in the client's `onTripUpdate` dispatcher to apply the mutation to state.

**DO NOT add tool definitions expecting the chat route to use them.** The chat route does not pass tools to `streamCompletion`. Tool arrays in `lib/ai.ts` are invisible to Luna chat. This was the root cause of the R5 four-hotfix saga.

---

## Common pitfalls

### Pitfall 1: Cross-path assumption

Adding `edit_phase` as an `AnthropicTool` in `lib/ai.ts` does NOT make it available to Luna chat. Luna chat never sees tools. R5 shipped new phase-editing tool definitions, expected Luna to call them, then had to hotfix four times before we realized the problem was that Luna was on the text-marker path.

**Check:** before adding an AI capability, find the route that will invoke it. Check whether that route calls `streamCompletion(messages, route, tools)` or `streamCompletion(messages, route)`. The presence or absence of the third argument tells you which path you are on.

### Pitfall 2: Overriding the prompt branching

`buildTravelPrompt()` in `lib/ai.ts` constructs a mode-aware prompt with branched sections for short/medium/long trips. The generate route then runs a regex replace on that output via `buildStructuredItineraryInstruction(tripDays)` in `app/api/generate/route.ts`. Both functions must stay in sync. R6 hotfix #2 fixed a case where the regex replace was shadowing the strong long-trip prompt with a weak default.

**Check:** when editing either function, also inspect the other. They collaborate.

### Pitfall 3: Silent tool availability

Tools passed to `streamCompletion` are SUGGESTIONS to the model, not mandates. A model with `[define_phase, define_day]` available can call either, neither, or both — whatever its prompt nudges it toward. The only way to PREVENT the model from emitting a specific tool is to omit that tool from the array.

**Check:** when you want mode-deterministic behavior, narrow the tool array per mode instead of relying on prompt instructions to opt out.

---

## Quick reference

| Question | Path 1 (tool-call) | Path 2 (text-marker) |
|---|---|---|
| How does the route call `streamCompletion`? | With `tools` argument | Without `tools` argument |
| Where do capabilities live? | As `AnthropicTool` constants in `lib/ai.ts` | As `%%TRIP_UPDATE%%` formats in `LUNA_CHAT_STATIC_PROMPT` |
| How does the client receive the output? | Parses `tool_use` SSE events by name | Parses `%%TRIP_UPDATE%%` sentinels from accumulated text |
| What enforces output correctness? | `input_schema` on the tool | Manual validation + prompt discipline |
| Can model skip the capability? | Yes (unless tool array is narrowed to force it) | Yes — text markers can be omitted by the model |
| Where to add a new capability? | Tool constant + factory + client dispatcher | Prompt format + prompt reminder + client `onTripUpdate` handler |

---

## History

- **R5 four-hotfix saga** — added phase-editing tool definitions to `lib/ai.ts`, expected Luna chat to use them. Chat never did. Hotfix #4 discovered the root cause and added phase-editing `%%TRIP_UPDATE%%` formats to `LUNA_CHAT_STATIC_PROMPT` instead. This doc exists to prevent a sixth hotfix.
- **R6 two-hotfix saga** — added `DEFINE_PHASE_TOOL` to `buildGenerateTools` but did not remove `DEFINE_DAY_TOOL` for long trips. Model defaulted to day-by-day emission. Fixed by narrowing the tool array per trip mode.

---

Last updated: 2026-04-21 after R5.1 hotfix #1 (commit `5f800c29`).
