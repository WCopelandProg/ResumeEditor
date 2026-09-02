import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";
import type { StorageProvider, StoredFileRef } from "./types";

// Files are gitignored and live outside `public/` so nothing here is ever
// served directly — every read goes through an authenticated API route.
const ROOT = path.join(process.cwd(), ".data", "uploads");

function resolveSafe(key: string): string {
  // Keys are always server-generated (see sanitizeFilename/storage key
  // builder), but double-check here so a bug elsewhere can never turn into
  // a path traversal out of the uploads root.
  const resolved = path.normalize(path.join(ROOT, key));
  if (!resolved.startsWith(ROOT)) {
    throw new Error("Invalid storage key.");
  }
  return resolved;
}

export class LocalStorageProvider implements StorageProvider {
  async put(key: string, data: Buffer): Promise<StoredFileRef> {
    const fullPath = resolveSafe(key);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, data);
    return { key };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(resolveSafe(key));
  }

  async delete(key: string): Promise<void> {
    await rm(resolveSafe(key), { force: true });
  }
}
