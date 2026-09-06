---
name: logging-standards
description: Universal structured logging standards for any project (TypeScript, Python, Go, Rust). Covers log levels, JSON format, context propagation, sensitive data filtering, log rotation, aggregation, performance logging, and distributed tracing. Transport-specific middleware (Express, FastAPI) belongs in platform-specific skills.
---

# 📌 Logging Standards

## 🎯 GOAL
**One sentence:** Implement consistent, structured, context-rich logging across all application layers so every log entry is searchable, traceable, and actionable.

> Example:
> Every log includes `timestamp`, `level`, `service`, and `event`. Context fields (`requestId`, `userId`, `traceId`, `jobId`) are added based on execution context. Sensitive data is never logged.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Language/runtime conventions** — `structlog` in Python, `pino`/`winston` in Node.js, `zap`/`slog` in Go, `tracing` in Rust.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Observability standards, security policies.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> Example: If a Rust project uses `tracing::info_span!`, do NOT switch to `println!` just because this skill suggests structured logging.

---

## 💡 KEY PRINCIPLES
- **Structured Logs** — Production logs must be structured and machine-parseable. JSON is the default format unless the deployment platform requires another structured format.
- **Context Is King** — Every log entry includes `timestamp`, `level`, `service`, and `event`. Additional context (`requestId`, `userId`, `traceId`, `jobId`) depends on execution context.
- **Never Log Secrets** — Passwords, tokens, API keys, credit cards are redacted before logging.
- **Right Level, Right Place** — `DEBUG` for development, `INFO` for operations, `WARN` for degraded state, `ERROR` for failures, `CRITICAL` for alerts.
- **Avoid High-Cardinality Labels** — Do not index fields like `userId`, `email`, `URL`, or `requestBody` as labels in log aggregation systems unless the platform explicitly supports them without excessive cost.

---

## 📁 LOG CONTEXT BY EXECUTION CONTEXT

| Context | Required Fields | Optional Fields |
|---|---|---|
| **All logs** | `timestamp`, `level`, `service`, `event` | — |
| **HTTP request** | `requestId`, `method`, `path` | `statusCode`, `durationMs`, `userAgent` |
| **Authenticated request** | `userId` (when available) | `userRole`, `sessionId` |
| **Background job** | `jobId`, `jobName`, `attempt` | `queue`, `priority` |
| **Message consumer** | `messageId`, `correlationId` | `topic`, `partition` |
| **Distributed trace** | `traceId`, `spanId` | `parentSpanId`, `traceFlags` |
| **Database operation** | `queryName`, `operation` | `durationMs`, `rowCount` |
| **CLI command** | `command`, `args` | `durationMs`, `exitCode` |
| **Worker process** | `workerId`, `taskType` | `attempt`, `queue` |

> **Adapt context fields to the execution environment.** Not all contexts have `requestId` or `userId`. Background jobs, CLI tools, and worker processes use different context fields.

---

## 🔧 LOG LEVELS

| Level | When to Use | Example |
|---|---|---|
| `DEBUG` | Detailed diagnostic info, dev only | `db_query query=get_user_by_id duration_ms=24` |
| `INFO` | Normal operations, business events | `event=user_logged_in user_id=123` |
| `WARN` | Degraded but recoverable | `event=rate_limit_approaching usage_pct=85` |
| `ERROR` | Operation failed, needs attention | `event=email_send_failed error=timeout duration_ms=30000` |
| `CRITICAL` | System-level failure, immediate alert | `event=db_pool_exhausted active_connections=100` |

> Never log full SQL statements with parameter values in production. Log `queryName`, `operation`, `durationMs`, and `rowCount` instead.

---

## ✅ CODE EXAMPLE — TypeScript (pino)

```typescript
// File: utils/logger.ts
import pino from 'pino';

const redactPaths = ['password', 'token', 'apiKey', 'secret', 'authorization', 'creditCard'];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: redactPaths,
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

// Usage in any context:
logger.info({ event: 'user_logged_in', userId: 123 });
logger.error({ event: 'db_query_failed', error: err.message, queryName: 'get_user' });
```

---

## ✅ CODE EXAMPLE — Python (structlog)

```python
# File: utils/logger.py
import structlog
import logging
import sys
from typing import Any

# Configure structlog for JSON output
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    logger_factory=structlog.PrintLoggerFactory(sys.stdout),
    cache_logger_on_first_use=True,
)

# Redaction filter for sensitive data
SENSITIVE_KEYS = {'password', 'token', 'api_key', 'secret', 'authorization', 'credit_card'}

def redact_sensitive_data(logger: Any, method_name: str, event_dict: dict) -> dict:
    for key in SENSITIVE_KEYS:
        if key in event_dict:
            event_dict[key] = '[REDACTED]'
    return event_dict

def setup_logger(service_name: str) -> structlog.BoundLogger:
    return structlog.get_logger().bind(service=service_name)

logger = setup_logger("my-service")

# Usage:
logger.info("user_logged_in", user_id=123)
logger.error("db_query_failed", error=str(e), query_name="get_user")
```

---

## ✅ CODE EXAMPLE — Go (slog)

```go
// File: utils/logger.go
package utils

import (
    "log/slog"
    "os"
)

var Logger *slog.Logger

func init() {
    Logger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))
}

// Usage:
Logger.Info("user_logged_in", slog.Int("user_id", 123))
Logger.Error("db_query_failed", slog.String("error", err.Error()), slog.String("query_name", "get_user"))
```

