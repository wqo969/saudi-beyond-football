import { NextResponse } from "next/server";
import { getAllPlans, listAllIssues } from "@/lib/content";
import { pipelineAuthorized } from "@/lib/pipeline-auth";

/** Lightweight list for the pipeline: what exists, its status and design fingerprint (for anti-repetition). */
export async function GET(req: Request) {
  if (!pipelineAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const [issues, plans] = await Promise.all([listAllIssues(), getAllPlans()]);
  return NextResponse.json({
    issues: issues.map((i) => ({ slug: i.slug, date: i.date, edition: i.edition, number: i.number, status: i.status, publishAt: i.publishAt, isDemo: i.isDemo, title: i.title, coverHeadline: i.coverHeadline, pdf: !!i.pdf, fingerprint: plans.get(i.slug)?.fingerprint })),
  });
}
