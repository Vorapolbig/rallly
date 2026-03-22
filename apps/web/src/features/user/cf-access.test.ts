import { headers } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminUserFromCFHeaders, isCFAccessEnabled } from "./cf-access";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

describe("CF Access Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdminUserFromCFHeaders", () => {
    it("should extract admin user from CF headers", async () => {
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "admin@example.com"],
        ["CF-Access-Authenticated-User-UUID", "uuid-123456"],
        ["CF-Access-Authenticated-User-Name", "Admin User"],
      ]);

      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeadersMap.get(key) ?? null,
      } as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getAdminUserFromCFHeaders();

      expect(result).toEqual({
        email: "admin@example.com",
        id: "uuid-123456",
        name: "Admin User",
        isAdmin: true,
      });
    });

    it("should use email prefix as name if name header missing", async () => {
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "john@example.com"],
        ["CF-Access-Authenticated-User-UUID", "uuid-789"],
      ]);

      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeadersMap.get(key) ?? null,
      } as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getAdminUserFromCFHeaders();

      expect(result?.name).toBe("john");
    });

    it("should return null if UUID header is missing (production)", async () => {
      vi.stubEnv("NODE_ENV", "production");

      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "admin@example.com"],
      ]);

      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeadersMap.get(key) ?? null,
      } as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await getAdminUserFromCFHeaders();

      expect(result).toBeNull();

      vi.unstubAllEnvs();
    });
  });

  describe("isCFAccessEnabled", () => {
    it("should return true if CF Access headers present", async () => {
      const mockHeadersMap = new Map([
        ["CF-Access-Authenticated-User-Email", "admin@example.com"],
        ["CF-Access-Authenticated-User-UUID", "uuid-123"],
      ]);

      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeadersMap.get(key) ?? null,
      } as unknown as Awaited<ReturnType<typeof headers>>);

      const result = await isCFAccessEnabled();

      expect(result).toBe(true);
    });
  });
});
