import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@rallly/ui/sidebar";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Settings2Icon } from "lucide-react";
import Link from "next/link";
import { SpaceSidebarMenu } from "@/app/[locale]/(app)/(space)/(dashboard)/components/space-sidebar-menu";
import { NavUser } from "@/components/nav-user";
import { UserLocaleSync } from "@/components/user-provider";
import { CommandMenu } from "@/features/navigation/command-menu";
import { Trans } from "@/i18n/client";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { SpaceSidebarProvider } from "./components/space-sidebar-provider";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  await helpers.user.getAuthed.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      <UserLocaleSync />
      <SpaceSidebarProvider>
        <CommandMenu />
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1">
              <span className="font-semibold text-sm">Rallly</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SpaceSidebarMenu />
          </SidebarContent>
          <SidebarFooter>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/settings/preferences">
                        <Settings2Icon />
                        <Trans i18nKey="preferences" defaults="Preferences" />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator className="my-1" />
            <NavUser />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-w-0">
          <div className="flex flex-1 flex-col">
            <div className="flex flex-1 flex-col">{children}</div>
          </div>
        </SidebarInset>
      </SpaceSidebarProvider>
    </HydrationBoundary>
  );
}
