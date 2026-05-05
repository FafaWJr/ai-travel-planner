#!/usr/bin/env node
/**
 * smoke-plan-render.mjs
 *
 * Contract test for the Plan markdown rendering pipeline. Runs at build
 * time (via package.json `prebuild` hook) and on demand via
 * `npm run smoke:render`.
 *
 * Validates two contracts:
 *   1. Inline styles emitted by markdownToHtml survive sanitizeHtml
 *      with PLAN_SANITIZE_CONFIG. This is the contract that broke in
 *      R1's regression and was restored by the R1 fix. If this contract
 *      breaks again (default-stripped, allowlist regex too tight,
 *      config not applied at call site, etc.), this smoke catches it.
 *   2. XSS payloads continue to be rejected. Defense in depth: any
 *      future change to the allowlist that accidentally permits
 *      <script>, on*, or javascript: URIs fails this smoke.
 *
 * Exits 0 on success, 1 on any failure. Designed to be safe to run
 * in any CI/CD environment without external dependencies. Runs
 * against the locally installed sanitize-html, no network calls.
 *
 * Requires Node 22.6+ for --experimental-strip-types so the .ts source
 * can be imported directly (Vercel build environment is Node 22+).
 *
 * @see lib/plan-render.ts for the symbols under test
 * @see app/[locale]/plan/page.tsx for the production consumer
 * @see docs/specs/collab/02-recovery-plan-april-27-regressions.md for context
 */

import sanitizeHtml from 'sanitize-html';
import {
  markdownToHtml,
  PLAN_SANITIZE_CONFIG,
} from '../lib/plan-render.ts';

let failures = 0;
let assertions = 0;

function assert(cond, label, detail) {
  assertions++;
  if (cond) {
    process.stdout.write(`  PASS ${label}\n`);
  } else {
    failures++;
    process.stdout.write(`  FAIL ${label}\n`);
    if (detail !== undefined) {
      process.stdout.write(`    detail: ${detail}\n`);
    }
  }
}

function section(name) {
  process.stdout.write(`\n[${name}]\n`);
}

// ─────────────────────────────────────────────────────────────────
// Test 1: positive markers (the R1 contract)
// ─────────────────────────────────────────────────────────────────

section('Inline-style preservation contract (R1)');

const sampleMarkdown = `## Travel Season & Weather

July falls squarely in Bali's dry season (April-October).

- Temperature: 26-30°C during the day
- Humidity: Lower than wet season, more comfortable
- Rainfall: Minimal, occasional brief showers

### Photography Conditions

Clear skies most days, with occasional afternoon clouds. Visit **Uluwatu** for sunset shots.

#### IMPORTANT NOTE

Pack lightweight rain protection just in case.

1. Book hotels in advance for July
2. Reserve restaurants 1-2 weeks ahead
3. Confirm transport before arrival
`;

const rendered = markdownToHtml(sampleMarkdown);
const sanitized = sanitizeHtml(rendered, PLAN_SANITIZE_CONFIG);

// H2 navy color marker
assert(
  /<h2[^>]*style="[^"]*color:#00447B[^"]*"/i.test(sanitized),
  'H2 retains navy color #00447B in style attribute',
  sanitized.match(/<h2[^>]{0,200}/i)?.[0]
);

// H2 navy underline marker
assert(
  /<h2[^>]*border-bottom:2px solid rgba\(0,68,123,0\.10\)/i.test(sanitized),
  'H2 retains navy border-bottom underline',
  sanitized.match(/<h2[^>]{0,250}/i)?.[0]
);

// H2 vertical margin marker
assert(
  /<h2[^>]*margin:32px 0 14px/i.test(sanitized),
  'H2 retains margin:32px 0 14px',
  sanitized.match(/<h2[^>]{0,250}/i)?.[0]
);

// H3 retains its style
assert(
  /<h3[^>]*color:#111/i.test(sanitized),
  'H3 retains color:#111 in style attribute',
  sanitized.match(/<h3[^>]{0,200}/i)?.[0]
);

