---
name: web-project-structure
description: Production-grade directory architecture for scalable web applications using Next.js, Vite, Astro, Remix, or SvelteKit. Enforces separation of concerns, typed configuration, routing layer isolation, static/dynamic rendering strategies, asset organization, environment-based configs, and feature-based scalability patterns.
---

# 📌 Web Project Structure

## 🎯 GOAL
**One sentence:** Modular, production-ready directory architecture for web applications ensuring maintainability, testability, and horizontal feature scalability across any modern framework.

> Example:
> Standardized enterprise layout separating routing (pages/app), presentation (components), domain logic (hooks/services), state management (store), data access (api), and configuration — compatible with Next.js, Vite, Astro, Remix, and SvelteKit.

---

## 💡 KEY PRINCIPIONS
- **Feature-First Organization** – Group code by domain feature, not by file type, to keep related logic co-located. <!-- ПІДТВЕРДЖЕНО: 9/9 production-репозиторії (Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC) — див. analysis-synthesis/architecture-consensus.md -->
- **Layered Architecture** – Pages → Components → Hooks/Services → API → Store. Dependencies flow downward only. <!-- ПІДТВЕРДЖЕНО: 9/9 репо мають явний DAG залежностей — див. analysis-synthesis/architecture-consensus.md -->
- **Framework-Agnostic Core** – Business logic (hooks, services, utils) works across React, Vue, Svelte; framework-specific code lives in adapter layers.
- **Strict Configuration Typing** – Environment variables are parsed, validated, and typed at build time — never accessed as raw strings. <!-- ПІДТВЕРДЖЕНО: зі skila напряму. З consensus: Cal.com та tRPC мають строгий парсинг критичних секретів на старті (fail-fast) для `JWT_SECRET`, `DATABASE_URL`, `NEXTAUTH_SECRET`, але 7/9 репо використовують ліниву валідацію з дефолтами для інтеграційних ключів (Stripe, Zoom) — див. analysis-synthesis/config-deps-consensus.md "Lazy-валідація env-змінних" -->
  - [Стандартна рекомендація]. Критичні секрети (`JWT_SECRET`, `DATABASE_URL`, `NEXTAUTH_SECRET`) перевіряйте на старті з `throw`, щоб увімкнути fail-fast. Інтеграційні ключі (Stripe, Zoom, GitHub) — ліниво з fallback-дефолтами, щоб дозволити запуск без повної конфігурації для локальної розробки та тестів. <!-- ЗМІНЕНО: уточнення за consensus (7/9 lazy validation); див. analysis-synthesis/config-deps-consensus.md -->
- **Just-In-Time Abstraction** – Do not create an abstraction layer until there is a real need. Logic used by a single feature stays local to that feature; promote it to a shared layer only after reuse or clear domain responsibility appears.
- **No Arbitrary File Size Limits** – Do not impose artificial line-count limits (e.g. 300/500 lines). A file stays intact when it represents a cohesive unit; splitting should happen on conceptual responsibility, not on row count. <!-- ДОДАНО: consensus 9/9 відсутність жорсткого ліміту за розміром файлів; див. analysis-synthesis/architecture-consensus.md "Відсутність жорсткого ліміту за розміром файлів" -->

---

## 🧠 DECISION RULES

Use this tree before creating a directory or moving code. Rules trump the default layout below.

