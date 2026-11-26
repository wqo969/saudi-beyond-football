import { NextResponse } from "next/server";
import { getRepository } from "@/lib/content";
import { issuePushPayload } from "@/lib/notifications";
import { pipelineAuthorized } from "@/lib/pipeline-auth";
import { notifyIssueOnce } from "@/lib/push";

export async function POST(req: Request) {
  if (!pipelineAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const issue = await getRepository().getIssue(slug);
  if (!issue) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, ...(await notifyIssueOnce(slug, issuePushPayload(issue))) });
}
