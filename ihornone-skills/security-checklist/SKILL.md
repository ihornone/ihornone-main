---
name: security-checklist
description: Universal security checklist for any project (TypeScript, Python, Go, Rust). Covers injection prevention, authentication, authorization, secrets management, input validation, dependency security, and secure defaults. For web-specific security (XSS, CSRF, CORS, headers), see web-security.
---

# 📌 Security Checklist

## 🎯 GOAL
**One sentence:** Protect applications from the most common vulnerabilities — injection, broken authentication, secrets exposure, and insecure defaults — with actionable rules and automated checks.

> Example:
> Every user input is validated, every database query uses parameterized statements, every password is hashed with a modern algorithm, and no secrets appear in code.

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
- **Never Trust User Input** – Every input is malicious until validated and sanitized.
- **Defense in Depth** – Multiple layers of protection; one bypass doesn't compromise the system.
- **Least Privilege** – Grant minimum necessary permissions to users, services, and processes.
- **Secrets Are Not Code** – Environment variables and vaults, never hardcoded strings.
- **Security by Default** – Secure defaults, opt-in for less secure options.

---

## 🔧 VULNERABILITY RULES

### SQL Injection

| Do | Don't |
|---|---|
| Use parameterized queries | Use string interpolation in SQL |
| Use ORM query builders | Concatenate user input into SQL |
| Validate input types | Trust runtime values |

```python
# CORRECT: Parameterized query
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))

# WRONG: SQL injection vulnerability
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")  # INJECTION!
```

### Command Injection

| Do | Don't |
|---|---|
| Use language-native APIs | Call `system()`, `exec()`, `eval()` |
| Validate and whitelist inputs | Pass user input to shell commands |
| Use `subprocess.run` with list args | Use `shell=True` with string |

```python
# CORRECT: Safe subprocess
import subprocess
subprocess.run(["ls", "-la", user_path], check=True)

# WRONG: Command injection
subprocess.run(f"ls -la {user_path}", shell=True)  # INJECTION!
```

### SSRF (Server-Side Request Forgery)

| Do | Don't |
|---|---|
| Validate and whitelist allowed URLs/hosts | Allow arbitrary server-side requests to user-supplied URLs |
| Block private IP ranges (169.254.169.254, 127.0.0.1, etc.) | Trust user-provided URLs |
| Use allowlists for external service calls | Follow redirects to internal services |
| Enforce protocol restrictions (https only) | Allow file://, gopher://, etc. |

```typescript
// CORRECT: Validate URL before fetching
import { URL } from 'url';

function isSafeUrl(inputUrl: string): boolean {
  const url = new URL(inputUrl);
  if (url.protocol !== 'https:') return false;
  // Block private IPs, localhost, cloud metadata endpoints
  const hostname = url.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
  if (hostname.startsWith('169.254.')) return false; // Cloud metadata
  if (hostname.endsWith('.internal')) return false;
  return true;
}

// WRONG: Direct user URL fetch
const response = await fetch(userProvidedUrl); // SSRF vulnerability!
```

### Path Traversal

| Do | Don't |
|---|---|
| Validate paths against whitelist | Use user-provided paths directly |
| Use `path.resolve()` and verify with `path.relative()` | Allow `../` in file paths |
| Serve files from designated directory | Serve from arbitrary locations |
| Generate server-side storage IDs | Use user-provided filenames for storage |

```typescript
// CORRECT: Path validation with path.relative()
import path from 'path';
const resolved = path.resolve(UPLOAD_DIR, userFilename);
const relativePath = path.relative(UPLOAD_DIR, resolved);
if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
  throw new Error('Invalid file path');
}

// BETTER: Generate server-side storage ID
const storageId = crypto.randomUUID();
const storagePath = path.join(UPLOAD_DIR, storageId);
```

### Unsafe Deserialization / Prototype Pollution

| Do | Don't |
|---|---|
| Validate deserialized data schema | Deserialize untrusted data without validation |
| Use safe parsing libraries | Use `eval()`, `Function()` on user input |
| Freeze objects to prevent prototype pollution | Merge user input into Object.prototype |

```typescript
// CORRECT: Safe object merge
import { merge } from 'lodash';
const safe = merge({}, defaults, sanitizeInput(userInput));

// WRONG: Prototype pollution
// userInput = { "__proto__": { "isAdmin": true } }
Object.assign(targetObject, userInput); // May pollute prototype
```

### Authentication & Authorization

| Rule | Implementation |
|---|---|
| Password hashing | Modern algorithm (Argon2id preferred, or bcrypt with environment-appropriate cost factor) |
| JWT tokens | Short-lived access tokens + rotating/revocable refresh tokens |
| Token expiry | Context-appropriate: access tokens minutes to hours, refresh tokens days to weeks |
| Session storage | Server-side (Redis) or secure cookie |
| OAuth | Use established providers (Google, GitHub) |
| Rate limiting | Context-appropriate limits per endpoint, identity, and threat model |
| MFA | TOTP (Google Authenticator) for sensitive accounts |
| Authorization | Server-side checks for every resource access; never rely on client-side role checks |
| IDOR/BOLA prevention | Validate resource ownership on every request; use indirect references |

