---
name: telegram-bot-error-handling
description: Production-grade centralized error handling and exception management for Telegram bots using grammY in Node.js/TypeScript. Enforces domain exception hierarchies, global error middleware, structured logging with context, admin alerting on critical failures, retry with exponential backoff, and graceful degradation patterns.
---

# 📌 Telegram Bot Error Handling

## 🎯 GOAL
**One sentence:** Implement centralized, structured exception management that ensures bot stability, provides clean user feedback, and dispatches developer alerts without crashing the process.

> Example:
> Catch all unhandled exceptions globally, return user-friendly messages to chats, log structured metadata for debugging, and send critical error alerts to an admin Telegram channel.

---

## 💡 KEY PRINCIPLES
- **Never Fail Silently** – Every exception must be logged with structured context (user_id, update_id, exception_type).
- **Sanitize User-Facing Errors** – Never expose stack traces, database details, or internal paths to end users. Internal message ≠ user message.
- **Categorize Exceptions** – Domain errors (user input), transient errors (API timeout), and critical errors (DB crash) each need different handling.
- **Retry Only Transient Idempotent Failures** – Retry only failures classified as transient AND only when the operation is idempotent or protected by an idempotency mechanism.
- **Admin Alert Best-Effort** – Admin alerting must never recursively trigger the global error handler. Alert failures must be logged, not re-thrown.

---

## 📁 EXCEPTION STRUCTURE

```
errors/
├── index.ts
├── BotError.ts           # Base error class
├── DatabaseError.ts      # DatabaseError, ConnectionLostError, DeadlockError
├── ExternalAPIError.ts   # ExternalAPIError, RateLimitError
└── ValidationError.ts    # ValidationError, NotFoundError
```

---

## 🔄 RETRY STRATEGY

Different errors require different retry strategies:

| Error type | Retry? | Strategy |
|---|---|---|
| Network timeout | Yes | Exponential backoff + jitter |
| Connection reset | Yes | Exponential backoff |
| HTTP 5xx | Yes | Bounded retry |
| Temporary DB failure | Yes | Exponential backoff |
| Deadlock | Yes | Retry once |
| `429 Too Many Requests` | Yes | Obey `retry_after` |
| Validation error | **NO** | Return error to user |
| Permission denied | **NO** | Return error to user |
| Not found | **NO** | Return error to user |
| Business rule violation | **NO** | Return error to user |

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
      // Handle rate limit
      if (error.code === 429 && error.parameters?.retry_after) {
        if (attempt < maxRetries - 1) {
          await setTimeout(error.parameters.retry_after * 1000);
          continue;
        }
      }

      // Handle transient errors with backoff
      if (isTransientError(error) && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        await setTimeout(delay);
        continue;
      }

      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

function isTransientError(error: any): boolean {
  return (
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT" ||
    error.code === "EAI_AGAIN" ||
    (error.code >= 500 && error.code < 600)
  );
}
```

---

## 🛑 CANCELLATION HANDLING

`AbortError` is a control signal, not a regular error.

**Rules:**
- Never catch `AbortError` without re-throwing.
- If cleanup is needed, use `finally` block.

```typescript
async function longRunningTask(signal: AbortSignal) {
  try {
    // Some async operation
    await doWork({ signal });
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("task_cancelled");
      // Perform cleanup if needed
      throw error; // Always re-throw
    }
    throw error;
  }
}
```

---

## 🔧 BEST PRACTICES

1. **Build a Typed Error Hierarchy**
   - All domain errors extend `BotError` with a `userMessage` property for safe display.
   - Internal message ≠ user message.

2. **Register a Global Error Handler**
   - Intercept all uncaught exceptions from any handler or middleware in one place.

3. **Attach Structured Context to Every Log**
   - Include `user_id`, `update_id`, and `exception_type` in every error log entry.

4. **Alert Admins with Deduplication**
   - Send alerts for unexpected/critical errors only.
   - Use rate limiting or deduplication to avoid alert storms.
   - Always wrap admin alerts in `try/catch`.

5. **Retry Only Transient Idempotent Failures**
   - Apply retry logic only to transient errors (timeout, connection reset, 5xx).
   - Never retry validation errors, permission denied, or non-idempotent operations.

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: errors/BotError.ts
export class BotError extends Error {
  constructor(
    message: string,
    public userMessage: string = "An error occurred. Please try again later.",
    public logLevel: "warning" | "error" | "critical" = "warning"
  ) {
    super(message);
    this.name = "BotError";
  }
}

export class ValidationError extends BotError {
  constructor(
    message: string,
    userMessage: string = "Invalid input. Please check your data.",
    public field?: string
  ) {
    super(message, userMessage, "warning");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends BotError {
  constructor(entity: string, identifier: string | number) {
    super(
      `${entity} not found: ${identifier}`,
      `${entity} not found.`,
      "warning"
    );
    this.name = "NotFoundError";
  }
}

export class ExternalAPIError extends BotError {
  constructor(service: string, statusCode?: number) {
    super(
      `External API error: ${service} (status=${statusCode})`,
      "Service temporarily unavailable. Please try again.",
      "error"
    );
    this.name = "ExternalAPIError";
  }
}

// File: middlewares/errorHandler.ts
import { Bot, Context, GrammyError } from "grammy";
import { BotError } from "../errors/BotError";
import logger from "../utils/logger";

export function setupErrorHandlers(
  bot: Bot,
  adminChatId: bigint
): void {
  bot.catch(async (ctx: Context, error: Error) => {
    const userId = ctx.from?.id;
    const updateId = ctx.update?.update_id;

    // 1. Domain exceptions — safe user message
    if (error instanceof BotError) {
      logger.log(error.logLevel, "domain_error", {
        userId,
        updateId,
        errorType: error.name,
        message: error.message,
      });
      await ctx.reply(error.userMessage);
      return;
    }

    // 2. Grammy errors (Telegram API errors)
    if (error instanceof GrammyError) {
      logger.error("telegram_api_error", {
        userId,
        updateId,
        errorType: error.name,
        errorCode: error.error_code,
        message: error.message,
      });
      await ctx.reply("A Telegram API error occurred. Please try again.");
      return;
    }

    // 3. Unexpected critical errors — full traceback
    logger.critical("unhandled_exception", {
      userId,
      updateId,
      errorType: error.name,
      message: error.message,
      stack: error.stack,
    });
    await ctx.reply("A system error occurred. Our team has been notified.");

    // 4. Admin alert (best-effort, never recursive)
    await alertAdmin(bot, adminChatId, error, updateId, userId).catch(
      (alertError) => {
        logger.error("admin_alert_failed", { error: alertError });
      }
    );
  });
}

async function alertAdmin(
  bot: Bot,
  adminChatId: bigint,
  error: Error,
  updateId: number,
  userId: bigint | undefined
): Promise<void> {
  try {
    const text = [
      "CRITICAL BOT ERROR",
      "",
      `Exception: ${error.name}: ${error.message}`,
      `Update ID: ${updateId}`,
      `User ID: ${userId}`,
      "",
      "Stack:",
      error.stack || "No stack trace",
    ].join("\n");

    await bot.api.sendMessage(adminChatId, text.substring(0, 4000));
  } catch (alertError) {
    // Never re-throw — alert failures must not crash the bot
    logger.error("admin_alert_failed", { error: alertError });
  }
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: Bare catch, swallowed errors, leaked tracebacks, no admin alert

bot.command("start", async (ctx) => {
  try {
    const result = await someService.doWork(ctx.message.text);
    await ctx.reply(`Result: ${result}`);
  } catch (error) {
    // Swallows all errors — hides bugs
    // No logging, no admin alert
  }
});

bot.command("debug", async (ctx) => {
  try {
    throw new Error("test");
  } catch (error: any) {
    // Leaks stack trace to user
    await ctx.reply(`Error: ${error.stack}`);
  }
});
```

