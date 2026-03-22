# Implementation Guide
## Rallly — Cloudflare Access Simplified Deployment

**Version:** 1.0
**Target Audience:** Junior/mid-level engineer implementing the simplified deployment
**Estimated Duration:** 2–3 weeks (depends on team size and familiarity)

---

## Table of Contents

1. [Overview](#overview)
2. [Pre-Implementation Checklist](#pre-implementation-checklist)
3. [Phase 1: Setup & Code Organization](#phase-1-setup--code-organization)
4. [Phase 2: Remove Better-Auth & Authentication](#phase-2-remove-better-auth--authentication)
5. [Phase 3: Implement Cloudflare Access Integration](#phase-3-implement-cloudflare-access-integration)
6. [Phase 4: Remove Spaces & Multi-User Features](#phase-4-remove-spaces--multi-user-features)
7. [Phase 5: Remove Billing & Tier Features](#phase-5-remove-billing--tier-features)
8. [Phase 6: Remove Email Infrastructure](#phase-6-remove-email-infrastructure)
9. [Phase 7: Simplify Poll Features](#phase-7-simplify-poll-features)
10. [Phase 8: Database Migration](#phase-8-database-migration)
11. [Phase 9: UI/UX Cleanup](#phase-9-uiux-cleanup)
12. [Phase 10: Testing & Validation](#phase-10-testing--validation)

---

## Overview

This guide breaks down the simplification into **10 phases** with **60+ granular tasks**. Each task includes:
- **What to do:** Clear objective
- **Files involved:** Exact file paths
- **Steps:** Line-by-line changes where applicable
- **Testing:** How to verify it works (unit + integration + manual)
- **Dependencies:** What must be done first

**CRITICAL: Testing & Commit Strategy**

Every single task follows this workflow:

```
CODE → TESTS WRITTEN → TESTS PASS ✓ → COMMIT → PUSH
```

**Never commit code without passing tests.** Each task must have:
1. ✅ Unit tests (if business logic changes)
2. ✅ Integration tests (if API/flow changes)
3. ✅ Manual testing (if UI changes)
4. ✅ All tests passing before commit
5. ✅ Git push after commit

See **TESTING_GUIDE.md** for comprehensive testing instructions, Docker setup, and examples.

---

## Pre-Implementation Checklist

Before starting, ensure:

- [ ] You have the latest code from `main` branch
- [ ] You understand the current codebase (skim `CLAUDE.md` and run `pnpm install`)
- [ ] You have a development database running (`pnpm docker:up`)
- [ ] You can run the dev server (`pnpm dev`)
- [ ] You have a code editor with TypeScript support
- [ ] You have read **TESTING_GUIDE.md** (testing is mandatory)
- [ ] You understand the test → commit → push workflow

---

## Testing Setup & Workflow (MANDATORY)

**⚠️ IMPORTANT: Testing is not optional. Every task must include tests.**

### One-Time Testing Setup

```bash
# Start Docker with test database
pnpm docker:up

# Verify test database is ready
docker ps
# Should show postgres container

# Verify dev server works
pnpm dev &
# Wait for "Ready in XXs" message
# Ctrl+C to stop

# Verify tests run
pnpm test:unit
# Should pass or show test names
```

### Task Workflow (For Every Single Task)

```bash
# 1. Create/switch to feature branch (first task only)
git checkout -b feat/cloudflare-access-simplified

# 2. Implement code changes (follow task instructions)
# [Edit files as per task]

# 3. Check TypeScript compiles
pnpm type-check

# 4. Write/update tests (see TESTING_GUIDE.md for examples)
# Create: apps/web/src/path/to/component.test.ts
# [Write test cases]

# 5. Run tests - MUST PASS before moving on
pnpm test:unit
# All tests: ✓ PASS
pnpm test:integration (if applicable)
# All tests: ✓ PASS

# 6. Manual testing (if UI changes)
pnpm dev
# Visit http://localhost:3000
# [Test feature in browser]

# 7. Only THEN commit
git add .
git commit -m "feat: [task description]"

# 8. Push to branch
git push origin feat/cloudflare-access-simplified

# 9. Repeat for next task
```

### Golden Rules

```
❌ DON'T: Commit without tests passing
❌ DON'T: Push without committing
❌ DON'T: Write code without planning tests

✅ DO: Write tests first (TDD style)
✅ DO: Run all tests before every commit
✅ DO: Commit only when green ✓
✅ DO: Push after committing
✅ DO: Check browser console for errors
```

### Common Test Commands

```bash
# Run specific test file
pnpm test:unit apps/web/src/features/user/cf-access.test.ts

# Watch mode (auto-rerun on changes)
pnpm test:unit --watch

# Run with pattern
pnpm test:unit --grep "CF Access"

# Integration tests with browser visible
pnpm test:integration --headed

# Check coverage
pnpm test:unit --coverage
```

### When Tests Fail

```bash
# 1. Read error message carefully
pnpm test:unit

# 2. Check test file for issues
# vim apps/web/src/path/to/component.test.ts

# 3. Debug in browser (integration tests)
pnpm test:integration --headed
# Browser opens, inspect element, check console

# 4. Check mock setup (if mocking)
# Ensure vi.mock() is correct, see TESTING_GUIDE.md

# 5. Database issues? Reset
pnpm db:reset

# 6. Rerun tests
pnpm test:unit
```

---

# PHASE 1: Setup & Code Organization

## Task 1.1: Create Implementation Branch

**Objective:** Set up a dedicated branch for this work

**Steps:**
```bash
git checkout main
git pull origin main
git checkout -b feat/cloudflare-access-simplified
```

**Verification:**
```bash
git branch -v
# Should show: feat/cloudflare-access-simplified with latest commit
```

**Commit:**
```bash
git commit --allow-empty -m "init: start cloudflare access simplification branch"
```

---

## Task 1.2: Create Documentation Directory

**Objective:** Organize implementation notes and progress tracking

**Steps:**
1. Create a directory: `mkdir -p docs/implementation`
2. Create progress file: `touch docs/implementation/PROGRESS.md`
3. Create checklist file: `touch docs/implementation/CHECKLIST.md`

**File content for `docs/implementation/PROGRESS.md`:**
```markdown
# Implementation Progress

## Phases Completed
- [ ] Phase 1: Setup & Code Organization
- [ ] Phase 2: Remove Better-Auth
- [ ] Phase 3: CF Access Integration
- [ ] Phase 4: Remove Spaces
- [ ] Phase 5: Remove Billing
- [ ] Phase 6: Remove Email
- [ ] Phase 7: Simplify Polls
- [ ] Phase 8: Database Migration
- [ ] Phase 9: UI Cleanup
- [ ] Phase 10: Testing

## Current Task
[Update as you progress]

## Notes
[Add blockers, questions, insights here]
```

**Commit:**
```bash
git add docs/implementation/
git commit -m "docs: create implementation tracking documentation"
```

---

# PHASE 2: Remove Better-Auth & Authentication

This phase removes all Rallly-managed authentication. Cloudflare Access becomes the sole auth provider.

## Task 2.1: Audit Current Auth Files

**Objective:** Understand what auth-related files exist (inventory)

**Steps:**
1. Search for all auth-related files:
```bash
find apps/web/src -type f -name "*auth*" | sort
find apps/web -type f -path "*login*" | sort
find apps/web -type f -path "*register*" | sort
find apps/web -path "*forgot-password*" -o -path "*reset-password*" | sort
```

2. List files for review:
   - `apps/web/src/lib/auth.ts` — Main Better-Auth config
   - `apps/web/src/lib/auth-client.ts` — Client-side auth client
   - `apps/web/src/app/api/better-auth/[...all]/route.ts` — Auth API route
   - `apps/web/src/app/[locale]/(auth)/login/page.tsx` — Login page
   - `apps/web/src/app/[locale]/(auth)/login/verify/page.tsx` — Email OTP page
   - `apps/web/src/app/[locale]/(auth)/register/page.tsx` — Registration page
   - `apps/web/src/app/[locale]/(auth)/forgot-password/page.tsx` — Forgot password
   - `apps/web/src/app/[locale]/(auth)/reset-password/page.tsx` — Reset password
   - `apps/web/src/auth/` — Auth helpers directory

3. Create an inventory file: `docs/implementation/auth-files-inventory.txt`

**Commit:**
```bash
git add docs/implementation/auth-files-inventory.txt
git commit -m "docs: inventory current auth files"
```

---

## Task 2.2: Create CF Access User Helper Function

**Objective:** Create a helper to extract admin user from Cloudflare Access headers

**Files to create:**
- `apps/web/src/features/user/cf-access.ts` (implementation)
- `apps/web/src/features/user/cf-access.test.ts` (test)

### Step 1: Create Implementation

**File:** Create `apps/web/src/features/user/cf-access.ts`

**Content:**
```typescript
import { headers } from "next/headers";

/**
 * Extract admin user info from Cloudflare Access headers
 * CF Access adds these headers when a user is authenticated:
 * - CF-Access-Authenticated-User-Email
 * - CF-Access-Authenticated-User-UUID
 * - CF-Access-Authenticated-User-Name (optional)
 */
export async function getAdminUserFromCFHeaders() {
  const headersList = await headers();
  const cfEmail = headersList.get("CF-Access-Authenticated-User-Email");
  const cfUuid = headersList.get("CF-Access-Authenticated-User-UUID");

  if (!cfEmail || !cfUuid) {
    return null;
  }

  return {
    email: cfEmail,
    id: cfUuid,
    name: headersList.get("CF-Access-Authenticated-User-Name") || cfEmail.split("@")[0],
    isAdmin: true,
  };
}

/**
 * Verify CF Access is enabled (headers present)
 * Use this to add a warning log if CF Access isn't configured
 */
export async function isCFAccessEnabled() {
  const user = await getAdminUserFromCFHeaders();
  return user !== null;
}
```

### Step 2: Create Tests

**File:** Create `apps/web/src/features/user/cf-access.test.ts`

**Content:**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { headers } from "next/headers";
import { getAdminUserFromCFHeaders, isCFAccessEnabled } from "./cf-access";

// Mock next/headers module
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("CF Access Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdminUserFromCFHeaders", () => {
    it("should extract admin user from CF headers", async () => {
      // Arrange: Mock headers with CF Access values
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "admin@example.com"],
        ["CF-Access-Authenticated-User-UUID", "uuid-123456"],
        ["CF-Access-Authenticated-User-Name", "Admin User"],
      ]);

      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeadersMap.get(key),
      } as any);

      // Act: Call the function
      const result = await getAdminUserFromCFHeaders();

      // Assert: Verify result
      expect(result).toEqual({
        email: "admin@example.com",
        id: "uuid-123456",
        name: "Admin User",
        isAdmin: true,
      });
    });

    it("should use email prefix as name if name header missing", async () => {
      // Arrange: Mock headers without name
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "john@example.com"],
        ["CF-Access-Authenticated-User-UUID", "uuid-789"],
      ]);

      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeadersMap.get(key),
      } as any);

      // Act
      const result = await getAdminUserFromCFHeaders();

      // Assert
      expect(result?.name).toBe("john");
    });

    it("should return null if email header is missing", async () => {
      // Arrange: Mock headers without email
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-UUID", "uuid-123"],
      ]);

      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeadersMap.get(key),
      } as any);

      // Act
      const result = await getAdminUserFromCFHeaders();

      // Assert
      expect(result).toBeNull();
    });

    it("should return null if UUID header is missing", async () => {
      // Arrange: Mock headers without UUID
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "admin@example.com"],
      ]);

      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeadersMap.get(key),
      } as any);

      // Act
      const result = await getAdminUserFromCFHeaders();

      // Assert
      expect(result).toBeNull();
    });

    it("should return null if both CF headers are missing", async () => {
      // Arrange: Mock empty headers
      const mockHeadersMap = new Map();

      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeadersMap.get(key),
      } as any);

      // Act
      const result = await getAdminUserFromCFHeaders();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("isCFAccessEnabled", () => {
    it("should return true if CF Access headers present", async () => {
      // Arrange
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "admin@example.com"],
        ["CF-Access-Authenticated-User-UUID", "uuid-123"],
      ]);

      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeadersMap.get(key),
      } as any);

      // Act
      const result = await isCFAccessEnabled();

      // Assert
      expect(result).toBe(true);
    });

    it("should return false if CF Access headers missing", async () => {
      // Arrange
      const mockHeadersMap = new Map();

      vi.mocked(headers).mockReturnValue({
        get: (key: string) => mockHeadersMap.get(key),
      } as any);

      // Act
      const result = await isCFAccessEnabled();

      // Assert
      expect(result).toBe(false);
    });
  });
});
```

### Step 3: Run Tests

```bash
# Run tests for this task
pnpm test:unit cf-access.test.ts

