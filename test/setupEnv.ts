import { config } from "dotenv";
import path from "path";

// Vitest doesn't auto-load .env the way Next.js does; DB-backed API tests
// need DATABASE_URL, so load it explicitly before any test file runs.
config({ path: path.resolve(import.meta.dirname, "../.env") });
