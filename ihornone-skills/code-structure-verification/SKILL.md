---
name: code-structure-verification
description: Universal codebase structure verification patterns for any project. Covers structure contract validation, orphan detection via static analysis, duplicate detection, depth thresholds, .gitignore validation, and automated verification with severity levels. Framework-specific entry points belong in platform-specific skills.
---

# 📌 Code Structure Verification

## 🎯 GOAL
**One sentence:** Verify that a project's directory structure complies with its declared architecture contract — detecting orphans, duplicates, excessive depth, and hygiene issues through automated static analysis.

> Example:
> Run automated checks to verify structure compliance, detect orphan candidates via import graph analysis, flag duplicate source files, and enforce .gitignore coverage — with severity levels (ERROR/WARNING/INFO) for each finding.

---

## 💡 KEY PRINCIPLES
- **Contract-Based Verification** – Project declares its structure contract; verifier checks compliance.
- **Static Analysis Over Heuristics** – Use language-specific tools (AST, import graphs) instead of grep-based detection.
- **Severity Levels** – Classify findings as ERROR (must fix), WARNING (review needed), or INFO (suggestion).
- **Fail Fast** – Structure violations should fail CI builds before code review.
- **Refactor Incrementally** – Fix structure issues without rewriting business logic.

---

## 🧠 ARCHITECTURE

```
                    PROJECT
                       │
                       ↓
            Structure Contract
            (declared by project)
                       │
                       ↓
         ┌─────────────────────────┐
         │ code-structure-         │
         │ verification            │
         └─────────────────────────┘
                       │
           ┌───────────┼───────────┐
           ↓           ↓           ↓
       Structure   References    Hygiene
           │           │           │
           ↓           ↓           ↓
       contract    orphans     duplicates
       depth       unused      gitignore
       naming      exports     generated
```

### Dependency Direction
```
Project Skill (declares structure)
        ↓
code-structure-verification (verifies compliance)
        ↓
CI/CD Pipeline (enforces)
```

**Critical Rule:** This skill does NOT dictate architecture. It verifies compliance with the project's declared structure contract.

---

## 📋 STRUCTURE CONTRACT

### Project Declaration

Each project declares its structure contract via configuration:

```yaml
# .structure.yaml (example)
project_type: generic  # or: web, mobile, cli, library, bot
structure:
  root_dirs:
    - src
    - tests
  required_dirs:
    - src/features
    - src/shared
    - src/app
  entry_points:
    - src/main.ts
    - src/index.ts
  exclude:
    - node_modules
    - .git
    - dist
    - build
    - coverage
    - generated
    - vendor
thresholds:
  max_depth: 4          # Default: 4
  max_files_per_dir: 20 # Default: 20
  max_file_lines: 300   # Default: 300
```

### Entry Points

Files that are valid without incoming references:

| Category | Examples |
|---|---|
| Application entry | `main.ts`, `index.ts`, `app.ts`, `__main__.py`, `main.go`, `main.rs` |
| Configuration | `vite.config.ts`, `pyproject.toml`, `Cargo.toml`, `go.mod` |
| Build/CI | `Dockerfile`, `Jenkinsfile`, `Makefile` |
| Scripts | `scripts/*`, `tools/*` |
| Tests | `*.test.ts`, `*.spec.ts`, `conftest.py`, `*_test.go` |
| Framework entry | Framework-specific patterns — see platform skills |

> **Framework-specific entry points:** For Next.js (`page.tsx`, `layout.tsx`), Expo Router, or other framework-specific patterns, see the relevant platform skill (`web-project-structure`, `mobile-project-structure`).

---

## 🔧 VERIFICATION RULES

### Structure Compliance

| Check | Severity | Description |
|---|---|---|
| Required directory missing | ERROR | Declared required directory does not exist |
| Entry point missing | ERROR | Declared entry point does not exist |
| Depth exceeds threshold | WARNING | Directory nesting exceeds configured limit |
| Files per directory exceeds threshold | WARNING | Directory has too many files |
| File exceeds line limit | INFO | File is large, consider splitting |

### Naming Conventions

| Element | Convention | Note |
|---|---|---|
| Directories | Follow project/framework conventions | Do not enforce universal singular/plural |
| Source files | Follow language conventions | kebab-case, camelCase, or snake_case |
| Test files | `*.test.*`, `*.spec.*`, `*_test.*` | Language-specific |
| Config files | Language/framework default | `pyproject.toml`, `Cargo.toml` |

