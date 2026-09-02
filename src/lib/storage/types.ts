export interface StoredFileRef {
  /** Opaque key the provider uses to locate the file. Never expose directly to clients. */
  key: string;
}

export interface StorageProvider {
  /** Persist a file and return its storage key. */
  put(key: string, data: Buffer, contentType: string): Promise<StoredFileRef>;
  /** Read a file back into memory. Throws if missing. */
  get(key: string): Promise<Buffer>;
  /** Permanently remove a file. No-ops if already gone. */
  delete(key: string): Promise<void>;
}
