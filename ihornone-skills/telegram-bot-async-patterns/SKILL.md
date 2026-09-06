---
name: telegram-bot-async-patterns
description: Production-grade asynchronous programming patterns for Telegram bots in Node.js/TypeScript using native async/await. Covers non-blocking I/O, structured concurrency, rate-limited batching via semaphores, timeout handling, CPU-bound offloading, and async testing.
---

# 📌 Telegram Bot Async Patterns

## 🎯 GOAL
**One sentence:** Write non-blocking, concurrently safe asynchronous code using Node.js native async/await to maintain high bot responsiveness under heavy load without exhausting system resources.

> Example:
> Execute concurrent background tasks, handle thousands of broadcast messages safely using rate-limited batching, and prevent event loop freezes caused by synchronous blocking operations.

---

## 💡 KEY PRINCIPLES
- **Never Block the Event Loop** – Any synchronous I/O or CPU-heavy work freezes all incoming user updates.
- **Enforce Timeouts** – Always wrap external HTTP/API/DB calls in timeout contexts to prevent hanging promises forever.
- **Respect Rate Limits** – Telegram Bot API has rate limits. Handle `429 Too Many Requests` using the server-provided retry interval. Use bounded concurrency and application-level throttling where necessary.
- **Structured Concurrency** – Use `Promise.all` with proper error handling for concurrent operations.
- **Never Swallow Cancellation** – `AbortSignal` is a control signal. Always propagate unless performing cleanup.

---

## 🔄 RETRY STRATEGY

Different errors require different retry strategies:

| Error type | Retry? | Strategy |
|---|---|---|
| Network timeout | Yes | Exponential backoff + jitter |
| Connection reset | Yes | Exponential backoff |
| HTTP 5xx | Yes | Bounded retry |
| Temporary DB failure | Yes | Exponential backoff |
| `429 Too Many Requests` | Yes | Obey `retry_after` |
| Validation error | **NO** | Return error to user |
| Permission denied | **NO** | Return error to user |
| Not found | **NO** | Return error to user |
| Business rule violation | **NO** | Return error to user |
| `AbortError` | **NEVER** | Propagate cancellation immediately |

**Critical rule:** Never retry non-idempotent operations (create payment, charge card, create order) without idempotency protection.

```typescript
import { setTimeout } from "timers/promises";

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // NEVER retry cancellation — propagate immediately
      if (error.name === "AbortError") {
        throw error;
      }

      // Handle Telegram rate limit
      if (error.code === 429 && error.parameters?.retry_after) {
        const delay = error.parameters.retry_after * 1000;
        if (attempt < maxRetries - 1) {
          await setTimeout(delay);
          continue;
        }
      }

      // Handle network errors with exponential backoff
      if (isNetworkError(error) && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        await setTimeout(delay);
        continue;
      }

      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

function isNetworkError(error: any): boolean {
  return (
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT" ||
    error.code === "EAI_AGAIN"
  );
}
```

---

## 🛑 CANCELLATION HANDLING

`AbortSignal` is a control signal, not a regular error.

**Rules:**
- Never catch `AbortError` without re-throwing.
- If cleanup is needed, use `finally` block.
- Use `AbortController` for coordinated cancellation.
- **Never retry `AbortError`** — it is a cancellation signal, not a transient failure.

```typescript
import { setTimeout } from "timers/promises";

async function longRunningTask(signal: AbortSignal) {
  try {
    await setTimeout(10000, undefined, { signal });
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("task_cancelled");
      // Perform cleanup if needed
      throw error; // Always re-throw
    }
    throw error;
  }
}

// Usage
const controller = new AbortController();
const task = longRunningTask(controller.signal);

// Cancel when needed
controller.abort();
```

**For independent batch operations (broadcasts):**
Use separate error handling per task rather than failing all on first error:

```typescript
// For broadcasts: isolate failures, don't fail all on one error
const results = await Promise.allSettled(
  chunk.map((uid) => sendOne(uid))
);
const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
```

---

## ⏱ BACKGROUND TASK LIFECYCLE

Background tasks must be tracked and cleaned up on shutdown:

```typescript
class BackgroundTaskManager {
  private tasks: Set<Promise<unknown>> = new Set();

  createTask<T>(task: Promise<T>): Promise<T> {
    // Wrap task to ensure it's removed from set on completion
    const wrappedTask = task
      .catch(() => {}) // Prevent unhandled rejection from finally() chain
      .finally(() => this.tasks.delete(wrappedTask)) as Promise<T>;

    this.tasks.add(wrappedTask);
    return task; // Return original task so caller handles errors
  }

  async shutdown(timeout = 5000): Promise<void> {
    if (this.tasks.size === 0) return;

    const allTasks = Array.from(this.tasks);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Shutdown timeout")), timeout)
    );

    try {
      await Promise.race([Promise.allSettled(allTasks), timeoutPromise]);
    } catch (error) {
      console.warn("shutdown_timeout", { pending: this.tasks.size });
    }
  }
}
```

**Rules:**
- Never fire-and-forget: untracked promises cause lost work and unhandled rejections.
- Always handle task errors via `.catch()` before tracking.
- Cancel all tasks on bot shutdown.
- `task.finally()` returns a new Promise — if it rejects and isn't caught, it can cause unhandled rejection. Always add `.catch(() => {})` after `finally()`.

---

## 📦 QUEUE FOR BACKPRESSURE

Use a queue to decouple producers from consumers with a proper worker pool model:

```typescript
class TaskQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private running = 0;
  private concurrency: number;
  private workers: Array<Promise<void>> = [];
  private resolveEmpty?: () => void;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
    // Start worker pool
    for (let i = 0; i < concurrency; i++) {
      this.workers.push(this.workerLoop());
    }
  }

  private async workerLoop(): Promise<void> {
    while (true) {
      // Wait for task or shutdown
      if (this.queue.length === 0) {
        await new Promise<void>((resolve) => {
          this.resolveEmpty = resolve;
          // Timeout to prevent hanging forever if queue is empty
          setTimeout(() => resolve(), 1000);
        });
        continue;
      }

      const taskFn = this.queue.shift()!;
      this.running++;

      try {
        await taskFn();
      } catch (error) {
        console.error("queue_task_error", error);
      } finally {
        this.running--;
      }
    }
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      // Signal workers that a task is available
      if (this.resolveEmpty) {
        this.resolveEmpty();
        this.resolveEmpty = undefined;
      }
    });
  }

  async drain(): Promise<void> {
    // Wait for queue to be empty and all tasks to complete
    while (this.queue.length > 0 || this.running > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async shutdown(): Promise<void> {
    // Stop workers gracefully
    for (const worker of this.workers) {
      // Worker loops will exit when queue is empty
    }
    await this.drain();
  }
}

// Usage
const queue = new TaskQueue(10); // Max 10 concurrent workers

// Producer — just add tasks, workers process automatically
for (let i = 0; i < 1000; i++) {
  queue.add(() => sendNotification(i));
}

// Wait for all tasks to complete
await queue.drain();
```

**Architecture:**
```
Producer              Queue              Worker Pool
  │                    │                     │
  ├── add(task) ──────►│                     │
  ├── add(task) ──────►│  ◄── worker 1 ──────┤
  ├── add(task) ──────►│  ◄── worker 2 ──────┤
  └── ...              │  ◄── worker N ──────┤
                       │                     │
```

**Use cases:**
- Telegram updates → worker pool → external API
- Broadcast requests → rate-limited workers → Telegram API
- File processing pipeline

**Rules:**
- Workers are started once in the constructor — no manual `process()` call needed.
- Tasks are processed automatically as they are added.
- Use `drain()` to wait for all tasks to complete before shutdown.

---

## 🔧 BEST PRACTICES

1. **Use `Promise.allSettled` for Independent Tasks**
   - `Promise.all` fails fast on first error — use for related tasks where cancellation is desirable.
   - `Promise.allSettled` isolates failures — use for independent batch operations (broadcasts).

2. **Control Parallelism with Semaphore**
   - Limit concurrent network requests to avoid socket exhaustion and Telegram rate limits.

