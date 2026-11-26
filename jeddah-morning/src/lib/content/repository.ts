import type { Issue } from "../schema";

export interface ContentRepository {
  readonly kind: "local" | "supabase" | "blob";
  /** Whether this backend accepts writes in the current runtime. */
  readonly writable: boolean;
  listIssues(): Promise<Issue[]>;
  getIssue(slug: string): Promise<Issue | null>;
  saveIssue(issue: Issue): Promise<void>;
  deleteIssue(slug: string): Promise<void>;
  readPdf(file: string): Promise<Uint8Array | null>;
  savePdf(file: string, data: Uint8Array): Promise<void>;
  readMedia?(file: string): Promise<Uint8Array | null>;
  saveMedia?(file: string, data: Uint8Array, contentType: string): Promise<void>;
  listVersions?(slug: string): Promise<string[]>;
  readVersion?(slug: string, version: string): Promise<import("../schema").Issue | null>;
  getIssueFresh?(slug: string): Promise<import("../schema").Issue | null>;
}

export class ReadOnlyError extends Error {
  constructor() {
    super("مصدر المحتوى الحالي للقراءة فقط في هذه البيئة");
  }
}
