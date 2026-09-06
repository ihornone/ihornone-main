---
name: web-api-client
description: Production-grade centralized API client patterns for React, Next.js, Vue, and Svelte web applications using Axios, TanStack Query (React Query), and fetch. Covers typed interceptors, token refresh, retry with exponential backoff, timeout handling, error classification, caching, request deduplication, optimistic updates, API versioning, GraphQL, mocking, and rate limit handling.
---

# 📌 Web API Client

## 🎯 GOAL
**One sentence:** Implement a centralized, resilient, and typed HTTP client layer with interceptors, retry logic, caching, deduplication, optimistic updates, and graceful error classification.

> Example:
> Use a single `ApiClient` instance with typed request/response interfaces, automatic token injection, 401 refresh flow, TanStack Query for caching/deduplication, and `AbortController` for stale request cancellation.

---

## 💡 KEY PRINCIPIONS
- **Single HTTP Client** – One centralized client instance; never instantiate `axios` or `fetch` ad-hoc in components.
- **Typed Endpoints** – Every API call has typed request params, response body, and error shape.
- **Server State ≠ Client State** – Server-fetched data is managed by TanStack Query, not Redux/Zustand.
- **Fail Gracefully** – Classify errors (network, auth, server, validation) and handle each differently.
- **Security-First Auth** – Prefer HttpOnly, Secure, SameSite cookies for sensitive authentication credentials. Use browser storage for tokens only when the application's authentication architecture explicitly requires it and the security trade-off is understood.

---

## 🧠 API CLIENT DECISION RULES

Use this tree before choosing an HTTP client or pattern.

### HTTP client choice
- **Server Component (Next.js App Router)** → prefer framework-native `fetch` (no client state needed).
- **Client-side server state** → TanStack Query + `fetch` or `axios` adapter.
- **Complex auth/interceptor requirements** → `axios` can be justified (interceptors, request/response transforms).
- **Simple APIs** → native `fetch` may be sufficient.

### Retry logic
- **GET + network error** → retry with exponential backoff.
- **GET + 503/504** → retry (server temporarily unavailable).
- **GET + 429** → retry according to `Retry-After` header.
- **POST/PUT/PATCH + validation error (4xx)** → do NOT retry (client error).
- **POST/PUT/PATCH + 401/403** → do NOT retry (auth issue, handle separately).
- **DELETE + unknown failure** → do NOT blindly retry (may create duplicates).
- **Idempotent operations only** → safe to retry.

### Optimistic updates
- **Predictable result + safe rollback + immediate UI feedback improves UX** → use optimistic update.
- **Delete account, payment, password change, permission change, file upload, complex server transaction** → do NOT use optimistic update. Wait for server confirmation.

---

## 🔒 AUTH SECURITY

- **Prefer HttpOnly cookies** — tokens stored in HttpOnly, Secure, SameSite cookies are not accessible to JavaScript, protecting against XSS token theft.
- **localStorage for tokens** — only use when the authentication architecture explicitly requires client-side token access (e.g., attaching to custom headers). Understand the XSS trade-off.
- **Never log tokens** — request interceptors must not log Authorization headers.
- **Mask PII/secrets in logs** — redact fields such as `password`, `token`, `secret`, `refreshToken`, `apiKey`, `private_key`, `client_secret`, `authorization`, `auth`, `credential`, `hash`, `serviceAccountKey`, `encrypted_credentials`, `tenant_id`. Also mask sensitive values in request/response bodies before logging. Log only field names for 4xx errors; never include stack traces in client-facing error messages.
- **Token refresh** — use short-lived access tokens with refresh token rotation.

---

## 📐 API CONTRACT LAYER

Treat API responses as untrusted runtime data. TypeScript interfaces alone do not validate runtime values.

```
Transport layer (HTTP)
    ↓
Runtime validation (Zod / Valibot / Arktype)
    ↓
API DTO (typed response)
    ↓
Domain mapping (API DTO → domain model)
    ↓
Server-state cache (TanStack Query)
    ↓
UI (components)
```

