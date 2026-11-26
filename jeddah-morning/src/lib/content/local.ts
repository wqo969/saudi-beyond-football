import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { IssueSchema, SLUG_RE, type Issue } from "../schema";
import { ReadOnlyError, type ContentRepository } from "./repository";

/** Data root: JM_DATA_ROOT (used by e2e tests on a temp copy) or the project folder. */
const ROOT = process.env.JM_DATA_ROOT || process.cwd();
const PDF_FILE_RE = /^[a-z0-9-]+\.pdf$/i;

/**
 * Filesystem repository for local development and review.
 * - Issues: content/issues/<slug>.json
 * - PDFs:   storage/pdfs/<file> (private uploads, git-ignored) then content/pdfs/<file> (committed demo files)
 */
export class LocalRepository implements ContentRepository {
  readonly kind = "local" as const;
  readonly writable: boolean;
  private issuesDir: string;
  private pdfDirs: string[];
  private uploadDir: string;

  constructor(opts: { root?: string; writable?: boolean } = {}) {
    const root = opts.root ?? ROOT;
    this.issuesDir = path.join(root, "content", "issues");
    this.uploadDir = path.join(root, "storage", "pdfs");
    this.pdfDirs = [this.uploadDir, path.join(root, "content", "pdfs")];
    this.writable = opts.writable ?? (process.env.VERCEL !== "1");
  }

  async listIssues(): Promise<Issue[]> {
    let files: string[] = [];
    try {
      files = (await fs.readdir(this.issuesDir)).filter((f) => f.endsWith(".json"));
    } catch {
      return [];
    }
    const issues = await Promise.all(files.map((f) => this.readFile(path.join(this.issuesDir, f))));
    return issues.filter((i): i is Issue => i !== null);
  }

  async getIssue(slug: string): Promise<Issue | null> {
    if (!SLUG_RE.test(slug)) return null;
    return this.readFile(path.join(this.issuesDir, `${slug}.json`));
  }

  private async readFile(file: string): Promise<Issue | null> {
    try {
      const raw = JSON.parse(await fs.readFile(file, "utf8"));
      const parsed = IssueSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn(`[content] invalid issue file ${path.basename(file)}:`, parsed.error.issues.slice(0, 3));
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  }

  async saveIssue(issue: Issue): Promise<void> {
    if (!this.writable) throw new ReadOnlyError();
    const valid = IssueSchema.parse({ ...issue, updatedAt: new Date().toISOString() });
    await fs.mkdir(this.issuesDir, { recursive: true });
    const target = path.join(this.issuesDir, `${valid.slug}.json`);
    const tmp = `${target}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(valid, null, 2) + "\n", "utf8");
    await fs.rename(tmp, target);
  }

  async deleteIssue(slug: string): Promise<void> {
    if (!this.writable) throw new ReadOnlyError();
    if (!SLUG_RE.test(slug)) return;
    await fs.rm(path.join(this.issuesDir, `${slug}.json`), { force: true });
  }

  async readPdf(file: string): Promise<Uint8Array | null> {
    if (!PDF_FILE_RE.test(file)) return null;
    for (const dir of this.pdfDirs) {
      try {
        return new Uint8Array(await fs.readFile(path.join(dir, file)));
      } catch {
        /* try next */
      }
    }
    return null;
  }

  async readMedia(file: string): Promise<Uint8Array | null> {
    if (!/^[a-z0-9-]+\.(jpe?g|png|webp|avif)$/i.test(file)) return null;
    for (const dir of [path.join(this.uploadDir, "..", "media"), path.join(this.issuesDir, "..", "media")]) {
      try {
        return new Uint8Array(await fs.readFile(path.join(dir, file)));
      } catch {
        /* next */
      }
    }
    return null;
  }

  async saveMedia(file: string, data: Uint8Array): Promise<void> {
    if (!this.writable) throw new ReadOnlyError();
    if (!/^[a-z0-9-]+\.(jpe?g|png|webp|avif)$/i.test(file)) throw new Error("اسم ملف غير صالح");
    const dir = path.join(this.uploadDir, "..", "media");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, file), data);
  }

  async savePdf(file: string, data: Uint8Array): Promise<void> {
    if (!this.writable) throw new ReadOnlyError();
    if (!PDF_FILE_RE.test(file)) throw new Error("اسم ملف غير صالح");
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.writeFile(path.join(this.uploadDir, file), data);
  }
}
