import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

/** Minimal object-store interface so the production store (Vercel Blob, private) and local tests share one code path. */
export interface BlobStore {
  readonly kind: "vercel-blob" | "fs";
  getBytes(pathname: string): Promise<Uint8Array | null>;
  put(pathname: string, body: Uint8Array | string, contentType: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  del(pathname: string): Promise<void>;
}

export async function getText(store: BlobStore, pathname: string): Promise<string | null> {
  const b = await store.getBytes(pathname);
  return b ? new TextDecoder().decode(b) : null;
}

export async function getJson<T>(store: BlobStore, pathname: string): Promise<T | null> {
  const t = await getText(store, pathname);
  if (t == null) return null;
  try {
    return JSON.parse(t) as T;
  } catch {
    return null;
  }
}

export async function putJson(store: BlobStore, pathname: string, value: unknown): Promise<void> {
  await store.put(pathname, JSON.stringify(value), "application/json");
}

const SAFE = /^[a-z0-9][a-z0-9/._-]{0,200}$/i;
function assertSafe(p: string) {
  if (!SAFE.test(p) || p.includes("..")) throw new Error(`unsafe blob path: ${p}`);
}

/** Vercel Blob, PRIVATE store: every read and write is authenticated (BLOB_READ_WRITE_TOKEN injected by Vercel). */
export class VercelBlobStore implements BlobStore {
  readonly kind = "vercel-blob" as const;
  async getBytes(pathname: string) {
    assertSafe(pathname);
    const { get } = await import("@vercel/blob");
    const r = await get(pathname, { access: "private", useCache: false });
    if (!r || !r.stream) return null;
    return new Uint8Array(await new Response(r.stream).arrayBuffer());
  }
  async put(pathname: string, body: Uint8Array | string, contentType: string) {
    assertSafe(pathname);
    const { put } = await import("@vercel/blob");
    const data = typeof body === "string" ? body : Buffer.from(body);
    await put(pathname, data, { access: "private", contentType, addRandomSuffix: false, allowOverwrite: true });
  }
  async list(prefix: string) {
    const { list } = await import("@vercel/blob");
    const out: string[] = [];
    let cursor: string | undefined;
    do {
      const r = await list({ prefix, cursor, limit: 1000 });
      out.push(...r.blobs.map((b) => b.pathname));
      cursor = r.hasMore ? r.cursor : undefined;
    } while (cursor);
    return out;
  }
  async del(pathname: string) {
    assertSafe(pathname);
    const { del } = await import("@vercel/blob");
    await del(pathname);
  }
}

/** Same semantics on the local filesystem (dev, tests, e2e of the production code path). */
export class FsStore implements BlobStore {
  readonly kind = "fs" as const;
  constructor(private root: string) {}
  private file(p: string) {
    assertSafe(p);
    return path.join(this.root, p);
  }
  async getBytes(p: string) {
    try {
      return new Uint8Array(await fs.readFile(this.file(p)));
    } catch {
      return null;
    }
  }
  async put(p: string, body: Uint8Array | string) {
    const f = this.file(p);
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(`${f}.tmp`, body);
    await fs.rename(`${f}.tmp`, f);
  }
  async list(prefix: string) {
    const out: string[] = [];
    const walk = async (dir: string, rel: string) => {
      let entries: import("node:fs").Dirent[] = [];
      try {
        entries = await fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of entries) {
        const r = rel ? `${rel}/${e.name}` : e.name;
        if (e.isDirectory()) await walk(path.join(dir, e.name), r);
        else if (r.startsWith(prefix) && !r.endsWith(".tmp")) out.push(r);
      }
    };
    await walk(this.root, "");
    return out.sort();
  }
  async del(p: string) {
    await fs.rm(this.file(p), { force: true });
  }
}
