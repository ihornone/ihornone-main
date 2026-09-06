---
name: telegram-bot-structure
description: Production-grade architecture, directory layout, and initialization sequence for scalable Telegram bots built with Node.js/TypeScript and grammY. Enforces strict separation of concerns, dependency injection, Zod configuration, and clean lifecycle management.
---

# 📌 Telegram Bot Structure

## 🎯 GOAL
**One sentence:** Modular, production-ready directory architecture for Telegram bots ensuring long-term maintainability, testability, and horizontal scalability.

> Example:
> Standardized enterprise-grade layout separating presentation (handlers), domain business logic (services), data persistence (database repositories), and configuration management.

---

## 💡 KEY PRINCIPLES
- **Separation of Concerns** – Handlers only validate inputs and render responses; services encapsulate domain rules; repositories handle database access.
- **Dependency Injection (DI)** – Inject database clients, services, and configuration objects into handlers via grammY context rather than referencing global singletons.
- **Strict Configuration Typing** – Use `zod` to parse, validate, and protect environment variables at startup.
- **Explicit Lifecycle Management** – Register startup and shutdown hooks to open/close connection pools, HTTP clients, and background tasks gracefully.
- **Feature-Coherence** – Keep all code for a single feature (handlers, service, repository, schemas, keyboards, callbacks, sessions) co-located in one directory. Do not split feature logic across global layer directories.

---

## 🧠 BOT ARCHITECTURE DECISION RULES

Use this tree before choosing a structure or pattern.

### Structure evolution
- **Small bot (< 10 commands)** → simple layered structure (`handlers/`, `services/`, `database/`).
- **Growing bot (10–50 commands)** → introduce `features/` with co-located logic.
- **Large bot (50+ commands, multiple domains)** → strict feature boundaries + shared infrastructure.
- **High-scale bot** → distributed architecture with separate worker processes for background jobs.

### Update type → Handler pattern
- **Text message with command** → `bot.command("start", handler)` or Composer route.
- **Text message without command** → `bot.on("message:text", handler)` for free-form input.
- **Callback query** → typed payload parsing with `bot.callbackQuery(regex, handler)`, never manual string parsing.
- **Inline query** → `bot.on("inline_query", handler)` for inline mode bots.
- **Pre-checkout / successful payment** → payment-specific handlers with idempotency.

### Session vs Business state
- **Session state** → describes conversation flow only (`awaiting_email`, `awaiting_confirmation`, `awaiting_payment`).
- **Business state** → stored in database (`user.is_verified`, `order.status`, `subscription.status`).
- **Never mix** → Session is temporary; business state is persistent. Do not store business state in session.

### Background job choice
- **Short-lived fire-and-forget** → `Promise` with proper error handling, tracked for lifecycle safety.
- **Reliable scheduled job** → `node-cron`, `bull`/`bullmq`, or external scheduler.
- **Long-running worker** → separate process/service, not inside the bot polling loop.

### Caching
- **User-specific, short-lived** → Redis with TTL.
- **Static, cross-user** → in-memory cache with invalidation.
- **Never cache** → payment states, admin actions, idempotency keys.

---

## 📐 TELEGRAM-SPECIFIC PATTERNS

### Callback Payload (typed, never string-parsed)
```typescript
// File: features/products/callbacks.ts
export interface ProductCallback {
  action: "view" | "buy" | "cancel";
  product_id: number;
  page?: number;
}

export function packProductCallback(data: ProductCallback): string {
  return `product:${JSON.stringify(data)}`;
}

export function unpackProductCallback(payload: string): ProductCallback {
  const parts = payload.split(":");
  if (parts[0] !== "product") throw new Error("Invalid callback prefix");
  return JSON.parse(parts.slice(1).join(":"));
}

// Handler — typed extraction, no manual parsing
bot.callbackQuery(/^product:/, async (ctx) => {
  const data = unpackProductCallback(ctx.callbackQuery.data);
  if (data.action === "buy") {
    await paymentService.createOrder(ctx.from.id, data.product_id);
  }
});
```

