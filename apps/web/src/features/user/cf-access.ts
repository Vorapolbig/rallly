import { headers } from "next/headers";

/**
 * Extract admin user info from Cloudflare Access headers
 * CF Access adds these headers when a user is authenticated:
 * - CF-Access-Authenticated-User-Email
 * - CF-Access-Authenticated-User-UUID
 * - CF-Access-Authenticated-User-Name (optional)
 */
export async function getAdminUserFromCFHeaders() {
  const headersList = await headers();

  // In development, fall back to mock values if no real CF headers
  const email =
    headersList.get("CF-Access-Authenticated-User-Email") ??
    (process.env.NODE_ENV === "development" ? "admin@example.com" : null);
  const uuid =
    headersList.get("CF-Access-Authenticated-User-UUID") ??
    (process.env.NODE_ENV === "development" ? "dev-uuid-12345" : null);

  if (!email || !uuid) {
    return null;
  }

  return {
    email,
    id: uuid,
    name:
      headersList.get("CF-Access-Authenticated-User-Name") ??
      email.split("@")[0],
    isAdmin: true,
  };
}

/**
 * Verify CF Access is enabled (headers present)
 */
export async function isCFAccessEnabled() {
  const user = await getAdminUserFromCFHeaders();
  return user !== null;
}
