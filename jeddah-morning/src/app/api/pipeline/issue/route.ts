import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/content";
import { logOp } from "@/lib/ops-log";
import { pipelineAuthorized } from "@/lib/pipeline-auth";
import { formatIssues, IssueSchema } from "@/lib/schema";

/** Create or replace an issue (validated). Imported issues default to draft unless they say otherwise. */
export async function POST(req: Request) {
  if (!(await pipelineAuthorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body && typeof body === "object" && !("status" in body)) (body as Record<string, unknown>).status = "draft";
  const r = IssueSchema.safeParse(body);
  if (!r.success) return NextResponse.json({ ok: false, errors: formatIssues(r.error) }, { status: 400 });
  const repo = getRepository();
  const existing = repo.getIssueFresh ? await repo.getIssueFresh(r.data.slug) : await repo.getIssue(r.data.slug);
  if (existing?.status === "published" && r.data.status !== "published") {
    return NextResponse.json({ ok: false, errors: ["العدد منشور؛ استخدم مسار التصحيح بدل الاستبدال"] }, { status: 409 });
  }
  // Keep a frozen design when replacing a published issue (corrections never change its look).
  const issue = existing?.design.frozen && !r.data.design.frozen ? { ...r.data, design: existing.design } : r.data;
  await repo.saveIssue(issue);
  revalidatePath("/", "layout");
  await logOp("import", existing ? "استبدال عدد عبر خط الإنتاج" : "إنشاء عدد عبر خط الإنتاج", "success", issue.slug);
  return NextResponse.json({ ok: true, slug: issue.slug });
}
