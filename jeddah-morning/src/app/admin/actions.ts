"use server";
import { revalidatePath } from "next/cache";
import { getAllPlans, getRepository } from "@/lib/content";
import { nextStatus } from "@/lib/publishing";
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

/** Snapshot of the current engine plan, so a published issue never changes look later. */
async function frozenDesign(slug: string, issue: Issue): Promise<Issue["design"]> {
  if (issue.design.frozen) return issue.design;
  const plan = (await getAllPlans()).get(slug);
  if (!plan) return issue.design;
  return {
    ...issue.design,
    frozen: {
      palette: plan.palette.id, coverLayout: plan.coverLayout, contentsVariant: plan.contentsVariant, closingVariant: plan.closingVariant,
      pages: plan.pages.map((p) => ({ layout: p.layout, ...(p.articleId ? { articleId: p.articleId } : {}), ...(p.part != null ? { part: p.part } : {}) })),
      frozenAt: new Date().toISOString(),
    },
  };
}

export async function publishNowAction(slug: string) {
  await requireAdmin();
  const issue = await getRepository().getIssue(slug);
  if (!issue) return { ok: false, errors: ["العدد غير موجود"] };
  // Idempotent: publishing an already-published issue is a no-op (no double publication).
  if (issue.status === "published") return { ok: true, slug };
  const design = await frozenDesign(slug, issue);
  return update(slug, (i) => ({ ...i, design, status: "published", publishAt: i.publishAt && new Date(i.publishAt) <= new Date() ? i.publishAt : new Date().toISOString() }));
}

export async function advanceStatusAction(slug: string): Promise<SaveResult> {
  await requireAdmin();
  const issue = await getRepository().getIssue(slug);
  if (!issue) return { ok: false, errors: ["العدد غير موجود"] };
  const next = nextStatus(issue.status);
  if (!next) return { ok: false, errors: ["لا مرحلة بعد هذه"] };
  if (next === "scheduled" && !issue.publishAt) return { ok: false, errors: ["حدد موعد النشر قبل الجدولة"] };
  // Approval freezes the design so what was reviewed is exactly what gets published.
  const design = next === "approved" ? await frozenDesign(slug, issue) : issue.design;
  if (next === "published") return publishNowAction(slug);
  return update(slug, (i) => ({ ...i, design, status: next }));
}

export async function freezeDesignAction(slug: string, freeze: boolean): Promise<SaveResult> {
  await requireAdmin();
  const issue = await getRepository().getIssue(slug);
  if (!issue) return { ok: false, errors: ["العدد غير موجود"] };
  const design = freeze ? await frozenDesign(slug, issue) : { ...issue.design, frozen: undefined };
  return update(slug, (i) => ({ ...i, design }));
}

export async function archiveAction(slug: string) {
  return update(slug, (i) => ({ ...i, status: "archived" }));
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
