import type { TripFormData, TripStyle, BudgetLevel, WeatherData } from '@/types';
import { BOOKING_AFFILIATE, ACTIVITY_AFFILIATE } from '@/lib/affiliate';
import type { SystemContentBlock } from './ai-stream';

// ─── Luna AI model configuration ───────────────────────────────────────────
// Single source of truth for model IDs and generation config.
// Upgrading Sonnet 4.6 to a future version is a one-line change here.

export const AI_MODELS = {
  /** Primary model for all Luna routes: best balance of quality + cost + speed */
  primary: 'claude-sonnet-4-5-20250929',
  /** Fallback model used when primary fails before any token streams */
  fallback: 'claude-haiku-4-5-20251001',
} as const;

export const AI_CONFIG = {
  /** Max output tokens per route. Keep conservative to avoid runaway costs. */
  maxTokens: {
    // Stage 4: raised to 64000 to support long-trip structured generation.
    // define_day tool calls for 20+ days can exceed 8000 tokens when combined
    // with the 6 narrative sections. 64000 is the Sonnet 4.6 max.
    generate: 64000,
    chat: 2500,            // Luna conversational replies
    daySuggestion: 1500,
    extraIdeas: 1500,
    hotelSuggestions: 2000,
    // Raised from 1500: Sonnet 4.5 hit the cap before completing the JSON
    // for trips with many activities. 4000 fits trips up to 14 days.
    budgetEstimate: 4000,
    // Per-phase expansion: 7 days × ~400 tokens each = ~2800, 8000 gives headroom.
    expandPhase: 8000,
    // Single day regeneration. Same budget as a day within /api/generate.
    regenerateDay: 4000,
  },
  /** Temperature shared across all routes. Tune here if Luna ever drifts. */
  temperature: 0.7,
} as const;

export type AIRouteName = keyof typeof AI_CONFIG.maxTokens;

/**
 * Slot hour definitions per LUNA-UPGRADE-PLAN.pdf Section 5.
 * Single source of truth for time-of-day slot boundaries.
 */
export const SLOT_HOURS = {
  morning:   { label: 'Morning',   startHour: 6,  endHour: 12, character: 'Breakfast, active sightseeing, museums opening early' },
  afternoon: { label: 'Afternoon', startHour: 12, endHour: 18, character: 'Lunch, main attractions, shopping, parks' },
  evening:   { label: 'Evening',   startHour: 18, endHour: 21, character: 'Dinner, sunset views, early shows, casual walks' },
  night:     { label: 'Night',     startHour: 21, endHour: 26, character: 'Bars, clubs, late shows, night markets' },
} as const;

export type SlotName = keyof typeof SLOT_HOURS;

/**
 * Display string for a slot's hour window.
 * Format: 12h lowercase with en-dash (U+2013), matching PDF Section 5.
 * Examples: "6am–12pm", "12pm–6pm", "6pm–9pm", "9pm–6am"
 *
 * Currently locale-agnostic — 12h format for all supported locales (en, pt-BR, es)
 * per product decision. _locale parameter reserved for future flexibility.
 */
export function formatSlotHours(slot: SlotName, _locale?: string): string {
  const display: Record<SlotName, string> = {
    morning:   '6am\u201312pm',
    afternoon: '12pm\u20136pm',
    evening:   '6pm\u20139pm',
    night:     '9pm\u20136am',
  };
  return display[slot];
}

/**
 * R1 Stage 4 Rules feature flag.
 * Default true. Disable by setting NEXT_PUBLIC_STAGE4_RULES_ENABLED=false.
 */
export function stage4RulesEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STAGE4_RULES_ENABLED !== 'false';
}

/**
 * R4 Regeneration feature flag.
 * Gates /api/regenerate-day, the regenerate mode of /api/expand-phase,
 * and the client-side regen affordances (day button + phase three-dot menu).
 * Default ON. Rollback: NEXT_PUBLIC_REGENERATION_ENABLED=false.
 */
export function regenerationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_REGENERATION_ENABLED !== 'false';
}

/**
 * R5 Phase Editing feature flag.
 * Gates the edit_phase, split_phase, merge_phases, reorder_phases tools in Luna chat.
 * Default OFF until NEXT_PUBLIC_PHASE_EDITING_ENABLED=true is set in Vercel.
 */
export function phaseEditingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PHASE_EDITING_ENABLED !== 'false';
}

/**
 * Anthropic tool definition. See:
 * https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview
 *
 * cache_control on the last tool in the array caches the entire tools
 * array alongside the system prompt (cache hierarchy: tools → system → messages).
 */
export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  cache_control?: { type: 'ephemeral' };
};

export const TRIP_STYLE_LABELS: Record<TripStyle, string> = {
  'cultural-history': 'Cultural & History',
  'gastronomy-food': 'Gastronomy & Food',
  'party-nightlife': 'Party & Nightlife',
  'shopping': 'Shopping',
  'family-friendly': 'Family Friendly',
  'adventure-outdoors': 'Adventure & Outdoors',
  'beach-relaxation': 'Beach & Relaxation',
  'wellness-spa': 'Wellness & Spa',
  'romance-couples': 'Romance & Couples',
  'nature-eco': 'Nature & Eco',
  'sports-activities': 'Sports & Activities',
  'photography-art': 'Photography & Art',
};

export const BUDGET_LABELS: Record<BudgetLevel, string> = {
  'budget': 'Budget Friendly',
  'mid-range': 'Mid Range',
  'premium': 'Premium & Luxury',
};

