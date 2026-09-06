---
name: telegram-bot-handlers
description: Production-grade handler implementation patterns for Telegram bots using grammY in Node.js/TypeScript. Enforces type-safe callback payloads, structured session workflows, service-layer delegation via dependency injection, explicit callback resolution, and contextual logging with structured metadata.
---

# 📌 Telegram Bot Handlers

## 🎯 GOAL
**One sentence:** Implement thin, type-safe event handlers that validate Telegram protocol inputs, delegate to services via DI, and render outputs — never containing business logic or domain state mutations. Managing Telegram session conversation state is allowed.

> Example:
> Each handler function is a small, testable adapter between the Telegram protocol layer and the application's domain services.

---

## 💡 KEY PRINCIPLES
- **Handlers Are Adapters, Not Logic Containers** – Parse Telegram input, validate protocol constraints, call a service method, render output. Nothing else. Managing Telegram session conversation state is allowed.
- **Type-Safe Callback Payloads** – Use typed payload parsing functions; never split raw strings.
- **Callback Acknowledgement** – Every callback handler must acknowledge the callback exactly once on all execution paths, normally as early as practical.
- **DI Over Globals** – Access services, repositories, and configuration via handler context injected by middlewares, not module-level imports.
- **Authorization in Handlers** – Verify that the current Telegram user has permission to act on the requested resource before calling the service.

---

## 📁 HANDLER COMPONENT MAP

```
handlers/
├── index.ts              # Root composer aggregation
├── start.ts              # /start, /help, onboarding
├── menu.ts               # Main navigation callbacks
├── profile.ts            # User profile CRUD flows
└── media.ts              # Photo, document, sticker handlers
```

---

## 🔧 BEST PRACTICES

1. **Define a Callback Payload Schema Per Feature Domain**
   - One interface/type per feature (e.g., `ProfileCallback`, `SettingsCallback`), with explicit payload structure.

2. **Use Session State Types, Not Raw Strings**
   - Define session interfaces in a dedicated `session.ts` module. Never use string literals like `state.set("waiting_name")`.

3. **Log Structured, Non-Sensitive Context**
   - Log `user_id`, `handler_name`, and normalized event metadata at `INFO` level on handler entry.
   - **Never log secrets, tokens, or unnecessary user-provided content** (email, phone, sensitive callback parameters).

4. **Validate Protocol, Not Business Rules**
   - **Handler validates:** `message.text` exists, callback payload is valid, Telegram user exists.
   - **Service validates:** business rules (`user cannot change name after verification`, `subscription required`, `user owns this resource`).

5. **Construct Keyboards Outside Handlers**
   - Build `InlineKeyboard` in a dedicated `keyboards.ts` module.
   - Handler calls `const keyboard = profileKeyboard(userId)`, not inline construction.

6. **Fail Fast With Domain Exceptions**
   - Throw domain error classes from services; the global error handler catches and formats them.
   - Handlers should NOT catch unexpected exceptions — propagate to global error handler.
   - Catch domain errors ONLY when handler needs to render a specific user-facing response.

---

## 🔄 CALLBACK LIFECYCLE

Every callback follows this lifecycle:

```
CallbackQuery received
    ↓
await ctx.answer()        ← acknowledge FIRST (prevents spinner hang)
    ↓
Resolve Callback Payload  ← typed extraction, never string parsing
    ↓
Authorization check       ← current user owns the resource?
    ↓
Call service              ← business logic
    ↓
Edit message / Send reply ← update UI
```

### Authorization
`PaymentCallback(user_id=123)` does NOT mean the current Telegram user can act on `user_id=123`.

```typescript
composer.callbackQuery(/^profile:edit_name/, async (ctx: Context) => {
  const data = unpackProfileCallback(ctx.callbackQuery.data);

  // Authorization: current user must match callback target
  if (ctx.from.id !== data.user_id) {
    await ctx.answer("Access denied", { show_alert: true });
    return;
  }

  await ctx.answer();
  await ctx.session.step = "waiting_first_name";
  await ctx.reply("Enter your new name:");
});
```

---

## 🔒 IDEMPOTENCY FOR CALLBACKS

Telegram may redeliver callbacks in failure scenarios. For destructive or financial operations, handle duplicates:

**Operations requiring idempotency:**
- `buy`, `pay`, `subscribe`, `confirm`, `delete`

