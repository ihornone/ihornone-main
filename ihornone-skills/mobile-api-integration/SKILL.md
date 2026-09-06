---
name: mobile-api-integration
description: Production-grade API integration patterns for React Native, Expo, and Flutter mobile apps. Covers centralized HTTP clients, typed interceptors, token refresh, retry with exponential backoff, timeout handling, error classification, caching, offline support, request cancellation, and network state detection.
---

# 📌 Mobile API Integration

## 🎯 GOAL
**One sentence:** Implement a centralized, resilient, and typed HTTP client layer with interceptors, retry logic, caching, offline support, and request cancellation for production mobile apps.

> Example:
> Use a single `ApiClient` instance with typed request/response interfaces, automatic token injection, 401 refresh flow, exponential backoff retries, and AbortController for stale request cancellation.

---

## 💡 KEY PRINCIPLES
- **Single HTTP Client** – One centralized client instance; never instantiate `axios` or `fetch` ad-hoc in components.
- **Typed Endpoints** – Every API call has typed request params, response body, and error shape.
- **Interceptor Chain** – Auth token injection, response transformation, and error normalization happen in interceptors.
- **Fail Gracefully** – Classify errors (network, auth, server, validation) and handle each differently.
- **Secure Token Storage** – Sensitive tokens go to secure storage (Keychain/Keystore), never AsyncStorage.

---

## 🧠 ARCHITECTURE DECISION TREE

```
                         API LAYER
                             │
              ┌──────────────┼──────────────┐
              ↓              ↓              ↓
           React          Flutter        Shared
          Native           (Dio)       Principles
              │              │              │
         Axios/fetch    Dio client    Interceptors
              │              │         Retry policy
              │              │         Error class.
              └──────────────┴──────────────┘
                             │
                             ↓
                    Dependency Direction
                             │
                    UI → Hooks → State → API → HTTP
```

### Dependency Direction
```
UI Components
      ↓
Hooks / Application Layer
      ↓
State / Query Layer (Redux, TanStack Query)
      ↓
Repositories / API Endpoints
      ↓
HTTP Client (Axios, Dio)
      ↓
Network
```

---

## 📁 API LAYER STRUCTURE

### React Native

```
src/
├── api/                          # Infrastructure layer
│   ├── client.ts                 # Centralized HTTP client
│   ├── interceptors/
│   │   ├── auth.ts               # Token injection & 401 refresh
│   │   ├── error.ts              # Error normalization
│   │   └── logging.ts            # Request/response logging (security-aware)
│   ├── endpoints/                # Typed endpoint definitions per feature
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── posts.ts
│   ├── types/                    # API types
│   │   ├── auth.types.ts
│   │   └── common.types.ts
│   └── cache/                    # Response caching
│       └── cacheManager.ts
│
├── hooks/                        # React hooks (UI integration layer)
│   ├── useApi.ts
│   └── useOffline.ts
│
└── services/                     # Application services
    └── authService.ts
```

### Flutter

```
lib/
├── core/
│   ├── network/                  # HTTP infrastructure
│   │   ├── dio_client.dart       # Dio instance with interceptors
│   │   ├── interceptors/
│   │   │   ├── auth_interceptor.dart
│   │   │   ├── retry_interceptor.dart
│   │   │   └── error_interceptor.dart
│   │   └── api_exception.dart
│   └── storage/                  # Secure storage abstraction
│       └── secure_storage.dart
│
├── features/
│   └── auth/
│       ├── data/
│       │   ├── datasources/
│       │   │   └── auth_remote_datasource.dart
│       │   ├── repositories/
│       │   │   └── auth_repository_impl.dart
│       │   └── models/
│       │       └── login_request.dart
│       └── domain/
│           ├── repositories/
│           │   └── auth_repository.dart
│           └── usecases/
│               └── login_usecase.dart
```

---

## 🔒 SECURITY RULES FOR API LAYER

