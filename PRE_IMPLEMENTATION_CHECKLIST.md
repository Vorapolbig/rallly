# Pre-Implementation Checklist
## Before You Start Coding (Follow This Exactly)

**Time needed:** 1–2 hours (first time only)
**Skip if:** You've already completed this setup

---

## ✅ System Requirements

Check that you have:

- [ ] **Node.js 18+** installed
  ```bash
  node --version
  # Should show v18.x.x or higher
  ```

- [ ] **pnpm** installed
  ```bash
  pnpm --version
  # Should show 8.x.x or higher
  # If not: npm install -g pnpm
  ```

- [ ] **Docker** installed and running
  ```bash
  docker --version
  # Should show Docker version 20.x or higher

  docker ps
  # Should list containers (may be empty)
  ```

- [ ] **Git** installed
  ```bash
  git --version
  # Should show git version 2.x or higher
  ```

- [ ] **Code editor** with TypeScript support (VS Code recommended)
  ```bash
  # Open directory:
  code ~/Projects/rallly
  ```

---

## 📖 Read Documentation First

Before writing any code, read these in order:

- [ ] `README_IMPLEMENTATION.md` (this folder)
  - ⏱️ Time: 10 min
  - Why: Overview of all materials

- [ ] `PRD_CLOUDFLARE_ACCESS_SIMPLIFIED.md`
  - ⏱️ Time: 30 min
  - Why: Understand requirements

- [ ] `TESTING_QUICK_REFERENCE.md`
  - ⏱️ Time: 5 min
  - Why: Keep open while coding

- [ ] `TESTING_GUIDE.md` → "Development Environment Setup"
  - ⏱️ Time: 15 min
  - Why: Set up dev environment

**Total reading time: ~1 hour**

---

## 🔧 Setup Development Environment

### Step 1: Navigate to Project

```bash
cd ~/Projects/rallly
```

### Step 2: Install Dependencies

```bash
# This may take 5–10 minutes
pnpm install

# Verify installation
pnpm list --depth=0
# Should show: @rallly/web, @rallly/landing, @rallly/database, etc.
```

**If you get errors:**
- Make sure pnpm is installed: `npm install -g pnpm`
- Try clearing cache: `pnpm install --force`
- Check Node version: `node --version` (should be 18+)

### Step 3: Setup Environment File

```bash
# Create .env file
cp .env.development .env

# Verify file was created
cat .env
# Should show DATABASE_URL and other config
```

### Step 4: Start Docker Database

```bash
# Start containers (PostgreSQL)
pnpm docker:up

# Wait 30 seconds for database to start
sleep 30

# Verify database is running
docker ps

# Should show:
# - postgres (database)
# - Optionally: mailpit (for email testing)
```

**If containers don't start:**
- Check Docker is running: `docker ps`
- Check disk space: `docker system df`
- Restart Docker Desktop if on Mac/Windows

### Step 5: Generate Prisma Client

```bash
# Generate Prisma client from schema
pnpm db:generate

# You should see: ✔ Generated Prisma Client
```

### Step 6: Setup Database Schema

```bash
# This creates tables and applies migrations
pnpm db:reset

# You should see:
# ✔ Database has been reset
# ✔ Seed script completed
```

**If you get database error:**
- Check Docker is still running: `docker ps`
- Check database connection: `pnpm prisma db execute --stdin` (test query)
- Try reset again: `pnpm db:reset`

### Step 7: Verify TypeScript Setup

```bash
# Check TypeScript compiles
pnpm type-check

# Should show: ✔ No TypeScript errors
```

**If you get TypeScript errors:**
- Make sure step 5 (pnpm db:generate) completed
- Try again: `pnpm type-check`

---

## ✅ Test Development Server

### Step 1: Start Dev Server

```bash
# Open a new terminal and run:
pnpm dev

# Wait for output like:
# ✔ Ready in 3.5s
# ✔ compiled client and server successfully
#
# → Local: http://localhost:3000
```

**If server doesn't start:**
- Check port 3000 is available: `lsof -i :3000`
- Kill process on port: `kill -9 $(lsof -t -i:3000)`
- Try starting again: `pnpm dev`

### Step 2: Test in Browser

```bash
# Open browser to:
http://localhost:3000/dashboard
```

**Expected:** Dashboard loads without errors

**If you see errors:**
- Check browser console (F12)
- Look for red ✗ errors
- Check server console for logs
- See TESTING_GUIDE.md → "Debugging Tips"

### Step 3: Verify No Auth Errors

**Should NOT see:**
- ❌ 401 Unauthorized
- ❌ "Please login" message
- ❌ Redirect to /login

**Should see:**
- ✅ Dashboard page
- ✅ Sidebar with Polls, Events, Create buttons
- ✅ No console errors

---

## ✅ Test Unit Tests

