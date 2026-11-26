import { NextResponse } from "next/server";
import { listVisibleIssues } from "@/lib/content";
import { buildSearchIndex } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET() {
  const index = buildSearchIndex(await listVisibleIssues());
  return NextResponse.json({ generatedAt: new Date().toISOString(), docs: index }, { headers: { "Cache-Control": "private, no-cache" } });
}
