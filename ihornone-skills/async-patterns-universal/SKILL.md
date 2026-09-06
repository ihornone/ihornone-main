---
name: async-patterns-universal
description: Universal asynchronous programming patterns for TypeScript, Python, Go, and Rust. Covers async/await, Promises, concurrent vs sequential execution, error handling, race conditions, deadlocks, timeouts, resource cleanup, memory leaks, testing async code, and profiling.
---

# 📌 Async Patterns Universal

## 🎯 GOAL
**One sentence:** Write correct, non-blocking, concurrent asynchronous code across any language — avoiding race conditions, deadlocks, memory leaks, and resource leaks.

> Example:
> Use `Promise.all()` / `asyncio.gather()` for concurrent I/O, `AbortController` for cancellation, `try/finally` for cleanup, and context-appropriate timeouts on all external calls.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Language/runtime conventions** — `async/await` in JS/Python, `context.Context` in Go, `tokio` in Rust.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Concurrency policies, timeout standards.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> Example: If a Go project uses `errgroup.Group` everywhere, do NOT switch to raw goroutines just because this skill shows both patterns.

---

## 💡 KEY PRINCIPLES
- **Never Block the Event Loop** – Synchronous I/O or CPU-heavy work freezes all concurrent operations.
- **Never Leave Async Work Unhandled** – Every asynchronous operation must either be awaited, returned, or explicitly launched as managed fire-and-forget with error handling and lifecycle ownership.
- **Context-Appropriate Timeouts** – Every external operation has an explicit timeout suited to its purpose (health check: 2s, HTTP API: 5–30s, file upload: longer, streaming: different model).
- **Cleanup in `finally`** – Connections, timers, and subscriptions must be released regardless of success/failure.

---

## 📁 ASYNC PATTERNS BY LANGUAGE

### TypeScript/JavaScript

| Pattern | Correct | Wrong |
|---|---|---|
| Sequential | `await a(); await b();` | `a(); b();` (unawaited) |
| Concurrent | `await Promise.all([a(), b()])` | Sequential when independent |
| Timeout | `AbortSignal.timeout(5000)` | No timeout |
| Cleanup | `try/finally { await client.close() }` | Missing cleanup |
| Error | `try { await fetch() } catch (e) { ... }` | Unhandled rejection |

### Python

| Pattern | Correct | Wrong |
|---|---|---|
| Sequential | `await a(); await b()` | `a(); b()` (coroutine not awaited) |
| Concurrent | `await asyncio.gather(a(), b())` | Sequential when parallel possible |
| Timeout | `async with asyncio.timeout(10):` | No timeout |
| Cleanup | `async with client:` or `try/finally` | Missing `await client.close()` |
| Error | `try: ... except Error: ...` | Bare `except:` |

### Go

| Pattern | Correct | Wrong |
|---|---|---|
| Concurrent | `go func() { ... }()` | Missing goroutine |
| Channels | `ch <- value` / `result := <-ch` | Shared mutable state |
| Timeout | `ctx, cancel := context.WithTimeout(ctx, 5*time.Second); defer cancel()` | `select { case <-time.After(5s) }` without cancellation |
| Cleanup | `defer conn.Close()` | Missing defer |
| Error | `if err != nil { return err }` | Ignoring error |

### Rust

| Pattern | Correct | Wrong |
|---|---|---|
| Async | `async fn foo().await` | Blocking in async context |
| Concurrent | `tokio::join!(a(), b())` | Sequential when parallel |
| Timeout | `tokio::time::timeout(Duration::from_secs(5), ...)` | No timeout |
| Cleanup | RAII (ownership handles cleanup) | Manual `drop()` needed rarely |
| Error | `Result<T, E>` with `?` operator | `unwrap()` everywhere |
| Spawned tasks | `tokio::spawn` returns `JoinHandle<T>` | Fire-and-forget without handle |
| Blocking work | `tokio::task::spawn_blocking(...)` | Blocking in async context |
| Thread safety | `T: Send + Sync` for shared state | Sharing non-thread-safe types |

---

## 🔧 UNIVERSAL BEST PRACTICES

1. **Concurrent, Not Parallel** – Use `Promise.all`/`asyncio.gather` for I/O-bound concurrency. Use worker threads/processes for CPU-bound parallelism.

