---
name: readme-template
description: README guidelines for any project. Covers adaptive section selection, universal principles, project-type detection, and verification against actual project configuration.
---

# 📌 README Template

## 🎯 GOAL
**One sentence:** Write a clear, accurate, and project-appropriate README that helps the intended audience understand, install, use, and maintain the project — with content derived from the actual project, not invented.

> Example:
> A `README.md` that accurately describes the project, provides working installation and usage instructions derived from actual project files, and includes only the sections relevant to the project type and audience.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Project-type conventions** — Web app, backend API, mobile app, library, CLI, bot, etc.
2. **Existing project conventions** — What the codebase already uses.
3. **Explicit project-level rules** — Documentation standards, branding guidelines.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> **Critical rule:** Never invent installation commands, environment variables, dependencies, features, API endpoints, screenshots, badges, versions, benchmarks, links, licenses, or configuration values. Derive README content from actual project files and configuration.

---

## 💡 KEY PRINCIPLES
- **Write for the Reader** — Identify the audience (developers, end users, contributors) and write for their needs.
- **Show, Don't Tell** — Working code examples speak louder than descriptions.
- **Keep It Current** — Update README whenever documented behavior, setup, configuration, commands, or public interfaces change.
- **Scannable Structure** — Use headers, bullet points, and tables for quick navigation.
- **Adapt to Project Type** — A Telegram bot README differs from a web app README. Select relevant sections.
- **Verify Against Code** — Verify every command, environment variable, package name, file path, and configuration example against the actual project.

---

## 📁 PROJECT-TYPE DETECTION

> **Before generating a README, identify the project type and select relevant sections.**

| Project Type | Core Sections | Additional Sections |
|---|---|---|
| **Web Application** | Title, Description, Installation, Quick Start, Configuration, Testing, Deployment | Architecture, Environment, Screenshots |
| **Backend/API** | Title, Description, Installation, Quick Start, API Reference, Authentication, Testing | Rate Limiting, Error Handling, Changelog |
| **Telegram Bot** | Title, Description, Bot Setup, Commands, Configuration, Deployment | Handlers, Webhook/Polling, Screenshots |
| **Mobile App (Flutter/RN)** | Title, Description, Prerequisites, Installation, Run, Build, Platforms | Architecture, Screenshots, Release |
| **Library/Package** | Title, Description, Installation, Quick Start, API Reference, Testing | Contributing, License, Changelog |
| **CLI Tool** | Title, Description, Installation, Quick Start, Commands, Configuration | Examples, Troubleshooting |
| **Monorepo** | Title, Description, Overview, Packages, Quick Start | Per-package READMEs, Build |

---

## 📁 README SECTIONS (Adaptive)

### Core Sections (Almost Always Include)

- **Title** — Project name
- **Description** — What it is and what it does
- **Installation** — How to set up
- **Quick Start** — Shortest path to a meaningful first result
- **Usage** — How to use it

### Conditional Sections (Include When Relevant)

