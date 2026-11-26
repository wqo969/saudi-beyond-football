import "server-only";
import { IssueSchema, SLUG_RE, type Issue } from "../schema";
import { getJson, putJson, type BlobStore } from "./blob-store";
import type { ContentRepository } from "./repository";

/**
 * Production content repository on a private object store.
 * Layout:
 *   index/issues.json            { slugs: { slug, updatedAt }[] }
 *   issues/<slug>.json           current version
 *   history/<slug>/<ts>.json     every previous version (version history / corrections / restore)
 *   pdfs/<file>.pdf, media/<file>
 * Reads go through `cached` (Next data cache with tags in production) so object-store operations
 * stay far below the free-plan limits; every write invalidates the affected tags.
 */
export type Cached = <T>(key: string[], tags: string[], fn: () => Promise<T>) => Promise<T>;
export type Invalidate = (tags: string[]) => void;

const identityCache: Cached = (_k, _t, fn) => fn();
const PDF_RE = /^[a-z0-9-]+\.pdf$/i;
const MEDIA_RE = /^[a-z0-9-]+\.(jpe?g|png|webp|avif)$/i;

interface IndexFile {
  slugs: { slug: string; updatedAt: string }[];
}

export class BlobRepository implements ContentRepository {
  readonly kind = "blob" as const;
  readonly writable = true;
  constructor(
    private store: BlobStore,
    private cached: Cached = identityCache,
    private invalidate: Invalidate = () => {},
  ) {}

  private readIndex() {
    return this.cached(["jm-index"], ["issues"], async () => (await getJson<IndexFile>(this.store, "index/issues.json")) ?? { slugs: [] });
  }

  async listIssues(): Promise<Issue[]> {
    const idx = await this.readIndex();
    const all = await Promise.all(idx.slugs.map((s) => this.getIssueVersioned(s.slug, s.updatedAt)));
    return all.filter((i): i is Issue => i !== null);
  }

  private getIssueVersioned(slug: string, version: string) {
    return this.cached(["jm-issue", slug, version], [`issue:${slug}`], async () => {
      const raw = await getJson<unknown>(this.store, `issues/${slug}.json`);
      const r = IssueSchema.safeParse(raw);
      return r.success ? r.data : null;
    });
  }

  async getIssue(slug: string): Promise<Issue | null> {
    if (!SLUG_RE.test(slug)) return null;
    const idx = await this.readIndex();
    const entry = idx.slugs.find((s) => s.slug === slug);
    return entry ? this.getIssueVersioned(slug, entry.updatedAt) : null;
  }

  /** Fresh read bypassing caches (editor, before writes). */
  async getIssueFresh(slug: string): Promise<Issue | null> {
    if (!SLUG_RE.test(slug)) return null;
    const r = IssueSchema.safeParse(await getJson<unknown>(this.store, `issues/${slug}.json`));
    return r.success ? r.data : null;
  }

  async saveIssue(issue: Issue): Promise<void> {
    const now = new Date().toISOString();
    const valid = IssueSchema.parse({ ...issue, updatedAt: now });
    const prev = await getJson<unknown>(this.store, `issues/${valid.slug}.json`);
    if (prev) await putJson(this.store, `history/${valid.slug}/${now.replace(/[:.]/g, "-")}.json`, prev);
    await putJson(this.store, `issues/${valid.slug}.json`, valid);
    const idx = (await getJson<IndexFile>(this.store, "index/issues.json")) ?? { slugs: [] };
    idx.slugs = [...idx.slugs.filter((s) => s.slug !== valid.slug), { slug: valid.slug, updatedAt: now }];
    await putJson(this.store, "index/issues.json", idx);
    this.invalidate(["issues", `issue:${valid.slug}`]);
  }

  async deleteIssue(slug: string): Promise<void> {
    if (!SLUG_RE.test(slug)) return;
    const prev = await getJson<unknown>(this.store, `issues/${slug}.json`);
    // Soft delete: the last version stays in history and can be restored.
    if (prev) await putJson(this.store, `history/${slug}/deleted-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, prev);
    await this.store.del(`issues/${slug}.json`);
    const idx = (await getJson<IndexFile>(this.store, "index/issues.json")) ?? { slugs: [] };
    idx.slugs = idx.slugs.filter((s) => s.slug !== slug);
    await putJson(this.store, "index/issues.json", idx);
    this.invalidate(["issues", `issue:${slug}`]);
  }

  async listVersions(slug: string): Promise<string[]> {
    if (!SLUG_RE.test(slug)) return [];
    return (await this.store.list(`history/${slug}/`)).map((p) => p.split("/").pop()!.replace(/\.json$/, "")).sort().reverse();
  }

  async readVersion(slug: string, version: string): Promise<Issue | null> {
    if (!SLUG_RE.test(slug) || !/^[a-z0-9-]+$/i.test(version)) return null;
    const r = IssueSchema.safeParse(await getJson<unknown>(this.store, `history/${slug}/${version}.json`));
    return r.success ? r.data : null;
  }

  async readPdf(file: string): Promise<Uint8Array | null> {
    if (!PDF_RE.test(file)) return null;
    return this.store.getBytes(`pdfs/${file}`);
  }

  async savePdf(file: string, data: Uint8Array): Promise<void> {
    if (!PDF_RE.test(file)) throw new Error("اسم ملف غير صالح");
    await this.store.put(`pdfs/${file}`, data, "application/pdf");
  }

  async readMedia(file: string): Promise<Uint8Array | null> {
    if (!MEDIA_RE.test(file)) return null;
    return this.store.getBytes(`media/${file}`);
  }

  async saveMedia(file: string, data: Uint8Array, contentType: string): Promise<void> {
    if (!MEDIA_RE.test(file)) throw new Error("اسم ملف غير صالح");
    await this.store.put(`media/${file}`, data, contentType);
  }
}
