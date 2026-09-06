---
name: roadmap-template
description: Roadmap guidelines for any project. Covers vision, adaptive planning models, feature prioritization, timelines, dependencies, and stakeholder communication.
---

# 📌 Roadmap Template

## 🎯 GOAL
**One sentence:** Write a clear, structured, and current roadmap that communicates project direction, priorities, and realistic timelines to stakeholders — using the project's actual planning model.

> Example:
> A `ROADMAP.md` file with vision, milestones or phases, feature cards with priority/status/outcome, dependencies, and known limitations — derived from actual project plans, not invented.

---

## ⚖️ PRIORITY (When Conventions Conflict)

1. **Project planning conventions** — Versions, milestones, phases, initiatives, sprints, or other grouping the project uses.
2. **Existing project conventions** — What the codebase/team already uses.
3. **Explicit project-level rules** — Documentation standards, stakeholder requirements.
4. **This skill's defaults** — Below.
5. **Personal preference** — Never override 1–4.

> **Critical rule:** Never invent feature status, owners, deadlines, versions, dependencies, release dates, stakeholder decisions, or business priorities. Derive roadmap content from actual project plans, issues, or decisions.

> **Boundary:** This skill structures and documents roadmap decisions, but must not invent product priorities or make business commitments without explicit project input.

---

## 💡 KEY PRINCIPLES
- **Vision First** — Start with WHY the project exists, then WHAT comes next.
- **Outcome-Oriented** — Each initiative should explain the expected outcome, not just the feature.
- **Avoid False Precision** — Include uncertainty, dependencies, and realistic ranges when estimates are required.
- **Transparent** — If something is delayed or uncertain, say why. Stakeholders respect honesty.
- **Living Document** — Update when priorities, scope, status, or timelines change meaningfully.
- **Adapt to Project** — A Telegram bot roadmap differs from a library release plan. Use the project's actual planning model.

---

## 📁 ROADMAP STRUCTURE (Adaptive)

> **Use the project's actual planning model.** Versions are one option, not a universal requirement.

### Core Sections (Almost Always Include)

- **Vision & Goals** — WHY the project exists, WHAT success looks like
- **Current Status** — Where we are now
- **Planned Work** — Grouped by the project's model (versions, milestones, phases, initiatives, etc.)
- **Known Limitations** — What won't be done (yet)

### Conditional Sections (Include When Relevant)

- **Dependencies** — When deliverables depend on each other or external factors
- **Cancelled/Deferred** — When recording decisions prevents repeated discussion
- **Ownership** — When multiple people or teams share responsibility
- **Timeline** — When dates or time ranges are meaningful and sufficiently predictable
- **Release Notes** — When release history is useful (often in CHANGELOG.md instead)
- **Feedback & Discussion** — When stakeholders or external contributors need a feedback mechanism
- **Technical Debt** — When tracking debt explicitly is valuable

### Planning Models (Choose What Fits)

| Project Type | Typical Model | Grouping |
|---|---|---|
| **Web Application** | Continuous delivery | Milestones, sprints, or quarters |
| **Backend/API** | Semantic versioning | Versions (v1.0, v1.1, v2.0) |
| **Mobile App** | Release-based | App store releases |
| **Telegram Bot** | Feature milestones | Feature sets |
| **Library/Package** | Semantic versioning | Versions with changelog |
| **Internal Tool** | Initiatives | Business initiatives |
| **Startup MVP** | Phases | MVP → Growth → Scale |

---

## 🔧 FEATURE CARD FORMAT

Each feature/initiative follows this structure:

```markdown
### [Feature/Initiative Name]
- **Problem:** What problem does this solve?
- **Expected Outcome:** What success looks like (measurable if possible)
- **Priority:** High / Medium / Low
- **Status:** Planned / In Progress / Done / On Hold / Cancelled
- **Confidence:** High / Medium / Low (estimate certainty)
- **Owner:** @person or team (when multiple people share responsibility)
- **Timeline:** Q2 2024 / Sep 2024 / TBD (only when meaningful)
- **Dependencies:** Depends on [other deliverable] or [external factor]
```

> **Work Types:** Distinguish between Features, Bugs, Technical Debt, Infrastructure, and Research/Discovery when relevant.

---

## ✅ CODE EXAMPLE (Adaptive ROADMAP.md)

> **This example shows structure. Actual content must be derived from the project.**

```markdown
# Project Roadmap

## Vision
[Why the project exists] — [What success looks like].

## Current Status
- **Version/Release:** [current version or milestone]
- **Last Updated:** [date]

---

## [Planning Model: Phases / Milestones / Versions / Initiatives]

### [Phase/Milestone 1: Name] — [Timeframe] ✅ DONE

| Feature | Priority | Status | Owner | Outcome |
|---|---|---|---|---|
| [Feature 1] | High | ✅ Done | [owner] | [expected outcome] |
| [Feature 2] | High | ✅ Done | [owner] | [expected outcome] |

### [Phase/Milestone 2: Name] — [Timeframe] 🔄 IN PROGRESS

| Feature | Priority | Status | Confidence | Timeline |
|---|---|---|---|---|
| [Feature 1] | High | 🔄 In Progress | High | [date] |
| [Feature 2] | Medium | 📋 Planned | Medium | [date] |

### [Phase/Milestone 3: Name] — [Timeframe] 📋 PLANNED

| Feature | Priority | Status | Confidence | Timeline |
|---|---|---|---|---|
| [Feature 1] | High | 📋 Planned | Low | TBD |
| [Feature 2] | Low | 💡 Ideation | — | — |

---

## Known Limitations
- [What won't be done or is constrained]
- [What is out of scope]

## Dependencies (Between Deliverables)
| Dependency | Required By | Status | Risk |
|---|---|---|---|
| [External factor or prior deliverable] | [Feature that depends on it] | [status] | [risk] |

## Cancelled/Deferred (When Useful)
- **[Initiative]** — [Reason for cancellation/deferral]
  - Decision: [why this was decided]

## Timeline (When Meaningful)
```
[Time period]: [Milestone/Phase] — [Status]
```

## Feedback & Discussion (When Relevant)
- [Feedback channel]
- [Discussion location]
```

