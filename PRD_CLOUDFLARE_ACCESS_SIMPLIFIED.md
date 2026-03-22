# Product Requirements Document (PRD)
## Rallly — Cloudflare Access Simplified Deployment

**Status:** Draft
**Version:** 1.0
**Date:** 2026-03-22
**Target Audience:** Development team reimplementing core features for simplified, single-admin deployment

---

## 1. EXECUTIVE SUMMARY

This PRD outlines the simplification of Rallly for a **single-admin, self-hosted deployment behind Cloudflare Access**. The goal is to strip away multi-user SaaS features while preserving core poll creation, scheduling, and calendar integration capabilities.

**Key Philosophy:** Cloudflare Access (CF Access) handles authentication and authorization. Rallly no longer manages users, passwords, billing, teams, or email notifications. It becomes a pure **meeting scheduling tool** for a single decision-maker.

---

## 2. DEPLOYMENT ARCHITECTURE

### 2.1 Authentication Model

**Current state (main branch):**
- Better-Auth with email/password, Google OAuth, Microsoft OAuth
- User registration, login pages, password reset flows
- Multi-user support with spaces (workspaces)

**New state (simplified):**
- **Remove all Rallly authentication** — CF Access is the sole auth gateway
- No login page, no registration, no password reset
- No email/password auth, no OAuth
- No user management pages/settings
- All requests reaching Rallly already authenticated by CF

### 2.2 Admin vs Guest Distinction

**Admin Users:**
- Anyone who successfully authenticates through **Cloudflare Access policy**
- Has access to:
  - Dashboard with poll list
  - Poll creation page
  - Poll management (edit, delete, close)
  - Participant data management
  - Google Calendar integration (view busy dates, add event)
  - Settings (timezone, preferences)

**Guest Users:**
- Anyone with a public invite link to a poll
- Cloudflare Access **does NOT block** invite links (CF policy bypass for `/invite/*` routes)
- Has access to:
  - View poll options
  - Add/edit own votes with name + email
  - View results (based on poll settings)
  - Verify email to edit previous responses
  - Leave comments on poll

**Key Implication:** No session-based login. CF headers or auth tokens determine if user is admin. Guests identified by invite token only.

### 2.3 Cloudflare Access Integration Points

**Routes blocked by CF Access (admin only):**
- `/dashboard` and all subroutes (`/polls`, `/events`)
- `/new` (create poll)
- `/poll/[id]` for editing and admin functions
- `/settings/*`
- `/api/trpc/*` (private tRPC routes)

**Routes bypassed by CF Access (public):**
- `/invite/[urlId]` (guest voting)
- `/api/trpc/*` for public/guest mutations (add participant, add comment)
- `/_next/*` (Next.js static assets)
- `/locales/*` (i18n translation files)
- `/api/integrations/*` (calendar OAuth callbacks)

**Implementation detail:**
- Use `getAdminFallbackSession()` from feature branch (converts CF headers to Rallly session)
- Guests use public invitation tokens instead of user sessions

---

## 3. FEATURE SCOPE

### 3.1 Polls — Core Features (KEEP)

#### Poll Creation
- **Title, description, location** — required fields
- **Date/Time Options:**
  - Date-only polls (single-day selections)
  - Time slot polls (start + end time)
  - Configurable slot duration (default 60 minutes)
- **Calendar View Options:**
  - Month view with date picker + time range selector
  - Week view with drag-to-select slots (from feature branch)
  - **Timezone selection** — stored per poll, affects all participant times
- **Settings:**
  - Hide participant names (yes/no)
  - Hide score counts (yes/no)
  - Require email from participants (yes/no — default yes for calendar invites)
  - Disable comments (yes/no)

#### Poll Management (Admin Only)
- **Edit Poll Details:** Title, location, description
- **Edit Poll Options:** Add/remove time slots after creation
- **Edit Poll Settings:** Toggle visibility & feature toggles
- **Close/Reopen:** Toggle poll status (open ↔ closed)
- **Delete Poll:** Soft delete (with confirmation)
- **View Participants:** Full list with voting records
- **Edit Participant Responses:**
  - Admin can edit any participant's votes
  - Admin can add new participant records (name + email + votes)
  - Admin can delete participant records
