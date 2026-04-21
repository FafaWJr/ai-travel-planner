# Luna Let's Go — Multilingual Reference Guide

**Version:** April 2026 — IMPLEMENTATION COMPLETE
**Locales:** EN (default, no prefix), PT-BR (`/pt-BR/`), ES (`/es/`)
**Stack:** next-intl v4, Next.js 16 App Router, `messages/` JSON files

This document is the single source of truth for all translation decisions on
lunaletsgo.com. Every new page, feature, and UI change must follow the rules
here. No exceptions — just apply the rules.

---

## 1. Infrastructure

### How it works

- `i18n/routing.ts` — defines locales and `localePrefix: 'as-needed'` (EN has no prefix)
- `i18n/request.ts` — loads the correct `messages/*.json` file per request
- `i18n/navigation.ts` — locale-aware `Link`, `useRouter`, `usePathname`
- `proxy.ts` — the middleware file (NEVER rename to `middleware.ts`)
- `messages/en.json` — English strings (source of truth for all keys)
- `messages/pt-BR.json` — Brazilian Portuguese strings
- `messages/es.json` — Spanish strings

### Critical invariants (never violate)

- `app/auth/` and `app/api/` stay **outside** `[locale]/` — never move them
- `proxy.ts` must guard `/auth/*` BEFORE calling `intlMiddleware` (see section 4k)
- **Server Components** use `getTranslations('namespace')` from `next-intl/server`
- **Client Components** use `useTranslations('namespace')` from `next-intl`
- All 3 JSON files must always be updated together in the same commit
- Auth links must use plain `<a href="/auth/login">`, never locale-aware `Link`

---

## 2. Complete translation inventory

### All completed namespaces

| Namespace | Page / Component | Keys cover |
|-----------|-----------------|-----------|
| `nav` | NavBar | All nav labels, CTA, language switcher, dropdown, mobile drawer |
| `footer` | Footer | Tagline, quick links, legal links, contact, copyright |
| `language` | Language switcher | EN, PT, ES labels |
| `hero` | Home — hero | Badge, titles, subtitle, pills, CTA |
| `howItWorks` | Home — how it works | Label, title, subtitle, 3 steps |
| `features` | Home — features | Label, title, subtitle, 6 feature cards |
| `yourway` | Home — your way | Label, title, subtitle, 3 points, chat demo |
| `meetLuna` | Home — meet Luna | Label, title, subtitle, 4 features, CTA |
| `tripIdeas` | Home — trip ideas strip | Label, title, seeAll |
| `quiz` | Home — quiz teaser | Label, title, subtitle, CTA |
| `faq` | Home — FAQ | Label, title, 6 Q&A pairs |
| `finalCta` | Home — final CTA | Title, subtitle, CTA |
| `start` | `/start` | All form labels, steps, placeholders, buttons, errors, companions, budgetLevels, styles |
| `quizPage` | `/quiz` | All 7 questions + answers, 13 persona names, personaContent (all 13 personas full detail) |
| `tripIdeasPage` | `/trip-ideas` | Header, filters, badges (35 types), count, CTA, days suffix |
| `deals` | `/deals` | Title, subtitle, disclaimer, all 5 partner cards |
| `about` | `/about` | Full page: hero, bios, story, quote, mission, features, carousel, CTA, stats |
| `blogIndex` | `/blog` index | Hero, section header, CTAs, category badges, minRead, comingSoon, engOnlyNotice |
| `myTrips` | `/my-trips` | Heading, subtitle, loading, empty state, trip cards (ICU plural days), delete confirm |
| `plan` | `/plan` | Full page: tabs, header buttons, stats bar, itinerary flow, time slots, activity actions, notes, day badges, partner cards, chat welcome, unsaved modal, booking CTA, date pill, extra ideas |
| `legal` | `/privacy-policy`, `/terms` | Badge, date meta labels, EN-only banner |

### What each `plan` sub-object covers

