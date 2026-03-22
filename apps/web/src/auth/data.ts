import "server-only";

import { getUserSession } from "@/features/user/data";

/**
 * Gets the current admin user if authenticated via CF Access, otherwise null.
 */
export const getCurrentUser = async () => {
  const { user } = await getUserSession();

  if (!user || user.isGuest) {
    return null;
  }

  return user;
};
