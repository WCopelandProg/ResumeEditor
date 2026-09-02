import { vi } from "vitest";

/**
 * API route handlers call `requireUserId()` -> `auth()` from `@/auth`.
 * `@/auth` wires up NextAuth with the Prisma adapter and real providers,
 * which isn't something a unit test should exercise — tests mock it down
 * to "there is a signed-in user with this id" and drive everything else
 * (ownership checks, CRUD, suggestion application) against the real test
 * database, which is what actually matters for these tests.
 */
export let mockUserId: string | null = null;

vi.mock("@/auth", () => ({
  auth: async () => (mockUserId ? { user: { id: mockUserId } } : null),
}));

export function setMockUser(userId: string | null) {
  mockUserId = userId;
}
