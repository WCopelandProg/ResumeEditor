import { AppHeader } from "@/components/layout/AppHeader";
import { RESUME_TEMPLATES } from "@/lib/resume/types";
import { getTemplateSkin } from "@/lib/pdf/templateSkins";
import { cn } from "@/lib/utils";

function MockPreview({ templateId }: { templateId: string }) {
  const skin = getTemplateSkin(templateId);
  const serif = skin.serifHeadings;

  return (
    <div className="aspect-[8.5/11] w-full overflow-hidden rounded-md border border-border bg-white p-4 text-black">
      <div className={cn(skin.nameAlign === "center" && "text-center", skin.nameBanner && "-m-4 mb-3 bg-blue-700 p-4 text-white")}>
        <div className={cn("h-3 w-2/3 rounded-sm bg-current", skin.nameAlign === "center" && "mx-auto", serif && "font-serif")} style={{ opacity: 0.85 }} />
        <div className={cn("mt-1.5 h-1.5 w-1/3 rounded-sm bg-current opacity-40", skin.nameAlign === "center" && "mx-auto")} />
        <div className={cn("mt-2 h-1 w-4/5 rounded-sm bg-current opacity-25", skin.nameAlign === "center" && "mx-auto")} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-3">
          <div
            className={cn(
              "h-1.5 w-1/4 rounded-sm bg-blue-700",
              skin.headingCase === "upper" && "tracking-wide",
              skin.headingStyle === "underline" && "border-b border-blue-700/40 pb-1",
              skin.headingColor === "ink" && "bg-zinc-700"
            )}
          />
          <div className="mt-1.5 space-y-1">
            <div className="h-1 w-full rounded-sm bg-zinc-300" />
            <div className="h-1 w-11/12 rounded-sm bg-zinc-300" />
            <div className="h-1 w-4/5 rounded-sm bg-zinc-300" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Every template is built to stay ATS-readable — clean structure, standard fonts, no tables or
          embedded graphics. Switching templates preserves all of your content; only formatting changes.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RESUME_TEMPLATES.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-4">
              <MockPreview templateId={t.id} />
              <h3 className="mt-3 font-medium">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
