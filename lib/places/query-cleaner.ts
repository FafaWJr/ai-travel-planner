// lib/places/query-cleaner.ts
// Cleans AI-generated activity text into a searchable place name for Google Places.

const STRIP_PREFIXES: RegExp[] = [
  /^check[\s-]*in[\s:]+(?:at\s+)?/i,
  /^check[\s-]*out[\s:]+(?:from\s+)?/i,
  /^visit[\s:]+/i,
  /^explore[\s:]+/i,
  /^head\s+to[\s:]+/i,
  /^travel\s+to[\s:]+/i,
  /^transfer\s+to[\s:]+/i,
  /^arrive\s+at[\s:]+/i,
  /^depart\s+from[\s:]+/i,
  /^dinner\s+at[\s:]+/i,
  /^lunch\s+at[\s:]+/i,
  /^breakfast\s+at[\s:]+/i,
  /^brunch\s+at[\s:]+/i,
  /^eat\s+at[\s:]+/i,
  /^dine\s+at[\s:]+/i,
  /^drinks?\s+at[\s:]+/i,
  /^stop\s+(?:by\s+)?at[\s:]+/i,
  /^tour\s+(?:of\s+)?/i,
];

const GENERIC_PATTERNS: RegExp[] = [
  /^(arrival|arrive|depart|departure|transit|transfer|travel|fly|flight)\b/i,
  /^(check[\s-]?in|check[\s-]?out)\b/i,
  /^(free\s+(time|afternoon|morning|evening|day)|leisure|relax|rest\s+day)\b/i,
  /^(pack|unpack|prepare|get\s+ready)\b/i,
  /^(morning|afternoon|evening|night)\s+(free|leisure|at\s+hotel)\b/i,
  /^(return|head\s+back|make\s+your\s+way)\b/i,
  /^(overnight|night\s+train|night\s+bus|sleeper)\b/i,
];

/** Extract the title from activity text (first line) and clean it for Places API search. */
export function cleanActivityQuery(activityText: string): string {
  const title = activityText.split('\n')[0].trim();

  // Strip markdown bold/italic markers
  let cleaned = title.replace(/\*\*/g, '').replace(/\*/g, '').trim();

  // Strip leading action prefixes ("Dinner at", "Visit", "Check-in:", etc.)
  for (const prefix of STRIP_PREFIXES) {
    const stripped = cleaned.replace(prefix, '').trim();
    if (stripped.length > 2) {
      cleaned = stripped;
      break;
    }
  }

  // Strip parenthetical suffixes but keep their content
  // "Kinkaku-ji (Golden Pavilion)" → "Kinkaku-ji Golden Pavilion"
  cleaned = cleaned.replace(/\s*\(([^)]+)\)\s*$/, ' $1').trim();

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

/** Returns true if the query looks like a real resolvable place name. */
export function isResolvableQuery(query: string): boolean {
  if (!query || query.length < 3) return false;
  if (isGenericActivity(query)) return false;
  // Must start with an uppercase letter (proper noun heuristic)
  if (!/^[A-ZÀ-ÖØ-Þ]/.test(query)) return false;
  return true;
}

/** Returns true for activity titles that are not specific places (transit, free time, etc.). */
export function isGenericActivity(query: string): boolean {
  return GENERIC_PATTERNS.some(re => re.test(query));
}
