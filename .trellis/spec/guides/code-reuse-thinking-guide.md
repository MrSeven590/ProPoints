# Code Reuse Thinking Guide

> **Purpose**: Stop and think before creating new code - does it already exist?

---

## The Problem

**Duplicated code is the #1 source of inconsistency bugs.**

When you copy-paste or rewrite existing logic:
- Bug fixes don't propagate
- Behavior diverges over time
- Codebase becomes harder to understand

---

## Before Writing New Code

### Step 1: Search First

```bash
# Search for similar function names
grep -r "functionName" .

# Search for similar logic
grep -r "keyword" .
```

### Step 2: Ask These Questions

| Question | If Yes... |
|----------|-----------|
| Does a similar function exist? | Use or extend it |
| Is this pattern used elsewhere? | Follow the existing pattern |
| Could this be a shared utility? | Create it in the right place |
| Am I copying code from another file? | **STOP** - extract to shared |

---

## Common Duplication Patterns

### Pattern 1: Copy-Paste Functions

**Bad**: Copying a validation function to another file

**Good**: Extract to shared utilities, import where needed

### Pattern 2: Similar Components

**Bad**: Creating a new component that's 80% similar to existing

**Good**: Extend existing component with props/variants

### Pattern 3: Repeated Constants

**Bad**: Defining the same constant in multiple files

**Good**: Single source of truth, import everywhere

### Pattern 4: Repeated Formatting Logic ⭐

**Bad**: Repeating `unitsToPoints(value).toFixed(1)` in 20+ places

**Good**: Create shared formatter in `domain/models/types.uts`

**Real Example from ProPoints**:

```typescript
// ❌ Before: Repeated in 21 places
worker.displayPoints = unitsToPoints(worker.pointsUnits).toFixed(1)
const formatted = unitsToPoints(units).toFixed(1)

// ✅ After: Shared function in domain/models/types.uts
export function formatPointsUnits(units: PointsUnits): string {
  return unitsToPoints(units).toFixed(1)
}

// Usage everywhere:
worker.displayPoints = formatPointsUnits(worker.pointsUnits)
const formatted = formatPointsUnits(units)
```

**Benefits**:
- Single source of truth for formatting rules
- Easy to change format (e.g., 2 decimals instead of 1)
- Type-safe and consistent
- Easier to test

**When to apply**:
- Same transformation appears 3+ times
- Involves multiple steps (convert + format)
- Format might change in future
- Used across multiple components

---

## When to Abstract

**Abstract when**:
- Same code appears 3+ times
- Logic is complex enough to have bugs
- Multiple people might need this

**Don't abstract when**:
- Only used once
- Trivial one-liner
- Abstraction would be more complex than duplication

---

## After Batch Modifications

When you've made similar changes to multiple files:

1. **Review**: Did you catch all instances?
2. **Search**: Run grep to find any missed
3. **Consider**: Should this be abstracted?

---

## Checklist Before Commit

- [ ] Searched for existing similar code
- [ ] No copy-pasted logic that should be shared
- [ ] Constants defined in one place
- [ ] Similar patterns follow same structure