// H4 navy uppercase marker
assert(
  /<h4[^>]*color:#00447B/i.test(sanitized) && /<h4[^>]*text-transform:uppercase/i.test(sanitized),
  'H4 retains navy color + uppercase text-transform',
  sanitized.match(/<h4[^>]{0,250}/i)?.[0]
);

// Paragraph margins marker
assert(
  /<p[^>]*style="[^"]*margin:4px 0/i.test(sanitized),
  'P retains margin:4px 0 in style attribute',
  sanitized.match(/<p[^>]{0,200}/i)?.[0]
);

// Paragraph color marker
assert(
  /<p[^>]*color:#333/i.test(sanitized),
  'P retains color:#333 in style attribute',
  sanitized.match(/<p[^>]{0,200}/i)?.[0]
);

// Bullet list orange-dot inner span (this is the most distinctive marker)
assert(
  /<li[^>]*>\s*<span[^>]*background:#FF8210/i.test(sanitized),
  'LI starts with inner SPAN containing orange #FF8210 background',
  sanitized.match(/<li[^>]{0,400}/i)?.[0]
);

// Numbered list inner span has navy background (different from bullets)
assert(
  /<li[^>]*>\s*<span[^>]*background:#00447B/i.test(sanitized),
  'Numbered LI starts with inner SPAN containing navy #00447B background',
  sanitized.match(/<ol[\s\S]{0,500}/i)?.[0]
);

// Bold proper noun renders as plain <strong> — place-link styling is NOT added by
// markdownToHtml (the plan renderer). PlacePreviewTrigger React components in
// EditableItinerary handle place previews for the Itinerary tab instead.
assert(
  /<strong>Uluwatu<\/strong>/i.test(sanitized),
  'Bold proper noun "Uluwatu" renders as plain <strong> without data-place',
  sanitized.match(/<strong[^>]{0,200}/i)?.[0]
);

assert(
  !/<strong[^>]*data-place="Uluwatu"/i.test(sanitized),
  'Bold proper noun "Uluwatu" has no data-place attribute (plan renderer no longer adds link styling)',
  sanitized.match(/<strong[^>]{0,200}/i)?.[0]
);

// UL has correct margin (margin:10px 0 10px 20px) and list-style:none
assert(
  /<ul[^>]*style="[^"]*margin:10px 0 10px 20px[^"]*list-style:none/i.test(sanitized),
  'UL retains margin and list-style:none',
  sanitized.match(/<ul[^>]{0,250}/i)?.[0]
);

// ─────────────────────────────────────────────────────────────────
// Test 2: negative markers (XSS still blocked)
// ─────────────────────────────────────────────────────────────────

section('XSS protection contract (preserved through R1 changes)');