- **Logic is used by exactly one feature** → keep it *inside* that feature. Do NOT create a global `hooks/`, `services/`, or `api/` entry for it.
- **Logic is reused by 2+ features** → consider promoting it to `shared/`. <!-- ПІДТВЕРДЖЕНО: 7/9 репо організовують спільний код за доменами/пакетами, а не глобальним `/shared`; правило підходить для веб-додатків — див. analysis-synthesis/config-deps-consensus.md -->
- **State is server-derived** → prefer a server-state solution (e.g. TanStack Query) over a global client store.
- **State is local to one component** → do NOT put it in global state. Use local `useState`/`useReducer`.
- **Data changes per request** → use SSR/server-side fetching.
- **Page is static and content changes rarely** → prefer SSG/static rendering.
- **Small project (< few features)** → use a *simple* flat structure. Do NOT spin up all global layers upfront.
- **Growing project** → introduce **feature isolation** (`features/` with co-located logic). <!-- ПІДТВЕРДЖЕНО: 9/9 репо використовують feature-based організацію — див. analysis-synthesis/architecture-consensus.md -->
- **Large project** → introduce **domain boundaries** + shared infrastructure + strict dependency rules.
- **Committing lockfiles** → commit lockfile (`package-lock.json`, `pnpm-lock.yaml`, `composer.lock`) for deterministic installs across environments. <!-- ДОДАНО: consensus 8/9; див. analysis-synthesis/config-deps-consensus.md "Коміт lockfile-ів для детермінованих інсталяцій" -->
- **SemVer ranges for dependencies** → use caret/tilde ranges for external dependencies; pin exact versions for internal workspace packages or use `workspace:*` / `workspace:^` protocol. <!-- ДОДАНО: уточнення за consensus 9/9; приклади з NestJS (`^12.0.0`), tRPC (`zod: ^4.2.1`, `@trpc/server: 11.18.0`), Medusa (`resolutions`) — див. analysis-synthesis/config-deps-consensus.md "SemVer-діапазони" -->
- **Minimal feature flags in frameworks** → avoid embedding feature-flag frameworks into the app itself. If flags are needed, implement them as separate services or database-backed configuration, not as framework-level mechanisms. <!-- ДОДАНО: слабкий сигнал consensus 8/9; у веб-додатках flags реалізуються через окремі сервіси/БД (Cal.com), а не вбудовані в фреймворк механізми — див. analysis-synthesis/config-deps-consensus.md "Мінімальна або відсутня система feature flags" -->

---

## 🔁 DEPENDENCY DIRECTION

```
app → features → shared → external libraries
```

- `app` imports from `features` and `shared`.
- `features` import from `shared` only.
- `shared` imports from **external libraries only**.
- `shared` **MUST NOT** import from `features` or `app`.
- Feature A **MUST NOT** directly depend on Feature B. Communicate through `shared/` or an explicit public interface (see below). <!-- ПІДТВЕРДЖЕНО: 9/9 репо мають чітко визначений DAG залежностей, різні механізми enforce (ESLint, dependency-cruiser, DI-токени, leaf-модулі) — див. analysis-synthesis/architecture-consensus.md -->

**Circular dependency resolution** — when two features need each other:
1. Extract the shared contract/types into `shared/` and have both depend on it.
2. If they share behavior, move the behavior into `shared/` (or a shared service).
3. If they communicate at runtime, route through events, callbacks, or a messaging layer — do NOT import one feature into the other. <!-- ПІДТВЕРДЖЕНО: 9/9 репо мають стратегію запобігання cyclic deps (import type, ESLint no-restricted-imports, DI-контейнери, leaf-модулі) — див. analysis-synthesis/architecture-consensus.md -->

---

## 📦 FEATURE BOUNDARIES

Group by domain, co-locating everything a feature owns. A feature folder is self-contained: its `components/`, `hooks/`, `services/`, `api/`, and `types/` live *together*. <!-- ПІДТВЕРДЖЕНО: 9/9 репо організовують код за доменними об'єктами (фічами), а не за технічними шарами — див. analysis-synthesis/architecture-consensus.md -->

```
features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── api/
│   ├── types/
│   └── index.ts          # public exports only
├── users/
│   ├── components/
│   ├── api/
│   ├── services/
│   └── types/
└── payments/
    └── ...
```

- `index.ts` re-exports the **public** surface; other features import *only* from `index.ts`, never directly from internal files.
- Anything used by a single feature stays inside it. Promote to `shared/` only on repeated reuse.

---

## 📈 SCALABILITY EVOLUTION

```
Small project          → simple flat structure        (few files, shared by convention)
Growing project        → feature isolation            (features/ with co-located logic)
Large project          → domain boundaries            ├─ shared infrastructure
                         → strict dependency rules     └─ explicit cross-feature contracts
```

**Never over-engineer a small application.** Start minimal and grow the structure as reuse and complexity actually appear — not speculatively. <!-- ПІДТВЕРДЖЕНО: узгоджено з принципом JIT Abstraction та практикою репо (наприклад, Cal.diy починав з простого монерепо) — див. analysis-synthesis/architecture-consensus.md -->

---

## 📁 STRUCTURE (full production layout)

> This is the *large-project* target. For small projects, start with only `components/`, `pages/` (or `app/`), and `features/` — add the other layers when a rule above justifies them. <!-- ПІДТВЕРДЖЕНО: 6/9 production-репозиторіїв використовують монорепозиторійну структуру (Cal.diy, Drizzle, Medusa, Next-Auth, Prisma Next, tRPC) з Turborepo для оркестрації — див. analysis-synthesis/architecture-consensus.md, analysis-synthesis/config-deps-consensus.md -->

