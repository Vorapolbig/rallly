import type { UserRole } from "@rallly/database";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";

export { loginWithEmail } from "@rallly/test-helpers";

export async function createUserInDb({
  email,
  name,
  role = "user",
}: {
  email: string;
  name: string;
  role?: UserRole;
}) {
  return await prisma.user.create({
    data: {
      email,
      name,
      role,
      locale: "en",
      timeZone: "Europe/London",
      emailVerified: true,
    },
  });
}

export async function createTestPoll({
  id,
  title,
  userId,
  spaceId,
  updatedAt,
  hasRecentViews = false,
  hasFutureOptions = false,
}: {
  id: string;
  title: string;
  userId?: string;
  spaceId?: string;
  updatedAt: Date;
  hasRecentViews?: boolean;
  hasFutureOptions?: boolean;
}) {
  const pollData = {
    id,
    title,
    participantUrlId: `${id}-participant`,
    adminUrlId: `${id}-admin`,
    userId,
    spaceId,
    updatedAt,
    ...(hasRecentViews && {
      views: {
        create: {
          viewedAt: dayjs().subtract(15, "day").toDate(),
        },
      },
    }),
    ...(hasFutureOptions && {
      options: {
        create: {
          startTime: dayjs().add(10, "day").toDate(),
          duration: 60,
        },
      },
    }),
  };

  return await prisma.poll.create({
    data: pollData,
  });
}