3. **Distinguish HTTP Timeout vs Operation Deadline**
   - HTTP client timeout: transport-level limits (connect, read, write).
   - `AbortSignal`: operation-level deadline for the entire request.

4. **Offload Blocking Work Appropriately**
   - **CPU-bound, lightweight/moderate** → `worker_threads` (shares memory, lower overhead).
   - **CPU-bound, isolated/heavy** → `worker_threads` pool or `child_process` (full isolation).
   - **Long-running / distributed / durable jobs** → External worker / message queue (BullMQ, Redis).
   - **I/O-bound work** → Native async/await (no offloading needed).

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: services/broadcastService.ts
import { Bot } from "grammy";
import { executeWithRetry } from "../utils/retry";

interface BroadcastResult {
  sent: number;
  failed: number;
}

export class BroadcastService {
  constructor(
    private bot: Bot,
    private maxConcurrent = 25
  ) {}

  private semaphore = {
    count: 0,
    queue: Array<() => void>(),

    async acquire(): Promise<void> {
      if (this.count < this.maxConcurrent) {
        this.count++;
        return;
      }
      return new Promise((resolve) => {
        this.queue.push(resolve);
      });
    },

    release(): void {
      if (this.queue.length > 0) {
        const resolve = this.queue.shift()!;
        resolve();
      } else {
        this.count--;
      }
    },
  };

  private async sendOne(userId: bigint, text: string): Promise<boolean> {
    await this.semaphore.acquire();
    try {
      return await executeWithRetry(
        async () => {
          await this.bot.api.sendMessage(userId, text);
          return true;
        },
        3,
        1000
      );
    } catch (error: any) {
      console.error("send_failed", { userId, error: error.message });
      return false;
    } finally {
      this.semaphore.release();
    }
  }

  async broadcast(userIds: bigint[], text: string): Promise<BroadcastResult> {
    console.log("broadcast_start", { recipients: userIds.length });
    let sent = 0;
    const chunkSize = 100;

    for (let offset = 0; offset < userIds.length; offset += chunkSize) {
      const chunk = userIds.slice(offset, offset + chunkSize);

      // Process chunk with isolated failures (no sibling cancellation)
      const results = await Promise.allSettled(
        chunk.map((uid) => this.sendOne(uid, text))
      );

      sent += results.filter(
        (r) => r.status === "fulfilled" && r.value === true
      ).length;

      // Brief pause between chunks to respect Telegram network limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const result: BroadcastResult = { sent, failed: userIds.length - sent };
    console.log("broadcast_complete", result);
    return result;
  }
}

// File: utils/httpClient.ts
import axios, { AxiosInstance } from "axios";

export class HttpClient {
  private client: AxiosInstance;

  constructor(timeout = 10000) {
    this.client = axios.create({ timeout });
  }