**Rule:** Never use `callback.data.startsWith("buy_")`. Always use typed payload parsing.

### Keyboards
- **Inline keyboards** → for callbacks, URLs, pagination. Co-locate with feature.
- **Reply keyboards** → for one-time input (phone, location). Remove after use (`ctx.reply(..., { reply_markup: { remove_keyboard: true } })`).
- **Force reply** → for sequential onboarding flows.

### Deep links
- **`?start=payload`** → use for referral tracking, onboarding flows, campaign attribution.
- **Payload validation** → validate and sanitize deep link payloads before use.

### Media handling
- **File IDs** → cache file IDs for reusable media (stickers, photos).
- **Large files** → download to temp storage, process, then delete.
- **Media groups** → use `ctx.replyWithMediaGroup()` for album uploads.

---

## 🔒 IDEMPOTENCY & TRANSACTION BOUNDARIES

### Update idempotency
Telegram may redeliver updates in failure scenarios. Production bots must handle duplicate updates gracefully.

**For operations where duplicate execution is harmful:**
- Payments, orders, subscriptions, points/credits, admin actions, webhooks.

**Pattern:**
```typescript
async function processPayment(
  updateId: number,
  userId: number,
  amount: number,
  prisma: PrismaClient
) {
  // Check idempotency key before processing
  const tx = await prisma.$transaction(async (tx) => {
    const existing = await tx.processedUpdate.findUnique({
      where: { updateId },
    });
    if (existing) return existing;

    const payment = await tx.payment.create({
      data: { userId, amount, status: "pending" },
    });
    await tx.processedUpdate.create({
      data: { updateId, paymentId: payment.id },
    });
    return payment;
  });
  return tx;
}
```

**Database:**
- Store `update_id` or generate idempotency key.
- Use unique constraints to prevent duplicates.
- Wrap in transaction.

### Transaction boundaries
- **Services define transaction boundaries** — a single business operation may touch multiple repositories within one transaction.
- **Repositories must NOT commit independently** unless explicitly designed for an isolated operation.
- **Pattern:**
```typescript
// Service manages transaction
async function createOrderWithPayment(
  userId: number,
  productId: number,
  prisma: PrismaClient
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: { userId, productId, status: "pending" },
    });
    const payment = await tx.payment.create({
      data: { orderId: order.id, amount: 100 },
    });
    await tx.inventory.update({
      where: { id: productId },
      data: { reserved: { increment: 1 } },
    });
    return { order, payment };
  });
}

// Repository does NOT manage transaction
class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: number, productId: number): Promise<Order> {
    // Called within a transaction, do NOT use $transaction here
    return this.prisma.order.create({
      data: { userId, productId, status: "pending" },
    });
  }
}
```

---

## 📁 STRUCTURE (Small Bot — Layered)

> Use this structure for bots with < 10 commands. For larger bots, see Feature-Based Structure below.

```
bot_project/
├── config/                  # Validated settings & static constants
│   ├── index.ts
│   ├── config.ts            # Zod schema for environment validation
│   └── constants.ts         # UI limits, string templates, fixed enum constants
├── database/                # Persistence setup, models & migrations
│   ├── index.ts
│   ├── prisma.ts            # PrismaClient singleton
│   └── repositories/        # Data access objects (DAOs)
│       └── userRepo.ts
├── handlers/                # Presentation layer (Composers & Handlers)
│   ├── index.ts             # Root composer aggregator
│   ├── start.ts             # Onboarding & /start command
│   ├── profile.ts           # User profile & session workflows
│   └── admin.ts             # Protected admin panel routes
├── middlewares/             # Cross-cutting concerns
│   ├── index.ts
│   ├── database.ts          # Prisma client injection middleware
│   ├── auth.ts              # User registration & ban check middleware
│   └── logging.ts           # Contextual logger enrichment
├── services/                # Pure business logic layer (framework agnostic)
│   └── userService.ts
├── utils/                   # Helper functions, formatters
│   └── logger.ts            # Winston/Pino configuration
├── .env.example             # Documented environment variables template
├── .gitignore               # Security exclusions (.env, node_modules)
├── src/
│   └── main.ts              # Process entry point & lifecycle bootstrapper
├── package.json             # Project dependencies
└── tsconfig.json            # TypeScript configuration
```

