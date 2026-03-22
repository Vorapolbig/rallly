# Testing Quick Reference
## One-Page Guide for Implementation Tasks

Keep this open while working. Follow the workflow exactly for every task.

---

## The Sacred Workflow

**CODE → TEST → PASS ✓ → COMMIT → PUSH → REPEAT**

```
Task: Add feature X
  ↓
Edit files per instructions
  ↓
pnpm type-check (must pass)
  ↓
Write test_X.test.ts
  ↓
pnpm test:unit (must pass ✓)
  ↓
pnpm dev + manual test in browser (if UI change)
  ↓
git add .
git commit -m "message"
  ↓
git push origin feat/cloudflare-access-simplified
  ↓
Next task
```

---

## Essential Commands

| What | Command | When |
|------|---------|------|
| **Start dev** | `pnpm dev` | Every session |
| **Start DB** | `pnpm docker:up` | Before dev |
| **Type check** | `pnpm type-check` | After every edit |
| **Unit tests** | `pnpm test:unit` | After tests written |
| **Watch tests** | `pnpm test:unit --watch` | During development |
| **Integration tests** | `pnpm test:integration` | For flow changes |
| **Reset DB** | `pnpm db:reset` | DB is corrupted |
| **Studio GUI** | `pnpm prisma studio` | View/debug DB |

---

## Test Types by Task

### Logic/API Changes (business logic)
✅ **Write unit tests** (`.test.ts`)

Example: CF Access header extraction
```bash
pnpm test:unit cf-access.test.ts
```

### Component/UI Changes (visual, interaction)
✅ **Write component tests** (`.test.tsx`)

Example: Sign-out button
```bash
pnpm test:unit nav-user.test.tsx
```

### Flow Changes (multi-step flows)
✅ **Write integration tests** (`.spec.ts`)

Example: Poll creation flow
```bash
pnpm test:integration poll-creation.spec.ts
```

### Database Changes (schema updates)
✅ **Manual test** + integration tests

1. `pnpm db:reset` (apply migration)
2. `pnpm test:integration` (test with new schema)

### Deletion (removing code)
✅ **Run existing tests** (verify nothing broke)

```bash
pnpm test:unit
pnpm test:integration
```

---

## Common Checklist for Every Task

Before committing, verify:

- [ ] **Code**: Follows task instructions exactly
- [ ] **Types**: `pnpm type-check` passes (zero errors)
- [ ] **Tests written**: Test file exists and covers changes
- [ ] **Tests pass**: `pnpm test:unit` and `pnpm test:integration` all ✓
- [ ] **Manual test**: Tested in browser (if UI change)
  - [ ] No red errors in DevTools console (F12)
  - [ ] No red errors in network tab (F12 → Network)
  - [ ] Feature works as expected
- [ ] **Git**: Ready to commit
  - [ ] `git status` shows only intended changes
  - [ ] No accidental file deletions
  - [ ] No uncommitted test files

If anything fails, **DO NOT COMMIT**. Debug and fix, then retest.

---

## When Tests Fail

### ❌ "Module not found"
**Cause:** Deleted file still imported somewhere
**Fix:**
```bash
grep -r "old-filename" apps/web/src
# Remove all imports of deleted file
```

### ❌ "Property 'x' does not exist"
**Cause:** Using something that doesn't exist
**Fix:**
```bash
# Check that property exists in source
# Remove usage if property was deleted
```

### ❌ "Cannot find name 'Component'"
**Cause:** Component not exported or deleted
**Fix:**
```bash
# Check file exists: apps/web/src/path/to/component.tsx
# Check it has: export function Component()
```

### ❌ "Expected X but got Y"
**Cause:** Test assertion wrong or logic changed
**Fix:**
```bash
# Read error message carefully
# Debug: console.log() in test or component
# Fix test expectation or component logic
```

### ❌ "Timeout" (integration test)
**Cause:** Element not found or loading too slow
**Fix:**
```bash
# Run with browser visible:
pnpm test:integration --headed

# Inspect in browser, check console
# Increase timeout if legitimate
```

### ❌ "Database error"
**Cause:** DB not running or migration failed
**Fix:**
```bash
# Ensure running:
pnpm docker:up

# Reset if corrupt:
pnpm db:reset

# Then retry tests:
pnpm test:unit
```

---

## Git Workflow

**Before starting work:**
```bash
git checkout main
git pull origin main
git checkout -b feat/cloudflare-access-simplified
```

