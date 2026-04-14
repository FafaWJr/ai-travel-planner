# Update CLAUDE.md — Complete i18n Documentation

## Context

The trilingual implementation (EN / PT-BR / ES) is now complete across all pages.
CLAUDE.md needs a comprehensive i18n section so every future feature, page, or
change is built with all 3 languages from the start. No patch-ups later.

---

## Step 1: Read CLAUDE.md

Open `CLAUDE.md` and find the existing i18n section (if any). It may reference
an earlier, incomplete implementation. We will replace it entirely with the
content below.

---

## Step 2: Replace or add the i18n section

Find the existing i18n / multilang / translation section in CLAUDE.md and
replace it with the following block. If no section exists, add it after the
"Tech Stack" section and before any feature-specific documentation.

---

```markdown
## Multilingual Implementation (EN / PT-BR / ES) — STATUS: COMPLETE

All user-facing pages are fully translated. The permanent reference document
is `MULTILANG-REFERENCE.md` in the repo root. Read it before building anything
new. This section summarises the critical rules.

### Locales and URL structure

- EN: no prefix → `lunaletsgo.com/blog`
- PT-BR: `/pt-BR/` prefix → `lunaletsgo.com/pt-BR/blog`
- ES: `/es/` prefix → `lunaletsgo.com/es/blog`

Configured in `i18n/routing.ts` with `localePrefix: 'as-needed'`.

### Files

- `messages/en.json` — English (source of truth)
- `messages/pt-BR.json` — Brazilian Portuguese
- `messages/es.json` — Spanish
- `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts` — next-intl config
- `proxy.ts` — middleware (NEVER rename to middleware.ts)

### Non-negotiable rules for every future change

**1. All 3 JSON files in every commit that adds UI text**
Never add a string to en.json without adding the same key to pt-BR.json and es.json
in the same commit. No exceptions, no "add translations later" workflow.

**2. Every new page: translate from day one**
Add the namespace to all 3 JSON files at the same time the page is built.
Use `getTranslations('namespace')` in Server Components and `useTranslations('namespace')`
in Client Components.

**3. Auth links use plain `<a>`, never locale-aware `Link`**
`app/auth/` is outside `app/[locale]/`. Auth links must be `<a href="/auth/login">`.
The locale-aware `Link` from `@/i18n/navigation` would prefix `/pt-BR/auth/login` → 404.

**4. proxy.ts: guard `/auth/*` before intlMiddleware**
The current implementation already has this guard. Never remove it:
```ts
if (pathname.startsWith('/auth')) return await updateSession(request)
// intlMiddleware runs AFTER this guard
```

**5. AI API routes must receive locale**
Every route that calls Claude must:
- Accept `locale` in the request body
- Append a language instruction at the END of the system prompt (after all other content)
- The shared helper `getLanguageInstruction(locale)` in `lib/ai.ts` does this

Client-side fetch calls to AI routes must always include `locale: useLocale()`.

**6. Language instruction position: END of system prompt**
If a language instruction is placed at the beginning, Claude ignores it — the long
trip context buries it. It must be the very last thing in the system prompt,
after `%%TRIP_UPDATE%%` rules in the chat route.

**7. Self-contained pages must import NavBar explicitly**
Pages that render their own footer inline (currently: privacy-policy, terms)
are not wrapped by the locale layout's NavBar. They must `import NavBar` and
render `<NavBar />` + `paddingTop: 68` on the main wrapper.

**8. Module-level data arrays: use Pattern A**
Constants defined outside component functions cannot use `useTranslations`.
Add a `key` field to each item and translate at the render point using
`t(`namespace.${item.key}.field`)`. See MULTILANG-REFERENCE.md section 4f.

**9. Date formatting: use toDateLocale() helper**
Never hardcode `"en-US"` or `"en-GB"` in interactive UI date calls. Use the
`toDateLocale(locale)` helper in plan/page.tsx. Replicate this pattern for any
new date display. Exception: print/PDF templates stay hardcoded in English.

**10. English-only content: add a notice for PT-BR and ES**
Blog posts and legal pages stay in English permanently. Any time content
intentionally stays in EN, add a locale-aware info banner for PT-BR/ES visitors.
Pattern documented in MULTILANG-REFERENCE.md section 4l.

### Namespaces (what lives where)

```
nav, footer, language     → NavBar, Footer, language switcher
hero, howItWorks, features, yourway, meetLuna, tripIdeas, quiz, faq, finalCta → Home page
start                     → /start form
quizPage                  → /quiz (includes personaContent)
tripIdeasPage             → /trip-ideas
deals                     → /deals
about                     → /about
blogIndex                 → /blog (includes engOnlyNotice)
myTrips                   → /my-trips
plan                      → /plan (large: tabs, activity, notes, chat, partners, etc.)
legal                     → /privacy-policy, /terms
```

New namespaces follow the page route. Sub-objects for nested data.

### What is and isn't translated

TRANSLATED (i18n): All static UI text — labels, buttons, headings, placeholders,
tooltips, modals, badges, error messages, date labels.

NOT TRANSLATED (AI-generated): Day titles, activity descriptions, weather content,
transport content, tips content, Luna chat responses. These are generated by Claude
with a language instruction — do not create i18n keys for them.

NOT TRANSLATED (editorial): Blog post titles, excerpts, article bodies. Legal page
body text. Partner brand names. Destination proper nouns.

### Translation status

| Page | Status |
|------|--------|
| NavBar + Footer | DONE |
| `/` Home | DONE |
| `/start` | DONE |
| `/quiz` | DONE |
| `/trip-ideas` | DONE |
| `/deals` | DONE |
| `/about` | DONE |
| `/blog` | DONE (UI chrome + EN-only notice) |
| `/my-trips` | DONE |
| `/plan` | DONE (full page, all sub-components) |
| `/privacy-policy` | DONE (NavBar + EN-only banner + date labels) |
| `/terms` | DONE (NavBar + EN-only banner + date labels) |

### PT-BR grammar quick-check (run before every commit)

```bash
node -e "const f=require('./messages/pt-BR.json'); console.log(f.namespace.key)"
```
Output must show accented characters. If plain ASCII: UTF-8 encoding issue. Fix first.

Key rules: "é" not bare "e" for verb ser. "à" before feminine nouns. All mandatory
accents: você, não, é, está, orçamento, opções, etc. No em dashes anywhere.

### Full reference

See `MULTILANG-REFERENCE.md` for: complete namespace inventory, all bug fixes,
date formatting rules, self-contained page pattern, EN-only notice pattern,
ES grammar rules, module-level array patterns, and Claude Code quick reference.
```

---

## Step 3: Commit

```bash
git add CLAUDE.md MULTILANG-REFERENCE.md
git commit -m "docs: update CLAUDE.md and MULTILANG-REFERENCE.md — i18n complete, all rules documented"
git push origin main
```
