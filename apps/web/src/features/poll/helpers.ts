import "server-only";

export async function canUserManagePoll(
  user: {
    id: string;
    isGuest: boolean;
  },
  poll: {
    userId?: string | null;
    spaceId?: string | null;
  },
) {
  if (poll.userId && poll.userId === user.id) {
    // user is owner
    return true;
  }

  return false;
}