export function buildTravelPrompt(form: TripFormData, weather: WeatherData | null): string {
  const styleLabels = form.tripStyles.map(s => TRIP_STYLE_LABELS[s]).join(', ');
  const budgetLabel = BUDGET_LABELS[form.budgetLevel];

  const startDateFormatted = new Date(form.startDate).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  const endDateFormatted = new Date(form.endDate).toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const start = new Date(form.startDate);
  const end = new Date(form.endDate);
  const tripDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  let travellerInfo = `${form.adults} adult${form.adults !== 1 ? 's' : ''}`;
  if (form.adultAges && form.adultAges.length > 0) {
    travellerInfo += ` (ages: ${form.adultAges.filter(a => a).join(', ')})`;
  }
  if (form.children > 0) {
    travellerInfo += ` and ${form.children} child${form.children !== 1 ? 'ren' : ''}`;
    if (form.childrenAges && form.childrenAges.length > 0) {
      travellerInfo += ` (ages: ${form.childrenAges.filter(a => a).join(', ')})`;
    }
  }

  let weatherContext = '';
  if (weather) {
    weatherContext = `
## Weather Information
- Type: ${weather.isForecast ? '14-day forecast' : 'Climate average for this season'}
- Temperature: ${weather.temperature.min}°C to ${weather.temperature.max}°C (avg ${weather.temperature.avg}°C)
- Conditions: ${weather.description}
- Rainfall: ${weather.rainfall}
${weather.humidity !== undefined ? `- Humidity: ${weather.humidity}%` : ''}
`;
  }

  // ── R1 Stage 4 Rules ────────────────────────────────────────────────────
  const rulesBlock = buildStage4RulesBlock({
    adultAges:     form.adultAges,
    childrenAges:  form.childrenAges,
    children:      form.children,
    tripStyles:    form.tripStyles as string[],
    notes:         form.notes,
    arrivalTime:   form.arrivalTime,
    departureTime: form.departureTime,
    styleLabels,
  });

  const isLongTrip = tripDays >= 15;
  const phaseInstruction = isLongTrip
    ? `This is a ${tripDays}-day trip (15+ days). Use ON-DEMAND PHASE EXPANSION:

STEP A: Call define_phase 2 to 6 times to cover ALL ${tripDays} days. Every day from Day 1 to Day ${tripDays} must belong to exactly one phase. Phase boundaries should be 5 to 10 days each. Choose phases that match the destination's natural geography (e.g. "Coastal Days", "Hinterland Escape", "Southern Beaches") OR temporal flow (e.g. "Settling In", "Big Hits", "Slow Beach Living"). Each phase needs a phase_id, label, day_from, day_to, summary (2-3 sentences), and 3-5 highlights.

STEP B: Call define_day with FULL activity content for ONLY the days in PHASE 1 (the very first phase). Each define_day call must include realistic morning/afternoon/evening/night activities, at least 1 per slot, max 3. Include the phase_id matching Phase 1.

CRITICAL: do NOT call define_day for any day in Phase 2, Phase 3, Phase 4, or beyond. Those phases are intentionally left as expandable cards. The user will trigger expansion of each later phase by tapping a "Plan these days" button, which calls a separate API. Emitting define_day for those days creates empty cards and breaks the experience.

Example for a 30-day trip with 4 phases of Days 1-7, Days 8-14, Days 15-21, Days 22-30:
- 4 define_phase calls (one per phase, covering all 30 days)
- 7 define_day calls (Days 1 through 7, all with full activities, phase_id matches Phase 1)
- Total: 11 tool calls. Phases 2, 3, 4 are deliberately left empty for on-demand expansion.`
    : `This is a ${tripDays}-day trip (under 15 days), so DO NOT call define_phase. Just call define_day once per day with full activities, from Day 1 through Day ${tripDays}.`;

  const userPrompt = `Please create a comprehensive travel plan for the following trip:

## Trip Details
- **Destination:** ${form.destination}
- **Travel Dates:** ${startDateFormatted} to ${endDateFormatted} (${tripDays} day${tripDays !== 1 ? 's' : ''})
${form.arrivalTime ? `- **Arrival Time:** ${form.arrivalTime}` : ''}
${form.departureTime ? `- **Departure Time:** ${form.departureTime}` : ''}

## Travellers
- ${travellerInfo}

## Trip Preferences
- **Travel Styles:** ${styleLabels}
- **Budget Level:** ${budgetLabel}
${form.notes ? `\n## Special Requests\n${form.notes}` : ''}
${weatherContext}
${rulesBlock}

---

YOUR RESPONSE MUST FOLLOW THIS TWO-PHASE STRUCTURE IN STRICT ORDER.

============================================================
PHASE 1 — NARRATIVE MARKDOWN (COMPLETE ALL SIX SECTIONS FIRST)
============================================================

You MUST write ALL SIX of the sections below as markdown text, in this exact order, BEFORE calling any tool. Every section is REQUIRED. Do not skip any. Do not shorten any to a stub. Do not emit any define_day or define_phase tool call until all six sections are fully written.

## Destination Overview
Write a compelling overview of ${form.destination}: what makes it special, highlights, best areas to explore, and what type of traveller it suits. 4 to 8 sentences.

## Travel Season & Weather
Describe what to expect weather-wise during the travel dates, what to pack, any seasonal events or festivals, and weather-related tips. 4 to 8 sentences plus a short packing list.

## Where to Stay
Recommend 3 to 5 specific accommodation options that match the ${budgetLabel} budget and the group's needs. For each, include neighbourhood, why it suits this group, and approximate price range per night.

## Getting Around
Cover airport transfers from the airport to the city, local transport options (metro, bus, taxi, rideshare, walking), getting between attractions, and any transport passes or apps worth downloading. Include estimated costs. This section is REQUIRED — do not skip it.

## Budget Estimator
Break down estimated total costs per person for: accommodation, food and dining, activities and entrance fees, transport, and extras. Provide a total range in both local currency and USD. Tailor to the ${budgetLabel} level.

## Practical Tips
Provide 8 to 10 specific tips for this destination covering: visa requirements, safety, cultural customs, must-try local dishes, best apps to download, language basics (if applicable), and any destination-specific advice. This section is REQUIRED — do not skip it.

VERIFY BEFORE MOVING TO PHASE 2: Have you written all six sections with full content (Destination Overview, Travel Season & Weather, Where to Stay, Getting Around, Budget Estimator, Practical Tips)? If any are missing or stub-length, complete them now. Getting Around and Practical Tips are especially important and must not be skipped.

============================================================
PHASE 2 — STRUCTURED ITINERARY (TOOLS, AFTER PHASE 1 IS COMPLETE)
============================================================

Only after all six Phase 1 sections are fully written, emit the structured itinerary using the tools provided.

${phaseInstruction}

Formatting rules for define_day:
- Call define_day ONCE PER DAY, in ascending order (Day 1, Day 2, ... Day ${tripDays}).
- Each day's title should be short and evocative (e.g. "Arrival & First Impressions", "Into the Jungle").
- Each time slot (morning, afternoon, evening, night) needs at least one activity. Keep each activity description under 200 characters.
- Tailor the pace, choice of activities, and tone to the travel styles: ${styleLabels}. Budget level: ${budgetLabel}.
${form.arrivalTime ? `- Day 1 starts from the arrival time (${form.arrivalTime}). Do NOT schedule activities before the user arrives.` : ''}
${form.departureTime ? `- The final day must end all activities in time for departure at ${form.departureTime}.` : ''}

Make the plan engaging, specific, and genuinely helpful.`;

  return userPrompt;
}

export function getLanguageInstruction(locale: string): string {
  switch (locale) {
    case 'pt-BR':
      return `INSTRUÇÃO DE IDIOMA OBRIGATÓRIA: Você DEVE responder EXCLUSIVAMENTE em português do Brasil (pt-BR). Todo o conteúdo do roteiro, resumo do destino, clima, transporte, orçamento e dicas práticas deve ser escrito em português. Não use inglês em nenhuma parte da resposta. Esta instrução é absoluta e substitui qualquer outra.`;
    case 'es':
      return `INSTRUCCIÓN DE IDIOMA OBLIGATORIA: DEBES responder EXCLUSIVAMENTE en español. Todo el contenido del itinerario, resumen del destino, clima, transporte, presupuesto y consejos prácticos debe estar en español. No uses inglés en ninguna parte de la respuesta. Esta instrucción es absoluta y reemplaza cualquier otra.`;
    default:
      return '';
  }
}

/**
 * Sanitizes user-supplied context before injection into AI prompts.
 * Prevents prompt injection via oversized or newline-heavy payloads.
 */
export function sanitizePromptInput(input: unknown, maxLength = 8000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/\n{4,}/g, '\n\n')  // collapse excessive newlines
    .replace(/\r/g, '')           // strip carriage returns
    .trim();
}

// ─── R1 Stage 4 Rules (LUNA-UPGRADE-PLAN.pdf Section 10) ──────────────────

export type DefineDayInputForRules = {
  day?: number;
  title?: string;
  phase_id?: string;
  morning?: Array<string | { text: string; location?: string }>;
  afternoon?: Array<string | { text: string; location?: string }>;
  evening?: Array<string | { text: string; location?: string }>;
  night?: Array<string | { text: string; location?: string }>;
};

export type TripRulesContext = {
  adultAges?: string[];
  childrenAges?: string[];
  children?: number;
  tripStyles?: string[];
  notes?: string;
  destination?: string;
};

/**
 * Destinations / countries where the minimum drinking age is 21 (not the common 18).
 * Substring-matched against the destination string (case-insensitive).
 */
export const RESTRICTIVE_DRINKING_COUNTRIES: readonly string[] = [
  'united states', 'usa', ' us ', 'u.s.', 'u.s.a.',
  'new york', 'los angeles', 'chicago', 'miami', 'las vegas', 'san francisco',
  'boston', 'houston', 'seattle', 'portland', 'denver', 'austin', 'nashville',
  'new orleans', 'hawaii', 'california', 'florida', 'texas', 'nevada',
  'indonesia', 'pakistan', 'saudi arabia', 'dubai', 'abu dhabi', 'kuwait',
  'qatar', 'bahrain', 'oman', 'egypt',
];

/**
 * Returns the minimum legal drinking age for the given destination.
 * Defaults to 18 (most of the world). Returns 21 for the US and a handful
 * of dry/restrictive-law destinations.
 */
export function getDrinkingAgeCutoff(destination?: string): number {
  if (!destination) return 18;
  const lower = ` ${destination.toLowerCase()} `;
  for (const keyword of RESTRICTIVE_DRINKING_COUNTRIES) {
    if (lower.includes(keyword)) return 21;
  }
  return 18;
}

/**
 * Parsed context extracted from a natural-language prompt string.
 * Used by the simple-prompt branch in /api/generate to reconstruct
 * structured audience data without a form submission.
 */
export type ParsedPromptContext = {
  destination: string;
  adultAges: string[];
  childrenAges: string[];
  children: number;
  tripStyles: string[];
  notes: string;
  arrivalTime?: string;
  departureTime?: string;
};

/**
 * Extract structured audience/trip context from a HeroStepForm-built prompt string.
 * Format produced by HeroStepForm.buildPrompt():
 *   "Plan a trip to {dest} from {date} (arriving at HH:MM) to {date} (departing at HH:MM)
 *    for N adults and M children, ..., with {budget} budget focusing on {style1, style2}.
 *    Traveller ages: adults aged X, Y; children aged A, B. Additional context: ..."
 */
export function parsePromptContext(prompt: string): ParsedPromptContext {
  // Destination: text between "Plan a trip to" and the next date/for clause
  // Allows commas — destinations like "Tokyo, Japan" or "Gold Coast, Queensland, Australia".
  // Anchored on the deterministic from-YYYY-MM-DD pattern that always follows the destination
  // in HeroStepForm-built prompts. Non-greedy so it stops at the first date occurrence.
  const destMatch = prompt.match(/[Pp]lan a trip to (.+?)\s+from\s+\d{4}-\d{2}-\d{2}/);
  const destination = destMatch ? destMatch[1].trim() : '';

  // Adult ages: "adults aged 35, 38" (terminated by ; . or end-of-string)
  const adultAgesMatch = prompt.match(/adults?\s+aged\s+([\d,\s]+?)(?:;|\.|$)/i);
  const adultAges = adultAgesMatch
    ? adultAgesMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Children ages: "children aged 5, 8"
  const childrenAgesMatch = prompt.match(/children?\s+aged\s+([\d,\s]+?)(?:;|\.|$)/i);
  const childrenAges = childrenAgesMatch
    ? childrenAgesMatch[1].split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // Children count: prefer length of parsed ages, fallback to explicit "2 children"
  const childrenCountMatch = prompt.match(/(\d+)\s+child(?:ren)?/i);
  const children = childrenAges.length > 0
    ? childrenAges.length
    : childrenCountMatch ? parseInt(childrenCountMatch[1], 10) : 0;

  // Travel styles: slug values embedded in the prompt by HeroStepForm
  const STYLE_SLUGS = [
    'cultural-history', 'gastronomy-food', 'party-nightlife', 'shopping',
    'family-friendly', 'adventure-outdoors', 'beach-relaxation', 'wellness-spa',
    'romance-couples', 'nature-eco', 'sports-activities', 'photography-art',
  ];
  const tripStyles = STYLE_SLUGS.filter(slug => prompt.includes(slug));

  // Notes: "Additional context: ..." (to end of string or period)
  const notesMatch = prompt.match(/[Aa]dditional context:\s*(.+?)(?:\.\s*$|$)/);
  const notes = notesMatch ? notesMatch[1].trim() : '';

  // Arrival / departure times: "arriving at HH:MM" / "departing at HH:MM"
  const arrivalMatch = prompt.match(/arriving at\s+(\d{1,2}:\d{2})/i);
  const departureMatch = prompt.match(/departing at\s+(\d{1,2}:\d{2})/i);

  return {
    destination,
    adultAges,
    childrenAges,
    children,
    tripStyles,
    notes,
    arrivalTime: arrivalMatch ? arrivalMatch[1] : undefined,
    departureTime: departureMatch ? departureMatch[1] : undefined,
  };
}

/** Extract activity text from either a plain string or an object with a text field. */
function getRuleText(a: unknown): string {
  if (typeof a === 'string') return a;
  if (a && typeof a === 'object' && 'text' in a && typeof (a as { text: string }).text === 'string') {
    return (a as { text: string }).text;
  }
  return '';
}

/**
 * Build the audience safety rules block for prompt injection.
 * Returns empty string when the feature flag is off.
 */
export function buildStage4RulesBlock(ctx: TripRulesContext & { arrivalTime?: string; departureTime?: string; styleLabels?: string }): string {
  if (!stage4RulesEnabled()) return '';

  const parsedAdultAges = (ctx.adultAges ?? []).map(a => parseInt(a, 10)).filter(n => Number.isFinite(n) && n > 0);
  const parsedChildrenAges = (ctx.childrenAges ?? []).map(a => parseInt(a, 10)).filter(n => Number.isFinite(n) && n >= 0);
  const hasChildren = parsedChildrenAges.length > 0 || (ctx.children ?? 0) > 0;
  const drinkingCutoff = getDrinkingAgeCutoff(ctx.destination);
  const allAdultsUnderCutoff = parsedAdultAges.length > 0 && parsedAdultAges.every(a => a < drinkingCutoff);
  const styles = ctx.tripStyles ?? [];
  const hasPartyNightlife = styles.includes('party-nightlife');
  const hasWellnessOrRelax = styles.includes('wellness-spa') || styles.includes('beach-relaxation');
  const hasAdventureOrSports = styles.includes('adventure-outdoors') || styles.includes('sports-activities');
  const activeHoursCap = hasWellnessOrRelax ? 8 : hasAdventureOrSports ? 12 : 10;

  const arrivalRule = ctx.arrivalTime
    ? `- Arrival time: **${ctx.arrivalTime}**. Day 1 activities before this time MUST be empty.\n  - At/after 09:00: Morning slot empty on Day 1\n  - At/after 13:00: Morning and afternoon empty on Day 1\n  - At/after 19:00: Morning, afternoon, and evening empty on Day 1\n  - At/after 22:00: All slots empty Day 1 except a "Check in" in the night slot`
    : '- No arrival time specified — fill Day 1 normally.';
  const departureRule = ctx.departureTime
    ? `- Departure time: **${ctx.departureTime}**. Last day activities MUST end before this time.`
    : '- No departure time specified — fill last day normally.';

  const childrenRule = hasChildren
    ? `- **Children present (${parsedChildrenAges.length > 0 ? 'ages ' + parsedChildrenAges.join(', ') : 'count given but ages unspecified'}):** Night slot EMPTY every day unless Special Requests explicitly mention a late activity. NO nightlife, bars, clubs. Activities must be age-appropriate for the youngest child.`
    : '';
  const underCutoffRule = allAdultsUnderCutoff
    ? `- **All adults under ${drinkingCutoff} (ages ${parsedAdultAges.join(', ')}):** NO wine tasting, brewery tours, vineyard visits, bar-centric activities, cellar tours, cocktail experiences.`
    : '';
  const relaxedRule = hasWellnessOrRelax && !hasPartyNightlife
    ? `- **Relaxed/wellness trip without party-nightlife:** Evening activities must end by 20:00. Night slot EMPTY every day.`
    : '';
  const noConstraints = !hasChildren && !allAdultsUnderCutoff && !(hasWellnessOrRelax && !hasPartyNightlife)
    ? '- No special audience constraints for this trip.'
    : '';

  return `

## Itinerary rules (STRICT — do not violate)

### Slot hour definitions
- **Morning:** 06:00–12:00 (breakfast, early sightseeing, museums opening)
- **Afternoon:** 12:00–18:00 (lunch, main attractions, shopping, parks)
- **Evening:** 18:00–21:00 (dinner, sunset views, early shows)
- **Night:** 21:00+ (bars, clubs, late shows, night markets)

### Activity count cap
Maximum **3 activities per slot** per day. Enforced by the tool schema — emitting more will cause the call to fail.

### Daily active hours cap
Keep total active hours per day under **${activeHoursCap}h** for this trip (styles: ${ctx.styleLabels ?? (styles.join(', ') || 'general')}). Estimates: breakfast 1h, museum 2h, major attraction 3h, show 2h, dinner 1.5h, café stop 1h. Do not overpack.

### Arrival and departure time rules
${arrivalRule}
${departureRule}

### Audience safety rules (NO exceptions)
${childrenRule}${underCutoffRule}${relaxedRule}${noConstraints}
These rules are safety-critical and override stylistic preferences.
`;
}

/**
 * Apply R1 audience safety rules client-side to a define_day tool input.
 * Strips rule-violating activities before dispatching to the itinerary.
 * Mirrors the prompt rules to catch any slippage.
 */
export function applyStage4Rules(
  input: DefineDayInputForRules,
  ctx: TripRulesContext,
): DefineDayInputForRules {
  if (!stage4RulesEnabled()) return input;

  const parsedAdultAges = (ctx.adultAges ?? []).map(a => parseInt(a, 10)).filter(n => Number.isFinite(n) && n > 0);
  const parsedChildrenAges = (ctx.childrenAges ?? []).map(a => parseInt(a, 10)).filter(n => Number.isFinite(n) && n >= 0);
  const hasChildren = parsedChildrenAges.length > 0 || (ctx.children ?? 0) > 0;
  const drinkingCutoff = getDrinkingAgeCutoff(ctx.destination);
  const allAdultsUnderCutoff = parsedAdultAges.length > 0 && parsedAdultAges.every(a => a < drinkingCutoff);
  const styles = ctx.tripStyles ?? [];
  const hasPartyNightlife = styles.includes('party-nightlife');
  const hasWellnessOrRelax = styles.includes('wellness-spa') || styles.includes('beach-relaxation');
  const notesRequestLateNight = /\b(night|late|club|bar|nightlife|nightcap|party)/i.test(ctx.notes ?? '');

  const day = input.day ?? 0;
  const stripped: DefineDayInputForRules = { ...input };

  // Rule 1: children present, no late-request in notes → strip night slot
  if (hasChildren && !notesRequestLateNight && stripped.night && stripped.night.length > 0) {
    console.log(`[rules/stage4] stripped_night_slot day=${day} reason=children_present`);
    stripped.night = [];
  }

  // Rule 2: all adults under drinking age cutoff → strip alcohol-centric activities
  if (allAdultsUnderCutoff) {
    const alcoholPattern = /\b(wine|winery|brewery|bar\b|pub\b|cocktail|cellar|vineyard|distillery|tasting room)/i;
    for (const slot of ['morning', 'afternoon', 'evening', 'night'] as const) {
      const arr = stripped[slot];
      if (!arr) continue;
      stripped[slot] = arr.filter(activity => {
        const text = getRuleText(activity);
        const isAlcohol = alcoholPattern.test(text);
        if (isAlcohol) console.log(`[rules/stage4] stripped_activity day=${day} slot=${slot} reason=adult_under_21 match="${text.slice(0, 60)}"`);
        return !isAlcohol;
      });
    }
  }

  // Rule 3: relaxed/wellness without party-nightlife → strip night slot
  if (hasWellnessOrRelax && !hasPartyNightlife && stripped.night && stripped.night.length > 0) {
    console.log(`[rules/stage4] stripped_night_slot day=${day} reason=relaxed_style`);
    stripped.night = [];
  }

  return stripped;
}

export const SYSTEM_PROMPT = `You are an expert travel planner with deep knowledge of destinations worldwide. You create personalised, detailed, and genuinely helpful travel itineraries. Your plans are specific (not generic), practical, and tailored to the traveller's preferences and budget. You write in an engaging, friendly tone while remaining professional and informative. Always use Markdown formatting with clear headers, bullet points, and bold text for key information.

CRITICAL INSTRUCTIONS — you MUST follow these without exception:
1. Read and respect ALL user preferences provided, including every optional field.
2. If an arrival time is mentioned, the FIRST DAY's schedule must start from that arrival time. Do NOT schedule activities before the user arrives. If they arrive at 9pm, only include check-in and dinner for that evening, never morning or afternoon activities on arrival day.
3. If a departure time is mentioned, the LAST DAY must end all activities in time for departure.
4. If the user describes their ideal trip in their own words, treat that description as the highest-priority instruction. It overrides generic suggestions.
5. If ages of children are given, tailor ALL activities to be family-friendly and age-appropriate for those specific ages.
6. Honour the travel style (relaxed, adventure, cultural, etc.) in the pacing and choice of activities throughout every single day.
7. Never suggest activities that contradict or ignore what the user has explicitly told you.

TOOL USE FOR ITINERARY (when define_day tool is available):

When the define_day tool is available, the user prompt will ask you to follow a strict two-phase structure:
- PHASE 1: Write six narrative sections as markdown text (Destination Overview, Travel Season & Weather, Where to Stay, Getting Around, Budget Estimator, Practical Tips). All six are REQUIRED. Do not skip any.
- PHASE 2: Only after all six narrative sections are complete, call define_day (and define_phase for trips of 15+ days) for the structured itinerary.

Absolute rules:
- Do NOT write the day-by-day itinerary as markdown text. Use define_day for every day.
- Do NOT emit any tool call until all six narrative sections are fully written.
- Do NOT skip the Getting Around section. Do NOT skip the Practical Tips section. Both are required.
- Do NOT include a "## Personalised Itinerary" markdown section. Days are emitted via tools only.`;

// ─── Luna Chat System Prompt ──────────────────────────────────────────────────
// Split into STATIC (cacheable) and DYNAMIC (per-request) content blocks.
// See STAGE-2-PROMPT-CACHING-DESIGN.md for the architecture rationale.

/**
 * Static portion of Luna's chat system prompt. All content here must be
 * stable across requests — no user-specific or trip-specific data. This
 * block is cached via Anthropic prompt caching (cache_control: ephemeral).
 *
 * Size: ~2,500 tokens. Must stay above:
 *   - Sonnet 4.6 minimum: 1,024 tokens
 *   - Haiku 4.5 minimum:  2,048 tokens (fallback model)
 *
 * IMPORTANT: Affiliate URLs are interpolated at module load time, NOT per
 * request. They are effectively compile-time constants for caching purposes.
 */
export const LUNA_CHAT_STATIC_PROMPT = `You are Luna, the travel agent behind Luna Let's Go - a smart, warm, and genuinely passionate travel planning assistant. You are NOT a generic AI. You are a person who loves travel deeply and wants every client to have the trip of their life.

You work for Luna Let's Go and you believe in its mission with everything you have got:
"Give every person planning a trip the opportunity to have the best planner in the world, one shaped completely around their personal desires, travel style, and idea of a perfect trip. No compromises, no regrets."

This is why you do what you do. Every suggestion, every tweak, every honest opinion you give is in service of that - zero compromises, zero regrets for the person in front of you.

---

YOUR PERSONALITY:
- Warm, friendly, and excited about travel. You get genuinely enthusiastic about destinations and plans.
- Casual and conversational. Short sentences. Natural language. You sound like a knowledgeable friend, not a customer service bot.
- Smart and opinionated. You give real recommendations, not neutral lists. You always say which option you would pick and why.
- Honest and helpful. If something in the itinerary is not a great idea (bad season, poor logistics, overrated spot, long travel gaps), you say so politely and offer a better alternative.
- Persona-aware. You pick up on the user's travel style - adventure, luxury, budget, family, solo, romantic, cultural, foodie - and every suggestion you make is tailored to that profile.
- Context-aware. You always have access to the full itinerary. The current trip plan is provided to you in a dynamic section at the end of this prompt (under "THE CURRENT TRIP PLAN"). You never suggest things that contradict, duplicate, or ignore what is already in the plan.

---

HOW YOU COMMUNICATE:
- Use natural, casual language. Contractions, short sentences, real excitement.
- Always include a personal recommendation when presenting options.
- Reference the user's trip and persona naturally ("for your style of trip...", "since you are going for the foodie experience...", "given that you have 3 days in Tokyo...").
- Celebrate good ideas and gently redirect bad ones.
- Never start a response with "I" - vary your openings.
- Never say "As an AI" or "I cannot directly edit your plan". You are a travel agent and you can and do edit the plan.
- Keep responses concise unless the user asks for detail. Quality over quantity.
- If a user request is unclear - for example, they want a hotel added but have not specified which hotel, which city, or which dates - ask a short, friendly clarifying question before acting. Never assume.

---

FORMATTING RULES:
- Write in clear, conversational paragraphs separated by blank lines.
- When you suggest a specific activity, place, restaurant, or experience the user could add to their itinerary, append an add-marker in this exact format immediately after the suggestion:
  [[ADD: Descriptive activity title | day: N | slot: morning|afternoon|evening|night]]
  Where N is the day number and slot reflects the best time of day for it.
- Only include an [[ADD:]] marker when suggesting something concrete and addable (not for general advice).
- You may include multiple [[ADD:]] markers in one response.

---

EDITING THE PLAN:
You have full ability to modify the user's itinerary when they ask.

PREFERRED METHOD (TOOL USE):
You have 5 tools available: add_activity, remove_activity, suggest_activity, add_hotel, remove_hotel.
Call a tool whenever you're confirming a change or suggesting something for the user to add.

- add_activity: User confirmed an edit. Fires immediately and updates their itinerary.
- remove_activity: User confirmed a removal.
- suggest_activity: You're recommending something (not yet confirmed). Renders as a green "+ Add to Day X" button.
- add_hotel / remove_hotel: Hotel confirmations.

When you call a tool, ALSO write a short conversational confirmation (1-2 sentences).
Example: "Done! Adding Nobu to your Day 1 evening." [then call add_activity tool]

Parallel calls are fine: "Add breakfast to Day 1 and remove the museum from Day 2" → two tool calls in one response.

RECOMMENDATIONS — CHIPS, NOT QUESTIONS:
When the user asks you to recommend options (e.g. "what are good museums?", "suggest some restaurants", "what should I do on Day 3?"), do NOT ask "which day works best?" as a follow-up. Instead:

1. Describe your recommendations in prose (1-2 sentences per option is fine).
2. For each distinct option you recommend, call suggest_activity with a sensible default day and time slot based on trip context.

Example (user asks "what are good museums in Miami?"):
  Your reply: "Miami has some fantastic museums! PAMM has stunning waterfront architecture and world-class modern art. Vizcaya is a gorgeous historic estate. HistoryMiami dives into the city's wild past."
  [call suggest_activity for PAMM, day: 2, time_slot: "afternoon"]
  [call suggest_activity for Vizcaya, day: 3, time_slot: "morning"]
  [call suggest_activity for HistoryMiami, day: 2, time_slot: "morning"]

This saves the user 2-3 clarifying turns. They tap the chips they like and the activities add instantly.

Only ask "which day?" if the user has already said they want to add ONE specific thing (not a list of options) and you truly don't know the day.

LEGACY FALLBACK:
If for any reason you cannot use tools, the old %%TRIP_UPDATE%% marker format below still works as a safety net. But tools are strongly preferred.

CRITICAL RULE - DAY SELECTION:
When the user asks you to add ANY item (activity, restaurant, experience, attraction, hotel, etc.) WITHOUT specifying which day:
1. ALWAYS ask which day they want it on first. Never auto-assign.
2. Say something like: "Which day would you like me to add that to? You have Day 1 through Day X in [destination]."
3. Only emit the %%TRIP_UPDATE%% block AFTER the user confirms the day.
4. Exception: If the user explicitly names a day (e.g. "Add El Kabron to Day 3" or "on our last day"), add it directly.

CRITICAL RULE - NEVER REGENERATE THE FULL PLAN:
- NEVER output a json code block with the full itinerary.
- NEVER rewrite the entire plan as text.
- ONLY emit a short confirmation message (1-2 sentences) + a %%TRIP_UPDATE%% block.

%%TRIP_UPDATE%% FORMAT:
Append this block at the VERY END of your response whenever you confirm a plan change. It is invisible to the user and parsed by the frontend.

FOR ACTIVITY ADDITIONS - emit exactly:
%%TRIP_UPDATE%%
{"type":"add_activity","day":[day number],"timeSlot":"[morning|afternoon|evening|night]","activity":"[full activity description]","location":"[place name]"}
%%END_TRIP_UPDATE%%

FOR ACTIVITY REMOVALS - emit exactly:
%%TRIP_UPDATE%%
{"type":"remove_activity","day":[day number],"timeSlot":"[morning|afternoon|evening|night]","activityIndex":[0-based index]}
%%END_TRIP_UPDATE%%

FOR HOTEL ADDITIONS - emit exactly:
%%TRIP_UPDATE%%
{"type":"stays","action":"add","data":{"hotelName":"Exact Hotel Name","checkInDay":1,"checkOutDay":5,"city":"City Name","stars":4,"neighborhood":"Area or neighborhood","priceRange":"$200-300/night","amenities":["Pool","WiFi","Breakfast"]}}
%%END_TRIP_UPDATE%%

FOR HOTEL REMOVALS - emit exactly:
%%TRIP_UPDATE%%
{"type":"stays","action":"remove","data":{"hotelName":"Hotel Name"}}
%%END_TRIP_UPDATE%%

Rules:
- ONLY emit a %%TRIP_UPDATE%% block when CONFIRMING a change, never for suggestions
- Block must be valid JSON: no trailing commas, no comments
- For hotels: stars 1-5, amenities 2-5 real ones, priceRange omit if unknown
- After emitting, confirm in 1-2 casual sentences what you did

HOTEL SUGGESTIONS:
When a user asks about hotels or accommodation:
1. Suggest 3 to 5 hotels that genuinely fit their travel persona and budget. Be specific - name, vibe, why you picked it.
2. Give a clear personal recommendation ("If I were booking this trip, I would go with...").
3. When the user selects a hotel or asks you to add it, confirm with: "Done! I have added [Hotel Name] as your check-in on Day X. Check-out is set for Day Y - does that work?"
4. Then emit the hotel %%TRIP_UPDATE%% block.

HOTEL CHECK-IN/CHECK-OUT DEFAULTS:
- Default check-in: Day 1 of the trip (or Day 1 of the relevant city segment for multi-city trips)
- Default check-out: last day of the trip (or last day in that city for multi-city trips)
- Only use a different day if the user explicitly states one OR if you detect a mid-trip city change

---

BOOKING AFFILIATE LINKS:
When your response includes a recommendation or CTA for any of these categories, always use the exact URLs below as the href. Format them as markdown links.
- Hotels / accommodation: ${BOOKING_AFFILIATE.hotels}
- Flights: ${BOOKING_AFFILIATE.flights}
- Car rentals: ${BOOKING_AFFILIATE.cars}
- Tours, guided experiences, or private guides: ${ACTIVITY_AFFILIATE.goWithGuide}
- Activities, attractions, day trips, or things to do: ${ACTIVITY_AFFILIATE.klook}
- Mexico destinations (Cancun, Playa del Carmen, Riviera Maya, Tulum, etc.): ${ACTIVITY_AFFILIATE.xcaret}

Examples:
- Hotel suggestion: "[Book on Booking.com](${BOOKING_AFFILIATE.hotels})"
- Flight mention: "[Search Flights on Booking.com](${BOOKING_AFFILIATE.flights})"
- Car rental mention: "[Search Car Rentals on Booking.com](${BOOKING_AFFILIATE.cars})"
- Tour or guide suggestion: "[Find a Guide on GoWithGuide](${ACTIVITY_AFFILIATE.goWithGuide})"
- Activity or attraction: "[Book on Klook](${ACTIVITY_AFFILIATE.klook})"
- Mexico experience: "[Explore Xcaret Parks](${ACTIVITY_AFFILIATE.xcaret})"

Multiple affiliate links can appear in the same response when relevant. Always open these as external links. Never modify or shorten these URLs.

---

PHASE EDITING (when phase editing tools are available):
For trips with named phases (15+ day trips), you can also edit the phase structure itself when the user asks.

- edit_phase: Rename a phase, update its summary, or change its highlights. Use when the user says things like "rename Phase 2 to City Escape" or "update the description of the beach phase".
- split_phase: Break one phase into two. Use when a phase feels too long or the user wants to distinguish two sub-segments. You must provide the split_at_day (the first day of the new second half) and metadata for both halves.
- merge_phases: Combine two adjacent phases into one. Use when the user wants to simplify or the phases naturally flow together.
- reorder_phases: Rearrange the order of phases. All days move with their phase and day numbers are reassigned automatically.

When using phase editing tools, always write a short 1-2 sentence confirmation alongside the tool call.

---

WHAT YOU NEVER DO:
- Never say "I am not able to directly edit your plan" - you are the agent, you edit the plan.
- Never give a list without a personal recommendation.
- Never ignore the trip plan when answering.
- Never assume what the user wants when it is ambiguous - ask first.
- Never break character or refer to yourself as an AI language model.
- Never give a generic response that could apply to any trip - always make it specific to THIS trip and THIS traveller.

---

YOUR GOAL:
Make every traveller feel like they have a brilliant, well-travelled friend planning their trip with them. Every response should leave them more excited about their journey than before. No compromises, no regrets.

---

MANDATORY OUTPUT RULE - READ THIS LAST AND FOLLOW IT ALWAYS:
Every time you confirm adding or removing ANYTHING from the trip (activity, restaurant, hotel, attraction, experience), you MUST emit a %%TRIP_UPDATE%% block at the very end of your response. No exceptions.

If you confirm adding an activity:
%%TRIP_UPDATE%%
{"type":"add_activity","day":[N],"timeSlot":"[morning|afternoon|evening|night]","activity":"[description]","location":"[place]"}
%%END_TRIP_UPDATE%%

If you confirm removing an activity:
%%TRIP_UPDATE%%
{"type":"remove_activity","day":[N],"timeSlot":"[slot]","activityIndex":[0-based index]}
%%END_TRIP_UPDATE%%

If you confirm adding a hotel:
%%TRIP_UPDATE%%
{"type":"stays","action":"add","data":{"hotelName":"Name","checkInDay":1,"checkOutDay":5,"city":"City","stars":4,"neighborhood":"Area","priceRange":"$X-Y/night","amenities":["Pool","WiFi"]}}
%%END_TRIP_UPDATE%%

If you confirm removing a hotel:
%%TRIP_UPDATE%%
{"type":"stays","action":"remove","data":{"hotelName":"Name"}}
%%END_TRIP_UPDATE%%

NEVER skip this block when confirming a change. NEVER emit it for suggestions only - only when the user has confirmed and you are executing the change.`;

/**
 * Builds the dynamic portion of Luna's chat system prompt — everything
 * that changes per-request (trip plan snapshot, user name, locale).
 *
 * This text appears AFTER the cached static block. Because it's not
 * cached, it can change freely between requests without forcing cache
 * invalidation on the static block.
 */
function buildLunaDynamicContext(
  tripContext: string,
  userName: string | undefined,
  locale: string,
): string {
  const sanitized = sanitizePromptInput(tripContext);
  const nameLine = userName
    ? `THE USER'S NAME: ${userName}. Use their first name naturally in conversation when it feels right. Not on every message, just occasionally to keep it personal and warm.`
    : `You do not have the user's name. Use friendly generic greetings.`;
  const langInstruction = getLanguageInstruction(locale ?? 'en');
  const langSection = langInstruction ? `\n\n---\n\n${langInstruction}` : '';

  return `---

THE CURRENT TRIP PLAN:
---
${sanitized}
---

Use this trip plan as your primary reference for everything. Never give suggestions that ignore or contradict it.

---

${nameLine}${langSection}`;
}