const xssSamples = [
  {
    label: 'script tag stripped',
    input: 'Hello <script>alert(1)</script> world',
    mustNotContain: '<script',
  },
  {
    label: 'iframe stripped',
    input: 'Test <iframe src="evil.com"></iframe> end',
    mustNotContain: '<iframe',
  },
  {
    label: 'object tag stripped',
    input: 'Test <object data="evil"></object> end',
    mustNotContain: '<object',
  },
  {
    label: 'embed tag stripped',
    input: 'Test <embed src="evil"> end',
    mustNotContain: '<embed',
  },
  {
    label: 'onclick attribute stripped',
    input: '<p onclick="alert(1)" style="color:#00447B">click</p>',
    mustNotContain: 'onclick',
  },
  {
    label: 'onerror attribute stripped',
    input: '<p onerror="alert(1)" style="color:#00447B">err</p>',
    mustNotContain: 'onerror',
  },
  {
    label: 'onmouseover attribute stripped',
    input: '<p onmouseover="alert(1)" style="color:#00447B">hover</p>',
    mustNotContain: 'onmouseover',
  },
  {
    label: 'onload attribute stripped',
    input: '<p onload="alert(1)" style="color:#00447B">load</p>',
    mustNotContain: 'onload',
  },
  {
    label: 'javascript: href stripped',
    input: '<a href="javascript:alert(1)" style="color:#00447B">click</a>',
    mustNotContain: 'javascript:',
  },
  {
    label: 'url() in style value stripped',
    input: '<p style="background:url(javascript:alert(1))">test</p>',
    mustNotContain: 'url(',
  },
  {
    label: 'expression() in style value stripped',
    input: '<p style="width:expression(alert(1))">test</p>',
    mustNotContain: 'expression(',
  },
  {
    label: '@import in style value stripped',
    input: '<p style="@import url(evil.css)">test</p>',
    mustNotContain: '@import',
  },
  {
    label: 'data: URI in href stripped',
    input: '<a href="data:text/html,<script>alert(1)</script>" style="color:#00447B">click</a>',
    mustNotContain: 'data:',
  },
  {
    label: 'meta tag stripped',
    input: '<meta http-equiv="refresh" content="0;url=evil"> hello',
    mustNotContain: '<meta',
  },
  {
    label: 'style tag stripped',
    input: 'Hello <style>body{display:none}</style> world',
    mustNotContain: '<style',
  },
  {
    label: 'svg with onload stripped',
    input: '<svg onload="alert(1)"><circle r="40"/></svg>',
    mustNotContain: 'onload',
  },
];

for (const { label, input, mustNotContain } of xssSamples) {
  const out = sanitizeHtml(input, PLAN_SANITIZE_CONFIG);
  const ok = !out.toLowerCase().includes(mustNotContain.toLowerCase());
  assert(ok, label, ok ? undefined : `output: ${out}`);
}

// ─────────────────────────────────────────────────────────────────
// Test 3: end-to-end pipeline (markdownToHtml -> sanitizeHtml)
// ─────────────────────────────────────────────────────────────────

section('End-to-end pipeline');

// XSS injected via markdown should still be neutralized after the full pipeline
const xssMarkdown = `## Heading <script>alert(1)</script>

A paragraph with hostile content.

- Bullet with <iframe src="evil.com"></iframe> hidden inside
`;

const xssRendered = markdownToHtml(xssMarkdown);
const xssSanitized = sanitizeHtml(xssRendered, PLAN_SANITIZE_CONFIG);

assert(!xssSanitized.toLowerCase().includes('<script'), 'Pipeline strips script tag from markdown input');
assert(!xssSanitized.toLowerCase().includes('<iframe'), 'Pipeline strips iframe from markdown input');

// And the headings + bullets still render with proper styles
assert(/<h2[^>]*color:#00447B/i.test(xssSanitized), 'Pipeline preserves heading style on hostile input');
assert(/background:#FF8210/i.test(xssSanitized), 'Pipeline preserves bullet dot style on hostile input');

// ─────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────

const passed = assertions - failures;

process.stdout.write('\n');
process.stdout.write('-'.repeat(60) + '\n');
process.stdout.write(`smoke-plan-render: ${passed}/${assertions} assertions passed\n`);
process.stdout.write('-'.repeat(60) + '\n');

if (failures > 0) {
  process.stdout.write(`\nFAIL: ${failures} assertion(s) failed.\n`);
  process.stdout.write('The Plan rendering pipeline has regressed. Review:\n');
  process.stdout.write('  - lib/plan-render.ts (markdownToHtml, PLAN_SANITIZE_CONFIG)\n');
  process.stdout.write('  - app/[locale]/plan/page.tsx (sanitizeHtml call sites)\n');
  process.stdout.write('  - docs/specs/collab/02-recovery-plan-april-27-regressions.md (R1 context)\n\n');
  process.exit(1);
}

process.stdout.write('\nAll contracts intact. Plan rendering pipeline is healthy.\n\n');
process.exit(0);
