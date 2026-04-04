# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server (Vite + HMR)
npm run build    # Production build → /dist
npm run lint     # ESLint
```

Env: copy `.env.example` → `.env.local`, fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---

## Architecture

**Spanish-language personal finance PWA.** React 19 + Vite + Supabase (PostgreSQL/Auth). No TypeScript. Deployed to Vercel (auto on `main` push).

### Provider / routing structure (`src/App.jsx`)

```
BrowserRouter → ThemeProvider → PrivacyProvider → AuthProvider → AuthGate
```

`AuthGate` renders `AppLayout` when authenticated. All pages are lazy-loaded via a `lazyRetry()` wrapper (auto-reloads once on chunk load failures).

**Dual routing — desktop vs. mobile:**
- Desktop uses sidebar nav: `/dashboard`, `/evolucion`, `/gastos`, `/detallado`, `/historial`, `/configuracion`
- Mobile uses bottom nav with hub routes: `/analytics/*` (dashboard/evolucion/gastos), `/transacciones/*` (historial/detallado), `/pendientes`
- `/carga` is shared; `*` redirects to `/carga`

`useIsMobile()` (breakpoint 768 px) drives layout: sidebar on desktop, `BottomNav` + `MobileTopBar` on mobile.

### State management

Three contexts (`src/context/`), no Redux/Zustand:
- **AuthContext** — Supabase Auth session; `useAuth()` → `{ user, loading, signIn, signOut }`. Calls `seedDefaults(userId)` on first sign-in.
- **ThemeContext** — `auto/light/dark`; `cycleTheme()`; sets `data-theme` on `<html>`. CSS default is dark.
- **PrivacyContext** — `hideNumbers` bool; `toggleHideNumbers()`.
- **MobileHeaderContext** — passes scroll-hide state to `MobileTopBar`.

### Data layer

- **No service abstraction** — Supabase queries live directly in page components. Always filter by `user_id`.
- **Pagination:** Supabase max 1000 rows. Use `fetchAllTransactions(userId, opts)` from `src/lib/fetchAll.js` for any query that may exceed this.
- **Transaction creation:** Always use `createTransaction()` from `src/lib/transactions.js`. It handles simple, installment (`cuotas` — share `installment_group_id`), and recurring (share `recurrence_id`) cases.
- **Currency:** Transactions store `amount` + `amount_usd` + `exchange_rate` (MEP). Use `getAmount(tx, currency)` from `src/lib/currency.js` for display. Use `getExchangeRate(date)` from `src/lib/exchangeRate.js` (DB-cached, falls back to dolarapi.com).

### Styling

- **All styling uses React inline style objects** referencing CSS custom properties — no Tailwind, no CSS modules, no component libraries.
- Theme variables defined in `src/index.css`. Key: `--bg-primary/secondary/card`, `--text-primary/secondary`, `--border`, `--color-income/expense/savings/accent`, `--radius-md`, `--sidebar-width` (260px), `--sidebar-collapsed` (72px).
- Fonts: **DM Sans** (UI), **JetBrains Mono** (numbers).

### Category icons

Categories use **Lucide React** icons (stored as icon name strings in DB, e.g. `'Car'`, `'Plane'`). `src/lib/categoryIcons.js` exports:
- `ICON_MAP` — name → Lucide component
- `ICON_COLORS` — name → hex color (stable, icon-based palette)
- `EMOJI_TO_ICON` — legacy emoji → icon name (no DB migration needed)
- `getIconColor(name)` — resolves both legacy emojis and current icon names
- `suggestIcon(name)` — keyword-based auto-suggestion for new categories

Use `<CategoryIcon />` from `src/components/CategoryIcon.jsx` to render any category icon.

### Key lib utilities

| Import | Use for |
|---|---|
| `src/lib/format.js` | All currency display — `fmt`, `fmtSmart`, `fmtCompact`, `fmtLabel`, `fmtForm`, `fmtInput`. Never define local formatters. |
| `src/lib/supabase.js` | Supabase singleton — always import from here |
| `src/lib/fetchAll.js` | `fetchAllTransactions(userId, opts)` — paginated fetcher |
| `src/lib/transactions.js` | `createTransaction()` — all transaction creation |
| `src/lib/currency.js` | `getAmount(tx, currency)` — ARS↔USD resolution |
| `src/lib/exchangeRate.js` | `getExchangeRate(date)` — MEP rate |
| `src/lib/defaults.js` | `seedDefaults(userId)` — idempotent new-user seeding |
| `src/lib/categoryIcons.js` | Icon map, colors, emoji compat, auto-suggest |

### Database tables

- **transactions** — core table. `type`: `'income'|'expense'`. Dual-currency: `amount` + `currency` + `exchange_rate` + `amount_usd`.
- **categories** → **subcategories** → **concepts** — 3-level hierarchy. `categories.icon` stores Lucide icon name (or legacy emoji).
- **persons** — household members.
- **exchange_rates** — MEP rate cache by date.

### Configuracion pattern (avoid N+1)

Load all children in one batch query and filter in JS — never query per item:
```js
const { data: allSubs } = await supabase.from('subcategories').select('*').eq('user_id', user.id)
const subsForCat = allSubs.filter(s => s.category_id === cat.id)
```

### PWA

`public/sw.js` is a self-destructing service worker (deletes all caches on activate). The app has **no offline caching**.