> **Never rely only on client-side role checks.** Always verify authorization on the server for every resource access.

### Secrets Management

| Do | Don't |
|---|---|
| Local dev: `.env` (gitignored) | Hardcode in source code |
| Production: platform secret manager / vault | Commit to Git |
| Rotate secrets periodically | Use same secret forever |

> **If a secret was committed:** (1) Revoke/rotate the secret immediately, (2) Remove it from the repository, (3) Rewrite history only when necessary, (4) Verify the secret is no longer exposed in any branch or tag.

```bash
# .gitignore — ALWAYS include
.env
.env.local
.env.*.local
*.pem
*.key
credentials.json
```

---

## ✅ CODE EXAMPLE (Correct)

```typescript
// File: services/authService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Password hashing with modern algorithm
// Cost factor should be tuned to ~100ms per hash on target hardware
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Short-lived access token + rotating refresh token
export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId, type: 'access' }, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```python
# Problem: SQL injection, command injection, hardcoded secrets, no hashing

import os
import subprocess

API_KEY = "sk-1234567890abcdef"  # HARDCODED SECRET!

def get_user(user_id):
    # SQL INJECTION
    query = f"SELECT * FROM users WHERE id = '{user_id}'"
    cursor.execute(query)
    return cursor.fetchone()

def run_backup(path):
    # COMMAND INJECTION
    subprocess.run(f"tar -czf backup.tar.gz {path}", shell=True)

def login(username, password):
    # NO PASSWORD HASHING — stored in plaintext
    cursor.execute(f"SELECT * FROM users WHERE name='{username}' AND pass='{password}'")
    return cursor.fetchone()
```

---

## 🚨 COMMON MISTAKES
1. **Trusting client-side validation** – Always validate on the server.
2. **Hardcoded secrets** – Use `.env` (gitignored) for local dev, vault for production.
3. **No rate limiting on auth endpoints** – Brute force attacks trivial without it.
4. **Ignoring SSRF** – Never fetch user-controlled URLs without strict validation.
5. **Client-side authorization checks** – Always verify permissions on the server.
6. **Not rotating secrets after exposure** – Removing a committed secret from code does NOT make it safe.

---

## ✔️ SECURITY CHECKLIST

### During Development
- [ ] User input validated and sanitized
- [ ] SQL queries use parameterized statements
- [ ] No direct `system()`/`exec()` calls with user input
- [ ] No hardcoded secrets in code
- [ ] Passwords hashed with modern algorithm (Argon2id or bcrypt)
- [ ] No secrets committed to Git history

### Before Commit
- [ ] Path traversal prevention
- [ ] No hardcoded credentials anywhere
- [ ] `.gitignore` contains all secret files

### Before Merge
- [ ] Dependencies audited for vulnerabilities (`npm audit`, `pip audit`, `cargo audit`)
- [ ] Authorization checks on all resource access
- [ ] IDOR/BOLA prevention verified

### Before Production
- [ ] Secrets stored in platform secret manager / vault
- [ ] Rate limiting tested under load
- [ ] Dependency audit passed
- [ ] Security scan passed (SAST/DAST if available)

---

## 📚 CHEATSHEET
| Vulnerability | Attack | Prevention |
|---|---|---|
| SQL Injection | `'; DROP TABLE users;--` | Parameterized queries |
| Command Injection | `; rm -rf /` | No `shell=True`, whitelist |
| Path Traversal | `../../../etc/passwd` | `path.relative()`, server-side IDs |
| SSRF | `http://169.254.169.254/...` | URL validation, IP blocking, allowlists |
| Brute Force | 1000 password attempts | Rate limiting, account lockout, MFA |
| IDOR/BOLA | `/api/users/123` → `/api/users/124` | Server-side ownership checks |
| Prototype Pollution | `{"__proto__": {"isAdmin": true}}` | Safe merge, freeze objects |

---

## 🔗 RELATED SKILLS
- ⬆️ [`error-handling-standards`] – Never expose sensitive data in errors
- ⬆️ [`testing-patterns`] – Security testing patterns
- ⬇️ [`git-workflow`] – No secrets in commit history
- ⬇️ [`web-security`] – Web-specific: XSS, CSRF, CORS, security headers
- ⬇️ [`performance-optimization`] – Rate limiting and caching for DoS prevention

---

## 📝 NOTES
- Use `npm audit` / `pip audit` / `cargo audit` regularly to check for vulnerable dependencies.
- For production: enable WAF (Cloudflare, AWS WAF) for additional protection.
- For Docker: run containers as non-root, use read-only filesystems.
- **Secret rotation:** If a secret was committed, revoke/rotate it immediately. Removing the file does NOT make the secret safe — it remains in Git history.
- **Authorization:** Always verify resource ownership on the server. Never rely on client-side role checks.
- **Password hashing:** Use Argon2id (preferred) or bcrypt with cost factor tuned to ~100ms per hash on target hardware.
- **Web-specific security:** For XSS, CSRF, CORS, and security headers, see [`web-security`].

---

**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Universal Edition
