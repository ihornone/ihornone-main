---
name: mobile-state-management
description: Production-grade state management patterns for React Native, Expo, and Flutter apps. Covers state taxonomy, Redux Toolkit, Zustand, Context, server state management, persistence strategies, and re-render optimization.
---

# 📌 Mobile State Management

## 🎯 GOAL
**One sentence:** Implement predictable, performant, and testable state management by choosing the right tool for each state type — local, client, or server — with typed access, proper persistence, and zero unnecessary re-renders.

> Example:
> Use Redux Toolkit for complex domain state, Zustand for simple apps, TanStack Query for server cache, and secure storage for sensitive credentials — each with typed selectors and proper persistence strategy.

---

## 💡 KEY PRINCIPLES
- **State Taxonomy First** – Classify state before choosing a tool: local UI state, client application state, or server/cache state.
- **Single Source of Truth** – Each piece of state lives in exactly one place; derive, don't duplicate.
- **Immutable Updates** – Never mutate state directly; use Immer (Redux Toolkit) or immutable patterns.
- **Typed Access** – All state access goes through typed selectors or typed hooks.
- **Secure Persistence** – Sensitive data goes to secure storage; preferences to AsyncStorage; server state to query cache.

---

## 🧠 STATE TAXONOMY DECISION TREE

```
                         STATE
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       LOCAL            CLIENT           SERVER
          │                │                │
    useState          Redux/Zustand    TanStack Query
    useReducer        Context          (or equivalent)
          │                │
          └────────────────┴───────────────┐
                                           ↓
                                      PERSISTENCE
                                           │
                              ┌────────────┴────────────┐
                              ↓                        ↓
                        Secure Storage            AsyncStorage
                        sensitive data            preferences
                        (Keychain/Keystore)       (theme, lang)
```

### State Type → Tool

| State Type | Examples | Recommended Tool |
|---|---|---|
| **Local UI** | Form input, toggle, modal open/close, animation | `useState`, `useReducer` |
| **Client App** | Auth state, theme, user preferences, onboarding | Redux Toolkit, Zustand |
| **Server/Cache** | User profile, products, orders, feed | TanStack Query, SWR |
| **Config/Dep** | Theme, locale, feature flags | Context API |

**Critical Rule:** Do not put server cache into global client state by default. Prefer a dedicated server-state/cache solution for remote data.

---

## 📁 STORE DIRECTORY STRUCTURE (Redux Toolkit)

```
store/
├── index.ts                # Store configuration & middleware
├── rootReducer.ts          # Combined reducers
├── slices/                 # Feature-based state slices
│   ├── authSlice.ts
│   ├── userSlice.ts
│   └── uiSlice.ts
├── selectors/              # Typed selectors
│   ├── authSelectors.ts
│   └── userSelectors.ts
├── thunks/                 # Async operations
│   ├── loginThunk.ts
│   └── fetchProfileThunk.ts
└── hooks/                  # Typed hooks
    └── useAppDispatch.ts
```

---

## 🔧 BEST PRACTICES

### 1. Use Redux Toolkit (RTK) for Complex Domain State
RTK reduces boilerplate with `createSlice`, `createAsyncThunk`, and `configureStore`.

### 2. Feature-Based Slices, Not Type-Based
One slice per domain feature (`auth`, `user`, `cart`), not per entity type.

### 3. Selectors: Simple vs Memoized
- **Simple selectors** for direct state access:
  ```typescript
  const selectAuth = (state: RootState) => state.auth;
  ```
- **Memoized selectors** (`createSelector`) for derived/computed data:
  ```typescript
  export const selectIsAuthenticated = createSelector(
    [selectAuth],
    (auth) => auth.token !== null
  );
  ```

### 4. Select Narrow, Stable References
Selecting broad or unstable objects can cause unnecessary re-renders. Prefer narrow selectors that return stable references.

```typescript
// BAD: Returns new object every render
const selectUserData = (state: RootState) => ({
  name: state.user.name,
  email: state.user.email,
});

// GOOD: Returns stable primitive
const selectUserName = (state: RootState) => state.user.name;
```

### 5. Persist Selectively with Secure Storage
- **Access token** → memory only (re-fetch with refresh token)
- **Refresh token / credentials** → secure storage (Keychain/Keystore)
- **Preferences** → AsyncStorage
- **Server state** → query cache (TanStack Query)

### 6. Optimize Re-renders by Need
- **React.memo** – When profiling shows unnecessary re-renders with stable props
- **useCallback** – When function identity matters (passed to memoized children)
- **useMemo** – When expensive computation or stable reference needed

Do NOT add these by default. Profile first.

---

## ✅ CODE EXAMPLE (Correct) — Redux Toolkit

```typescript
// File: store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../../api/endpoints/auth';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'idle',
  error: null,
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return response.data;
    } catch (error: unknown) {
      // Proper error normalization
      const message = error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;

// File: store/selectors/authSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';

// Simple selector (no memoization needed for direct access)
const selectAuth = (state: RootState) => state.auth;

// Memoized selector for derived data
export const selectIsAuthenticated = createSelector(
  [selectAuth],
  (auth) => auth.token !== null
);

// Narrow selector for stable primitive
export const selectUserName = createSelector(
  [selectAuth],
  (auth) => auth.user?.name ?? null
);

// File: store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// File: store/hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '../store';
import { loginUser, logout } from '../store/slices/authSlice';
import { selectIsAuthenticated, selectUserName, selectAuthStatus } from '../store/selectors/authSelectors';

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userName = useSelector(selectUserName);
  const status = useSelector(selectAuthStatus);

  const login = useCallback(
    (email: string, password: string) => {
      return dispatch(loginUser({ email, password }));
    },
    [dispatch]
  );

  const logoutUser = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return { isAuthenticated, userName, status, login, logout: logoutUser };
}
```