<!-- УТОЧНЕНО: ApiResponse<T> wrapper is useful for complex responses (pagination, meta), but most production APIs (7/9) return raw JSON for standard CRUD. Use envelope selectively — analysis-synthesis/api-design-consensus.md -->
Для звичайних CRUD-операцій більшість production API повертають прямий JSON без обгортки `{data: ...}`. Обгортка `ApiResponse<T>` доцільна лише для складних відповідей (пагінація, мета-інформація, batch-операції), де потрібна додаткова інформація окрім даних ресурсу.

### Schema collocation
<!-- ДОДАНО: Validation schemas are placed alongside routes/endpoints, not in a single global location. Confirmed by 6/9 production repos (Appwrite, Cal.com, Drizzle, Medusa, NestJS, tRPC). -->
Схеми валідації розміщуються колоковано з маршрутами/ендпоінтами, а не в єдиному глобальному місці. Це зменшує ризик "розсинхрону" між schema і handler — при зміні контракту API зміна видима одразу в одному місці.

### Example
```typescript
// Runtime schema validation
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  createdAt: z.string().datetime(),
});

export type UserDTO = z.infer<typeof UserSchema>;

// Domain mapping
export function mapUser(dto: UserDTO): User {
  return {
    id: dto.id,
    displayName: dto.name,
    contactEmail: dto.email,
    profileImage: dto.avatar,
    joinedAt: new Date(dto.createdAt),
  };
}
```

---

## ⚡ IDEMPOTENCY & CONCURRENCY

<!-- УТОЧНЕНО: Most backend frameworks do not provide built-in idempotency support. Idempotency is implemented at the business-logic level; frameworks provide only the tools (middleware, interceptors). Consensus: 6/9 repos lack built-in idempotency — analysis-synthesis/api-design-consensus.md -->
Idempotency on the framework level: most production backend frameworks (Fastify, Drizzle, NestJS core, tRPC, Auth.js) do **not** provide built-in `Idempotency-Key` support. Ідемпотентність реалізується на рівні бізнес-логіки (domain keys, DB unique constraints), а framework надає лише інструменти (middleware, interceptors) для її підтримки.

### Idempotency keys
For operations where duplicate execution is harmful:
- **Payments, orders, webhooks, resource creation** — send an `Idempotency-Key` header with a unique UUID.
- Server uses the key to deduplicate identical requests.

### Race conditions
```
Request A starts → Request B starts → Request B finishes → Request A finishes
```
Request A must NOT overwrite newer data from B.

**Rules:**
- Use `AbortController` to cancel stale in-flight requests.
- TanStack Query handles this automatically with `queryKey` matching.
- For manual fetch/axios: track the latest request ID and ignore older responses.

### Pagination strategy
<!-- ДОДАНО: For large datasets use cursor-based pagination (cursor-based), for small — offset. This is especially important during parallel mutations. Consensus: 5/9 repos — analysis-synthesis/performance-consensus.md -->
Для великих наборів даних використовуй **курсорну пагінацію** (cursor-based: `cursor` + `limit`), для малих/іммutable наборів — **offset** пагінацію. Кursor пагінація особливо важлива при паралельних мутаціях, оскільки забезпечує стабільність результатів (не пропускає та не дублює записи при зміні даних між запитами).

### Mutation concurrency
- Do NOT allow concurrent mutations on the same resource without coordination.
- Use `useMutation({ mutationFn })` with TanStack Query's built-in queueing, or implement client-side locking.

### Domain isolation
<!-- ДОДАНО: Domain layer throws its own errors without HTTP status codes. Conversion to ApiError happens in interceptor or global handler. Consensus: 7/9 repos — analysis-synthesis/error-handling-consensus.md -->
Domain layer кидає власні помилки без HTTP-статусів (`status`); конвертація в `ApiError` відбувається в response interceptor або глобальному error handler. Це дозволяє використовувати ті самі сервіси з різними транспортами (HTTP, WebSocket, CLI) без зміни бізнес-логіки.

