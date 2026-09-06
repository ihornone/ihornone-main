---
name: web-security
description: Web-specific security patterns for React, Next.js, Vue, Svelte, and other web applications. Covers XSS prevention, CSRF protection, security headers, CORS, content security policy, and browser-specific attack vectors. For universal security principles (injection, auth, secrets), see security-checklist.
---

# 📌 Web Security

## 🎯 GOAL
**One sentence:** Protect web applications from browser-specific vulnerabilities — XSS, CSRF, clickjacking, content injection, and cross-origin attacks — with defense-in-depth patterns for modern frameworks.

> Example:
> Every user input is sanitized before rendering, CSRF tokens protect state-changing requests, security headers are configured, and CORS restricts cross-origin access.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Security requirements** — Compliance, regulatory, and organizational security policies.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Security policies, threat models.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> **Critical rule:** When in doubt, choose the more secure option.

---

## 💡 KEY PRINCIPLES
- **Sanitize All Output** – Any user-controlled data rendered as HTML must be sanitized.
- **CSRF Protection for Cookie Auth** – State-changing requests with cookies require CSRF tokens.
- **Defense in Depth** – CSP headers + input sanitization + framework defaults.
- **CORS Is Not Authentication** – CORS restricts browser access; it does not authenticate or authorize.
- **Security Headers by Default** – Enable CSP, HSTS, X-Content-Type-Options, X-Frame-Options.

---

## 🔧 XSS (Cross-Site Scripting)

### Prevention Rules

| Do | Don't |
|---|---|
| Prefer safe text rendering (`<div>{userInput}</div>`) | `dangerouslySetInnerHTML={userInput}` |
| Use `textContent` not `innerHTML` | Render raw HTML from user |
| Validate input on server <!-- ПІДТВЕРДЖЕНО: 8/9 production-репозиторіїв (analysis-synthesis/security-consensus.md) --> | Trust client-side validation only |
| Use DOMPurify when HTML rendering is required | Skip sanitization for trusted HTML |

> **Primary rule:** Prefer safe text rendering by default. Use sanitized HTML only when rendering HTML is an explicit requirement.

```typescript
// CORRECT: Safe text rendering (primary approach)
return <div>{userInput}</div>;

// CORRECT: Sanitized HTML (when HTML rendering is required)
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(userInput);
return <div dangerouslySetInnerHTML={{ __html: clean }} />;
<!-- ПІДТВЕРДЖЕНО: 6/9 production-репозиторіїв не надають centralized HTML-sanitization (analysis-synthesis/security-consensus.md). DOMPurify — рішення на рівні застосунку, не фреймворка. -->

// WRONG: Direct injection
return <div dangerouslySetInnerHTML={{ __html: userInput }} />; // XSS vulnerability!
```

### Framework-Specific XSS Prevention

**React/Next.js:**
- JSX auto-escapes — `{userInput}` is safe by default.
- `dangerouslySetInnerHTML` bypasses escaping — sanitize with DOMPurify first.
- Avoid `javascript:` URLs in `href` attributes.

**Vue:**
- `{{ userInput }}` auto-escapes — safe by default.
- `v-html` bypasses escaping — sanitize before use.
- Avoid dynamic component injection with user input.

**Svelte:**
- `{userInput}` auto-escages — safe by default.
- `{@html userInput}` bypasses escaping — sanitize before use.

---

## 🔧 CSRF (Cross-Site Request Forgery)

### When CSRF Protection Is Required

| Auth Method | CSRF Risk | Protection |
|---|---|---|
| Cookies (session-based) | **High** | CSRF tokens required |
| `Authorization: Bearer` header | **Low** | CORS + origin validation |
| API key in header | **Low** | CORS + origin validation |

> **Context matters:** CSRF protection is required for cookie-based authentication. When using `Authorization: Bearer <token>` headers (not automatically sent by browsers), CSRF risk is different but other protections (CORS, origin validation) still apply.

### Implementation

```typescript
// CORRECT: CSRF token middleware (Express)
import csrf from 'csurf';
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// In forms:
// <input type="hidden" name="_csrf" value="{{csrfToken}}">

// CORRECT: SameSite cookies
app.use(session({
  cookie: {
    sameSite: 'strict', // or 'lax' for cross-site GET requests
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  }
}));
```

---

## 🔧 SECURITY HEADERS