# Expected output:
# ✓ CF Access Helpers (6 tests)
#   ✓ getAdminUserFromCFHeaders
#     ✓ should extract admin user from CF headers
#     ✓ should use email prefix as name if name header missing
#     ✓ should return null if email header is missing
#     ✓ should return null if UUID header is missing
#     ✓ should return null if both CF headers are missing
#   ✓ isCFAccessEnabled
#     ✓ should return true if CF Access headers present
#     ✓ should return false if CF Access headers missing
```

### Step 4: Check TypeScript Compilation

```bash
# Verify no TypeScript errors
pnpm type-check

# Expected: No errors
```

### Step 5: Commit (Only After Tests Pass ✓)

```bash
# Stage both files
git add apps/web/src/features/user/cf-access.ts
git add apps/web/src/features/user/cf-access.test.ts

# Commit
git commit -m "feat: create CF Access header extraction helper with tests"

# Push to branch
git push origin feat/cloudflare-access-simplified
```

**Verification:**
- [ ] All 8 tests pass ✓
- [ ] TypeScript clean ✓
- [ ] Changes committed ✓
- [ ] Branch pushed ✓

---

## Task 2.3: Remove Auth API Route Handler

**Objective:** Delete the Better-Auth API route that processes login, signup, password reset

**File to delete:** `apps/web/src/app/api/better-auth/[...all]/route.ts`

**Steps:**
1. Delete the file:
```bash
rm apps/web/src/app/api/better-auth/[...all]/route.ts
```

2. Verify the directory is empty:
```bash
ls -la apps/web/src/app/api/better-auth/
# If empty, delete the directory too:
rmdir apps/web/src/app/api/better-auth/
```

**Verification:**
- File is gone
- No broken imports (next step)

**Commit:**
```bash
git add -A
git commit -m "chore: remove better-auth API route handler"
```

---

## Task 2.4: Remove Login Page

**Objective:** Delete `/login` page entirely

**Files to delete:**
- `apps/web/src/app/[locale]/(auth)/login/page.tsx`
- `apps/web/src/app/[locale]/(auth)/login/verify/page.tsx`
- `apps/web/src/app/[locale]/(auth)/login/components/` (entire directory)
- `apps/web/src/app/[locale]/(auth)/login/` (entire directory if empty after above)

**Steps:**
```bash
rm -rf apps/web/src/app/[locale]/\(auth\)/login
```

**Verification:**
- Navigate to `http://localhost:3000/login` in dev server
- Should return 404 page

**Commit:**
```bash
git add -A
git commit -m "chore: remove /login page and components"
```

---

## Task 2.5: Remove Registration Page

**Objective:** Delete `/register` page entirely

**Files to delete:**
- `apps/web/src/app/[locale]/(auth)/register/page.tsx`
- `apps/web/src/app/[locale]/(auth)/register/components/` (if exists)

**Steps:**
```bash
rm -rf apps/web/src/app/[locale]/\(auth\)/register
```

**Verification:**
- Navigate to `http://localhost:3000/register` in dev server
- Should return 404 page

**Commit:**
```bash
git add -A
git commit -m "chore: remove /register page"
```

---

## Task 2.6: Remove Password Reset Pages

**Objective:** Delete `/forgot-password` and `/reset-password` pages

**Files to delete:**
- `apps/web/src/app/[locale]/(auth)/forgot-password/page.tsx`
- `apps/web/src/app/[locale]/(auth)/forgot-password/components/` (if exists)
- `apps/web/src/app/[locale]/(auth)/reset-password/page.tsx`
- `apps/web/src/app/[locale]/(auth)/reset-password/components/` (if exists)
- `apps/web/src/app/[locale]/(auth)/` (directory, if empty)

**Steps:**
```bash
rm -rf apps/web/src/app/[locale]/\(auth\)/forgot-password
rm -rf apps/web/src/app/[locale]/\(auth\)/reset-password
rm -rf apps/web/src/app/[locale]/\(auth\)/
```

**Verification:**
- Run `pnpm dev` — should start without errors
- Try navigating to old auth routes — all return 404

**Commit:**
```bash
git add -A
git commit -m "chore: remove /forgot-password and /reset-password pages"
```

---

## Task 2.7: Remove auth Utilities Directory

**Objective:** Delete `apps/web/src/auth/` directory (helpers, middleware, etc.)

**Steps:**
```bash
rm -rf apps/web/src/auth/
```

**Verification:**
```bash
pnpm type-check
# Should have errors for imports of deleted auth utilities (next tasks fix these)
```

**Note:** This will cause TypeScript errors. That's expected — the next task finds and fixes all imports.

**Commit:**
```bash
git add -A
git commit -m "chore: remove auth utilities directory"
```

---

## Task 2.8: Find & Fix Better-Auth Imports

**Objective:** Find all files importing from Better-Auth and remove those imports

**Steps:**
1. Search for Better-Auth imports:
```bash
grep -r "from \"better-auth\"" apps/web/src --include="*.ts" --include="*.tsx"
grep -r "import.*better-auth" apps/web/src --include="*.ts" --include="*.tsx"
grep -r "authClient" apps/web/src --include="*.ts" --include="*.tsx" | head -20
```

2. For each file with Better-Auth imports:
   - Remove the import line
   - Remove code that uses the imported auth client/config
   - If the file becomes empty or serves no purpose, delete it

**Example:** If you find imports in `apps/web/src/lib/auth-client.ts` and `apps/web/src/app/middleware.ts`:
   - Delete `apps/web/src/lib/auth-client.ts` entirely
   - Remove auth middleware from `apps/web/src/middleware.ts`

3. Run type check to find remaining errors:
```bash
pnpm type-check 2>&1 | head -30
# Fix errors as they appear
```

**Common files to check:**
- `apps/web/src/lib/auth.ts` — Delete entirely (Better-Auth config)
- `apps/web/src/lib/auth-client.ts` — Delete entirely
- `apps/web/src/middleware.ts` — Remove auth-related code
- `apps/web/src/contexts/` — Remove auth context if it exists
- `apps/web/src/components/nav-user.tsx` — Remove auth/logout button (replace in Phase 9)
- `apps/web/src/trpc/context.ts` — Update to use CF Access instead of session

**Commit:**
```bash
git add -A
git commit -m "chore: remove all better-auth imports and client"
```

---

## Task 2.9: Remove Better-Auth from package.json

**Objective:** Remove Better-Auth dependency

**File:** `package.json` (root monorepo)

**Steps:**
1. Open `package.json`
2. Find and remove these packages:
   - `better-auth`
   - `better-auth-client` (if present)
   - `@better-auth/core` (if present)
   - Any other `@better-auth/*` packages

3. Also remove auth-related packages no longer needed:
   - `resend` (email for auth)
   - `nodemailer` (email)
   - Any other email clients

4. Run:
```bash
pnpm install
```

**Verification:**
```bash
pnpm list better-auth
# Should return: No matching packages found
```

**Commit:**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove better-auth and email dependencies from package.json"
```

---

## Task 2.10: Fix TypeScript Errors from Removed Auth

**Objective:** Resolve all remaining TypeScript errors from auth removal

**Steps:**
1. Run full type check:
```bash
pnpm type-check 2>&1
```

2. For each error:
   - Open the file
   - Remove or rewrite code referencing removed auth functions
   - If entire file is auth-related, delete it
   - If partial, keep and clean up

**Common errors:**
- `Cannot find module 'better-auth'` → Remove import
- `Cannot find name 'authClient'` → Remove usage
- `Cannot find name 'useAuthContext'` → Remove context usage
- `Property 'signOut' does not exist` → Remove logout handlers (replaced in Phase 9)

3. Repeat until `pnpm type-check` passes with no errors

**Files likely to have errors:**
- `apps/web/src/trpc/context.ts` — Fix session/user context
- `apps/web/src/app/middleware.ts` — Remove auth checks
- `apps/web/src/app/layout.tsx` — Remove auth provider
- Any route page that checks `isLoggedIn`

**Commit:**
```bash
git add -A
git commit -m "fix: resolve typescript errors from auth removal"
```

---

## Task 2.11: Remove Auth-Related Environment Variables

**Objective:** Remove Better-Auth and email config from `.env` files

**Files to update:**
- `.env.development`
- `.env.production`
- `.env.example`

**Variables to remove:**
```env
# Better-Auth
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...
AUTH_BASE_URL=...

# Email (Resend, SendGrid, etc.)
RESEND_API_KEY=...
SENDGRID_API_KEY=...
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# Google/Microsoft OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...

# Password reset, email verification
MAGIC_LINK_SECRET=...
```

**Variables to ADD:**
```env
# Cloudflare Access
CF_ACCESS_ENABLED=true
CF_ACCESS_EMAIL_HEADER=CF-Access-Authenticated-User-Email
CF_ACCESS_UUID_HEADER=CF-Access-Authenticated-User-UUID
```

**Steps:**
1. Edit `.env.development`, `.env.production`, `.env.example`
2. Remove all Better-Auth and email variables
3. Add CF Access variables

**Verification:**
```bash
grep -i "auth" .env.development
# Should return only CF_ACCESS_* variables
```

**Commit:**
```bash
git add .env.development .env.production .env.example
git commit -m "chore: update environment variables, remove auth/email configs"
```

---

## Task 2.12: Verify Phase 2 Completion

**Objective:** Ensure Phase 2 is complete before moving to Phase 3

**Checklist:**
- [ ] No Better-Auth references in codebase: `grep -r "better-auth" apps/web/src --include="*.ts" --include="*.tsx"` returns 0 results
- [ ] Auth pages removed: `/login`, `/register`, `/forgot-password` all 404
- [ ] TypeScript clean: `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` starts without errors
- [ ] No console errors in browser

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 2 - remove better-auth complete"
```

---

# PHASE 3: Implement Cloudflare Access Integration

This phase integrates CF Access headers so authenticated users are recognized as admins.

## Task 3.1: Create CF Access User Creation Helper

**Objective:** Automatically create or fetch admin user from CF Access email

**File:** Update `apps/web/src/features/user/data.ts`

**Steps:**
1. Open `apps/web/src/features/user/data.ts`
2. Add this function at the end:

