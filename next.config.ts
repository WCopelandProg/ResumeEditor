import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // scripts/pdf-extract-worker.mjs is spawned via child_process rather than
  // `import`-ed (see src/lib/pdf/extract.ts for why), so Next's automatic
  // file tracing for serverless deployments (Vercel and similar) wouldn't
  // otherwise know to bundle it or its pdfjs-dist dependency. This forces
  // both into the traced output for every route.
  outputFileTracingIncludes: {
    "/api/**/*": ["./scripts/pdf-extract-worker.mjs", "./node_modules/pdfjs-dist/**"],
  },
};

export default nextConfig;
