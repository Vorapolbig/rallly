"use client";

import { Tile, TileDescription, TileGrid, TileTitle } from "@rallly/ui/tile";
import {
  CreatePageIcon,
  EventPageIcon,
  PollPageIcon,
  SettingsPageIcon,
} from "@/app/components/page-icons";
import {
  PageContainer,
  PageContent,
  PageHeader,
  PageTitle,
} from "@/app/components/page-layout";
import { HoverPrefetchLink } from "@/components/hover-prefetch-link";
import { Trans } from "@/i18n/client";
import { trpc } from "@/trpc/client";

export function DashboardHome() {
  const [stats] = trpc.dashboard.stats.useSuspenseQuery();

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>
          <Trans i18nKey="home" defaults="Home" />
        </PageTitle>
      </PageHeader>
      <PageContent className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="homeActionsTitle" defaults="Actions" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <HoverPrefetchLink href="/new">
                <CreatePageIcon />
                <TileTitle>
                  <Trans i18nKey="create" defaults="Create" />
                </TileTitle>
              </HoverPrefetchLink>
            </Tile>
          </TileGrid>
        </div>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="content" defaults="Content" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <HoverPrefetchLink href="/polls">
                <PollPageIcon />
                <TileTitle>
                  <Trans i18nKey="polls" defaults="Polls" />
                </TileTitle>
                <TileDescription>
                  <Trans
                    i18nKey="openPollCount"
                    defaults="{count} open"
                    values={{ count: stats.openPollCount }}
                  />
                </TileDescription>
              </HoverPrefetchLink>
            </Tile>

            <Tile asChild>
              <HoverPrefetchLink href="/events">
                <EventPageIcon />
                <TileTitle>
                  <Trans i18nKey="events" defaults="Events" />
                </TileTitle>
                <TileDescription>
                  <Trans
                    i18nKey="upcomingEventCount"
                    defaults="{count} upcoming"
                    values={{ count: stats.upcomingEventCount }}
                  />
                </TileDescription>
              </HoverPrefetchLink>
            </Tile>
          </TileGrid>
        </div>
        <div className="space-y-4">
          <h2 className="text-muted-foreground text-sm">
            <Trans i18nKey="manage" defaults="Manage" />
          </h2>
          <TileGrid>
            <Tile asChild>
              <HoverPrefetchLink href="/settings/profile">
                <SettingsPageIcon />
                <TileTitle>
                  <Trans i18nKey="settings" defaults="Settings" />
                </TileTitle>
              </HoverPrefetchLink>
            </Tile>
          </TileGrid>
        </div>
      </PageContent>
    </PageContainer>
  );
}
