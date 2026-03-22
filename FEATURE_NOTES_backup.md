# Rallly — Feature Branch Implementation Guide

> **Branch:** `feature/google-calendar-invite-improvements`
> **Base:** `main`
> **Date:** 2026-03-22
> **Purpose:** Detailed reference for developers continuing or re-implementing this work from scratch.

---

## Table of Contents

1. [Google Calendar Busy-Date Visibility in Week View](#1-google-calendar-busy-date-visibility-in-week-view)
2. [Cloudflare Access Compatibility — Admin Fallback Session](#2-cloudflare-access-compatibility--admin-fallback-session)
3. [Public Invite Page Access (Cloudflare Access Bypass)](#3-public-invite-page-access-cloudflare-access-bypass)
4. [Participant Email Verification to Edit Previous Responses](#4-participant-email-verification-to-edit-previous-responses)
5. [Bug: Wrong Email in Verify Dialog Caused Redirect to `/login`](#5-bug-wrong-email-in-verify-dialog-caused-redirect-to-login)
6. [Environment & Auth Configuration Changes](#6-environment--auth-configuration-changes)
7. [File Reference Map](#7-file-reference-map)

---

## 1. Google Calendar Busy-Date Visibility in Week View

### Background and Problem

Rallly already had a Google Calendar integration that let users connect their Google account and see **red dots** on dates that have events (month view). This was implemented via a `busyDates` array of ISO date strings returned by the `calendars.getBusyDates` tRPC query (now renamed `calendars.getEvents`).

However, when a poll creator switched to the **week view** to pick specific time slots, their existing calendar events were invisible. This made it easy to accidentally schedule a poll at a time that was already blocked. The week view showed only the poll time slots being added — a white grid with nothing from the user's calendar.

### What Was Built

When the user is in the **week view** of the poll creation form, their existing Google Calendar events appear as **blue, read-only blocks** overlaid on the time grid. Each block shows:
- The event title (truncated if long)
- The calendar it belongs to (e.g. "Personal", "Work")
- The start and end time in locale format (e.g. "10:00 AM – 11:30 AM")

Poll time slots the user is creating remain white/neutral with an X-remove button. Google Calendar events are clearly visually distinct and are **non-interactive** — clicking them does nothing.

### Architecture

The data flows from backend to frontend as follows:

```
Google Calendar API
       │
       ▼
GoogleCalendarService.listEvents()     [google-calendar.ts]
       │
       ▼
calendars.getEvents tRPC query         [calendars.ts]
  returns { busyDates[], calendarEvents[] }
       │
       ▼
PollOptionsForm useQuery hook          [poll-options-form.tsx]
  fetches for visible month window
       │
       ├─── busyDates ──► MonthCalendar (red dots, unchanged)
       │
       └─── calendarEvents ──► WeekCalendar (blue blocks, new)
```

### Implementation Details

#### Backend: `GoogleCalendarService` (`features/calendars/services/google-calendar.ts`)

The existing service already had a `listEvents` method that was unused by the busy-dates feature. It calls the Google Calendar API's `events.list` endpoint with:
- `singleEvents: true` — expands recurring events into individual instances
- `orderBy: "startTime"` — sorted chronologically
- `maxResults: 250` — cap per calendar

All-day events are detected by the presence of `item.start.date` (a date-only string) vs `item.start.dateTime` (a full ISO timestamp). For all-day events, the start time is normalised to midnight local time.

```ts
const allDay = !!item.start?.date;
const start = allDay
  ? new Date(`${item.start!.date}T00:00:00`)
  : new Date(item.start!.dateTime!);
```

#### Backend: `calendars.getEvents` tRPC query (`trpc/routers/calendars.ts`)

The query accepts `{ start: string, end: string }` — ISO timestamps for the first and last moment of the currently visible month. It:

1. Finds all `CalendarConnection` records for the current user that have at least one selected, non-deleted `ProviderCalendar`.
2. Loads the OAuth credential for each connection.
3. Creates a `GoogleCalendarService` with the stored access/refresh tokens.
4. Calls `service.listEvents()` for each selected calendar.
5. Builds two parallel outputs from the events:
   - `busyDates`: a `Set<string>` of `YYYY-MM-DD` strings. Each event spans one or more dates; all spanned dates are added. Converted to an array before returning.
   - `calendarEvents`: an array of `{ start, end, title, allDay, calendarName }` objects. `start` and `end` are ISO strings. `calendarName` comes from the `ProviderCalendar.name` field in the database (the user-facing display name from Google).

Each calendar is fetched inside a `try/catch`. If one calendar fails (e.g. revoked token), it logs the error and continues — so a broken calendar doesn't block the others.

```ts
try {
  const events = await service.listEvents({ calendarId, timeMin, timeMax });
  // process events...
} catch (err) {
  logger.error({ calendarId, error: err }, "Failed to fetch calendar events");
}
```

#### Frontend: Data Fetching (`poll-options-form.tsx`)

The `PollOptionsForm` component computes a date range for the visible month using `useMemo`:

```ts
const calendarEventsStart = useMemo(() => {
  const d = new Date(navigationDate);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}, [navigationDate.getFullYear(), navigationDate.getMonth()]);

const calendarEventsEnd = useMemo(() => {
  const d = new Date(navigationDate);
  d.setMonth(d.getMonth() + 1, 0); // last day of month
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}, [navigationDate.getFullYear(), navigationDate.getMonth()]);
```

The query is called with `staleTime: 5 * 60 * 1000` (5 minutes) so that navigating back to the same month doesn't re-fetch.

```ts
const { data: eventsData } = trpc.calendars.getEvents.useQuery(
  { start: calendarEventsStart, end: calendarEventsEnd },
  { staleTime: 5 * 60 * 1000 },
);
```

Both `busyDates` and `calendarEvents` are passed down to whichever view is active.

#### Frontend: `CalendarEvent` type (`types.ts`)

A new shared type was added to `DateTimePickerProps`:

```ts
export type CalendarEvent = {
  start: string;      // ISO string
  end: string;        // ISO string
  title: string;
  allDay: boolean;
  calendarName: string;
};

export interface DateTimePickerProps {
  // ...existing props...
  busyDates?: string[];
  calendarEvents?: CalendarEvent[];
}
```

#### Frontend: Week Calendar Rendering (`week-calendar.tsx`)

The week calendar uses `react-big-calendar`. The key design decision was to place poll events and Google Calendar events **in the same `events` array** with a discriminator flag (`isExternal: true/false`), rather than using `react-big-calendar`'s `backgroundEvents` prop. This gives full control over rendering through the `eventWrapper` component.

Two TypeScript types model the two event kinds:

```ts
type PollEvent = {
  start: Date;
  end?: Date;
  isExternal?: false;
};

type ExternalEvent = {
  start: Date;
  end: Date;
  title: string;
  calendarName: string;
  allDay: boolean;
  isExternal: true;
};

type WeekEvent = PollEvent | ExternalEvent;
```

They are merged before being passed to the calendar:

```ts
const allEvents: WeekEvent[] = [...pollEvents, ...externalEvents];
```

The `onSelectEvent` handler guards against external events being clicked:

```ts
onSelectEvent={(event) => {
  const e = event as WeekEvent;
  if (e.isExternal) return; // read-only — ignore clicks
  // remove poll slot...
}}
```

The `eventWrapper` component renders each event type differently. For external events, the blue styling is:

```tsx
<div className="absolute ml-1 flex max-h-full flex-col overflow-hidden rounded-lg
  border border-blue-200 bg-blue-50 p-1 text-blue-800 text-xs
  dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
  style={{
    top: `calc(${props.style?.top}% + 4px)`,
    height: `calc(${props.style?.height}% - 8px)`,
    left: `${props.style?.xOffset}%`,
    width: `calc(${props.style?.width}%)`,
  }}
>
  <div className="truncate font-semibold leading-tight">{e.title}</div>
  <div className="truncate opacity-60">{e.calendarName}</div>
  <div className="mt-auto opacity-50">
    {start.format("LT")} – {end.format("LT")}
  </div>
</div>
```

The positioning style uses `react-big-calendar`'s internal layout props (`top`, `height`, `xOffset`, `width`) which are passed through `props.style`.

#### The 6 AM Start Fix

The calendar previously started at midnight, wasting screen space for hours nobody schedules meetings. Adding these two props to `<CalendarTempFix>` fixes it:

```tsx
min={new Date(0, 0, 0, 6, 0, 0)}   // 6:00 AM
max={new Date(0, 0, 0, 23, 0, 0)}  // 11:00 PM
```

`new Date(0, 0, 0, ...)` creates a date on January 1, 1900 — `react-big-calendar` only reads the time components from these values.

### Known Limitations

- Only Google Calendar is supported. The `GoogleCalendarService` implements a `CalendarService` interface, so other providers (Microsoft, Apple) could be added by implementing the same interface.
- Events from calendars the user has de-selected in Rallly settings are excluded via the `isSelected: true` filter on `ProviderCalendar`.
- If a user has no connected calendar, the `getEvents` query returns `{ busyDates: [], calendarEvents: [] }` and the week view just shows an empty grid.
- The query is skipped on the server (only runs client-side) because it's a `privateProcedure` requiring a logged-in user.

---

## 2. Cloudflare Access Compatibility — Admin Fallback Session

### Background and Problem

The deployment at `schedule.vorapol.cv` uses **Cloudflare Access** (CF Access) as a network-level identity gate. CF Access authenticates users via OAuth (e.g. Google, Microsoft) before they can reach the server. Once authenticated with CF Access, users access the site — but they still have no Rallly-specific session because CF Access and Rallly's own authentication (better-auth) are entirely separate systems.

The result: authenticated CF Access users would visit their Rallly dashboard and be immediately redirected to the Rallly login page (`/login`), because `getUserSession()` returned `null` (no better-auth session cookie) and private route helpers called `redirect("/login")`.

### What Was Built

A new function `getAdminFallbackSession` was added. When there is no active better-auth session, it queries the database for the **first non-anonymous, non-banned admin user** and returns that user as the current context. This lets the app function fully as admin without requiring a Rallly login, relying solely on CF Access to gate who can reach the server.

### The Core Function (`features/user/data.ts`)

```ts
export const getUserSession = async () => {
  const session = await getSession();

  if (!session?.user) {
    return { session: null, user: undefined };
  }

  const user = session.user.isGuest
    ? createGuestDTO(session.user)
    : ((await getUser(session.user.id)) ?? undefined);

  return { session, user };
};

/**
 * Like getUserSession but falls back to the first admin user when there is
 * no active session. Use this only for private/admin routes where Cloudflare
 * Access is the external auth gate — never use it for public pages.
 */
export const getAdminFallbackSession = async () => {
  const { session, user } = await getUserSession();

  if (!user) {
    const adminUser = await prisma.user.findFirst({
      where: { role: "admin", isAnonymous: false, banned: false },
    });
    if (adminUser) {
      return { session: null, user: createUserDTO(adminUser) };
    }
  }

  return { session, user };
};
```

### Where Each Function Is Used

The key design principle is that **public pages must never use the admin fallback**, because it would give unauthenticated visitors admin-level access to poll data.

| Function | Used in | Why |
|---|---|---|
| `getUserSession` | `createPublicSSRHelper` | Invite page, public poll pages — visitors are unauthenticated guests |
| `getAdminFallbackSession` | `createPrivateSSRHelper` | Dashboard, settings, poll management pages |
| `getAdminFallbackSession` | `createAdminSSRHelper` | Admin control panel |
| `getAdminFallbackSession` | `/api/trpc/[trpc]/route.ts` | All client-side tRPC calls from the browser |

**Why the tRPC route handler also uses it:** Even if the SSR renders correctly (using admin fallback), the page's client-side JavaScript makes tRPC calls through `/api/trpc/*`. If that handler still used `getUserSession` (returning `null` for no session), then client-side queries like `polls.list` or dashboard stats would fail with UNAUTHORIZED, and the global error handler would redirect to `/login`. By applying `getAdminFallbackSession` to the API route as well, all client-side tRPC calls consistently have the admin context.

### What Can Go Wrong

- **No admin user in the database:** If `getAdminFallbackSession` finds no user matching `{ role: "admin", isAnonymous: false, banned: false }`, it returns `{ session: null, user: undefined }`. Private routes then redirect to `/login` as usual. This happens if admin setup was never completed via `/admin-setup`, or if the admin account was demoted or deleted.
- **Not a security boundary:** This feature is NOT a substitute for authentication. It only works because CF Access is already enforcing who can reach the server. Do not deploy this without CF Access (or equivalent) in front of the app.
- **Invite page must stay on `getUserSession`:** The invite page at `[locale]/(app)/invite/[urlId]/page.tsx` calls `createPublicSSRHelper`. If this were changed to `createPrivateSSRHelper`, every unauthenticated visitor to an invite link would be granted admin-level context, which would expose poll management capabilities.

---

## 3. Public Invite Page Access (Cloudflare Access Bypass)

### Background and Problem

The invite page at `/invite/[urlId]` is designed to be public — anyone with the link should be able to view a poll and submit their availability without logging in. However, with CF Access protecting the entire `schedule.vorapol.cv` domain, unauthenticated users (e.g. anyone in incognito mode, or external invitees who aren't CF Access members) see a CF Access login page instead of the poll.

Additionally, when CF Access intercepts the JavaScript bundles at `/_next/static/*`, the React app can never hydrate. The invite page uses `ssr: false` dynamic import for the actual poll UI component (`InvitePage`), meaning the server returns an HTML shell with no visible content — the poll only renders after JS loads on the client. Blocking JS = blank page.

### Required CF Access Bypass Configuration

In Cloudflare Zero Trust → Access → Applications → your application → Policies, add **Bypass** policies for the following paths (order matters — bypass must have higher priority than your Allow policy):

| Path | Reason |
|---|---|
| `/invite/*` | The invite page itself |
| `/api/*` | Client-side tRPC calls and better-auth endpoints |
| `/locales/*` | i18n translation JSON files |
| `/_next/*` | JavaScript and CSS bundles — React cannot hydrate without these |

> **Note on OAuth conflict:** Cloudflare Access with OAuth configured does not support path-level Application definitions — you get `access.api.error.invalid_request: domain can not have a path if oauth is configured`. Use Bypass policies within a single domain-level application instead of creating separate per-path applications.

### Why `/_next/*` Is Critical

The invite page is built with Next.js App Router. The poll content is rendered in a `"use client"` component loaded via:

```ts
const InvitePage = dynamic(
  () => import("./invite-page").then((mod) => mod.InvitePage),
  { ssr: false },  // ← never server-rendered
);
```

The `ssr: false` flag means the server returns HTML with no actual poll content — just a loading shell and the dehydrated React Query cache. The browser must download `/_next/static/chunks/*.js` and execute it before anything becomes visible. If CF Access returns a 302 redirect to its login page instead of the JS file, React never boots, and the user sees a blank page.

### The Middleware Rewrite

There is a Next.js middleware (`src/proxy.ts`) that prepends the detected locale to every request path:

```ts
// /invite/abc → /en/invite/abc (internally, URL bar stays the same)
newUrl.pathname = `/${locale}${pathname}`;
return NextResponse.rewrite(newUrl);
```

This means:
- The user visits `https://schedule.vorapol.cv/invite/abc` (bypassed by CF Access ✓)
- The middleware internally rewrites to `/en/invite/abc` (no second CF Access check — rewrites are server-internal)
- The Next.js route `[locale]/(app)/invite/[urlId]/page.tsx` renders

This is why testing by directly visiting `/en/invite/abc` in curl looks different from visiting `/invite/abc` — the middleware runs again and double-prepends the locale.

### Guest Voting Flow (No Login Required)

External invitees who don't have a Rallly account can still submit votes. The flow:

1. Page loads, poll data is shown (SSR-prefetched via `createPublicSSRHelper`).
2. User fills in time-slot votes.
3. User clicks submit — a dialog opens asking for their name and email.
4. On submit, `createGuestIfNeeded()` is called from `useUser()`:
   ```ts
   createGuestIfNeeded: async () => {
     if (!user) {
       await authClient.signIn.anonymous(); // creates an anonymous better-auth session
       router.refresh();
     }
   }
   ```
5. The anonymous session sets a session cookie in the browser.
6. `addParticipant.mutateAsync(...)` is called — the mutation now has a user in context (`requireUserMiddleware` passes).

This means `/api/better-auth/sign-in/anonymous` must be reachable, which is why `/api/*` must be in the CF Access bypass list.

---

## 4. Participant Email Verification to Edit Previous Responses

### Background and Problem

When a guest submits a vote on a poll, their response is linked to an **anonymous user** created by `authClient.signIn.anonymous()`. This anonymous user ID is stored as `participant.userId`. The iron-session-encrypted edit token (stored in the URL `?token=` param in notification emails) is the only way for that guest to return and edit their response.

However, if the guest:
- Lost the email with the edit link
- Is on a different device or browser
- Had their session expire

...they had no way to edit their own response. They could see their row in the participant list but had no edit capability.

The goal: allow a guest to prove ownership of a participant row by entering the **same email address** they submitted with. If it matches, grant them a temporary edit token valid for the current browser session.

### Full Implementation

#### Step 1: Backend — `verifyEmail` Mutation (`trpc/routers/polls/participants.ts`)

A new `publicProcedure` mutation was added to the participants router:

```ts
verifyEmail: publicProcedure
  .use(createRateLimitMiddleware("verify_participant_email", 10, "1 h"))
  .input(z.object({
    participantId: z.string(),
    email: z.string().email(),
  }))
  .mutation(async ({ input }) => {
    const participant = await prisma.participant.findUnique({
      where: { id: input.participantId },
      select: { id: true, email: true, userId: true, deleted: true },
    });

    if (!participant || participant.deleted) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    if (
      !participant.email ||
      participant.email.toLowerCase() !== input.email.trim().toLowerCase()
    ) {
      // Return structured result — do NOT throw. See Bug section below.
      return { matched: false, token: null, userId: null };
    }

    const token = await createParticipantEditToken(participant.userId);
    return { matched: true, token, userId: participant.userId };
  }),
```

Key decisions:
- **`publicProcedure`** — no Rallly session required. Anyone who knows a `participantId` and the correct email can verify.
- **Rate limiting** — 10 attempts per hour per IP. This prevents brute-forcing email guesses. The limiter key is `verify_participant_email:{identifier}`.
- **Case-insensitive, whitespace-trimmed comparison** — `email.toLowerCase()` vs `input.email.trim().toLowerCase()`.
- **The token** — `createParticipantEditToken(userId)` is defined in `trpc/routers/polls/utils.ts`. It creates an iron-session-encrypted payload containing the `userId`. The token is never stored in the database; it lives only in memory on the client.

#### Step 2: Extend `PermissionsContext` (`contexts/permissions.tsx`)

The context was extended to hold a **session-level edit token** — verified in-memory for the current browser session:

```ts
const PermissionsContext = React.createContext<{
  userId: string | null;
  sessionToken: string | undefined;
  setVerifiedParticipant: (userId: string, token: string) => void;
}>({
  userId: null,
  sessionToken: undefined,
  setVerifiedParticipant: () => {},
});

export const PermissionProvider = ({ children }) => {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token");

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>(undefined);

  const { data } = trpc.auth.getUserPermission.useQuery(
    { token: urlToken ?? "" },
    { enabled: !!urlToken },
  );

  const userId = data?.userId ?? sessionUserId;

  const setVerifiedParticipant = useCallback((userId: string, token: string) => {
    setSessionUserId(userId);
    setSessionToken(token);
  }, []);

  return (
    <PermissionsContext.Provider value={{ userId, sessionToken, setVerifiedParticipant }}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Hook for the dialog to call after successful verification
export const useVerifiedParticipantSetter = () =>
  useContext(PermissionsContext).setVerifiedParticipant;

// Hook for useEditToken to read the session token
export const useSessionEditToken = () =>
  useContext(PermissionsContext).sessionToken;
```

The `userId` in context can come from two sources:
1. URL `?token=` param — decoded by `trpc.auth.getUserPermission.useQuery` (existing flow for email edit links)
2. `sessionUserId` state — set by `setVerifiedParticipant` after email verification (new flow)

#### Step 3: Update `useEditToken` (`components/poll/mutations.ts`)

The `useEditToken` hook is used by all participant mutations (add, update, delete) to pass the edit token to the server. It was extended to fall back to the session token from context:

```ts
export const useEditToken = () => {
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("token") ?? undefined;
  const sessionToken = useSessionEditToken();
  return urlToken ?? sessionToken;
};
```

Priority: URL token > session token. This means if a user arrives via an email link (URL token) AND has also email-verified (session token), the URL token wins.

#### Step 4: `VerifyEmailDialog` Component (`components/poll/verify-email-dialog.tsx`)

A new dialog component handles the verification UI:

```tsx
const verifyEmail = trpc.polls.participants.verifyEmail.useMutation({
  onSuccess: (result) => {
    if (!result.matched) {
      setError("Email does not match. Please try again.");
      return;
    }
    setVerifiedParticipant(result.userId!, result.token!);
    onOpenChange(false);
    setEmail("");
    setError(null);
    onVerified(); // caller switches the row into edit mode
  },
  onError: () => {
    setError("Something went wrong. Please try again.");
  },
});
```

The dialog:
- Takes `participantId`, `participantName`, `open`, `onOpenChange`, `onVerified` as props.
- Shows the participant name in the description so the user knows whose response they are claiming.
- Supports pressing Enter to submit (via `onKeyDown`).
- Shows inline error text below the input — no toast, no redirect.
- Calls `onVerified()` on success, which the parent uses to switch the row into edit mode.

#### Step 5: Key Icon in `ParticipantRow` (`components/poll/desktop-poll/participant-row.tsx`)

The participant row now checks whether to show the verify button:

```ts
const canVerifyToEdit =
  !canEdit &&           // user doesn't already own this row
  !!participant.email && // there's an email to verify against
  poll.status === "open"; // poll must still be open

const verifyDialog = useDialog();
```

The `action` slot in `ParticipantRowView` renders conditionally:

```tsx
action={
  canEdit ? (
    <ParticipantDropdown ...>  {/* existing edit/delete menu */}
    </ParticipantDropdown>
  ) : canVerifyToEdit ? (
    <Button
      size="icon-xs"
      variant="ghost"
      onClick={() => verifyDialog.trigger()}
      title="Verify email to edit"
    >
      <Icon><KeyRoundIcon /></Icon>
    </Button>
  ) : null
}
```

The `VerifyEmailDialog` is rendered outside the `<tr>` (as a sibling in a fragment). Since the dialog uses a React Portal (`DialogPortal`), it doesn't affect the table DOM structure:

```tsx
return (
  <>
    <ParticipantRowView ... />
    {canVerifyToEdit ? (
      <VerifyEmailDialog
        {...verifyDialog.dialogProps}
        participantId={participant.id}
        participantName={participant.name}
        onVerified={() => onChangeEditMode?.(true)}
      />
    ) : null}
  </>
);
```

### Complete User Flow

```
Participant list renders
  │
  ├── Row A: owned by current user
  │     └── Shows ⋮ menu (edit/delete) — existing behaviour
  │
  └── Row B: owned by someone else, has email stored
        └── Shows 🔑 key icon button
              │
              └── User clicks key icon
                    └── VerifyEmailDialog opens
                          "Enter the email you used when submitting as [Name]"
                          │
                          ├── User enters WRONG email
                          │     └── mutate() called
                          │           └── server returns { matched: false }
                          │                 └── "Email does not match" shown inline
                          │                       (no redirect, no toast)
                          │
                          └── User enters CORRECT email
                                └── mutate() called
                                      └── server returns { matched: true, token, userId }
                                            └── setVerifiedParticipant(userId, token) stored in context
                                            └── dialog closes
                                            └── onVerified() → row enters edit mode
                                            └── All future edit mutations use token from context
```

### Security Considerations

- **Brute force protection:** Rate limiter (10 req/hr/IP) prevents systematic email guessing against a known `participantId`.
- **No server-side token storage:** The edit token is an iron-session encrypted blob. It cannot be forged without the server's `SECRET_PASSWORD`. It contains only the `userId`.
- **Session scope:** The token lives in React state (`useState`). It is lost on page refresh — the user must re-verify each session.
- **Open polls only:** `canVerifyToEdit` checks `poll.status === "open"`. Closed polls disallow editing entirely.
- **Email as the secret:** This assumes the submitter's email is not publicly visible. The `participants.list` query returns emails, but only to users who own a participant or are the poll admin (governed by `hideParticipants` setting and admin access checks). If emails were exposed publicly, the verification would be trivially bypassed.

---

## 5. Bug: Wrong Email in Verify Dialog Caused Redirect to `/login`

### Root Cause

The initial implementation of `verifyEmail` threw a `TRPCError` with code `"UNAUTHORIZED"` when the supplied email didn't match:

```ts
// ❌ Original — causes redirect to /login
throw new TRPCError({ code: "UNAUTHORIZED", message: "Email does not match" });
```

The global tRPC error handler in `TRPCProvider` (`trpc/client/provider.tsx`) intercepts **every** tRPC error from every query and mutation globally:

```ts
queryCache: new QueryCache({ onError: handleError }),
mutationCache: new MutationCache({ onError: handleError }),

function handleError(error: Error) {
  switch (error.data?.code) {
    case "UNAUTHORIZED":
      authClient.signOut().finally(() => {
        window.location.href = "/login"; // ← user gets sent to login page
      });
      break;
    // ...
  }
}
```

Critically, **`MutationCache.onError` fires for all mutation errors regardless of whether they are caught locally in the component.** Even if the component's `onError` callback handles the error, the global cache handler still fires. So wrapping `mutate()` in a try/catch does not help.

The result: entering a wrong email → `UNAUTHORIZED` TRPCError thrown → global handler fires → `signOut()` → `window.location.href = "/login"`. The user gets signed out and sent to the login page just for a typo.

### The Fix

Instead of throwing, return a **discriminated union result object**:

```ts
// ✅ Fixed — wrong email returns structured data, no error thrown
if (!emailMatches) {
  return { matched: false, token: null, userId: null };
}
const token = await createParticipantEditToken(participant.userId);
return { matched: true, token, userId: participant.userId };
```

The component then checks `result.matched` in `onSuccess` — no tRPC error is ever thrown, so no global handler fires:

```ts
onSuccess: (result) => {
  if (!result.matched) {
    setError("Email does not match. Please try again.");
    return; // show inline error, done
  }
  // proceed with verified state...
}
```

### General Rule for Future Development

Do not use `UNAUTHORIZED` (or any tRPC error code) for **expected user-facing validation errors** in mutations. The global error handler treats `UNAUTHORIZED` as a session expiry and performs a forced logout. Use structured return types for expected failure states (wrong password, wrong email, etc.), and reserve `TRPCError` for genuine system errors (NOT_FOUND, INTERNAL_SERVER_ERROR) or actual permission failures.

The full mapping of error codes in the global handler:

| Code | Global behaviour |
|---|---|
| `UNAUTHORIZED` | `signOut()` → redirect to `/login` |
| `FORBIDDEN` | Toast: "You are not allowed to perform this action" |
| `NOT_FOUND` | Toast: "The resource was not found" |
| `TOO_MANY_REQUESTS` | Toast: "You are making too many requests" |
| `PAYLOAD_TOO_LARGE` | Toast: "The file you uploaded is too large" |
| `PAYMENT_REQUIRED` | Toast: "You need to upgrade to perform this action" |
| `SERVICE_UNAVAILABLE` | Toast: "The service required is not available" |
| *(default)* | Toast: "An internal server error occurred" |

---

## 6. Environment & Auth Configuration Changes

### New Environment Variables

Two new variables were added to `src/env.ts`:

#### `REQUIRE_EMAIL_VERIFICATION`
- **Type:** `"true" | "false"`
- **Default:** `"true"`
- **Purpose:** Controls whether better-auth requires new users to verify their email address before their account is active. For self-hosted deployments without an email server configured, set this to `"false"` to allow accounts to be created and used immediately.
- **Where used:** `lib/auth.ts` — `requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION !== "false"`

#### `TRUSTED_ORIGINS`
- **Type:** `string` (comma-separated list of URLs)
- **Default:** *(unset)*
- **Purpose:** Additional origins that better-auth will accept requests from. Useful when the app is behind a reverse proxy or accessed via multiple domains (e.g. both `https://schedule.vorapol.cv` and a direct IP). Without this, better-auth may reject requests whose `Origin` header doesn't match the configured `baseURL`.
- **Where used:** `lib/auth.ts` — `trustedOrigins: env.TRUSTED_ORIGINS?.split(",").map(o => o.trim()) ?? []`

### `lib/auth.ts` Changes

```ts
const extraTrustedOrigins = env.TRUSTED_ORIGINS
  ? env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
  : [];

export const authLib = betterAuth({
  appName: "Rallly",
  secret: env.SECRET_PASSWORD,
  trustedOrigins: extraTrustedOrigins,
  // ...
  emailAndPassword: {
    requireEmailVerification: env.REQUIRE_EMAIL_VERIFICATION !== "false",
    // ...
  },
});
```

---

## 7. File Reference Map

Complete list of all files changed in this branch, grouped by feature area:

### Google Calendar Week View

| File | Type | Description |
|---|---|---|
| `features/calendars/services/google-calendar.ts` | Modified | Added `listEvents()` method to `GoogleCalendarService` using Google Calendar API |
| `trpc/routers/calendars.ts` | Modified | Added `getEvents` query returning both `busyDates[]` and `calendarEvents[]` |
| `components/forms/poll-options-form/types.ts` | Modified | New `CalendarEvent` type; added `busyDates` and `calendarEvents` to `DateTimePickerProps` |
| `components/forms/poll-options-form/poll-options-form.tsx` | Modified | Computes date window, calls `getEvents` query, passes both arrays to active view |
| `components/forms/poll-options-form/week-calendar.tsx` | Modified | `ExternalEvent` type, merged `events` array, blue `eventWrapper`, 6 AM `min` |
| `components/forms/poll-options-form/month-calendar/month-calendar.tsx` | Modified | Wires `busyDates` prop through to red-dot rendering |

### Cloudflare Access Compatibility

| File | Type | Description |
|---|---|---|
| `features/user/data.ts` | Modified | New `getAdminFallbackSession()` exported alongside existing `getUserSession()` |
| `trpc/server/create-ssr-helper.ts` | Modified | `createPrivateSSRHelper` and `createAdminSSRHelper` use `getAdminFallbackSession` |
| `app/api/trpc/[trpc]/route.ts` | Modified | tRPC route handler uses `getAdminFallbackSession` for client-side call context |

### Participant Email Verification

| File | Type | Description |
|---|---|---|
| `trpc/routers/polls/participants.ts` | Modified | Added `verifyEmail` mutation with rate limiting; returns `{ matched, token, userId }` |
| `contexts/permissions.tsx` | Modified | Extended with `sessionToken`, `sessionUserId`, `setVerifiedParticipant`; new hooks |
| `components/poll/mutations.ts` | Modified | `useEditToken` reads from URL param first, then context session token |
| `components/poll/verify-email-dialog.tsx` | **Created** | Dialog UI for email verification with inline error handling |
| `components/poll/desktop-poll/participant-row.tsx` | Modified | `canVerifyToEdit` logic; key icon button; mounts `VerifyEmailDialog` |

### Auth & Environment Configuration

| File | Type | Description |
|---|---|---|
| `lib/auth.ts` | Modified | `requireEmailVerification` from env; `trustedOrigins` from env |
| `lib/oauth/server.ts` | Modified | Calendar OAuth server-side flow helpers |
| `lib/oauth/types.ts` | Modified | Type additions for OAuth credentials |
| `app/api/integrations/[...connection]/route.ts` | Modified | Integration connection route updates for calendar OAuth |
| `settings/calendars/components/connect-calendar-dropdown.tsx` | Modified | Calendar connection UI |
| `env.ts` | Modified | `REQUIRE_EMAIL_VERIFICATION` and `TRUSTED_ORIGINS` definitions |
| `docker-compose.yml` | Modified | Environment variable wiring for self-hosted container |
