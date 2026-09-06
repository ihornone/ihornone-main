---
name: error-handling-standards
description: Universal error handling standards for any project (TypeScript, Python, Go, Rust). Covers custom exception hierarchies, error classification, retry logic, circuit breaker, timeouts, error tracking, and graceful degradation. Transport-specific mapping (HTTP status, gRPC codes) belongs in platform-specific skills.
---

# 📌 Error Handling Standards

## 🎯 GOAL
**One sentence:** Implement a consistent, typed, and observable error handling strategy across all layers of any application — from business logic to data access to external service calls.

> Example:
> Every error has a type, code, user message, and optional cause. Errors are classified as operational or programmer errors. Critical errors trigger alerts. Transient errors retry automatically when safe.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Language/runtime conventions** — `Result<T, E>` in Rust, `errors.Is/As` in Go, exceptions in Python/TS.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Error handling policies, observability standards.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> Example: If a Rust project uses `anyhow::Error`, do NOT introduce a custom `AppError` hierarchy just because this skill suggests it.

---

## 💡 KEY PRINCIPLES
- **Typed Errors** – Every error has a class/type, code, and user-friendly message. Transport mapping (HTTP status, gRPC code, GraphQL error code) is applied at the boundary.
- **Error Properties** – `type`, `code`, `message`, `cause`, `metadata`, `isOperational`. Transport mapping is boundary-specific.
- **Fail Loudly, Recover Gracefully** – Log full context for developers; show safe messages to users.
- **Never Swallow Errors** – `catch` blocks must log, rethrow, or handle — never silently `pass`.
- **Classify Before Handling** – Network errors retry (if safe); validation errors show messages; critical errors alert.

---

## 📁 ERROR HIERARCHY

> Error types are transport-agnostic. HTTP status codes, gRPC codes, and GraphQL error codes are mapped at the transport boundary.

```
AppError (base)
├── ValidationError          # Bad user input
├── AuthenticationError      # Unauthorized
├── AuthorizationError       # No permission
├── NotFoundError            # Resource missing
├── ConflictError            # Duplicate resource
├── RateLimitError           # Too many requests
├── TimeoutError             # Operation timed out
├── ExternalServiceError     # Third-party failure
├── PersistenceError         # Database / storage failure
└── InternalError            # Unexpected failure
```

### Transport Mapping (When Applicable)

> Map errors to transport-specific codes at the boundary, not in the error class.

| Error Type | HTTP Status | gRPC Code |
|---|---|---|
| `ValidationError` | 400 | INVALID_ARGUMENT |
| `AuthenticationError` | 401 | UNAUTHENTICATED |
| `AuthorizationError` | 403 | PERMISSION_DENIED |
| `NotFoundError` | 404 | NOT_FOUND |
| `ConflictError` | 409 | ALREADY_EXISTS |
| `RateLimitError` | 429 | RESOURCE_EXHAUSTED |
| `TimeoutError` | 408 or 504 | DEADLINE_EXCEEDED |
| `ExternalServiceError` | 502 | UNAVAILABLE |
| `PersistenceError` | 500 | INTERNAL |
| `InternalError` | 500 | INTERNAL |

---

## 🔧 BEST PRACTICES

1. **Base Exception Class** – All custom errors extend one base class with `code`, `userMessage`, `isOperational`, and optional `cause`.

2. **Preserve Error Cause** – Always pass the original error via `cause` to avoid losing stack traces:
   ```typescript
   throw new DatabaseError('Failed to load user', { cause: originalError });
   ```

3. **Global Error Handler** – One handler catches all unhandled errors, logs them, and returns a formatted response.

4. **Retry Safely** – Only retry when ALL of these are true:
   - Error is transient (network timeout, 429, 503)
   - Operation is idempotent or retry-safe (GET, idempotent POST with idempotency key)
   - Retry budget has not been exhausted
   - No mutation side effects that could duplicate (payments, transfers, deletes)