**Pattern:**
```typescript
composer.callbackQuery(/^payment:buy/, async (ctx: Context) => {
  const data = unpackPaymentCallback(ctx.callbackQuery.data);
  await ctx.answer("Processing...");

  // Check idempotency
  const prisma = ctx.prisma;
  const existing = await prisma.processedCallback.findUnique({
    where: { callbackId: ctx.callbackQuery.id },
  });

  if (existing) {
    await ctx.editMessageText("Already processed");
    return;
  }

  // Process payment in transaction
  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        userId: ctx.from.id,
        productId: data.product_id,
      },
    });
    await tx.processedCallback.create({
      data: {
        callbackId: ctx.callbackQuery.id,
      },
    });
  });

  await ctx.editMessageText("Payment successful!");
});
```

**Database:**
- Store `callback.id` or generate idempotency key.
- Use unique constraints to prevent duplicates.
- Wrap in transaction.

---

## 💬 MESSAGE EDITING VS SENDING

| Method | When to Use |
|---|---|
| `ctx.reply(text)` | New message in chat |
| `ctx.editMessageText(text)` | Update existing message (same chat) |
| `ctx.editMessageReplyMarkup(kb)` | Update only keyboard (no text change) |
| `ctx.answer(text, options)` | Acknowledge callback (shows alert if `show_alert: true`) |

**Rules:**
- Use `editMessageText` for inline keyboard interactions (avoids chat spam).
- Use `answer` for simple acknowledgements.
- Use `answer("...", { show_alert: true })` for errors that user must see.
- Do NOT `editMessageText` after `answer` with `show_alert: true` — Telegram may reject.

---

## ⌨️ KEYBOARD CONSTRUCTION

**Never build keyboards inline in handlers.** Co-locate in `keyboards.ts`:

```typescript
// File: features/profile/keyboards.ts
import { InlineKeyboard } from "grammy";
import { packProfileCallback } from "./callbacks";

export function profileKeyboard(userId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text(
    "Edit Name",
    packProfileCallback({ action: "edit_name", user_id: userId })
  );
  keyboard.text(
    "Delete Account",
    packProfileCallback({ action: "delete", user_id: userId })
  );
  return keyboard;
}
```

**Handler uses it:**
```typescript
// File: features/profile/handlers.ts
import { profileKeyboard } from "./keyboards";

composer.command("profile", async (ctx: Context) => {
  const userId = ctx.from.id;
  const profile = await ctx.userService.getProfile(userId);
  const kb = profileKeyboard(userId);

  await ctx.reply(
    `👤 <b>${profile.first_name}</b>\n@${profile.username || "N/A"}`,
    { reply_markup: kb }
  );
});
```

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: features/profile/session.ts
export interface ProfileSession {
  step?: "waiting_first_name" | "waiting_bio";
}

// File: features/profile/callbacks.ts
export interface ProfileCallback {
  action: string;
  user_id: number;
}

export function packProfileCallback(data: ProfileCallback): string {
  return `profile:${JSON.stringify(data)}`;
}

export function unpackProfileCallback(payload: string): ProfileCallback {
  const parts = payload.split(":");
  if (parts[0] !== "profile") throw new Error("Invalid callback prefix");
  return JSON.parse(parts.slice(1).join(":"));
}

// File: features/profile/keyboards.ts
import { InlineKeyboard } from "grammy";
import { packProfileCallback } from "./callbacks";

export function profileKeyboard(userId: number): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  keyboard.text(
    "Edit Name",
    packProfileCallback({ action: "edit_name", user_id: userId })
  );
  return keyboard;
}

// File: features/profile/handlers.ts
import { Composer, Context } from "grammy";
import { unpackProfileCallback } from "./callbacks";
import { profileKeyboard } from "./keyboards";

const composer = new Composer();

composer.command("profile", async (ctx: Context) => {
  const userId = ctx.from.id;
  const profile = await ctx.userService.getProfile(userId);
  const kb = profileKeyboard(userId);

  await ctx.reply(
    `👤 <b>${profile.first_name}</b>\n@${profile.username || "N/A"}`,
    { reply_markup: kb }
  );
});

composer.callbackQuery(/^profile:edit_name/, async (ctx: Context) => {
  const data = unpackProfileCallback(ctx.callbackQuery.data);

  // Authorization: current user must match callback target
  if (ctx.from.id !== data.user_id) {
    await ctx.answer("Access denied", { show_alert: true });
    return;
  }

  await ctx.answer();
  ctx.session.step = "waiting_first_name";
  await ctx.reply("Enter your new name:");
});

composer.on("message:text", async (ctx: Context) => {
  if (ctx.session.step !== "waiting_first_name") return;

  const firstName = ctx.message.text.trim();

  // Protocol validation (handler responsibility)
  if (firstName.length < 2 || firstName.length > 64) {
    await ctx.reply("Name must be 2-64 characters. Try again:");
    return;
  }

  // Business validation happens in service
  await ctx.userService.updateFirstName(ctx.from.id, firstName);
  ctx.session.step = undefined;
  await ctx.reply(`✅ Name updated to <b>${firstName}</b>`);
});