---

## 📁 API LAYER STRUCTURE

```
api/
├── client.ts                 # Centralized HTTP client with interceptors
├── interceptors/
│   ├── auth.ts               # Token injection & 401 refresh
│   ├── logging.ts            # Request/response logging
│   └── error.ts              # Error normalization
├── endpoints/                # Typed endpoint definitions per feature
│   ├── auth.ts
│   ├── user.ts
│   └── posts.ts
├── types/                    # API request/response types
│   ├── auth.types.ts
│   ├── user.types.ts
│   └── common.types.ts
├── hooks/                    # TanStack Query hooks
│   ├── useAuth.ts
│   ├── useUser.ts
│   └── usePosts.ts
├── graphql/                  # GraphQL queries & mutations (if applicable)
│   ├── client.ts
│   ├── queries/
│   └── mutations/
└── mock/                     # API mocking for tests
    ├── handlers.ts
    └── server.ts
```

---

## 🔧 BEST PRACTICES

1. **Use TanStack Query for Server State**
   - `useQuery` for fetching, `useMutation` for writes, `useInfiniteQuery` for pagination. Automatic caching, deduplication, and background refetch.

2. **Request Deduplication via Query Keys**
   - TanStack Query deduplicates requests with identical keys. No manual deduplication needed.

3. **Optimistic Updates for UX**
   - Use ONLY when the expected result is predictable, rollback is safe, and immediate UI feedback materially improves UX.
   - Do NOT use for destructive operations (delete account), financial operations (payments), or security operations (password change).
   - Use `onMutate` + `onError` + `onSettled` in `useMutation` for safe optimistic updates.

4. **API Versioning via Base URL**
   - Use `NEXT_PUBLIC_API_VERSION=v1` in env. Never hardcode `/v1/` in endpoint paths.

5. **Parallelize Independent API Calls** <!-- ДОДАНО: For independent API calls use Promise.all or TanStack Query's useQueries instead of sequential calls. Consensus: 7/9 repos — analysis-synthesis/performance-consensus.md -->
   - Для незалежних API-викликів використовуй `Promise.all` або TanStack Query's `useQueries`, а не послідовні виклики. Це зменшує загальну латентність та краще використовує I/O-bound час очікування.

6. **4xx Errors Are Not Logged as Errors** <!-- ДОДАНО: 4xx errors (bad input) are expected rejections, not bugs. Log at info level or skip. Consensus: 6/9 repos — analysis-synthesis/error-handling-consensus.md -->
   - 4xx помилки (невірний вхід, не знайдено, неавторизовано) не логуються на рівні `error` — це очікувані відхили, а не баги. Логуй їх на рівні `info` або пропускуй. Лише 5xx помилки (проблеми сервера) логуються як `error` для подальшого розслідування.

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: api/types/common.types.ts
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
  cause?: Error; // <!-- ДОДАНО: Preserve original error for debugging. Consensus: 8/9 repos use error cause chaining — analysis-synthesis/error-handling-consensus.md -->
}

export interface ApiResponse<T> {
  data: T;
  meta?: { page: number; total: number; perPage: number };
}

// File: api/types/user.types.ts
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  avatar?: string;
}

// File: api/client.ts
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError } from './types/common.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? 'v1';
const TIMEOUT_MS = 20_000;

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => (error || !token ? reject(error) : resolve(token)));
  failedQueue = [];
};

