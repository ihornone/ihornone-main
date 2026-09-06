---
name: testing-patterns
description: Universal testing patterns for any project (TypeScript, Python, Go, Rust). Covers unit, integration, and E2E testing; test frameworks; mocking; coverage; AAA pattern; async tests; TDD; performance tests; and CI/CD integration. Framework-specific testing (React, Vue, Flutter) belongs in platform-specific skills.
---

# 📌 Testing Patterns

## 🎯 GOAL
**One sentence:** Write systematic, maintainable, and fast tests that verify meaningful behavior at the appropriate level — unit, integration, and E2E — with critical paths covered and automated execution in CI/CD.

> Example:
> Test meaningful behavior, business rules, boundaries, and failure modes at the appropriate level. Critical business flows have E2E tests. All run automatically in CI.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Language/framework conventions** — `pytest` in Python, `testing` in Go, `tokio::test` in Rust, `jest`/`vitest` in TypeScript.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Coverage thresholds, test structure, required test types.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> Example: If a project uses `pytest` with `unittest.mock`, do NOT switch to `mockito` just because this skill mentions multiple mocking libraries.

---

## 💡 KEY PRINCIPLES
- **Tests Are Code** – Same quality standards, naming conventions, and review process as production code.
- **AAA Pattern** – Every test follows Arrange → Act → Assert.
- **Independence** – Tests must not depend on each other or execution order.
- **Fast Feedback** – Unit tests run in milliseconds; E2E tests run in seconds; full suite in minutes.
- **Test Behavior, Not Implementation** – Assert on outputs and observable behavior, not internal calls or private state.

---

## 📁 TEST STRUCTURE

```
src/
├── services/
│   └── UserService.ts
│       └── UserService.test.ts    # Unit test (co-located)
tests/
├── unit/                          # Unit tests (mirrors src/)
├── integration/                   # Integration tests
│   ├── api/
│   └── database/
├── e2e/                           # End-to-end tests
│   └── checkout.spec.ts
└── fixtures/                      # Shared test data
    ├── users.json
    └── responses.json
```

> **Framework-specific:** For React/Vue components, co-locate `Component.test.tsx` next to `Component.tsx`. For Flutter, place tests in `test/` directory.

---

## 🔧 TEST PYRAMID

> Prefer a test pyramid with many fast unit tests, fewer integration tests, and a small number of high-value E2E tests. Exact proportions depend on architecture and risk.

```
        /\
       / E2E \         Few high-value tests
      /--------\
     /Integration\      Some tests
    /--------------\
   /    Unit Tests   \   Many fast tests
  /------------------\
```

| Layer | What | Speed | Typical Proportion |
|---|---|---|---|
| Unit | Individual functions/methods | Milliseconds | Many (heuristic: 70-80%) |
| Integration | Multiple modules together | Seconds | Some (heuristic: 15-25%) |
| E2E | Full user flows | Minutes | Few high-value (heuristic: 5-10%) |

> **Note:** These proportions are heuristics, not requirements. A small backend service may have more integration tests. Adjust based on architecture, risk, and maintenance cost.

---

## 🔧 BEST PRACTICES

1. **AAA Pattern** – Arrange (setup), Act (execute), Assert (verify). One blank line between each.

2. **Descriptive Names** – `describe` = feature, `it` = behavior. `it('should return error when email is invalid')`.

3. **One Behavior Per Test** – Each test verifies one behavior or scenario. Multiple assertions are acceptable when they verify the same behavior. Split into multiple tests if asserting different behaviors.

4. **Isolate External Dependencies in Unit Tests** – Unit tests isolate external dependencies (APIs, databases, file systems). Integration tests intentionally use real or production-like dependencies where integration behavior is being verified.

5. **Test Failure Paths** – Verify not only the happy path but also: validation failures, authorization failures, not found, timeouts, external service failures, concurrency/race conditions, and retry behavior where applicable.

---

