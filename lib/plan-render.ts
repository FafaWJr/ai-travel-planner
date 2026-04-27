/**
 * Pure markdown-to-HTML rendering helpers used by the Plan page.
 *
 * These functions were originally co-located with the Plan page in
 * app/[locale]/plan/page.tsx. They are pure (no React, no DOM, no
 * client-only APIs) and have been extracted here so server-side
 * scripts (like the smoke test in scripts/smoke-plan-render.mjs)
 * can import them without dragging in the 'use client' page module.
 *
 * Behavior is identical to the originals. Do not change the markdown
 * grammar or the emitted HTML shape without also updating:
 *   - The Plan page rendering at app/[locale]/plan/page.tsx
 *   - The sanitize allowlist in PLAN_SANITIZE_CONFIG below
 *   - The smoke assertions in scripts/smoke-plan-render.mjs
 *
 * @see app/[locale]/plan/page.tsx for the consumer
 * @see scripts/smoke-plan-render.mjs for the contract test
 * @see docs/specs/collab/02-recovery-plan-april-27-regressions.md for context
 */

import type sanitizeHtml from 'sanitize-html';

/**
 * Section header keywords used by extractSection to match a tab id (e.g.
 * "weather") to its corresponding ## heading in the AI-generated markdown.
 * Internal to this module; the Plan page uses a separate SECTIONS constant
 * (with Lucide Icon refs) for tab rendering.
 */
const SECTION_KEYWORDS: Record<string, string[]> = {
  overview:      ['Destination Overview', 'Overview'],
  weather:       ['Travel Season', 'Weather', 'Season & Weather'],
  itinerary:     ['Itinerary', 'Day-by-Day', 'Personalised Itinerary'],
  accommodation: ['Where to Stay', 'Accommodation', 'Stay'],
  transport:     ['Getting Around', 'Transport', 'Getting there'],
  budget:        ['Budget', 'Cost', 'Estimator'],
  tips:          ['Practical Tips', 'Tips', 'Practical'],
};

/**
 * id → label map used by extractSection's fallback for a section the AI
 * skipped. Internal to this module. Mirrors the labels in page.tsx's
 * SECTIONS constant; if either changes, both should change together.
 */
const SECTION_LABEL_MAP: Record<string, string> = {
  overview:      'Overview',
  weather:       'Weather',
  itinerary:     'Itinerary',
  accommodation: 'Stays',
  transport:     'Transport',
  budget:        'Budget',
  tips:          'Tips',
};

/**
 * sanitize-html configuration for plan content.
 *
 * markdownToHtml and inlineMd emit HTML with rich inline styles that
 * establish the navy-headings, orange-bullet visual treatment of the
 * Plan page. sanitize-html strips style attributes by default. This
 * config explicitly allows the style attribute on every tag markdownToHtml
 * emits, plus the data-place attribute used by inlineMd for place-name
 * hover affordances.
 *
 * The allowedStyles allowlist is intentionally wide (covers every CSS
 * property markdownToHtml currently uses) but values are constrained to
 * safe primitives: hex colors, rgb/rgba, pixel/em/rem/percent units,
 * Poppins/Inter/sans-serif/monospace font families, and a fixed keyword
 * set. URLs in style values are never allowed (no url() or @import).
 *
 * XSS posture preserved: <script>, <iframe>, <object>, <embed>, on*
 * event handlers, javascript: and data: URIs are still rejected by
 * sanitize-html's default allowedTags / allowedSchemes.
 */