### Token Storage
| Token Type | Storage | Reason |
|---|---|---|
| Access token | Memory (state) | Short-lived, re-fetch with refresh |
| Refresh token | Secure Storage (Keychain/Keystore) | Long-lived credential |
| Non-sensitive prefs | AsyncStorage/MMKV | Theme, language, onboarding |

**Critical Rule:** Never store sensitive tokens in AsyncStorage. Use:
- **Expo:** `expo-secure-store`
- **Bare RN:** `react-native-keychain`
- **Flutter:** `flutter_secure_storage`

### Logging Security
**NEVER log:**
- `Authorization` header
- Access tokens
- Refresh tokens
- Passwords
- Sensitive PII

```typescript
// SAFE logging interceptor
const sanitizeHeaders = (headers: Record<string, string>) => {
  const sanitized = { ...headers };
  if (sanitized.authorization) sanitized.authorization = '[REDACTED]';
  if (sanitized.Authorization) sanitized.Authorization = '[REDACTED]';
  return sanitized;
};
```

---

## 🔧 BEST PRACTICES

### 1. Use AbortController for Request Cancellation
Cancel stale requests when component unmounts or when a new request supersedes an old one.

### 2. Classify HTTP Errors Differently
| Status | Action |
|---|---|
| `401` | Refresh token (if not refresh endpoint) |
| `403` | Show forbidden, possibly logout |
| `429` | Read `Retry-After` header, respect server delay |
| `500` | Show server error, possibly retry with backoff |
| Network error | Show offline message, retry with backoff |

### 3. Set Aggressive Timeouts
Default 15-30s for most requests. WebSocket connections may need longer but should still have limits.

### 4. Cache According to Freshness Requirements
Cache data according to its freshness, sensitivity, and invalidation requirements. Do not persist sensitive or highly volatile data without an explicit strategy.

### 5. Retry with Bounded Policy
- Read `Retry-After` header for 429 responses.
- Apply exponential backoff with jitter for network errors.
- Never retry non-idempotent operations without idempotency protection.
- Bound maximum retries to prevent infinite loops.

---

## ✅ CODE EXAMPLE (Correct) — React Native

```typescript
// File: src/api/types/common.types.ts
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

// File: src/api/types/auth.types.ts
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
}

// File: src/api/client.ts
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import * as SecureStore from 'expo-secure-store'; // or react-native-keychain
import { ApiError } from './types/common.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.example.com/v1';
const TIMEOUT_MS = 20_000;

// Track refresh state to prevent parallel refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Centralized HTTP client
const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST INTERCEPTOR: Inject auth token from secure storage
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR: Handle errors & token refresh
client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip refresh for refresh endpoint itself to prevent infinite loops
    const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

    // 401 Unauthorized → attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        // Store new tokens in secure storage
        await SecureStore.setItemAsync('access_token', data.accessToken);
        await SecureStore.setItemAsync('refresh_token', data.refreshToken);

        processQueue(null, data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens on refresh failure
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        // Navigate to login screen via event emitter or navigation ref
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Classify error
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message: error.response?.data?.message ?? error.message,
      code: error.response?.data?.code,
      details: error.response?.data?.details,
    };

    return Promise.reject(apiError);
  }
);

export default client;

// File: src/api/endpoints/auth.ts
import client from '../client';
import { LoginRequest, LoginResponse } from '../types/auth.types';
import * as SecureStore from 'expo-secure-store';

export const authEndpoints = {
  login: async (data: LoginRequest) => {
    const response = await client.post<LoginResponse>('/auth/login', data);
    // Store tokens in secure storage
    await SecureStore.setItemAsync('access_token', response.data.accessToken);
    await SecureStore.setItemAsync('refresh_token', response.data.refreshToken);
    return response.data;
  },

  logout: async () => {
    await client.post('/auth/logout');
    // Clear tokens
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
  },
};

// File: src/hooks/useApi.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError } from '../api/types/common.types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

type ApiCall<T> = (signal: AbortSignal) => Promise<T>;

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const controllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (apiCall: ApiCall<T>) => {
    // Cancel previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall(controller.signal);
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request cancelled — ignore
        return null;
      }
      const error = err as ApiError;
      setState({ data: null, loading: false, error });
      throw err;
    } finally {
      controllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { ...state, execute };
}
```

