---
name: prd-to-issues
description: Converts a feature idea or conversation context into a complete PRD, then immediately breaks it into independently-grabbable vertical-slice issues — all in one pass without switching skills. Use when user says "make a PRD and issues", "prd-to-issues", "turn this into a plan and tasks", or wants to go from raw idea to implementation tickets in one shot.
---

# PRD → Issues (One-Shot Pipeline)

Synthesise a PRD from context, then decompose it into tracer-bullet vertical slices — without stopping between the two phases.

## Quick Start

1. Read existing context (conversation, codebase, any referenced files).
2. Write the PRD (Phase 1).
3. Immediately break it into vertical-slice issues (Phase 2).
4. Present both artifacts to the user for a single review pass.

---

## Phase 1 — Write the PRD

Synthesise from existing context. **Do NOT interview the user.** Use the project's domain glossary and respect any ADRs.

Sketch the major modules needed. Look for **deep modules** (small interface, large encapsulated behaviour, easy to test in isolation) over shallow ones.

### PRD Template

```markdown
## Problem Statement
[The problem, from the user's perspective.]

## Solution
[The solution, from the user's perspective.]

## User Stories
[Numbered list — as many as needed to cover all actors and edge cases.]
1. As a <actor>, I want <feature>, so that <benefit>.

## Implementation Decisions
[Modules to build/modify, architectural decisions, schema changes, API contracts.
Do NOT include file paths or code snippets — they go stale.]

## Testing Decisions
[What makes a good test. Which modules get tests. Prior art in the codebase.]

## Out of Scope
[Explicitly list what this PRD does NOT cover.]

## Further Notes
[Anything else relevant.]
```

---

## Phase 2 — Break into Vertical Slices

Each slice = a thin **tracer bullet** that cuts through ALL layers (DB schema → API → UI → tests) end-to-end. A completed slice is independently demoable.

**Slice rules:**
- Slices are `AFK` (no human needed) or `HITL` (needs design/architectural decision). Prefer AFK.
- Many thin slices > few thick ones.
- Publish in dependency order so blockers get real issue IDs first.

### Slice Summary Table (present to user for review)

| # | Title | Type | Blocked by | User Stories |
|---|-------|------|------------|--------------|
| 1 | … | AFK/HITL | None | #1, #2 |
| 2 | … | AFK | Slice 1 | #3 |

Ask the user:
- Does granularity feel right?
- Are dependencies correct?
- Merge or split anything?

Iterate until approved.

### Issue Template (one per slice)

```markdown
## What to build
[End-to-end behaviour of this slice. Not layer-by-layer.]

## Acceptance criteria
- [ ] …
- [ ] …

## Blocked by
[Slice N — or "None - can start immediately"]
```

---

## Review Checklist (before handing off)

- [ ] PRD Problem Statement is user-facing (not technical)
- [ ] Every User Story has a named actor + clear benefit
- [ ] Each slice is independently demoable
- [ ] HITL slices are minimised
- [ ] Dependency order is correct
- [ ] No file paths or code snippets in the PRD

## Advanced Reference

See [to-prd/SKILL.md](../to-prd/SKILL.md) and [to-issues/SKILL.md](../to-issues/SKILL.md) for the standalone versions of each phase.
