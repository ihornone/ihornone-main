# Skills Ecosystem

Production-ready agent skills for building scalable, high-throughput, and resilient applications.

---

## Architecture

```
                    ┌─────────────────────┐
                    │   UNIVERSAL LAYER   │
                    │   (principles)      │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼──────┐ ┌─────▼──────┐ ┌──────▼─────────┐
    │  WEB (6)       │ │ MOBILE (4) │ │ TELEGRAM (5)   │
    │  React/Next.js │ │ RN/Expo/   │ │ grammY/        │
    │  Vue/Svelte    │ │ Flutter    │ │ Node.js        │
    └────────────────┘ └────────────┘ └────────────────┘
```

**Rule:** Universal skills provide principles. Specific skills provide implementation. Specific skills may refine universal rules but never break them.

---

## Priority Model

When skills conflict, the AI agent follows this priority:

```
1. Project-level rules (user's explicit instructions)
2. Platform-specific skill (web, mobile, telegram)
3. Universal skill (language-level principles)
4. Personal preference (never override 1–3)
```

Each SKILL.md contains its own ⚖️ PRIORITY section for fine-grained resolution.

---

## Loading Combinations

### Solo Usage

| Scenario | Load | Result |
|---|---|---|
| Generic project (CLI, library, worker) | Universal only | Language-level principles for any codebase |
| Web app | Web skills only | Full web stack (structure, components, state, API, perf, security) |
| Mobile app | Mobile skills only | Full mobile stack (RN/Expo/Flutter) |
| Telegram bot | Telegram skills only | Full bot stack (grammY, Prisma, async) |

### Combined Usage (Universal + Platform)

| Scenario | Load | Result |
|---|---|---|
| Web app with engineering standards | Universal + Web | Principles + web implementation |
| Mobile app with engineering standards | Universal + Mobile | Principles + mobile implementation |
| Telegram bot with engineering standards | Universal + Telegram Bot | Principles + bot implementation |

### Platform-Specific Skills Are Self-Contained

Each platform layer (Web, Mobile, Telegram) is **self-contained**. You do NOT need to load universal skills to use them. Universal skills add engineering discipline on top.

---

## Universal Skills

Language-level principles. Zero framework code. Apply to TypeScript, Python, Go, Rust, or any backend/frontend/mobile/bot/CLI.

| Skill | What It Does | When to Load |
|---|---|---|
| [`async-patterns-universal`](./async-patterns-universal/SKILL.md) | Non-blocking code, concurrency, timeouts, cancellation, race conditions | Any async work |
| [`error-handling-standards`](./error-handling-standards/SKILL.md) | Error hierarchy, typed errors, retry logic, circuit breaker | Any error handling |
| [`logging-standards`](./logging-standards/SKILL.md) | Structured JSON logging, context propagation, redaction | Any logging |
| [`security-checklist`](./security-checklist/SKILL.md) | Injection prevention, auth, secrets management | Any security review |
| [`testing-patterns`](./testing-patterns/SKILL.md) | Unit, integration, E2E tests, mocking, AAA pattern | Any test writing |
| [`naming-conventions`](./naming-conventions/SKILL.md) | Functions, variables, classes, files, directories | Any naming review |
| [`performance-optimization`](./performance-optimization/SKILL.md) | Caching, DB optimization, profiling, lazy loading | Any performance work |
| [`git-workflow`](./git-workflow/SKILL.md) | Branches, commits, PRs, rebase, semantic versioning | Any git workflow |
| [`code-structure-verification`](./code-structure-verification/SKILL.md) | Structure contracts, orphan detection, duplicates | Any structure audit |
| [`api-documentation`](./api-documentation/SKILL.md) | HTTP API docs (OpenAPI/Swagger) — HTTP-specific | HTTP API documentation |
| [`readme-template`](./readme-template/SKILL.md) | Adaptive README for any project type | README generation |
| [`roadmap-template`](./roadmap-template/SKILL.md) | Adaptive roadmap for any planning model | Roadmap creation |

---

## Web Skills

React, Next.js, Vue, Svelte, Astro web applications. Each skill is self-contained.

