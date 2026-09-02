import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, Sparkles, Target, Wand2 } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: FileText,
    title: "Upload & reconstruct",
    body: "Upload an existing PDF resume and we parse it into a fully editable, structured document — headings, bullets, dates, and links preserved.",
  },
  {
    icon: Wand2,
    title: "Visual editor",
    body: "Click directly into any section, bullet, or date to edit it. Reorder, add, or remove content with drag-and-drop — no raw text or markdown.",
  },
  {
    icon: Sparkles,
    title: "AI Resume Coach",
    body: "Get specific, grounded feedback on your actual bullets — weak wording, missing metrics, repeated verbs — never generic advice.",
  },
  {
    icon: Target,
    title: "Job-targeted optimization",
    body: "Paste a job description and see missing keywords, an internal match estimate, and which of your experience to emphasize.",
  },
];

const STEPS = [
  "Upload your resume or start from a template",
  "Edit visually with instant live preview",
  "Review AI suggestions and accept the ones you want",
  "Export a polished, ATS-ready, selectable-text PDF",
];

export default async function LandingPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </span>
            Resumo
          </div>
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:px-6">
          <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-powered resume editor & coach
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Build a resume that actually gets read.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Upload your resume, edit it visually, and get specific, honest feedback from an AI coach that
            never invents facts — then export a clean, ATS-ready PDF.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href={session?.user ? "/dashboard" : "/sign-up"}>
                Upload your resume <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={session?.user ? "/dashboard" : "/sign-up"}>Try the demo resume</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/80">
                <CardContent className="pt-6">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <f.icon className="h-4.5 w-4.5" />
                  </span>
                  <h3 className="font-medium">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight">How it works</h2>
            <ol className="mx-auto mt-8 max-w-xl space-y-4">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">Never fabricates a fact</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            If a bullet would be stronger with a metric you haven&apos;t provided, the coach asks you for it
            instead of making one up. Your company names, dates, titles, and technologies are always
            preserved exactly as you wrote them.
          </p>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success" />
            Your data stays private — no public resume links by default.
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Resumo — built for real job searches, not demos.
      </footer>
    </div>
  );
}
