---
name: web-state-management
description: Production-grade state management patterns for React, Next.js, Vue, and Svelte web applications using Redux Toolkit, Zustand, Jotai, and Context API. Covers feature-based store organization, typed selectors, async thunks, persistence, re-render optimization, SSR hydration, middleware, DevTools, and store testing.
---

# 📌 Web State Management

## 🎯 GOAL
**One sentence:** Implement predictable, performant, and testable global state management with typed selectors, async operations, SSR hydration, persistence, and zero unnecessary re-renders.

> Example:
> Use Zustand for simple apps with minimal boilerplate, or Redux Toolkit for complex apps with time-travel debugging and middleware chains.

---

## 💡 KEY PRINCIPIONS
- **Smallest Appropriate Scope** – Use the narrowest state scope that solves the problem. Local UI state → component; shared feature state → feature store; cross-feature client state → global store; server state → dedicated server-state/data-fetching layer; URL state → router/search params; form state → form library or local state.
- **Immutable Updates** – Never mutate state directly; use Immer (Redux Toolkit) or immutable patterns.
- **Narrow Selectors, Memoize When Justified** – Prefer narrow selectors. Memoize derived selectors with `createSelector` when computation is expensive or referential stability is required. Simple property access (`state => state.user`) does not need memoization.
- **Separate Client State from Server State** – Server state (fetched data, caching, retries) belongs in a dedicated data-fetching layer (TanStack Query, SWR, RTK Query, Server Components, Server Actions). Global store is for client-only state that cannot be server-managed.
<!-- ПІДТВЕРДЖЕНО: analysis-synthesis/api-design-consensus.md (server-side validation, 9/9), analysis-synthesis/performance-consensus.md (multi-level caching, 7/9) -->

---

## 🧠 WHEN TO USE GLOBAL STATE

Use this decision tree before adding state to a global store.