<!-- ПІДТВЕРДЖЕНО: 2/9 production-репозиторіїв реалізують комплексні security headers (analysis-synthesis/security-consensus.md). Скіл відповідає консенсусу. -->
> **Note:** `X-XSS-Protection` is deprecated and should not be used. Modern browsers handle XSS prevention through Content-Security-Policy.

### Required Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Framework Implementation

**Next.js (next.config.ts):**
```typescript
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

**Express (helmet):**
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

## 🔧 CORS (Cross-Origin Resource Sharing)

> **CORS ≠ Authentication:** CORS is a browser access-control mechanism, not an authentication or authorization mechanism. Do not rely on CORS alone for security.

### Configuration

```typescript
// CORRECT: Restrictive CORS
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','), // Whitelist specific origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// WRONG: Open CORS
app.use(cors({ origin: '*' })); // Accepts requests from any origin
```

### Rules

| Do | Don't |
|---|---|
| Whitelist specific origins | Use `*` with credentials |
| Restrict allowed methods | Allow all HTTP methods |
| Restrict allowed headers | Allow all headers |
| Validate `Origin` header server-side | Trust browser-only CORS |

---

## 🔧 CONTENT SECURITY POLICY (CSP)

### Directives

| Directive | Purpose | Example |
|---|---|---|
| `default-src` | Fallback for all resource types | `'self'` |
| `script-src` | Allowed JavaScript sources | `'self'` |
| `style-src` | Allowed CSS sources | `'self' 'unsafe-inline'` |
| `img-src` | Allowed image sources | `'self' data: https:` |
| `connect-src` | Allowed API endpoints | `'self' https://api.example.com` |
| `font-src` | Allowed font sources | `'self'` |
| `frame-ancestors` | Who can embed this page | `'none'` |

### CSP Reporting

```
Content-Security-Policy-Report-Only: ...; report-uri /csp-report
```

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}));

// Rate limiting (context-appropriate per endpoint)
<!-- ЗМІНЕНО: rate limiting реалізується через middleware, а не є вбудованим у фреймворк (analysis-synthesis/security-consensus.md). express-rate-limit — це зовнішній middleware, а не вбудований механізм. -->
app.use('/api/auth', rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts. Please try again later.' },
}));
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No CSP, open CORS, no security headers, XSS vulnerability

// OPEN CORS — accepts any origin
app.use(cors({ origin: '*' }));

// NO SECURITY HEADERS — vulnerable to clickjacking, MIME sniffing
// NO CSP — allows inline scripts, third-party JS

