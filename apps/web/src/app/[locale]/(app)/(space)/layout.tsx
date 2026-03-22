import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const helpers = await createPrivateSSRHelper();

  await helpers.user.getAuthed.prefetch();

  return (
    <HydrationBoundary state={dehydrate(helpers.queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