export const profileComposer = composer;
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: Handler contains DB logic, raw callback parsing, no callback.answer(), SQL injection

bot.on("callback_query", async (ctx) => {
  // 1. Missing ctx.answer() — spinner stays forever
  // 2. Raw string parsing — breaks on any format change
  const [_, userIdStr, newName] = ctx.callbackQuery.data.split(":");

  // 3. Direct database mutation inside handler
  await ctx.prisma.$executeRawUnsafe(
    `UPDATE users SET name = '${newName}' WHERE id = ${userIdStr}`
  );

  // 4. No logging, no error handling, no session management
  await ctx.reply("Done!");
});
```

**Why this is bad:**
- Missing `answer()` freezes the client UI.
- Raw string splitting is brittle and unmaintainable.
- SQL injection vulnerability.
- No state management for multi-step flows.
- Database logic inside handler violates separation of concerns.

---

## 🚨 COMMON MISTAKES
1. **Forgetting `ctx.answer()` on some execution paths** – Acknowledge exactly once on ALL paths (success, error, access denied).
2. **Catch-all `try/catch` in handlers** – Let the global error handler deal with unexpected failures. Catch domain errors only when rendering a specific user-facing response.
3. **Leaking session state** – Always clear session step after completing a form or in `finally` blocks.
4. **Building keyboards inline in handlers** – Construct keyboards in `keyboards.ts`, import and use in handlers.
5. **Skipping authorization checks** – `callback_data.user_id` does not mean current user owns that resource.
6. **Logging sensitive callback payload data** – Never log tokens, emails, phones, or sensitive parameters.
7. **Using `editMessageText` after `answer({ show_alert: true })`** – Telegram may reject. Use one or the other.
8. **Ignoring callback idempotency** – For buy/pay/subscribe/delete, handle duplicate callbacks gracefully.
9. **Validating business rules in handlers** – Handler validates protocol; service validates business rules.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Every callback handler acknowledges the callback exactly once on all execution paths.
- [ ] All callback data uses typed payload parsing, not raw strings.
- [ ] Keyboards are constructed in `keyboards.ts`, not inline in handlers.
- [ ] Authorization check verifies current user owns the resource before calling service.
- [ ] Handlers contain zero business logic — only protocol validation, service calls, and rendering.
- [ ] Session states are defined in a dedicated `session.ts`, not as string literals.
- [ ] Structured logs include `user_id` and `handler_name`, but NO sensitive payload data.
- [ ] Idempotency handled for buy/pay/subscribe/confirm/delete callbacks.
- [ ] No `editMessageText` after `answer({ show_alert: true })`.

---

## 📚 CHEATSHEET
| Pattern | Example |
|---|---|
| Typed callback | `packProfileCallback({ action: "edit", user_id: 123 })` |
| Session state | `ctx.session.step = "waiting_name"` |
| DI service access | `ctx.userService.getProfile(userId)` |
| Callback acknowledgement | `await ctx.answer()` exactly once on all paths |
| Authorization check | `if (ctx.from.id !== data.user_id) deny` |
| Keyboard construction | `const kb = profileKeyboard(userId)` from `keyboards.ts` |
| Message editing | `ctx.editMessageText(...)` for inline interactions |
| Alert answer | `ctx.answer("Error", { show_alert: true })` |
| Idempotency | Store `callbackQuery.id`, unique constraint, transaction |

**Callback lifecycle:**
```
CallbackQuery → answer() → resolve payload → authorization → service → editMessage
```

**Validation boundaries:**
| Layer | Validates |
|---|---|
| Handler | Protocol: text exists, payload valid, user exists |
| Service | Business: ownership, permissions, state transitions |

---

## 🔗 RELATED SKILLS
- ⬆️ [`telegram-bot-structure`] – Provides the folder structure and composer setup used by handlers
- ⬇️ [`telegram-bot-database`] – Handlers call services/repositories to query and mutate data
- 🔄 [`telegram-bot-async-patterns`] – Ensures handler execution remains non-blocking
- 🛡️ [`telegram-bot-error-handling`] – Catches exceptions thrown inside handler functions

---

## 📝 NOTES
- Register specific handlers before catch-all handlers on the same composer (order matters).
- Keep handler signatures consistent: `(ctx: Context)` for testability.
- For feature-based structure: co-locate `handlers.ts`, `keyboards.ts`, `callbacks.ts`, `session.ts` in `features/<name>/`.
- Use `ctx.from.id` for authorization checks.
- For idempotency: store `callbackQuery.id` with unique constraint in transaction.

---
**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Node.js/TypeScript Edition