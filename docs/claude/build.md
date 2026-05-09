# Build Hygiene

## Prebuild Smoke Gate

`package.json` has a `prebuild` hook: `npm run smoke:render` (`scripts/smoke-plan-render.mjs`). Runs before every Vercel webpack build.

- 32 assertions covering `markdownToHtml` output and `PLAN_SANITIZE_CONFIG` safety.
- Add new assertions when modifying either function.
- If failing locally: `node scripts/smoke-plan-render.mjs` — fix the assertion before pushing.

Added in R4 (commit `e1c6a924`) to prevent silent regression after the `sanitize-html` migration.

## Plan Rendering Rules

- `lib/plan-render.ts` is the canonical pure rendering pipeline: `inlineMd`, `markdownToHtml`, `extractSection`, `PLAN_SANITIZE_CONFIG`.
- Always pass `PLAN_SANITIZE_CONFIG` to `sanitizeHtml()`. Missing config silently strips inline styles and breaks Plan tab visual hierarchy.
- Inline-style allowlist: color, font-weight, font-style, text-decoration, margin.
- `isomorphic-dompurify` was replaced by `sanitize-html` on 27 April 2026 — do not reintroduce it.

## Local next-intl Build Errors

If `npm run build` fails with:
```
Module not found: Can't resolve './shared/NextIntlClientProvider.js'
```

Fix: `rm -rf node_modules .next && npm ci`

This happens after fresh clones, branch switches, or pulls where `node_modules` drifts. Vercel always installs fresh; this is local-only.

## Vercel Deploy

- Auto-deploy on push to `main`.
- Always run `npm run smoke:render` locally before pushing if plan rendering was touched.
- Check build logs: `Vercel:get_deployment_build_logs` with the latest deployment ID.
