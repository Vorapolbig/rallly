"use client";

import { Trans } from "@/i18n/client";

/**
 * Password management is not available with Cloudflare Access authentication.
 * Authentication is handled entirely by CF Access.
 */
export function ChangePasswordForm() {
  return (
    <p className="text-muted-foreground text-sm">
      <Trans
        i18nKey="securityManagedByCFAccess"
        defaults="Security is managed by Cloudflare Access."
      />
    </p>
  );
}