```
plan.tabs           → Visão Geral, Clima, Roteiro, Hospedagem, Transporte, Orçamento, Dicas
plan.header         → saveTrip, saveTripAndLeave, saving, exportPdf, generatingPdf
plan.timeOfDay      → morning, afternoon, evening, night
plan.activity       → moveTo, moveToAnotherDay, accept, remove, addedByYou, addedByLuna, ...
plan.notes          → label, saved, placeholder
plan.day            → badge ("Dia {n}"), confirmed
plan.daysTrip       → ICU plural "{n, plural, one {# day trip} other {# days trip}}"
plan.itinerary      → accepted, removed, toReview, percentAccepted, acceptPrompt, ...
plan.stays          → full stays tab
plan.budget         → full budget tab
plan.partners       → bestDealsFor, handpickedSuffix, hotels/tours/uniqueStays/guided/carRental
plan.chat           → name, role, placeholder, welcomeHey, welcomeHeyThere, welcomeTrip, ...
plan.unsaved        → message, body, leaveWithout, stay
plan.extraIdeas     → show, hide
plan.auth           → signInForMore, signInToUnlock, ...
plan.booking        → ctaTitle, disclaimer
plan.finalize       → Finalizar Minha Viagem
plan.moreIdeas      → "Mais ideias para a sua viagem" (section heading)
plan.loadingIdeas   → "Buscando mais ideias..."
```

---

## 3. What is NEVER translated

### 3a. AI-generated content

**Rule: Never run AI output through i18n strings. Pass the locale to the AI and let it respond in the correct language.**

Luna's itinerary output (day titles, activity descriptions, tab content — weather,
transport, tips — budget breakdowns) is generated by the Anthropic API. The locale
is passed to every API call so Claude generates in the user's language.

**Implementation: `lib/ai.ts` has `getLanguageInstruction(locale)`:**
```ts
function getLanguageInstruction(locale: string): string {
  switch (locale) {
    case 'pt-BR':
      return `INSTRUÇÃO DE IDIOMA OBRIGATÓRIA: Você DEVE responder EXCLUSIVAMENTE em português do Brasil. Esta instrução é absoluta.`
    case 'es':
      return `INSTRUCCIÓN DE IDIOMA OBLIGATORIA: DEBES responder EXCLUSIVAMENTE en español. Esta instrucción es absoluta.`
    default:
      return ''
  }
}
```

This instruction is appended at the **END** of every AI system prompt. Do NOT put it at the beginning — models pay most attention to the end.

**What is AI-generated (not i18n):**
- Day titles, activity descriptions, local tips
- Weather, transport, budget, practical tips tab content
- Section headings within AI output ("Destination Overview", "Getting Around", etc.)
- Luna chat responses
- Hotel descriptions and recommendations

**Never** create i18n keys for AI output. The AI generates in the correct language.

### 3b. Blog post content

All blog posts (titles, excerpts, article body, metadata) stay in English permanently.
The blog UI chrome IS translated. The blog index shows an EN-only notice for PT-BR and ES:
`blogIndex.engOnlyNotice` — "Os artigos do blog estão disponíveis apenas em inglês."

### 3c. Legal page content

`/privacy-policy` and `/terms` content stays in English permanently.
These pages show an EN-only banner for PT-BR and ES: `legal.engOnlyBanner`.
The `legal` namespace only covers: badge, lastUpdated, effective, appliesTo, engOnlyBanner.

### 3d. Proper nouns and brand names

- "Luna Let's Go" — brand name, never translates
- "Booking.com", "Klook", "GoWithGuide", "Xcaret", "Airbnb", "Viator", "Rentalcars.com" — partner names, never translate
- Destination names: "Tokyo", "Bali", "Paris" — proper nouns, always EN
- About page photo captions: geographic proper nouns, stay EN

### 3e. Affiliate URLs

**Never modify affiliate URLs under any circumstances.** Translating surrounding text is fine.

