import { defineConfig } from "vitest/config";
import path from "path";

const dirname = import.meta.dirname;

export default defineConfig({
  resolve: {
    alias: {
      // Next's `server-only` guard throws when loaded outside the Next.js
      // bundler (which normally no-ops it via webpack/turbopack config).
      // Tests run under plain Node, so it's aliased to a harmless stub.
      "server-only": path.resolve(dirname, "test/stubs/server-only.ts"),
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    setupFiles: [path.resolve(dirname, "test/setupEnv.ts")],
  },
});
