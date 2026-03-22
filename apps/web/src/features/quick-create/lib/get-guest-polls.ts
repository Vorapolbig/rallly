// Guest users are no longer supported (all users authenticated via CF Access)
export async function getGuestPolls(): Promise<
  Array<{ id: string; title: string; createdAt: Date }>
> {
  return [];
}
