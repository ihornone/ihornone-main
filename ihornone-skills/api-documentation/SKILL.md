---
name: api-documentation
description: API documentation standards for HTTP APIs using OpenAPI 3.0/Swagger. Covers endpoint documentation, request/response schemas, authentication, error responses, rate limiting, pagination, filtering, versioning, webhooks, idempotency, code examples, and interactive documentation tools.
---

# 📌 API Documentation

## 🎯 GOAL
**One sentence:** Write complete, accurate, and maintainable API documentation that enables developers to integrate with your API efficiently — with a canonical contract, representative examples, and interactive reference when appropriate.

> Example:
> An OpenAPI specification documenting every API operation with parameters, request/response schemas, error codes, authentication, and code examples — rendered via an interactive documentation tool or published as a static reference.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **API platform conventions** — OpenAPI for REST, GraphQL schema for GraphQL, protobuf comments for gRPC.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Documentation standards, API design guidelines.
4. **This skill's defaults** — Below (focused on OpenAPI-based HTTP APIs).
5. **Personal preference** — Never override 1–4.

> **Scope note:** This skill is **HTTP/API-specific** — it focuses on documenting HTTP REST APIs using OpenAPI 3.0/Swagger. It is NOT a universal documentation skill. For non-HTTP APIs (CLI help text, library documentation, SDK reference), see `readme-template` instead.

---

## 💡 KEY PRINCIPLES
- **Documentation = Contract** — For OpenAPI-based HTTP APIs, the specification serves as the canonical API contract; keep it synchronized with code.
- **Every Operation Documented** — Every externally consumed API operation must have an explicit, discoverable contract with description, parameters, and responses.
- **Show, Don't Tell** — Include representative examples in languages and clients relevant to the API consumers.
- **Error Transparency** — Document all meaningful success and failure responses that the operation can actually produce.
- **One Source of Truth** — Use code-first or spec-first approach, but maintain a single canonical source with CI drift detection.

---

## 📁 DOCUMENTATION STRUCTURE

> **Recommended structure for OpenAPI-based HTTP APIs.** Adapt to the project's architecture and documentation tooling.

```
docs/
├── openapi.yaml            # OpenAPI 3.0 specification (canonical source)
├── swagger-ui/             # Interactive documentation (optional)
├── examples/               # Request/response examples
│   ├── create-user.json
│   ├── list-users.json
│   └── error-response.json
└── guides/                 # API usage guides (optional)
    ├── authentication.md
    ├── pagination.md
    └── webhooks.md
```

> **Alternative structures:**
> - Code-first: `src/openapi.ts` or annotations/decorators in source code
> - Spec-first: `api-spec/openapi.yaml` with code generation
> - Generated: `generated/openapi.json` from CI pipeline
> - API Gateway: documentation managed in gateway configuration

---

## 🔧 OPENAPI SPEC STRUCTURE