```
Booking.com hotels: awin1.com/cread.php?awinmid=18118&awinaffid=2825924&campaign=LifecycleOnboarding
GoWithGuide: https://tidd.ly/4s8kRkI
Xcaret: https://tidd.ly/4sH1xfw
Klook: https://affiliate.klook.com/redirect?aid=117089...
```

### 3f. Internal code identifiers

Quiz scoring: persona `id` values (`'beach_bum'`, `'explorer'` etc.) and answer `value`
fields (`'ex_beach'`, `'must_beach'` etc.) are internal identifiers. Never translate.
Only display text is translated, via `t('personas.' + id)` pattern.

### 3g. Print and PDF templates

The print/PDF export uses hardcoded `"en-GB"` and `"en-AU"` date formats intentionally.
These are static document exports — do NOT localise them. Only the interactive UI is localised.

---

## 4. Rules for all future development

### 4a. CHECKLIST — Every new page

```
[ ] Create namespace in messages/en.json
[ ] Create same namespace in messages/pt-BR.json (PT-BR grammar rules apply)
[ ] Create same namespace in messages/es.json (ES grammar rules apply)
[ ] Server Component: import { getTranslations, getLocale } from 'next-intl/server'
[ ] Client Component: import { useTranslations, useLocale } from 'next-intl'
[ ] If page has its own layout (see 4l): add <NavBar /> explicitly
[ ] If page has AI features: pass locale to all AI API calls (see 4j)
[ ] If page has English-only content sections: add locale-aware notice (see 4m)
[ ] Verify PT-BR encoding: node -e "const f=require('./messages/pt-BR.json'); console.log(f.namespace.key)"
[ ] Commit all 3 JSON files in the same commit as the page code
```

### 4b. CHECKLIST — Every new UI string on an existing page

```
[ ] Add key to messages/en.json (in the correct namespace)
[ ] Add key to messages/pt-BR.json with correct PT-BR translation
[ ] Add key to messages/es.json with correct ES translation
[ ] Replace hardcoded string in JSX with t('key')
[ ] Verify PT-BR encoding
[ ] Commit all 3 JSON files together with the code change
```

### 4c. Namespace naming convention

```
nav               → NavBar
footer            → Footer
hero              → Home hero
howItWorks        → Home "How it works"
features          → Home features grid
yourway           → Home "your way" section
meetLuna          → Home Meet Luna section
tripIdeas         → Home trip ideas strip
quiz              → Home quiz teaser
faq               → Home FAQ
finalCta          → Home final CTA
language          → Language switcher labels

start             → /start form
quizPage          → /quiz (includes personaContent sub-object)
tripIdeasPage     → /trip-ideas (includes filters, badges sub-objects)
deals             → /deals
about             → /about
blogIndex         → /blog index
myTrips           → /my-trips
plan              → /plan (all sub-objects listed in section 2)
legal             → /privacy-policy, /terms
```

New namespaces follow the page route. Sub-objects for nested structures.

### 4d. Component-level translation

Shared components used across multiple pages: strings go in the namespace of the
primary page, or create a dedicated namespace if the component is standalone.
Components used only on one page use that page's namespace.

### 4e. Date formatting with locale

Never hardcode `"en-US"` or `"en-GB"` in `toLocaleDateString` calls inside
interactive UI components. Use the `toDateLocale()` helper:

```ts
// In plan/page.tsx — already implemented, replicate this pattern elsewhere
function toDateLocale(locale: string): string {
  if (locale === 'en') return 'en-GB'
  return locale  // 'pt-BR' and 'es' map directly to JS Intl locale codes
}

// Usage:
const dl = toDateLocale(locale)  // locale from useLocale()
n.toLocaleDateString(dl, { weekday: 'long' })  // → "sexta-feira" in PT-BR
n.toLocaleDateString(dl, { day: '2-digit', month: 'short', year: 'numeric' })
```

