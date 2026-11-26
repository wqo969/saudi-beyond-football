import "server-only";
import type { Issue } from "../schema";
import type { ContentRepository } from "./repository";

/**
 * Phase 2 placeholder. Intentionally NOT implemented yet: no Supabase project exists until the
 * first version is reviewed (see PROGRESS.md). Schema + RLS live in supabase/migrations/.
 * Plan: PostgREST via fetch with the service-role key on the server only; PDFs in a private
 * Storage bucket served through short-lived signed URLs.
 */
export class SupabaseRepository implements ContentRepository {
  readonly kind = "supabase" as const;
  readonly writable = false;
  private fail(): never {
    throw new Error("مستودع Supabase لم يُفعّل بعد (المرحلة الثانية). استخدم JM_CONTENT_BACKEND=local.");
  }
  listIssues(): Promise<Issue[]> { return this.fail(); }
  getIssue(): Promise<Issue | null> { return this.fail(); }
  saveIssue(): Promise<void> { return this.fail(); }
  deleteIssue(): Promise<void> { return this.fail(); }
  readPdf(): Promise<Uint8Array | null> { return this.fail(); }
  savePdf(): Promise<void> { return this.fail(); }
}
