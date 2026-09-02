import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/layout/AppHeader";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: { analysisResults: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const initialResumes = resumes.map((r) => ({
    id: r.id,
    name: r.name,
    targetRole: r.targetRole,
    templateId: r.templateId,
    updatedAt: r.updatedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    overallScore: r.analysisResults[0]?.overallScore ?? null,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <DashboardClient initialResumes={initialResumes} />
    </div>
  );
}