- **Export to CSV:** Participant names + votes
- **View/Edit Comments:** Delete or reply to comments

#### Poll Lifecycle
- **Open:** Accepting new participants and vote changes
- **Closed:** No new participants, but can still view results
- Transition: Manual toggle by admin, or automatic on event creation

**Removed from scope:**
- Poll scheduling/finalization (see Section 3.3 below)
- Poll duplication
- Poll pause state
- Draft polls
- Anonymous voting

### 3.2 Voting & Participant Management

#### Participant Addition (Guest-Facing)
- Guest enters **name + email** (email required for verification + calendar invites)
- Guest selects votes for each time slot: **Yes / No only** (remove "If Need Be")
- System checks if email already voted on poll
  - If yes: shows "verify to edit" flow
  - If no: adds as new participant

#### Vote Options
- **Yes** — Available / can attend
- **No** — Not available / cannot attend
- Participants can change votes anytime poll is open

#### Email Verification for Editing (Guest Flow)
- Guest enters email address
- System sends **no email** (email verification is local)
- Guest receives an encrypted edit token (stored in session, lost on page refresh)
- Guest can edit their previous responses on the poll
- **Rate limited:** 10 attempts per hour per IP

#### Participant Row Management (Admin-Facing)
- Desktop: Fixed-left table with participant names, scrollable vote columns
- Mobile: Dropdown selector per participant, option cards below
- Admin can:
  - Edit any participant's votes in-place
  - Delete participant row (soft delete)
  - Add new participant row manually
  - Verify/sign another guest's email to edit on their behalf

#### Results Display
- Vote counts per option (if show scores enabled)
- Participant names (if show participants enabled)
- Conditional voting can be visualized (yes count always visible for sorting)

**Removed from scope:**
- Anonymous voting
- Voting notifications

### 3.3 Calendar Integration

#### Google Calendar Busy Dates (Week View)
- Admin connects Google Calendar in settings
- When creating/editing poll options in week view:
  - Admin's busy calendar events display as **blue, read-only blocks**
  - Shows event title, calendar name, time range
  - Helps admin avoid scheduling conflicts with their own calendar
- **No polling of participant calendars** — only admin's calendar