Helper functions that format dates must accept a `locale` parameter. Call
sites must pass `useLocale()` (client) or `getLocale()` (server) into them.

**Exception:** Print/PDF export uses hardcoded `"en-GB"` — do not change that.

### 4f. Module-level data arrays require special handling

Module-level constants (defined outside any component function) CANNOT access
`useTranslations` because it is a React hook. Two patterns:

**Pattern A (preferred for large arrays): add a `key` field, translate at render**
```tsx
// Module level — keep stable data, add key field for translation lookup
const planPartners = [
  { key: 'hotels', name: 'Booking.com', href: '...', icon: '🏨' },
  { key: 'tours',  name: 'GetYourGuide', href: '...', icon: '🎭' },
]

// At render point inside component where t() is available:
{planPartners.map(p => (
  <div key={p.key}>
    <span>{t(`partners.${p.key}.category`)}</span>
    <a href={p.href}>{t(`partners.${p.key}.cta`)}</a>
  </div>
))}
```

**Pattern B (for small arrays): move inside the component**
```tsx
function MyComponent() {
  const t = useTranslations('namespace')
  const items = [{ id: 'a', label: t('itemA') }, { id: 'b', label: t('itemB') }]
  return items.map(item => <div key={item.id}>{item.label}</div>)
}
```

Pattern A avoids re-creating large arrays on every render.

### 4g. Sub-components must call useTranslations independently

A parent's `t()` is not accessible in child components or helper functions.
Each component that renders translatable strings needs its own `useTranslations()` call.

```tsx
// WRONG
function Parent() {
  const t = useTranslations('plan')
  return <SlotHeader slot="morning" />  // SlotHeader has no t()
}

// CORRECT
function SlotHeader({ slot }: { slot: string }) {
  const t = useTranslations('plan')     // own call
  return <span>{t(`timeOfDay.${slot}`)}</span>
}
```

### 4h. Hardcoded template functions must move inside components

Module-level functions that build strings with template literals cannot use `t()`.
Move them inside the component where `useTranslations` is available.

```tsx
// WRONG — module level, no hook access
function buildWelcome(name: string | null) {
  return `Hey ${name ?? 'there'}! I'm Luna...`  // always English
}

// CORRECT — inside component
function FloatingChat({ userName, destination }) {
  const t = useTranslations('plan')
  const buildWelcome = (name: string | null, dest: string | null) => {
    const greeting = name ? t('chat.welcomeHey', { name }) : t('chat.welcomeHeyThere')
    const tripRef = dest ? t('chat.welcomeTrip', { destination: dest }) : t('chat.welcomeGeneric')
    return `${greeting} ${t('chat.welcomeIntro')} ${tripRef} ${t('chat.welcomeCta')}`
  }
  ...
}
```

### 4i. AI API routes: locale must reach every endpoint

Every route that calls Claude must receive and use the locale:

```ts
// 1. Extract locale from request body
const { prompt, locale, ...rest } = await req.json()

// 2. Get language instruction (from lib/ai.ts)
const langInstruction = getLanguageInstruction(locale ?? 'en')