```typescript
import { db } from "@/db";

/**
 * Get or create admin user from Cloudflare Access headers
 * CF Access is the source of truth for admin identity
 * We maintain a minimal user record for permissions/settings
 */
export async function getOrCreateAdminUserFromCFAccess(
  email: string,
  uuid: string,
  name?: string
) {
  // Try to find existing user by email
  let user = await db.user.findUnique({
    where: { email },
  });

  if (user) {
    return user;
  }

  // User doesn't exist — create them
  user = await db.user.create({
    data: {
      email,
      name: name || email.split("@")[0],
      // isAnonymous = false (admin users are never anonymous)
      isAnonymous: false,
    },
  });

  return user;
}

/**
 * Get admin session from CF Access headers
 * Returns user DTO for use in tRPC context
 */
export async function getAdminSessionFromCFAccess(cfUser: {
  email: string;
  id: string;
  name?: string;
}) {
  const user = await getOrCreateAdminUserFromCFAccess(
    cfUser.email,
    cfUser.id,
    cfUser.name
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isGuest: false,
      isAnonymous: false,
      role: "admin", // All CF Access users are admins
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
}
```

**Verification:**
```bash
pnpm type-check
# Should pass with no errors
```

**Commit:**
```bash
git add apps/web/src/features/user/data.ts
git commit -m "feat: add CF Access admin user helper functions"
```

---

## Task 3.2: Update tRPC Context for CF Access

**Objective:** Update tRPC context to use CF Access headers instead of Better-Auth sessions

**File:** `apps/web/src/trpc/context.ts`

**Steps:**
1. Open the file
2. Find the function that builds the context (likely `createTRPCContext` or similar)
3. Replace session/auth logic with CF Access logic:

**Example of what to change:**

Before:
```typescript
import { getSession } from "@/lib/auth";

export async function createTRPCContext(opts: {
  headers: Headers;
}) {
  const session = await getSession();

  return {
    user: session?.user || null,
    isGuest: session?.user?.isAnonymous,
    ...
  };
}
```

After:
```typescript
import { getAdminUserFromCFHeaders } from "@/features/user/cf-access";
import { getAdminSessionFromCFAccess } from "@/features/user/data";

export async function createTRPCContext(opts: {
  headers: Headers;
}) {
  const cfUser = await getAdminUserFromCFHeaders();

  let user = null;
  let isAdmin = false;

  if (cfUser) {
    // Admin authenticated via CF Access
    const session = await getAdminSessionFromCFAccess(cfUser);
    user = session.user;
    isAdmin = true;
  }
  // Otherwise user is null (guest or public)

  return {
    user,
    isAdmin,
    isGuest: !isAdmin,
    ...
  };
}
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add apps/web/src/trpc/context.ts
git commit -m "feat: update tRPC context to use CF Access headers"
```

---

## Task 3.3: Update tRPC Procedure Definitions

**Objective:** Simplify tRPC procedures to use CF Access instead of session-based auth

**File:** `apps/web/src/trpc/trpc.ts`

**Steps:**
1. Open the file
2. Find procedure definitions (likely `t.procedure`, `t.middleware`, etc.)
3. Update/simplify these procedures:

**Remove these (they relied on Better-Auth):**
- `sessionProcedure` (if exists)
- `requireEmailVerifiedProcedure` (if exists)
- Any auth-related middleware

**Keep & update:**
- `publicProcedure` — No auth required (for guest routes)
- `privateProcedure` → rename to `adminProcedure` — Requires CF Access admin
- `spaceProcedure` → Delete (spaces are being removed)
- `proProcedure` → Delete (billing is being removed)
- `adminProcedure` (system admin) → Delete (no system admins anymore)

**Example updates:**

Before:
```typescript
export const privateProcedure = t.procedure
  .use(async (opts) => {
    const session = opts.ctx.session;
    if (!session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return opts.next();
  });
```

After:
```typescript
export const adminProcedure = t.procedure
  .use(async (opts) => {
    if (!opts.ctx.isAdmin || !opts.ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return opts.next();
  });
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add apps/web/src/trpc/trpc.ts
git commit -m "feat: simplify tRPC procedures for CF Access auth"
```

---

## Task 3.4: Update tRPC Route Handler

**Objective:** Pass CF Access info to tRPC context

**File:** `apps/web/src/app/api/trpc/[trpc]/route.ts`

**Steps:**
1. Open the file
2. Find where context is created (likely calls `createTRPCContext`)
3. Add CF Access headers to context creation:

**Example:**

Before:
```typescript
const createContext = async () => {
  return {
    headers: request.headers,
    ...
  };
};
```

After:
```typescript
const createContext = async () => {
  const headers = request.headers;

  // CF Access headers are automatically read by
  // getAdminUserFromCFHeaders() in context.ts

  return {
    headers,
    ...
  };
};
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add apps/web/src/app/api/trpc/[trpc]/route.ts
git commit -m "chore: ensure tRPC route passes headers for CF Access"
```

---

## Task 3.5: Update Root Layout for CF Access

**Objective:** Remove auth provider wrappers, ensure CF Access header passing

**File:** `apps/web/src/app/layout.tsx` (or `apps/web/src/app/[locale]/layout.tsx`)

**Steps:**
1. Open the root layout file
2. Find any auth provider wrappers (e.g., `<SessionProvider>`, `<AuthProvider>`)
3. Remove them:

**Example:**

Before:
```typescript
import { SessionProvider } from "next-auth/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

After:
```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add apps/web/src/app/layout.tsx
git commit -m "chore: remove auth provider wrappers from root layout"
```

---

## Task 3.6: Test CF Access Integration Locally

**Objective:** Verify CF Access integration works (with mocked headers in dev)

**Steps:**
1. Create a test helper for local development: `apps/web/src/lib/test-cf-headers.ts`

```typescript
/**
 * Test helper: Inject CF Access headers for local development
 * In production, Cloudflare will inject these automatically
 */
export function mockCFAccessHeaders(req: Request): Headers {
  const headers = new Headers(req.headers);

  // Only in development
  if (process.env.NODE_ENV === "development") {
    // Set these headers to test admin functionality
    headers.set("CF-Access-Authenticated-User-Email", "admin@example.com");
    headers.set("CF-Access-Authenticated-User-UUID", "test-uuid-12345");
    headers.set("CF-Access-Authenticated-User-Name", "Admin User");
  }

  return headers;
}
```

2. Update `apps/web/src/features/user/cf-access.ts` to use mock headers in dev:

```typescript
export async function getAdminUserFromCFHeaders() {
  const headersList = await headers();

  // In development, check for test headers first
  const email = headersList.get("CF-Access-Authenticated-User-Email") ||
                (process.env.NODE_ENV === "development" ? "admin@example.com" : null);
  const uuid = headersList.get("CF-Access-Authenticated-User-UUID") ||
               (process.env.NODE_ENV === "development" ? "test-uuid-12345" : null);

  if (!email || !uuid) {
    return null;
  }

  return {
    email,
    id: uuid,
    name: headersList.get("CF-Access-Authenticated-User-Name") || email.split("@")[0],
    isAdmin: true,
  };
}
```

3. Start dev server and test:
```bash
pnpm dev
```

4. Visit `http://localhost:3000/dashboard`
   - You should NOT get a 401/redirect
   - You should see the dashboard
   - Check browser console for any errors

**Commit:**
```bash
git add apps/web/src/lib/test-cf-headers.ts apps/web/src/features/user/cf-access.ts
git commit -m "feat: add local dev mocking for CF Access headers"
```

---

## Task 3.7: Verify Phase 3 Completion

**Checklist:**
- [ ] No Better-Auth or session-based auth code remains
- [ ] CF Access header extraction works (test in dev)
- [ ] tRPC context uses CF Access
- [ ] Admin users auto-created from CF emails
- [ ] TypeScript clean: `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` works
- [ ] Can access `/dashboard` without 401 error

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 3 - CF Access integration complete"
```

---

# PHASE 4: Remove Spaces & Multi-User Features

This phase removes the concept of "spaces" (workspaces/teams) and simplifies to a flat poll structure.

## Task 4.1: Audit Spaces Usage

**Objective:** Inventory where spaces are used in the codebase

**Steps:**
```bash
# Find all Space references
grep -r "spaceId" apps/web/src --include="*.ts" --include="*.tsx" | wc -l
grep -r "Space" apps/web/src/features/space/ --include="*.ts" --include="*.tsx" | head -20
grep -r "useSpace" apps/web/src --include="*.ts" --include="*.tsx"
grep -r "getSpace" apps/web/src --include="*.ts" --include="*.tsx"
```

2. Create inventory: `docs/implementation/spaces-inventory.txt` with findings

**Common files using spaces:**
- `apps/web/src/features/space/` — Entire feature
- `apps/web/src/trpc/routers/spaces.ts` — All space mutations
- `apps/web/src/app/[locale]/(app)/(space)/` — Layouts using space context
- `apps/web/src/components/space-dropdown.tsx` — Space switcher
- Poll creation/list that filters by space

**Commit:**
```bash
git add docs/implementation/spaces-inventory.txt
git commit -m "docs: inventory spaces usage in codebase"
```

---

## Task 4.2: Remove Spaces tRPC Router

**Objective:** Delete the entire spaces.ts router

**File to delete:** `apps/web/src/trpc/routers/spaces.ts`

**Steps:**
1. Delete file:
```bash
rm apps/web/src/trpc/routers/spaces.ts
```

2. Remove export from main router (likely in `apps/web/src/trpc/routers/index.ts` or similar):
```typescript
// Remove this line:
export const spacesRouter = createRouter({...});

// Or if using combined router:
router({
  spaces: spacesRouter,  // <- DELETE THIS LINE
  polls: pollsRouter,
  ...
});
```

3. Run type check:
```bash
pnpm type-check
# Will show errors for imported spacesRouter
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove spaces tRPC router"
```

---

## Task 4.3: Remove Spaces Components

**Objective:** Delete space-related UI components

**Files to delete:**
- `apps/web/src/components/space-dropdown.tsx`
- `apps/web/src/components/space-switcher.tsx` (if exists)
- `apps/web/src/features/space/components/` (entire directory)

**Steps:**
```bash
rm -f apps/web/src/components/space-*
rm -rf apps/web/src/features/space/components/
```

**Verification:**
```bash
pnpm type-check
# Will show errors for imports of deleted components (fix next)
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove space UI components"
```

---

## Task 4.4: Remove Spaces Navigation

**Objective:** Remove space switcher from app navigation

**File:** `apps/web/src/app/[locale]/(app)/(space)/(dashboard)/layout.tsx`

**Steps:**
1. Find where `<SpaceDropdown />` or similar is rendered
2. Delete that component/import
3. Update sidebar/nav to remove space-related items

**Example:**

Before:
```tsx
<header>
  <SpaceDropdown />
  <nav>
    <Home />
    <Polls />
  </nav>
</header>
```

After:
```tsx
<header>
  <nav>
    <Home />
    <Polls />
  </nav>
</header>
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add apps/web/src/app/[locale]/\(app\)/\(space\)/\(dashboard\)/layout.tsx
git commit -m "chore: remove space switcher from navigation"
```

---

## Task 4.5: Remove Space Settings Pages

**Objective:** Delete space settings pages and routes

**Files to delete:**
- `apps/web/src/app/[locale]/(app)/(space)/settings/spaces/` (entire directory)
- `apps/web/src/app/[locale]/(app)/(space)/settings/members/` (entire directory)
- `apps/web/src/app/[locale]/(app)/(space)/settings/general/` (entire directory)

**Steps:**
```bash
rm -rf apps/web/src/app/[locale]/\(app\)/\(space\)/settings/spaces/
rm -rf apps/web/src/app/[locale]/\(app\)/\(space\)/settings/members/
rm -rf apps/web/src/app/[locale]/\(app\)/\(space\)/settings/general/
```

**Verification:**
- Routes like `/settings/spaces`, `/settings/members`, `/settings/general` should 404

**Commit:**
```bash
git add -A
git commit -m "chore: remove space settings pages"
```

---

## Task 4.6: Remove Space Settings Sidebar Links

**Objective:** Remove space-related links from settings sidebar

**File:** `apps/web/src/app/[locale]/(app)/(space)/settings/components/sidebar.tsx`

**Steps:**
1. Open the settings sidebar file
2. Find the section for space settings (usually labeled "Space" or "Workspace")
3. Delete that entire section:

**Example:**

Before:
```tsx
<nav>
  <h3>Account</h3>
  <Link href="/settings/profile">Profile</Link>
  <Link href="/settings/preferences">Preferences</Link>

  <h3>Space</h3>
  <Link href="/settings/general">General</Link>
  <Link href="/settings/members">Members</Link>
  <Link href="/settings/billing">Billing</Link>