```
web_app/
├── src/
│   ├── app/                        # Next.js App Router (or pages/ for Pages Router)
│   │   ├── layout.tsx              # Root layout (providers, fonts, metadata)
│   │   ├── page.tsx                # Home page
│   │   ├── (auth)/                 # Route group: auth pages
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          # Dashboard layout (sidebar, nav)
│   │   │   ├── page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/                    # API routes (Next.js)
│   │       └── users/route.ts
│   ├── pages/                      # Vite/Astro alternative (file-based routing)
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   └── 404.tsx
│   ├── features/                   # Domain features, self-contained (see FEATURE BOUNDARIES)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── users/
│   │   └── payments/
│   ├── shared/                     # Code reused by 2+ features (promote ONLY on reuse)
│   │   ├── components/             # Reusable UI primitives: ui/, forms/, layout/
│   │   │   ├── ui/                 # Generic: Button, Input, Card, Modal
│   │   │   ├── forms/              # Form-specific: DatePicker, Select
│   │   │   └── layout/             # Structural: Header, Footer, Sidebar
│   │   ├── hooks/                  # Shared custom hooks
│   │   │   └── useDebounce.ts
│   │   ├── services/               # Cross-feature business logic
│   │   ├── store/                  # Global client state (Redux/Zustand/Jotai)
│   │   │   ├── index.ts            # Store configuration
│   │   │   ├── slices/             # Feature-based state slices
│   │   │   └── selectors/          # Memoized selectors
│   │   ├── api/                    # HTTP client & API layer
│   │   │   ├── client.ts           # Axios/TanStack Query configuration
│   │   │   ├── endpoints/          # API endpoint definitions
│   │   │   └── types/              # API request/response types
│   │   ├── utils/                  # Pure helper functions (no side effects)
│   │   ├── types/                  # Shared TypeScript types
│   │   └── constants/                # App-wide typed constants
│   │       ├── colors.ts
│   │       ├── breakpoints.ts
│   │       ├── routes.ts             # Route name constants
│   │       └── config.ts             # App name, version, feature flags
│   ├── styles/                       # Global style definitions
│   │   ├── globals.css               # Tailwind directives + global resets
│   │   └── fonts.ts                  # Font configuration
│   └── providers/                    # React context providers
│       ├── ThemeProvider.tsx
│       ├── AuthProvider.tsx
│       └── QueryProvider.tsx        # TanStack Query provider
├── public/                         # Static assets (served at /)
│   ├── favicon.ico
│   ├── robots.txt
│   ├── sitemap.xml
│   └── images/
│       ├── logo.svg
│       └── og-image.png
├── __tests__/                      # Test infrastructure & mocks
├── .env.example                    # Environment variable template
├── .env.development                # Dev environment
├── .env.staging                    # Staging environment
├── .env.production                 # Production environment
├── next.config.ts                  # Next.js config (if applicable)
├── vite.config.ts                  # Vite config (if applicable)
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript strict mode
├── eslint.config.js                # ESLint flat config
├── prettier.config.js              # Prettier configuration
├── turbo.json                      # Turborepo pipeline (monorepo)
└── package.json
```

---

## 🧪 TESTING ARCHITECTURE

| Layer | What it verifies | Where tests live |
|---|---|---|
| **Unit** | Pure utils, services, hooks in isolation | co-located `*.test.ts(x)` next to the module |
| **Integration** | Feature behavior across components + services (mocked external boundary) | co-located under `features/<name>/` |
| **E2E** | Full user flows in a real browser | `e2e/` or `__tests__/e2e` |
| **API contract** | Request/response schema against types | co-located under `api/endpoints/` |

- **Mock at the external boundary** — network, DB, third-party services. Do not mock your own internal logic.
- **Do NOT test** — framework internals, trivial getters/setters, or code that merely re-exports a dependency.
- **Unit test** pure functions with no side effects first (highest value per line). <!-- ПІДТВЕРДЖЕНО: 6/9 production-репозиторіїв мають явно обговорюваний аспект тестування в архітектурі (Cal.diy, Drizzle, Fastify, Next-Auth, Prisma Next, tRPC) з чіткою пірамідою, coverage thresholds, sharded runs — див. analysis-synthesis/architecture-consensus.md -->