```yaml
openapi: 3.0.3
info:
  title: Project API
  version: 1.2.0
  description: |
    Brief description of what this API does.
    Base URL: https://api.example.com/v1
  contact:
    name: API Support
    email: support@example.com
    url: https://docs.example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging
  - url: http://localhost:3000/v1
    description: Development

security:
  - bearerAuth: []

paths:
  /users:
    get:
      summary: List users
      description: Returns a paginated list of users.
      tags: [Users]
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
          description: Page number
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
          description: Items per page
        - name: status
          in: query
          schema:
            type: string
            enum: [active, inactive]
          description: Filter by status
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
              example:
                data:
                  - id: "user_123"
                    name: "John Doe"
                    email: "john@example.com"
                    status: "active"
                    createdAt: "2026-01-15T10:30:00Z"
                meta:
                  page: 1
                  limit: 20
                  total: 150
        '401':
          $ref: '#/components/responses/Unauthorized'
        '429':
          $ref: '#/components/responses/RateLimited'

    post:
      summary: Create user
      description: Creates a new user account.
      tags: [Users]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            example:
              name: "Jane Doe"
              email: "jane@example.com"
              password: "securePassword123"
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'

  /users/{id}:
    get:
      summary: Get user by ID
      description: Returns a single user.
      tags: [Users]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
          description: User ID
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResponse'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          example: "user_123"
        name:
          type: string
          example: "John Doe"
        email:
          type: string
          format: email
          example: "john@example.com"
        status:
          type: string
          enum: [active, inactive]
          example: "active"
        createdAt:
          type: string
          format: date-time
          example: "2026-01-15T10:30:00Z"
      required: [id, name, email, status, createdAt]

    CreateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 2
          maxLength: 100
          example: "Jane Doe"
        email:
          type: string
          format: email
          example: "jane@example.com"
        password:
          type: string
          minLength: 8
          example: "securePassword123"
      required: [name, email, password]

    UserResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/User'

    UserListResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        meta:
          type: object
          properties:
            page:
              type: integer
            limit:
              type: integer
            total:
              type: integer

    ErrorResponse:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
              example: "VALIDATION_ERROR"
            message:
              type: string
              example: "Invalid input"
            details:
              type: object
              additionalProperties:
                type: array
                items:
                  type: string

  responses:
    BadRequest:
      description: Bad request
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error:
              code: "VALIDATION_ERROR"
              message: "Invalid input"
              details:
                email: ["Invalid email format"]
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error:
              code: "UNAUTHORIZED"
              message: "Invalid or missing token"
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error:
              code: "NOT_FOUND"
              message: "User not found"
    Conflict:
      description: Resource already exists
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error:
              code: "CONFLICT"
              message: "Email already registered"
    RateLimited:
      description: Rate limit exceeded
      headers:
        X-RateLimit-Limit:
          schema:
            type: integer
          description: Requests allowed per window
        X-RateLimit-Remaining:
          schema:
            type: integer
          description: Requests remaining
        Retry-After:
          schema:
            type: integer
          description: Seconds until next request allowed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
          example:
            error:
              code: "RATE_LIMITED"
              message: "Too many requests"
```

---

## 🔧 ERROR RESPONSE FORMAT

> **Document all meaningful success and failure responses that the operation can actually produce.** Not every endpoint returns 400, 401, 403, 404, 500.

| Status Code | Code | When | Example |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid input | Missing required field, invalid format |
| 401 | `UNAUTHORIZED` | No/invalid token | Expired JWT, missing API key |
| 403 | `FORBIDDEN` | No permission | Admin-only endpoint, insufficient scope |
| 404 | `NOT_FOUND` | Resource missing | User doesn't exist, endpoint not found |
| 409 | `CONFLICT` | Duplicate resource | Email already registered, version conflict |
| 422 | `UNPROCESSABLE_ENTITY` | Semantic validation error | Business rule violation |
| 429 | `RATE_LIMITED` | Too many requests | Rate limit exceeded (see rate limiting section) |
| 500 | `INTERNAL_ERROR` | Server failure | Database connection lost, unexpected error |
| 503 | `SERVICE_UNAVAILABLE` | Temporary unavailability | Maintenance, overload |

> **Error response format follows [`error-handling-standards`].** Use consistent error structure across all endpoints.

---

## 🔧 RATE LIMITING

> **Rate limits are endpoint-, identity-, resource-, and deployment-specific.** Document the actual rate limits for each endpoint or rate limit tier.

### Rate Limit Headers

```
X-RateLimit-Limit: 100           # Requests allowed per window (example)
X-RateLimit-Remaining: 85        # Requests remaining in current window
X-RateLimit-Reset: 1724784000    # Unix timestamp when window resets
Retry-After: 30                  # Seconds until next request allowed (on 429)
```

### Rate Limit Documentation

| Endpoint | Limit | Window | Notes |
|---|---|---|---|
| POST /auth/login | 5 | 1 minute | Brute force protection |
| POST /payments | 10 | 1 minute | Fraud prevention |
| GET /search | 100 | 1 minute | Resource-intensive |
| GET /health | unlimited | — | Health checks exempt |

> **See [`security-checklist`] for security-related rate limiting guidance.**