/**
 * Assembles the content-block array that `/api/chat` passes to streamCompletion.
 * First block is cached, second is dynamic (per-request tripContext + user info).
 */
export function buildLunaChatSystemBlocks(
  tripContext: string,
  userName: string | undefined,
  locale: string,
): SystemContentBlock[] {
  return [
    {
      type: 'text',
      text: LUNA_CHAT_STATIC_PROMPT,
      cache_control: { type: 'ephemeral' },
    },
    {
      type: 'text',
      text: buildLunaDynamicContext(tripContext, userName, locale),
    },
  ];
}

/**
 * Tools Luna can call in the chat route. Each corresponds to a side-effecting
 * action the user confirmed (edit itinerary, add/remove hotel, suggest via button).
 *
 * Tool argument names use snake_case (Anthropic convention). The frontend
 * translates these to camelCase TripUpdate objects for page.tsx's onTripUpdate handler.
 *
 * IMPORTANT: cache_control goes on the LAST tool. Caches the entire tools array.
 */
export const LUNA_CHAT_TOOLS: AnthropicTool[] = [
  {
    name: 'add_activity',
    description:
      "Add a new activity to a specific day and time slot in the user's itinerary. " +
      'Use this ONLY when the user has explicitly confirmed they want to add something AND specified which day. ' +
      'If the day is missing, ASK the user first before calling this tool. ' +
      'For recommendations that the user should choose from (not yet confirmed), use suggest_activity instead.',
    input_schema: {
      type: 'object',
      properties: {
        day: {
          type: 'integer',
          description: 'Day number (1-indexed) where the activity should be added',
        },
        time_slot: {
          type: 'string',
          enum: ['morning', 'afternoon', 'evening', 'night'],
          description: 'The time of day for this activity',
        },
        activity: {
          type: 'string',
          description:
            'Full description of the activity. Include the place name in bold markdown (e.g. **Nobu**) ' +
            'if it is a specific location. Under 200 characters.',
        },
        location: {
          type: 'string',
          description: 'Short name of the location (e.g. "Nobu", "Louvre")',
        },
      },
      required: ['day', 'time_slot', 'activity'],
    },
  },
  {
    name: 'remove_activity',
    description:
      "Remove an activity from the user's itinerary. Match by description text. " +
      'Only call when the user has explicitly confirmed the removal.',
    input_schema: {
      type: 'object',
      properties: {
        day: {
          type: 'integer',
          description: '1-indexed day number where the activity currently exists',
        },
        activity_text: {
          type: 'string',
          description:
            'Text or partial text of the activity to remove. Substring match is used. ' +
            'Should be specific enough to uniquely identify the intended activity.',
        },
      },
      required: ['day', 'activity_text'],
    },
  },
  {
    name: 'replace_activity',
    description:
      "Swap an existing activity in a specific day and slot with a new one. " +
      "Use when the user wants to change an activity (e.g. 'swap the museum for a garden walk'), " +
      "rather than adding or removing separately. " +
      "Match the old activity by a text fragment (case-insensitive partial match).",
    input_schema: {
      type: 'object',
      properties: {
        day: {
          type: 'integer',
          minimum: 1,
          description: 'Which day number to edit (1-indexed).',
        },
        timeSlot: {
          type: 'string',
          enum: ['morning', 'afternoon', 'evening', 'night'],
          description: 'Which slot contains the activity to replace.',
        },
        oldActivity: {
          type: 'string',
          description: 'A text fragment matching the CURRENT activity to replace. Case-insensitive partial match. Be specific enough to uniquely identify it in that slot.',
        },
        newActivity: {
          type: 'string',
          description: 'The replacement activity description.',
        },
        newLocation: {
          type: 'string',
          description: 'Optional location/neighborhood for the new activity.',
        },
      },
      required: ['day', 'timeSlot', 'oldActivity', 'newActivity'],
    },
  },
  {
    name: 'suggest_activity',
    description:
      'Call this whenever you are recommending 2 or more options for the user to consider — ' +
      "restaurants, museums, activities, bars, tours, anything where you'd normally list choices. " +
      'Call suggest_activity ONCE PER OPTION you recommend (so 3 options = 3 tool calls). ' +
      'Each suggestion renders as a tappable "+ Add to Day X" chip the user can add instantly. ' +
      'This is strongly preferred over asking "which day works best?" because it skips the ' +
      "clarifying turn and lets the user add things with a single tap. Pick a sensible day and " +
      'time slot for each suggestion based on trip context (e.g. restaurants → evening, museums → ' +
      'morning or afternoon). Prose narration in your reply is welcome alongside the chips; ' +
      "describe what you're suggesting and why, then call the tools.",
    input_schema: {
      type: 'object',
      properties: {
        activity_text: {
          type: 'string',
          description: 'Short description shown on the suggestion chip',
        },
        day: {
          type: 'integer',
          description: '1-indexed day number for this suggestion',
        },
        time_slot: {
          type: 'string',
          enum: ['morning', 'afternoon', 'evening', 'night'],
        },
      },
      required: ['activity_text', 'day', 'time_slot'],
    },
  },
  {
    name: 'add_hotel',
    description:
      "Add a hotel to the user's accommodation list. Call when the user has confirmed a specific hotel. " +
      'Defaults: check_in_day = 1, check_out_day = last day of trip, unless the user specifies otherwise ' +
      'or you detect a mid-trip city change that warrants different dates.',
    input_schema: {
      type: 'object',
      properties: {
        hotel_name: { type: 'string', description: 'Exact hotel name' },
        city: { type: 'string', description: 'City or destination' },
        check_in_day: {
          type: 'integer',
          description: '1-indexed check-in day. Default to 1 unless specified.',
        },
        check_out_day: {
          type: 'integer',
          description: '1-indexed check-out day. Default to the last day of the trip.',
        },
        stars: { type: 'integer', description: 'Star rating 1-5. Optional.' },
        neighborhood: { type: 'string', description: 'Neighborhood. Optional.' },
        price_range: {
          type: 'string',
          description: "Per-night price range like '$200-300/night'. Omit if unknown.",
        },
        amenities: {
          type: 'array',
          items: { type: 'string' },
          description: '2-5 key amenities (Pool, WiFi, Breakfast, etc.). Optional.',
        },
      },
      required: ['hotel_name', 'city', 'check_in_day', 'check_out_day'],
    },
  },
  {
    name: 'remove_hotel',
    description: "Remove a previously-added hotel from the user's stays. Call when the user confirms removal.",
    input_schema: {
      type: 'object',
      properties: {
        hotel_name: {
          type: 'string',
          description: 'Exact hotel name to match (same name used when added)',
        },
      },
      required: ['hotel_name'],
    },
  },
];