| Skill | What It Does | When to Load |
|---|---|---|
| [`web-project-structure`](./web-project-structure/SKILL.md) | Directory architecture, routing, SSR/SSG, env config | New web project setup |
| [`web-components-patterns`](./web-components-patterns/SKILL.md) | Reusable UI, composition, accessibility, error boundaries | Component development |
| [`web-state-management`](./web-state-management/SKILL.md) | Global state, selectors, SSR hydration, persistence | State architecture |
| [`web-api-client`](./web-api-client/SKILL.md) | HTTP client, interceptors, caching, optimistic updates | API integration |
| [`web-performance`](./web-performance/SKILL.md) | Code splitting, Web Vitals, caching, bundle optimization | Performance optimization |
| [`web-security`](./web-security/SKILL.md) | XSS, CSRF, CORS, security headers, CSP | Security hardening |

### Web Load Order

```
web-project-structure
  → web-components-patterns
    → web-state-management
      → web-api-client
        → web-performance
          → web-security
```

---

## Mobile Skills

React Native, Expo, Flutter cross-platform mobile apps. Each skill is self-contained.

| Skill | What It Does | When to Load |
|---|---|---|
| [`mobile-project-structure`](./mobile-project-structure/SKILL.md) | Directory architecture, navigation, environment config | New mobile project setup |
| [`mobile-components-ui`](./mobile-components-ui/SKILL.md) | Reusable UI components, composition, accessibility | Component development |
| [`mobile-state-management`](./mobile-state-management/SKILL.md) | Global state, selectors, persistence, async thunks | State architecture |
| [`mobile-api-integration`](./mobile-api-integration/SKILL.md) | HTTP client, interceptors, retry, caching, offline | API integration |

### Mobile Load Order

```
mobile-project-structure
  → mobile-components-ui
    → mobile-state-management
      → mobile-api-integration
```

---

## Telegram Bot Skills

grammY-based Node.js/TypeScript Telegram bots. Each skill is self-contained.

| Skill | What It Does | When to Load |
|---|---|---|
| [`telegram-bot-structure`](./telegram-bot-structure/SKILL.md) | Project architecture, file structure, configuration | New bot project setup |
| [`telegram-bot-handlers`](./telegram-bot-handlers/SKILL.md) | Type-safe handlers, callbacks, sessions, DI | Handler development |
| [`telegram-bot-database`](./telegram-bot-database/SKILL.md) | Prisma ORM, typed models, pooling, migrations | Database integration |
| [`telegram-bot-async-patterns`](./telegram-bot-async-patterns/SKILL.md) | Non-blocking execution, batching, task queues | Async patterns |
| [`telegram-bot-error-handling`](./telegram-bot-error-handling/SKILL.md) | Centralized errors, logging, admin alerts | Error handling |

### Telegram Bot Load Order

```
telegram-bot-structure
  → telegram-bot-handlers
    → telegram-bot-database
      → telegram-bot-async-patterns
        → telegram-bot-error-handling
```

---

## Skill Descriptions (Quick Reference)

### Universal — What Each Skill Covers

| Skill | Covers | Does NOT Cover |
|---|---|---|
| `async-patterns-universal` | async/await, Promise.all, timeouts, cancellation, deadlocks | Framework-specific async (React hooks, grammY middleware) |
| `error-handling-standards` | Error hierarchy, retry logic, circuit breaker, cause preservation | HTTP middleware (Express, FastAPI), transport-specific codes |
| `logging-standards` | JSON logging, context propagation, redaction, levels | HTTP request logging middleware, framework-specific loggers |
| `security-checklist` | SQL injection, command injection, SSRF, auth, secrets | XSS, CSRF, CORS, security headers → see `web-security` |
| `testing-patterns` | Unit, integration, E2E, mocking, AAA, coverage | React Testing Library, Jest DOM, framework-specific test utils |
| `naming-conventions` | camelCase, snake_case, PascalCase, UPPER_SNAKE_CASE | CSS classes (BEM), REST API endpoint naming |
| `performance-optimization` | Caching, DB optimization, profiling, debounce/throttle | Core Web Vitals, image optimization, code splitting → see `web-performance` |
| `git-workflow` | Branches, commits, PRs, rebase, semantic versioning | CI/CD pipelines, deployment strategies |
| `code-structure-verification` | Structure contracts, orphan detection, depth limits | Framework-specific entry points (page.tsx, layout.tsx) |
| `api-documentation` | OpenAPI/Swagger, endpoint docs, code examples | GraphQL schemas, gRPC protobuf, non-HTTP APIs |
| `readme-template` | Adaptive README for any project type | Changelog, contributing guide, license management |
| `roadmap-template` | Adaptive roadmap for any planning model | Product strategy, OKR tracking |