const client = axios.create({
  baseURL: `${BASE_URL}/${API_VERSION}`,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST INTERCEPTOR: Inject auth token
// SECURITY: Prefer HttpOnly cookies over localStorage for token storage.
// Cookies are not accessible to JavaScript, protecting against XSS token theft.
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // If using HttpOnly cookies, the browser automatically sends them.
    // No need to manually set Authorization header.
    // Only use localStorage if your auth architecture requires client-side token access.
    if (typeof window !== 'undefined') {
      // Example for cookie-based auth (browser handles automatically):
      // No manual header needed — cookies are sent automatically for same-origin.

      // If using localStorage (less secure, only when required):
      // const token = localStorage.getItem('auth_token');
      // if (token && config.headers) {
      //   config.headers.Authorization = `Bearer ${token}`;
      // }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle errors & token refresh
client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // SECURITY: Use HttpOnly refresh cookie — browser sends it automatically.
        // Server reads refresh token from cookie, not from request body.
        const { data } = await axios.post(`${BASE_URL}/${API_VERSION}/auth/refresh`, {}, {
          withCredentials: true, // Send cookies
        });
        // If using access token in header (short-lived):
        processQueue(null, data.token);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${data.token}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // SECURITY: Clear any client-side tokens if present
        // localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? error.message,
      code: error.response?.data?.code,
      details: error.response?.data?.details,
      cause: error instanceof Error ? error : undefined, // <!-- ДОДАНО: Preserve original error for debugging. Consensus: 8/9 repos use error cause chaining — analysis-synthesis/error-handling-consensus.md -->
    };
    return Promise.reject(apiError);
  }
);

export default client;

// File: api/hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/query';
import client from '../client';
import { User, UpdateUserRequest } from '../types/user.types';
import { ApiResponse } from '../types/common.types';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data } = await client.get<ApiResponse<User>>(`/users/${userId}`);
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, ...updates }: UpdateUserRequest & { userId: string }) => {
      const { data } = await client.put<ApiResponse<User>>(`/users/${userId}`, updates);
      return data.data;
    },
    // Optimistic update
    onMutate: async ({ userId, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ['user', userId] });
      const previousUser = queryClient.getQueryData<User>(['user', userId]);
      queryClient.setQueryData<User>(['user', userId], (old) => ({ ...old!, ...updates }));
      return { previousUser };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['user', variables.userId], context?.previousUser);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
    },
  });
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No centralized client, no interceptors, no retry, no caching, no deduplication