### .gitignore Essentials

`.gitignore` must exist and cover these categories:

| Category | Examples |
|---|---|
| Dependencies | `node_modules/`, `venv/`, `.cargo/` |
| Build output | `dist/`, `build/`, `.next/`, `target/` |
| Environment | `.env`, `.env.local`, `.env.*.local` |
| IDE | `.vscode/`, `.idea/`, `*.swp` |
| OS | `.DS_Store`, `Thumbs.db` |
| Logs | `*.log`, `logs/` |
| Coverage | `coverage/`, `htmlcov/`, `.coverage` |
| Generated | `generated/`, `*.generated.*` |

Exact entries depend on project ecosystem.

---

## 🔍 ORPHAN DETECTION

### Definition

An **orphan candidate** is a source file with no detected incoming references, excluding:
- Configured entry points
- Framework conventions (pages, routes, etc.)
- Generated files
- Test files
- Configuration files
- Explicitly allowed standalone modules

### Detection by Language

| Language | Recommended Tool | Method |
|---|---|---|
| TypeScript/JavaScript | `madge`, `ts-morph`, `depcheck` | AST-based import graph |
| Python | `pyan`, `pydeps`, AST analysis | Import graph |
| Go | `go list`, compiler-aware analysis | Package dependency graph |
| Rust | `cargo metadata`, compiler analysis | Crate dependency graph |
| Universal fallback | Custom script | Heuristic grep (less accurate) |

### Shell Fallback (Heuristic Only)

```bash
#!/bin/bash
# find-orphan-candidates.sh — Heuristic orphan detection
# WARNING: This is a fallback. Use language-specific tools for accuracy.

echo "=== Orphan Candidates ==="

# Exclude known entry points, tests, configs
EXCLUDE_PATTERN="\.(test|spec|config|e2e)\.|__init__|conftest|main\.|index\."

for file in $(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" \) \
  | grep -v "$EXCLUDE_PATTERN"); do

  basename_no_ext=$(basename "$file" | sed 's/\.[^.]*$//')
  import_count=$(grep -r \
    "from.*['\"].*${basename_no_ext}['\"]\|import.*['\"].*${basename_no_ext}['\"]\|use.*${basename_no_ext}\|require.*['\"].*${basename_no_ext}['\"]" \
    src/ --include="*.ts" --include="*.tsx" --include="*.py" \
    | grep -v "^${file}:" | wc -l)

  if [ "$import_count" -eq 0 ]; then
    echo "ORPHAN_CANDIDATE: $file"
  fi
done
```

---

## 🔍 DUPLICATE DETECTION

### Detection Script

```bash
#!/bin/bash
# find-duplicates.sh — Find duplicate source files by content hash

echo "=== Duplicate Source Files ==="

find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
  ! -path "*/node_modules/*" \
  ! -path "*/.git/*" \
  ! -path "*/dist/*" \
  ! -path "*/build/*" \
  ! -path "*/generated/*" \
  ! -path "*/vendor/*" \
  -exec md5sum {} \; | sort | awk '
    {
      if (seen[$1]) {
        print "DUPLICATE: " $0
        print "DUPLICATE: " seen[$1]
        print "---"
      } else {
        seen[$1] = $0
      }
    }
  '
```

---

## ✅ CODE EXAMPLE (Correct)

```
src/
├── app/                    # Entry point directory ✓
│   ├── App.tsx             # Entry point (declared) ✓
│   └── navigation.tsx      # Entry point (declared) ✓
│
├── features/               # Required directory ✓
│   ├── auth/               # Feature module
│   │   ├── screens/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── api/
│   └── profile/            # Feature module
│       ├── screens/
│       ├── components/
│       └── hooks/
│
├── shared/                 # Required directory ✓
│   ├── components/         # 12 files ✓ (< 20)
│   │   ├── ui/             # 6 files ✓
│   │   ├── forms/          # 4 files ✓
│   │   └── layout/         # 2 files ✓
│   ├── hooks/              # 8 files ✓
│   └── utils/              # 7 files ✓
│
├── types/                  # 3 files ✓
└── constants/              # 4 files ✓

# Depth: src/shared/components/ui/Button.tsx = 4 levels ✓ (< 5)
# All non-entry files imported somewhere ✓
# .gitignore present ✓
# .env.example present ✓
# .structure.yaml present ✓
```

