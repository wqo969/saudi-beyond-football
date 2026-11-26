import type { Issue } from "../schema";

export interface ContentRepository {
  readonly kind: "local" | "supabase";
  /** Whether this backend accepts writes in the current runtime. */
  readonly writable: boolean;
  listIssues(): Promise<Issue[]>;
  getIssue(slug: string): Promise<Issue | null>;
  saveIssue(issue: Issue): Promise<void>;
  deleteIssue(slug: string): Promise<void>;
  readPdf(file: string): Promise<Uint8Array | null>;
  savePdf(file: string, data: Uint8Array): Promise<void>;
}

export class ReadOnlyError extends Error {
  constructor() {
    super("مصدر المحتوى الحالي للقراءة فقط في هذه البيئة");
  }
}