---

## ✅ CODE EXAMPLE (Correct) — Zustand

```typescript
// File: store/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist specific fields, not entire state
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);

// Usage in component:
// const { token, user, login, logout } = useAuthStore();
```

---

## ✅ CODE EXAMPLE (Correct) — Flutter (Riverpod)

```dart
// File: lib/features/auth/auth_provider.dart
import 'package:riverpod/riverpod.dart';

class User {
  final String id;
  final String name;
  final String email;

  const User({required this.id, required this.name, required this.email});
}

class AuthState {
  final User? user;
  final String? token;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.token, this.isLoading = false, this.error});

  AuthState copyWith({User? user, String? token, bool? isLoading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // API call via repository
      final response = await authRepository.login(email, password);
      state = state.copyWith(
        user: response.user,
        token: response.token,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        error: e.toString(),
        isLoading: false,
      );
    }
  }

  void logout() {
    state = const AuthState();
  }
}

// Provider declaration
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (ref) => AuthNotifier(),
);

// Selector (derived state)
final isAuthenticatedProvider = Provider<bool>(
  (ref) {
    final auth = ref.watch(authProvider);
    return auth.token != null;
  },
);

// Usage in widget:
// final auth = ref.watch(authProvider);
// final isAuthenticated = ref.watch(isAuthenticatedProvider);
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No selectors, direct state mutation, async in component, broad selection

function ProfileScreen() {
  // BAD: Async logic in component — untestable, duplicated
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('https://api.com/user/me')  // Direct API call
      .then(res => res.json())
      .then(data => {
        setUser(data);     // Local state — not shared
        setLoading(false);
      });
  }, []);

  // BAD: Direct state mutation — breaks Redux immutability
  const handleLogout = () => {
    store.getState().auth.user = null;
  };

  // BAD: Broad selector — returns new object every render
  const userData = useSelector((state: RootState) => ({
    name: state.user.name,
    email: state.user.email,
    preferences: state.user.preferences,
  }));

  return <Text>{user?.name}</Text>;
}
```

**Why this is bad:**
- Async logic in component — untestable, duplicated across screens.
- Direct state mutation — breaks React/Redux immutability contract.
- Broad selectors — new object reference causes unnecessary re-renders.
- Local state not shared — other screens can't access user data.
- Server state in local state — no caching, no deduplication.

---

## 🚨 COMMON MISTAKES
1. **Storing derived data in store** – Compute from base state using selectors; never duplicate.
2. **Persisting everything** – Only persist critical data. Lists and UI state re-fetch on mount.
3. **Premature memoization** – Adding `useCallback`/`useMemo` everywhere without profiling shows benefit.
4. **Broad selectors** – Selecting large objects or creating new objects in selectors causes re-renders.
5. **Server state in client store** – Using Redux for server cache instead of TanStack Query.
6. **Insecure token storage** – Storing access tokens in AsyncStorage instead of secure storage.
7. **Context for everything** – Using Context as global state management leads to Context hell.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] State is classified correctly (local, client, server).
- [ ] Server state uses TanStack Query or equivalent, not Redux.
- [ ] Sensitive tokens stored in secure storage, not AsyncStorage.
- [ ] Selectors are narrow and return stable references.
- [ ] State is never mutated directly — always returns new objects.
- [ ] Persistence configured for specific fields, not entire slices.
- [ ] No memory leaks from subscriptions (cleanup in useEffect return).
- [ ] Async operations are in thunks/actions/services, not in components.

---

## 📚 CHEATSHEET
| Pattern | When to Use | Example |
|---|---|---|
| `useState` | Local UI state | `const [open, setOpen] = useState(false)` |
| `useReducer` | Complex local state | Form with multiple fields |
| `Redux Toolkit` | Complex domain state | Auth, cart, multi-feature apps |
| `Zustand` | Simple global state | Small apps, less boilerplate |
| `Context` | Config/dependency injection | Theme, locale, feature flags |
| `TanStack Query` | Server/cache state | API data, pagination, caching |
| `createSelector` | Derived/computed data | `selectIsAuthenticated` |
| `React.memo` | Prevent measurable re-renders | List items with stable props |
| `useCallback` | Stable function reference | Handlers passed to memoized children |
| `useMemo` | Expensive computation | Filtered/sorted lists |

**Persistence strategy:**
```
Access token    → Memory only (re-fetch with refresh)
Refresh token   → Secure storage (Keychain/Keystore)
Preferences     → AsyncStorage
Server state    → Query cache (TanStack Query)
```

---

## 🔗 RELATED SKILLS
- ⬆️ [`mobile-project-structure`] – Store directory layout and organization
- ⬆️ [`mobile-components-ui`] – Components consume state via hooks/selectors
- ⬇️ [`mobile-api-integration`] – API calls via centralized client, not thunks

---

## 📝 NOTES
- **React Native:** Use Redux Toolkit for complex domain state, Zustand for simpler apps.
- **Flutter:** Use Riverpod or BLoC/Cubit for state management.
- **Server State:** Prefer TanStack Query (RN) or equivalent for server cache. Do not put server cache into global client state by default.
- **Persistence:** Use secure storage for sensitive data. AsyncStorage for non-sensitive preferences only.
- **Performance:** Profile before adding memoization. Do not add `useCallback`/`useMemo` by default.
- **Context:** Use for dependency injection (theme, locale), not as full global state management.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Cross-Platform Edition