</nav>
```

After:
```tsx
<nav>
  <h3>Account</h3>
  <Link href="/settings/profile">Profile</Link>
  <Link href="/settings/preferences">Preferences</Link>
</nav>
```

4. Run type check and test:
```bash
pnpm type-check
pnpm dev
# Visit /settings — should not show space-related links
```

**Commit:**
```bash
git add apps/web/src/app/[locale]/\(app\)/\(space\)/settings/components/sidebar.tsx
git commit -m "chore: remove space settings links from sidebar"
```

---

## Task 4.7: Remove Space Permissions & CASL Rules

**Objective:** Delete space-level permissions and CASL ability rules

**Files to delete:**
- `apps/web/src/features/space/ability.ts` (if exists)

**Files to update:**
- `apps/web/src/features/user/ability.ts` — Remove space-related CASL rules

**Steps:**
1. Delete space ability file:
```bash
rm -f apps/web/src/features/space/ability.ts
```

2. Open `apps/web/src/features/user/ability.ts`
3. Remove any rules that mention `Space` or `SpaceMember`:

**Example:**

Before:
```typescript
if (user.role === 'admin') {
  can('manage', 'Space');
  can('manage', 'SpaceMember');
}
```

After:
```typescript
if (user.role === 'admin') {
  // All CF Access users are admins with full access
}
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove space-level permissions and CASL rules"
```

---

## Task 4.8: Remove spaceId from Poll Model (Database Layer)

**Objective:** Make `spaceId` optional or remove from polls (decision point)

**Decision:**
- Option A: Keep `spaceId` field but always null (safer for migration)
- Option B: Remove entirely (cleaner but requires schema change)

**Recommendation:** Go with Option A (safer)

**File:** `packages/database/prisma/models/poll.prisma`

**Steps:**
1. Open the Poll model
2. Find the `spaceId` line:
```prisma
spaceId       String?   @unique
space         Space?    @relation(fields: [spaceId], references: [id])
```

3. Make spaceId nullable and remove the unique constraint:
```prisma
spaceId       String?
space         Space?    @relation(fields: [spaceId], references: [id], onDelete: SetNull)
```

4. Also remove from index if present:
```prisma
// Remove:
@@index([spaceId])
```

**Commit:**
```bash
git add packages/database/prisma/models/poll.prisma
git commit -m "chore: make spaceId optional in poll model"
```

---

## Task 4.9: Remove Space Context & Middleware

**Objective:** Remove space-based routing and context

**Files to update:**
- `apps/web/src/middleware.ts` — Remove space redirect logic
- `apps/web/src/app/[locale]/(app)/(space)/layout.tsx` — Simplify or remove

**Steps:**
1. Open `apps/web/src/middleware.ts`
2. Find space-related logic (e.g., redirects to `/setup`, space context)
3. Remove or simplify:

**Example:**

Before:
```typescript
if (pathname.startsWith('/dashboard')) {
  // Redirect to default space
  const space = await getUserDefaultSpace(userId);
  if (!space) return NextResponse.redirect('/setup');
}
```

After:
```typescript
if (pathname.startsWith('/dashboard')) {
  // No space logic needed
  return NextResponse.next();
}
```

4. Update space-based layout if needed:
   - If `(space)` directory exists for routing, you can keep it but remove space logic
   - Or flatten the routing by moving pages up a level

**Commit:**
```bash
git add -A
git commit -m "chore: remove space context and middleware"
```

---

## Task 4.10: Fix Imports & Type Errors from Spaces Removal

**Objective:** Remove all imports/references to removed space code

**Steps:**
1. Run type check:
```bash
pnpm type-check 2>&1 | head -50
```

2. For each error:
   - Remove import of deleted space files
   - Remove space-related code
   - If entire file is space-focused, delete it

**Common errors:**
- `Cannot find module '@/features/space'` → Remove import
- `Cannot find name 'useSpace'` → Remove usage, delete custom hook if exists
- `Property 'spaceId' is required` → Make optional or remove check

3. Repeat until all errors gone:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "fix: resolve type errors from spaces removal"
```

---

## Task 4.11: Delete spaces Feature Directory

**Objective:** Delete entire `apps/web/src/features/space/` directory

**Steps:**
```bash
rm -rf apps/web/src/features/space/
```

**Verification:**
```bash
pnpm type-check
# Should pass (or show different errors if any)
```

**Commit:**
```bash
git add -A
git commit -m "chore: delete spaces feature directory"
```

---

## Task 4.12: Update Poll Queries to Remove Space Filtering

**Objective:** Update poll list queries to not filter by space

**File:** `apps/web/src/trpc/routers/polls.ts`

**Steps:**
1. Open the file
2. Find the `polls.list` query (or similar)
3. Remove space filtering:

**Example:**

Before:
```typescript
polls.list = publicProcedure
  .use(spaceProcedure) // <- Remove this
  .query(async ({ ctx }) => {
    const polls = await db.poll.findMany({
      where: {
        spaceId: ctx.space.id, // <- Remove this filter
        createdBy: ctx.user.id,
      },
    });
    return polls;
  });
```

After:
```typescript
polls.list = adminProcedure
  .query(async ({ ctx }) => {
    const polls = await db.poll.findMany({
      where: {
        createdBy: ctx.user.id,
        // No spaceId filter
      },
    });
    return polls;
  });
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add apps/web/src/trpc/routers/polls.ts
git commit -m "chore: remove space filtering from poll queries"
```

---

## Task 4.13: Verify Phase 4 Completion