### Web — What Each Skill Covers

| Skill | Covers | Does NOT Cover |
|---|---|---|
| `web-project-structure` | Next.js/Vite/Astro/Remix/SvelteKit structure, SSR/SSG | Mobile structure, Telegram bot structure |
| `web-components-patterns` | React/Vue/Svelte components, ARIA, compound patterns | React Native components, Flutter widgets |
| `web-state-management` | Redux, Zustand, Jotai, SSR hydration | Redux Toolkit for mobile, Riverpod for Flutter |
| `web-api-client` | Axios, TanStack Query, token refresh, caching | Dio for Flutter, Axios for React Native |
| `web-performance` | Web Vitals, code splitting, image optimization, Lighthouse | Mobile performance, server-side profiling |
| `web-security` | XSS, CSRF, CORS, CSP, security headers | SQL injection, auth, secrets → see `security-checklist` |

### Mobile — What Each Skill Covers

| Skill | Covers | Does NOT Cover |
|---|---|---|
| `mobile-project-structure` | RN/Expo/Flutter structure, flavors, navigation | Web structure, Telegram bot structure |
| `mobile-components-ui` | RN Pressable, Flutter widgets, design tokens, accessibility | Web components, HTML elements |
| `mobile-state-management` | Redux/Zustand for RN, Riverpod/BLoC for Flutter | Web state management, SSR hydration |
| `mobile-api-integration` | Axios/Dio clients, secure storage, offline support | Web API clients, TanStack Query |

### Telegram Bot — What Each Skill Covers

| Skill | Covers | Does NOT Cover |
|---|---|---|
| `telegram-bot-structure` | grammY architecture, DI, feature-based structure | Web/mobile project structure |
| `telegram-bot-handlers` | Callback lifecycle, typed payloads, authorization | Web routing, mobile navigation |
| `telegram-bot-database` | Prisma ORM, BigInt Telegram IDs, connection pooling | Web database patterns, mobile SQLite |
| `telegram-bot-async-patterns` | Semaphores, task queues, background lifecycle | Web async patterns, mobile async |
| `telegram-bot-error-handling` | Domain exceptions, admin alerts, retry strategy | Web error middleware, global error boundaries |

---

## Anti-Patterns (What NOT to Do)

| Anti-Pattern | Why It's Wrong | Correct Approach |
|---|---|---|
| Load universal skills only for web project | Misses web-specific patterns (SSR, Web Vitals, CSP) | Load Universal + Web |
| Load web skills for Telegram bot | Web patterns don't apply to Telegram protocol | Load Telegram skills only |
| Assume universal skill covers XSS | XSS is web-specific (browser DOM) | Use `web-security` for XSS |
| Assume universal skill covers Web Vitals | Web Vitals are browser-specific | Use `web-performance` for Web Vitals |
| Mix mobile and web skills | Different platforms, different APIs | Use correct platform layer |
| Load all skills at once | Unnecessary context, potential confusion | Load only what's needed |

---

## Supported Technologies

### Universal Skills

- TypeScript / JavaScript
- Python
- Go
- Rust
- Any language with async/await or concurrency primitives

### Platform Skills

| Platform | Technologies |
|---|---|
| Web | Next.js, Vite, Astro, Remix, SvelteKit, React, Vue, Svelte |
| Mobile | React Native, Expo, Expo Router, Flutter (with flavors) |
| Telegram Bot | grammY, Node.js/TypeScript, Prisma ORM, PostgreSQL |

---

## File Structure