---

## 🔧 PAGINATION

> **Document the pagination strategy actually used by the API.** Common strategies include offset/limit, page/pageSize, cursor/limit, and before/after.

### Offset/limit Pagination (Example)

```json
// Request
GET /api/users?offset=20&limit=20

// Response
{
  "data": [...],
  "meta": {
    "offset": 20,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}
```

### Cursor-based Pagination (Recommended for large/changing datasets)

```json
// Request
GET /api/events?cursor=eyJpZCI6MTIzfQ&limit=20

// Response
{
  "data": [...],
  "meta": {
    "cursor": "eyJpZCI6MTIzfQ",
    "nextCursor": "eyJpZCI6MTQzfQ",
    "limit": 20,
    "hasMore": true
  }
}
```

> **Prefer cursor-based pagination when stable traversal of large or changing datasets is required.** Cursor pagination avoids issues with duplicate or missing items when data changes between requests.

---

## 🔧 CODE EXAMPLES

> **Provide representative examples in the languages and clients relevant to the API consumers.** Include curl as a universal baseline, then add SDK examples for primary consumer languages.

### cURL (Universal Baseline)

```bash
# List users
curl -X GET "https://api.example.com/v1/users?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create user
curl -X POST "https://api.example.com/v1/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Jane", "email": "jane@example.com", "password": "examplePassword123"}'
```

### JavaScript/TypeScript (fetch)

```typescript
// List users
const response = await fetch('https://api.example.com/v1/users?limit=10', {
  headers: { 'Authorization': `Bearer ${token}` },
});
const { data, meta } = await response.json();

// Create user
const response = await fetch('https://api.example.com/v1/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', password: 'examplePassword123' }),
});
const { data } = await response.json();
```

### Python (requests)

```python
import requests

# List users
response = requests.get(
    "https://api.example.com/v1/users",
    params={"limit": 10},
    headers={"Authorization": f"Bearer {token}"}
)
data = response.json()

# Create user
response = requests.post(
    "https://api.example.com/v1/users",
    json={"name": "Jane", "email": "jane@example.com", "password": "examplePassword123"},
    headers={"Authorization": f"Bearer {token}"}
)
user = response.json()
```

> **For other languages:** Use OpenAPI Generator to generate SDK examples, or provide manual examples for primary consumer languages (e.g., Go, Ruby, PHP, Dart/Flutter).

---

## ❌ ANTI-PATTERN (Wrong)

```yaml
# Missing: no schemas, no errors, no auth, no examples

paths:
  /users:
    get:
      responses:
        200:
          description: ok
    post:
      responses:
        200:
          description: ok
```

**Why this is bad:**
- No request body schema — caller doesn't know what to send.
- No error responses — caller doesn't know what can fail.
- No authentication documented — caller can't authenticate.
- No examples — caller has to guess the format.

---

## 🚨 COMMON MISTAKES
1. **Undocumented error responses** – Document all meaningful success and failure responses the operation can produce.
2. **No examples** – Every schema and endpoint should have representative examples.
3. **Outdated documentation** – Maintain one source of truth with CI drift detection.
4. **Missing `required` fields** – Mark required fields explicitly in schemas.
5. **Using real credentials in examples** – Use obviously fake credentials (e.g., `examplePassword123`, `YOUR_TOKEN`).
6. **Not documenting rate limits** – Consumers need to know limits and behavior when exceeded.
7. **Missing pagination documentation** – Document the pagination strategy and limits.
8. **Not documenting authentication scopes** – Specify required scopes/roles for each endpoint.

---

## ✔️ CHECKLIST (Before Publishing)

### Content
- [ ] All API operations documented with description, parameters, and responses
- [ ] Every endpoint has representative examples
- [ ] Parameters documented (type, required, description, example)
- [ ] Responses document all meaningful status codes (success + failure)
- [ ] Error responses follow consistent format (see [`error-handling-standards`])
- [ ] Authentication method documented (security schemes, scopes)
- [ ] Rate limiting documented with headers and limits
- [ ] Pagination strategy documented (if applicable)
- [ ] Filtering/sorting parameters documented (if applicable)