**Why this is bad:**
- Bare `catch` masks critical bugs and prevents proper error handling.
- No logging makes production debugging impossible.
- Leaking stack traces exposes server paths and code structure to users.
- No admin notification — critical errors go unnoticed.

---

## 🚨 COMMON MISTAKES
1. **Catching all errors without re-throwing** – Prevents proper error propagation and global handling.
2. **Swallowing `AbortError`** – Never catch abort errors without re-throwing. Cancellation is a control signal.
3. **Double notification** – Handler `try/catch` sends error message, then global handler sends another. Use one or the other.
4. **Missing context in logs** – Logging `"Something went wrong"` without `user_id` or `update_id` is useless for debugging.
5. **Admin alert without `try/catch`** – If the alert itself fails, you lose both the error and the notification.
6. **Retrying non-idempotent operations** – Never retry payments, orders, or external commands without idempotency protection.
7. **Leaking internal errors to users** – Never expose stack traces or internal paths. Use `userMessage` property.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] All custom errors extend `BotError` with a `userMessage` property.
- [ ] A global error handler is registered at startup.
- [ ] Every error log includes `user_id`, `update_id`, and `errorType`.
- [ ] User-facing messages are sanitized — no stack traces, no internal paths.
- [ ] Internal message ≠ user message for all errors.
- [ ] Admin alerts are wrapped in `try/catch` to prevent cascading failures.
- [ ] Retry only configured for transient idempotent failures.
- [ ] Non-idempotent operations (payments, orders) have idempotency protection.
- [ ] `AbortError` is never swallowed — always re-thrown.

---

## 📚 CHEATSHEET
| Error Type | Log Level | User Sees | Admin Alert |
|---|---|---|---|
| `ValidationError` | `WARNING` | "Invalid input. Please check your data." | Nothing |
| `NotFoundError` | `WARNING` | "Entity not found." | Nothing |
| `ExternalAPIError` (transient) | `ERROR` | "Service temporarily unavailable." | Nothing (auto-recovery) |
| `ExternalAPIError` (persistent) | `ERROR` | "Service temporarily unavailable." | Alert if threshold exceeded |
| `Unhandled Exception` | `CRITICAL` | "A system error occurred." | Immediate full alert |

**Alert rules:**
- Domain errors (validation, not found) → no alert
- Expected transient failures → no immediate alert (monitor for patterns)
- Unexpected exceptions → immediate alert
- Use rate limiting/deduplication to avoid alert storms

---

## 🔗 RELATED SKILLS
- ⬆️ [`telegram-bot-structure`] – Registers global error middleware at the application entry point
- ⬆️ [`telegram-bot-handlers`] – Raises domain errors caught by global error handler
- ⬆️ [`telegram-bot-database`] – Intercepts DB connection failures, deadlocks, and pool exhaustion
- ⬆️ [`telegram-bot-async-patterns`] – Handles async timeouts, task cancellations, and worker errors

---

## 📝 NOTES
- Use retry libraries like `p-retry` for production retry logic with jitter.
- Always protect admin alert calls with their own `try/catch` — alert failures must never crash the bot.
- For alert deduplication, consider using a library like `bottleneck` or implement a simple rate limiter.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Node.js/TypeScript Edition