5. **429 Rate Limit Handling** – Respect `Retry-After` header from server. Use bounded exponential backoff with jitter. Do not exceed retry budget.

6. **Circuit Breaker** – After N consecutive failures to an external service, stop calling it for a cooldown period.

---

## ✅ CODE EXAMPLE — TypeScript

```typescript
// File: errors/AppError.ts
export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly isOperational: boolean;
  public readonly cause?: unknown;
  public readonly metadata?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    userMessage: string,
    isOperational = true,
    options?: { cause?: unknown; metadata?: Record<string, unknown> }
  ) {
    super(message);
    this.code = code;
    this.userMessage = userMessage;
    this.isOperational = isOperational;
    this.cause = options?.cause;
    this.metadata = options?.metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', `Invalid input: ${message}`, true, { field });
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string | number) {
    super(`${entity} not found: ${id}`, 'NOT_FOUND', `${entity} not found.`);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, 'DATABASE_ERROR', 'System error.', false, options);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, status?: number) {
    super(`External service failed: ${service}`, 'EXTERNAL_SERVICE_ERROR', 'Service temporarily unavailable.', true, { service, status });
  }
}

// File: utils/retry.ts
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff: number;
  isRetryable?: (err: unknown) => boolean;
}

export function isTransientError(err: unknown): boolean {
  if (err instanceof AppError) {
    return err.code === 'EXTERNAL_SERVICE_ERROR' || err.code === 'RATE_LIMIT_ERROR' || err.code === 'TIMEOUT_ERROR';
  }
  return false;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = { maxAttempts: 3, delayMs: 1000, backoff: 2 }
): Promise<T> {
  let lastError: Error;
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (options.isRetryable && !options.isRetryable(err)) {
        throw err;
      }
      if (!isTransientError(err)) {
        throw err;
      }
      if (attempt < options.maxAttempts) {
        const delay = options.delayMs * Math.pow(options.backoff, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}
```

---

## ✅ CODE EXAMPLE — Python

```python
# File: errors/app_error.py
from __future__ import annotations
from typing import Any, Optional

class AppError(Exception):
    """Base exception for all application errors."""
    code: str = "INTERNAL_ERROR"
    user_message: str = "An unexpected error occurred."
    is_operational: bool = True

    def __init__(
        self,
        message: str | None = None,
        cause: Exception | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message or self.user_message)
        self.message = message or self.user_message
        self.cause = cause
        self.metadata = metadata or {}

class ValidationError(AppError):
    code = "VALIDATION_ERROR"
    user_message = "Invalid input."

    def __init__(self, message: str, field: str | None = None, cause: Exception | None = None) -> None:
        super().__init__(message, cause, {"field": field} if field else None)

class NotFoundError(AppError):
    code = "NOT_FOUND"
    user_message = "Resource not found."

    def __init__(self, entity: str, identifier: str | int) -> None:
        super().__init__(f"{entity} not found: {identifier}")

class DatabaseError(AppError):
    code = "DATABASE_ERROR"
    user_message = "System error."
    is_operational = False

    def __init__(self, message: str, cause: Exception | None = None) -> None:
        super().__init__(message, cause)

class ExternalServiceError(AppError):
    code = "EXTERNAL_SERVICE_ERROR"
    user_message = "Service temporarily unavailable."

    def __init__(self, service: str, status: int | None = None) -> None:
        super().__init__(f"External service failed: {service}", metadata={"service": service, "status": status})
```

---

## ❌ ANTI-PATTERN (Wrong)

```python
# Problem: Bare except, swallowed errors, no typing, no logging, leaked internals

try:
    result = dangerous_operation()
except:
    pass  # Silently swallowed — bug hidden forever

try:
    result = api_call()
except Exception as e:
    # LEAKED STACK TRACE TO USER
    return {"error": str(e)}
```