```bash
# In a third terminal, run:
pnpm test:unit

# Should output:
# ✓ [test file] (N tests)
# ✓ [another test file] (M tests)
# =====================
# PASS  12 tests passed
```

**If tests fail:**
- Check database is running: `docker ps`
- Reset database: `pnpm db:reset`
- Run again: `pnpm test:unit`

---

## ✅ Test Integration Tests

```bash
# Run integration tests
pnpm test:integration

# Should output:
# ✓ All integration tests passed
# ✓ X tests in Y files
```

**If integration tests fail:**
- They test with real browser, may take 1–2 min
- Check browser is supported (Chrome recommended)
- See TESTING_GUIDE.md → "Integration Testing"

---

## 🔀 Create Feature Branch

```bash
# Make sure you're on main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/cloudflare-access-simplified

# Verify you're on new branch
git branch -v
# Should show: * feat/cloudflare-access-simplified
```

---

## 📋 Verify Setup Checklist

Before proceeding, verify:

### ✅ System Setup
- [ ] Node.js 18+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Docker running (`docker ps`)
- [ ] Git installed (`git --version`)
- [ ] Code editor open with project

### ✅ Project Setup
- [ ] Dependencies installed: `pnpm install` ✓
- [ ] .env file created: `cat .env` ✓
- [ ] Docker containers running: `docker ps` shows postgres ✓
- [ ] Database setup: `pnpm db:reset` completed ✓
- [ ] Prisma client generated: `pnpm db:generate` ✓

### ✅ Development Ready
- [ ] TypeScript compiles: `pnpm type-check` ✓
- [ ] Dev server starts: `pnpm dev` shows "Ready in XXs" ✓
- [ ] Dashboard loads: http://localhost:3000/dashboard opens ✓
- [ ] No console errors: F12 console is clean ✓

### ✅ Testing Ready
- [ ] Unit tests run: `pnpm test:unit` shows passing tests ✓
- [ ] Integration tests run: `pnpm test:integration` completes ✓

### ✅ Git Ready
- [ ] On feature branch: `git branch` shows feat/cloudflare-access-simplified ✓
- [ ] No uncommitted changes: `git status` is clean ✓

### ✅ Documentation Read
- [ ] README_IMPLEMENTATION.md ✓
- [ ] PRD_CLOUDFLARE_ACCESS_SIMPLIFIED.md ✓
- [ ] TESTING_QUICK_REFERENCE.md bookmarked ✓
- [ ] TESTING_GUIDE.md → Development Environment Setup ✓

---

## 🚀 Ready to Start!

If all checkboxes are ✓, you're ready to start implementing.

**Next step:** Open `IMPLEMENTATION_GUIDE.md` → **Task 1.1**

---

## 🆘 Troubleshooting

### "docker: command not found"
**Solution:** Docker not installed or not in PATH
```bash
# Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Or check Docker is in PATH: which docker
```

### "pnpm: command not found"
**Solution:** pnpm not installed globally
```bash
npm install -g pnpm
```

### "postgres container won't start"
**Solution:** Port 5432 already in use
```bash
# Find process: lsof -i :5432
# Kill it: kill -9 [PID]
# Or use different port in docker-compose.yml
```

### "Database connection failed"
**Solution:** Database not ready yet
```bash
# Wait longer: sleep 30
# Then try again: pnpm db:reset

# Or check logs:
docker logs postgres
```

### "TypeScript errors on pnpm type-check"
**Solution:** Prisma client not generated
```bash
pnpm db:generate
pnpm type-check
```

### "Tests timeout"
**Solution:** Tests are slow on first run
```bash
# Just means your machine is slow
# They'll be faster next time
# If really stuck: see TESTING_GUIDE.md → Debugging
```

### "Port 3000 already in use"
**Solution:** Dev server already running
```bash
# Find process: lsof -i :3000
# Kill it: kill -9 [PID]
# Or close other terminal running pnpm dev
```

---

## 📞 Need Help?

1. **Read the error message** carefully
2. **Check TESTING_GUIDE.md** → "Debugging Tips"
3. **Try the troubleshooting** section above
4. **Google the error message**
5. **Ask in Slack** (if team available)

---

## ⏱️ Timeline

**If everything works smoothly:**
- Installation: 5 min
- Database setup: 5 min
- Tests running: 5 min
- **Total: ~20 min**

**If you hit issues:**
- Troubleshooting: 20–60 min
- **Total: 1–2 hours**

**Give yourself 2 hours for this first time.**

---

## ✨ Success Indicator

You're done when:

```bash
# Terminal 1: Showing "Ready in XXs"
pnpm dev

# Terminal 2: Showing "PASS"
pnpm test:unit

# Browser: Showing dashboard with no errors
http://localhost:3000/dashboard
```

**All three running with no errors = SUCCESS ✓**

---

**You're ready! Open IMPLEMENTATION_GUIDE.md and start Task 1.1.**

🚀
