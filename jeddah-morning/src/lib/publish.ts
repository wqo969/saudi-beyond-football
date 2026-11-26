import "server-only";
import { revalidatePath } from "next/cache";
import { getAllPlans, getRepository } from "./content";
import { logOp } from "./ops-log";
import type { Issue } from "./schema";

/** Snapshot of the current engine plan, so a published issue never changes look later. */
export async function frozenDesign(slug: string, issue: Issue): Promise<Issue["design"]> {
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

/** Idempotent publication: publishing an already-published issue does nothing (no double publish, no double notification). */
export async function publishIssue(slug: string): Promise<{ ok: boolean; already?: boolean; error?: string }> {
  const repo = getRepository();
  const issue = (repo.getIssueFresh ? await repo.getIssueFresh(slug) : null) ?? (await repo.getIssue(slug));
  if (!issue) return { ok: false, error: "not-found" };
  if (issue.status === "published") {
    await logOp("publish", "النشر متجاهَل: العدد منشور مسبقًا", "skipped", slug);
    return { ok: true, already: true };
  }
  const design = await frozenDesign(slug, issue);
  const now = new Date();
  await repo.saveIssue({ ...issue, design, status: "published", publishAt: issue.publishAt && new Date(issue.publishAt) <= now ? issue.publishAt : now.toISOString() });
  revalidatePath("/", "layout");
  await logOp("publish", "نُشر العدد", "success", slug);
  return { ok: true };
}