**Checklist:**
- [ ] No space-related code in codebase: `grep -r "spaceId\|spaceProcedure" apps/web/src` returns 0
- [ ] `/settings/spaces`, `/settings/members` all 404
- [ ] Space dropdown removed from navigation
- [ ] TypeScript clean: `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` works
- [ ] Can access `/polls` without space errors

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 4 - spaces removal complete"
```

---

# PHASE 5: Remove Billing & Tier Features

This phase removes all Stripe, billing, and tier-gated features.

## Task 5.1: Audit Billing Usage

**Objective:** Find all billing-related code

**Steps:**
```bash
grep -r "tier\|billing\|stripe\|pro\|subscription" apps/web/src --include="*.ts" --include="*.tsx" | wc -l
grep -r "proProcedure" apps/web/src --include="*.ts" --include="*.tsx"
grep -r "isBillingEnabled\|isTierPro" apps/web/src --include="*.ts" --include="*.tsx"
```

2. Create inventory: `docs/implementation/billing-inventory.txt`

**Commit:**
```bash
git add docs/implementation/billing-inventory.txt
git commit -m "docs: inventory billing references"
```

---

## Task 5.2: Remove Stripe from package.json

**File:** `package.json` (root)

**Steps:**
1. Find and remove:
   - `stripe`
   - `@stripe/react-stripe-js`
   - Any other `@stripe/*` packages

2. Run:
```bash
pnpm install
```

**Commit:**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove stripe dependency"
```

---

## Task 5.3: Delete Billing Pages

**Objective:** Remove billing and upgrade UI

**Files to delete:**
- `apps/web/src/app/[locale]/(app)/(space)/settings/billing/` (entire directory)
- `apps/web/src/app/[locale]/(app)/upgrade/` (if exists)
- Any components in `apps/web/src/components/` related to billing:
  - `upgrade-button.tsx`
  - `upgrade-banner.tsx`
  - `billing-*`

**Steps:**
```bash
rm -rf apps/web/src/app/[locale]/\(app\)/\(space\)/settings/billing/
rm -rf apps/web/src/app/[locale]/\(app\)/upgrade/
rm -f apps/web/src/components/*billing* apps/web/src/components/*upgrade*
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove billing pages and components"
```

---

## Task 5.4: Remove Billing from Settings Sidebar

**File:** `apps/web/src/app/[locale]/(app)/(space)/settings/components/sidebar.tsx`

**Steps:**
1. Find billing link:
```tsx
<Link href="/settings/billing">Billing</Link>
```

2. Delete the entire line

**Commit:**
```bash
git add apps/web/src/app/[locale]/\(app\)/\(space\)/settings/components/sidebar.tsx
git commit -m "chore: remove billing link from settings sidebar"
```

---

## Task 5.5: Remove proProcedure from tRPC

**File:** `apps/web/src/trpc/trpc.ts`

**Steps:**
1. Find `proProcedure` definition
2. Delete the entire procedure definition:

```typescript
// DELETE THIS:
export const proProcedure = spaceProcedure.use(async (opts) => {
  if (opts.ctx.space.tier !== 'pro') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Pro tier required' });
  }
  return opts.next();
});
```

**Commit:**
```bash
git add apps/web/src/trpc/trpc.ts
git commit -m "chore: remove proProcedure from tRPC"
```

---

## Task 5.6: Replace proProcedure with adminProcedure

**Objective:** Any routes using `proProcedure` should use `adminProcedure` instead

**File:** `apps/web/src/trpc/routers/polls.ts` (and other routers)

**Steps:**
1. Search for all uses of `proProcedure`:
```bash
grep -r "proProcedure" apps/web/src --include="*.ts" --include="*.tsx"
```

2. For each found:
   - Replace `proProcedure` with `adminProcedure`
   - Remove pro tier checks from the handler

**Example:**

Before:
```typescript
polls.schedule = proProcedure
  .input(scheduleInput)
  .mutation(async ({ input, ctx }) => {
    if (ctx.space.tier !== 'pro') throw new Error('Pro required');
    // schedule logic
  });
```

After:
```typescript
polls.schedule = adminProcedure
  .input(scheduleInput)
  .mutation(async ({ input, ctx }) => {
    // schedule logic (no tier check)
  });
```

3. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "chore: replace proProcedure with adminProcedure"
```

---

## Task 5.7: Remove Tier Checks from Code

**Objective:** Remove all conditional logic based on tier

**Steps:**
1. Search for tier checks:
```bash
grep -r "tier.*pro\|tier.*hobby\|isTierPro" apps/web/src --include="*.ts" --include="*.tsx"
```

2. For each found:
   - If it's a feature guard (e.g., disabling button), remove the condition
   - If it's a feature implementation, keep the feature (remove the guard)

**Example:**

Before:
```tsx
if (space.tier === 'pro') {
  return <ScheduleButton onClick={onSchedule} />;
} else {
  return <UpgradePrompt />;
}
```

After:
```tsx
return <ScheduleButton onClick={onSchedule} />;
```

3. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove tier-based feature guards"
```

---

## Task 5.8: Remove Billing Environment Variables

**File:** `.env.development`, `.env.production`, `.env.example`

**Steps:**
1. Remove these variables:
```env
STRIPE_PUBLIC_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

**Commit:**
```bash
git add .env.development .env.production .env.example
git commit -m "chore: remove stripe environment variables"
```

---

## Task 5.9: Remove Stripe API Routes

**Objective:** Delete Stripe webhook and checkout routes

**Files to delete:**
- `apps/web/src/app/api/billing/` (entire directory, if exists)
- `apps/web/src/app/api/stripe/` (if exists)
- `apps/web/src/app/api/webhooks/stripe/` (if exists)

**Steps:**
```bash
rm -rf apps/web/src/app/api/billing/
rm -rf apps/web/src/app/api/stripe/
rm -rf apps/web/src/app/api/webhooks/stripe/
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove stripe API routes"
```

---

## Task 5.10: Remove Upgrade/Premium Features

**Objective:** Remove feature guards for premium features and make all features available

**Common premium features to unlock:**
- Poll duplication (keep feature, remove tier check)
- Poll scheduling (keep feature, remove tier check)
- Advanced poll settings (keep feature)
- Multiple calendars (keep feature)

**File:** `apps/web/src/components/poll/manage-poll.tsx` (and similar)

**Steps:**
1. Open manage poll component
2. Find any "Pro feature" guards:

**Example:**

Before:
```tsx
{space.tier === 'pro' && (
  <MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
)}
```

After:
```tsx
<MenuItem onClick={onDuplicate}>Duplicate</MenuItem>
```

3. Run dev server and test:
```bash
pnpm dev
# Create a poll, check that all manage options are available
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove tier guards and unlock all poll features"
```

---

## Task 5.11: Remove Tier from Database Schema

**File:** `packages/database/prisma/models/` — Look for tier fields

**Decision:** Keep `tier` field but always set to "pro" for backward compatibility, or remove entirely

**Recommended:** Remove (cleaner)

**Steps:**
1. Find all models with `tier` field:
   - `Space` model: `tier String @default("hobby")`
   - `User` model: if exists
   - Any subscription/plan models

2. Delete tier-related fields and relations

**Example:**

Before:
```prisma
model Space {
  ...
  tier    String @default("hobby")
}
```

After:
```prisma
model Space {
  ...
  // tier removed
}
```

**Commit:**
```bash
git add packages/database/prisma/models/*
git commit -m "chore: remove tier field from database models"
```

---

## Task 5.12: Remove Subscription Model (if exists)

**File:** `packages/database/prisma/models/subscription.prisma` (if exists)

**Steps:**
1. Check if file exists:
```bash
find packages/database -name "*subscription*"
```

2. If exists, delete:
```bash
rm packages/database/prisma/models/subscription.prisma
```

3. Remove from prisma schema import (usually in `schema.prisma`):
```prisma
// Remove:
import "subscription"
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove subscription model from database"
```

---

## Task 5.13: Fix Type Errors from Billing Removal

**Steps:**
1. Run type check:
```bash
pnpm type-check 2>&1 | head -50
```

2. Fix each error:
   - Remove imports of deleted billing files
   - Remove billing-related type checks
   - Remove stripe-related code

3. Repeat until no errors:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "fix: resolve type errors from billing removal"
```

---

## Task 5.14: Verify Phase 5 Completion

**Checklist:**
- [ ] No stripe references: `grep -r "stripe\|proProcedure" apps/web/src` returns 0
- [ ] `/settings/billing` returns 404
- [ ] All poll features available (no tier guards)
- [ ] TypeScript clean: `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` works

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 5 - billing removal complete"
```

---

# PHASE 6: Remove Email Infrastructure

This phase removes all email sending (except calendar invites via Google API).

## Task 6.1: Audit Email Usage

**Steps:**
```bash
grep -r "email\|Email\|sendEmail\|mail" apps/web/src --include="*.ts" --include="*.tsx" | grep -i send | head -20
find apps/web/src -type f -name "*email*" -o -name "*mail*"
find packages -type f -name "*email*" -o -name "*mail*"
```

2. Create inventory: `docs/implementation/email-inventory.txt`

**Commit:**
```bash
git add docs/implementation/email-inventory.txt
git commit -m "docs: inventory email usage"
```

---

## Task 6.2: Remove Email Packages from package.json

**File:** `package.json`

**Steps:**
1. Remove:
   - `resend`
   - `nodemailer`
   - `@react-email/components` (if used for email templates)
   - Any other email client packages

2. Run:
```bash
pnpm install
```

**Commit:**
```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove email client dependencies"
```

---

## Task 6.3: Delete Email Templates Directory

**File to delete:** `packages/emails/` (entire directory)

**Steps:**
```bash
rm -rf packages/emails/
```

**Verification:**
- Ensure nothing imports from `@rallly/emails`
```bash
grep -r "@rallly/emails" apps/ packages/
```

**If found:** Remove those imports

**Commit:**
```bash
git add -A
git commit -m "chore: delete email templates directory"
```

---

## Task 6.4: Remove Email Sending Functions

**Objective:** Remove all `sendEmail`, `emailClient`, etc. from codebase

**Steps:**
1. Search for email sending:
```bash
grep -r "sendEmail\|emailClient\|mailer\.send\|resend\.emails\.send" apps/web/src --include="*.ts" --include="*.tsx"
```

2. For each found:
   - Remove the email sending call
   - Keep the business logic
   - Remove related email variables

**Example:**

Before:
```typescript
const result = await db.poll.create({ ...pollData });
await emailClient.sendTemplate('WelcomePollEmail', {
  to: user.email,
  data: { pollTitle: result.title },
});
return result;
```

After:
```typescript
const result = await db.poll.create({ ...pollData });
// Email removed — no email sending in simplified version
return result;
```

3. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove email sending calls from code"
```

---

## Task 6.5: Remove Email Client Setup

**Objective:** Remove email client initialization and configuration

**Files to find & update:**
- `apps/web/src/lib/email.ts` (or similar) — Delete entirely
- `apps/web/src/services/` — Remove email services

**Steps:**
1. Delete email client setup files:
```bash
rm -f apps/web/src/lib/email.ts
rm -f apps/web/src/lib/email-client.ts
rm -rf apps/web/src/services/email/
```

2. Search for remaining email setup:
```bash
grep -r "new Resend\|createTransport\|emailClient" apps/web/src --include="*.ts" --include="*.tsx"
```

3. Remove any found

**Commit:**
```bash
git add -A
git commit -m "chore: remove email client setup and initialization"
```

---

## Task 6.6: Remove Email Environment Variables

**File:** `.env.development`, `.env.production`, `.env.example`

**Variables to remove:**
```env
# Resend
RESEND_API_KEY=...

# SendGrid
SENDGRID_API_KEY=...

# SMTP
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...

# Email config
FROM_EMAIL=...
REPLY_TO_EMAIL=...
```

**Steps:**
1. Edit all `.env*` files
2. Remove email-related variables

**Commit:**
```bash
git add .env.development .env.production .env.example
git commit -m "chore: remove email environment variables"
```

---

## Task 6.7: Remove Email Notification Preferences

**Objective:** Remove user email notification settings

**Files to find & update:**
- Settings page with notification preferences
- Database schema for notification preferences
- tRPC routes for notification preferences

**Steps:**
1. Delete notification settings page:
```bash
rm -rf apps/web/src/app/[locale]/\(app\)/\(space\)/settings/notifications/
```

2. Remove from settings sidebar (if not done in Phase 4):
   - Find "Notifications" link in sidebar
   - Delete it

3. Delete notification preference tRPC routes:
```bash
grep -r "notification" apps/web/src/trpc --include="*.ts"
# Remove any notification routes
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove email notification preferences"
```

---

## Task 6.8: Remove Notification Triggers from Poll Mutations

**Objective:** Remove email send calls from poll operations

**File:** `apps/web/src/trpc/routers/polls.ts` and `polls/participants.ts`

**Steps:**
1. Open `apps/web/src/trpc/routers/polls/participants.ts`
2. Find participant mutations (add, update):

**Example:**

Before:
```typescript
participants.add = publicProcedure
  .input(addInput)
  .mutation(async ({ input, ctx }) => {
    const participant = await db.participant.create({ ...input });

    // Send notification email to poll creator
    const poll = await db.poll.findUnique({ where: { id: input.pollId } });
    await emailClient.sendTemplate('NewParticipantEmail', {
      to: poll.creator.email,
      data: { participantName: input.name },
    });

    return participant;
  });
```

After:
```typescript
participants.add = publicProcedure
  .input(addInput)
  .mutation(async ({ input, ctx }) => {
    const participant = await db.participant.create({ ...input });
    // Email removed
    return participant;
  });
```

3. Repeat for:
   - `polls.participants.add`
   - `polls.participants.update`
   - `polls.comments.add`
   - `polls.comments.update`

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add apps/web/src/trpc/routers/polls/*.ts
git commit -m "chore: remove email notifications from poll mutations"
```

---

## Task 6.9: Remove Email Verification (Keep Local Verification)

**Objective:** Remove email verification requirement, keep local verification token

**File:** `apps/web/src/trpc/routers/polls/participants.ts`

**Steps:**
1. Find `verifyEmail` mutation (from feature branch)
2. This mutation should NOT send email, just return a verification token
3. Verify it doesn't call any email sending:

```typescript
// This should be the code — NO email sent
participants.verifyEmail = publicProcedure
  .input(z.object({ pollId: z.string(), email: z.string() }))
  .mutation(async ({ input }) => {
    const participant = await db.participant.findUnique({
      where: { email: input.email, pollId: input.pollId },
    });

    if (!participant) {
      return { matched: false, token: null, userId: null };
    }

    // Create encrypted token for session
    const token = await encryptToken({ participantId: participant.id });

    return {
      matched: true,
      token,
      userId: participant.id,
    };
  });
```

**If it sends email:** Remove that code.

**Commit:**
```bash
git add apps/web/src/trpc/routers/polls/participants.ts
git commit -m "chore: ensure verifyEmail mutation doesn't send email"
```

---

## Task 6.10: Remove Email-Related Database Models

**Objective:** Delete database models used only for email features

**Files to check:**
- `packages/database/prisma/models/` — Look for email-related models

**Models to consider removing:**
- `UserNotificationPreferences` — Delete
- `VerificationToken` — Delete (unless used for other purpose)
- `EmailLog` (if exists) — Delete

**Steps:**
1. Find email-related models:
```bash
grep -r "model.*Email\|UserNotification" packages/database/prisma/
```

2. Delete the model definition from its file
3. Remove references from other models (e.g., User.notifications relation)

**Example:**

Before:
```prisma
model User {
  ...
  notificationPreferences UserNotificationPreferences?
}

model UserNotificationPreferences {
  ...
}
```

After:
```prisma
model User {
  ...
  // notificationPreferences removed
}
// UserNotificationPreferences model deleted
```

4. Run type check:
```bash
pnpm type-check
```

**Commit:**
```bash
git add packages/database/prisma/models/*
git commit -m "chore: remove email-related database models"
```

---

## Task 6.11: Fix Type Errors from Email Removal

**Steps:**
1. Run type check:
```bash
pnpm type-check 2>&1 | head -50
```

2. Fix each error:
   - Remove imports of deleted email files
   - Remove email-related code
   - Remove email type references

3. Repeat until clean:
```bash
pnpm type-check
```

**Commit:**
```bash
git add -A
git commit -m "fix: resolve type errors from email removal"
```

---

## Task 6.12: Verify Phase 6 Completion

**Checklist:**
- [ ] No email sending code: `grep -r "sendEmail\|emailClient\|resend\." apps/web/src` returns 0
- [ ] No email packages in package.json: `grep -i "resend\|nodemailer" package.json` returns 0
- [ ] Email environment variables removed: no `SMTP_*` in `.env` files
- [ ] TypeScript clean: `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` works
- [ ] Notifications settings page deleted: `/settings/notifications` returns 404

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 6 - email removal complete"
```

---

# PHASE 7: Simplify Poll Features

This phase simplifies voting options and poll lifecycle.

## Task 7.1: Remove "If Need Be" Vote Option

**Objective:** Simplify to yes/no voting only

**Database schema change:**

**File:** `packages/database/prisma/models/vote.prisma`

**Steps:**
1. Find the Vote model and the `answer` field:
```prisma
model Vote {
  answer    String  // Currently: "yes" | "no" | "ifNeedBe"
}
```

2. Update to enum or constraint (if not already):
```prisma
model Vote {
  answer    String  // "yes" | "no"
  // Add validation/check constraint if DB supports it
}
```

**No schema migration needed yet** — we'll do that in Phase 8.

**Commit:**
```bash
git add packages/database/prisma/models/vote.prisma
git commit -m "docs: remove ifNeedBe vote option from schema (migration in phase 8)"
```

---

## Task 7.2: Remove Vote Option UI Components

**Objective:** Delete "If Need Be" button from voting UI

**Files to find:**
- Components rendering vote options
- Usually in `apps/web/src/components/poll/`

**Steps:**
1. Search for conditional voting UI:
```bash
grep -r "ifNeedBe\|If Need Be\|conditional" apps/web/src/components/poll --include="*.tsx"
```

2. For each component found:
   - Remove the "If Need Be" / third option button
   - Keep only Yes/No buttons

**Example:**

Before:
```tsx
<button onClick={() => vote('yes')}>Yes</button>
<button onClick={() => vote('ifNeedBe')}>If Need Be</button>
<button onClick={() => vote('no')}>No</button>
```

After:
```tsx
<button onClick={() => vote('yes')}>Yes</button>
<button onClick={() => vote('no')}>No</button>
```

3. Run dev and test:
```bash
pnpm dev
# Create a poll, check that only Yes/No options appear
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove ifNeedBe vote option from UI"
```

---

## Task 7.3: Update Vote Handling in tRPC

**File:** `apps/web/src/trpc/routers/polls/participants.ts`

**Steps:**
1. Find vote input validation:
```typescript
const voteInput = z.object({
  answer: z.enum(['yes', 'ifNeedBe', 'no']),
  // ...
});
```

2. Update enum to remove 'ifNeedBe':
```typescript
const voteInput = z.object({
  answer: z.enum(['yes', 'no']),
  // ...
});
```

3. Remove any ifNeedBe handling in the mutation logic

**Commit:**
```bash
git add apps/web/src/trpc/routers/polls/participants.ts
git commit -m "chore: update vote validation to yes/no only"
```

---

## Task 7.4: Update Vote Results Display

**Objective:** Remove "If Need Be" count from results

**File:** Components displaying vote results (likely in `apps/web/src/components/poll/`)

**Steps:**
1. Search for result display components:
```bash
grep -r "ifNeedBe\|conditional.*count\|maybe.*count" apps/web/src/components/poll --include="*.tsx"
```

2. For each found:
   - Remove display of "If Need Be" count
   - Keep Yes/No counts

**Example:**

Before:
```tsx
<div>
  <div>Yes: {votes.yes.length}</div>
  <div>Maybe: {votes.ifNeedBe.length}</div>
  <div>No: {votes.no.length}</div>
</div>
```

After:
```tsx
<div>
  <div>Yes: {votes.yes.length}</div>
  <div>No: {votes.no.length}</div>
</div>
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove ifNeedBe from results display"
```

---

## Task 7.5: Simplify Poll Status Enum

**Objective:** Keep only open/closed status

**File:** `packages/database/prisma/models/poll.prisma`

**Steps:**
1. Find the `status` field:
```prisma
model Poll {
  status    String  // Currently: "open" | "closed" | "paused" | "scheduled" | "canceled"
}
```

2. Simplify to:
```prisma
model Poll {
  status    String  @default("open")  // "open" | "closed"
}
```

**Or use enum:**
```prisma
enum PollStatus {
  OPEN
  CLOSED
}

model Poll {
  status    PollStatus @default(OPEN)
}
```

**Commit:**
```bash
git add packages/database/prisma/models/poll.prisma
git commit -m "docs: simplify poll status to open/closed only"
```

---

## Task 7.6: Remove Poll Pause Feature

**Objective:** Remove pause/unpause functionality

**File:** `apps/web/src/trpc/routers/polls.ts`

**Steps:**
1. Find pause routes:
```bash
grep -r "\.pause\|\.unpause" apps/web/src/trpc --include="*.ts"
```

2. Delete these routes:
```typescript
// DELETE THESE:
polls.pause = adminProcedure.mutation(...);
polls.unpause = adminProcedure.mutation(...);
```

3. Remove from UI (manage poll dropdown):
   - Find pause/unpause buttons
   - Delete them

**Commit:**
```bash
git add -A
git commit -m "chore: remove pause/unpause poll feature"
```

---

## Task 7.7: Remove Poll Scheduling (Keep Calendar Creation)

**Objective:** Remove poll "schedule" feature, keep calendar event creation

**Clarification:**
- **Remove:** The "Schedule Poll" flow that marks poll as "scheduled"
- **Keep:** The ability to create a Google Calendar event from poll winner

**File:** `apps/web/src/trpc/routers/polls.ts`

**Steps:**
1. Find the `polls.schedule` or `polls.book` mutation
2. Rename/update to `polls.createCalendarEvent` if needed
3. Ensure it:
   - Creates Google Calendar event with participant emails
   - Closes the poll
   - Returns success

4. Remove old "schedule" UI that marked poll as "scheduled"
   - In manage poll dropdown, look for "Schedule" option
   - Replace with "Create Calendar Event" if not already

**Commit:**
```bash
git add -A
git commit -m "chore: remove poll scheduling, keep calendar event creation"
```

---

## Task 7.8: Remove Conditional Vote Display Logic

**Objective:** Clean up any special handling for "if need be" votes in sorting/filtering

**File:** Components and utilities displaying/sorting votes

**Steps:**
1. Search for conditional vote logic:
```bash
grep -r "ifNeedBe\|conditional\|maybe" apps/web/src/components/poll --include="*.tsx" --include="*.ts"
```

2. For each found:
   - Remove special case handling
   - Simplify sorting (just by yes count)

**Example:**

Before:
```typescript
const sortByAvailability = (votes) => {
  return votes.sort((a, b) =>
    (b.yes.length - a.yes.length) || (b.ifNeedBe.length - a.ifNeedBe.length)
  );
};
```

After:
```typescript
const sortByAvailability = (votes) => {
  return votes.sort((a, b) => b.yes.length - a.yes.length);
};
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove conditional vote display logic"
```

---

## Task 7.9: Remove Poll Duplication Feature (if not already done)

**Objective:** Remove ability to duplicate polls

**File:** `apps/web/src/trpc/routers/polls.ts`

**Steps:**
1. Find `polls.duplicate` mutation:
```bash
grep -r "\.duplicate" apps/web/src/trpc --include="*.ts"
```

2. Delete the route:
```typescript
// DELETE THIS:
polls.duplicate = adminProcedure.mutation(...);
```

3. Remove from UI (manage poll dropdown):
   - Find "Duplicate" button
   - Delete it

**Commit:**
```bash
git add -A
git commit -m "chore: remove poll duplication feature"
```

---

## Task 7.10: Simplify Export to CSV

**Objective:** Keep CSV export but ensure it only exports yes/no votes

**File:** Components using CSV export, likely in `apps/web/src/components/poll/`

**Steps:**
1. Find CSV export logic:
```bash
grep -r "csv\|CSV\|export.*csv" apps/web/src/components/poll --include="*.ts" --include="*.tsx"
```

2. Verify CSV output only includes yes/no columns (no "if need be")
3. Test by exporting a poll and checking the file

**Commit:**
```bash
git add -A
git commit -m "chore: verify CSV export handles yes/no only"
```

---

## Task 7.11: Remove Advanced Poll Settings (Optional)

**Objective:** Optionally simplify poll settings to core options only

**Decision:** Do you want to remove any poll settings, or keep all (hideParticipants, hideScores, disableComments, requireEmail)?

**Recommendation:** Keep all settings as-is (they're useful)

**If removing any:**
- Remove from settings form
- Remove from database model
- Remove from schema

**Commit:**
```bash
git add -A
git commit -m "chore: verify poll settings are minimal"
```

---

## Task 7.12: Verify Phase 7 Completion

**Checklist:**
- [ ] No ifNeedBe vote option visible in UI
- [ ] Voting input accepts only yes/no
- [ ] Results display only yes/no counts
- [ ] Poll status simple: open/closed
- [ ] Pause/unpause removed
- [ ] CSV export works and shows yes/no only
- [ ] TypeScript clean: `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` works

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 7 - poll feature simplification complete"
```

---

# PHASE 8: Database Migration

This phase creates and runs a database migration to update the schema.

## Task 8.1: Create Prisma Migration

**Objective:** Create migration file for all schema changes

**Steps:**
1. Ensure you have the latest schema changes in `/packages/database/prisma/schema.prisma`
2. Create migration:
```bash
cd packages/database
pnpm prisma migrate dev --name simplify-for-cloudflare-access
```

3. This will:
   - Compare current DB with new schema
   - Generate migration file in `prisma/migrations/`
   - Ask you to confirm changes
   - Apply migration to dev database

4. Review the generated migration file:
```bash
ls prisma/migrations/*/
# Find the latest migration folder
cat prisma/migrations/[timestamp]_simplify-for-cloudflare-access/migration.sql
```

**Common migrations:**
- Drop tables: `Space`, `SpaceMember`, `SpaceMemberInvite`, `UserNotificationPreferences`, `Subscription`
- Drop fields: `spaceId` from polls (or make nullable), `tier` fields
- Modify enums: `answer` to just yes/no, `status` to open/closed

**Commit:**
```bash
git add packages/database/prisma/migrations/
git commit -m "db: create migration for cloudflare access simplification"
```

---

## Task 8.2: Test Migration on Fresh Database

**Objective:** Verify migration works on a clean database

**Steps:**
1. Reset dev database:
```bash
cd packages/database
pnpm prisma db push --skip-generate
```

2. Or use docker to spin a fresh database:
```bash
pnpm docker:up
pnpm db:reset
```

3. Verify tables exist:
```bash
pnpm prisma studio
# Check in the UI that old tables are gone, new schema looks correct
```

4. Seed with test data if needed:
```bash
pnpm db:reset  # If you have seed script
```

**Commit:**
```bash
git commit --allow-empty -m "docs: verify database migration works"
```

---

## Task 8.3: Update Prisma Client Generation

**Objective:** Regenerate Prisma client with new schema

**Steps:**
```bash
cd packages/database
pnpm prisma generate
```

**Verification:**
- No errors in console
- Files in `node_modules/.prisma/client/` are updated

**Commit:**
```bash
git add -A
git commit -m "chore: regenerate prisma client for new schema"
```

---

## Task 8.4: Verify Phase 8 Completion

**Checklist:**
- [ ] Migration file created and sensible
- [ ] Migration runs on fresh database
- [ ] Old tables are gone (Space, SpaceMember, etc.)
- [ ] New schema matches code
- [ ] Prisma client regenerated
- [ ] `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` works

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 8 - database migration complete"
```

