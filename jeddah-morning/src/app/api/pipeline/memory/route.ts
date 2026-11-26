import { NextResponse } from "next/server";
import { listAllIssues } from "@/lib/content";
import { buildMemory, MEMORY_WINDOW_DAYS } from "@/lib/engine/memory";
import { pipelineAuthorized } from "@/lib/pipeline-auth";

/** Editorial memory for the last 90 days: everything the next issue must not repeat (songs, films, puzzles, expressions…). */
export async function GET(req: Request) {
  if (!pipelineAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const since = new Date(Date.now() - MEMORY_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const issues = (await listAllIssues()).filter((i) => i.date >= since && !i.isDemo);
  return NextResponse.json({
    memory: buildMemory(issues),
    titles: issues.flatMap((i) => i.articles.map((a) => ({ issue: i.slug, section: a.section, title: a.title }))),
    sources: issues.flatMap((i) => i.articles.flatMap((a) => a.sources.map((s) => s.url).filter(Boolean))),
  });
}
