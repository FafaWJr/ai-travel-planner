/**
 * Serialize EditableItinerary Day[] (and optional Phase[]) back into the
 * markdown format expected by the rest of the plan page (section extraction,
 * PDF export, trip context for Luna chat, etc.).
 *
 * This is the inverse of parseItinerary() in EditableItinerary.tsx.
 * It is used when a trip was generated via structured tool calls (Stage 4+)
 * and needs to be converted back to markdown for:
 *   - The "Personalised Itinerary" section displayed outside the itinerary tab
 *   - Luna's tripContext (which still expects a markdown representation)
 *   - The saved trip plan field
 */

import type { Day } from '@/components/EditableItinerary';
import type { Phase } from '@/types';

const SLOT_HEADER: Record<string, string> = {
  morning:   '**Morning:**',
  afternoon: '**Afternoon:**',
  evening:   '**Evening:**',
  night:     '**Night:**',
};

/**
 * Converts a Day[] (and optional Phase[]) to Markdown text representing the
 * "## Personalised Itinerary" section.
 *
 * Format mirrors what the model was previously generating directly:
 * ### Day N: Title
 * **Morning:**
 * - Activity text
 * **Afternoon:**
 * - Activity text
 * ...
 */
export function serializeDaysToMarkdown(days: Day[], phases?: Phase[]): string {
  if (days.length === 0) return '';

  const lines: string[] = ['## Personalised Itinerary', ''];

  // Build phase range map for quick lookup: dayNumber → phase label
  const phaseForDay = new Map<number, string>();
  if (phases && phases.length > 0) {
    for (const phase of phases) {
      for (let d = phase.dayFrom; d <= phase.dayTo; d++) {
        phaseForDay.set(d, phase.label);
      }
    }
  }

  let lastPhaseLabel: string | undefined;

  for (const day of days) {
    const phaseLabel = phaseForDay.get(day.number);

    // Emit phase header when phase changes (for multi-phase trips)
    if (phaseLabel && phaseLabel !== lastPhaseLabel) {
      lines.push(`### Phase: ${phaseLabel}`, '');
      lastPhaseLabel = phaseLabel;
    }

    lines.push(`### Day ${day.number}: ${day.title}`, '');

    const slots: Array<'morning' | 'afternoon' | 'evening' | 'night'> = [
      'morning', 'afternoon', 'evening', 'night',
    ];

    for (const slot of slots) {
      const acts = day.activities.filter(a => a.slot === slot && a.status !== 'declined');
      if (acts.length === 0) continue;
      lines.push(SLOT_HEADER[slot]);
      for (const act of acts) {
        lines.push(`- ${act.text}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd();
}