2. **Cancellation** – Always support cancellation via `AbortController` (JS), `asyncio.Task.cancel()` (Python), or `context.Context` (Go). Propagate cancellation to child operations.

3. **Resource Cleanup** – Use `try/finally`, `defer`, or RAII to ensure connections, file handles, and timers are released. Never hold a lock across an unnecessary await.

4. **Never Assume Ordering** – Concurrent operations may complete in any order. Don't rely on timing.

5. **Shared State Consistency** – Concurrent access to mutable shared state requires an explicit consistency strategy: synchronization (mutex/lock), serialization, atomic operations, transactions, optimistic concurrency control, idempotency, queue, actor model, or database constraints.

6. **Deadlock Prevention** – Avoid deadlocks by: consistent lock ordering, avoiding holding locks across await points, keeping critical sections small, and never blocking while holding async locks.

---

## ✅ CODE EXAMPLE — TypeScript

```typescript
// File: services/dataFetcher.ts

// CORRECT: Concurrent with timeout and error handling
async function fetchUserData(userId: string): Promise<UserProfile> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const [profile, settings, permissions] = await Promise.all([
      fetchJson<UserProfile>(`/users/${userId}`, { signal: controller.signal }),
      fetchJson<UserSettings>(`/users/${userId}/settings`, { signal: controller.signal }),
      fetchJson<UserPermissions>(`/users/${userId}/permissions`, { signal: controller.signal }),
    ]);

    return { ...profile, settings, permissions };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new TimeoutError('User data fetch timed out after 10s');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// CORRECT: Sequential when order matters
async function processSteps(data: RawData): Promise<ProcessedData> {
  const validated = await validateData(data);       // Must validate first
  const enriched = await enrichData(validated);     // Then enrich
  return await saveData(enriched);                  // Then save
}

// CORRECT: Fire-and-forget with error logging (rare, intentional)
function trackEvent(event: AnalyticsEvent): void {
  analytics.send(event).catch(err => {
    logger.error('analytics_send_failed', { error: err.message });
  });
}
```

---

## ✅ CODE EXAMPLE — Python

```python
# File: services/data_fetcher.py
import asyncio
import httpx

async def fetch_user_data(user_id: str) -> dict:
    """CORRECT: Concurrent with timeout and error handling."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        # Concurrent requests
        # NOTE: return_exceptions=True only when partial failure is intentionally supported
        # and each result has an explicit fallback policy.
        profile, settings, permissions = await asyncio.gather(
            client.get(f"/users/{user_id}"),
            client.get(f"/users/{user_id}/settings"),
            client.get(f"/users/{user_id}/permissions"),
            return_exceptions=True,
        )

        # Handle partial failures
        if isinstance(profile, Exception):
            raise ExternalServiceError("Failed to fetch profile")

        return {
            "profile": profile.json(),
            "settings": settings.json() if not isinstance(settings, Exception) else {},
            "permissions": permissions.json() if not isinstance(permissions, Exception) else [],
        }

async def process_batch(items: list[str]) -> list[Result]:
    """CORRECT: Rate-limited concurrent processing."""
    semaphore = asyncio.Semaphore(10)

    async def process_one(item: str) -> Result:
        async with semaphore:
            async with asyncio.timeout(30):
                return await heavy_operation(item)

    return list(await asyncio.gather(*[process_one(item) for item in items]))
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: Unawaited promises, no timeout, no cleanup, race condition

async function badHandler(userId: string) {
  // UNAWAITED — error silently lost
  fetch(`/api/track/${userId}`);

  // NO TIMEOUT — hangs forever if server is down
  const data = await fetch(`/api/users/${userId}`);

  // RACE CONDITION — two writes to same resource
  const update1 = updateProfile(userId, { name: 'Alice' });
  const update2 = updateProfile(userId, { name: 'Bob' });
  await Promise.all([update1, update2]); // Non-deterministic final state

  // NO CLEANUP — database connection leaked
  const conn = await createConnection();
  const result = await conn.query('SELECT * FROM users');
  return result;
}
```

---

