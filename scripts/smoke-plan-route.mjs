#!/usr/bin/env node
/**
 * scripts/smoke-plan-route.mjs
 *
 * Verifies that /plan does not 500 on SSR. Hits two URL shapes (saved-trip
 * and fresh-prompt) and asserts each returns HTTP 200 without the Next.js
 * error shell.
 *
 * Usage:
 *   BASE_URL=https://www.lunaletsgo.com SMOKE_TRIP_ID=<uuid> node scripts/smoke-plan-route.mjs
 *
 * Env (with defaults):
 *   BASE_URL       — host to hit (default: http://localhost:3000)
 *   SMOKE_TRIP_ID  — saved-trip uuid for the tripId path
 *                    (default: 00000000-0000-0000-0000-000000000000, which
 *                    will not match a real row but the page should still
 *                    render the no-trip empty state with a 200)
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — at least one check failed
 *
 * Written as plain ESM (.mjs) so it runs on stock Node without adding a
 * new devDependency (tsx, ts-node, etc.).
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SMOKE_TRIP_ID = process.env.SMOKE_TRIP_ID || '00000000-0000-0000-0000-000000000000';

async function check(path) {
  const url = BASE_URL + path;
  const res = await fetch(url, { redirect: 'follow' });
  const body = await res.text();
  if (res.status !== 200) {
    throw new Error(`FAIL: ${url} returned ${res.status}`);
  }
  if (body.includes('__next_error__')) {
    throw new Error(`FAIL: ${url} returned the Next.js error shell`);
  }
  console.log(`PASS: ${url} (${res.status}, ${body.length} bytes)`);
}

(async () => {
  try {
    await check(`/plan?tripId=${SMOKE_TRIP_ID}`);
    await check(`/plan?prompt=test`);
    console.log('All smoke checks passed.');
    process.exit(0);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
})();