#### Google Calendar Event Creation
- Admin selects winning time slot on the poll
- System calls **Google Calendar API** to create event:
  - Event title = poll title
  - Event time = selected time slot (converted to admin's timezone)
  - Attendees = all participant emails from poll
  - Description = poll link + admin message (optional)
- **No email sent by Rallly** — Google Calendar API adds attendees and they receive invites from Google
- Event created in admin's selected calendar (default or user-chosen)
- Poll automatically **closes** after event creation

#### Calendar Connection Setup
- Admin visits settings → calendars
- Clicks "Connect Google Calendar"
- OAuth flow to authorize Google account
- Stores Google auth token securely
- Can disconnect/reconnect calendar

**Removed from scope:**
- Multiple calendar provider support (Google only for now)
- Auto-sync polling from participant calendars
- ICS file downloads
- Add-to-calendar buttons for other providers

### 3.4 Comments on Polls (KEEP)
- Participants (admin + guests) can leave comments
- Comments displayed in chronological order
- Admin can delete comments
- Comments visible to all viewers
- No email notifications for new comments
- Use case: participants request additional info, make suggestions, clarify availability

**Removed from scope:**
- Comment editing
- @mentions in comments
- Comment notifications

---

## 4. PAGES & NAVIGATION

### 4.1 User-Facing Pages

#### Unauthenticated / Guest Routes
- **`/invite/[urlId]`** — Public poll voting page (no CF Access block)
  - Intro/header showing poll title & description
  - Display current participants + results
  - Guest form to add/verify participation
  - Comments section
  - "Copy invite link" button in header

#### Admin Routes (Behind CF Access)
- **`/dashboard`** — Dashboard home with stats
  - Total polls created
  - Upcoming events (scheduled polls with confirmed date)
  - Recent activity feed (optional)

- **`/polls`** — List all polls
  - Filters: active, closed, archived
  - Search by title
  - Display: title, participant count, status, created date, actions (edit, delete, close)
  - "Create new poll" button

- **`/events`** — List scheduled events
  - Only polls with created calendar events
  - Display: event title, date/time, attendee count, actions (view, cancel event)

- **`/new`** — Create new poll
  - Multi-step form: details → options → settings → review → create
  - Uses updated poll creation flow from codebase

- **`/poll/[id]`** — View & manage single poll
  - Tabs/sections:
    - **Results:** Participant table + vote visualization
    - **Options:** Add/edit/remove time slots
    - **Settings:** Poll configuration
    - **Comments:** Comment feed + reply area
    - **Schedule:** (If poll open) Select winning time + create calendar event

- **`/poll/[id]/edit-details`** — Edit title, location, description
- **`/poll/[id]/edit-options`** — Edit time slots (week/month view)
- **`/poll/[id]/edit-settings`** — Edit visibility & feature toggles

- **`/settings`** — Admin preferences
  - Profile section (name, timezone, locale, time format, theme)
  - Calendar connection (Google Calendar OAuth)
  - Delete account (wipe all data)

### 4.2 Navigation Structure

#### Top Navigation Bar
- **Rallly Logo** → `/dashboard`
- **Search** (search polls by title)
- **Create Poll Button** → `/new`
- **Settings Icon** → `/settings`
- **Sign Out Button** (if CF Access integration includes logout)

#### Sidebar (Desktop Only)
- **Dashboard** → `/dashboard`
- **Polls** → `/polls`
- **Events** → `/events`
- **Create Poll** → `/new` (button)
- **Settings** → `/settings`

#### Mobile Navigation
- Bottom navigation bar (or hamburger menu)
- Same items as sidebar, optimized for mobile

**Removed from scope:**
- Space switcher
- Member management
- Upgrade/billing buttons
- Feedback form
- Admin control panel
- User management

---

## 5. REMOVED FEATURES & CLEANUP

### 5.1 Completely Remove

#### Authentication & User Management
- [ ] `/login` page and routes
- [ ] `/register` page and routes
- [ ] `/forgot-password` and `/reset-password` flows
- [ ] `/login/verify` email OTP flow
- [ ] Better-Auth user signup/login mutations
- [ ] User registration, email verification, password reset emails
- [ ] All `auth.*` tRPC routes
- [ ] Settings → Security (password management)
- [ ] Settings → Notifications (email preferences)

#### Multi-User / Spaces
- [ ] `Space` model and all space-related tRPC
- [ ] `/settings/spaces` page
- [ ] `/settings/members` page
- [ ] Space dropdown in header
- [ ] Space creation on signup
- [ ] Space invitation flow (`/accept-invite/[inviteId]`)
- [ ] `spaceId` from polls (or make it always null for simplicity)
- [ ] Space permissions / CASL space-level rules
- [ ] Member roles (admin/member)

#### Billing & Tier System
- [ ] Stripe integration
- [ ] `/settings/billing` page
- [ ] `tier` field on spaces (hobby/pro)
- [ ] Pro-only features (scheduling, duplication)
- [ ] Subscription checks in middleware
- [ ] Billing status in database
- [ ] Feature gates for billing-dependent features

#### Admin Control Panel
- [ ] `/control-panel` and all subroutes
- [ ] User management page
- [ ] License key management
- [ ] Branding configuration
- [ ] Instance settings
- [ ] Admin-only database tables & queries

#### Email Infrastructure
- [ ] Email client setup (Resend, SendGrid, etc.)
- [ ] Email templates (welcome, reset, notifications, etc.)
- [ ] Email sending mutations
- [ ] Email notification preferences
- [ ] Transactional email jobs
- [ ] SMTP/mail service environment variables

#### Poll Features to Remove
- [ ] Poll duplication
- [ ] Poll scheduling (replaced with direct calendar creation)
- [ ] "If Need Be" / conditional availability vote option
- [ ] Poll pause state (use open/closed only)
- [ ] Anonymous guest accounts (no `isAnonymous` flag)
- [ ] Guest data persistence via cookie
- [ ] Poll mute toggle (notifications removed)

#### Calendar Features to Remove
- [ ] Multiple calendar provider support (keep Google only)
- [ ] ICS/iCal export
- [ ] Add-to-calendar buttons
- [ ] Participant calendar polling/sync
- [ ] Busy date display from participant calendars

#### Landing Page
- [ ] `/apps/landing/` entire directory (or repurpose as login redirect)
- [ ] Marketing content
- [ ] Feature descriptions for SaaS

#### Other Pages
- [ ] `/quick-create` (feature flag)
- [ ] `/setup` page
- [ ] `/admin-setup` page

### 5.2 Code Cleanup Checklist

**Remove dependencies/packages:**
- [ ] Remove email clients (Resend, SendGrid) from package.json
- [ ] Remove Stripe SDK from package.json
- [ ] Remove Better-Auth (replace with CF Access headers)
- [ ] Remove PostHog if not needed (or keep for analytics if desired)

**Update environment variables:**
- [ ] Remove `STRIPE_*` vars
- [ ] Remove `RESEND_API_KEY`, `SENDGRID_API_KEY`
- [ ] Remove `NEXT_PUBLIC_ALLOW_REGISTRATION`
- [ ] Remove `EMAIL_LOGIN_ENABLED`
- [ ] Add `CLOUDFLARE_ACCESS_HEADER` var (to read CF headers)
- [ ] Keep `CALENDARS_ENABLED = true` (hardcode if preferred)
- [ ] Keep `NEXT_PUBLIC_SELF_HOSTED = true` (hardcode)

**Database schema cleanup:**
- [ ] Remove `Space` table (or keep as legacy if risky)
- [ ] Remove `SpaceMember` table
- [ ] Remove `SpaceMemberInvite` table
- [ ] Remove subscription-related fields from user
- [ ] Remove `tier` field from remaining models
- [ ] Remove email notification preference tables
- [ ] Keep `User` table minimal (id, email, name, timezone, locale, createdAt, updatedAt)

**tRPC cleanup:**
- [ ] Remove `auth.*` router entirely
- [ ] Remove `spaces.*` router entirely
- [ ] Remove `user.*` mutations (leave queries for profile display)
- [ ] Remove billing-gated procedures (delete `proProcedure`, `spaceOwnerProcedure`, etc.)
- [ ] Keep `publicProcedure`, `privateProcedure` (redefine without spaces)

**Middleware cleanup:**
- [ ] Remove auth pages middleware
- [ ] Remove space context middleware
- [ ] Remove subscription checking middleware
- [ ] Replace with CF Access header checking middleware

---

## 6. AUTHENTICATION & AUTHORIZATION (CF ACCESS INTEGRATION)

### 6.1 How CF Access Works in This Context

**Cloudflare Zero Trust policies handle:**
- Which users can reach which routes
- Where authentication happens (CF, not Rallly)
- Session management (CF tokens, not Rallly cookies)

**Rallly's new role:**
- Read CF headers to identify authenticated user
- Determine if user is admin (any CF-authenticated user)
- Determine if user is guest (by invite token)
- Handle authorization within app (who can edit which polls)

### 6.2 CF Access Headers

When a user authenticates via CF Access, Rallly receives headers (configurable in CF):
- `CF-Access-Authenticated-User-Email` — authenticated user's email
- `CF-Access-Authenticated-User-UUID` — unique CF user ID
- `CF-Access-JWT` — signed JWT token (optional, can verify)

**Implementation:**
- Create helper function `getAdminUserFromCFHeaders(req)` in `/apps/web/src/features/user/data.ts`
- Extract email/ID from headers
- Return admin user DTO
- Use in private tRPC routes + server components

### 6.3 Guest Authorization

Guests identified by **public invite token** on poll:
- `/invite/[urlId]` — token embedded in URL
- Token verifies guest can view/vote on that specific poll
- No CF Access authentication required

**Implementation:**
- Keep existing `permissions` context from feature branch
- Use poll's `participantUrlId` or custom token
- Decrypted token → poll ID + guest permissions

### 6.4 Admin vs Guest Distinction

**Admin Identification:**
```typescript
// Read CF headers
const cfUserEmail = req.headers.get('CF-Access-Authenticated-User-Email');
if (cfUserEmail) {
  // Admin — authenticated through CF Access
  return { role: 'admin', email: cfUserEmail, isGuest: false };
}

// Guest — invite token only
const inviteToken = searchParams.get('token');
if (inviteToken) {
  // Guest — accessing via public invite
  return { role: 'guest', email: null, isGuest: true };
}

// No auth — reject (only for public invite routes)
return null;
```

### 6.5 Removing Better-Auth

**Current auth flow (will be removed):**
1. User clicks login
2. Enters email or clicks Google/Microsoft
3. Better-Auth creates session
4. Session stored in cookie/Redis
5. User logged in to Rallly

**New auth flow:**
1. User tries to access Rallly (e.g., `https://rallly.example.com/polls`)
2. Cloudflare Access intercepts request
3. If not authenticated:
   - Redirects to CF login page (SAML, SSO, email magic link, etc.)
   - User authenticates via CF identity provider
4. CF adds headers to request
5. Rallly reads headers and grants access
6. User sees `/polls` page as authenticated

**No Rallly login page needed** — CF handles all authentication.

---

## 7. DATABASE SCHEMA (Simplified)

### 7.1 Core Tables to Keep

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  timeZone          String   @default("UTC")
  locale            String   @default("en")
  dateFormat        String   @default("MMM DD, YYYY")
  theme             String   @default("system")

  polls             Poll[]
  participants      Participant[]
  comments          Comment[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Poll {
  id                String   @id @default(cuid())
  adminUrlId        String   @unique
  participantUrlId  String   @unique

  title             String
  description       String?
  location          String?

  creator           User     @relation(fields: [createdBy], references: [id], onDelete: Cascade)
  createdBy         String

  status            String   @default("open") // "open" | "closed"
  timeZone          String   @default("UTC")

  hideParticipants  Boolean  @default(false)
  hideScores        Boolean  @default(false)
  disableComments   Boolean  @default(false)
  requireEmail      Boolean  @default(true)

  options           Option[]
  participants      Participant[]
  comments          Comment[]

  scheduledEventId  String? // Google Calendar event ID

  deletedAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Option {
  id                String   @id @default(cuid())
  poll              Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId            String

  startTime         DateTime
  endTime           DateTime

  createdAt         DateTime @default(now())
}

model Participant {
  id                String   @id @default(cuid())
  poll              Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId            String

  name              String
  email             String

  user              User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  userId            String?

  votes             Vote[]
  comments          Comment[]

  deletedAt         DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Vote {
  id                String   @id @default(cuid())
  option            Option   @relation(fields: [optionId], references: [id], onDelete: Cascade)
  optionId          String

  participant       Participant @relation(fields: [participantId], references: [id], onDelete: Cascade)
  participantId     String

  answer            String   // "yes" | "no"

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([optionId, participantId])
}

model Comment {
  id                String   @id @default(cuid())
  poll              Poll     @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId            String

  author            User?    @relation(fields: [userId], references: [id], onDelete: SetNull)
  userId            String?

  participant       Participant? @relation(fields: [participantId], references: [id], onDelete: SetNull)
  participantId     String?

  content           String

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model GoogleCalendarConnection {
  id                String   @id @default(cuid())
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId            String

  email             String   // Google account email
  refreshToken      String   // Encrypted
  accessToken       String?  // Encrypted
  expiresAt         DateTime?

  isDefault         Boolean  @default(false)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 7.2 Tables to Remove

- [ ] `Account` (NextAuth/Better-Auth)
- [ ] `Session` (NextAuth/Better-Auth)
- [ ] `VerificationToken` (password reset, email verification)
- [ ] `Space`
- [ ] `SpaceMember`
- [ ] `SpaceMemberInvite`
- [ ] `Subscription`
- [ ] `UserNotificationPreferences`
- [ ] Any billing-related tables

---

## 8. API CHANGES (tRPC)

### 8.1 tRPC Procedures (Simplified)

**Remove:**
- `auth.*` router (login, signup, logout, password reset, etc.)
- `user.*` mutations (profile updates, email change, etc.)
- `spaces.*` router (create, list, manage members)
- All `proProcedure` / `spaceOwnerProcedure` / `adminProcedure` (system admin)

**Keep & Simplify:**
```typescript
// 1. Admin-only procedures (CF Access authenticated)
const adminProcedure = privateProcedure.use(async (opts) => {
  // Verify CF headers present
  const cfUser = opts.ctx.cfUser;
  if (!cfUser) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return opts.next();
});

// 2. Public procedures (guests via invite token)
const publicProcedure = publicProcedure;

// 3. Poll-level authorization (admin + guest participation)
const pollProcedure = publicProcedure.input(z.object({ pollId: z.string() }))
  .use(async (opts) => {
    // Check: is user admin OR guest with invite token?
    // Store poll in context for use
    return opts.next({ ctx: { ...opts.ctx, poll } });
  });
```

### 8.2 tRPC Routes to Keep

#### Polls Router
- `polls.make` — Create new poll (admin only)
- `polls.modify` — Update poll details (admin only)
- `polls.get` — Get poll details (admin + guests)
- `polls.list` — List admin's polls (admin only)
- `polls.close` / `polls.reopen` — Toggle status (admin only)
- `polls.delete` — Delete poll (admin only)
- `polls.schedule` — Create calendar event from winning option (admin only)

#### Participants Router
- `polls.participants.add` — Add participant + votes (guest)
- `polls.participants.update` — Update votes (guest + admin)
- `polls.participants.delete` — Delete participant (admin only)
- `polls.participants.get` — Get participant list (admin + guests)
- `polls.participants.verifyEmail` — Verify email to edit (guest)

#### Comments Router
- `polls.comments.add` — Add comment (admin + guests)
- `polls.comments.delete` — Delete comment (admin only)
- `polls.comments.list` — List poll comments (admin + guests)

#### Calendars Router
- `calendars.connect` — OAuth callback for Google Calendar (admin only)
- `calendars.list` — Get admin's connected calendars (admin only)
- `calendars.getEvents` — Get busy dates from calendar (admin only)
- `calendars.disconnect` — Unlink calendar (admin only)

#### User Router (Minimal)
- `user.getProfile` — Get admin's profile (admin only)
- `user.updateProfile` — Update name, timezone, locale (admin only)

### 8.3 Removed tRPC Routes
- All `auth.*` routes
- All `spaces.*` routes
- All user management routes
- All billing routes
- All notification preference routes

---

## 9. IMPLEMENTATION PRIORITIES

### Phase 1: Authentication & Cleanup (Critical)
1. Remove Better-Auth integration
2. Implement CF Access header reading
3. Remove auth pages (/login, /register, etc.)
4. Remove spaces/multi-user code
5. Remove billing/pro tier code
6. Update database schema (drop unnecessary tables)
7. Simplify tRPC procedures

### Phase 2: Feature Simplification (Core)
1. Remove poll duplication
2. Remove poll scheduling (keep only calendar event creation)
3. Simplify vote options (yes/no only)
4. Simplify poll lifecycle (open/closed)
5. Clean up poll management UI (remove tier-gated features)

### Phase 3: Calendar Integration (Must-Have)
1. Ensure Google Calendar week view busy dates work (from feature branch)
2. Implement calendar event creation (create event on winning slot)
3. Ensure participant emails are collected and used for invites
4. Test Google Calendar OAuth flow

### Phase 4: Email Removal (Important)
1. Remove all email infrastructure
2. Remove email notification preferences
3. Remove transactional email templates
4. Update calendar event creation to NOT send email via Rallly (Google Calendar handles it)

### Phase 5: UI/UX Cleanup (Polish)
1. Remove space switcher
2. Remove settings tabs (security, notifications, members, billing)
3. Simplify navigation (remove admin control panel)
4. Update landing page or replace with app redirect
5. Test guest flow with email verification

### Phase 6: Testing & Validation (Essential)
1. Test admin flow: create poll → edit options → schedule event
2. Test guest flow: receive invite → vote → verify email → edit
3. Test calendar integration: busy dates visible → event created
4. Test comments: add/delete comments work
5. Load test with realistic participant count

---

## 10. OPEN QUESTIONS & CLARIFICATIONS

### Resolved ✓
- [x] Admin count: Single admin
- [x] Guest email collection: Yes (for calendar invites + verification)
- [x] Google Calendar week view: Must-have
- [x] Poll sharing: Copy link only
- [x] Spaces: Remove entirely
- [x] Poll status: Open/closed
- [x] Admin poll management: Edit details, options, delete participants, add participants
- [x] Landing page: Remove
- [x] SaaS code: Strip all billing/pro tier
- [x] Email sending: Remove all (except calendar API invites)
- [x] Comments: Keep
- [x] Vote options: Yes/No only
- [x] Poll option editing: Admin can add/remove slots
- [x] Control panel: Remove
- [x] Timezone: Keep

### Potential Follow-Ups (If Needed)

1. **Poll Results Visualization:** Currently shows vote counts + participant names. Should results show:
   - A visual grid/heatmap of votes?
   - Sorted by "yes" count (most available times first)?
   - Color-coded (green for yes, red for no)?

2. **Edit Timestamp Tracking:** When admin edits a poll or participant, should the change be logged with:
   - Who edited it (admin email)?
   - When it was edited?
   - What changed?

3. **Invite Link Regeneration:** If a poll link leaks, can admin regenerate the invite URL?
   - Or just delete poll and recreate?

4. **Participant Duplicate Prevention:** What happens if two guests vote with same email?
   - Current: Offered "verify to edit" flow
   - Should we block or merge?

5. **Comment Moderation:** Can admin edit comments (just text), or only delete them?
   - Current PRD says admin can delete; edit not mentioned.

6. **Timezone Edge Cases:** When admin changes poll timezone after participants voted:
   - Do participant times shift?
   - Or just future options use new timezone?

---

## 11. SUCCESS CRITERIA

- [ ] No login/register/auth pages visible
- [ ] All admin routes require CF Access authentication (transparent redirect if not authenticated)
- [ ] Guest invite links work without CF Access blocking
- [ ] Admin can create, edit, delete polls
- [ ] Admin can view/manage participants (add, delete, edit votes)
- [ ] Guests can vote without account
- [ ] Guests can verify email to edit previous votes
- [ ] Google Calendar integration shows admin's busy dates in week view
- [ ] Calendar event creation works with participant emails
- [ ] Poll comments work (add/delete)
- [ ] Yes/No voting only (no "If Need Be")
- [ ] No emails sent by Rallly (only Google Calendar API invites)
- [ ] No spaces/multi-user features visible
- [ ] No billing/upgrade UI anywhere
- [ ] Database migration removes unnecessary tables
- [ ] All tests pass
- [ ] No console errors or warnings

---

## 12. DEPLOYMENT NOTES

### Cloudflare Access Configuration (Out of Scope for PRD)

Your CF Access policy must:
1. Protect `/dashboard`, `/polls`, `/events`, `/new`, `/poll/*`, `/settings/*`
2. Allow `/invite/*` publicly (no CF Access)
3. Allow `/api/*` publicly for guest mutations + calendar OAuth callbacks
4. Allow `/_next/*`, `/locales/*`, static assets

**Header Configuration:**
- Ensure CF sends `CF-Access-Authenticated-User-Email` header to your app
- Configure which identity providers authenticate users (SAML, OIDC, etc.)

### Environment Variables (New)

```env
# Remove old:
# STRIPE_*
# RESEND_API_KEY
# NEXT_PUBLIC_ALLOW_REGISTRATION
# EMAIL_LOGIN_ENABLED

# Keep/add:
NEXT_PUBLIC_SELF_HOSTED=true
CALENDARS_ENABLED=true
CF_ACCESS_HEADER_ENABLED=true
CF_ACCESS_EMAIL_HEADER=CF-Access-Authenticated-User-Email
```

### Database Migration

After code changes, run:
```bash
pnpm db:migrate   # Create migration to drop old tables
pnpm db:push      # Push schema to dev database
pnpm db:reset     # Seed with initial data (if needed)
```

---

## 13. DOCUMENT METADATA

**Document Type:** Product Requirements Document (PRD)
**Audience:** Development team, architect
**Status:** Draft (awaiting clarification on open questions)
**Next Step:** Review, clarify open questions, lock requirements, begin implementation

---

**Questions?** Please add notes to this document or ask for clarifications on any section.
