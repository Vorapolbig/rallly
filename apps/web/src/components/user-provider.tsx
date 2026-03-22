"use client";
import { usePostHog } from "@rallly/posthog/client";
import React from "react";
import type { UserAbility } from "@/features/user/ability";
import { defineAbilityFor } from "@/features/user/ability";
import { LocaleSync } from "@/lib/locale/client";
import { trpc } from "@/trpc/client";
import { isOwner } from "@/utils/permissions";

export function useUser() {
  const [user] = trpc.user.getMe.useSuspenseQuery();
  const posthog = usePostHog();

  const userId = user?.id;
  const isGuest = user?.isGuest;

  React.useEffect(() => {
    if (userId && !isGuest) {
      posthog.identify(userId);
    }
  }, [userId, isGuest, posthog]);

  return React.useMemo(() => {
    return {
      user: user ?? undefined,
      getAbility: (): UserAbility => defineAbilityFor(user ?? undefined),
      ownsObject: (resource: { userId?: string | null }) => {
        return user ? isOwner(resource, { id: user.id }) : false;
      },
    };
  }, [user]);
}

export function UserLocaleSync() {
  const { user } = useUser();
  return <LocaleSync userLocale={user?.locale} />;
}
