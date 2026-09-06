---
name: telegram-bot-database
description: Production-grade asynchronous database patterns for Telegram bots using Prisma ORM in Node.js/TypeScript. Covers typed models, Repository pattern, connection pooling, Prisma migrations, atomic transactions, deadlock handling, retry with exponential backoff, and structured query logging.
---

# 📌 Telegram Bot Database Integration

## 🎯 GOAL
**One sentence:** Implement robust, non-blocking asynchronous database persistence with typed ORM models, connection pooling, atomic transactions, and versioned schema migrations.

> Example:
> Use Prisma Client with typed models, Repository pattern for data access, Prisma Migrate for migrations, and structured pool configuration for production PostgreSQL.

---

## 💡 KEY PRINCIPLES
- **Non-Blocking I/O Only** – Never use synchronous database drivers inside an async event loop.
- **Repository Pattern** – All database access goes through repository classes; services never touch Prisma Client directly.
- **Service-Managed Transactions** – Transaction boundaries match business operations. Services define transaction scope; repositories must not use `$transaction` independently.
- **Typed Models** – Use Prisma schema with generated TypeScript types for compile-time safety and IDE support.
- **Explicit Relationship Loading** – Avoid implicit lazy loading. Use `include` or `select` to explicitly load relationships and prevent N+1 queries.

---

## 📁 DATABASE LAYER STRUCTURE

```
database/
├── index.ts
├── prisma.ts            # PrismaClient singleton with lifecycle management
├── repositories/
│   ├── index.ts
│   └── userRepository.ts  # CRUD operations
└── migrations/           # Prisma Migrate
    └── <timestamp>_<name>/
        └── migration.sql
```

---

## 🔒 DEADLOCKS & RETRIES

### Deadlock handling
Deadlocks occur when two transactions wait for each other's locks. PostgreSQL automatically detects and aborts one.

**Pattern:**
```typescript
import { Prisma } from "@prisma/client";

async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "40001" && // serialization_failure
        attempt < maxRetries - 1
      ) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}
```

### When to retry
- **Deadlock** → retry with exponential backoff.
- **Serialization failure** → retry.
- **Connection timeout** → retry (if idempotent).
- **Unique constraint violation** → do NOT retry, return error to user.
- **Foreign key violation** → do NOT retry, return error to user.

---

## 📊 QUERY LOGGING

Enable structured query logging for debugging and performance analysis:

```typescript
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
  ],
});

// Structured query logging
prisma.$on("query", (e) => {
  const duration = parseFloat(e.duration);
  if (duration > 100) {
    logger.warn("slow_query", { duration, query: e.query });
  } else {
    logger.debug("query", { duration, query: e.query });
  }
});

prisma.$on("error", (e) => {
  logger.error("prisma_error", { error: e.target, message: e.message });
});
```

**Production rules:**
- Do NOT enable `log: ["query"]` in production (too verbose).
- Use event-based logging for selective slow query logging.
- Log slow queries only (threshold: > 100ms).
- Never log parameter values containing sensitive data (passwords, tokens).

---

## 📐 PAGINATION STRATEGIES

### LIMIT/OFFSET (small datasets)
```typescript
const users = await prisma.user.findMany({
  skip: offset,
  take: limit,
  orderBy: { createdAt: "desc" },
});
```
- **Use when:** Admin panels, small tables (< 100k rows).
- **Problem:** `skip: 100000` scans and discards 100k rows.

### Keyset pagination (large datasets)
```typescript
const users = await prisma.user.findMany({
  where: {
    id: { gt: lastSeenId },
  },
  orderBy: { id: "asc" },
  take: limit,
});
```
- **Use when:** User-facing feeds, large tables, infinite scroll.
- **Benefit:** Constant time regardless of page depth.

---

## 🔀 RELATIONSHIP LOADING STRATEGIES

Avoid N+1 queries by explicitly loading relationships:

