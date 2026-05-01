'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle } from 'lucide-react';
import type { Phase } from '@/types';

type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
  planUpdated?: boolean;
  isWelcome?: boolean;
}

export interface TripUpdate {
  type: 'stays' | 'add_activity' | 'remove_activity' | 'replace_activity' | 'itinerary' | 'budget'
      | 'edit_phase' | 'split_phase' | 'merge_phases' | 'reorder_phases';
  action?: 'add' | 'update' | 'remove';
  // Hotel updates (type === 'stays')
  data?: {
    hotelName?: string;
    checkInDay?: number;
    checkOutDay?: number;
    city?: string;
    stars?: number;
    neighborhood?: string;
    priceRange?: string;
    amenities?: string[];
  };
  // Activity updates (type === 'add_activity' | 'remove_activity' | 'replace_activity')
  day?: number;
  timeSlot?: string;
  activity?: string;     // add_activity: new text; remove_activity: text to match; replace_activity: old text to match
  activityText?: string; // remove_activity legacy %%TRIP_UPDATE%% path: alternate camelCase field name (Stage 2f hotfix #7)
  activity_text?: string; // remove_activity legacy %%TRIP_UPDATE%% path: snake_case as documented in lib/ai.ts:701 schema (Stage 2f hotfix #7b)
  newActivity?: string;  // replace_activity: replacement text
  location?: string;
  activityIndex?: number; // remove_activity primary identifier (0-based position within slot, Stage 2f hotfix #7c)
  // Phase editing updates (R5)
  phaseId?: string;
  phaseLabel?: string;
  phaseSummary?: string;
  phaseHighlights?: string[];
  splitAtDay?: number;
  phaseA?: { id: string; label: string; summary: string; highlights: string[] };
  phaseB?: { id: string; label: string; summary: string; highlights: string[] };
  phaseIdA?: string;
  phaseIdB?: string;
  mergedPhase?: { id: string; label: string; summary: string; highlights: string[] };
  orderedPhaseIds?: string[];
}

interface Props {
  plan: string;
  destination?: string;
  hotelContext?: string;
  getCurrentActivities?: () => string;
  /** R5: Called right before each chat request to get current phase state for context injection. */
  getPhases?: () => Phase[];
  onAddToItinerary: (text: string, dayNum: number, slot: TimeSlot) => void;
  onPlanUpdate?: (updatedPlan: string) => void;
  /**
   * Stage 2f hotfix #7b: callback may return `boolean` to signal whether the
   * mutation actually succeeded (true) or was a no-op (false, e.g. text didn't
   * match any activity). Returning `void` is treated as success for
   * back-compat with existing branches that don't return anything.
   */
  onTripUpdate?: (update: TripUpdate) => boolean | void;
  isGuest?: boolean;
  onGateRequired?: () => void;
  initialMessages?: Msg[];
  savedTripId?: string | null;
  onMessagesChange?: (messages: Msg[]) => void;
  pendingPrompt?: { text: string; nonce: number } | null;
  onPendingPromptConsumed?: () => void;
  injectedAssistantMessage?: { content: string; nonce: number } | null;
  onInjectedMessageConsumed?: () => void;
}

interface ToolUseEvent {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

async function collectSSEWithTools(res: Response): Promise<{
  text: string;
  toolCalls: ToolUseEvent[];
}> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let text = '', buffer = '';
  const toolCalls: ToolUseEvent[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const d = JSON.parse(json);
        // Text delta (existing path)
        const t = d?.choices?.[0]?.delta?.content;
        if (typeof t === 'string') text += t;
        // Tool use event (Stage 3 — buffered server-side, arrives pre-parsed)
        if (d?.tool_use) toolCalls.push(d.tool_use as ToolUseEvent);
      } catch { /* skip malformed lines */ }
    }
  }

  return { text, toolCalls };
}