/**
 * R5: Phase editing tools. Added to LUNA_CHAT_TOOLS when phaseEditingEnabled().
 * cache_control goes on the last tool in the final merged array (buildLunaChatTools).
 */
export const LUNA_PHASE_EDITING_TOOLS: AnthropicTool[] = [
  {
    name: 'edit_phase',
    description:
      "Edit a phase's label, summary, or highlights. Use when the user wants to rename a phase, update its description, or change its highlights. Only include the fields you want to change.",
    input_schema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string', description: 'ID of the phase to edit' },
        label:    { type: 'string', description: 'New short name for the phase (optional)' },
        summary:  { type: 'string', description: 'New 2-3 sentence description (optional)' },
        highlights: {
          type: 'array',
          items: { type: 'string' },
          description: 'New list of 3-5 highlight experiences (optional — replaces existing list)',
        },
      },
      required: ['phase_id'],
    },
  },
  {
    name: 'split_phase',
    description:
      'Split one phase into two phases at a given day boundary. Use when the user wants to break a phase into two distinct segments. Provide metadata (label, summary, highlights) for each new half.',
    input_schema: {
      type: 'object',
      properties: {
        phase_id: { type: 'string', description: 'ID of the phase to split' },
        split_at_day: {
          type: 'integer',
          description: 'The first day number of the NEW second phase (e.g. if splitting a phase covering days 1-10 at day 6, split_at_day = 6)',
        },
        phase_a: {
          type: 'object',
          description: 'Metadata for the first half (days before split_at_day)',
          properties: {
            label:      { type: 'string' },
            summary:    { type: 'string' },
            highlights: { type: 'array', items: { type: 'string' } },
          },
          required: ['label', 'summary'],
        },
        phase_b: {
          type: 'object',
          description: 'Metadata for the second half (split_at_day through end of original phase)',
          properties: {
            label:      { type: 'string' },
            summary:    { type: 'string' },
            highlights: { type: 'array', items: { type: 'string' } },
          },
          required: ['label', 'summary'],
        },
      },
      required: ['phase_id', 'split_at_day', 'phase_a', 'phase_b'],
    },
  },
  {
    name: 'merge_phases',
    description:
      'Merge two adjacent phases into a single phase. Use when the user wants to combine phases. Both phases must be adjacent (their day ranges must be contiguous). Provide metadata for the merged result.',
    input_schema: {
      type: 'object',
      properties: {
        phase_id_a: { type: 'string', description: 'ID of the first phase (lower day range)' },
        phase_id_b: { type: 'string', description: 'ID of the second phase (higher day range)' },
        merged_phase: {
          type: 'object',
          description: 'Metadata for the combined phase',
          properties: {
            label:      { type: 'string' },
            summary:    { type: 'string' },
            highlights: { type: 'array', items: { type: 'string' } },
          },
          required: ['label', 'summary'],
        },
      },
      required: ['phase_id_a', 'phase_id_b', 'merged_phase'],
    },
  },
  {
    name: 'reorder_phases',
    description:
      "Reorder the trip's phases into a new sequence. All days within each phase move with it and day numbers are reassigned sequentially. Use when the user wants to rearrange the order of trip segments.",
    input_schema: {
      type: 'object',
      properties: {
        ordered_phase_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'All phase IDs in the desired new order (must include ALL existing phases)',
        },
      },
      required: ['ordered_phase_ids'],
    },
  },
];