---

## 🚦 ASYNC STATE MODEL

Every async feature must define all four states explicitly:

| State | UI |
|---|---|
| `loading` | skeleton / spinner |
| `error` | error boundary or inline error + retry |
| `empty` | "no results" placeholder (distinct from error) |
| `success` | actual content |

- Route-level `loading.tsx` and `error.tsx` (Next.js App Router) handle *route* transitions; feature-level states are the component's own responsibility.
- **Retry behavior** must be defined for every fallible async action — never leave the user with a dead-end error and no way to recover.

---

## 🔐 SECURITY RULES

- **Secrets never reach the client** — server-only (DB URL, API secret keys); client vars use `NEXT_PUBLIC_`/`VITE_` only and are public by design.
- **Authorization ≠ authentication** — a logged-in user must still be re-authorized per action, *server-side*. Never rely on client-side checks alone.
- **Enforce authorization on the server** for any mutation or protected data read.
- **Validate external input** — treat every request body/query as untrusted.
- **Do not trust client-provided IDs/roles** — always re-resolve ownership/scopes from the session.
- **Avoid leaking internal errors** — return generic messages to the client; log the real error server-side.
- **Sanitize user-controlled output** where it is rendered as HTML.

---

## 📊 OBSERVABILITY

Production-grade apps need visibility, not just structure:

- **Logging** — structured, leveled logs; never log secrets or PII.
- **Error tracking** — capture uncaught exceptions with context (stack, user, request).
- **Request IDs** — propagate a `requestId`/`traceId` across a request for correlation.
- **Performance monitoring** — Web Vitals (LCP, INP, CLS) and API latency.
- **Audit logging** — for sensitive actions (auth, payments, admin mutations) when required.

---

## 🔧 BEST PRACTICES

1. **One Page = One Folder**
   - Each route gets its own directory with `page.tsx` (App Router) or `index.tsx` (Pages Router). Co-locate page-specific components in the same folder.

2. **Environment-Based Config with `.env` Files** <!-- ПІДТВЕРДЖЕНО: 7/9 репо використовують per-environment `.env` замість гілок коду — див. analysis-synthesis/config-deps-consensus.md -->
   - Use `NEXT_PUBLIC_` prefix (Next.js) or `VITE_` prefix (Vite) for client-side vars. Never expose server secrets to the client bundle.

3. **Static vs Dynamic Rendering**
   - Default to SSG (`generateStaticParams`) for marketing pages. Use SSR (`cookies()`, `headers()`) only when data changes per-request.

4. **Assets in `public/` for Static, `src/assets/` for Bundled**
   - `public/` for favicons, robots.txt, large media. `src/assets/` for images imported into components (processed by bundler).

5. **Commit lockfiles for deterministic installs**
   - Commit `package-lock.json`, `pnpm-lock.yaml`, or `composer.lock` so every machine gets an identical dependency tree. <!-- ДОДАНО: consensus 8/9; див. analysis-synthesis/config-deps-consensus.md "Коміт lockfile-ів для детермінованих інсталяцій" -->

6. **Prefer monorepo over polyrepo for closely coupled packages**
   - Use a single repository with workspaces (pnpm/Yarn/npm) + Turborepo when multiple packages share types, CI, or release cadence. Keep polyrepo for independently versioned plugins or frameworks. <!-- ПІДТВЕРДЖЕНО: 8/9 репо віддають перевагу monorepo (Appwrite, Cal.com, Drizzle, Medusa, NestJS, Next-Auth, Prisma Next, tRPC); єдиний виняток — Fastify (polyrepo через екосистему плагінів) — див. analysis-synthesis/config-deps-consensus.md -->

7. **Use SemVer ranges for external deps, exact pinning for internal workspace packages**
   - External: caret (`^`) or tilde (`~`) ranges for automatic patch updates. Internal: exact versions or `workspace:*` / `workspace:^` protocol. Consider `resolutions` / `overrides` only when pinning transitive dependencies for CVE fixes. <!-- ДОДАНО: уточнення за consensus 9/9; приклади з NestJS (`^12.0.0`), tRPC (`zod: ^4.2.1`, `@trpc/server: 11.18.0`), Medusa (`resolutions`) — див. analysis-synthesis/config-deps-consensus.md "SemVer-діапазони" -->

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: src/shared/constants/routes.ts
export const Routes = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  PROFILE: (id: string) => `/profile/${id}`,
} as const;