---

## 📁 STRUCTURE (Feature-Based — Large Bot)

> Use this structure for bots with 10+ commands or multiple domains.

```
bot_project/
├── src/
│   ├── bot.ts               # Bot instance
│   ├── composer.ts          # Composer setup, router aggregation
│   └── lifecycle.ts         # Startup/shutdown hooks
│
├── features/                # Domain features, self-contained
│   ├── auth/
│   │   ├── index.ts         # Feature composer export
│   │   ├── handlers.ts      # Message/callback handlers
│   │   ├── service.ts       # Business logic
│   │   ├── repository.ts    # Data access
│   │   ├── schemas.ts       # Zod schemas
│   │   ├── keyboards.ts     # Inline/reply keyboards
│   │   ├── callbacks.ts     # Callback payload types
│   │   └── session.ts       # Session state types
│   ├── profile/
│   ├── payments/
│   ├── subscriptions/
│   └── admin/
│
├── shared/                  # Cross-feature infrastructure
│   ├── database/
│   │   ├── prisma.ts
│   │   └── repositories/
│   ├── middleware/
│   │   ├── database.ts
│   │   ├── auth.ts
│   │   └── logging.ts
│   ├── telegram/
│   │   ├── keyboards.ts     # Shared keyboard builders
│   │   └── formatting.ts    # Message formatting utilities
│   └── utils/
│       └── logger.ts
│
├── config/
│   ├── config.ts
│   └── constants.ts
│
├── main.ts                  # Composition root — wiring only
├── package.json
└── tsconfig.json
```

**Rules:**
- Feature code stays inside `features/<name>/`. Do not import from other features directly.
- Cross-feature communication goes through `shared/` or explicit public interfaces.
- `shared/` must NOT import from `features/`.
- `main.ts` contains composition-root wiring only — no business logic.

---

## 📁 STRUCTURE (Distributed — High Scale)

> Use when background jobs, webhooks, or multiple workers are needed.

```
bot_project/
├── src/
├── features/
├── shared/
├── config/
├── workers/                  # Separate worker processes
│   ├── scheduler.ts         # node-cron for scheduled jobs
│   ├── paymentWorker.ts     # Payment reconciliation
│   └── broadcastWorker.ts   # Mass notifications
├── webhooks/                 # Webhook endpoint (Express/Fastify)
│   └── telegram.ts
├── main.ts                   # Bot polling process
├── package.json
└── tsconfig.json
```

---

## 🔧 BEST PRACTICES

1. **Use `zod` for Environment Validation**
   - Fail immediately on boot if required secrets or database URLs are missing or malformed.

2. **Aggregate Composers**
   - Small bot: group module composers into a single root composer.
   - Large bot: each feature has its own composer; aggregate in `src/composer.ts`.

3. **Set Global Default Parse Mode**
   - Set `parse_mode: "HTML"` when instantiating the `Bot`.

4. **Register Startup/Shutdown Hooks**
   - Open database pools and external HTTP clients on startup, close them explicitly during shutdown.

5. **Co-locate Feature Code**
   - Keep handlers, service, repository, schemas, keyboards, callbacks, and session types together in `features/<name>/`.
   - Do not split feature logic across global layer directories.

6. **Use Typed Callback Payloads**
   - Never parse callback strings manually. Use typed payload parsing functions.

7. **Separate Session from Business State**
   - Session describes conversation flow only. Business state lives in the database.

