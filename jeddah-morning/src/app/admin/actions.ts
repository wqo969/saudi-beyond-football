"use server";
import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/content";
import { ReadOnlyError } from "@/lib/content/repository";
import { formatIssues, IssueSchema, type Issue } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";

export interface SaveResult {
  ok: boolean;
  slug?: string;
  errors?: string[];
}

function refresh() {
  revalidatePath("/", "layout");
}

async function persist(candidate: unknown, opts: { mustBeNew?: boolean } = {}): Promise<SaveResult> {
  const parsed = IssueSchema.safeParse(candidate);
  if (!parsed.success) return { ok: false, errors: formatIssues(parsed.error) };
  const repo = getRepository();
  if (opts.mustBeNew && (await repo.getIssue(parsed.data.slug))) {
    return { ok: false, errors: [`يوجد عدد بالمعرّف ${parsed.data.slug} مسبقًا`] };
  }
  try {
    await repo.saveIssue(parsed.data);
  } catch (e) {
    return { ok: false, errors: [e instanceof ReadOnlyError ? e.message : "تعذّر الحفظ"] };
  }
  refresh();
  return { ok: true, slug: parsed.data.slug };
}

export async function saveIssueAction(json: string, isNew: boolean): Promise<SaveResult> {
  await requireAdmin();
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, errors: ["بيانات غير صالحة"] };
  }
  return persist(data, { mustBeNew: isNew });
}

export async function importIssueJsonAction(json: string, overwrite: boolean): Promise<SaveResult> {
  await requireAdmin();
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (e) {
    return { ok: false, errors: [`ملف JSON غير صالح: ${(e as Error).message}`] };
  }
  // Imported content defaults to draft unless it explicitly says otherwise, so nothing goes live by accident.
  if (data && typeof data === "object" && !("status" in data)) (data as Record<string, unknown>).status = "draft";
  return persist(data, { mustBeNew: !overwrite });
}

async function update(slug: string, patch: (i: Issue) => Issue): Promise<SaveResult> {
  await requireAdmin();
  const repo = getRepository();
  const issue = await repo.getIssue(slug);
  if (!issue) return { ok: false, errors: ["العدد غير موجود"] };
  return persist(patch(issue));
}

export async function publishNowAction(slug: string) {
  return update(slug, (i) => ({ ...i, status: "published", publishAt: i.publishAt ?? new Date().toISOString() }));
}

export async function unpublishAction(slug: string) {
  return update(slug, (i) => ({ ...i, status: "draft" }));
}

export async function deleteIssueAction(slug: string): Promise<SaveResult> {
  await requireAdmin();
  try {
    await getRepository().deleteIssue(slug);
  } catch (e) {
    return { ok: false, errors: [e instanceof ReadOnlyError ? e.message : "تعذّر الحذف"] };
  }
  refresh();
  return { ok: true };
}