// 3. Append AT THE END of system prompt — AFTER all other content
const systemPrompt = `
  ${baseInstructions}
  ${tripContextIfAny}
  ${tripUpdateRulesIfAny}
  ${langInstruction}   ← MUST BE LAST
`.trim()
```

**Client side: always include locale in AI fetch calls:**
```tsx
const locale = useLocale()
await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({ prompt, locale })  // ← always include
})
```

**AI API routes that require locale:**
- `/api/generate` — initial plan generation
- `/api/chat` — Luna chat responses
- `/api/day-suggestions` — "More ideas for this day"
- `/api/extra-ideas` — supplementary suggestions
- `/api/budget-estimate` — if AI text is included
- Any future route that sends a prompt to Claude

### 4j. Auth routes must never go through intl middleware

In `proxy.ts`, guard `/auth/*` BEFORE calling `intlMiddleware`:

```ts
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /auth/* lives outside [locale]/ — skip locale detection entirely
  // Without this guard, next-intl redirects /auth/login → /pt-BR/auth/login (404)
  if (pathname.startsWith('/auth')) {
    return await updateSession(request)
  }

  const intlResponse = intlMiddleware(request)
  if (intlResponse) return intlResponse
  return await updateSession(request)
}
```

Also: never use `Link` from `@/i18n/navigation` for auth links. Use plain `<a href="/auth/login">`.

### 4k. Self-contained pages must include NavBar explicitly

Pages that render their own complete layout (their own hero section + footer)
are **not wrapped by the locale layout's NavBar**. These pages must import and
render `<NavBar />` themselves.

Currently affected: `/privacy-policy`, `/terms`.

**Test:** If a page renders its own `<footer>` inline, it is self-contained and
needs `<NavBar />` manually added at the top, plus `paddingTop: 68` on the main wrapper.

```tsx
// Self-contained page pattern
import NavBar from '@/components/NavBar'

export default function LegalPage() {
  return (
    <>
      <NavBar />
      <main style={{ paddingTop: 68 }}>
        {/* page content */}
      </main>
    </>
  )
}
```

### 4l. EN-only content sections: add a notice for PT-BR and ES

When a section of the site intentionally stays in English (blog posts, legal
content), show a locale-aware notice to PT-BR and ES visitors.

**Pattern:**
```tsx
const locale = useLocale()  // or getLocale() for Server Components

{locale !== 'en' && (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(0,68,123,0.06)',
    border: '1px solid rgba(0,68,123,0.15)',
    borderRadius: 10, padding: '12px 18px',
    fontFamily: "'Inter', sans-serif", fontSize: 14,
    color: '#00447B', fontWeight: 500,
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="#00447B" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    {t('namespace.engOnlyNotice')}
  </div>
)}
```

**Where this pattern is currently applied:**
- `/blog` index — between hero and posts grid (`blogIndex.engOnlyNotice`)
- `/privacy-policy` — first element inside `<main>` (`legal.engOnlyBanner`)
- `/terms` — first element inside `<main>` (`legal.engOnlyBanner`)

**Add to any future page where content deliberately stays in EN.**

---

## 5. PT-BR grammar rules (mandatory)

Every PT-BR string must pass these checks before committing:

### Verb ser
- "é" = is (never bare "e" for the verb to be)
- "são" = are, "foi" = was
- Common errors: "e um" → "é um", "Luna e" → "Luna é", "e gratuito" → "é gratuito"

### Prepositions
- "à" before feminine nouns (à Luna, à viagem, à beira-mar)
- "ao" before masculine nouns

### Mandatory accents (always required)
```
você, não, à, é, está, só, já, grátis, orçamento, opções, sugestões,
hotéis, estações, preferências, localização, confiança, distância,
alimentação, horários, início, único, próxima, começa, Japão, Tóquio,
manhã, almoços, genéricos, são, família, crianças, econômico, românticas,
níveis, programação, táxis, até, Vamos Lá
```

### Forbidden constructs
- No em dashes anywhere. Replace with ".", "," or ":"
- Never "Voce" (must be "você"), never "Nao" (must be "não")
- Never bare "e" when it means "is/are" — must be "é"/"são"

### Encoding verification (run after every file save)
```bash
node -e "const f=require('./messages/pt-BR.json'); console.log(f.namespace.key)"
```
Must show accented characters. If plain ASCII: file was saved without UTF-8. Fix before committing.

---

## 6. ES grammar rules (mandatory)

- Informal "tú" throughout (never formal "usted")
- Inverted punctuation where required: ¿, ¡
- No em dashes. Replace with ".", "," or ":"
- Required accents: tú, más, también, qué, dónde, además, después, sólo,
  cómo, cuándo, así, fácil, últimos, próximo, aquí, allí, día, año, también

---

## 7. Quick reference for Claude Code

**Server Component:**
```tsx
import { getTranslations, getLocale } from 'next-intl/server'