8. **Manage Background Tasks Safely**
   - Track `Promise` references. Handle errors. Cancel on shutdown.
   - Use `node-cron` or external scheduler for reliable scheduled jobs.

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: config/config.ts
import { z } from "zod";

const configSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  ADMIN_IDS: z.string().transform((val) =>
    val.split(",").map((id) => parseInt(id.trim(), 10))
  ),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  const result = configSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment variables:", result.error.format());
    process.exit(1);
  }
  return result.data;
}

// File: handlers/index.ts
import { Composer } from "grammy";
import { startComposer } from "./start";
import { profileComposer } from "./profile";
import { adminComposer } from "./admin";

export const mainComposer = new Composer();
mainComposer.use(startComposer, profileComposer, adminComposer);

// File: src/main.ts
import { Bot } from "grammy";
import { loadConfig } from "../config/config";
import { mainComposer } from "../handlers";
import { databaseMiddleware } from "../middlewares/database";
import { authMiddleware } from "../middlewares/auth";
import { prisma } from "../database/prisma";

async function onStartup() {
  console.log("Initializing bot resources...");
  await prisma.$connect();
}

async function onShutdown() {
  console.log("Shutting down bot. Cleaning up database pools...");
  await prisma.$disconnect();
}

async function main() {
  const config = loadConfig();

  const bot = new Bot(config.BOT_TOKEN, {
    defaultConfig: { parse_mode: "HTML" },
  });

  // Attach middlewares
  bot.use(databaseMiddleware(prisma));
  bot.use(authMiddleware);

  // Attach composers
  bot.use(mainComposer);

  // Lifecycle hooks
  bot.start = onStartup;
  bot.stop = onShutdown;

  // Start polling
  try {
    await bot.start({
      onStart: onStartup,
      onStop: onShutdown,
    });
  } catch (error) {
    console.error("Bot polling failed:", error);
    await onShutdown();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

---

## ✅ CODE EXAMPLE (Correct) — Feature-Based Structure

```typescript
// File: features/payments/callbacks.ts
export interface PaymentCallback {
  action: "create" | "confirm" | "cancel";
  order_id: number;
}

export function packPaymentCallback(data: PaymentCallback): string {
  return `payment:${JSON.stringify(data)}`;
}

export function unpackPaymentCallback(payload: string): PaymentCallback {
  const parts = payload.split(":");
  if (parts[0] !== "payment") throw new Error("Invalid callback prefix");
  return JSON.parse(parts.slice(1).join(":"));
}

// File: features/payments/session.ts
export interface PaymentSession {
  awaiting_confirmation: boolean;
  order_id?: number;
}

// File: features/payments/keyboards.ts
import { InlineKeyboard } from "grammy";
import { packPaymentCallback } from "./callbacks";

export function paymentKeyboard(orderId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text(
    "Confirm Payment",
    packPaymentCallback({ action: "confirm", order_id: orderId })
  );
  keyboard.text(
    "Cancel",
    packPaymentCallback({ action: "cancel", order_id: orderId })
  );
  return keyboard;
}

// File: features/payments/repository.ts
import { PrismaClient } from "@prisma/client";

export class OrderRepository {
  constructor(private prisma: PrismaClient) {}

  async create(userId: number, amount: number) {
    return this.prisma.order.create({
      data: { userId, amount, status: "pending" },
    });
  }

  async getById(orderId: number) {
    return this.prisma.order.findUnique({ where: { id: orderId } });
  }
}

// File: features/payments/service.ts
import { PrismaClient } from "@prisma/client";
import { OrderRepository } from "./repository";

export class PaymentService {
  private orderRepo: OrderRepository;

  constructor(private prisma: PrismaClient) {
    this.orderRepo = new OrderRepository(prisma);
  }

  async createOrder(userId: number, amount: number) {
    // Service manages transaction boundary
    return this.prisma.$transaction(async (tx) => {
      const order = await this.orderRepo.create(userId, amount);
      await this.notifyAdmins(tx, order);
      return order;
    });
  }

  async confirmOrder(orderId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await this.orderRepo.getById(orderId);
      if (!order) throw new Error("Order not found");
      return tx.order.update({
        where: { id: orderId },
        data: { status: "paid" },
      });
    });
  }

  private async notifyAdmins(tx: PrismaClient, order: any) {
    // Internal helper, same transaction
  }
}

// File: features/payments/handlers.ts
import { Composer, Context } from "grammy";
import { unpackPaymentCallback, PaymentCallback } from "./callbacks";
import { PaymentService } from "./service";

const composer = new Composer();

composer.callbackQuery(/^payment:/, async (ctx: Context) => {
  const data = unpackPaymentCallback(ctx.callbackQuery.data);
  const service = ctx.paymentService; // Injected via middleware

  if (data.action === "confirm") {
    const order = await service.confirmOrder(data.order_id);
    await ctx.editMessageText(`Order ${order.id} confirmed!`);
  } else if (data.action === "cancel") {
    await ctx.editMessageText("Payment cancelled.");
  }
});

export const paymentsComposer = composer;

// File: src/composer.ts
import { Composer } from "grammy";
import { paymentsComposer } from "../features/payments";
import { profileComposer } from "../features/profile";
import { authComposer } from "../features/auth";

export function createComposer(): Composer {
  const composer = new Composer();
  composer.use(authComposer, profileComposer, paymentsComposer);
  return composer;
}

// File: src/main.ts
import { Bot } from "grammy";
import { loadConfig } from "../config/config";
import { createComposer } from "./composer";
import { databaseMiddleware } from "../shared/middleware/database";
import { prisma } from "../shared/database/prisma";

async function main() {
  const config = loadConfig();

  const bot = new Bot(config.BOT_TOKEN, {
    defaultConfig: { parse_mode: "HTML" },
  });

  bot.use(databaseMiddleware(prisma));
  bot.use(createComposer());

  bot.start({
    onStart: () => prisma.$connect(),
    onStop: () => prisma.$disconnect(),
  });
}

main().catch(console.error);
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// File: main.ts
// Problem: Hardcoded secrets, global state, mixing handlers with setup, no graceful shutdown

import { Bot } from "grammy";

// HARDCODED SECRET & GLOBAL SINGLETON
const bot = new Bot("123456789:ABCdefGHIjklMNOpqrsTUVwxyz");

// INLINE DATABASE MUTATION INSIDE UI HANDLER
bot.command("start", async (ctx) => {
  // Direct database call inside handler — no service layer
  await ctx.prisma.user.upsert({
    where: { telegramId: ctx.from.id },
    update: {},
    create: { telegramId: ctx.from.id },
  });
  await ctx.reply("Welcome!");
});

// No graceful shutdown handling
bot.start();
```

**Why this is bad:**
- Secrets are committed directly into source code.
- Database calls inside handlers — no separation of concerns.
- Handlers mixed directly into `main.ts` makes testing and scaling impossible.
- Lacks graceful shutdown handling for database pools and HTTP clients.

---

## 🚨 COMMON MISTAKES
1. **Hardcoding secrets or configuration fallbacks in code** – Use `zod` to require valid `.env` variables on boot.
2. **Circular Import Dependencies** – Importing `main.ts` or handlers into service modules. Keep data flow unidirectional: `Main -> Composer -> Handler -> Service -> Repository`.
3. **Leaving unclosed HTTP/DB client sessions** – Always bind disposal functions to shutdown events or `finally` blocks.
4. **Splitting feature logic across global layers** – Do not scatter `payments/` handlers, service, and repository across `handlers/`, `services/`, and `database/`. Co-locate in `features/payments/`.
5. **Manual callback string parsing** – Never use `callback.data.startsWith("buy_")`. Use typed payload parsing.
6. **Mixing session state with business state** – Session is for conversation flow only. Store business state in the database.
7. **Repositories managing transactions independently** – Services define transaction boundaries. Repositories must not use `$transaction` unless explicitly designed for isolated operations.
8. **Ignoring update idempotency** – For payments, orders, and subscriptions, handle duplicate updates gracefully with idempotency keys.
9. **Using `utils/` as a dumping ground** – Helpers belong to the domain or shared infrastructure that owns their behavior. Do not create `utils/payments.ts`, `utils/api.ts`, etc.
10. **Unsafe background tasks** – Untracked promises without error handling cause lost work and unhandled rejections.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Structure matches bot size (layered for small, feature-based for large).
- [ ] Feature code is co-located (handlers, service, repo, schemas, keyboards, callbacks, session together).
- [ ] Composers are aggregated (single root composer or per-feature composers).
- [ ] Business logic is isolated inside services/use cases, independent from Telegram handlers.
- [ ] Environment variables are strictly validated with `zod`.
- [ ] `main.ts` contains composition-root wiring only — no business logic.
- [ ] Shutdown hooks clean up database pools and client sessions.
- [ ] Callback payloads are typed — no manual string parsing.
- [ ] Session states describe conversation flow only, not business state.
- [ ] Transaction boundaries are managed by services, not repositories.
- [ ] Idempotency is handled for payments/orders/subscriptions.
- [ ] Background tasks are tracked and cancelled on shutdown.
- [ ] `utils/` is not used as a dumping ground for domain logic.

---

## 📚 CHEATSHEET
| Layer / Path | Primary Responsibility | Senior Pattern |
|---|---|---|
| `config/config.ts` | Environment parsing & secrets | `zod` schema validation |
| `features/<name>/` | Self-contained domain feature | Co-located handlers, service, repo, schemas, keyboards, callbacks, session |
| `shared/database/` | ORM entities & connection pooling | Prisma Client, connection pooling |
| `shared/middleware/` | Cross-cutting concerns | DI middleware, auth check, logging enrichment |
| `shared/telegram/` | Shared Telegram utilities | Keyboard builders, message formatting |
| `src/composer.ts` | Composer aggregation | Feature composers included here |
| `src/lifecycle.ts` | Startup/shutdown hooks | DB pool, HTTP sessions, background tasks |
| `src/main.ts` | Composition root | Wiring only, no business logic |
| `workers/` | Background jobs | node-cron, bullmq, or separate process |

**Structure evolution:**
```
Small (< 10 commands)    → layered: handlers/, services/, database/
Growing (10–50 commands) → feature-based: features/<name>/
Large (50+ commands)     → strict boundaries + shared infrastructure
High-scale               → distributed: workers/, webhooks/
```

**Telegram patterns:**
| Pattern | Rule |
|---|---|
| Callback Payload | Typed, never string-parsed |
| Session | Conversation flow only, not business state |
| Keyboards | Inline for callbacks, reply for one-time input |
| Deep links | `?start=payload` for referrals/onboarding |
| Idempotency | Required for payments, orders, subscriptions |
| Transactions | Service-managed, repo does not use $transaction |

---

## 🔗 RELATED SKILLS
- ⬇️ [`telegram-bot-handlers`] – Directly uses structure layout to organize composers & handlers
- ⬇️ [`telegram-bot-database`] – Integrated into services and injected via middleware defined in structure
- 🔄 [`telegram-bot-async-patterns`] – Governs all async initialization & event loop execution in structure
- 🛡️ [`telegram-bot-error-handling`] – Attaches global error middleware during main entry point setup

---

## 📝 NOTES
- For large deployments, replace long polling with webhook configuration using Express or Fastify.
- For feature-based structure: each feature exports a composer from `features/<name>/index.ts`.
- For idempotency: store `update_id` or generate UUID per operation, use unique constraints.
- For background jobs: use `node-cron` for scheduled tasks, separate worker process for long-running jobs.
- For distributed bots: separate bot polling process from webhook endpoint and worker processes.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Node.js/TypeScript Edition