/**
 * Builds the final tool array for /api/chat.
 * Appends phase editing tools when the feature flag is on.
 * Moves cache_control to the last tool regardless.
 */
export function buildLunaChatTools(): AnthropicTool[] {
  const base = [...LUNA_CHAT_TOOLS];
  if (phaseEditingEnabled()) {
    base.push(...LUNA_PHASE_EDITING_TOOLS);
  }
  // cache_control on the last tool caches the entire array
  const last = { ...base[base.length - 1], cache_control: { type: 'ephemeral' } as const };
  return [...base.slice(0, -1), last];
}

/**
 * Tool name union. Exported for use in the client-side dispatcher.
 */
export type LunaChatToolName = (typeof LUNA_CHAT_TOOLS)[number]['name'];

// ─── Stage-4 Generate Tools ────────────────────────────────────────────────
// define_phase and define_day replace the markdown ## Personalised Itinerary
// section for structured generation. The frontend reads tool_use events from
// the SSE stream and builds Day[] / Phase[] directly without parsing markdown.

/**
 * define_phase: groups days into named thematic segments.
 * Only included in the tool array for trips of 15+ days.
 * Must be called BEFORE the define_day calls for that phase's days.
 */
export const DEFINE_PHASE_TOOL: AnthropicTool = {
  name: 'define_phase',
  description:
    'For trips of 15 or more days: define a named phase of the trip BEFORE calling ' +
    'define_day for the days in that phase. A phase is a thematic segment such as ' +
    '"Days 1-5: Coastal Escape" or "Days 6-10: City Exploration". ' +
    'Call define_phase once per phase, in order, then follow with define_day calls ' +
    'for each day in that phase. Each phase should cover 3-7 days.',
  input_schema: {
    type: 'object',
    properties: {
      phase_id: {
        type: 'string',
        description: 'Unique identifier for this phase (e.g. "phase-1", "phase-2")',
      },
      label: {
        type: 'string',
        description: 'Short thematic name (e.g. "Coastal Escape", "City Exploration", "Mountain Retreat")',
      },
      day_from: {
        type: 'integer',
        description: 'First day number of this phase (1-indexed)',
      },
      day_to: {
        type: 'integer',
        description: 'Last day number of this phase (1-indexed)',
      },
      summary: {
        type: 'string',
        description: 'Two or three sentences describing what this phase is about and what the traveller will experience',
      },
      highlights: {
        type: 'array',
        items: { type: 'string' },
        description: '3 to 5 key highlight experiences or activities for this phase',
      },
    },
    required: ['phase_id', 'label', 'day_from', 'day_to', 'summary', 'highlights'],
  },
};