---

## ✅ CODE EXAMPLE (Correct) — Flutter (Dio)

```dart
// File: lib/core/network/dio_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'interceptors/auth_interceptor.dart';
import 'interceptors/retry_interceptor.dart';
import 'interceptors/error_interceptor.dart';

class DioClient {
  final Dio _dio;
  final FlutterSecureStorage _secureStorage;

  DioClient({required String baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 15),
          headers: {'Content-Type': 'application/json'},
        )),
        _secureStorage = const FlutterSecureStorage() {
    // Add interceptors in order
    _dio.interceptors.add(AuthInterceptor(_secureStorage));
    _dio.interceptors.add(RetryInterceptor(_dio));
    _dio.interceptors.add(ErrorInterceptor());
  }

  Dio get client => _dio;

  Future<void> storeTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _secureStorage.write(key: 'access_token', value: accessToken);
    await _secureStorage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _secureStorage.delete(key: 'access_token');
    await _secureStorage.delete(key: 'refresh_token');
  }

  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: 'access_token');
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: 'refresh_token');
  }
}

// File: lib/core/network/interceptors/auth_interceptor.dart
class AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _secureStorage;

  AuthInterceptor(this._secureStorage);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _secureStorage.read(key: 'access_token');
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }
}

// File: lib/core/network/interceptors/retry_interceptor.dart
class RetryInterceptor extends Interceptor {
  final Dio _dio;
  static const _maxRetries = 3;

  RetryInterceptor(this._dio);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.type != DioExceptionType.connectionError &&
        err.type != DioExceptionType.connectionTimeout) {
      handler.next(err);
      return;
    }

    final requestOptions = err.requestOptions;
    final retryCount = requestOptions.extra['retryCount'] as int? ?? 0;

    if (retryCount < _maxRetries) {
      requestOptions.extra['retryCount'] = retryCount + 1;

      // Exponential backoff with jitter
      final delay = Duration(milliseconds: (1000 * (1 << retryCount)) + (DateTime.now().millisecond % 500));
      await Future.delayed(delay);

      try {
        final response = await _dio.request(
          requestOptions.path,
          data: requestOptions.data,
          options: Options(
            method: requestOptions.method,
            headers: requestOptions.headers,
          ),
        );
        handler.resolve(response);
        return;
      } catch (e) {
        handler.next(err);
        return;
      }
    }

    handler.next(err);
  }
}

// File: lib/core/network/interceptors/error_interceptor.dart
class ApiError {
  final int status;
  final String message;
  final String? code;
  final Map<String, List<String>>? details;

  ApiError({
    required this.status,
    required this.message,
    this.code,
    this.details,
  });
}

class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final apiError = ApiError(
      status: err.response?.statusCode ?? 0,
      message: err.response?.data['message'] ?? err.message ?? 'Unknown error',
      code: err.response?.data['code'],
      details: err.response?.data['details'] != null
          ? Map<String, List<String>>.from(err.response!.data['details'])
          : null,
    );
    handler.next(DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: apiError,
      message: apiError.message,
    ));
  }
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No centralized client, no interceptors, no retry, no timeout, no cancellation

// IN COMPONENT — direct fetch calls scattered everywhere
function ProfileScreen() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // NO TIMEOUT — hangs forever if server is down
    // NO AUTH TOKEN — 401 every time
    // NO CANCELLATION — memory leak on unmount
    // NO RETRY — single failure = broken UI
    fetch('https://api.production.com/users/me')
      .then(res => {
        if (!res.ok) throw new Error('Failed');  // GENERIC ERROR — no classification
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => console.log(err));  // SWALLOWED ERROR — user sees nothing
  }, []);

  return <Text>{user?.name}</Text>;
}
```

