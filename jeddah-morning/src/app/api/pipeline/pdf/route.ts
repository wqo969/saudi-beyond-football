import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getRepository } from "@/lib/content";
import { logOp } from "@/lib/ops-log";
import { pipelineAuthorized } from "@/lib/pipeline-auth";
import { SLUG_RE } from "@/lib/schema";

/** Upload the PDF edition and attach it to the issue. */
export async function POST(req: Request) {
  if (!(await pipelineAuthorized(req))) return NextResponse.json({ ok: false }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!SLUG_RE.test(slug)) return NextResponse.json({ ok: false, errors: ["slug"] }, { status: 400 });
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length > 4_000_000 || bytes.length < 5 || String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") return NextResponse.json({ ok: false, errors: ["not a pdf or too large"] }, { status: 400 });
  const repo = getRepository();
  const issue = repo.getIssueFresh ? await repo.getIssueFresh(slug) : await repo.getIssue(slug);
  if (!issue) return NextResponse.json({ ok: false, errors: ["not found"] }, { status: 404 });
  const file = `${slug}.pdf`;
  await repo.savePdf(file, bytes);
  await repo.saveIssue({ ...issue, pdf: { file } });
  revalidatePath("/", "layout");
  await logOp("pdf", `رُفعت نسخة PDF (${Math.round(bytes.length / 1024)}KB)`, "success", slug);
  return NextResponse.json({ ok: true, file });
}
