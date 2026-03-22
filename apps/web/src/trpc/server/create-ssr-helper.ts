import { createServerSideHelpers } from "@trpc/react-query/server";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import superjson from "superjson";
import { getUserSession } from "@/features/user/data";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";
import { isInitialAdmin } from "@/utils/is-initial-admin";
import type { TRPCContext } from "../context";
import { appRouter } from "../routers";

/**
 * Public Server-Side Helper
 * @description Use for prefetching data with optional session context.
 * Includes the session if available but does not require authentication.
 * Note: Using this makes the page dynamic (not cached).
 * @see https://trpc.io/docs/client/nextjs/server-side-helpers#1-internal-router
 */
export const createPublicSSRHelper = cache(async () => {
  const { user } = await getUserSession();

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
    } satisfies TRPCContext,
    transformer: superjson,
  });
});

/**
 * Private Server-Side Helper
 * @description Use for prefetching data that requires a logged-in (non-guest) user.
 * CF Access handles authentication - if no user is present, redirect to CF Access login.
 */
export const createPrivateSSRHelper = cache(async () => {
  const { user } = await getUserSession();

  if (!user || user.isGuest) {
    // CF Access handles auth - redirect to CF Access login endpoint
    redirect("/cdn-cgi/access/login");
  }

  if (user.banned) {
    throw new InvalidSessionError();
  }

  return createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
    } satisfies TRPCContext,
    transformer: superjson,
  });
});

/**
 * Admin Server-Side Helper
 * @description Use for prefetching data that requires an admin user.
 * With CF Access, all authenticated users are admins.
 */
export const createAdminSSRHelper = cache(async () => {
  const { user } = await getUserSession();

  if (!user || user.isGuest) {
    redirect("/cdn-cgi/access/login");
  }

  if (user.banned) {
    throw new InvalidSessionError();
  }

  if (user.role !== "admin") {
    if (isInitialAdmin(user.email)) {
      redirect("/admin-setup");
    }

    notFound();
  }

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {
      user,
    } satisfies TRPCContext,
    transformer: superjson,
  });

  return { helpers, user };
});