## ✅ CODE EXAMPLE — TypeScript / Node.js (Jest)

```typescript
// File: services/UserService.test.ts
import { UserService } from './UserService';
import { UserRepository } from '../repositories/UserRepository';

jest.mock('../repositories/UserRepository');

describe('UserService', () => {
  let service: UserService;
  let mockRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;
    service = new UserService(mockRepo);
  });

  describe('getUserById', () => {
    it('returns user when found', async () => {
      // Arrange
      const user = { id: '1', name: 'John' };
      mockRepo.findById.mockResolvedValue(user);

      // Act
      const result = await service.getUserById('1');

      // Assert
      expect(result).toEqual(user);
      expect(mockRepo.findById).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundError when user does not exist', async () => {
      // Arrange
      mockRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getUserById('999')).rejects.toThrow('User not found');
    });

    it('throws ValidationError when id is invalid', async () => {
      // Arrange
      const invalidId = '';

      // Act & Assert
      await expect(service.getUserById(invalidId)).rejects.toThrow('Invalid user ID');
    });

    it('handles external service timeout', async () => {
      // Arrange
      mockRepo.findById.mockRejectedValue(new Error('Connection timeout'));

      // Act & Assert
      await expect(service.getUserById('1')).rejects.toThrow('Service unavailable');
    });
  });
});
```

---

## ✅ CODE EXAMPLE — Python (pytest)

```python
# File: tests/unit/test_user_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from services.user_service import UserService
from errors.app_error import NotFoundError

@pytest.fixture
def mock_repo():
    repo = AsyncMock()
    return repo

@pytest.fixture
def service(mock_repo):
    return UserService(repository=mock_repo)

class TestUserService:
    @pytest.mark.asyncio
    async def test_get_user_returns_user_when_found(self, service, mock_repo):
        # Arrange
        user = {"id": "1", "name": "John"}
        mock_repo.find_by_id.return_value = user

        # Act
        result = await service.get_user_by_id("1")

        # Assert
        assert result == user
        mock_repo.find_by_id.assert_called_once_with("1")

    @pytest.mark.asyncio
    async def test_get_user_raises_when_not_found(self, service, mock_repo):
        # Arrange
        mock_repo.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(NotFoundError):
            await service.get_user_by_id("999")
```

---

## ✅ CODE EXAMPLE — Go

```go
// File: services/user_service_test.go
package services

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

type MockUserRepository struct {
    mock.Mock
}

func (m *MockUserRepository) FindByID(id string) (*User, error) {
    args := m.Called(id)
    return args.Get(0).(*User), args.Error(1)
}

func TestGetUserById_ReturnsUserWhenFound(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    service := NewUserService(mockRepo)
    user := &User{ID: "1", Name: "John"}
    mockRepo.On("FindByID", "1").Return(user, nil)

    // Act
    result, err := service.GetUserById("1")

    // Assert
    assert.NoError(t, err)
    assert.Equal(t, user, result)
    mockRepo.AssertExpectations(t)
}

func TestGetUserById_ReturnsErrorWhenNotFound(t *testing.T) {
    // Arrange
    mockRepo := new(MockUserRepository)
    service := NewUserService(mockRepo)
    mockRepo.On("FindByID", "999").Return(nil, ErrNotFound)

    // Act
    result, err := service.GetUserById("999")

    // Assert
    assert.Nil(t, result)
    assert.ErrorIs(t, err, ErrNotFound)
}
```

---

## ❌ ANTI-PATTERN (Wrong)

```typescript
// Problem: No AAA, unclear name, multiple assertions, testing implementation details

it('works', () => {
  const user = new UserService();
  const result = user.getUser(1);
  expect(result.id).toBe(1);
  expect(result.name).toBe('John');
  expect(result.email).toBe('john@example.com');
  expect(result.createdAt).toBeDefined();
  expect(user.repository.findById).toHaveBeenCalled();  // Testing implementation
});
```

