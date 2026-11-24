# Resumo: Resume Editor & AI Coach

Edit your resume, adjust its formatting, review AI suggestions, and export a PDF with selectable text.

**Stack:** Next.js, TypeScript, PostgreSQL, Prisma, Auth.js, Zod, and React PDF.

## What it does

- Keeps resume content separate from formatting, so changing templates leaves your information intact.
- Checks AI suggestions against a schema and shows them to you before you apply changes.
- Reads uploaded PDFs and exports PDFs with a searchable, selectable text layer.
- Includes tests for parsing, rendering, AI output validation, and resume ownership boundaries.

**Start here:** [Quick start](#quick-start) · [Architecture](#architecture) · [Testing](#testing) · [Limitations](#known-limitations--whats-next)

## Contents

- [Quick start](#quick-start)
- [Architecture](#architecture)
- [Resume data model](#resume-data-model)
- [AI suggestion model](#ai-suggestion-model)
- [PDF pipeline](#pdf-pipeline)
- [Testing](#testing)
- [Project layout](#project-layout)
- [Known limitations & what's next](#known-limitations--whats-next)

## Quick start

Requires Node 20+ and a PostgreSQL server.

```bash
npm install
cp .env.example .env
# Edit .env: set DATABASE_URL, AUTH_SECRET, and an AI provider key if you
# want the AI Coach to actually respond (see "AI provider" below).

# Local Postgres: either run the bundled docker-compose service...
docker compose up -d
# ...or point DATABASE_URL at any Postgres instance you already have.

npm run db:migrate     # applies prisma/schema.prisma
npm run db:seed        # creates dev@example.com / password123 with a demo resume

npm run dev            # http://localhost:3000
```

Then either sign in with the seeded account, sign up fresh, or click **Try
demo resume** from an empty dashboard to load a realistic sample without
uploading anything.

### AI provider

The AI Resume Coach needs a model API key. Without one, every AI-powered
action (analyze, rewrite, job match, smart questions) fails with a clear
"not configured yet" message; the rest of the app works fully without it.

```bash
AI_PROVIDER="anthropic"        # or "openai"
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-sonnet-5"   # optional override
```

### Scripts

```bash
npm run dev          # start the dev server
npm run build         # production build
npm run start          # run a production build
npm run lint            # eslint
npm test                 # vitest (once)
npm run test:watch        # vitest (watch mode)
npm run db:migrate         # prisma migrate dev
npm run db:seed              # prisma db seed
npm run db:studio             # prisma studio (inspect the DB visually)
```

## Architecture

**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS, PostgreSQL via
Prisma, Auth.js (NextAuth v5) for credentials + optional Google sign-in,
Zustand for editor state, `@dnd-kit` for drag-and-drop, `pdfjs-dist` for
parsing, `@react-pdf/renderer` for generation, Zod everywhere input/AI output
crosses a trust boundary.

**Why this stack:** It keeps auth, the database, the editor, AI features, and PDF handling in one codebase without a separate backend service. Familiar tools like Prisma, NextAuth, Zod, and Zustand leave more room to focus on the resume editor, AI suggestions, and PDF handling.

**Content and formatting are stored separately.** A resume's content
(`Resume.content`) and its formatting (`ResumeStyle`) are stored and edited
independently, so switching templates or adjusting spacing never touches
content, and vice versa. The same `ResumeStyle` + template "skin" config
(`src/lib/pdf/templateSkins.ts`) drives both the live in-browser preview and
the exported PDF, so what you see while editing is what you get on export.

**AI providers can be swapped.** Application code talks
only to the `AiProvider` interface (`src/lib/ai/provider.ts`); Anthropic and
OpenAI are two interchangeable implementations behind it. Every AI response
is parsed and validated against a Zod schema before it touches the database
or UI (`src/lib/ai/structured.ts`), with one automatic retry (feeding the
validation error back to the model) before failing safely. See
[AI suggestion model](#ai-suggestion-model) for the anti-fabrication design.

**Authorization** uses one shared check: every resume-scoped API route
calls `requireOwnedResume(id, userId)` (`src/lib/api/auth.ts`), which returns 404 instead of 403 when someone requests another user’s resume. That keeps the response from revealing whether the id exists.

## Resume data model

A resume's content is one validated JSON document
(`src/lib/resume/types.ts#StructuredResumeSchema`) rather than fully
normalized database rows:

```
StructuredResume {
  personalInfo: { fullName, headline, email, phone, location, linkedin, github, website }
  sections: Section[]
}
Section { id, type, title, order, text?, entries: Entry[] }
Entry   { id, order, organization?, title?, location?, startDate?, endDate?,
          isCurrent?, description?, bullets: Bullet[], links: LinkItem[], meta }
Bullet  { id, order, text }
```

The app reads and saves resume content as one document. Keeping it in JSON avoids a separate set of CRUD endpoints for every bullet. Each node has a stable, client-generated id (`sec_…`, `ent_…`, `blt_…`) that stays the same through edits and reordering. AI suggestions and version snapshots can use those ids to find a specific bullet. Users, resumes, versions, suggestions, job descriptions, analysis runs, uploaded files, and styles still use relational Postgres tables (`prisma/schema.prisma`).

Formatting/style is a separate model (`ResumeStyle`) with separate
columns for each field and limits on allowed values (`STYLE_BOUNDS`), applied through a template
"skin" (`templateSkins.ts`) so switching among the 6 templates never touches
content.

## AI suggestion model

```
Suggestion {
  id, category, severity, status,
  sectionId?, entryId?, bulletId?,     // stable ids into the content tree — never FKs
  originalText?, suggestedText?, finalText?,
  explanation, question?
}
```

**AI suggestions must stick to the facts.** Every prompt (`src/lib/ai/coach.ts`)
instructs the model to avoid making up metrics, employers, dates, or
technologies. When a bullet would be stronger with a number that isn't
already in the text, the model is instructed to leave `suggestedText` null
and ask a specific clarifying question instead
(`AiSuggestionSchema` enforces "must have one or the other" at the schema
level, not just via prompt wording); see "Smart Questions" in the AI Coach
sidebar. You always see the proposed text before choosing to accept, reject, or edit a suggestion.

Job-match scores are explicitly labeled `scoreIsInternalEstimate: true` throughout the schema, API, and UI. They are estimates from this app, with no access to an employer’s ATS results.

## PDF pipeline

The pipeline keeps the original file, parsed content, style, and rendered output separate:

1. **Original PDF** → stored via a pluggable `StorageProvider`
   (`src/lib/storage`; local disk in dev, S3/R2-compatible in production —
   swap with `STORAGE_PROVIDER=s3`).
2. **Parsing** (`src/lib/pdf/extract.ts` + `segment.ts`) → a heuristic layout
   parser: pdfjs-dist gives positioned text + link annotations; line
   clustering, font-size tiers, bullet-glyph detection, and a small resume
   vocabulary turn that into sections/entries/bullets. The parser uses heuristics, so it can miss details in an unfamiliar layout. You can correct the result in the visual editor.
   - **Runs in a separate child process** (`scripts/pdf-extract-worker.mjs`),
     not an in-process import. pdfjs-dist dynamically imports its own worker
     submodule at runtime; both Turbopack and webpack mangle that import once
     pdfjs is pulled into a Next.js server bundle. Running it unbundled in a
     plain `node` process avoids that bundling issue and means
     a pathological PDF can't hang or crash the main server.
   - A PDF with no extractable text (scanned/image-only) is detected
     (`NO_TEXT_LAYER`) and reported distinctly rather than silently producing
     an empty resume; see "OCR" below.
3. **Style** → `ResumeStyle`, edited independently via the Formatting panel.
4. **Rendering** (`src/lib/pdf/render.ts` + `ResumeDocument.tsx`) → PDF generation via `@react-pdf/renderer`: text objects (selectable,
   ATS-readable), link annotations, standard 14 PDF fonts (no font
   embedding needed, renders identically everywhere). One parametrized
   document component plus a per-template "skin" config produces all 6
   visually distinct templates, without maintaining six copies of the layout.
   Pagination avoids orphaned headings and split entries by grouping each
   section's heading with its first entry, and each entry's header with its
   bullets, in non-splitting blocks.

## Testing

```bash
npm test
```

38 tests across parsing, rendering, the AI layer, and API-level
CRUD/authorization/suggestion-application, run against a real (test)
Postgres database rather than mocks wherever the thing being tested *is* the
persistence/authorization logic:

- `test/pdf/parseResume.test.ts`: parses a real, in-memory-generated PDF
  and asserts on the resulting structured sections/entries/bullets/dates,
  plus the scanned-PDF (`NO_TEXT_LAYER`) path.
- `test/pdf/render.test.ts`: renders all 6 templates to real PDF bytes and
  round-trips one back through the parser to confirm the exported text is
  selectable and extractable.
- `test/ai/structured.test.ts`: the JSON-extraction/validation/retry logic
  against a fake `AiProvider`, including the "still garbage after retry"
  failure path.
- `test/ai/coach.test.ts`: prompt construction (resume content and stable
  ids reach the model) and rejects a fabricated-metric response
  that skips both `suggestedText` and `question`.
- `test/api/resumeCrud.test.ts`: create/list/read/update/delete, ownership
  enforcement (a second user gets 404, not 403, and can't mutate), and that
  accepting/rejecting a suggestion does (or doesn't) mutate the right bullet.
- `test/api/upload.test.ts`: the upload route from start to finish: a generated
  PDF in, a structured resume out, plus the non-PDF and scanned-PDF
  rejection paths.

## Project layout

```
prisma/schema.prisma        Database schema (see comments for the content-as-JSON rationale)
prisma/seed.ts               Dev user + demo resume
scripts/pdf-extract-worker.mjs  Standalone PDF parsing subprocess (see PDF pipeline)
src/lib/resume/               Structured resume model, helpers, demo content
src/lib/ai/                    Provider abstraction, schemas, prompts (coach.ts)
src/lib/pdf/                    Parsing (extract/segment/parseResume) + rendering (render/ResumeDocument)
src/lib/storage/                 Pluggable file storage (local/S3)
src/lib/editor/                   Zustand store, autosave, keyboard shortcuts
src/app/api/resumes/               All resume-scoped API routes
src/app/(dashboard|resume|sign-in|sign-up|templates)  Pages
src/components/(editor|coach|dashboard|ui)              UI, grouped by feature
test/                                                     Vitest suite (mirrors src/ layout)
```

## Known limitations & what's next

The app covers Phase 2: uploading, parsing, editing, AI feedback, reviewing suggestions, exporting, and saving resumes. It also includes auth, a dashboard, templates, scoring, ATS checks, job targeting, and version history. Here’s what remains:

- **OCR for scanned PDFs is planned and has an integration point, but isn’t implemented.** A
  scanned/image-only PDF is detected and reported clearly instead of
  silently producing an empty resume; wiring in an OCR provider would slot
  into `parseResumePdf`'s `NO_TEXT_LAYER` branch without touching anything
  downstream.
- **Rich per-character formatting (bold/italic mid-sentence) isn't
  supported**; the structured model intentionally represents content as
  plain strings with template-driven styling (job titles are always bold,
  etc.), which keeps AI suggestions, PDF export, and the editor all working
  from the same simple text rather than needing a rich-text/AST layer.
  Section/entry/bullet-level structure covers the vast majority of real
  resume formatting needs.
- **Two-column layout** places a fixed set of section types (Skills,
  Education, Certifications, Awards, Leadership) in the sidebar rather than
  letting users assign arbitrary sections to a column.
- **Cover letters, LinkedIn import, sharing links, and the other Phase-3
  ideas** are intentionally not built, but nothing in the data model blocks
  them; e.g. a share link is a new route reading the same `Resume`/`
  ResumeVersion` rows behind a token instead of a session.
- **Development warnings:** `next dev`'s Turbopack
  logs a "middleware" → "proxy" naming deprecation notice, and Prisma logs a
  `package.json#prisma` config deprecation notice (both still fully
  functional in the versions pinned here).
  