---

## ❌ ANTI-PATTERN (Wrong)

```
src/
├── components/             # 35 files ✗ (WARNING: exceeds threshold)
│   ├── Button.tsx
│   ├── Button2.tsx        # DUPLICATE (ERROR)
│   ├── OldButton.tsx      # ORPHAN_CANDIDATE (WARNING)
│   ├── temp.tsx           # ORPHAN_CANDIDATE (WARNING)
│   └── ... (31 more)
├── helpers/                # WARNING: unclear purpose
├── stuff/                  # ERROR: meaningless name
│   └── test.ts
│       └── deep/          # WARNING: depth 5+ levels
│           └── nested/
│               └── file.ts
└── utils/                  # WARNING: dumping ground (> 50 functions)
    ├── formatDate.ts
    ├── formatCurrency.ts
    ├── formatPhone.ts
    └── ... (47 more)
```

---

## 🚨 COMMON MISTAKES
1. **"utils" becoming a dumping ground** – If a utils file has > 5 functions, split into domain-specific modules.
2. **Deep nesting** – If depth > threshold, flatten by merging or splitting directories.
3. **Missing .gitignore** – Always include dependency, build, environment, IDE, and OS exclusions.
4. **Heuristic orphan detection in CI** – Use language-specific static analysis, not grep.
5. **Ignoring entry points** – Entry points are valid orphans by design.
6. **Hardcoding universal limits** – Thresholds should be configurable per project.

---

## ✔️ CHECKLIST (Before Commit)
- [ ] `.structure.yaml` declares project structure contract.
- [ ] Required directories exist as declared.
- [ ] Entry points exist as declared.
- [ ] No orphan candidates (excluding entry points and allowed files).
- [ ] No duplicate source files.
- [ ] Directory names are clear and follow conventions.
- [ ] Directory depth within configured threshold.
- [ ] Files per directory within configured threshold.
- [ ] `.gitignore` covers all required categories.
- [ ] Automated verification script exists and runs in CI.

---

## 📚 CHEATSHEET
| Check | Command | Severity |
|---|---|---|
| Find orphans (TS) | `npx madge --circular --extensions ts,tsx src/` | WARNING |
| Find orphans (Python) | `pyan *.py --uses --no-defines --dot` | WARNING |
| Find duplicates | `bash find-duplicates.sh` | ERROR |
| Check depth | `find . -type d \| awk -F'/' '{print NF-1}' \| sort -n \| tail -1` | INFO |
| Count files/dir | `for d in */; do echo "$(find "$d" -maxdepth 1 -type f \| wc -l) $d"; done` | INFO |
| Check .gitignore | `git status --ignored --short` | ERROR if missing |

**Severity definitions:**
| Severity | Action | CI Behavior |
|---|---|---|
| ERROR | Must fix immediately | Fail build |
| WARNING | Review and fix soon | Fail build (configurable) |
| INFO | Suggestion | Pass with notification |

**Threshold defaults (configurable):**
```
max_depth: 4
max_files_per_dir: 20
max_file_lines: 300
```

---

## 🔗 RELATED SKILLS
- ⬇️ [`naming-conventions`] – Validates file and directory naming rules
- ⬇️ [`git-workflow`] – Ensures `.gitignore` and commit structure are correct
- ⬆️ [`web-project-structure`] – Declares structure contract for web projects
- ⬆️ [`mobile-project-structure`] – Declares structure contract for mobile projects
- ⬆️ [`telegram-bot-structure`] – Declares structure contract for Telegram bots

---

## 📝 NOTES
- **Monorepos:** Verify each package independently, not just the root.
- **CI Integration:** Add structure verification to pre-commit hooks or GitHub Actions.
- **Language Tools:**
  - TypeScript: `madge`, `ts-morph`, `depcheck`
  - Python: `pyan`, `pydeps`, `pylint --enable=W0614`
  - Go: `go list ./...`, `golangci-lint`
  - Rust: `cargo metadata`, `cargo clippy`
- **Entry Points:** Always declare entry points in `.structure.yaml` to avoid false orphan detection.
- **Generated Files:** Exclude generated files from orphan detection.
- **Framework-specific patterns:** For Next.js, Expo Router, Flutter, or grammY entry points, see the relevant platform skill.

---

**Last Updated:** 2026-08-27
**Version:** 3.0 (Staff Standard) — Universal Edition