  async getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
    const response = await this.client.get<T>(url, { signal });
    return response.data;
  }
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: Blocking sleep, synchronous requests, unbounded concurrency, no timeout

import axios from "axios";

async function badBroadcast(userIds: bigint[], text: string) {
  // Unbounded concurrency — 10,000 concurrent connections = socket exhaustion
  const promises = userIds.map(async (uid) => {
    // No timeout — hung connection blocks forever
    await axios.post(`https://api.telegram.org/botTOKEN/sendMessage`, {
      chat_id: uid,
      text,
    });
  });

  // Rejects as soon as one promise rejects — does not provide isolated per-task results
  await Promise.all(promises);
}
```

**Why this is bad:**
- No concurrency limit — socket exhaustion.
- No timeout — hung connection blocks forever.
- `Promise.all` rejects on first error — remaining promises continue running but their results are lost to the caller.
- No rate limiting — Telegram will ban the bot.

---

## 🚨 COMMON MISTAKES
1. **Unbounded `Promise.all()`** – 10,000 concurrent promises exhaust sockets. Always use semaphore or chunking.
2. **Forgetting `await`** – `await promise` returns the result; `promise` returns a Promise object.
3. **Using `sleep` from sync libraries** – Always use `setTimeout` from `timers/promises` or `new Promise(resolve => setTimeout(resolve, ms))`.
4. **Swallowing `AbortError`** – Never catch abort errors without re-throwing. Cancellation is a control signal.
5. **Using `Promise.all` for independent batch operations** – `Promise.all` rejects as soon as one promise rejects, so it does not provide isolated per-task results for independent batch operations. Use `Promise.allSettled` for broadcasts.
6. **Confusing HTTP timeout with operation deadline** – HTTP client timeout is transport-level; `AbortSignal` is operation-level.
7. **Using `worker_threads` for I/O-bound work** – Use for CPU-bound work only. I/O is already async in Node.js.
8. **Fire-and-forget promises** – Untracked promises cause lost work and unhandled rejections.
9. **Ignoring `429 Too Many Requests`** – Always obey server-provided `retry_after` delay.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] All sleep calls use `setTimeout` from `timers/promises`, never sync sleep.
- [ ] External API calls use async clients (axios, node-fetch).
- [ ] Concurrency is bounded by semaphore or fixed chunk sizes.
- [ ] All external calls have appropriate timeouts (HTTP client + AbortSignal).
- [ ] CPU-bound work is offloaded appropriately (worker_threads for CPU, async for I/O).
- [ ] `AbortError` is never swallowed — always re-thrown.
- [ ] Background tasks are tracked and cancelled on shutdown.
- [ ] `429 Too Many Requests` is handled with server-provided `retry_after`.
- [ ] `Promise.allSettled` used for independent batch operations (not `Promise.all`).

---

## 📚 CHEATSHEET
| Operation | Wrong (Sync/Blocking) | Correct (Async) |
|---|---|---|
| Delay | `sleep(2000)` | `await setTimeout(2000)` |
| HTTP Request | `axios.get(url)` | `await axios.get(url)` |
| Parallel Tasks | Sequential `for` loop | `Promise.allSettled(tasks)` with Semaphore |
| CPU Work (light) | `processImage(img)` | `worker_threads` pool |
| CPU Work (heavy) | `processLargeDataset(data)` | `worker_threads` or `child_process` |
| Timeout | None (hangs forever) | `AbortController` with timeout |
| Rate Limit | Ignore, retry immediately | `await setTimeout(retry_after * 1000)` |
| Cancellation | `catch (e) { }` | `catch (e) { cleanup(); throw e; }` |
| Background Task | `promise` (forgotten) | Track promise, handle errors, cancel on shutdown |

**Timeout layers:**
```
HTTP client timeout → transport-level (connect, read, write)
AbortSignal         → operation-level deadline
```

**Retry rules:**
| Error | Action |
|---|---|
| `429 Too Many Requests` | Sleep `retry_after`, retry once |
| Network timeout | Exponential backoff + jitter |
| 4xx permanent | Do NOT retry |
| `AbortError` | Always re-throw |

---

## 🔗 RELATED SKILLS
- ⬆️ [`telegram-bot-database`] – Utilizes async drivers and non-blocking session pooling
- ⬆️ [`telegram-bot-handlers`] – Ensures handler coroutines remain non-blocking during execution
- ⬆️ [`telegram-bot-structure`] – Governs event loop lifecycle and background task execution
- 🛡️ [`telegram-bot-error-handling`] – Catches async timeouts, task cancellations, and worker errors

---

## 📝 NOTES
- Use `node:test` with async/await for unit testing async code.
- Use `Promise.allSettled` for independent batch operations (broadcasts) to isolate failures.
- For webhooks, use Express or Fastify with HTTPS instead of long polling.
- `TaskQueue` provides backpressure for producer-consumer patterns with automatic worker processing.
- Always track background tasks and cancel them on shutdown.
- **CPU offloading decision:**
  - `worker_threads` for CPU-bound work that needs shared memory (image processing, PDF rendering).
  - `child_process` for CPU-bound work that needs full isolation or runs external binaries.
  - External worker / message queue for long-running, distributed, or durable jobs.
  - Native async/await for I/O-bound work (no offloading needed).

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Node.js/TypeScript Edition