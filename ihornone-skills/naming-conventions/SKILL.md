---
name: naming-conventions
description: Universal naming convention standards for functions, variables, classes, constants, files, directories, environment variables, and types across TypeScript, Python, Go, and Rust. For web-specific naming (CSS classes, API endpoints), see web-project-structure.
---

# 📌 Naming Conventions

## 🎯 GOAL
**One sentence:** Enforce consistent, predictable naming across all code elements so any developer can infer type, scope, and purpose from a name alone.

> Example:
> `getUserById` (function), `userName` (variable), `UserService` (class), `API_BASE_URL` (constant), `user-profile.ts` (file).

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Language/compiler/framework conventions** — Go initialisms, Rust `snake_case`, etc.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — `.eslintrc`, `pyproject.toml`, team docs.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> Example: If an existing Python project uses `user_service.py`, do NOT rename to `user-service.py` just because this skill prefers kebab-case.

---

## 💡 KEY PRINCIPLES
- **Names Reveal Intent** – A name should answer "what is this?" not "how does it work?"
- **Consistency Across Codebase** – Same element type = same naming pattern, everywhere.
- **Avoid Ambiguous Abbreviations** – Standard domain and technical abbreviations (`id`, `url`, `api`, `http`, `uuid`, `db`, `cpu`, `ui`) are allowed when they improve readability. Avoid project-specific or unclear abbreviations: `userId` not `uid`, `maxRetries` is acceptable, `maximumRetryCount` is verbose.
- **Context Over Brevity** – Prefer `selectedUser` over `user` when context matters.

---

## 📁 NAMING RULES BY ELEMENT

### Functions / Methods

| Rule | Convention | Example | Anti-Pattern |
|---|---|---|---|
| General | `camelCase` (JS/TS) or `snake_case` (Python/Go) | `getUserById`, `create_new_post` | `getData`, `process`, `handle` |
| Prefix with verb | What it does | `validateEmail`, `formatCurrency` | `emailValidator`, `currencyFormatter` |
| Boolean returns | `is`, `has`, `can`, `should` | `isLoading`, `hasPermission`, `canEdit` | `loading`, `permission`, `edit` |
| Private methods | Prefix with `_` (Python) or `#` (TS) | `_validate()`, `#compute()` | `privateValidate()` |

### Variables

| Rule | Convention | Example | Anti-Pattern |
|---|---|---|---|
| General | `camelCase` | `userName`, `retryCount` | `u`, `x`, `temp` |
| Boolean | `is`, `has`, `can` prefix | `isActive`, `hasAccess` | `active`, `access`, `flag` |
| Collections | Plural noun | `users`, `errorMessages` | `userList`, `errorsArray` |
| Functions as values | `camelCase` verb phrase | `handleClick`, `formatDate` | `clickHandler`, `dateFormatter` |

### Classes / Interfaces / Types

| Rule | Convention | Example | Anti-Pattern |
|---|---|---|---|
| Classes | `PascalCase`, noun | `UserService`, `ApiClient` | `userService`, `handleData` |
| Interfaces | `PascalCase`, noun (no `I` prefix) | `UserProfile`, `ApiResponse` | `IUserProfile`, `UserType` |
| Type aliases | `PascalCase` | `UserId`, `RequestStatus` | `userId`, `request_status` |
| Enums | `PascalCase` for type, `UPPER_SNAKE` for values | `Status.ACTIVE` | `status.active` |

### Constants

| Rule | Convention | Example | Anti-Pattern |
|---|---|---|---|
| Global constants | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRY_COUNT` | `apiBaseUrl`, `maxRetryCount` |
| Module-level | `UPPER_SNAKE_CASE` | `DB_TIMEOUT_MS`, `DEFAULT_PAGE_SIZE` | `dbTimeout` |
| Magic numbers | Always extract to named constant | `const SECONDS_IN_HOUR = 3600` | Using `3600` inline |

### Files

> Follow the project's established file naming convention. If no project convention exists, use the framework/language default below.

| Context | Convention | Example |
|---|---|---|
| TypeScript/JavaScript | `kebab-case.ts` or `camelCase.ts` | `user-profile.ts`, `formatDate.ts` |
| React components | `PascalCase.tsx` or `kebab-case.tsx` (project choice) | `UserProfile.tsx` or `user-profile.tsx` |
| Python | `snake_case.py` | `user_service.py`, `database_config.py` |
| Go | `snake_case.go` | `user_service.go` |
| Rust | `snake_case.rs` | `user_service.rs` |
| Tests | `*.test.ts`, `*_test.py`, `*_test.go` | `user.test.ts`, `user_test.py` |
| Config | Framework/language default | `pyproject.toml`, `Cargo.toml` |

### Directories

| Rule | Convention | Example | Anti-Pattern |
|---|---|---|---|
| General | `kebab-case` | `components/`, `services/`, `utils/` | `Component/`, `Utilities/` |
| Features | `kebab-case` | `user-auth/`, `dashboard/` | `UserAuth/`, `user_auth/` |

### Environment Variables

| Rule | Convention | Example | Anti-Pattern |
|---|---|---|---|
| All env vars | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` | `databaseUrl`, `jwtSecret` |

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// Constants — UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com/v1';
const MAX_RETRY_COUNT = 3;
const DEBOUNCE_DELAY_MS = 300;