// XSS VULNERABILITY — renders unsanitized user input
app.get('/search', (req, res) => {
  res.send(`<h1>Results for: ${req.query.q}</h1>`); // INJECTION!
});
```

---

## 🚨 COMMON MISTAKES
1. **Trusting client-side validation only** – Always validate on the server.
2. **Using `X-XSS-Protection` header** – Deprecated; use Content-Security-Policy instead.
3. **Open CORS with credentials** – `origin: '*'` with `credentials: true` is insecure.
4. **CSP with `unsafe-inline` for scripts** – Avoid inline scripts; use nonces or hashes.
5. **Missing security headers** – Use `helmet` (Node.js) or framework defaults.
6. **Relying on CORS for security** – CORS is not authentication; it's browser access control.
7. **Not validating Origin header server-side** – CORS is enforced by browsers, not servers.
<!-- ДОДАНО: 3/9 production-репозиторіїв мають explicit захист (analysis-synthesis/security-consensus.md). Захист від prototype pollution через secure-json-parse або hasOwnProperty перевірки при обробці JSON. -->
8. **Ignoring prototype pollution** – Validate JSON parsing options; use `hasOwnProperty` or `Object.hasOwn` when accessing untrusted object properties.

---

## 💡 BEST PRACTICES

<!-- ДОДАНО: analysis-synthesis/error-handling-consensus.md (8/9) -->
- **Error cause chaining** — Preserve the original error as `cause` when creating new errors (Node.js v16.9+ standard). This preserves full stack traces across abstraction layers.

<!-- ДОДАНО: analysis-synthesis/error-handling-consensus.md (6/9) -->
- **Differential logging for 4xx/5xx** — Do not log 4xx errors at `error` level; these are expected client rejections. Log 4xx at `info` level and 5xx at `error` level to reduce noise in error tracking systems.

<!-- ДОДАНО: analysis-synthesis/api-design-consensus.md (6/9) -->
- **Colocate validation schemas with routes** — Place Zod/class-validator schemas in the same file/module as the route or handler they protect. This reduces schema drift.

<!-- ЗМІНЕНО: framework-level idempotency is not built-in (analysis-synthesis/api-design-consensus.md, 6/9) -->
- **Idempotency is not built-in** — Framework-level idempotency keys or ETag/If-None-Match are not provided out of the box. Implement idempotency at the business-logic level for payment/booking workflows using custom resource IDs or domain-level uniqueness constraints.

<!-- ДОДАНО: analysis-synthesis/error-handling-consensus.md (6/9) -->
- **Mask PII and secrets in logs** — Redact sensitive fields before logging or sending to external services. Examples: `password`, `token`, `secret`, `apiKey`, `authorization`, `creditCard`, `ssn`, `privateKey`, `refreshToken`, `client_secret`, `encrypted_credentials`, `serviceAccountKey`.

---

## ✔️ SECURITY CHECKLIST

### Before Commit
- [ ] XSS prevention (safe text rendering by default)
- [ ] CSRF protection (for cookie-based auth)
- [ ] Security headers configured (CSP, X-Frame-Options, HSTS)
- [ ] CORS whitelist configured (specific origins, not `*`)
- [ ] No `unsafe-inline` in script-src CSP

### Before Production
- [ ] Production security headers verified
- [ ] CSP reporting configured
- [ ] HSTS enabled with long max-age
- [ ] Content-Security-Policy-Report-Only tested before enforcing

---

## 📚 CHEATSHEET
| Vulnerability | Attack | Prevention |
|---|---|---|
| XSS | `<script>alert('xss')</script>` | Safe text rendering, CSP, DOMPurify |
| CSRF | Forged form submission | CSRF tokens, SameSite cookies |
| Clickjacking | Invisible iframe overlay | X-Frame-Options: DENY |
| MIME Sniffing | Execute uploaded file as script | X-Content-Type-Options: nosniff |
| Mixed Content | HTTP resources on HTTPS page | Upgrade-Insecure-Requests |

---

## 🔗 RELATED SKILLS
- ⬆️ [`security-checklist`] – Universal security (injection, auth, secrets, encryption)
- ⬆️ [`web-project-structure`] – Security rules for web apps
- ⬇️ [`web-api-client`] – Auth token security, CORS in API layer
- ⬇️ [`web-components-patterns`] – XSS prevention in components

---

## 📝 NOTES
- **CSP is complex:** Start with `Content-Security-Policy-Report-Only` to identify violations before enforcing.
- **Framework defaults:** Next.js, Remix, and SvelteKit include security headers by default. Verify they're not overridden.
- **Third-party scripts:** Audit all third-party scripts; add their domains to CSP `script-src`.
- **Cookie security:** Always use `Secure`, `HttpOnly`, `SameSite` flags for session cookies.
<!-- ПІДТВЕРДЖЕНО: 4/9 production-репозиторіїв мають CORS вимкнений за замовчуванням (analysis-synthesis/security-consensus.md). CORS є opt-in у більшості фреймворків. -->
- **CORS is opt-in by default:** Most frameworks disable CORS by default; enable it explicitly with a restrictive whitelist.
<!-- ДОДАНО: 3/9 production-репозиторіїв мають explicit захист (analysis-synthesis/security-consensus.md). -->
- **Prototype pollution:** When processing untrusted JSON, validate parsing options and use `hasOwnProperty` or `Object.hasOwn` for property checks to prevent prototype pollution attacks.
<!-- ЗМІНЕНО: 7/9 production-репозиторіїв повертають raw JSON; envelope використовується вибірково (analysis-synthesis/api-design-consensus.md) -->
- **Response envelope:** Most production repositories return raw JSON objects for standard responses. Use an envelope wrapper (`ApiResponse<T>`) selectively for complex responses requiring pagination, metadata, or protocol unification.
<!-- ПІДТВЕРДЖЕНО: production practice across 9 repos -->
- **Validated by production practice:** Server-side input validation (8/9: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC), HTML sanitization via DOMPurify (6/9: Appwrite, Cal.com, Fastify, Medusa, Next-Auth, tRPC), security headers (2/9: Appwrite, Cal.com), PII masking in logs (6/9: Appwrite, Cal.com, Medusa, Next-Auth, Prisma, tRPC), error cause chaining (8/9), differential 4xx/5xx logging (6/9).

---

**Last Updated:** 2026-08-29
**Version:** 4.0 (Updated with analysis from 9 production repos: Appwrite, Cal.com, Drizzle, Fastify, Medusa, NestJS, Next-Auth, Prisma, tRPC, 2026-08-29)
