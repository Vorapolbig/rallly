# Testing Guide
## Development & Testing Workflow for Implementation Tasks

**Version:** 1.0
**Audience:** Junior/mid-level engineer implementing the simplified deployment
**Prerequisites:** Docker, pnpm, Node.js 18+

---

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Testing Workflow](#testing-workflow)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [Manual Testing](#manual-testing)
6. [Docker-Based Testing](#docker-based-testing)
7. [Debugging Tips](#debugging-tips)
8. [Test Writing Examples](#test-writing-examples)

---

## Development Environment Setup

### 1. Initial Setup (One-Time)

```bash
# Clone and enter project
cd ~/Projects/rallly

# Install dependencies
pnpm install

# Setup environment files
cp .env.development .env

# Start Docker containers (database + services)
pnpm docker:up

# Wait 30 seconds for database to be ready
sleep 30

# Generate Prisma client
pnpm db:generate

# Setup database
pnpm db:reset

# Verify setup
pnpm type-check
pnpm dev &
# Wait for server to start, then Ctrl+C
```

### 2. Daily Development Startup

```bash
# Start in one terminal
pnpm docker:up

# In another terminal, start dev server
pnpm dev

# In a third terminal (if running tests), run test watcher
pnpm test:unit --watch
```

### 3. Verify Setup Works

**Steps:**
1. Visit `http://localhost:3000/dashboard` in browser
2. Should load without errors
3. Check browser console (F12) — no errors

**Expected output:**
```
✓ Dev server running on http://localhost:3000
✓ Database connected
✓ TypeScript compiling
✓ No console errors
```

---

## Testing Workflow

### The Core Workflow for Every Task

Every task follows this workflow:

```
1. CREATE FEATURE BRANCH (if not already done)
   └─ git checkout -b feat/cloudflare-access-simplified

2. IMPLEMENT CODE CHANGES
   ├─ Edit files per task instructions
   └─ Ensure TypeScript compiles: pnpm type-check

3. WRITE/UPDATE TESTS
   ├─ Create test file (if doesn't exist)
   ├─ Write test cases for your changes
   └─ See "Test Writing Examples" below

4. RUN TESTS
   ├─ Run unit tests: pnpm test:unit
   ├─ Run integration tests: pnpm test:integration (if applicable)
   ├─ All tests must PASS ✓
   └─ If fails: debug and fix code, rerun tests

5. MANUAL TESTING (For UI/Integration Changes)
   ├─ Start dev server: pnpm dev
   ├─ Manually test in browser
   ├─ Verify expected behavior
   └─ Check console for errors

6. COMMIT CHANGES
   └─ git commit -m "feat: [task description]" (only after tests pass)

7. PUSH TO BRANCH
   └─ git push origin feat/cloudflare-access-simplified

8. REPEAT FOR NEXT TASK
```

### Commit & Push Rules

**GOLDEN RULE: Only commit when tests pass**

```bash
# ✅ CORRECT WORKFLOW
$ pnpm test:unit
# All tests pass
$ pnpm type-check
# No errors
$ git commit -m "feat: remove auth pages"
$ git push origin feat/cloudflare-access-simplified

# ❌ WRONG
# Don't commit with failing tests
# Don't push without committing tests
# Don't write code without planning tests first
```

---

## Unit Testing

### Running Unit Tests

```bash
# Run all unit tests once
pnpm test:unit

# Run tests in watch mode (re-runs on file changes)
pnpm test:unit --watch

# Run specific test file
pnpm test:unit apps/web/src/features/user/cf-access.test.ts

# Run tests matching pattern
pnpm test:unit --grep "CF Access"

# Run with coverage
pnpm test:unit --coverage
```

### Test File Location

Unit tests are co-located with source code:
```
src/
├─ features/
│  ├─ user/
│  │  ├─ cf-access.ts       <- Source
│  │  └─ cf-access.test.ts  <- Test (NEXT TO SOURCE)
│  └─ ...
├─ lib/
│  ├─ auth.ts
│  └─ auth.test.ts          <- Test here
└─ ...
```

### Creating a Unit Test

**File:** `apps/web/src/features/user/cf-access.test.ts`

**Template:**
```typescript
import { describe, it, expect } from "vitest";
import { getAdminUserFromCFHeaders } from "./cf-access";

describe("CF Access Helper", () => {
  it("should extract admin user from CF headers", async () => {
    // Arrange: Set up test data
    const mockEmail = "admin@example.com";
    const mockUuid = "test-uuid-123";

    // Act: Execute the function
    // (You'll need to mock headers for this — see mock examples below)

    // Assert: Verify the result
    expect(result).toEqual({
      email: mockEmail,
      id: mockUuid,
      isAdmin: true,
    });
  });

  it("should return null if CF headers are missing", async () => {
    // Test with no headers
    const result = await getAdminUserFromCFHeaders();
    expect(result).toBeNull();
  });
});
```

### Mocking Headers in Tests

For testing functions that read CF Access headers:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { headers } from "next/headers";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("CF Access Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract admin user from CF headers", async () => {
    // Create mock headers
    const mockHeaders = new Map([
      ["CF-Access-Authenticated-User-Email", "admin@example.com"],
      ["CF-Access-Authenticated-User-UUID", "test-uuid-123"],
      ["CF-Access-Authenticated-User-Name", "Admin User"],
    ]);

    // Mock the headers() function
    vi.mocked(headers).mockReturnValue(
      Object.assign(mockHeaders, {
        get: (key: string) => mockHeaders.get(key),
      })
    );

    // Call the function
    const result = await getAdminUserFromCFHeaders();

    // Verify result
    expect(result).toEqual({
      email: "admin@example.com",
      id: "test-uuid-123",
      name: "Admin User",
      isAdmin: true,
    });
  });
});
```

---

## Integration Testing

### Running Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm test:integration apps/web/tests/auth.spec.ts

# Run with headed browser (see what's happening)
pnpm test:integration --headed

# Run single test
pnpm test:integration --grep "should allow guest to vote"
```

### Integration Test Setup

Integration tests use **Playwright** and test full user flows.

**File location:**
```
apps/web/tests/
├─ test-utils.ts              <- Test helpers
├─ auth.spec.ts               <- Auth flow tests
├─ poll-creation.spec.ts       <- Poll creation tests
└─ ...
```

### Creating an Integration Test

**File:** `apps/web/tests/poll-creation.spec.ts`

**Template:**
```typescript
import { test, expect } from "@playwright/test";
import { setupTestUser, createTestPoll } from "./test-utils";

test.describe("Poll Creation", () => {
  test("admin should be able to create a poll", async ({ page, context }) => {
    // Arrange: Set up admin user (with CF Access headers)
    await setupTestUser(context, {
      email: "admin@example.com",
      uuid: "test-uuid",
    });

    // Act: Navigate to poll creation
    await page.goto("http://localhost:3000/new");

    // Fill in poll details
    await page.fill('[placeholder="Poll Title"]', "Team Meeting");
    await page.fill('[placeholder="Description"]', "Q1 Planning");

    // Add time slot
    await page.click('button:has-text("Add Time Slot")');
    await page.fill('[placeholder="Date"]', "03/24/2026");
    await page.fill('[placeholder="Start Time"]', "2:00 PM");
    await page.fill('[placeholder="End Time"]', "3:00 PM");

    // Create poll
    await page.click('button:has-text("Create Poll")');

    // Assert: Verify poll was created
    await expect(page).toHaveURL(/\/poll\/.*$/);
    await expect(page.locator('h1')).toContainText("Team Meeting");
  });

  test("guest should not be able to access poll creation", async ({ page }) => {
    // Act: Try to access poll creation without auth
    await page.goto("http://localhost:3000/new");

    // Assert: Should be redirected or see error
    // (Depends on CF Access behavior)
    expect(page.url()).not.toContain("/new");
  });
});
```

### test-utils.ts Helpers

Common utilities for integration tests:

```typescript
import { BrowserContext, Page } from "@playwright/test";

/**
 * Set up test user with CF Access headers
 */
export async function setupTestUser(
  context: BrowserContext,
  user: { email: string; uuid: string; name?: string }
) {
  // Add CF Access headers to all requests in this context
  await context.addInitRoute((route) => {
    const headers = route.request().headers();
    headers["CF-Access-Authenticated-User-Email"] = user.email;
    headers["CF-Access-Authenticated-User-UUID"] = user.uuid;
    if (user.name) {
      headers["CF-Access-Authenticated-User-Name"] = user.name;
    }
    route.continue({ headers });
  });
}

/**
 * Create a test poll in the database
 */
export async function createTestPoll(data: {
  title: string;
  createdBy: string;
  options: { startTime: Date; endTime: Date }[];
}) {
  // Use tRPC client or direct DB call
  // (Implementation depends on your setup)
  return {
    id: "test-poll-123",
    ...data,
  };
}

/**
 * Clean up test data after test
 */
export async function cleanupTestData(pollId: string) {
  // Delete poll from test database
}
```

---

## Manual Testing

### When to Do Manual Testing

Manual testing is needed for:
- **UI/Visual changes** — Check layouts, colors, spacing
- **User flows** — Multi-step processes (create → edit → close poll)
- **External integrations** — Google Calendar OAuth, CF Access headers
- **Browser-specific behavior** — Responsive design, mobile vs desktop

### Manual Testing Checklist

For every feature, manually test:

```
[ ] Feature works in development
[ ] No console errors (F12 → Console)
[ ] No network errors (F12 → Network)
[ ] Responsive on mobile (DevTools → Toggle device toolbar)
[ ] Works in Chrome, Firefox, Safari
[ ] Error states work (e.g., empty form, network failure)
[ ] Loading states display correctly
[ ] Success messages appear
```

### Browser DevTools Tips

**F12 (Open DevTools):**
- **Console tab** — Check for JavaScript errors (red ✗)
- **Network tab** — Check API calls, look for 4xx/5xx errors
- **Application tab** → Cookies → Check CF Access headers are set
- **Performance tab** — Check page load time

**Common debugging:**
```javascript
// In browser console:
localStorage.getItem('auth-token')      // Check if stored
window.__CF_HEADERS__                    // Check CF headers (if available)
```

---

## Docker-Based Testing

### When to Use Docker Testing

Use Docker when:
- You need a **clean database** for testing
- Running **integration tests** that interact with DB
- Testing **email functionality** (with Mailpit)
- Testing **multiple scenarios** without side effects
- Running on **CI/CD pipeline**

### Docker Test Setup

**1. Start Test Database Container**

```bash
# Option A: Use existing docker-compose for testing
docker-compose -f docker-compose.test.yml up -d

# Option B: Spin up fresh database
docker run --name rallly-test-db \
  -e POSTGRES_DB=rallly_test \
  -e POSTGRES_PASSWORD=testpass \
  -p 5433:5432 \
  postgres:15 &

# Wait for database to be ready
sleep 10
```

**2. Run Tests Against Test Database**

```bash
# Set test database URL
export DATABASE_URL="postgresql://postgres:testpass@localhost:5433/rallly_test"

# Run migrations on test DB
pnpm db:push

# Run integration tests
pnpm test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
# Or: docker stop rallly-test-db && docker rm rallly-test-db
```

### Docker Compose for Testing

**File:** `docker-compose.test.yml`

```yaml
version: "3.8"

services:
  test-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: rallly_test
      POSTGRES_PASSWORD: testpass
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  test-mailpit:
    # Optional: For testing email (if needed)
    image: axllent/mailpit:latest
    ports:
      - "1025:1025"
      - "8025:8025"
```

**Usage:**
```bash
# Start
docker-compose -f docker-compose.test.yml up -d

# Wait for healthy
docker-compose -f docker-compose.test.yml ps
# Should show "healthy" status

# Run tests
export DATABASE_URL="postgresql://postgres:testpass@localhost:5433/rallly_test"
pnpm test:integration

# Stop
docker-compose -f docker-compose.test.yml down
```

---

## Debugging Tips

### TypeScript Compilation Errors

```bash
# Check for type errors
pnpm type-check

# Get more details
pnpm tsc --noEmit

# Fix automatically (if possible)
pnpm check:fix
```

**Common errors & fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'xyz'` | Import of deleted file | Remove import or recreate file |
| `Property 'x' does not exist on type 'Y'` | Using removed property | Remove usage or re-add property |
| `Type 'X' is not assignable to type 'Y'` | Type mismatch | Check types match or adjust |

### Test Failures

```bash
# Run test with verbose output
pnpm test:unit --reporter=verbose

# Run single test file
pnpm test:unit src/features/user/cf-access.test.ts

# Run with debug output
DEBUG=* pnpm test:unit

# Inspect test (pause execution)
# Add this in test: test.only() to run only that test
test.only("should...", async () => {
  // Test pauses here, check browser/console
});
```

**Common test failures & fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| `Mock not implemented` | Missing mock setup | Add mock before test |
| `Timeout` | Test takes too long | Increase timeout or optimize |
| `Expected to find element` | Element not on page | Wait longer or check selector |
| `Database error` | DB not running | Ensure `pnpm docker:up` is running |

### Debug Database Issues

```bash
# Open Prisma Studio (GUI for database)
pnpm prisma studio

# Reset database to clean state
pnpm db:reset

# Run specific migration
pnpm db:migrate deploy

# Check current schema
pnpm prisma db execute --stdin <<EOF
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
EOF
```

### Network & API Debugging

```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check tRPC endpoint
curl -X POST http://localhost:3000/api/trpc/polls.list \
  -H "Content-Type: application/json"

# Check with headers (simulating CF Access)
curl -X POST http://localhost:3000/api/trpc/polls.list \
  -H "CF-Access-Authenticated-User-Email: admin@example.com" \
  -H "CF-Access-Authenticated-User-UUID: test-uuid"
```

---

## Test Writing Examples

### Example 1: Test CF Access Header Extraction

**File:** `apps/web/src/features/user/cf-access.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { headers } from "next/headers";
import { getAdminUserFromCFHeaders } from "./cf-access";

vi.mock("next/headers");

describe("getAdminUserFromCFHeaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should extract admin user from CF headers", async () => {
    const mockHeaders = new Map([
      ["CF-Access-Authenticated-User-Email", "admin@example.com"],
      ["CF-Access-Authenticated-User-UUID", "uuid-123"],
      ["CF-Access-Authenticated-User-Name", "Admin User"],
    ]);

    vi.mocked(headers).mockReturnValue({
      get: (key: string) => mockHeaders.get(key),
    } as any);

    const result = await getAdminUserFromCFHeaders();

    expect(result).toEqual({
      email: "admin@example.com",
      id: "uuid-123",
      name: "Admin User",
      isAdmin: true,
    });
  });

  it("should return null if email header is missing", async () => {
    const mockHeaders = new Map([
      ["CF-Access-Authenticated-User-UUID", "uuid-123"],
    ]);

    vi.mocked(headers).mockReturnValue({
      get: (key: string) => mockHeaders.get(key),
    } as any);

    const result = await getAdminUserFromCFHeaders();
    expect(result).toBeNull();
  });
});
```

**Run test:**
```bash
pnpm test:unit cf-access.test.ts
# ✓ should extract admin user from CF headers
# ✓ should return null if email header is missing
```

---

### Example 2: Test Poll Creation Integration Test

**File:** `apps/web/tests/poll-creation.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Poll Creation Flow", () => {
  test("admin should create a poll with time slots", async ({ page }) => {
    // Setup: Mock CF Access headers via context
    await page.context().addInitRoute((route) => {
      const headers = route.request().headers();
      headers["CF-Access-Authenticated-User-Email"] = "admin@example.com";
      headers["CF-Access-Authenticated-User-UUID"] = "test-uuid";
      route.continue({ headers });
    });

    // Navigate to creation page
    await page.goto("http://localhost:3000/new");

    // Fill poll details
    await page.fill('input[name="title"]', "Team Sync");
    await page.fill('textarea[name="description"]', "Q1 Planning");

    // Select week view
    await page.click('button:has-text("Week View")');

    // Add time slot by dragging
    const calendar = page.locator('[data-testid="week-calendar"]');
    await calendar.dragTo(calendar, {
      sourcePosition: { x: 100, y: 100 },
      targetPosition: { x: 100, y: 150 },
    });

    // Submit
    await page.click('button:has-text("Create Poll")');

    // Verify success
    await expect(page).toHaveURL(/\/poll\/\w+$/);
    await expect(page.locator("h1")).toContainText("Team Sync");
  });

  it("should show error if title is empty", async ({ page }) => {
    // Setup CF headers
    await page.context().addInitRoute((route) => {
      const headers = route.request().headers();
      headers["CF-Access-Authenticated-User-Email"] = "admin@example.com";
      headers["CF-Access-Authenticated-User-UUID"] = "test-uuid";
      route.continue({ headers });
    });

    await page.goto("http://localhost:3000/new");

    // Try to submit without title
    await page.click('button:has-text("Create Poll")');

    // Verify error message
    await expect(page.locator('[role="alert"]')).toContainText("Title is required");
  });
});
```

**Run test:**
```bash
pnpm test:integration poll-creation.spec.ts