**Why this is bad:**
- No centralized client — each component reimplements fetch logic.
- No auth interceptor — 401 errors not handled automatically.
- No timeout — request hangs indefinitely.
- No cancellation — memory leak on component unmount.
- No error classification — user sees no feedback on failure.

---

## 🚨 COMMON MISTAKES
1. **Storing tokens in AsyncStorage** – Use secure storage (Keychain/Keystore) for sensitive tokens.
2. **No AbortController on cleanup** – Component unmount leaves dangling fetch in memory.
3. **Swallowing errors silently** – Always classify and surface errors to UI.
4. **Parallel token refresh** – Use a queue pattern to prevent multiple concurrent refresh calls.
5. **Infinite refresh loops** – Exclude refresh endpoint from refresh logic.
6. **Logging sensitive headers** – Never log Authorization headers or tokens.
7. **Caching without invalidation strategy** – Cache according to freshness requirements.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] HTTP client is centralized in one file.
- [ ] Interceptors handle auth token injection and 401 refresh.
- [ ] Refresh endpoint is excluded from refresh logic to prevent infinite loops.
- [ ] Retry logic with bounded policy for network errors.
- [ ] Timeouts set (≤30s for most requests).
- [ ] Error responses are classified (network, auth, validation, server).
- [ ] Loading states are managed per-request.
- [ ] Request cancellation is implemented with AbortController.
- [ ] Sensitive tokens stored in secure storage, not AsyncStorage.
- [ ] Logging interceptor does not log Authorization headers or tokens.

---

## 📚 CHEATSHEET
| Pattern | React Native | Flutter |
|---|---|---|
| HTTP Client | `axios.create()` | `Dio()` |
| Token storage | `expo-secure-store` / `react-native-keychain` | `flutter_secure_storage` |
| Request interceptor | `client.interceptors.request.use()` | `Interceptor.onRequest()` |
| Response interceptor | `client.interceptors.response.use()` | `Interceptor.onError()` |
| 401 refresh | Queue pending requests → refresh → replay | Same pattern |
| Retry | Exponential backoff + jitter | `RetryInterceptor` |
| Timeout | `axios.create({ timeout: 20000 })` | `BaseOptions(connectTimeout:)` |
| Cancellation | `AbortController` + `signal` | `CancelToken` |
| Caching | `MMKV` or in-memory `Map` with TTL | `dio_cache_interceptor` |
| Offline | `@react-native-community/netinfo` | `connectivity_plus` |

**Error classification:**
| Status | Action |
|---|---|
| `401` | Refresh token (if not refresh endpoint) |
| `403` | Show forbidden, possibly logout |
| `429` | Read `Retry-After`, respect server delay |
| `500` | Show server error, bounded retry |
| Network | Show offline, retry with backoff |

**Token storage:**
```
Access token    → Memory (state)
Refresh token   → Secure Storage (Keychain/Keystore)
Preferences     → AsyncStorage/MMKV
```

---

## 🔗 RELATED SKILLS
- ⬆️ [`mobile-project-structure`] – API layer directory layout
- ⬆️ [`mobile-state-management`] – State management consumes API data
- ⬆️ [`mobile-components-ui`] – Components consume API data via hooks

---

## 📝 NOTES
- **React Native:** Use `expo-secure-store` (Expo) or `react-native-keychain` (bare) for token storage.
- **Flutter:** Use `flutter_secure_storage` for token storage.
- **Cancellation:** Always pass `AbortSignal`/`CancelToken` to API calls and cleanup on unmount.
- **Retry:** Apply bounded retry policy with exponential backoff and jitter. Never retry non-idempotent operations without protection.
- **429 Handling:** Read `Retry-After` header and respect server-provided delay.
- **Logging:** Never log Authorization headers, tokens, or sensitive PII.
- **Offline:** Use `@react-native-community/netinfo` (RN) or `connectivity_plus` (Flutter) for network detection.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Cross-Platform Edition