---

# PHASE 9: UI/UX Cleanup

This phase removes auth-related UI and cleans up navigation.

## Task 9.1: Remove Auth-Related Navigation Links

**Objective:** Ensure no login/register links in UI

**Files to check:**
- `apps/web/src/components/` — Look for auth links
- Navigation components
- Footer

**Steps:**
1. Search for auth links:
```bash
grep -r "login\|register\|sign.*up\|sign.*in" apps/web/src/components --include="*.tsx" | grep href
```

2. Remove all such links
3. Test in dev:
```bash
pnpm dev
# Check all pages — no login/register links visible
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove auth navigation links from UI"
```

---

## Task 9.2: Update Sign-Out Button

**Objective:** Replace auth sign-out with CF Access logout

**Files:**
- `apps/web/src/components/nav-user.tsx` (implementation)
- `apps/web/src/components/nav-user.test.tsx` (test)

### Step 1: Update Component

**File:** `apps/web/src/components/nav-user.tsx`

**Find and replace the sign-out button:**

Before:
```tsx
import { authClient } from "@/lib/auth-client";

export function NavUser() {
  return (
    <button onClick={() => authClient.signOut()}>
      Sign Out
    </button>
  );
}
```

After:
```tsx
// Remove authClient import — no longer needed

export function NavUser() {
  const handleSignOut = () => {
    // CF Access handles logout at their endpoint
    // Redirect to CF Access logout (configure URL in env)
    const logoutUrl = process.env.NEXT_PUBLIC_CF_LOGOUT_URL ||
                      "/.cf_access/logout";
    window.location.href = logoutUrl;
  };

  return (
    <button onClick={handleSignOut} data-testid="sign-out-button">
      Sign Out
    </button>
  );
}
```