# Option: Run with browser visible
pnpm test:integration --headed poll-creation.spec.ts
```

---

### Example 3: Test tRPC Router

**File:** `apps/web/src/trpc/routers/polls.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMsw } from "@/test-utils";
import { tRPC } from "@/trpc";

describe("Polls Router", () => {
  let caller: any;
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      user: {
        id: "user-123",
        email: "admin@example.com",
        isGuest: false,
      },
      isAdmin: true,
    };

    caller = tRPC.createCaller(mockCtx);
  });

  it("should create a poll", async () => {
    const result = await caller.polls.make({
      title: "Team Meeting",
      description: "Q1 Planning",
      options: [
        {
          startTime: new Date("2026-03-24T14:00:00"),
          endTime: new Date("2026-03-24T15:00:00"),
        },
      ],
    });

    expect(result).toHaveProperty("id");
    expect(result.title).toBe("Team Meeting");
    expect(result.createdBy).toBe("user-123");
  });

  it("should list admin's polls", async () => {
    // Create test poll first
    const poll = await caller.polls.make({
      title: "Test Poll",
      options: [],
    });

    // List polls
    const polls = await caller.polls.list();

    expect(polls).toContainEqual(
      expect.objectContaining({ id: poll.id, title: "Test Poll" })
    );
  });

  it("should deny access if not admin", async () => {
    mockCtx.isAdmin = false;

    expect(() => caller.polls.make({ title: "Test" })).rejects.toThrow(
      "UNAUTHORIZED"
    );
  });
});
```

**Run test:**
```bash
pnpm test:unit polls.test.ts
```

---

### Example 4: Test Component

**File:** `apps/web/src/components/poll/manage-poll.test.tsx`

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ManagePollDropdown } from "./manage-poll";

describe("ManagePollDropdown", () => {
  const mockPoll = {
    id: "poll-123",
    title: "Test Poll",
    status: "open",
  };

  const mockOnDelete = vi.fn();
  const mockOnClose = vi.fn();

  it("should render manage button", () => {
    render(
      <ManagePollDropdown
        poll={mockPoll}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByRole("button", { name: /manage/i })).toBeInTheDocument();
  });

  it("should show menu options when clicked", async () => {
    render(
      <ManagePollDropdown
        poll={mockPoll}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /manage/i }));

    expect(screen.getByText("Edit Details")).toBeInTheDocument();
    expect(screen.getByText("Close Poll")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should call onClose when close poll is clicked", async () => {
    render(
      <ManagePollDropdown
        poll={mockPoll}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /manage/i }));
    fireEvent.click(screen.getByText("Close Poll"));

    expect(mockOnClose).toHaveBeenCalledWith("poll-123");
  });
});
```