**Why this is bad:**
- `'works'` — meaningless test name.
- Multiple assertions — unclear which behavior failed.
- Testing implementation (`toHaveBeenCalledWith`) — breaks when refactoring.

---

## 🚨 COMMON MISTAKES
1. **Tests that depend on each other** – Each test must be independent and runnable in isolation.
2. **Testing implementation, not behavior** – Assert on outputs, not internal calls.
3. **Slow tests in CI** – Unit tests < 100ms each; mock external dependencies in unit tests.
4. **No cleanup** – Reset mocks, clear state between tests.
5. **Only testing happy paths** – Failure paths, edge cases, and error handling are often more important than success cases.
6. **Ignoring test flakiness** – Flaky tests erode trust. Fix or quarantine immediately.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Priority respected: language > existing project > project rules > this skill
- [ ] Critical business logic has unit tests
- [ ] Main integration flows have tests
- [ ] Critical user flows have E2E tests (authentication, payments, permissions, major navigation)
- [ ] Failure paths are tested (validation, authorization, not found, timeout, external service failure)
- [ ] Test names are descriptive (`should X when Y`)
- [ ] Tests are independent (no shared state)
- [ ] Mocks are properly configured (unit tests isolate dependencies)
- [ ] Async tests are properly awaited
- [ ] CI/CD runs tests automatically
- [ ] Tests run fast (< 30s for unit, < 5min for full suite)
- [ ] Coverage meets project requirements (if defined)

---

## 📚 CHEATSHEET
| Pattern | Example |
|---|---|
| AAA | Arrange → Act → Assert |
| describe/it | `describe('UserService', () => { it('should ...') })` |
| Mock | `jest.fn()`, `AsyncMock()`, `@patch` |
| Fixture | `beforeEach(() => { jest.clearAllMocks() })` |
| Async test | `it('should ...', async () => { await ... })` |
| Snapshot | `expect(component).toMatchSnapshot()` — use selectively for stable serialized output |
| Coverage | `jest --coverage`, `pytest --cov`, `go test -cover` |
| Property-based | `fast-check` (TS), `hypothesis` (Python) — generate inputs from properties |
| Contract | `pact` — verify API contracts between services |

### E2E Test Selection (High-Value Flows)

| Flow Type | E2E Test? | Why |
|---|---|---|
| Authentication (login, logout, session) | ✅ Yes | Critical business flow |
| Payments / transactions | ✅ Yes | Money at risk |
| Permissions / access control | ✅ Yes | Security boundary |
| Major navigation / user journeys | ✅ Yes | Core UX |
| Individual form fields | ❌ No | Better as unit/integration |
| Internal service calls | ❌ No | Integration test level |

---

## 🔗 RELATED SKILLS
- ⬆️ [`git-workflow`] – CI/CD runs tests before merge
- ⬆️ [`code-structure-verification`] – Test file organization
- ⬇️ [`security-checklist`] – Security testing patterns
- ⬇️ [`performance-optimization`] – Performance testing and benchmarking

---

## 📝 NOTES
- For TypeScript/JavaScript: use `jest` or `vitest`.
- For Python: use `pytest` with `pytest-asyncio` for async tests.
- For Go: use built-in `testing` package with `testify` for assertions.
- For Rust: use `#[tokio::test]` for async tests, `cargo test` for running.
- For E2E: use `Playwright` (preferred) or `Cypress`.
- **Property-based testing:** Use `fast-check` (TypeScript) or `hypothesis` (Python) to generate inputs from properties. Useful for testing invariants, edge cases, and boundary conditions.
- **Contract testing:** Use `pact` to verify API contracts between services. Especially useful for microservices and backend-to-backend integrations.
- **Mutation testing:** Optional. Use `stryker` (JS) or `cosmic-ray` (Python) to verify test effectiveness by introducing small bugs.
- **Framework-specific testing:** For React components, see `web-components-patterns`. For Flutter widgets, see mobile-specific testing patterns.

---

**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Universal Edition