```typescript
// N+1 problem (BAD):
const users = await prisma.user.findMany();
for (const user of users) {
  const orders = await prisma.order.findMany({
    where: { userId: user.id }, // One query per user
  });
}

// Fixed with include (GOOD):
const users = await prisma.user.findMany({
  include: { orders: true }, // Single query with JOIN
});

// Or with select for specific fields:
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    orders: {
      select: { id: true, amount: true },
    },
  },
});
```

**Rules:**
- `include` → load full related objects.
- `select` → load specific fields only (more efficient).
- Never rely on implicit lazy loading — it triggers additional queries unexpectedly.

---

## 🔧 BEST PRACTICES

1. **Use `BigInt` for Telegram IDs**
   - Telegram user IDs can exceed 2^31. Always use `BigInt` primary key or unique indexed column.

2. **Bind Prisma Client to Request Lifecycle via Middleware**
   - Create a fresh transaction context per update, inject it into handler context, and auto-close on completion. Never use global Prisma Client instances without proper lifecycle management.

3. **Version Migrations With Prisma Migrate**
   - Never run raw DDL in production code. Use `npx prisma migrate dev --name description` for schema changes.

4. **Pool Configuration for Production**
   - Configure connection pool based on database capacity, number of application replicas, and expected concurrency.
   - **Never copy production pool values blindly** — 5 replicas × `pool_size=20` = 100 potential connections.
   - Use connection pooling middleware for efficient connection reuse.

5. **Database Constraints Over Application Validation**
   - Use `@@unique`, `@@index`, `@relation(onDelete: Cascade)` to enforce data integrity at the database level.
   - Application validation is secondary; constraints are the source of truth.

---

## ✅ CODE EXAMPLE (Correct)

```prisma
// File: prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  telegramId  BigInt   @id @default(autoincrement())
  username    String?  @unique @db.VarChar(64)
  firstName   String   @db.VarChar(64)
  isActive    Bool     @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orders      Order[]

  @@index([username])
}

model Order {
  id        Int      @id @default(autoincrement())
  userId    BigInt
  amount    Int
  status    String   @default("pending")
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [telegramId], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}

model ProcessedUpdate {
  updateId   String   @id
  createdAt  DateTime @default(now())

  @@index([createdAt])
}
```

```typescript
// File: database/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

// File: database/repositories/userRepository.ts
import { PrismaClient, User } from "@prisma/client";

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async getById(telegramId: bigint): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { telegramId },
    });
  }

  async createOrUpdate(
    telegramId: bigint,
    username: string | null,
    firstName: string
  ): Promise<User> {
    // UPSERT pattern
    return this.prisma.user.upsert({
      where: { telegramId },
      update: { username, firstName },
      create: { telegramId, username, firstName },
    });
  }

  async listActive(limit = 50, cursor?: bigint): Promise<User[]> {
    // Keyset pagination for large datasets
    return this.prisma.user.findMany({
      where: { isActive: true },
      skip: cursor ? 1 : 0,
      cursor: cursor ? { telegramId: cursor } : undefined,
      orderBy: { telegramId: "asc" },
      take: limit,
    });
  }

  async deactivate(telegramId: bigint): Promise<void> {
    await this.prisma.user.update({
      where: { telegramId },
      data: { isActive: false },
    });
  }
}

// File: middlewares/database.ts
import { Context, MiddlewareFn } from "grammy";
import { PrismaClient } from "@prisma/client";
import { UserRepository } from "../database/repositories/userRepository";

interface BotContext extends Context {
  prisma: PrismaClient;
  userRepository: UserRepository;
}

export function databaseMiddleware(prisma: PrismaClient): MiddlewareFn<BotContext> {
  return async (ctx, next) => {
    // Inject Prisma client and repositories into context
    ctx.prisma = prisma;
    ctx.userRepository = new UserRepository(prisma);
    try {
      await next();
    } catch (error) {
      // Transaction rollback handled by service layer
      throw error;
    }
  };
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: Sync driver, SQL injection, no pooling, no transactions, connection leak

import { createClient } from "some-sync-db-client";

const db = createClient("bot.db");

async function saveUser(userId: number, username: string) {
  // SYNC — blocks event loop
  const result = db.query(
    `INSERT INTO users VALUES (${userId}, '${username}')` // SQL INJECTION!
  );
  // Connection never closed if exception occurs — resource leak
}
```

