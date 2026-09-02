import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NotFoundError, UnauthorizedError } from "./errors";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}

/**
 * Loads a resume and enforces ownership in one step. A resume that exists
 * but belongs to someone else 404s rather than 403s — this avoids leaking
 * which resume ids exist to users who don't own them.
 */
export async function requireOwnedResume(resumeId: string, userId: string) {
  const resume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: { style: true },
  });
  if (!resume || resume.userId !== userId) {
    throw new NotFoundError("Resume not found.");
  }
  return resume;
}
