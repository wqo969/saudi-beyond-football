import { NextResponse } from "next/server";
import { pipelineAuthorized } from "@/lib/pipeline-auth";
import { publishIssue } from "@/lib/publish";

export async function POST(req: Request) {
  if (!pipelineAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  const r = await publishIssue(slug);
  return NextResponse.json(r, { status: r.ok ? 200 : 404 });
}
