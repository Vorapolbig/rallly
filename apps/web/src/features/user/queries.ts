import { prisma } from "@rallly/database";

export const getUserCount = async () => {
  return await prisma.user.count({
    where: {
      isAnonymous: false,
    },
  });
};

// Account model has been removed. CF Access handles authentication.
export const getUserHasPassword = async (_userId: string) => {
  return false;
};

export const getUserHasNoAccounts = async (_userId: string) => {
  return true;
};
