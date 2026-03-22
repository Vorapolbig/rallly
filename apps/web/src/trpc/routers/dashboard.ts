import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { dayjs } from "@/lib/dayjs";
import { privateProcedure, router } from "../trpc";

export const dashboard = router({
  stats: privateProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const todayStart = dayjs()
      .tz(ctx.user.timeZone ?? "UTC")
      .startOf("day")
      .toDate();

    const upcomingEventsWhere: Prisma.ScheduledEventWhereInput = {
      userId: ctx.user.id,
      deletedAt: null,
      status: "confirmed",
      OR: [
        { allDay: false, start: { gte: now } },
        { allDay: true, start: { gte: todayStart } },
      ],
    };

    const [openPollCount, upcomingEventCount] = await Promise.all([
      prisma.poll.count({
        where: {
          userId: ctx.user.id,
          status: "open",
          deleted: false,
        },
      }),
      prisma.scheduledEvent.count({ where: upcomingEventsWhere }),
    ]);

    return {
      openPollCount,
      upcomingEventCount,
    };
  }),
});