## 🚨 COMMON MISTAKES
1. **Unawaited promises** – Every `async` call must be `await`ed, returned, or explicitly launched as managed fire-and-forget with error handling.
2. **No timeout** – External calls hang forever; always set a context-appropriate timeout.
3. **Missing cleanup** – Connections, timers, subscriptions must be released in `finally`.
4. **Race conditions** – Concurrent writes to shared state need an explicit consistency strategy (locking, serialization, atomic ops, transactions, etc.).
5. **Deadlocks** – Holding locks across await points, inconsistent lock ordering, or blocking while holding async locks.
6. **Blocking the event loop** – Synchronous I/O or CPU-heavy work in async context freezes all concurrent operations.
7. **Silent partial failures** – `return_exceptions=True` without explicit fallback policy silently converts failures to empty data.
8. **Fire-and-forget without error handling** – Unhandled rejections crash the process or leak errors.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Priority respected: language > existing project > project rules > this skill
- [ ] All I/O operations use `await` or are explicitly managed fire-and-forget
- [ ] No blocking operations in async functions
- [ ] Timeouts set on all external requests (context-appropriate duration)
- [ ] Concurrent code uses `Promise.all`/`gather`/`join` when independent
- [ ] Shared state has explicit consistency strategy (lock, serialization, atomic, etc.)
- [ ] No deadlocks (consistent lock ordering, no locks across await, small critical sections)
- [ ] Resources cleaned up in `finally`/`defer`/RAII
- [ ] No memory leaks (subscriptions/timers cleaned up)
- [ ] Error handling covers all async failure modes
- [ ] Cancellation propagated to child operations

---

## 📚 CHEATSHEET
| Operation | TypeScript | Python | Go | Rust |
|---|---|---|---|---|
| Concurrent | `Promise.all([a(), b()])` | `asyncio.gather(a(), b())` | `go a(); go b()` | `tokio::join!(a(), b())` |
| Sequential | `await a(); await b()` | `await a(); await b()` | `a(); b()` | `a().await; b().await` |
| Timeout | `AbortSignal.timeout(5000)` | `asyncio.timeout(5)` | `context.WithTimeout(ctx, 5s)` | `tokio::time::timeout(5s, ...)` |
| Cleanup | `try/finally` | `async with` / `try/finally` | `defer` | RAII |
| Cancellation | `AbortController` | `Task.cancel()` | `context.WithCancel` | `tokio::select!` |
| Spawned task | `Promise` / `setTimeout` | `asyncio.create_task()` | `go func() {}()` | `tokio::spawn` → `JoinHandle` |
| Blocking work | `worker_threads` | `run_in_executor` | `goroutine` (blocks thread) | `tokio::task::spawn_blocking` |

### Timeout Guidelines (Context-Appropriate)

| Operation | Typical Timeout |
|---|---|
| Health check | 1–2s |
| HTTP API (internal) | 5–10s |
| HTTP API (external) | 10–30s |
| Database query | 5–15s |
| File upload | 30–120s |
| Streaming | No fixed timeout (use idle timeout) |
| Long polling | Match server timeout + buffer |

---

## 🔗 RELATED SKILLS
- ⬆️ [`error-handling-standards`] – Async error handling and retry patterns
- ⬆️ [`logging-standards`] – Async context propagation for requestId
- ⬇️ [`testing-patterns`] – Testing async code with mocks and delays
- ⬇️ [`performance-optimization`] – Profiling async bottlenecks

---

## 📝 NOTES
- For Node.js: never use `process.exit()` in async code; let the event loop drain. Use `worker_threads` for CPU-bound work.
- For Python: use `asyncio.run()` as entry point, not `loop.run_until_complete()`. Use `run_in_executor` for blocking I/O.
- For Go: use `errgroup` for concurrent operations with shared error handling. Always `defer cancel()` after `context.WithTimeout`.
- For Rust: use `tokio::spawn` for concurrent tasks (returns `JoinHandle<T>`), `tokio::select!` for cancellation. Use `spawn_blocking` for CPU-bound work. Ensure shared types implement `Send + Sync`.
- Deadlock prevention: consistent lock ordering, avoid holding locks across await, keep critical sections small, never block while holding async locks.

---
**Last Updated:** 2026-08-27
**Version:** 2.1 (Senior Standard — Fixed)