### Security & Privacy
- [ ] No real credentials, tokens, or sensitive data in examples
- [ ] Security schemes properly defined (bearer, API key, OAuth)
- [ ] Sensitive fields marked appropriately
- [ ] Authorization requirements documented per endpoint

### Quality
- [ ] OpenAPI spec is valid (no YAML/JSON errors)
- [ ] Interactive documentation accessible (if applicable)
- [ ] Documentation synchronized with code (CI drift detection)
- [ ] Versioning strategy documented (if applicable)
- [ ] Deprecation policy defined (if applicable)

### Code Examples
- [ ] curl examples for all endpoints
- [ ] Examples in primary consumer languages (e.g., JavaScript, Python, Go)
- [ ] Examples use fake credentials and realistic data

---

## 📚 CHEATSHEET

### OpenAPI Structure

| Section | Purpose | Example |
|---|---|---|
| `info` | API metadata | Title, version, description, contact |
| `servers` | Base URLs | Production, staging, dev |
| `securitySchemes` | Auth methods | Bearer, API key, OAuth2 |
| `paths` | API operations | `/users`, `/users/{id}` |
| `schemas` | Data models | `User`, `ErrorResponse` |
| `responses` | Reusable response defs | `401 Unauthorized` |
| `parameters` | Reusable params | `page`, `limit`, `id` |
| `security` | Default auth | `bearerAuth: []` |

### Common Patterns

| Pattern | OpenAPI Approach |
|---|---|
| Reusable error responses | `components/responses/` |
| Reusable schemas | `components/schemas/` |
| Request body examples | `requestBody.content.application/json.example` |
| Response examples | `responses.200.content.application/json.example` |
| Pagination params | Query parameters with schema + description |
| Rate limiting | Document in endpoint description + `429` response |
| Authentication | `securitySchemes` + `security` at path or global level |

### Tools

| Tool | Purpose |
|---|---|
| `swagger-ui-express` | Serve Swagger UI from Express |
| `fastapi` | Auto-generated OpenAPI + Swagger UI |
| `swagger-cli` | Validate and bundle OpenAPI specs |
| `OpenAPI Generator` | Generate client SDKs from spec |
| `Postman` / `Insomnia` | Import spec for testing collections |
| `Redoc` / `Scalar` | Alternative documentation renderers |

---

## 🔗 RELATED SKILLS
- ⬆️ [`readme-template`] – README references API documentation
- ⬆️ [`error-handling-standards`] – Error response format standards (defines error semantics this skill documents)
- ⬆️ [`security-checklist`] – Security requirements (defines auth/rate limits/security schemes this skill documents)
- ⬇️ [`git-workflow`] – API versioning and release process
- ⬇️ [`testing-patterns`] – API testing and contract validation

---

## 📝 NOTES
- **Source of truth:** Choose code-first (generate spec from code) or spec-first (generate code from spec), but maintain one canonical source with CI drift detection.
- **Interactive docs:** Use `swagger-ui-express` (Node.js), `fastapi` (Python), or standalone Swagger UI / ReDoc / Scalar for interactive documentation.
- **Validation:** Validate specs with `swagger-cli validate openapi.yaml` or CI pipeline.
- **Code generation:** Use OpenAPI Generator to generate client SDKs in multiple languages.
- **Testing:** Import the spec into Postman or Insomnia for automatic collections.
- **Webhooks:** Document webhook events, payloads, signature verification, retry policy, and idempotency in a separate section or spec extension.
- **Idempotency:** Document `Idempotency-Key` header support, scope, lifetime, and duplicate request behavior for mutation endpoints.
- **Versioning:** Version only when compatibility requires it. Prefer backward-compatible evolution. Document deprecation and removal policy.
- **Async operations:** Document `202 Accepted` responses with polling URL or callback mechanism for long-running operations.

---
**Last Updated:** 2026-08-27
**Version:** 2.1 (Senior Standard — Fixed)