**Why this is bad:**
- `except:` catches `SystemExit`, `KeyboardInterrupt` — prevents shutdown.
- `pass` makes debugging impossible.
- Leaking `str(e)` exposes internal paths and database details.

---

## 🚨 COMMON MISTAKES
1. **Catching `Exception` broadly** – Catch specific types; let unexpected errors propagate.
2. **No context in logs** – Include `requestId` (where available), `userId` (when authenticated), `operation`/`service` (for background jobs).
3. **Swallowing errors** – Every `except`/`catch` must log, rethrow, or handle explicitly.
4. **Missing timeouts** – External calls without timeouts hang forever.
5. **Losing error cause** – Always preserve the original error via `cause` to avoid losing stack traces.
6. **Retrying non-transient errors** – Validation, authentication, and authorization errors should never retry.
7. **Retrying non-idempotent mutations** – Payments, transfers, and deletes require idempotency keys before retry.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Priority respected: language > existing project > project rules > this skill
- [ ] All errors have a type/class and code
- [ ] Error cause is preserved (original error not lost)
- [ ] Global error handler catches unhandled exceptions
- [ ] Error logging includes context (requestId when available, userId when authenticated, operation/service)
- [ ] User-facing messages are safe and readable
- [ ] Retry logic checks for transient errors AND idempotency safety
- [ ] 429 handling respects Retry-After header
- [ ] Timeouts set on all external calls
- [ ] Circuit breaker for external services
- [ ] Error tracking integrated (Sentry, etc.)
- [ ] No uncaught exceptions in production

---

## 📚 CHEATSHEET

| Error Type | Retry? | User Sees | Alert? | Notes |
|---|---|---|---|---|
| `ValidationError` | No | "Invalid input" | No | Never retry client errors |
| `AuthenticationError` | No | "Please log in" | No | Never retry auth failures |
| `AuthorizationError` | No | "Access denied" | No | Never retry permission errors |
| `NotFoundError` | No | "Not found" | No | Never retry missing resources |
| `ConflictError` | No | "Resource conflict" | No | Check idempotency before retry |
| `RateLimitError` | Yes | "Too many requests" | No | Respect `Retry-After` header |
| `TimeoutError` | Yes | "Request timed out" | No | Only if operation is idempotent |
| `ExternalServiceError` | Yes (3x) | "Service unavailable" | Yes | Circuit breaker after failures |
| `PersistenceError` | Conditional | "System error" | Yes | Only if transient + safe |
| `InternalError` | No | "Unexpected error" | Yes | Never retry programmer errors |

### Retry Decision Matrix

```
Is error transient? (timeout, 429, 503)
    └── No → Do NOT retry
    └── Yes → Is operation idempotent or retry-safe?
                └── No → Do NOT retry (payments, transfers, deletes)
                └── Yes → Has retry budget been exhausted?
                            └── Yes → Do NOT retry
                            └── No → Retry with backoff + jitter
```

---

## 🔗 RELATED SKILLS
- ⬆️ [`logging-standards`] – Structured error logging format
- ⬆️ [`naming-conventions`] – Error class naming conventions
- ⬇️ [`async-patterns-universal`] – Async error handling patterns
- ⬇️ [`security-checklist`] – Never expose sensitive data in errors

---

## 📝 NOTES
- For Go: use `errors.Is()` and `errors.As()` for error wrapping, not string matching. Use `fmt.Errorf("%w", err)` to preserve cause.
- For Rust: use `Result<T, E>` with custom error types and `thiserror`/`anyhow`. Use `.context()` and `.wrap_err()` to preserve cause.
- For Python: use `raise NewError(...) from original_error` to preserve cause chain.
- For circuit breaker: use `opossum` (Node.js) or `pybreaker` (Python).
- **Transport mapping:** HTTP status codes, gRPC codes, and GraphQL error codes are mapped at the transport boundary. Do not embed transport-specific codes in error classes.

---

**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Universal Edition
