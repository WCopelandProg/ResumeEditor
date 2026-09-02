"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Search, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResumeCard } from "@/components/dashboard/ResumeCard";
import { UploadResumeDialog } from "@/components/dashboard/UploadResumeDialog";
import { CreateResumeDialog } from "@/components/dashboard/CreateResumeDialog";
import { toast } from "sonner";
import { api, type ResumeSummary } from "@/lib/api/client";

export function DashboardClient({ initialResumes }: { initialResumes: ResumeSummary[] }) {
  const router = useRouter();
  const [resumes, setResumes] = useState(initialResumes);
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resumes;
    return resumes.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.targetRole ?? "").toLowerCase().includes(q)
    );
  }, [resumes, query]);

  async function handleLoadDemo() {
    setLoadingDemo(true);
    try {
      const { resume } = await api.createDemoResume();
      router.push(`/resume/${resume.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't load the demo resume.");
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Resumes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{resumes.length} resume{resumes.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleLoadDemo} disabled={loadingDemo}>
            <Sparkles className="h-4 w-4" /> Try demo resume
          </Button>
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Upload resume
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <FilePlus2 className="h-4 w-4" /> Create resume
          </Button>
        </div>
      </div>

      {resumes.length > 0 ? (
        <div className="relative mt-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search resumes…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      ) : null}

      {resumes.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <FilePlus2 className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-medium">No resumes yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Upload an existing resume, start from a blank template, or try the demo to see the AI coach in action.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(true)}>
              <Upload className="h-4 w-4" /> Upload resume
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <FilePlus2 className="h-4 w-4" /> Create resume
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">No resumes match &quot;{query}&quot;.</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onDuplicated={(r) => setResumes((prev) => [r, ...prev])}
              onRenamed={(id, name) => setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)))}
              onDeleted={(id) => setResumes((prev) => prev.filter((r) => r.id !== id))}
            />
          ))}
        </div>
      )}

      <UploadResumeDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateResumeDialog open={createOpen} onOpenChange={setCreateOpen} />
    </main>
  );
}