export const PLAN_SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'div', 'span', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'em', 'b', 'i', 'u', 'code', 'pre',
    'a',
    'blockquote',
  ],
  allowedAttributes: {
    '*': ['style'],
    'a': ['href', 'target', 'rel', 'style'],
    'strong': ['style', 'data-place'],
    'span': ['style', 'data-place'],
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-fA-F]+$/, /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/],
      'background': [/^#(0x)?[0-9a-fA-F]+$/, /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/],
      'background-color': [/^#(0x)?[0-9a-fA-F]+$/, /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/],
      'font-family': [/^['"]?[\w\s\-,]+['"]?(\s*,\s*['"]?[\w\s\-]+['"]?)*$/],
      'font-weight': [/^(\d+|normal|bold|lighter|bolder)$/],
      'font-size': [/^[\d.]+(px|em|rem|%|pt)$/],
      'line-height': [/^[\d.]+(px|em|rem|%)?$/],
      'text-transform': [/^(none|uppercase|lowercase|capitalize)$/],
      'text-align': [/^(left|right|center|justify)$/],
      'text-decoration': [/^(none|underline|line-through|overline)(\s+[\w\s#(),.]+)*$/],
      'letter-spacing': [/^-?[\d.]+(px|em|rem)$/],
      'margin': [/^(-?[\d.]+(px|em|rem|%)|0|auto)(\s+(-?[\d.]+(px|em|rem|%)|0|auto)){0,3}$/],
      'margin-top': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'margin-right': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'margin-bottom': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'margin-left': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'padding': [/^([\d.]+(px|em|rem|%)|0)(\s+([\d.]+(px|em|rem|%)|0)){0,3}$/],
      'padding-top': [/^([\d.]+(px|em|rem|%)|0)$/],
      'padding-right': [/^([\d.]+(px|em|rem|%)|0)$/],
      'padding-bottom': [/^([\d.]+(px|em|rem|%)|0)$/],
      'padding-left': [/^([\d.]+(px|em|rem|%)|0)$/],
      'border': [/^[\d.]+px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))$/],
      'border-top': [/^[\d.]+px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))$/],
      'border-right': [/^[\d.]+px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))$/],
      'border-bottom': [/^[\d.]+px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))$/],
      'border-left': [/^[\d.]+px\s+(solid|dashed|dotted|double|none)\s+(#[0-9a-fA-F]+|rgba?\([^)]+\))$/],
      'border-radius': [/^[\d.]+(px|em|rem|%)(\s+[\d.]+(px|em|rem|%)){0,3}$/],
      'display': [/^(none|block|inline|inline-block|flex|inline-flex|grid|inline-grid)$/],
      'position': [/^(static|relative|absolute|fixed|sticky)$/],
      'top': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'right': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'bottom': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'left': [/^(-?[\d.]+(px|em|rem|%)|0|auto)$/],
      'width': [/^([\d.]+(px|em|rem|%)|auto)$/],
      'height': [/^([\d.]+(px|em|rem|%)|auto)$/],
      'min-width': [/^([\d.]+(px|em|rem|%)|0|auto)$/],
      'min-height': [/^([\d.]+(px|em|rem|%)|0|auto)$/],
      'max-width': [/^([\d.]+(px|em|rem|%)|none)$/],
      'list-style': [/^(none|disc|circle|square|decimal)(\s+(inside|outside))?$/],
      'list-style-type': [/^(none|disc|circle|square|decimal)$/],
      'align-items': [/^(flex-start|flex-end|center|stretch|baseline)$/],
      'justify-content': [/^(flex-start|flex-end|center|space-between|space-around|space-evenly)$/],
      'cursor': [/^(default|pointer|text|move|grab|grabbing|not-allowed|wait)$/],
      'transition': [/^[\w\s,()-.]+$/],
      'counter-reset': [/^[\w-]+$/],
      'overflow': [/^(visible|hidden|scroll|auto)$/],
      'white-space': [/^(normal|nowrap|pre|pre-wrap|pre-line)$/],
      'opacity': [/^[01]?\.?\d+$/],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {},
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  allowProtocolRelative: false,
  enforceHtmlBoundary: true,
};

/* ── Extract one section from the plan markdown ── */
export function extractSection(plan: string, sectionId: string, isStreaming: boolean = false): string {
  if (!plan) return '';

  // Parse all ## sections into an array, stripping emojis from headers for matching
  const allSections: { rawHeader: string; cleanHeader: string; content: string[] }[] = [];
  const lines = plan.split('\n');
  let current: { rawHeader: string; cleanHeader: string; content: string[] } | null = null;

  for (const line of lines) {
    if (/^##\s/.test(line)) {
      if (current) allSections.push(current);
      const raw = line.replace(/^##\s+/, '').trim();
      // Strip emojis and non-alpha chars (except spaces and &) for matching
      const clean = raw.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, '')
                       .replace(/[^a-zA-Z0-9\s&]/g, ' ')
                       .replace(/\s+/g, ' ').trim().toLowerCase();
      current = { rawHeader: raw, cleanHeader: clean, content: [line] };
    } else if (current) {
      current.content.push(line);
    }
  }
  if (current) allSections.push(current);

  if (allSections.length === 0) return plan;

  const keywords = SECTION_KEYWORDS[sectionId] || [];
  const match = allSections.find(s =>
    keywords.some(k => s.cleanHeader.includes(k.toLowerCase()))
  );

  if (match) return match.content.join('\n').trim();

  // overview fallback: first section or full plan
  if (sectionId === 'overview') return allSections[0]?.content.join('\n').trim() || plan;

  const label = SECTION_LABEL_MAP[sectionId] || sectionId;

  // During streaming: section hasn't arrived yet. Return sentinel for loading UI.
  if (isStreaming) return `__STREAMING_PLACEHOLDER__${label}`;

  // After streaming: genuine fallback for a section Luna skipped.
  return `## ${label}\n\n*This section wasn't included in the generated plan. Use the AI chat on the right to ask for ${label.toLowerCase()} details!*`;
}

/* ── Minimal markdown → styled HTML ── */
export function inlineMd(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, (_, t) => {
      // Tag bold proper nouns as place hovers (starts with capital, not a label like "Morning:")
      const isPlace = /^[A-Z]/.test(t) && !t.endsWith(':') && !/^(morning|afternoon|evening|night|day\s*\d|note|tip|option|important|total|budget|price|cost|recommended|optional|estimated|approximate|include)/i.test(t);
      if (isPlace) {
        const escaped = t.replace(/"/g, '&quot;');
        return `<strong data-place="${escaped}" style="cursor:pointer;border-bottom:1.5px dashed rgba(0,68,123,0.40);color:#00447B;font-weight:700;transition:color 0.15s">${t}</strong>`;
      }
      return `<strong>${t}</strong>`;
    })
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:rgba(0,68,123,0.07);padding:1px 6px;border-radius:4px;font-size:0.92em;font-family:monospace">$1</code>');
}

export function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const parts: string[] = [];
  let inUl = false, inOl = false;

  const closeList = () => {
    if (inUl) { parts.push('</ul>'); inUl = false; }
    if (inOl) { parts.push('</ol>'); inOl = false; }
  };

  const UL_STYLE = `style="margin:10px 0 10px 20px;padding:0;list-style:none"`;
  const OL_STYLE = `style="margin:10px 0 10px 20px;padding:0;list-style:none;counter-reset:li"`;
  const LI_STYLE = `style="position:relative;padding:4px 0 4px 18px;font-size:15px;line-height:1.65;color:#333"`;

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (/^#{4}\s/.test(line)) {
      closeList();
      parts.push(`<h4 style="font-family:'Poppins',sans-serif;font-weight:600;font-size:14px;color:#00447B;text-transform:uppercase;letter-spacing:.5px;margin:20px 0 6px">${inlineMd(line.replace(/^#{4}\s+/, ''))}</h4>`);
    } else if (/^#{3}\s/.test(line)) {
      closeList();
      const h3Text = line.replace(/^#{3}\s+/, '');
      const isDay = /^day\s+\d+/i.test(h3Text);
      if (isDay) {
        parts.push(`<div style="margin:28px 0 0;padding-top:24px;border-top:2px solid rgba(0,68,123,0.12)"><span style="display:inline-block;background:#00447B;color:#fff;font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;padding:4px 14px;border-radius:100px;margin-bottom:10px">${inlineMd(h3Text)}</span></div>`);
      } else {
        parts.push(`<h3 style="font-family:'Poppins',sans-serif;font-weight:600;font-size:17px;color:#111;margin:24px 0 8px">${inlineMd(h3Text)}</h3>`);
      }
    } else if (/^#{2}\s/.test(line)) {
      closeList();
      parts.push(`<h2 style="font-family:'Poppins',sans-serif;font-weight:700;font-size:22px;color:#00447B;margin:32px 0 14px;padding-bottom:10px;border-bottom:2px solid rgba(0,68,123,0.10)">${inlineMd(line.replace(/^#{2}\s+/, ''))}</h2>`);
    } else if (/^[-*•]\s/.test(line)) {
      if (!inUl) { closeList(); parts.push(`<ul ${UL_STYLE}>`); inUl = true; }
      parts.push(`<li ${LI_STYLE}><span style="position:absolute;left:0;top:10px;width:6px;height:6px;border-radius:50%;background:#FF8210;display:inline-block"></span>${inlineMd(line.replace(/^[-*•]\s+/, ''))}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (!inOl) { closeList(); parts.push(`<ol ${OL_STYLE}>`); inOl = true; }
      parts.push(`<li ${LI_STYLE} style="position:relative;padding:4px 0 4px 28px;font-size:15px;line-height:1.65;color:#333"><span style="position:absolute;left:0;top:5px;width:20px;height:20px;border-radius:50%;background:#00447B;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif">${line.match(/^\d+/)![0]}</span>${inlineMd(line.replace(/^\d+\.\s+/, ''))}</li>`);
    } else if (line.trim() === '') {
      closeList();
      parts.push('<div style="height:6px"></div>');
    } else {
      closeList();
      const dayBold = line.match(/^\*\*(Day\s+\d+[^*]*)\*\*/i);
      if (dayBold) {
        parts.push(`<div style="margin:28px 0 0;padding-top:24px;border-top:2px solid rgba(0,68,123,0.12)"><span style="display:inline-block;background:#00447B;color:#fff;font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;padding:4px 14px;border-radius:100px;margin-bottom:10px">${dayBold[1]}</span></div>`);
      } else {
        parts.push(`<p style="font-size:15px;line-height:1.75;color:#333;margin:4px 0">${inlineMd(line)}</p>`);
      }
    }
  }
  closeList();
  // Remove leading empty spacer if first child
  return parts.join('').replace(/^(<div style="height:6px"><\/div>)+/, '');
}
