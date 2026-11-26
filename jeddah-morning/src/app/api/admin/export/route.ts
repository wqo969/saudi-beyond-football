import { NextResponse } from "next/server";
import { listAllIssues } from "@/lib/content";
import { kv } from "@/lib/content/store";
import { logOp } from "@/lib/ops-log";
import { getSession } from "@/lib/session";

/** Full content backup as JSON (issues + trusted sources). Never includes passwords, keys or subscriptions. */
export async function GET() {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ ok: false }, { status: 403 });
  const issues = await listAllIssues();
  await logOp("backup", `تصدير نسخة احتياطية (${issues.length} عددًا)`, "success");
  return new NextResponse(JSON.stringify({ app: "jeddah-morning", exportedAt: new Date().toISOString(), issues, sources: (await kv.get("sources")) ?? [] }, null, 1), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="jeddah-morning-backup-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" },
  });
}