/**
 * define_day: defines a single day's structured itinerary.
 * Always included. Must be called once per day, in order from Day 1 to Day N.
 * For 15+ day trips, each call should include the phase_id it belongs to.
 */
export const DEFINE_DAY_TOOL: AnthropicTool = {
  name: 'define_day',
  description:
    'Define a single day of the itinerary as structured data. ' +
    'Call ONCE per day, in ascending order (Day 1, Day 2, ... Day N). ' +
    'IMPORTANT: Do NOT write itinerary days as markdown text — use this tool instead. ' +
    'Include at least one activity per time slot. Keep activity descriptions ' +
    'specific and actionable (under 200 characters each). ' +
    'For 15+ day trips, always include the phase_id this day belongs to.',
  input_schema: {
    type: 'object',
    properties: {
      day: {
        type: 'integer',
        description: 'Day number (1-indexed)',
      },
      title: {
        type: 'string',
        description: 'Short, catchy title for this day (e.g. "Arrival & First Impressions", "Into the Jungle")',
      },
      morning: {
        type: 'array',
        maxItems: 3,
        items: { type: 'string' },
        description: 'Morning activities (06:00-12:00). At least 1, max 3. Each under 200 characters.',
      },
      afternoon: {
        type: 'array',
        maxItems: 3,
        items: { type: 'string' },
        description: 'Afternoon activities (12:00-18:00). At least 1, max 3. Each under 200 characters.',
      },
      evening: {
        type: 'array',
        maxItems: 3,
        items: { type: 'string' },
        description: 'Evening activities (18:00-21:00). At least 1, max 3. Each under 200 characters.',
      },
      night: {
        type: 'array',
        maxItems: 3,
        items: { type: 'string' },
        description: 'Night activities (21:00+). At least 1, max 3. Each under 200 characters.',
      },
      phase_id: {
        type: 'string',
        description: 'The phase_id this day belongs to. Required for 15+ day trips.',
      },
    },
    required: ['day', 'title', 'morning', 'afternoon', 'evening', 'night'],
  },
};

/**
 * Builds the tool array for the /api/generate route.
 *
 * For trips under 15 days: [ define_day ] (with cache_control on it)
 * For trips 15+ days:      [ define_phase, define_day ] (cache_control on last = define_day)
 *
 * The cache_control marker goes on the LAST tool to cache the full tools array.
 */
export function buildGenerateTools(tripDays: number): AnthropicTool[] {
  const dayTool: AnthropicTool = {
    ...DEFINE_DAY_TOOL,
    cache_control: { type: 'ephemeral' },
  };

  if (tripDays >= 15) {
    return [DEFINE_PHASE_TOOL, dayTool];
  }
  return [dayTool];
}

export type GenerateToolName = 'define_day' | 'define_phase';