export default async function MyPage() {
  const t = await getTranslations('myNamespace')
  const locale = await getLocale()
  return <h1>{t('title')}</h1>
}
```

**Client Component:**
```tsx
'use client'
import { useTranslations, useLocale } from 'next-intl'

export default function MyComponent() {
  const t = useTranslations('myNamespace')
  const locale = useLocale()
  return <button>{t('cta')}</button>
}
```

**With ICU plurals:**
```tsx
// JSON: "days": "{n, plural, one {# day} other {# days}}"
t('days', { n: 5 })  // → "5 days" / "5 dias" / "5 días"
```

**Locale-aware links (never for /auth/* routes):**
```tsx
import { Link } from '@/i18n/navigation'
<Link href="/about">About</Link>  // auto-prefixes /pt-BR/ or /es/
```

**Auth links (always plain anchor):**
```tsx
<a href="/auth/login">Login</a>  // never use locale-aware Link
```

---

## 8. Known bugs fixed during implementation

| Bug | Root Cause | Fix Applied |
|-----|-----------|-------------|
| Login 404 in PT-BR/ES | `intlMiddleware` redirected `/auth/login` → `/{locale}/auth/login` (no such route) | Guard in `proxy.ts`: skip intlMiddleware for `/auth/*` |
| All plan tab content in English | `/api/generate` fetch only sent `{prompt}`, no locale | Added `locale` to generate call body and system prompt |
| Luna chat responses in English | Language instruction was prepended (ignored); must be at END | Moved instruction to END of system prompt, after `%%TRIP_UPDATE%%` |
| MORNING/AFTERNOON etc. in English | `p={morning:"Morning"...}` was module-level; sub-component had no `t()` | Added `useTranslations('plan')` to TimeSlotSection sub-component |
| Partner cards in English | `nh=[{category:"Hotels & Apartments"...}]` was module-level | Added `key` field per item; `t(\`partners.${key}.category\`)` at render |
| Luna welcome message in English | `buildWelcomeMessage()` was module-level template function | Moved inside FloatingChat component to access `t()` |
| "Move to another day" tooltip in English | `title="Move to another day"` hardcoded on button | Added `plan.activity.moveToAnotherDay`, wired `title={t(...)}` |
| Accept/Remove button tooltips in English | `label:"Accept"` and `label:"Remove"` hardcoded as props to `eG` | Added `plan.activity.accept/remove`, wired at callsite |
| Notes textarea placeholder in English | `placeholder="Add any personal notes..."` hardcoded | Added `plan.notes.placeholder`, wired placeholder |
| Day badge "Day 1" in English | `["Day ", t.number]` hardcoded in two locations | Added `plan.day.badge = "Day {n}"` / "Dia {n}" / "Día {n}" |
| "4 days trip" pill in English | Hardcoded plural `1===a?"day":"days"+" trip"` | Added `plan.daysTrip` ICU plural, wired with `t('daysTrip', {n: a})` |
| Weekday "Friday" in English | `toLocaleDateString("en-US", {weekday:"long"})` hardcoded | Added `toDateLocale()` helper, pass locale to `eT()` function |
| "01 May 2026" month in English | Inline formatter hardcoded `"en-GB"` | Replaced with `toDateLocale(locale)` in the main component |
| Legal pages missing NavBar | Self-contained pages never imported `<NavBar />` | Added `import NavBar` and `<NavBar />` + `paddingTop: 68` to both pages |
| Legal banner had incorrect suffix | Claude Code invented "Estamos trabalhando nas traduções" | Removed — banner text is exactly: "Esta página está disponível apenas em inglês." |
| Blog missing EN-only notice | No notice existed for PT-BR/ES visitors | Added `blogIndex.engOnlyNotice` and conditional render between hero and posts |