**For each task:**
```bash
# 1. Make changes
# 2. Test: pnpm test:unit && pnpm test:integration
# 3. Commit (ONLY if all tests pass)
git add .
git commit -m "feat: [task name]"

# 4. Push
git push origin feat/cloudflare-access-simplified
```

**Commit message format:**
```
feat:   New feature
fix:    Bug fix
chore:  Maintenance (no behavior change)
docs:   Documentation only
test:   Add/update tests
```

**Example commit messages:**
```bash
git commit -m "feat: create CF Access header extraction helper with tests"
git commit -m "chore: remove better-auth imports"
git commit -m "fix: resolve typescript errors from auth removal"
```

---

## Testing Tips & Tricks

### 1. Watch Mode (Auto Re-run Tests)
```bash
pnpm test:unit --watch

# Then edit code in another terminal
# Tests re-run automatically on save
```

### 2. Run Single Test File
```bash
pnpm test:unit apps/web/src/features/user/cf-access.test.ts
```

### 3. Run Tests Matching Pattern
```bash
pnpm test:unit --grep "CF Access"
```

### 4. Debug Integration Test with Browser
```bash
pnpm test:integration --headed --grep "poll creation"

# Browser opens, shows what's happening
# Can interact with page, check console
```

### 5. Check Test Coverage
```bash
pnpm test:unit --coverage

# Shows % coverage for modified code
# Goal: 70%+ coverage
```

### 6. Reset Everything
```bash
# If everything is broken:
pnpm docker:down
pnpm docker:up
pnpm db:reset
pnpm test:unit

# Start fresh
```

---

## File Structure

After task is complete:

```
For a feature X:

src/
├─ features/
│  ├─ x/
│  │  ├─ x.ts               <- implementation
│  │  └─ x.test.ts          <- unit test (NEXT TO SOURCE)
│  └─ ...
├─ components/
│  ├─ x-button.tsx          <- component
│  └─ x-button.test.tsx     <- component test
└─ trpc/
   └─ routers/
      ├─ x.ts              <- router
      └─ x.test.ts         <- router test

tests/
├─ x-flow.spec.ts           <- integration test
└─ test-utils.ts            <- helpers
```

---

## Status Checks (Before Committing)

### Full Check Script
Copy & run this before committing:

```bash
echo "=== Checking TypeScript ==="
pnpm type-check || exit 1

echo "=== Running Unit Tests ==="
pnpm test:unit || exit 1

echo "=== Running Integration Tests ==="
pnpm test:integration || exit 1

echo "✅ All checks passed! Safe to commit."
```

---

## Docker Cheatsheet

```bash
# Start database
pnpm docker:up

# Check status
docker ps

# Stop all
pnpm docker:down

# View logs
docker logs -f postgres

# Enter database shell
docker exec -it postgres psql -U postgres -d rallly

# Reset everything
pnpm docker:down
pnpm docker:up
pnpm db:reset
```

---

## Debugging in Browser

**Open DevTools: F12**

**Console Tab (red ✗ = error):**
```javascript
// Check if CF headers were set
localStorage.getItem('cf-headers')

// Check user auth state
window.__USER_DATA__

// Check error
console.error() // Look for red errors
```

**Network Tab:**
- Look for failed requests (4xx, 5xx status codes in red)
- Click request → Response tab → See error message
- Check tRPC calls: `/api/trpc/...`

**Application Tab:**
- Cookies → Check CF Access headers
- LocalStorage → Check token/session

---

## Need Help?

1. **Test failing?** Read the error message carefully, check TESTING_GUIDE.md
2. **TypeScript error?** Run `pnpm type-check` to see full error
3. **DB issue?** Run `pnpm db:reset` to get clean state
4. **Git confused?** Run `git status` to see what's staged
5. **Browser not working?** Check F12 console for errors

**Remember:** Every red ✗ must be fixed before committing.

---

## Final Checklist Before Pushing

```bash
# Run this before git push:

pnpm type-check && \
pnpm test:unit && \
pnpm test:integration && \
echo "✅ ALL TESTS PASS - SAFE TO PUSH" && \
git push origin feat/cloudflare-access-simplified
```

**If anything fails, DO NOT PUSH. Debug and fix.**

---

**Good luck! You've got this! 💪**

Questions? See TESTING_GUIDE.md for comprehensive help.
