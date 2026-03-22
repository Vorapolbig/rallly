import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { getEventsChronological } from "@/features/scheduled-event/data";
import { privateProcedure, router } from "../trpc";

export const events = router({
  infiniteList: privateProcedure
    .input(
      z.object({
        status: z
          .enum(["upcoming", "past", "unconfirmed", "canceled"])
          .optional(),
        search: z.string().optional(),
        member: z.string().optional(),
        cursor: z.number().optional().default(1),
        limit: z.number().max(100).optional().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor: page, limit: pageSize, status, search, member } = input;

      const result = await getEventsChronological({
        status,
        search,
        member,
        page,
        pageSize,
        userId: ctx.user.id,
      });

      let nextCursor: number | undefined;
      if (result.hasNextPage) {
        nextCursor = page + 1;
      }

      return {
        events: result.events,
        nextCursor,
        hasNextPage: result.hasNextPage,
        total: result.total,
      };
    }),

  cancel: privateProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const event = await prisma.scheduledEvent.findFirst({
        where: { id: input.eventId, userId: ctx.user.id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      // Atomically update only if not already canceled to ensure idempotency
      await prisma.scheduledEvent.updateMany({
        where: {
          id: input.eventId,
          status: { not: "canceled" },
        },
        data: {
          status: "canceled",
          sequence: { increment: 1 },
        },
      });
    }),
});
