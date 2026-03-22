"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rallly/ui/sidebar";
import { CalendarIcon, Settings2Icon, UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { useTranslation } from "@/i18n/client";
import { useFeatureFlag } from "@/lib/feature-flags/client";

export function AccountSidebarMenu() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const menuItems = [
    {
      id: "profile",
      label: t("profile", { defaultValue: "Profile" }),
      icon: <UserIcon />,
      href: "/settings/profile",
    },
    {
      id: "preferences",
      label: t("preferences", { defaultValue: "Preferences" }),
      icon: <Settings2Icon />,
      href: "/settings/preferences",
    },
  ];

  const isCalendarsEnabled = useFeatureFlag("calendars");

  if (isCalendarsEnabled) {
    menuItems.push({
      id: "calendars",
      label: t("calendars", { defaultValue: "Calendars" }),
      icon: <CalendarIcon />,
      href: "/settings/calendars",
    });
  }

  return (
    <SidebarMenu>
      {menuItems.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
            <HoverPrefetchLink
              href={item.href}
              className="flex items-center gap-x-2"
            >
              {item.icon}
              {item.label}
            </HoverPrefetchLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
