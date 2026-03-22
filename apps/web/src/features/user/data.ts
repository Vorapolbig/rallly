import type { User } from "@rallly/database";
import { prisma } from "@rallly/database";
import type { UserDTO } from "@/features/user/schema";
import { getAdminUserFromCFHeaders } from "./cf-access";

export const createUserDTO = (user: User): UserDTO => ({
  id: user.id,
  name: user.name,
  image: user.image ?? undefined,
  email: user.email,
  role: user.role,
  banned: user.banned,
  timeZone: user.timeZone ?? undefined,
  timeFormat: user.timeFormat ?? undefined,
  locale: user.locale ?? undefined,
  weekStart: user.weekStart ?? undefined,
  customerId: user.customerId ?? undefined,
  isGuest: user.isAnonymous,
});

export const getUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    return null;
  }

  return createUserDTO(user);
};

/**
 * Get or create admin user from Cloudflare Access headers.
 * CF Access is the source of truth for admin identity.
 * We maintain a minimal user record for preferences/settings.
 */
export async function getOrCreateAdminUserFromCFAccess(
  email: string,
  name?: string,
) {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    return user;
  }

  user = await prisma.user.create({
    data: {
      email,
      name: name ?? email.split("@")[0],
      isAnonymous: false,
    },
  });

  return user;
}

/**
 * Get the current user session based on CF Access headers.
 * Returns { user: UserDTO } for admin, or { user: undefined } for unauthenticated.
 */
export const getUserSession = async () => {
  const cfUser = await getAdminUserFromCFHeaders();

  if (!cfUser) {
    return { session: null, user: undefined };
  }

  const dbUser = await getOrCreateAdminUserFromCFAccess(cfUser.email, cfUser.name);

  const user: UserDTO = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    banned: dbUser.banned,
    isGuest: false,
    timeZone: dbUser.timeZone ?? undefined,
    timeFormat: dbUser.timeFormat ?? undefined,
    locale: dbUser.locale ?? undefined,
    weekStart: dbUser.weekStart ?? undefined,
    customerId: dbUser.customerId ?? undefined,
  };

  return {
    session: { user },
    user,
  };
};
