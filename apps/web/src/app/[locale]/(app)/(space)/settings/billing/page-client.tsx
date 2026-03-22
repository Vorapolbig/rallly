"use client";

import {
  SettingsPage,
  SettingsPageContent,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageTitle,
} from "@/app/components/settings-layout";
import { Trans } from "@/i18n/client";

/**
 * Billing settings page stub.
 * Billing is not available in the CF Access simplified deployment.
 */
export function BillingPageClient() {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageTitle>
          <Trans i18nKey="billing" defaults="Billing" />
        </SettingsPageTitle>
        <SettingsPageDescription>
          <Trans
            i18nKey="billingNotAvailable"
            defaults="Billing is not available in this deployment."
          />
        </SettingsPageDescription>
      </SettingsPageHeader>
      <SettingsPageContent />
    </SettingsPage>
  );
}