async function collectSSE(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let result = '', buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try { const d = JSON.parse(json); const t = d?.choices?.[0]?.delta?.content; if (t) result += t; } catch { /* skip */ }
    }
  }
  return result;
}

/* Extract and parse a ```json block from Luna's response */
function extractJsonBlock(text: string): { json: Record<string, unknown> | null; cleanText: string } {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { json: null, cleanText: text };
  const cleanText = text.replace(/```json\s*[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim();
  try {
    const json = JSON.parse(match[1].trim()) as Record<string, unknown>;
    return { json, cleanText };
  } catch (err) {
    console.error('[Luna] JSON parse error:', err);
    return { json: null, cleanText };
  }
}

/* Extract %%TRIP_UPDATE%% block from Luna's response.
   Supports both %%TRIP_UPDATE%%...%%END_TRIP_UPDATE%% and %%TRIP_UPDATE%%...%%TRIP_UPDATE%% */
function parseTripUpdate(text: string): { update: TripUpdate | null; cleanText: string } {
  // Match either closing format
  const match = text.match(/%%TRIP_UPDATE%%\s*([\s\S]*?)\s*%%(?:END_TRIP_UPDATE|TRIP_UPDATE)%%/);
  if (!match) return { update: null, cleanText: text };
  const cleanText = text
    .replace(/%%TRIP_UPDATE%%[\s\S]*?%%(?:END_TRIP_UPDATE|TRIP_UPDATE)%%/g, '')
    .replace(/\n{3,}/g, '\n\n').trim();
  try {
    const update = JSON.parse(match[1].trim()) as TripUpdate;
    return { update, cleanText };
  } catch (err) {
    console.error('[Luna] TripUpdate parse error:', err);
    return { update: null, cleanText };
  }
}

interface Addable { text: string; dayNum: number; slot: TimeSlot }

function parseAddables(text: string): Addable[] {
  const results: Addable[] = [];
  for (const m of text.matchAll(/\[\[ADD:\s*([^|]+)\|\s*day:\s*(\d+)\s*\|\s*slot:\s*(morning|afternoon|evening|night)\s*\]\]/gi)) {
    results.push({ text: m[1].trim(), dayNum: parseInt(m[2], 10), slot: m[3].toLowerCase() as TimeSlot });
  }
  return results;
}

/**
 * Dispatch a Luna tool call to the appropriate handler.
 * Translates snake_case tool arguments to camelCase TripUpdate / Addable shapes.
 */
function dispatchToolUse(
  tc: ToolUseEvent,
  onTripUpdate: ((u: TripUpdate) => boolean | void) | undefined,
): { planUpdated: boolean; addable: Addable | null } {
  switch (tc.name) {
    case 'add_activity': {
      const i = tc.input as { day: number; time_slot: TimeSlot; activity: string; location?: string };
      onTripUpdate?.({ type: 'add_activity', day: i.day, timeSlot: i.time_slot, activity: i.activity, location: i.location });
      return { planUpdated: true, addable: null };
    }
    case 'remove_activity': {
      // Stage 2f hotfix #7c: schema is now (day, time_slot, activity_index).
      // activity_text kept as optional fallback for any in-flight calls
      // emitted before the prompt update propagated. planUpdated reflects
      // the handler's actual mutation result.
      const i = tc.input as {
        day: number;
        time_slot?: TimeSlot;
        activity_index?: number;
        activity_text?: string;
      };
      const result = onTripUpdate?.({
        type: 'remove_activity',
        day: i.day,
        timeSlot: i.time_slot,
        activityIndex: i.activity_index,
        activity: i.activity_text,
      });
      return { planUpdated: result !== false, addable: null };
    }
    case 'replace_activity': {
      const i = tc.input as { day: number; timeSlot: string; oldActivity: string; newActivity: string; newLocation?: string };
      onTripUpdate?.({ type: 'replace_activity', day: i.day, timeSlot: i.timeSlot, activity: i.oldActivity, newActivity: i.newActivity, location: i.newLocation });
      return { planUpdated: true, addable: null };
    }
    case 'suggest_activity': {
      const i = tc.input as { activity_text: string; day: number; time_slot: TimeSlot };
      return { planUpdated: false, addable: { text: i.activity_text, dayNum: i.day, slot: i.time_slot } };
    }
    case 'add_hotel': {
      const i = tc.input as {
        hotel_name: string; city: string; check_in_day: number; check_out_day: number;
        stars?: number; neighborhood?: string; price_range?: string; amenities?: string[];
      };
      onTripUpdate?.({
        type: 'stays', action: 'add',
        data: {
          hotelName: i.hotel_name, city: i.city,
          checkInDay: i.check_in_day, checkOutDay: i.check_out_day,
          stars: i.stars, neighborhood: i.neighborhood,
          priceRange: i.price_range, amenities: i.amenities,
        },
      });
      return { planUpdated: true, addable: null };
    }
    case 'remove_hotel': {
      const i = tc.input as { hotel_name: string };
      onTripUpdate?.({ type: 'stays', action: 'remove', data: { hotelName: i.hotel_name } });
      return { planUpdated: true, addable: null };
    }
    case 'edit_phase': {
      const i = tc.input as { phase_id: string; label?: string; summary?: string; highlights?: string[] };
      onTripUpdate?.({
        type: 'edit_phase',
        phaseId: i.phase_id,
        phaseLabel: i.label,
        phaseSummary: i.summary,
        phaseHighlights: i.highlights,
      });
      return { planUpdated: true, addable: null };
    }
    case 'split_phase': {
      const i = tc.input as {
        phase_id: string;
        split_at_day: number;
        phase_a: { label: string; summary: string; highlights?: string[] };
        phase_b: { label: string; summary: string; highlights?: string[] };
      };
      const idA = `phase-${Date.now()}-a`;
      const idB = `phase-${Date.now()}-b`;
      onTripUpdate?.({
        type: 'split_phase',
        phaseId: i.phase_id,
        splitAtDay: i.split_at_day,
        phaseA: { id: idA, label: i.phase_a.label, summary: i.phase_a.summary, highlights: i.phase_a.highlights ?? [] },
        phaseB: { id: idB, label: i.phase_b.label, summary: i.phase_b.summary, highlights: i.phase_b.highlights ?? [] },
      });
      return { planUpdated: true, addable: null };
    }
    case 'merge_phases': {
      const i = tc.input as {
        phase_id_a: string;
        phase_id_b: string;
        merged_phase: { label: string; summary: string; highlights?: string[] };
      };
      const mergedId = `phase-${Date.now()}-merged`;
      onTripUpdate?.({
        type: 'merge_phases',
        phaseIdA: i.phase_id_a,
        phaseIdB: i.phase_id_b,
        mergedPhase: { id: mergedId, label: i.merged_phase.label, summary: i.merged_phase.summary, highlights: i.merged_phase.highlights ?? [] },
      });
      return { planUpdated: true, addable: null };
    }
    case 'reorder_phases': {
      const i = tc.input as { ordered_phase_ids: string[] };
      onTripUpdate?.({ type: 'reorder_phases', orderedPhaseIds: i.ordered_phase_ids });
      return { planUpdated: true, addable: null };
    }
    default:
      console.warn('[Luna] Unknown tool name:', tc.name);
      return { planUpdated: false, addable: null };
  }
}

/**
 * Synthesize a minimal conversational confirmation from the tool calls Luna
 * executed. Used as a fallback when Luna emits tool calls but no accompanying
 * text. Keeps the user from seeing "No response received" on a successful operation.
 */
function summarizeToolCalls(toolCalls: ToolUseEvent[]): string {
  if (toolCalls.length === 0) return '';
  const slotLabel = (s: unknown): string =>
    typeof s === 'string' ? s.toLowerCase() : '';

  const parts: string[] = [];
  for (const tc of toolCalls) {
    const i = tc.input as Record<string, unknown>;
    switch (tc.name) {
      case 'add_activity': {
        const day = i.day;
        const slot = slotLabel(i.time_slot);
        const activity = typeof i.activity === 'string' ? i.activity : 'the activity';
        const cleaned = activity.replace(/\*\*/g, '').slice(0, 80);
        parts.push(`Added ${cleaned} to Day ${day}${slot ? ` ${slot}` : ''}.`);
        break;
      }
      case 'remove_activity': {
        const day = i.day;
        const slot = slotLabel(i.time_slot);
        // Stage 2f hotfix #7c: tool schema no longer carries activity_text.
        // Fall back to a generic narration.
        if (typeof i.activity_index === 'number' && slot) {
          parts.push(`Removed an activity from Day ${day} ${slot}.`);
        } else {
          parts.push(`Removed an activity from Day ${day}.`);
        }
        break;
      }
      case 'add_hotel': {
        const name = typeof i.hotel_name === 'string' ? i.hotel_name : 'the hotel';
        parts.push(`Added ${name} to your stays.`);
        break;
      }
      case 'remove_hotel': {
        const name = typeof i.hotel_name === 'string' ? i.hotel_name : 'that hotel';
        parts.push(`Removed ${name} from your stays.`);
        break;
      }
      case 'suggest_activity':
        // Suggestions become chips; no narration needed in the bubble
        break;
      case 'edit_phase': {
        const label = typeof i.label === 'string' ? i.label : null;
        parts.push(label ? `Updated phase to "${label}".` : 'Updated phase details.');
        break;
      }
      case 'split_phase': {
        const pa = (i.phase_a as Record<string, unknown>)?.label;
        const pb = (i.phase_b as Record<string, unknown>)?.label;
        parts.push(`Split phase into "${pa}" and "${pb}".`);
        break;
      }
      case 'merge_phases': {
        const ml = (i.merged_phase as Record<string, unknown>)?.label;
        parts.push(`Merged phases into "${ml}".`);
        break;
      }
      case 'reorder_phases':
        parts.push('Reordered phases.');
        break;
      default:
        break;
    }
  }

  return parts.length > 0 ? `Done! ${parts.join(' ')}` : '';
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}

function renderContent(text: string): React.ReactNode {
  const clean = text.replace(/\[\[ADD:[^\]]*\]\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const paragraphs = clean.split(/\n\n+/);
  return paragraphs.map((para, pi) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    if (/^[-*•]\s/.test(trimmed)) {
      const items = trimmed.split('\n').filter(l => l.trim());
      return (
        <ul key={pi} style={{ margin: pi === 0 ? '0' : '8px 0 0', paddingLeft: 16, listStyle: 'disc' }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ marginBottom: 3 }}>{renderInline(item.replace(/^[-*•]\s+/, ''))}</li>
          ))}
        </ul>
      );
    }
    const lines = trimmed.split('\n');
    return (
      <p key={pi} style={{ margin: pi === 0 ? '0' : '8px 0 0', lineHeight: 1.65 }}>
        {lines.map((line, li) => (
          <span key={li}>{li > 0 && <br />}{renderInline(line)}</span>
        ))}
      </p>
    );
  });
}

export default function FloatingChat({ plan, destination, hotelContext, getCurrentActivities, getPhases, onAddToItinerary, onPlanUpdate, onTripUpdate, isGuest = false, onGateRequired, initialMessages, savedTripId, onMessagesChange, pendingPrompt, onPendingPromptConsumed, injectedAssistantMessage, onInjectedMessageConsumed }: Props) {
  const locale = useLocale();
  const t = useTranslations('plan');

  const buildWelcome = (firstName: string | null, dest: string | null): string => {
    const greeting = firstName
      ? t('chat.welcomeHey', { name: firstName })
      : t('chat.welcomeHeyThere');
    const tripRef = dest
      ? t('chat.welcomeTrip', { destination: dest })
      : t('chat.welcomeGeneric');
    return `${greeting} ${t('chat.welcomeIntro')} ${tripRef} ${t('chat.welcomeCta')}`;
  };
  const [open, setOpen] = useState(true);
  const [msgs, setMsgs] = useState<Msg[]>(
    initialMessages && initialMessages.length > 0
      ? initialMessages
      : [{ role: 'assistant', content: buildWelcome(null, destination ?? null), isWelcome: true }]
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmedAdds, setConfirmedAdds] = useState<Record<number, Set<number>>>({});
  const [firstName, setFirstName] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch user's first name from Supabase session on mount
  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      const fullName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;
      const first = fullName ? (fullName as string).split(' ')[0] : null;
      setFirstName(first);
      setSessionLoaded(true);
    });
  }, []); // eslint-disable-line

  // Update welcome message when session or destination changes (only if no restored history)
  useEffect(() => {
    if (!sessionLoaded) return;
    setMsgs(prev => {
      if (prev.length === 1 && prev[0].isWelcome) {
        return [{ role: 'assistant', content: buildWelcome(firstName, destination ?? null), isWelcome: true }];
      }
      return prev;
    });
  }, [sessionLoaded, firstName, destination]); // eslint-disable-line

  // Notify parent whenever msgs change (for chat persistence)
  useEffect(() => {
    if (!onMessagesChange) return;
    // Don't sync if only the welcome message exists
    if (msgs.length === 1 && msgs[0].isWelcome) return;
    onMessagesChange(msgs);
  }, [msgs]); // eslint-disable-line

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);

  // When "Plan these days" fires from a PhaseCard, open the chat and prefill
  // the input so the user can review/edit before sending.
  useEffect(() => {
    if (!pendingPrompt) return;
    if (isGuest) {
      onGateRequired?.();
      return;
    }
    setOpen(true);
    setInput(pendingPrompt.text);
    setTimeout(() => {
      inputRef.current?.focus();
      const len = pendingPrompt.text.length;
      inputRef.current?.setSelectionRange(len, len);
    }, 50);
    onPendingPromptConsumed?.();
  }, [pendingPrompt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push a Luna acknowledgment message into chat after phase expansion completes.
  useEffect(() => {
    if (!injectedAssistantMessage) return;
    setMsgs(prev => [...prev, { role: 'assistant', content: injectedAssistantMessage.content }]);
    setOpen(true);
    onInjectedMessageConsumed?.();
  }, [injectedAssistantMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const guestMsgCount = msgs.filter(m => m.role === 'user').length;

  const send = async () => {
    if (!input.trim() || loading) return;
    if (isGuest && guestMsgCount >= 2) { onGateRequired?.(); return; }
    const text = input.trim();
    setInput('');
    const next: Msg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setLoading(true);
    try {
      // === Hotfix #5b: assemble phases FIRST.
      // The server's buildLunaDynamicContext applies sanitizePromptInput
      // (lib/ai.ts:301) which slices tripContext to 8000 chars. For 7+ day
      // trips the plan markdown alone can exceed 8000 chars; if the
      // ## Trip Phases block is appended LAST it gets sliced off entirely
      // and Luna sees no phases despite phasesFromProp.length > 0. Putting
      // phases first guarantees they survive the slice. The plan markdown's
      // tail (which starts at ~1400 chars after phases) gets truncated
      // instead, but Luna already gets currentActivities as a structural
      // summary so the lost prose-tail content does not change her
      // reasoning ability for phase ops, hotel ops, or activity ops.
      const phasesFromProp = (() => {
        try {
          const result = getPhases?.();
          console.info('[FloatingChat] getPhases() returned:', {
            isFunction: typeof getPhases === 'function',
            result,
            length: Array.isArray(result) ? result.length : 'not-array',
            firstId: Array.isArray(result) && result.length > 0 ? result[0]?.id : null,
          });
          return Array.isArray(result) ? result : [];
        } catch (err) {
          console.error('[FloatingChat] getPhases() threw:', err);
          return [];
        }
      })();

      let ctx = '';
      if (phasesFromProp.length > 0) {
        const phasesBlock = phasesFromProp.map((p, idx) =>
          `Phase ${idx + 1}:\n` +
          `  phase_id: "${p.id}"  \u2190 USE THIS EXACT STRING when calling edit_phase / split_phase / merge_phases / reorder_phases. Do NOT invent IDs.\n` +
          `  Label: ${p.label}\n` +
          `  Days: ${p.dayFrom}\u2013${p.dayTo}\n` +
          `  Summary: ${p.summary || '(none)'}\n` +
          (p.highlights?.length ? `  Highlights: ${p.highlights.join(' \u00b7 ')}\n` : '')
        ).join('\n');
        ctx = `## Trip Phases (CRITICAL \u2014 phase_id values must be copied exactly for phase editing tools)\n${phasesBlock}\n\n`;
        console.info('[FloatingChat] phase context injected at front of ctx, phases:', phasesFromProp.length);
      } else {
        console.warn('[FloatingChat] no phases in context \u2014 Luna will not know about phases for this request');
      }

      // === STRUCTURED ITINERARY (PRIMARY SOURCE OF TRUTH) ===
      // Called fresh at send time so Luna always gets live state, not a stale render snapshot.
      const currentActivities = getCurrentActivities?.() ?? '';
      if (currentActivities) {
        ctx += `## Current Itinerary (SOURCE OF TRUTH for all days, slots, and activities)\nRead this section FIRST. Each day shows its slots (MORNING, AFTERNOON, EVENING, NIGHT) with numbered activities. The number in brackets [0], [1], [2] is the activityIndex for remove_activity tool calls. This section reflects the LIVE state of the itinerary including all user edits.\n\n${currentActivities}\n\n`;
      }

      if (hotelContext) ctx += `## Confirmed Accommodation\n${hotelContext}\n\n`;

      // === PLAN NARRATIVE (BACKGROUND CONTEXT ONLY) ===
      // Original generation prose. Useful for destination info, weather, transport,
      // budget, and tips. NOT the source of truth for which activities are in which
      // slots. If this section differs from Current Itinerary above, Current Itinerary wins.
      ctx += `## Background Trip Narrative (for destination info, weather, transport, budget, tips only. Do NOT use this section for activity data — use the Current Itinerary section above instead)\n${plan}`;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.filter(m => !m.isWelcome).map(m => ({ role: m.role, content: m.content })),
          tripContext: ctx,
          userName: firstName ?? undefined,
          locale,
          // Stage 2c: pass tripId when known so the server can resolve
          // the requester's role and filter mutation markers for viewers.
          tripId: savedTripId ?? undefined,
        }),
      });
      const { text: raw, toolCalls } = await collectSSEWithTools(res);

      // Step 1: Dispatch tool calls (Stage 3 — preferred path)
      let planUpdated = false;
      const toolAddables: Addable[] = [];
      for (const tc of toolCalls) {
        const result = dispatchToolUse(tc, onTripUpdate);
        if (result.planUpdated) planUpdated = true;
        if (result.addable) toolAddables.push(result.addable);
      }

      // Step 2: Fallback — legacy %%TRIP_UPDATE%% markers
      const { update: legacyUpdate, cleanText: afterTripUpdate } = parseTripUpdate(raw);
      if (legacyUpdate && onTripUpdate) {
        console.warn('[Luna] Legacy %%TRIP_UPDATE%% fallback triggered');
        // Stage 2f hotfix #7b: read return value so planUpdated reflects
        // whether the mutation actually succeeded. Branches that return
        // `void` are treated as success; only an explicit `false` (e.g.
        // remove_activity with no text match) flips planUpdated off.
        const legacyResult = onTripUpdate(legacyUpdate);
        if (legacyResult !== false) planUpdated = true;
      }

      // Step 3: Fallback — full JSON plan rewrite (rare legacy path)
      const { json, cleanText } = extractJsonBlock(afterTripUpdate);
      let displayContent = cleanText || afterTripUpdate;
      if (json) {
        console.warn('[Luna] Legacy JSON block fallback triggered');
        const updatedPlan = (json.plan ?? json.tripContext ?? json.content) as string | undefined;
        if (updatedPlan && typeof updatedPlan === 'string' && onPlanUpdate) {
          onPlanUpdate(updatedPlan);
          planUpdated = true;
        }
      }

      // Step 4: Inject suggest_activity tool calls as [[ADD:]] markers so existing
      // chip rendering pipeline works without duplication.
      if (toolAddables.length > 0) {
        const markers = toolAddables
          .map(a => `[[ADD: ${a.text} | day: ${a.dayNum} | slot: ${a.slot}]]`)
          .join('\n');
        displayContent = displayContent.trim() ? `${displayContent}\n\n${markers}` : markers;
      }

      // Prefer Luna's conversational text. If she emitted only tool calls with
      // no surrounding text (valid per Anthropic API), synthesize a minimal
      // confirmation so the user doesn't see "No response received" on a
      // successful operation.
      let finalContent = displayContent;
      if (!finalContent.trim() && toolCalls.length > 0) {
        finalContent = summarizeToolCalls(toolCalls);
      }
      if (!finalContent.trim()) {
        finalContent = 'Sorry, I had trouble with that. Can you try rephrasing?';
      }

      setMsgs(prev => [...prev, { role: 'assistant', content: finalContent, planUpdated }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAdd = (msgIdx: number, addable: Addable, addIdx: number) => {
    onAddToItinerary(addable.text, addable.dayNum, addable.slot);
    setConfirmedAdds(prev => {
      const s = new Set(prev[msgIdx] ?? []);
      s.add(addIdx);
      return { ...prev, [msgIdx]: s };
    });
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9000, width: 340, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.16)', border: '1px solid rgba(0,68,123,0.10)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div
          onClick={() => setOpen(v => !v)}
          style={{ background: 'linear-gradient(135deg,#00447B,#005FAD)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src="/luna_2.png"
              alt="Luna"
              style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', border: '2px solid rgba(255,255,255,0.35)', display: 'block', background: '#fff' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', background: '#22c55e', border: '2px solid #00447B' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14, color: '#fff', margin: 0 }}>{t('chat.name')}</p>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{t('chat.role')}</p>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: 18, display: 'inline-block', transition: 'transform 0.2s', transform: open ? 'rotate(0deg)' : 'rotate(180deg)' }}>▾</span>
        </div>

        {/* Conversation saved indicator */}
        {open && savedTripId && (
          <div style={{
            fontSize: 11,
            color: '#679AC1',
            textAlign: 'center',
            padding: '3px 0 5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            background: 'rgba(103,154,193,0.07)',
            borderBottom: '1px solid rgba(103,154,193,0.15)',
          }}>
            <CheckCircle size={12} color="#679AC1" />
            Conversation saved with your trip
          </div>
        )}

        {/* Body */}
        {open && (
          <>
            {/* Messages */}
            <div style={{ overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, minHeight: 160 }}>
              {msgs.map((m, i) => {
                const addables = m.role === 'assistant' && i > 0 ? parseAddables(m.content) : [];
                const confirmed = confirmedAdds[i] ?? new Set<number>();
                return (
                  <div key={i}>
                    {/* Bubble */}
                    <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6 }}>
                      {m.role === 'assistant' && (
                        <img
                          src="/luna_2.png"
                          alt=""
                          style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, marginBottom: 2, background: '#00447B' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                      )}
                      <div style={{
                        background: m.role === 'user' ? '#00447B' : '#F0F6FC',
                        color: m.role === 'user' ? '#fff' : '#1a1a1a',
                        borderRadius: m.role === 'user' ? '12px 0 12px 12px' : '0 12px 12px 12px',
                        borderLeft: m.role === 'assistant' ? '3px solid #FF8210' : 'none',
                        padding: '10px 13px', fontSize: 13, maxWidth: '88%',
                        fontFamily: "'Inter',sans-serif",
                      }}>
                        {m.role === 'user' ? m.content : renderContent(m.content)}
                      </div>
                    </div>

                    {/* Plan updated badge */}
                    {m.planUpdated && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, marginLeft: 32, padding: '4px 10px', background: 'rgba(255,130,16,0.08)', border: '1px solid rgba(255,130,16,0.25)', borderRadius: 100, width: 'fit-content' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF8210" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 11, color: '#FF8210' }}>{t('activity.planUpdated')}</span>
                      </div>
                    )}

                    {/* Add-to-itinerary chips */}
                    {addables.length > 0 && (
                      <div style={{ paddingLeft: 32, paddingTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {addables.map((addable, ai) =>
                          confirmed.has(ai) ? (
                            <span key={ai} style={{ fontSize: 11, color: '#16A34A', fontFamily: "'Inter',sans-serif" }}>
                              ✓ <em>{addable.text}</em> added to Day {addable.dayNum}
                            </span>
                          ) : (
                            <button
                              key={ai}
                              onClick={() => confirmAdd(i, addable, ai)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.28)', borderRadius: 100, padding: '5px 12px', fontSize: 12, fontFamily: "'Poppins',sans-serif", fontWeight: 600, color: '#16A34A', cursor: 'pointer', textAlign: 'left' }}
                            >
                              <span style={{ fontSize: 13 }}>➕</span>
                              <span>Add to Day {addable.dayNum} · {addable.slot}</span>
                              <span style={{ fontWeight: 400, color: '#4B7A55', fontSize: 11, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {addable.text}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <img
                    src="/luna_2.png"
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top', flexShrink: 0, marginBottom: 2, background: '#00447B' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div style={{ background: '#F0F6FC', borderLeft: '3px solid #FF8210', borderRadius: '0 12px 12px 12px', padding: '12px 16px', display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF8210', display: 'inline-block', animation: `lunaTyping 1.2s ${i * 0.15}s infinite ease-in-out` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Guest limit hint */}
            {isGuest && (
              <div style={{ padding: '6px 12px', background: 'rgba(255,130,16,0.06)', borderTop: '1px solid rgba(255,130,16,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: '#FF8210' }}>
                  {2 - guestMsgCount > 0 ? `${2 - guestMsgCount} free message${2 - guestMsgCount === 1 ? '' : 's'} left` : 'Free limit reached'}
                </span>
                <button onClick={onGateRequired} style={{ fontFamily: "'Poppins',sans-serif", fontSize: 11, fontWeight: 600, color: '#FF8210', background: 'none', border: '1px solid rgba(255,130,16,0.4)', borderRadius: 100, padding: '2px 8px', cursor: 'pointer' }}>
                  {t('auth.signInForMore')}
                </button>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(0,68,123,0.08)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={t('chat.placeholder')}
                style={{ flex: 1, background: '#F4F7FB', border: '1.5px solid rgba(0,68,123,0.12)', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#000', outline: 'none', fontFamily: "'Inter',sans-serif" }}
                onFocus={e => (e.target.style.borderColor = '#00447B')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,68,123,0.12)')}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{ background: input.trim() && !loading ? '#FF8210' : '#CBD5E1', color: '#fff', border: 'none', borderRadius: 10, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'default', flexShrink: 0, transition: 'background 0.15s' }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M14 2L7 9M14 2L9.5 14 7 9 2 6.5 14 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes lunaTyping {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