**Why this is bad:**
- Synchronous I/O blocks the entire event loop for all concurrent users.
- String interpolation enables SQL injection.
- Connection opened/closed per call destroys performance.
- No error handling — exception leaves connection unclosed.

---

## 🚨 COMMON MISTAKES
1. **Using `$transaction` inside repositories** – Repositories must not manage transactions independently. Services define transaction boundaries.
2. **32-bit integer for `telegramId`** – Telegram IDs overflow `Int`; always use `BigInt`.
3. **Unbounded queries** – Always apply `take` or keyset pagination to list queries.
4. **Implicit lazy loading** – Use `include` or `select` to explicitly load relationships.
5. **SELECT-then-UPSERT instead of UPSERT** – Use `upsert` for atomic create-or-update.
6. **Hardcoding pool configuration** – Pool size must match deployment (replicas × pool_size ≤ DB max_connections).
7. **No deadlock retry logic** – Wrap critical transactions with retry on deadlock detection.
8. **Using SQLite as production database** – SQLite is for testing only; use PostgreSQL with Prisma in production.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] All database operations are async (`await prisma.user.findMany(...)`).
- [ ] Telegram `telegramId` uses `BigInt` type.
- [ ] Connection pooling configured based on deployment (not hardcoded).
- [ ] Repositories do NOT use `$transaction` — services manage transaction boundaries.
- [ ] Schema changes are versioned with Prisma Migrate.
- [ ] Relationships use explicit loading (`include`/`select`).
- [ ] UPSERT uses `upsert` not SELECT-then-INSERT.
- [ ] Deadlock retry logic implemented for critical transactions.
- [ ] SQLite used for testing only, PostgreSQL for production.

---

## 📚 CHEATSHEET
| Task | Correct Pattern |
|---|---|
| Create/Update | `prisma.model.upsert({ where, update, create })` |
| Read single | `await prisma.model.findUnique({ where })` |
| Read list (small) | `findMany({ skip, take, orderBy })` |
| Read list (large) | Keyset: `findMany({ cursor, skip: 1, take })` |
| Update fields | `prisma.model.update({ where, data })` |
| Load relationships | `findMany({ include: { relation: true } })` |
| Transaction | Service: `prisma.$transaction(async (tx) => { ... })` |
| Deadlock retry | `executeWithRetry(fn, maxRetries=3)` |

**Pool configuration:**
```
DATABASE_URL with connection pool params
?connection_limit=10
```

---

## 🔗 RELATED SKILLS
- ⬆️ [`telegram-bot-handlers`] – Invokes repository functions from service layer
- ⬆️ [`telegram-bot-structure`] – Configures Prisma client, session factory, and middleware injection
- 🔄 [`telegram-bot-async-patterns`] – Guides async drivers, connection pooling, and concurrent DB access
- 🛡️ [`telegram-bot-error-handling`] – Handles database connection failures, deadlocks, and retries

---

## 📝 NOTES
- **Production database:** PostgreSQL with Prisma Client. Never use synchronous drivers in async code.
- **Testing database:** SQLite with `prisma sqlite` for unit tests only. For integration tests, use a PostgreSQL test container if testing PostgreSQL-specific features (UPSERT, JSONB, etc.).
- **Prisma Migrate:** Use `npx prisma migrate dev --name description` for development, `npx prisma migrate deploy` for production.
- **Connection limits:** Always calculate pool size based on total database connections available and number of application replicas.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Node.js/TypeScript Edition