// IN COMPONENT — direct fetch calls scattered everywhere
function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // NO TIMEOUT — hangs forever
    // NO AUTH TOKEN — 401 every time
    // NO CACHING — refetches on every render
    // NO DEDUPLICATION — multiple components fetch same data
    fetch('https://api.production.com/users/me')
      .then(res => {
        if (!res.ok) throw new Error('Failed');
        return res.json();
      })
      .then(data => { setUser(data); setLoading(false); })
      .catch(err => console.log(err));  // SWALLOWED ERROR
  }, []);

  // ANOTHER COMPONENT DOES THE SAME FETCH — no deduplication
  useEffect(() => {
    fetch('https://api.production.com/users/me').then(/* ... */);
  }, []);

  return <div>{loading ? 'Loading...' : user?.name}</div>;
}
```

**Why this is bad:**
- No centralized client — each component reimplements fetch logic.
- No auth interceptor — 401 errors not handled automatically.
- No caching — same data fetched multiple times.
- No deduplication — duplicate requests hit server.
- No error classification — user sees no feedback on failure.

---

## 🚨 COMMON MISTAKES
1. **Server state in Redux/Zustand** – Use TanStack Query for server data; Redux for client-only UI state.
2. **Optimistic updates for unsafe operations** – Do NOT use optimistic updates for destructive, financial, or security operations. Wait for server confirmation.
3. **Swallowing errors silently** – Always classify and surface errors to UI via query error states.
4. **Stale closures in mutations** – Use `onMutate` context to capture previous state for rollback.
5. **Blind retry on mutations** – Do NOT retry POST/PUT/DELETE on 4xx errors. Only retry idempotent GET operations on network errors or 5xx.
6. **Storing tokens in localStorage** – Prefer HttpOnly cookies. localStorage tokens are vulnerable to XSS.
7. **Logging 4xx as errors** – Client errors (bad input, not found) are expected rejections, not bugs. Log at `info` level or skip; only 5xx deserves `error` level.
8. **Missing error cause** – Always preserve the original error in `cause` when creating a new error to maintain full debugging context.
9. **Global schemas** – Don't store all validation schemas in one global file. Collocate schemas with their routes for easier maintenance.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] HTTP client is centralized in one file (`api/client.ts`).
- [ ] Interceptors handle auth token injection and 401 refresh.
- [ ] Auth tokens stored securely (prefer HttpOnly cookies over localStorage).
- [ ] Retry logic with exponential backoff for network errors on idempotent GET operations only.
- [ ] Non-retryable errors (4xx on mutations) are NOT retried.
- [ ] Timeouts set (≤30s for most requests).
- [ ] Error responses are classified (network, auth, validation, server).
- [ ] All requests/responses are typed in TypeScript.
- [ ] Caching configured via TanStack Query (`staleTime`, `gcTime`).
- [ ] Request deduplication works via query keys.
- [ ] Optimistic updates used only for safe, predictable operations.
- [ ] API versioning is configurable via environment variables.
- [ ] Race conditions handled (AbortController or TanStack Query cancellation).
- [ ] ApiError includes `cause` property for error chaining.
- [ ] Validation schemas are collocated with routes (not in a single global location).
- [ ] 4xx errors are NOT logged at error level (expected rejections).
- [ ] Parallel API calls use Promise.all / useQueries, not sequential.
- [ ] PII/secrets are masked in logs (password, token, secret, refreshToken, etc.).

---

## 📚 CHEATSHEET
| Pattern | Implementation |
|---|---|
| Token injection | Request interceptor → `Authorization: Bearer {token}` (or HttpOnly cookies) |
| 401 refresh | Queue pending requests → refresh → replay |
| Caching | `useQuery({ staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 })` |
| Deduplication | Same `queryKey` = one network request |
| Optimistic update | `onMutate` → set cache → `onError` rollback (safe ops only) |
| Request cancellation | `AbortController` + `signal` in fetch/axios |
| Rate limiting | Exponential backoff on 429 with `Retry-After` header |
| Retry | GET + network error / 5xx only. Never POST/DELETE on 4xx. |
| Idempotency | `Idempotency-Key` header for payments/orders |
| Runtime validation | Zod schema → `parse()` → domain mapping |

---

## 🔗 RELATED SKILLS
- ⬆️ [`web-project-structure`] – API layer directory layout
- ⬆️ [`web-state-management`] – Server state via TanStack Query, client state via store
- ⬆️ [`web-components-patterns`] – Components consume API data via hooks
- ⬇️ [`web-performance`] – Caching and deduplication improve performance
- ⬇️ [`web-security`] – Auth token security, CORS in API layer

---

## 📝 NOTES
- For GraphQL: use `@apollo/client` or `urql` with typed queries and mutations.
- For Next.js App Router: use `fetch` in server components (no client state needed).
- For testing: use MSW (Mock Service Worker) to intercept and mock API requests.
- For runtime validation: use Zod, Valibot, or Arktype to validate API responses before use.
- For idempotency: generate UUID per mutation and send as `Idempotency-Key` header.
- For concurrency: TanStack Query handles request deduplication and stale response cancellation automatically.
- <!-- ДОДАНО: In full-stack TS projects types can be auto-inferred from server schemas (tRPC inferRouterInputs). Weak signal: 3/9 repos — analysis-synthesis/api-design-consensus.md -->
  У full-stack TypeScript проєктах типи можуть інферуватися автоматично з server-side схем (наприклад, `inferRouterInputs` в tRPC), що усуває необхідність у ручній кодогенерації та забезпечує end-to-end типобезпеку.
- <!-- ДОДАНО: tRPC's httpBatchLink combines parallel calls into one HTTP request, reducing round trips. Weak signal: 2/9 repos — analysis-synthesis/performance-consensus.md -->
  tRPC's `httpBatchLink` об'єднує паралельні виклики в один HTTP-запит, зменшуючи round trips для RPC-архітектур.

---
**Last Updated:** 2026-08-29
**Version:** 4.0 (Updated with analysis from 9 production repos: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC, 2026-08-29)
