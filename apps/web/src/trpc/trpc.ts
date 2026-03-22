import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { AppError } from "@/lib/errors";
import { createRatelimit } from "@/lib/rate-limit";
import type { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        appError:
          error.cause instanceof AppError ? error.cause.code : undefined,
      },
    };
  },
});

export const router = t.router;

export const middleware = t.middleware;

export const publicProcedure = t.procedure;

// This procedure guarantees that a user will exist in the context
export const requireUserMiddleware = middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "This method requires a user",
    });
  }

  if (ctx.user.banned) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your account has been banned",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

// All CF Access authenticated users are treated as authenticated
export const privateProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user || ctx.user.isGuest !== false) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Login is required",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const adminProcedure = privateProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next();
});

export const createRateLimitMiddleware = (
  name: string,
  requests: number,
  duration: "1 m" | "1 h",
) => {
  const ratelimit = createRatelimit(requests, duration);

  return middleware(async ({ ctx, next }) => {
    if (ctx.event) {
      ctx.event.rateLimiter = ratelimit?.name ?? "none";
    }

    if (!ratelimit) {
      return next();
    }

    if (!ctx.identifier) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get identifier",
      });
    }

    const { success, remainingPoints } = await ratelimit.limit(
      `${name}:${ctx.identifier}`,
    );

    if (ctx.event) {
      ctx.event.rateLimiterRemainingPoints = remainingPoints;
    }

    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests",
      });
    }

    return next();
  });
};

export const mergeRouters = t.mergeRouters;