**Run test:**
```bash
pnpm test:unit manage-poll.test.tsx
```

---

## Test Coverage Report

After tests pass, check coverage:

```bash
# Generate coverage report
pnpm test:unit --coverage

# Output shows:
# ✓ Statements: 85%
# ✓ Branches: 80%
# ✓ Functions: 90%
# ✓ Lines: 85%
```

**Goal:** Aim for 70%+ coverage on modified code.

---

## CI/CD Integration (Future)

When setting up CI/CD pipeline, use:

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: rallly_test
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm type-check
      - run: pnpm test:unit
      - run: pnpm test:integration
```

---

## Quick Reference

### Essential Commands

```bash
# Development
pnpm docker:up              # Start database
pnpm dev                    # Start dev server
pnpm type-check             # Type check

# Testing
pnpm test:unit              # Run unit tests
pnpm test:unit --watch      # Watch mode
pnpm test:integration       # Run integration tests

# Database
pnpm db:reset               # Reset to clean state
pnpm db:push                # Apply schema changes
pnpm prisma studio          # Open database GUI

# Git
git add .                   # Stage changes
git commit -m "msg"         # Commit (only after tests pass!)
git push origin branch-name # Push to branch
```

### Test File Checklist

Before committing any code:

```
✓ Unit tests written for logic changes
✓ Integration tests written for flow changes
✓ Manual testing done for UI changes
✓ All tests passing: pnpm test:unit && pnpm test:integration
✓ TypeScript clean: pnpm type-check
✓ No console errors in browser
✓ Changes are minimal and focused
✓ Commit message is clear and descriptive
✓ Push to feature branch: git push origin feat/...
```

---

**Happy testing!**