### Step 2: Create Tests

**File:** Create `apps/web/src/components/nav-user.test.tsx`

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavUser } from "./nav-user";

describe("NavUser Component", () => {
  // Mock window.location.href
  delete (window as any).location;
  window.location = { href: "" } as Location;

  describe("Sign Out Button", () => {
    it("should render sign out button", () => {
      render(<NavUser />);

      const button = screen.getByTestId("sign-out-button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Sign Out");
    });

    it("should redirect to CF Access logout when clicked", () => {
      // Arrange
      const spy = vi.spyOn(window.location, "href", "set");

      render(<NavUser />);

      // Act
      fireEvent.click(screen.getByTestId("sign-out-button"));

      // Assert
      expect(spy).toHaveBeenCalledWith("/.cf_access/logout");
    });

    it("should use NEXT_PUBLIC_CF_LOGOUT_URL if set", () => {
      // Arrange
      process.env.NEXT_PUBLIC_CF_LOGOUT_URL = "https://auth.example.com/logout";
      const spy = vi.spyOn(window.location, "href", "set");

      render(<NavUser />);

      // Act
      fireEvent.click(screen.getByTestId("sign-out-button"));

      // Assert
      expect(spy).toHaveBeenCalledWith("https://auth.example.com/logout");

      // Cleanup
      delete process.env.NEXT_PUBLIC_CF_LOGOUT_URL;
    });
  });

  describe("Navigation Items", () => {
    it("should show user profile items", () => {
      render(<NavUser />);

      // Verify other nav items are present (if applicable)
      expect(screen.getByText(/settings/i)).toBeInTheDocument();
    });
  });
});
```

### Step 3: Run Unit Tests

```bash
# Run tests for this component
pnpm test:unit nav-user.test.tsx

# Expected output:
# ✓ NavUser Component (4 tests)
#   ✓ Sign Out Button
#     ✓ should render sign out button
#     ✓ should redirect to CF Access logout when clicked
#     ✓ should use NEXT_PUBLIC_CF_LOGOUT_URL if set
#   ✓ Navigation Items
#     ✓ should show user profile items
```

### Step 4: Manual Testing in Browser

```bash
# Start dev server
pnpm dev

# Open browser and test:
# 1. Visit http://localhost:3000/dashboard
# 2. Click user menu (top right)
# 3. Click "Sign Out"
# 4. Should redirect to CF logout URL
# 5. Check browser console for any errors
```

### Step 5: Check TypeScript

```bash
pnpm type-check
# Should pass with no errors
```

### Step 6: Commit (Only After Tests Pass ✓)

```bash
# Stage changes
git add apps/web/src/components/nav-user.tsx
git add apps/web/src/components/nav-user.test.tsx

# Commit
git commit -m "feat: update sign-out button to use CF Access logout"

# Push to branch
git push origin feat/cloudflare-access-simplified
```

**Verification:**
- [ ] Component tests pass ✓ (4/4)
- [ ] Manual testing in browser works ✓
- [ ] TypeScript clean ✓
- [ ] No console errors in browser ✓
- [ ] Changes committed ✓
- [ ] Branch pushed ✓

---

## Task 9.3: Remove Profile-Related Settings Pages

**Objective:** Keep profile page but remove email/password management

**File:** `apps/web/src/app/[locale]/(app)/(space)/settings/profile/`

**Steps:**
1. Open profile page
2. Remove password change section
3. Keep: name, timezone, locale, theme, etc.

**Example:**

Before:
```tsx
<section>Name and Email</section>
<section>Password Management</section>
<section>Delete Account</section>
```

After:
```tsx
<section>Name and Email (read-only email)</section>
<section>Preferences (timezone, locale, theme)</section>
<section>Delete Account</section>
```

**Commit:**
```bash
git add apps/web/src/app/[locale]/\(app\)/\(space\)/settings/profile/
git commit -m "chore: remove password management from profile settings"
```

---

## Task 9.4: Remove Settings Pages Not Needed

**Objective:** Clean up settings sidebar

**Files to potentially delete:**
- `/settings/preferences` — If it's just profile preferences, merge into profile
- Or keep if timezone/locale settings are here

**Steps:**
1. Review what pages you want in settings
2. Keep:
   - `/settings/profile` (name, timezone, locale)
   - `/settings/calendars` (Google Calendar connection)
3. Delete:
   - `/settings/security` (password reset)
   - `/settings/notifications` (already done in Phase 6)
   - `/settings/spaces` (already done in Phase 4)
   - `/settings/members` (already done in Phase 4)
   - `/settings/billing` (already done in Phase 5)

**Steps:**
```bash
rm -rf apps/web/src/app/[locale]/\(app\)/\(space\)/settings/preferences/
# Keep or keep depending on what makes sense
```

**Commit:**
```bash
git add -A
git commit -m "chore: remove unnecessary settings pages"
```

---

## Task 9.5: Update Settings Sidebar

**File:** `apps/web/src/app/[locale]/(app)/(space)/settings/components/sidebar.tsx`

**Steps:**
1. Open file
2. Simplify sidebar to only show:
   - Profile
   - Calendars (Google Calendar)

3. Remove:
   - Security
   - Notifications
   - Spaces
   - Members
   - Billing
   - Preferences (if not needed)

**Example:**

Before:
```tsx
<nav>
  <section>Account</section>
  <Link to="/settings/profile">Profile</Link>
  <Link to="/settings/security">Security</Link>
  <Link to="/settings/preferences">Preferences</Link>
  <Link to="/settings/notifications">Notifications</Link>
  <Link to="/settings/calendars">Calendars</Link>

  <section>Space</section>
  <Link to="/settings/general">General</Link>
  <Link to="/settings/members">Members</Link>
</nav>
```

After:
```tsx
<nav>
  <section>Account</section>
  <Link to="/settings/profile">Profile</Link>
  <Link to="/settings/calendars">Calendars</Link>
</nav>
```

**Commit:**
```bash
git add apps/web/src/app/[locale]/\(app\)/\(space\)/settings/components/sidebar.tsx
git commit -m "chore: simplify settings sidebar"
```

---

## Task 9.6: Remove Landing Page or Repurpose

**Objective:** Handle the landing page (`apps/landing/`)

**Options:**
1. Delete entirely
2. Redirect to app
3. Keep but repurpose as simple "Hello" page

**Recommendation:** Delete entirely for simplicity

**Steps:**
1. Delete:
```bash
rm -rf apps/landing/
```

2. Update monorepo config if needed:
   - Check `pnpm-workspace.yaml` or `package.json` root
   - Remove landing from workspace

3. Update dev commands if needed:
   - Remove `pnpm dev:landing` from scripts

**Commit:**
```bash
git add -A
git commit -m "chore: remove landing page"
```

---

## Task 9.7: Update Root Route Redirect

**Objective:** Ensure `/` redirects to `/dashboard` or shows home page

**File:** `apps/web/src/app/page.tsx` or `apps/web/src/app/[locale]/page.tsx`

**Steps:**
1. Find root page component
2. Ensure it redirects to dashboard:

```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
```

3. Test:
```bash
pnpm dev
# Visit localhost:3000 — should redirect to /dashboard
```

**Commit:**
```bash
git add apps/web/src/app/page.tsx
git commit -m "chore: redirect root path to dashboard"
```

---

## Task 9.8: Clean Up Feature Flags (Optional)

**File:** `apps/web/src/lib/feature-flags/config.ts`

**Steps:**
1. Review feature flags currently used
2. If all billing/spaces flags are gone, simplify config
3. Consider hardcoding values instead of reading from env:

**Example:**

Before:
```typescript
export const featureFlags = {
  billing: !isSelfHosted,
  calendars: process.env.CALENDARS_ENABLED === "true",
  feedback: !isSelfHosted,
};
```

After:
```typescript
// All self-hosted, no billing, calendars always enabled
export const featureFlags = {
  calendars: true,
} as const;
```

**Commit:**
```bash
git add apps/web/src/lib/feature-flags/config.ts
git commit -m "chore: simplify feature flags"
```

---

## Task 9.9: Verify Phase 9 Completion

**Checklist:**
- [ ] No login/register links in UI
- [ ] No password/security settings visible
- [ ] No notification/billing settings visible
- [ ] Settings sidebar minimal (profile, calendars only)
- [ ] Sign out works (or button removed)
- [ ] Root path redirects to dashboard
- [ ] No landing page or redirects properly
- [ ] TypeScript clean: `pnpm type-check` passes
- [ ] Dev server runs: `pnpm dev` works

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 9 - UI cleanup complete"
```

---

# PHASE 10: Testing & Validation

This phase ensures everything works end-to-end.

## Task 10.1: Verify Dev Server Starts

**Steps:**
```bash
pnpm dev
# Wait for "Ready in XXs" message
```

**Expectations:**
- No errors in console
- Server responds on `http://localhost:3000`

**Commit:**
```bash
git commit --allow-empty -m "test: verify dev server starts"
```

---

## Task 10.2: Test Admin Dashboard Access

**Objective:** Verify admin can access dashboard (with mocked CF headers)

**Steps:**
1. Ensure dev server running
2. Visit `http://localhost:3000/dashboard`
3. Should see:
   - Dashboard page loads
   - Sidebar with Polls, Events, Create buttons
   - No 401 errors
   - No auth-related redirects

**Testing:**
- Check browser console for errors
- Check server logs for issues

**Commit:**
```bash
git commit --allow-empty -m "test: admin dashboard access works"
```

---

## Task 10.3: Test Poll Creation Flow

**Objective:** Create a poll end-to-end

**Steps:**
1. Click "Create Poll" on dashboard
2. Fill in:
   - Title: "Test Meeting"
   - Description: "Team sync"
   - Location: "Conference Room A"
3. Click next
4. Add some time slots:
   - March 24, 2-3 PM
   - March 24, 3-4 PM
5. Click next
6. Configure settings (all default OK)
7. Click "Create Poll"

**Expectations:**
- Poll created successfully
- Redirects to poll view
- No errors in console

**Commit:**
```bash
git commit --allow-empty -m "test: poll creation flow works"
```

---

## Task 10.4: Test Guest Voting (Public Link)

**Objective:** Verify guest can vote without authentication

**Steps:**
1. Get the participant URL from poll: copy the `/invite/[id]` link
2. Open a **new incognito window** (or different browser)
3. Paste the invite link
4. Should see poll without logging in
5. Enter guest name and email
6. Vote on options
7. Check "Manage poll" button is NOT visible