---

## ❌ ANTI-PATTERN (Wrong)

```python
# Problem: Unstructured logs, sensitive data leaked, no context, wrong levels

import logging
logger = logging.getLogger(__name__)

def login(username: str, password: str):
    logger.info(f"Login attempt: {username} / {password}")  # PASSWORD LOGGED!
    try:
        user = db.authenticate(username, password)
        logger.info("User logged in")  # NO USER ID, NO REQUEST ID
        return user
    except Exception as e:
        logger.info(f"Login failed: {e}")  # WRONG LEVEL (should be ERROR), NO CONTEXT
```

**Why this is bad:**
- Password logged in plaintext — security breach.
- No `requestId` — impossible to trace across services.
- No `userId` — impossible to investigate specific user issues.
- `INFO` level for errors — alerts won't trigger.

---

## 🚨 COMMON MISTAKES
1. **Logging sensitive data** – Passwords, tokens, API keys must be redacted.
2. **Unstructured strings** – `logger.info(f"User {id} did {action}")` → use structured fields with `event`.
3. **Wrong log levels** – Errors use `INFO`, debug messages use `ERROR`.
4. **Missing context** – Logs without `requestId`/`traceId` are untraceable in distributed systems.
5. **Assuming userId is always available** – Not all operations have an authenticated user (startup, health checks, cron jobs, CLI commands).
6. **Logging full SQL with parameter values** – May leak sensitive data; log `queryName` instead.
7. **Using high-cardinality fields as indexed labels** – `userId`, `email`, `URL` as labels create excessive cost.
8. **Retrying non-transient errors in log handlers** – Log failures should not cause infinite retries.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Priority respected: language > existing project > project rules > this skill
- [ ] Logs are structured and machine-parseable
- [ ] All log levels used correctly (DEBUG/INFO/WARN/ERROR/CRITICAL)
- [ ] Every log entry includes `timestamp`, `level`, `service`, `event`
- [ ] Context fields added based on execution context (requestId, userId, traceId, jobId, etc.)
- [ ] Sensitive data is redacted (passwords, tokens, keys)
- [ ] Log rotation configured at appropriate layer (platform or application)
- [ ] Logs can be aggregated (centralized logging service)
- [ ] Performance operations logged (duration, status)
- [ ] Context propagated across service boundaries (traceId, spanId, correlationId)
- [ ] No high-cardinality fields used as indexed labels
- [ ] Logs are searchable and parseable

---

## 📚 CHEATSHEET

| Level | Use For | Example |
|---|---|---|
| `DEBUG` | Dev diagnostics | `event=db_query query=get_user_by_id duration_ms=24` |
| `INFO` | Business events | `event=user_registered user_id=123` |
| `WARN` | Degraded state | `event=cache_miss fallback=db` |
| `ERROR` | Operation failed | `event=email_send_failed error=timeout` |
| `CRITICAL` | System failure | `event=db_pool_exhausted` |

### Context Propagation

| Transport | Headers to Propagate |
|---|---|
| HTTP | `X-Request-Id`, `X-Trace-Id`, `X-Span-Id` |
| Message Queue | `traceId`, `spanId`, `correlationId` in message metadata |
| gRPC | `traceparent`, `tracestate` in metadata |

### High-Cardinality Fields (Do NOT index as labels)

| Field | Why | Alternative |
|---|---|---|
| `userId` | Millions of unique values | Log as field, not label |
| `email` | PII + high cardinality | Redact or hash |
| `URL` | Path + query = unbounded | Log path only, strip query params |
| `requestBody` | Unbounded size | Log size, not content |
| `stackTrace` | Unique per error instance | Log as field, not label |

### SQL Logging (Production-Safe)

```json
// ✅ Good
{ "event": "db_query", "query": "get_user_by_id", "durationMs": 24, "rowCount": 1 }

// ❌ Bad (may leak sensitive values)
{ "sql": "SELECT * FROM users WHERE email = 'user@example.com'" }
```

---

## 🔗 RELATED SKILLS
- ⬆️ [`error-handling-standards`] – Errors trigger log entries at appropriate levels
- ⬆️ [`async-patterns-universal`] – Async context propagation for requestId
- ⬇️ [`performance-optimization`] – Performance logging for slow operations
- ⬇️ [`git-workflow`] – Log analysis in CI/CD pipelines

---

## 📝 NOTES
- For Node.js: use `pino` (fastest) or `winston` (most features).
- For Python: use `structlog` (recommended) or `python-json-logger` for structured output.
- For Go: use `slog` (standard library, Go 1.21+) or `zap` (fastest).
- For Rust: use `tracing` with `tracing-subscriber` for structured output.
- For distributed tracing: propagate `traceId`, `spanId`, and `correlationId` via HTTP headers (`X-Trace-Id`, `X-Span-Id`, `traceparent`) and message queue metadata.
- For log rotation: configure at the appropriate layer (container runtime, log collector, or platform). Applications should not implement file rotation when the deployment platform provides centralized log collection and retention.
- For high-cardinality fields: log them as fields, not indexed labels, to avoid excessive cost in log aggregation systems.
- **Platform-specific middleware:** For Express/Next.js request logging middleware, see `web-project-structure`. For FastAPI middleware, see web-specific patterns.

---

**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Universal Edition