- **Configuration** — When the project has configurable options
- **API Documentation** — When the project exposes or consumes an API (link to canonical docs, don't duplicate)
- **Testing** — When the project has tests
- **Development Setup** — When contributing or local development differs from installation
- **Troubleshooting** — When there are known common issues
- **Deployment** — When deployment is non-trivial
- **Architecture** — When the project has a notable architecture
- **Security** — When security considerations are important
- **Performance** — When performance is a key concern
- **Contributing** — For open-source projects with a contribution workflow
- **Changelog** — When there's a release history worth documenting
- **License** — When the project has a license
- **Authors/Maintainers** — When there are specific maintainers to credit
- **Links** — When there are relevant external resources

> **Not every README needs every section.** Select sections based on project type, audience, and what information is actually useful.

---

## 🔧 SECTION GUIDELINES

> **Derive all content from actual project files.** Do not invent commands, dependencies, or configuration.

### Title

```markdown
# Project Name

One-sentence description of what this project does.
```

> **Logo is optional.** Use project branding when appropriate (GUI apps, consumer products). For libraries, CLI tools, or internal projects, a logo may be unnecessary.

### Badges (Optional)

> **Add badges only when they provide useful project status or metadata.** Do not add badges for private projects, internal tools, or when the badge data is not meaningful.

```markdown
<!-- Example badges for an open-source library -->
![License](https://img.shields.io/badge/license-[actual-license]-blue.svg)
![Version](https://img.shields.io/badge/version-[actual-version]-green.svg)
![Build Status](https://img.shields.io/github/actions/workflow/status/[org]/[repo]/[workflow].svg)
```

> **Do not include:** Downloads badges for private projects, coverage badges when coverage is not measured, version badges for unversioned projects.

### Description

```markdown
## Description

Brief explanation (2-3 sentences) of what the project does and why it exists.

### Features
- Feature 1 — what it does
- Feature 2 — what it does
- Feature 3 — what it does

### Screenshots (if GUI)
![Screenshot](screenshot.png)
```

### Installation

> **Derive prerequisites and commands from actual project configuration files** (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Dockerfile`, `README.md`, etc.).

```markdown
## Installation

### Prerequisites
<!-- Derive from actual project requirements -->
- [Runtime/Platform] >= [version from config]
- [Database] >= [version from config]

### Steps
<!-- Derive from actual project scripts/commands -->
```bash
git clone [actual-repo-url]
cd [project-dir]
[actual-install-command]
[actual-setup-command]
[actual-run-command]
```
```

### Quick Start

> **Provide the shortest practical path from installation to a meaningful first result.** This varies by project type.

```markdown
## Quick Start

<!-- Derive from actual project usage -->
[Minimal working example with actual code]
```

### Usage

```markdown
## Usage

[Detailed usage examples with actual code from the project]

### Commands (if CLI)
<!-- Derive from actual CLI help output -->
```

### Configuration

> **Derive environment variables and configuration from actual project files** (`.env.example`, config files, schema files).

```markdown
## Configuration

### Environment Variables
<!-- Derive from actual .env.example or config schema -->

| Variable | Required | Default | Description |
|---|---|---|---|
| `[ACTUAL_VAR]` | [Yes/No] | [actual-default] | [actual description] |
```

### Testing

> **Derive test commands from actual project configuration.**

```markdown
## Testing

<!-- Derive from actual package.json scripts, Makefile, etc. -->
```bash
[actual-test-command]
[actual-coverage-command]
```
```

> **Do not include coverage percentages unless they are automatically measured and current.**

### Troubleshooting

> **Include actual known issues and their solutions.** Do not include generic troubleshooting templates.

```markdown
## Troubleshooting

### Common Issues

**Q: [Actual issue from project]**
A: [Actual solution]

**Q: [Actual issue from project]**
A: [Actual solution]
```

> **Never suggest `kill -9` as a first solution.** If a process needs to be terminated, suggest identifying it first and terminating gracefully.

### License

> **Use the actual project license.** Do not default to MIT. If no license file exists, state "See LICENSE file" only if one exists, or omit the section.

```markdown
## License

[Actual license name] — see the [LICENSE](LICENSE) file for details.
```

---

## ✅ CODE EXAMPLE (Adaptive README)

> **This example shows structure only. Actual content must be derived from the project.**

```markdown
# Project Name

One-sentence description of what this project does.

<!-- Table of contents for longer READMEs -->
## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Configuration](#configuration)
- [Testing](#testing)
- [License](#license)

## Description

Project Name is a [project type] that [what it does].

### Features
- Feature 1 — brief description
- Feature 2 — brief description
- Feature 3 — brief description

## Installation

### Prerequisites
<!-- Derive from actual project -->
- [Runtime/Platform] >= [version]
- [Dependency] >= [version]

### Steps
<!-- Derive from actual project -->
```bash
git clone [repo-url]
cd [project-dir]
[install-command]
[setup-command]
```

## Quick Start

<!-- Derive from actual project usage -->
[Minimal working example]

## Usage

[Detailed usage examples]

## Configuration

<!-- Derive from actual project config -->
| Variable | Required | Default | Description |
|---|---|---|---|
| `[VAR]` | [Yes/No] | [default] | [description] |

## Testing

<!-- Derive from actual project -->
```bash
[test-command]
```

## License

[Actual license] — see the [LICENSE](LICENSE) file for details.
```

---

## ❌ ANTI-PATTERN (Wrong)

```markdown
# My Project

idk what this does lol

install it somehow

usage: just use it

license: idk
```

**Why this is bad:**
- No description — readers don't know what the project is.
- No installation instructions — impossible to set up.
- No usage examples — readers can't get started.
- No license — legal ambiguity.

**Also wrong (invented content):**
```markdown
## Installation
```bash
npm install some-fake-package  # Package doesn't exist
```

## Configuration
| Variable | Description |
|---|---|
| `FAKE_VAR` | Made up variable |  # Doesn't exist in project

## Testing
Current coverage: **85%**  # Not actually measured
```
```

**Why invented content is bad:**
- Commands don't work — destroys trust immediately.
- Environment variables don't exist — causes confusion.
- Fake metrics mislead readers.

---

## 🚨 COMMON MISTAKES
1. **Inventing content** — Never invent commands, dependencies, or configuration. Derive from actual project files.
2. **Outdated examples** — Code snippets that don't work destroy trust. Verify examples against current code.
3. **No quick start** — Provide the shortest practical path to a meaningful first result.
4. **No screenshots** — For GUI projects, pictures are essential.
5. **Broken links** — Always verify internal and external links.
6. **Copy-pasting templates** — A Telegram bot README should not look like a Node.js web app README.
7. **Including irrelevant sections** — Don't add API docs to a CLI tool, or Contributing to a private project.

---

## ✔️ CHECKLIST (Before Publishing)

### Content Accuracy
- [ ] Title and description accurately describe the project
- [ ] All commands verified against actual project (run them)
- [ ] All environment variables exist in actual project config
- [ ] All package/dependency names are correct
- [ ] All file paths referenced actually exist
- [ ] All links (internal and external) are working
- [ ] License matches actual LICENSE file (if present)

### Structure
- [ ] Sections are relevant to project type
- [ ] No irrelevant or template sections included
- [ ] Quick start provides shortest practical path to first result
- [ ] Installation instructions are complete and accurate

### Quality
- [ ] Code examples are current and working
- [ ] No invented or placeholder content
- [ ] No broken links
- [ ] Screenshots/GIFs included (if GUI and useful)
- [ ] Troubleshooting covers actual known issues (if section included)

### Conditional
- [ ] Contributing guide exists (if open-source with contribution workflow)
- [ ] API documentation referenced (if project has an API)
- [ ] Deployment instructions included (if deployment is non-trivial)

---

## 📚 CHEATSHEET

### README Core Questions

| Question | Section | Length |
|---|---|---|
| What is it? | Title & Description | 2-3 sentences |
| How do I install it? | Installation | 5-10 lines |
| How do I run/use it? | Quick Start + Usage | Minimal example + details |
| How do I configure it? | Configuration | Table of options |
| How do I develop/test it? | Testing + Development | Commands |

### Optional Sections (Include When Relevant)

| Section | When to Include |
|---|---|
| API Documentation | Project exposes or consumes an API |
| Architecture | Notable architecture worth documenting |
| Deployment | Deployment is non-trivial |
| Security | Security considerations are important |
| Performance | Performance is a key concern |
| Contributing | Open-source with contribution workflow |
| Changelog | Release history worth documenting |
| Troubleshooting | Known common issues exist |

---

## 🔗 RELATED SKILLS
- ⬆️ [`roadmap-template`] – README links to roadmap
- ⬆️ [`api-documentation`] – README references API docs
- ⬇️ [`git-workflow`] – Contributing guide references Git workflow

---

## 📝 NOTES
- For open-source: include "Star ⭐ this repo" call-to-action.
- For npm packages: add installation via `npm install package-name`.
- For Docker projects: add `docker run` quick start.
- For monorepos: link to per-package READMEs.

---
**Last Updated:** 2026-08-27
**Version:** 2.1 (Senior Standard — Fixed)
