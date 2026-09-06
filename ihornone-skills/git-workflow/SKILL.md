---
name: git-workflow
description: Universal Git workflow standards covering branch naming, conventional commits, PR process, code review, .gitignore, staging, squash, rebase vs merge, semantic versioning, and release process.
---

# 📌 Git Workflow

## 🎯 GOAL
**One sentence:** Enforce a consistent, clean Git workflow across all projects — from branch creation to merge, with conventional commits and proper review process.

> Example:
> Every feature lives in `feature/description`, every commit follows `feat: add user login`, every PR has description and passes review before merge.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Repository branch strategy** — What the repository already uses (trunk-based, GitHub Flow, Git Flow).
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Branch protection, commit conventions, merge strategies.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> **Critical rule:** Never introduce a new branching model into an existing repository without explicit instruction.

---

## 💡 KEY PRINCIPLES
- **One Branch = One Logical Change** – A branch may contain a fix, regression test, and documentation update if they form one logical change. Never mix unrelated changes.
- **Conventional Commits** – When the repository uses Conventional Commits, every commit message follows `type(scope): description`.
- **Clean History** – Squash trivial commits before merge; rebase for linear history when appropriate.
- **No Secrets in History** – Never commit `.env`, credentials, or API keys. If a secret was committed, revoke it immediately.
- **Working Tree Safety** – Never discard uncommitted user changes without explicit permission.

---

## 📁 BRANCH STRUCTURE

> Follow the repository's existing branch strategy. Common strategies:

### Trunk-Based Development
```
main (production, always deployable)
├── feature/user-authentication (short-lived)
├── fix/login-error (short-lived)
└── hotfix/critical-security-patch (short-lived)
```

### GitHub Flow
```
main (production)
├── feature/user-authentication
├── fix/login-error
└── hotfix/critical-security-patch
```

### Git Flow
```
main (production)
└── develop (integration)
    ├── feature/user-authentication
    ├── bugfix/login-error
    └── hotfix/critical-security-patch
```

> **Default when no strategy is defined:** Use GitHub Flow (main + short-lived feature branches).

---

## 🔧 BRANCH NAMING

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/[short-description]` | `feature/user-authentication` |
| Bugfix | `bugfix/[short-description]` | `bugfix/login-error` |
| Hotfix | `hotfix/[short-description]` | `hotfix/critical-security-patch` |
| Release | `release/[version]` | `release/v1.2.0` |
| Chore | `chore/[short-description]` | `chore/update-dependencies` |

Rules:
- Use `kebab-case` (lowercase, hyphens)
- Keep descriptive but concise (2-4 words)
- Include issue number: `feature/123-user-auth`

---

## 🔧 COMMIT MESSAGES (Conventional Commits)

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | When to Use | Example |
|---|---|---|
| `feat` | New feature | `feat(auth): add Google OAuth login` |
| `fix` | Bug fix | `fix(api): handle null response from payment gateway` |
| `docs` | Documentation only | `docs(readme): update installation steps` |
| `style` | Formatting, no logic change | `style(components): fix indentation` |
| `refactor` | Code restructuring, no feature/fix | `refactor(services): extract auth logic` |
| `test` | Adding/updating tests | `test(auth): add login validation tests` |
| `chore` | Build, CI, dependencies | `chore(deps): update axios to 1.6.0` |
| `perf` | Performance improvement | `perf(queries): add index to users table` |
| `ci` | CI/CD changes | `ci(github): add test workflow` |

### Rules
- Description: imperative mood, lowercase, no period, preferably within 72 characters
- Body: what and why, not how (optional)
- Footer: breaking changes, issue references

### Examples

```bash
feat(auth): add JWT token refresh mechanism

Implement automatic token refresh when access token expires.
Uses refresh token stored in httpOnly cookie.

Closes #123

---

fix(api): prevent race condition in concurrent writes

Add mutex lock to prevent simultaneous database updates
for the same user record.

Fixes #456

---

feat!: change API response format

BREAKING CHANGE: All API responses now use { data, error } format
instead of flat response objects.
```

---

## 🔧 PULL REQUEST PROCESS

### PR Title

> When the repository uses Conventional Commit PR titles:

```
type(scope): short description
```

### PR Description Template

```markdown
## What
Brief description of changes.

## Why
Reason for the change.

## How
Implementation approach.

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if UI changes)
Before: 
After:

## Related Issues
Closes #123
```

### Code Review Checklist

- [ ] Code follows naming conventions
- [ ] No hardcoded values (magic numbers, URLs)
- [ ] Error handling is present
- [ ] Tests cover new logic
- [ ] No security vulnerabilities
- [ ] No performance regressions
- [ ] Documentation updated if needed
- [ ] No secrets or credentials in code

### Merge Rules
- ✅ All CI checks pass
- ✅ At least 1 approval from code owner
- ✅ No unresolved conversations
- ✅ Branch is up to date with target

---

## 🔧 REBASE vs MERGE

> Prefer squash merge for short-lived feature branches when the repository uses a linear/squashed history. Use merge commits when preserving branch topology or release/hotfix history is important. Rebase local/private branches when useful for synchronization. Never rewrite history of shared branches.

| Situation | Prefer | Why |
|---|---|---|
| Feature branch → main/develop | **Squash merge** | Clean history, one commit per feature |
| Hotfix → main | **Merge commit** | Preserve hotfix traceability |
| Sync feature with target | **Rebase** | Linear history, no merge commits |
| Long-lived branch | **Merge** | Preserve branch context |

```bash
# Rebase feature onto latest target
git checkout feature/user-auth
git rebase main

