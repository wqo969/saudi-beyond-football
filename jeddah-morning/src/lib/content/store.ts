import "server-only";
import path from "node:path";
import { FsStore, VercelBlobStore, getJson, putJson, type BlobStore } from "./blob-store";

export type Backend = "local" | "blob" | "blob-fs";

export function backend(): Backend {
  const b = process.env.JM_CONTENT_BACKEND;
  return b === "blob" || b === "blob-fs" ? b : "local";
}

let store: BlobStore | null = null;

/** Object store for content (blob backends) and for small settings/log documents (all backends). */
export function getStore(): BlobStore {
  if (store) return store;
  const root = process.env.JM_DATA_ROOT || process.cwd();
  store = backend() === "blob" ? new VercelBlobStore() : new FsStore(path.join(root, "storage", backend() === "blob-fs" ? "blobfs" : "kv"));
  return store;
}

/** Tiny JSON key/value API on top of the store (settings, logs, subscriptions, registries). */
export const kv = {
  get: <T>(key: string) => getJson<T>(getStore(), `kv/${key}.json`),
  set: (key: string, value: unknown) => putJson(getStore(), `kv/${key}.json`, value),
};
