import { cookies, headers } from "next/headers";

/**
 * Extract admin user info from Cloudflare Access headers
 * CF Access adds these headers when a user is authenticated:
 * - CF-Access-Authenticated-User-Email
 * - CF-Access-Authenticated-User-UUID
 * - CF-Access-Authenticated-User-Name (optional)
 *
 * If headers are not present (some CF Access configurations only send the JWT
 * cookie), falls back to decoding the CF_Authorization JWT cookie.
 */
export async function getAdminUserFromCFHeaders() {
  const headersList = await headers();

  let email = headersList.get("CF-Access-Authenticated-User-Email");
  let uuid = headersList.get("CF-Access-Authenticated-User-UUID");
  let name = headersList.get("CF-Access-Authenticated-User-Name");

  // Fallback: decode the CF_Authorization JWT cookie if headers are missing.
  // CF Access always sets this cookie after authentication, even when user
  // identity headers are not forwarded to the origin.
  if (!email || !uuid) {
    try {
      const cookieStore = await cookies();
      const cfJwt = cookieStore.get("CF_Authorization")?.value;
      if (cfJwt) {
        const payload = JSON.parse(
          Buffer.from(cfJwt.split(".")[1], "base64url").toString("utf-8"),
        );
        email = email ?? (payload.email as string) ?? null;
        uuid = uuid ?? (payload.sub as string) ?? null;
        name = name ?? (payload.name as string) ?? null;
      }
    } catch {
      // JWT decode failed — continue to dev fallback
    }
  }

  // In development, fall back to mock values if no real CF headers.
  // CF_ACCESS_DEV_EMAIL can be set for local production builds that bypass CF Access.
  if (!email || !uuid) {
    const devEmail =
      process.env.NODE_ENV === "development"
        ? "admin@example.com"
        : (process.env.CF_ACCESS_DEV_EMAIL ?? null);

    email = email ?? devEmail;
    uuid = uuid ?? (devEmail ? "dev-uuid-12345" : null);
  }

  if (!email || !uuid) {
    return null;
  }

  return {
    email,
    id: uuid,
    name: name ?? email.split("@")[0],
    isAdmin: true,
  };
}

/**
 * Verify CF Access is enabled (headers or cookie present)
 */
export async function isCFAccessEnabled() {
  const user = await getAdminUserFromCFHeaders();
  return user !== null;
}