# Squash merge into target
git checkout main
git merge --squash feature/user-auth
git commit -m "feat(auth): add user authentication"

# Clean up
git branch -d feature/user-auth
```

### Force Push Safety

> Use `git push --force-with-lease` instead of `git push --force` for your own feature branches after rebase, if repository policy allows it. `--force-with-lease` is safer because it fails if someone else has pushed to the branch.

```bash
# ✅ Safe: only overwrites your own commits
git push --force-with-lease origin feature/user-auth

# ❌ Dangerous: overwrites everything
git push --force origin feature/user-auth
```

---

## 🔧 SEMANTIC VERSIONING

Format: `MAJOR.MINOR.PATCH` (e.g., `v1.2.3`)

| Version | When | Example |
|---|---|---|
| MAJOR | Breaking changes | `v1.0.0` → `v2.0.0` |
| MINOR | New features (backward compatible) | `v1.0.0` → `v1.1.0` |
| PATCH | Bug fixes (backward compatible) | `v1.1.0` → `v1.1.1` |

```bash
# Tag a release
git tag -a v1.2.0 -m "Release v1.2.0: add payment integration"
git push origin v1.2.0
```

---

## ❌ ANTI-PATTERN (Wrong)

```bash
# BAD: Meaningless commit messages
git commit -m "fixed stuff"
git commit -m "update"
git commit -m "asdf"
git commit -m "WIP"

# BAD: Huge PR with 50+ files
git commit -m "everything"

# BAD: Direct commits to main
git checkout main
git add .
git commit -m "new feature"  # NO REVIEW, NO TESTS

# BAD: Secrets in history
git add .env
git commit -m "add config"  # API keys now in Git history forever
```

---

## 🚨 COMMON MISTAKES
1. **Vague commit messages** – Always describe WHAT changed and WHY.
2. **Mixed concerns in one PR** – One PR = one logical change.
3. **Force pushing to shared branches** – Never rewrite protected/shared branches. Use `--force-with-lease` for your own feature branches only.
4. **Committing `.env`** – Add `.env` to `.gitignore` BEFORE first commit. If a secret was committed: revoke/rotate it immediately, remove from repository, and rewrite history only when necessary.
5. **Discarding uncommitted changes** – Never run `git reset --hard`, `git clean -fd`, or `git checkout -- .` without checking working tree state and getting explicit permission.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] Priority respected: repository strategy > existing project > project rules > this skill
- [ ] Branch named correctly (`feature/`, `fix/`, etc.)
- [ ] `git status` reviewed — only intended files are staged
- [ ] `git diff` reviewed — changes are correct and complete
- [ ] Commit message follows conventional format (when repository uses it)
- [ ] No secrets, credentials, or `.env` in staged files
- [ ] One logical change per commit
- [ ] Code passes linting and tests
- [ ] PR has description with What/Why/How
- [ ] PR has linked issue
- [ ] Code review completed
- [ ] .gitignore contains all exclusions

---

## 📚 CHEATSHEET
| Command | Purpose |
|---|---|
| `git status` | Review working tree state |
| `git diff` | Review staged/unstaged changes |
| `git add -p` | Stage specific hunks (interactive) |
| `git checkout -b feature/name` | Create and switch to new branch |
| `git commit -m "feat(scope): desc"` | Conventional commit |
| `git rebase main` | Sync with latest target |
| `git merge --squash feature/name` | Squash merge into target |
| `git log --oneline --graph` | Visualize branch history |
| `git tag -a v1.0.0 -m "Release"` | Tag a release |
| `git push --force-with-lease` | Safe force push (your branch only) |
| `git stash` / `git stash pop` | Temporarily save/unsave changes |

---

## 🔗 RELATED SKILLS
- ⬆️ [`code-structure-verification`] – `.gitignore` validation and orphan detection
- ⬇️ [`testing-patterns`] – CI/CD test execution before merge
- ⬇️ [`security-checklist`] – No secrets in commit history

---

## 📝 NOTES
- Use `husky` + `lint-staged` for pre-commit hooks (TypeScript/JavaScript).
- Use `pre-commit` framework for Python Git hooks.
- For monorepos: scope commits to the affected package (`feat(web): ...`, `feat(api): ...`).
- **Secret rotation:** If a secret was committed, follow this procedure: (1) Revoke/rotate the secret immediately, (2) Remove it from the repository, (3) Rewrite history only when necessary, (4) Verify the secret is no longer exposed in any branch or tag.
- **Branch protection:** Configure protected branches (main, release/*) with required reviews, CI checks, and status checks before merge.

---
**Last Updated:** 2026-08-27
**Version:** 2.1 (Senior Standard — Fixed)