---

## ❌ ANTI-PATTERN (Wrong)

```markdown
# TODO list

- [ ] auth
- [ ] api
- [ ] dashboard
- [ ] stuff
- [ ] idk

Updated: 6 months ago
```

**Why this is bad:**
- No vision or goals — stakeholders don't know WHY.
- No priorities — everything is equally important (which means nothing is).
- No timeline — no sense of urgency or accountability.
- Stale — not updated in 6 months, trust eroded.
- No owners — nobody is responsible.

---

## 🚨 COMMON MISTAKES
1. **Inventing roadmap content** — Never invent status, owners, deadlines, or priorities. Derive from actual project data.
2. **No vision or outcomes** — Features without "why" become a TODO list.
3. **No priorities** — Everything equally important means nothing is.
4. **Over-committing** — Promise 50 features, deliver 10. Avoid false precision.
5. **Not updating** — A roadmap that doesn't reflect current plans is fiction.
6. **False precision** — Specific dates without confidence levels mislead stakeholders.
7. **Copy-pasting templates** — A Telegram bot roadmap should not look like a versioned API release plan.

---

## ✔️ CHECKLIST (Before Publishing)

### Content Accuracy
- [ ] Vision and goals are clear and accurate
- [ ] Features/initiatives derived from actual project plans
- [ ] No invented status, owners, deadlines, or priorities
- [ ] Priorities reflect actual project priorities (High/Medium/Low)
- [ ] Status for every item reflects actual current state
- [ ] Dependencies identified and documented (deliverable-level, not just package versions)

### Structure
- [ ] Planning model matches project type (versions, milestones, phases, etc.)
- [ ] Each feature/initiative explains the expected outcome
- [ ] Confidence/uncertainty indicated where estimates are given
- [ ] Known limitations documented

### Conditional
- [ ] Ownership assigned (when multiple people/teams share responsibility)
- [ ] Timeline included (when dates are meaningful and predictable)
- [ ] Cancelled/deferred items documented (when recording prevents repeated discussion)
- [ ] Feedback channels provided (when stakeholders need a feedback mechanism)
- [ ] Release notes referenced (when useful, or link to CHANGELOG.md)

---

## 📚 CHEATSHEET

### Roadmap Core Questions

| Question | Section | Notes |
|---|---|---|
| Why does this exist? | Vision & Goals | 1-2 sentences |
| Where are we now? | Current Status | Version/milestone, date |
| What's planned? | Planned Work | Grouped by project model |
| What won't be done? | Known Limitations | Out of scope items |
| What depends on what? | Dependencies | Deliverable-level dependencies |

### Feature Card Elements

| Element | Purpose | When to Include |
|---|---|---|
| Problem | What problem this solves | Always |
| Expected Outcome | What success looks like | Always |
| Priority | High/Medium/Low | Always |
| Status | Current state | Always |
| Confidence | Estimate certainty | When dates/timelines given |
| Owner | Who is responsible | When multiple people/teams |
| Timeline | When it ships | When meaningful and predictable |
| Dependencies | What it depends on | When there are dependencies |

### Planning Models

| Model | Best For | Grouping |
|---|---|---|
| Semantic Versioning | Libraries, APIs | v1.0, v1.1, v2.0 |
| Milestones | Web apps, continuous delivery | Milestone names |
| Phases | Startups, MVPs | Phase 1, Phase 2 |
| Initiatives | Internal tools, enterprise | Business initiatives |
| Releases | Mobile apps | App store versions |

---

## 🔗 RELATED SKILLS
- ⬆️ [`readme-template`] – README may summarize roadmap direction
- ⬇️ [`git-workflow`] – Release process aligns with roadmap milestones
- ⬇️ [`api-documentation`] – API features planned in roadmap
- ⬇️ [`testing-patterns`] – Testing milestones may appear in roadmap

---

## 📝 NOTES
- **Planning tools:** Use GitHub Projects, Notion, Linear, or Jira for visual roadmaps when appropriate.
- **Stakeholder-facing:** Simplify technical details, focus on business value and outcomes.
- **Internal roadmaps:** Include technical debt, infrastructure, and research initiatives.
- **Uncertainty:** Use "Now / Next / Later" for early-stage roadmaps where dates are unknown.
- **Confidence levels:** High (committed), Medium (likely), Low (exploratory) — helps manage expectations.
- **Don't duplicate:** Roadmap answers "What are we planning?" Changelog answers "What did we ship?" Keep them separate.

---
**Last Updated:** 2026-08-27
**Version:** 2.1 (Senior Standard — Fixed)