```
ihornone-skills/
├── SKILL_TEMPLATE.md                    # Template for creating new skills
├── README.md                            # This file
│
├── async-patterns-universal/SKILL.md    # UNIVERSAL
├── error-handling-standards/SKILL.md    # UNIVERSAL
├── logging-standards/SKILL.md           # UNIVERSAL
├── security-checklist/SKILL.md          # UNIVERSAL
├── testing-patterns/SKILL.md            # UNIVERSAL
├── naming-conventions/SKILL.md          # UNIVERSAL
├── performance-optimization/SKILL.md    # UNIVERSAL
├── git-workflow/SKILL.md                # UNIVERSAL
├── code-structure-verification/SKILL.md # UNIVERSAL
├── api-documentation/SKILL.md           # UNIVERSAL (HTTP-specific)
├── readme-template/SKILL.md             # UNIVERSAL
├── roadmap-template/SKILL.md            # UNIVERSAL
│
├── web-project-structure/SKILL.md       # WEB
├── web-components-patterns/SKILL.md     # WEB
├── web-state-management/SKILL.md        # WEB
├── web-api-client/SKILL.md              # WEB
├── web-performance/SKILL.md             # WEB
├── web-security/SKILL.md                # WEB
│
├── mobile-project-structure/SKILL.md    # MOBILE
├── mobile-components-ui/SKILL.md        # MOBILE
├── mobile-state-management/SKILL.md     # MOBILE
├── mobile-api-integration/SKILL.md      # MOBILE
│
├── telegram-bot-structure/SKILL.md      # TELEGRAM BOT
├── telegram-bot-handlers/SKILL.md       # TELEGRAM BOT
├── telegram-bot-database/SKILL.md       # TELEGRAM BOT
├── telegram-bot-async-patterns/SKILL.md # TELEGRAM BOT
└── telegram-bot-error-handling/SKILL.md # TELEGRAM BOT
```

**Total: 27 skills** (12 Universal + 6 Web + 4 Mobile + 5 Telegram Bot)

---

## How Skills Reference Each Other

```
UNIVERSAL SKILLS reference each other:
  error-handling ←→ logging ←→ async-patterns
  security-checklist ←→ error-handling
  testing-patterns ←→ git-workflow
  code-structure ←→ naming-conventions

WEB SKILLS reference each other:
  web-project-structure ←→ web-components ←→ web-state ←→ web-api-client
  web-performance ←→ web-api-client
  web-security ←→ web-project-structure

MOBILE SKILLS reference each other:
  mobile-project-structure ←→ mobile-components ←→ mobile-state ←→ mobile-api

TELEGRAM SKILLS reference each other:
  telegram-bot-structure ←→ telegram-bot-handlers ←→ telegram-bot-database
  telegram-bot-async ←→ telegram-bot-error-handling

PLATFORM SKILLS reference universal skills:
  web-performance → performance-optimization
  web-security → security-checklist
  telegram-bot-error-handling → error-handling-standards (principles only)
```

**Never circular.** Dependencies flow downward. Universal → Specific. Never Specific → Universal (except for principle references).

---

## AI Agent: Skill Discovery

### How to Find the Right Skill

AI agents use two mechanisms to discover skills:

**1. skills-registry.json** — Machine-readable registry with tags, triggers, and dependency rules.

```json
{
  "id": "web-security",
  "tags": ["xss", "csrf", "cors", "csp", "security-headers"],
  "triggers": ["xss prevention", "csrf protection", "cors setup"],
  "refines": "security-checklist"
}
```

**2. find-skill.py** — Command-line search tool.

```bash
# Search by keyword
python3 find-skill.py async
python3 find-skill.py security
python3 find-skill.py "token refresh"

# Search by project type
python3 find-skill.py --project-type web
python3 find-skill.py --project-type mobile
python3 find-skill.py --project-type telegram

# Search by task
python3 find-skill.py --task security_review
python3 find-skill.py --task performance_review
python3 find-skill.py --task new_project

# Search by tags (must match ALL)
python3 find-skill.py --tags async timeout

# List all skills
python3 find-skill.py --list-all
```

### Discovery Algorithm

```
1. Identify project type (web / mobile / telegram / cli / library / backend)
2. Load platform-specific skills for that type
3. Identify task (security review, performance, testing, etc.)
4. Load universal skills needed for that task
5. Check each skill's RELATED SKILLS for additional dependencies
6. Load skills in dependency order
```

### Quick Decision Table

| User asks about... | Load these skills |
|---|---|
| "Fix XSS" | `web-security` |
| "Fix SQL injection" | `security-checklist` |
| "Add caching" | `performance-optimization` (universal) + `web-performance` (if web) |
| "Write tests" | `testing-patterns` (universal) + platform-specific test patterns |
| "Set up logging" | `logging-standards` |
| "Handle errors" | `error-handling-standards` (universal) + platform-specific error handling |
| "Name this variable" | `naming-conventions` |
| "Create a component" | Platform-specific: `web-components-patterns` or `mobile-components-ui` |
| "Set up state" | Platform-specific: `web-state-management` or `mobile-state-management` |
| "Write README" | `readme-template` |
| "Plan roadmap" | `roadmap-template` |
| "Set up git" | `git-workflow` |
| "Document API" | `api-documentation` |