// Types — PascalCase, noun, no prefix
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
}

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

// Functions — camelCase, verb prefix
function getUserById(userId: string): Promise<UserProfile> { /* ... */ }
function validateEmail(email: string): boolean { /* ... */ }
function formatCurrency(amount: number, currency: string): string { /* ... */ }

// Variables — camelCase
const userName = 'John';
const retryCount = 0;
const isLoading = false;
const errorMessages: string[] = [];

// Boolean variables — is/has/can prefix
const isSelected = true;
const hasPermission = false;
const canEdit = true;

// Classes — PascalCase, noun
class UserService {
  private readonly apiClient: ApiClient;

  async findUserById(id: string): Promise<UserProfile> { /* ... */ }
}

// Files — user-profile.ts, user.types.ts, user.test.ts
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// BAD: Inconsistent, abbreviated, meaningless names

const x = 'https://api.example.com/v1';  // Magic string, no constant name
let u = 'John';                            // Abbreviated
let temp = true;                           // Meaningless
var data;                                  // var + vague name

function process(d) { return d; }          // Verb without context
function getData() { /* ... */ }           // "get" without what

class userService { }                      // camelCase class
interface IUserProfile { }                 // I-prefix (Java convention)
```

---

## 🚨 COMMON MISTAKES
1. **Ambiguous abbreviations** – `uid` → `userId`, `msg` → `message`. Standard abbreviations (`id`, `url`, `api`, `http`) are fine.
2. **Generic names** – `data`, `info`, `temp`, `result` → always qualify with domain.
3. **Inconsistent case** – Same element type must use same case everywhere.
4. **Magic numbers** – Extract `3600` to `SECONDS_IN_HOUR`, `1000` to `MS_PER_SECOND`.
5. **Ignoring project conventions** – Don't rename existing code to match this skill's defaults.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Priority respected: language > existing project > project rules > this skill
- [ ] Functions use camelCase/snake_case with verb prefix
- [ ] Variables use camelCase with meaningful names
- [ ] Classes use PascalCase nouns
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] Files follow project convention (or language default)
- [ ] Directories use kebab-case
- [ ] Environment variables use UPPER_SNAKE_CASE
- [ ] No ambiguous abbreviations (standard technical abbreviations allowed)

---

## 📚 CHEATSHEET
| Element | TypeScript/JavaScript | Python | Go | Rust |
|---|---|---|---|---|
| Function | `getUserById` | `get_user_by_id` | `GetUserByID` | `get_user_by_id` |
| Variable | `userName` | `user_name` | `userName` | `user_name` |
| Class | `UserService` | `UserService` | `UserService` | `UserService` |
| Constant | `API_BASE_URL` | `API_BASE_URL` | `APIBaseURL` | `API_BASE_URL` |
| File | `user-profile.ts` | `user_service.py` | `user_service.go` | `user_service.rs` |
| Interface | `UserProfile` | N/A (use Protocol) | N/A | N/A |
| Enum | `Status.Active` | `Status.ACTIVE` | `StatusActive` | `Status::Active` |

---

## 🔗 RELATED SKILLS
- ⬆️ [`code-structure-verification`] – Validates directory and file naming
- ⬇️ [`error-handling-standards`] – Error class naming conventions
- ⬇️ [`logging-standards`] – Log message naming conventions

---

## 📝 NOTES
- For Go: exported functions use `PascalCase`, unexported use `camelCase`. Go initialisms follow official conventions: `ID`, `URL`, `HTTP`, `API`, `JSON`, `UUID`, `DB`, `TCP`, `TLS` — e.g. `userID`, `HTTPClient`, `APIClient`, not `userId`, `HttpClient`, `ApiClient`.
- For Rust: follow `rustfmt` defaults — `snake_case` for functions/variables, `PascalCase` for types.
- Enforce naming via linters: `eslint` (naming-convention rule), `pylint` (naming styles), `golint`.
- **Web-specific naming:** For CSS classes (BEM), API endpoints (REST), and React component naming, see `web-project-structure`.

---

**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Universal Edition
