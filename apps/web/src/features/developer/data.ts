/**
 * Developer tools access stub.
 * Developer tools (API keys) are disabled in the CF Access simplified deployment.
 */

export async function isApiAccessEnabled(
  _user: {
    id: string;
  },
): Promise<boolean> {
  return false;
}