// File: src/shared/types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
      NEXT_PUBLIC_APP_NAME: string;
      DATABASE_URL: string;
      SECRET_KEY: string;
    }
  }
}

// File: src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../providers/Providers';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? 'My App',
  description: 'Production-ready web application',
  openGraph: {
    images: ['/images/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// File: src/providers/Providers.tsx
'use client';

import { QueryProvider } from './QueryProvider';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>{children}</AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

// File: src/app/dashboard/page.tsx
import { DashboardContent } from '@/features/dashboard';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession();
  if (!session) redirect('/login');

  return <DashboardContent user={session.user} />;
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// File: src/App.tsx — 500+ lines, pages inline, hardcoded strings, no types

import React from 'react';

// ALL PAGES IN ONE FILE
function HomePage() {
  return <div>Welcome!</div>;
}

function LoginPage() {
  const [email, setEmail] = React.useState('');
  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={() => fetch('https://api.production.com/auth/login', { // HARDCODED URL
        method: 'POST',
        body: JSON.stringify({ email }),
      })}>Login</button>
    </div>
  );
}

function App() {
  const [page, setPage] = React.useState('home');
  return page === 'home' ? <HomePage /> : <LoginPage />;  // STRING LITERAL ROUTING
}
```

**Why this is bad:**
- All pages in one file — unmaintainable at scale.
- Hardcoded API URL — breaks across environments.
- String literal routing — silent runtime failures.
- No TypeScript types — no compile-time safety.
- No SSR/SSG strategy — poor SEO and performance.

---

## 🚨 COMMON MISTAKES
1. **Flat page directories** – Pages in a single folder without per-route structure makes refactoring painful.
2. **Hardcoding environment URLs** – Use `.env` files and framework-specific prefixes (`NEXT_PUBLIC_`, `VITE_`).
3. **String navigation targets** – Always use typed route constants; typos cause silent failures.
4. **Mixing server and client components** – Mark client components explicitly with `'use client'`; keep server components as the default.
5. **Over-engineering a small app** – Creating all global layers (`store/`, `services/`, `api/`, `hooks/`) upfront for a tiny project adds more friction than value. Start minimal, promote on reuse. <!-- ПІДТВЕРДЖЕНО: узгоджено з принципом JIT Abstraction та практикою репо — див. analysis-synthesis/architecture-consensus.md -->
6. **Circular feature imports** – Feature A importing Feature B directly. Extract the shared contract into `shared/` instead. <!-- ПІДТВЕРДЖЕНО: 9/9 репо мають стратегію запобігання cyclic deps — див. analysis-synthesis/architecture-consensus.md -->
7. **Imposing arbitrary file-size limits** – Do not split files solely to stay under 300/500 lines. Split only when a file gains multiple unrelated responsibilities. <!-- ДОДАНО: consensus 9/9 відсутність жорсткого ліміту за розміром файлів; див. analysis-synthesis/architecture-consensus.md -->
8. **Premature abstraction in shared layers** – Do not create `shared/services/` or `shared/api/` before two features actually reuse the logic. YAGNI. <!-- ПІДТВЕРДЖЕНО: узгоджено з принципом JIT Abstraction та практикою репо — див. analysis-synthesis/architecture-consensus.md, analysis-synthesis/config-deps-consensus.md -->
9. **Framework-level feature flags** – Avoid embedding complex feature-flag systems into the framework itself. Use database-backed flags or separate services for application-level toggles. <!-- ДОДАНО: слабкий сигнал consensus 8/9; Cal.com використовує БД + Redis для flags, фреймворки зазвичай їх не мають — див. analysis-synthesis/config-deps-consensus.md -->

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Are features grouped under `features/` with co-located `components/`, `hooks/`, `api/`, `types/`?
- [ ] Is single-feature logic local to that feature (not prematurely promoted to global layers)?
- [ ] Does each feature expose a public `index.ts` that other features import from?
- [ ] Do dependencies follow `app → features → shared → external` with no upward/circular imports?
- [ ] Is server-derived state using a server-state solution (not hand-rolled in a global store)?
- [ ] Is data-fetching strategy (SSR vs SSG) chosen per page based on how often data changes?
- [ ] Are `.env.example` and per-environment `.env` files present, with no secrets exposed to the client?
- [ ] Do all async features handle loading/error/empty/success (and define retry)?
- [ ] Is `public/` populated with favicon, robots.txt, and static assets?
- [ ] Are lockfiles committed (`package-lock.json`, `pnpm-lock.yaml`, `composer.lock`)? <!-- ДОДАНО: consensus 8/9; див. analysis-synthesis/config-deps-consensus.md -->
- [ ] For monorepos: does `turbo.json` define `build`, `test`, `lint`, `typecheck` pipelines with `^build` dependencies? <!-- ДОДАНО: consensus 6/9; див. analysis-synthesis/architecture-consensus.md, analysis-synthesis/config-deps-consensus.md -->

---

## 📚 CHEATSHEET
| Directory | Purpose | Key Pattern |
|---|---|---|
| `app/` or `pages/` | Route-level UI | One folder per route, `page.tsx` |
| `features/` | Domain logic co-located by feature | Self-contained `components/hooks/api/types` + public `index.ts` <!-- ПІДТВЕРДЖЕНО: 9/9 репо використовують feature-based організацію — див. analysis-synthesis/architecture-consensus.md -->
| `shared/` (or `components/`,`hooks/`,`utils/`) | Reused cross-feature code | Promoted only after 2+ features reuse it <!-- ПІДТВЕРДЖЕНО: 7/9 репо організовують спільний код за доменами/пакетами — див. analysis-synthesis/config-deps-consensus.md -->
| `hooks/` | Business logic | `use*` naming, return typed interfaces |
| `store/` | Global client state | Feature-based slices, memoized selectors |
| `api/` | Data access | Centralized client, typed endpoints |
| `constants/` | App-wide values | `as const` assertions, typed exports |
| `types/` | TypeScript types | Global augmentations, shared DTOs |
| `turbo.json` | Monorepo orchestration | Pipeline tasks with `^build` dependencies and caching <!-- ДОДАНО: consensus 6/9; див. analysis-synthesis/config-deps-consensus.md "Turbo для оркестрації збірки в monorepo" -->

---

## 🔗 RELATED SKILLS
- ⬇️ [`web-components-patterns`] – Reusable UI primitives that live in `shared/components`
- ⬇️ [`web-state-management`] – Store configuration and state management per feature
- ⬇️ [`web-api-client`] – API client and endpoints in `shared/api`
- ⬇️ [`web-performance`] – Optimization applied across all layers
- ⬇️ [`web-security`] – Web-specific security (XSS, CSRF, CORS, headers)

---

## 📝 NOTES
- For Next.js App Router: use `loading.tsx` and `error.tsx` co-located with routes for route-level loading/error states (see ASYNC STATE MODEL for feature-level states).
- For Vite: configure `vite.config.ts` with path aliases (`@/` → `src/`).
- For Astro: use `src/pages/` for routes, `src/components/` for islands, `src/layouts/` for shared layouts.
- Monorepo structure (pnpm/Yarn workspaces + Turborepo) is recommended for projects with 2+ packages sharing types, CI, or release cadence. Standalone frameworks or plugin ecosystems (like Fastify) may remain polyrepo. <!-- ПІДТВЕРДЖЕНО: 8/9 віддають перевагу monorepo; єдиний виняток — Fastify через децентралізовану екосистему плагінів — див. analysis-synthesis/config-deps-consensus.md -->
- **Feature flags**: in frameworks/libraries, keep flags minimal or absent. In applications, implement them as separate services or database-backed configuration rather than embedding complex flag systems into the framework itself. <!-- ДОДАНО: слабкий сигнал consensus 8/9; Cal.com — БД + Redis + 3 рівні, інші репо — відсутність вбудованих flags — див. analysis-synthesis/config-deps-consensus.md -->
- **File size**: 9/9 production-репозиторіїв не накладають штучних лімітів на розмір файлів. Файли до 5000+ рядків зберігаються як єдиний cohesive module, якщо розбиття зламає інкапсуляцію. <!-- ДОДАНО: consensus 9/9; див. analysis-synthesis/architecture-consensus.md -->
- **Env validation**: 7/9 репо використовують lazy validation з дефолтами для інтеграційних ключів, але fail-fast для критичних секретів. Дозволяє запускати додаток без повної конфігурації для локальної розробки та тестів. <!-- ДОДАНО: consensus 7/9; див. analysis-synthesis/config-deps-consensus.md "Lazy-валідація env-змінних" -->

---

**Last Updated:** 2026-08-29
**Version:** 4.0 (Updated with analysis from 9 production repos: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC, 2026-08-29)
