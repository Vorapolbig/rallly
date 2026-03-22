"use client";

import { FormItem, FormLabel } from "@rallly/ui/form";
import { Input } from "@rallly/ui/input";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

// Email is managed by Cloudflare Access and cannot be changed here.
export const ProfileEmailAddress = () => {
  const [user] = trpc.user.getAuthed.useSuspenseQuery();

  return (
    <div className="grid gap-y-4">
      <FormItem>
        <FormLabel>
          <Trans i18nKey="email" />
        </FormLabel>
        <Input value={user.email} disabled readOnly />
      </FormItem>
    </div>
  );
};