### Do NOT use global state when:
- State belongs to one component (local UI: toggles, form inputs, hover states).
- State belongs to one page (can be lifted to page-level local state).
- State is derived from URL (use router/search params instead).
- State is server-owned (use a server-state library or Server Components).
- State can be derived from existing state (compute it, don't store it).
- State is form-local (use a form library or local state).
- State exists only to coordinate two nearby components (use composition or local state).

### Consider global state when:
- Multiple distant features need the same client state.
- State must survive route transitions (e.g., shopping cart, auth session).
- Multiple independent components update the same state.
- State represents an application-wide client concern (theme, notifications, feature flags).

---

## 📁 STORE DIRECTORY STRUCTURE

```
store/
├── index.ts                # Store configuration & middleware
├── rootReducer.ts          # Combined reducers (Redux) or root store (Zustand)
├── slices/                 # Feature-based state slices
│   ├── authSlice.ts
│   ├── userSlice.ts
│   └── uiSlice.ts
<!-- ПІДТВЕРДЖЕНО: analysis-synthesis/architecture-consensus.md (feature-based organization, 9/9) -->
├── selectors/              # Memoized selectors
│   ├── authSelectors.ts
│   └── userSelectors.ts
├── thunks/                 # Async operations
│   ├── loginThunk.ts
│   └── fetchProfileThunk.ts
├── middleware/             # Custom middleware (logging, persistence, analytics)
│   ├── logger.ts
│   ├── persistence.ts
│   └── analytics.ts
└── atoms/                  # Jotai atoms (if using Jotai)
    ├── authAtoms.ts
    └── userAtoms.ts
```

---

## 🔧 BEST PRACTICES

1. **Use Zustand for Simple to Medium Apps**
   - Zustand has minimal boilerplate, built-in DevTools, and no provider needed.

2. **Use Redux Toolkit for Complex Apps**
   - RTK provides `createSlice`, `createAsyncThunk`, time-travel debugging, and middleware chains.

3. **Feature-Based Slices, Not Type-Based**
   - One slice per domain feature (`auth`, `user`, `cart`), not per entity type (`actions`, `reducers`).

4. **Memoized Selectors with `createSelector`**
   - Derive computed data with `createSelector` to prevent unnecessary re-renders.

5. **SSR Hydration**
   - Never share a mutable global store instance between server requests. Create request-scoped stores on the server.
   - Hydrate only serializable state required by the client. Avoid persisting server-only state into client stores.
   - For Next.js: use a provider with `useRef` to create the store once on the client. Serialize initial state from server and pass it to the provider.

6. **State Slices Are Transport-Agnostic**
   - State slices should not contain HTTP status codes or transport-layer details. Convert domain errors to transport errors in the API layer.
<!-- ЗМІНЕНО: analysis-synthesis/error-handling-consensus.md (domain isolation — business logic errors don't know about HTTP, 7/9). Умова для state management: slice не повинен містити HTTP-статуси в своєму стані. -->

7. **Error Cause Chaining in Thunks/Actions**
   - When handling errors in thunks/actions, preserve the original error as `cause` to maintain full stack traces across abstraction layers.
<!-- ДОДАНО: analysis-synthesis/error-handling-consensus.md (error cause chaining, 8/9) -->

---

## ✅ CODE EXAMPLE (Correct) — Zustand

```typescript
// File: store/slices/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { authApi } from '../../api/endpoints/auth';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  errorCause: Error | null; // ДОДАНО: preserve original error for debugging (error cause chaining)
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        token: null,
        status: 'idle',
        error: null,
        errorCause: null,

        login: async (email: string, password: string) => {
          set((state) => {
            state.status = 'loading';
            state.error = null;
            state.errorCause = null;
          });

          try {
            const response = await authApi.login({ email, password });
            set((state) => {
              state.status = 'succeeded';
              state.user = response.data.user;
              state.token = response.data.token;
            });
          } catch (err: any) {
            const cause = err instanceof Error ? err : new Error(String(err));
            set((state) => {
              state.status = 'failed';
              state.error = err.message ?? 'Login failed';
              state.errorCause = cause; // ДОДАНО: error cause chaining — зберігаємо оригінальну помилку
            });
          }
        },

        logout: () => {
          set((state) => {
            state.user = null;
            state.token = null;
            state.status = 'idle';
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
            state.errorCause = null;
          });
        },
      })),
      {
        name: 'auth-storage',
        // SECURITY: Never persist authentication secrets unless the application's
        // security model explicitly requires it. Prefer secure, server-managed
        // cookies (HttpOnly, Secure, SameSite) for sensitive auth credentials.
        // Only persist non-sensitive UI state (e.g., theme, preferences).
        partialize: (state) => ({
          // token: state.token,     // ← Do NOT persist tokens in localStorage
          // user: state.user,       // ← Do NOT persist PII unless required
          theme: state.theme,       // ← Safe: UI preference only
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// File: store/selectors/authSelectors.ts
import { useAuthStore } from '../slices/authStore';

// Simple selectors — Zustand subscriptions already do shallow comparison.
// Use createSelector (from reselect) only when you need memoization for
// expensive derived computations or referential stability across renders.

export const selectIsAuthenticated = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.token !== null;

export const selectCurrentUser = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.user;

export const selectAuthStatus = (state: ReturnType<typeof useAuthStore.getState>) =>
  state.status;

// Example of a memoized derived selector (when computation is expensive):
// import { createSelector } from 'reselect';
// export const selectUserPermissions = createSelector(
//   [selectCurrentUser],
//   (user) => user?.roles.flatMap(role => role.permissions) ?? []
// );

// File: hooks/useAuth.ts
import { useCallback } from 'react';
import { useAuthStore } from '../store/slices/authStore';
import { selectIsAuthenticated, selectCurrentUser, selectAuthStatus } from '../store/selectors/authSelectors';

export function useAuth() {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectCurrentUser);
  const status = useAuthStore(selectAuthStatus);

  const stableLogin = useCallback(
    (email: string, password: string) => login(email, password),
    [login]
  );

  return { isAuthenticated, user, status, login: stableLogin, logout };
}
```

---

## ✅ CODE EXAMPLE (Correct) — SSR Hydration (Next.js + Redux)

```typescript
// File: store/providers/StoreProvider.tsx
'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from '../index';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}

// File: app/layout.tsx
import { StoreProvider } from '../store/providers/StoreProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No selectors, direct state mutation, no memoization, async in component

// IN COMPONENT — async logic mixed with UI
function ProfileScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // DIRECT API CALL — no thunk, no store
    fetch('https://api.com/users/me')
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  // EVERY RE-RENDER CREATES NEW FUNCTION — no useCallback
  const handleLogout = () => {
    // DIRECT STATE MUTATION — breaks Redux/Zustand
    store.getState().auth.user = null;
  };

  return <div>{user?.name}</div>;
}
```

**Why this is bad:**
- Async logic in component — untestable, duplicated across screens.
- Direct state mutation — breaks React/Zustand immutability contract.
- No selectors — every component re-renders on any store change.
- Local state not shared — other components can't access user data.

---

## 🚨 COMMON MISTAKES
1. **Storing derived data in store** – Compute from base state using selectors; never duplicate.
2. **Persisting everything** – Only persist small, critical data (preferences). Never persist auth tokens in localStorage; use secure cookies. Lists re-fetch on mount.
3. **Adding `useCallback`/`useMemo` by default** – Do NOT wrap every function/value. Use them only when referential stability affects memoized children, subscriptions, expensive calculations, or dependency semantics. Profile first.
4. **SSR hydration mismatch** – Server and client state must match. Never share mutable global store instances between server requests.
5. **Putting server state in global store** – Use a server-state library (TanStack Query, SWR, RTK Query) or Server Components for fetched data. Global store is for client-only state.
6. **Including HTTP status in state** – State slices should not contain transport-layer details like HTTP status codes. Convert domain errors to transport errors in the API layer.
<!-- ЗМІНЕНО: analysis-synthesis/error-handling-consensus.md (domain isolation, 7/9) — додано пункт 6 -->

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Store is structured by features (slices/atoms), not by entity types.
- [ ] State scope is the narrowest appropriate (local → feature → global → server).
- [ ] Server state uses a dedicated data-fetching layer, not global store.
- [ ] All async operations are in thunks/actions/services, not in components.
- [ ] Selectors are narrow; memoized with `createSelector` only when computation or referential stability justifies it.
- [ ] State is never mutated directly — always returns new objects.
- [ ] DevTools is integrated (Redux DevTools or Zustand devtools middleware).
- [ ] Persistence is configured for non-sensitive data only (no auth tokens in localStorage).
- [ ] SSR hydration is handled correctly (request-scoped stores, no mismatch errors).
- [ ] No memory leaks from subscriptions (cleanup in `useEffect` return).
- [ ] Errors in thunks/actions preserve original error as `cause` for full stack traces.
<!-- ДОДАНО: analysis-synthesis/error-handling-consensus.md (error cause chaining, 8/9) -->

---

## 📚 CHEATSHEET
| Pattern | Redux Toolkit | Zustand | Jotai |
|---|---|---|---|
| Create slice | `createSlice({ name, reducers })` | `create((set, get) => ({ ... }))` | `atom(defaultValue)` |
| Async action | `createAsyncThunk` | `async (args) => { set({ loading: true }) }` | `atomWithQuery` |
| Selector | `createSelector([sel], fn)` | `useStore(selector)` | `useAtom(myAtom)` |
| Middleware | `configureStore(middleware)` | `devtools()`, `persist()`, `immer()` | `atomWithStorage` |
| Persistence | `redux-persist` + `localStorage` | `persist` middleware | `atomWithStorage` |
| DevTools | Built-in Redux DevTools | `devtools` middleware | `recoil-devtools` |
| Server state | RTK Query | TanStack Query / SWR | `atomWithQuery` |
| When NOT global | — | — | — |

**When NOT to use global state:**
- Local UI state (toggles, form inputs, hover)
- Single-page state
- URL-derived state (use router params)
- Server-owned state (use data-fetching layer)
- Derived state (compute, don't store)

---

## 🔗 RELATED SKILLS
- ⬆️ [`web-project-structure`] – Store directory layout and organization
- ⬆️ [`web-components-patterns`] – Components consume state via hooks/selectors
- ⬇️ [`web-api-client`] – Thunks dispatch API calls through centralized client

---

## 📝 NOTES
- For Vue: use `Pinia` (official state management) with typed stores.
- For Svelte: use Svelte stores (`writable`, `derived`) or `@trpc/client` for type-safe state.
- For Jotai: use `atomFamily` for dynamic atoms and `selectAtom` for derived state.
- State management patterns are aligned with production practices from Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC.
<!-- ДОДАНО: analysis-synthesis/*-consensus.md -->

---

**Last Updated:** 2026-08-29
**Version:** 4.0 (Updated with analysis from 9 production repos: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC, 2026-08-29)