**Expectations:**
- Guest can vote
- Guest form accepts name + email
- Results update
- No admin controls visible

**Commit:**
```bash
git commit --allow-empty -m "test: guest voting flow works"
```

---

## Task 10.5: Test Email Verification for Guest Editing

**Objective:** Verify guest can edit by verifying email

**Steps:**
1. Still on guest poll page
2. Click the pencil/edit icon next to their name
3. Click "Verify email"
4. Enter their email
5. Should see "verified" message
6. Should be able to edit their votes

**Expectations:**
- No email sent (local verification)
- Edit button becomes active
- Can change votes

**Commit:**
```bash
git commit --allow-empty -m "test: guest email verification works"
```

---

## Task 10.6: Test Admin Poll Management

**Objective:** Verify admin can edit, delete, add participants

**Steps:**
1. Go back to admin dashboard
2. Open the poll you created
3. Test:
   - **Edit details:** Change title → save
   - **Edit options:** Add another time slot → save
   - **Edit participants:** Add a new participant manually → verify in list
   - **Delete participant:** Remove a guest → verify they're gone
   - **Comments:** Add a comment, delete it

**Expectations:**
- All operations succeed
- Changes persist
- No errors

**Commit:**
```bash
git commit --allow-empty -m "test: admin poll management works"
```

---

## Task 10.7: Test Poll Closing

**Objective:** Verify admin can close/reopen poll

**Steps:**
1. In manage poll dropdown, click "Close Poll"
2. Poll status should show as "closed"
3. Guest should NOT be able to add new votes (button disabled)
4. Existing votes should still be visible
5. Click reopen → poll should accept votes again

**Expectations:**
- Status toggles correctly
- Guest voting blocked when closed
- Results still visible

**Commit:**
```bash
git commit --allow-empty -m "test: poll open/close toggle works"
```

---

## Task 10.8: Test Google Calendar Integration

**Objective:** Verify Google Calendar connection and event creation

**Steps:**
1. Go to Settings → Calendars
2. Click "Connect Google Calendar"
3. Follow Google OAuth flow
4. Should see connected calendars listed
5. Go back to a poll
6. In edit options (week view), should see busy blocks from your calendar
7. Click "Create Calendar Event" (or schedule button)
8. Select winning time slot
9. Should create event in your Google Calendar
10. Poll should close automatically

**Expectations:**
- OAuth works
- Busy dates visible in week view
- Event created in Google Calendar
- Participant emails were used as attendees

**Commit:**
```bash
git commit --allow-empty -m "test: google calendar integration works"
```

---

## Task 10.9: Test Settings Pages

**Objective:** Verify simplified settings

**Steps:**
1. Go to Settings
2. Check what tabs/links exist:
   - Should see: Profile, Calendars
   - Should NOT see: Security, Notifications, Spaces, Members, Billing
3. Update profile (name, timezone, theme)
4. Verify changes save

**Expectations:**
- Only expected settings pages visible
- Changes persist

**Commit:**
```bash
git commit --allow-empty -m "test: simplified settings work"
```

---

## Task 10.10: Test CSV Export

**Objective:** Verify CSV export works

**Steps:**
1. Open a poll in admin view
2. Click "Export to CSV"
3. Open the downloaded file
4. Verify format:
   - Columns: Participant name, each time option, vote (yes/no)
   - No "ifNeedBe" column
   - All data present

**Expectations:**
- CSV downloads successfully
- Format correct
- All votes visible

**Commit:**
```bash
git commit --allow-empty -m "test: csv export works"
```

---

## Task 10.11: Test Timezone Handling

**Objective:** Verify timezone conversions work

**Steps:**
1. Create a poll with timezone "America/New_York"
2. Add time slots: 2-3 PM EST
3. As guest in different timezone, verify times show correctly
4. Change timezone and verify times adjust

**Expectations:**
- Times convert correctly
- Guest sees accurate times
- Display matches chosen timezone

**Commit:**
```bash
git commit --allow-empty -m "test: timezone handling works"
```

---

## Task 10.12: Run TypeScript Type Check

**Objective:** Ensure codebase is fully type-safe

**Steps:**
```bash
pnpm type-check
```

**Expectations:**
- Zero errors
- No warnings

**If errors:** Fix them

**Commit:**
```bash
git add -A
git commit -m "fix: resolve any remaining typescript errors"
```

---

## Task 10.13: Run Unit Tests (if any)

**Objective:** Verify existing unit tests still pass

**Steps:**
```bash
pnpm test:unit
```

**If tests fail:**
- Review test code
- Update or delete tests referencing removed features
- Rerun until all pass

**Commit:**
```bash
git add -A
git commit -m "test: fix unit tests for simplified codebase"
```

---

## Task 10.14: Run Integration Tests (if any)

**Objective:** Verify integration tests still pass

**Steps:**
```bash
pnpm test:integration
```

**If tests fail:**
- Review and update for new functionality
- Delete tests for removed features
- Rerun until all pass

**Commit:**
```bash
git add -A
git commit -m "test: fix integration tests for simplified codebase"
```

---

## Task 10.15: Final Verification Checklist

**Comprehensive checklist:**

- [ ] Dev server runs: `pnpm dev` ✓
- [ ] TypeScript clean: `pnpm type-check` ✓
- [ ] Unit tests pass: `pnpm test:unit` ✓ (or skipped if none)
- [ ] Integration tests pass: `pnpm test:integration` ✓ (or skipped if none)
- [ ] No Better-Auth code remains ✓
- [ ] No Stripe code remains ✓
- [ ] No spaces/multi-user code remains ✓
- [ ] No email sending code remains ✓
- [ ] Admin dashboard accessible ✓
- [ ] Poll creation works ✓
- [ ] Guest voting works ✓
- [ ] Admin poll management works ✓
- [ ] Google Calendar integration works ✓
- [ ] Settings simplified ✓
- [ ] CSV export works ✓
- [ ] No auth pages visible ✓
- [ ] No billing UI visible ✓

**All green?** Congratulations!

**Commit:**
```bash
git commit --allow-empty -m "test: phase 10 - comprehensive testing complete"
```

---

## Task 10.16: Create Summary Document

**Objective:** Document what was done

**File:** Create `docs/implementation/COMPLETION_SUMMARY.md`

**Content:**
```markdown
# Implementation Completion Summary

**Date:** [Today]
**Branch:** feat/cloudflare-access-simplified

## Overview
Successfully simplified Rallly for single-admin, Cloudflare Access deployment.

## Major Changes

### Removed
- Better-Auth (entirely)
- Stripe/Billing (entirely)
- Spaces/Multi-user (entirely)
- Email sending (entirely)
- "If Need Be" voting option
- Poll scheduling (scheduling feature, kept calendar event creation)
- Admin control panel
- Landing page

### Kept
- Poll creation and management
- Google Calendar integration (busy dates + event creation)
- Guest voting with email verification
- Comments on polls
- CSV export
- Timezone handling

### Architecture
- CF Access as sole authentication method
- No Rallly user management
- All admins authenticated by CF Access
- Guests identified by public invite token only

## Files Changed
- ~XX files added/modified/deleted
- ~XXXX lines added
- ~XXXX lines removed

## Testing
All tests pass:
- ✓ Dev server starts
- ✓ Admin dashboard works
- ✓ Poll creation works
- ✓ Guest voting works
- ✓ Google Calendar integration works
- ✓ Settings simplified
- ✓ TypeScript clean

## Next Steps
1. Deploy to staging with CF Access configured
2. Test with real CF Access authentication
3. Verify all deployment configurations
4. Roll to production
```

**Commit:**
```bash
git add docs/implementation/COMPLETION_SUMMARY.md
git commit -m "docs: create implementation completion summary"
```

---

## Task 10.17: Create Release Notes

**Objective:** Document changes for stakeholders

**File:** Create `RELEASE_NOTES.md`

**Content:**
```markdown
# Release Notes: Cloudflare Access Simplified Deployment

**Version:** 2.0.0 (Simplified)
**Date:** [Today]

## Overview
Rallly has been simplified for single-admin, self-hosted deployment behind Cloudflare Access.

## New Features
- Cloudflare Access integration (CF as auth provider)
- Google Calendar busy date visualization in week view
- Calendar event creation with automatic attendee invitation

## Removed Features
- User authentication (delegated to CF Access)
- Billing and tier system
- Workspaces/teams (spaces)
- Email notifications
- Password reset
- Admin control panel

## Changes for Admins
- No login required (CF Access handles it)
- Simplified settings (profile + calendars only)
- Can manage all polls from flat list
- Can create calendar events from winning poll times

## Changes for Guests
- Same voting experience
- Can verify email to edit responses
- Receive calendar invitations when event created (via Google)

## Migration Guide
For admins upgrading from previous version:
1. Back up database
2. Deploy new version
3. Run migrations
4. Configure CF Access policies
5. All data preserved (polls, votes, comments)

## Technical Details
- Built with Next.js 16 + React 19
- tRPC for API
- Prisma + PostgreSQL for database
- CF Access headers for admin identification
- Google Calendar API for events

## Support
Contact: [your contact info]
```

**Commit:**
```bash
git add RELEASE_NOTES.md
git commit -m "docs: add release notes for simplified version"
```

---

## Task 10.18: Verify Phase 10 Completion

**Final Checklist:**
- [ ] All tests pass
- [ ] All verification tasks completed
- [ ] Summary document created
- [ ] Release notes created
- [ ] Branch ready for PR

**Commit:**
```bash
git commit --allow-empty -m "docs: phase 10 - testing and validation complete"
```

---

# POST-IMPLEMENTATION

## Code Review

Before merging:
1. Push branch to GitHub:
```bash
git push origin feat/cloudflare-access-simplified
```

2. Create Pull Request with:
   - Description referencing the PRD
   - List of changes
   - Testing summary
   - Instructions for reviewer

3. Code review by team member
4. Address feedback
5. Merge to main

## Deployment

1. Tag release:
```bash
git tag -a v2.0.0 -m "Cloudflare Access Simplified Deployment"
git push origin v2.0.0
```

2. Deploy to staging
3. Test with actual CF Access
4. Deploy to production
5. Monitor for issues

## Post-Deployment

1. Update documentation for admins
2. Brief team on new features/changes
3. Monitor error logs
4. Collect feedback

---

# QUICK REFERENCE

## Command Aliases

Add these to your shell profile for faster development:

```bash
alias pnpm:test="pnpm test:unit && pnpm test:integration"
alias pnpm:check="pnpm type-check && pnpm check"
alias pnpm:dev="pnpm dev"
alias pnpm:build="pnpm build"
```

## Useful Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm type-check            # Type check only
pnpm check                 # Lint check
pnpm check:fix             # Auto-fix linting

# Testing
pnpm test:unit             # Run unit tests
pnpm test:integration      # Run integration tests

# Database
pnpm db:push               # Push schema changes
pnpm db:reset              # Reset and seed
pnpm prisma studio        # Open DB GUI

# Git
git log --oneline -20      # Recent commits
git status                 # Current status
git diff main              # Changes vs main
```

---

## Timeline Estimate

- **Phase 1-2:** 2-3 days (setup, remove auth)
- **Phase 3:** 1-2 days (CF Access integration)
- **Phase 4-5:** 3-4 days (spaces, billing removal)
- **Phase 6-7:** 2-3 days (email, poll features)
- **Phase 8-9:** 1-2 days (database, UI cleanup)
- **Phase 10:** 1-2 days (testing)

**Total:** ~2-3 weeks (accounting for breaks, reviews, issues)

---

**Good luck! Refer back to this guide as needed. Each task is self-contained and can be reviewed/merged independently.**
