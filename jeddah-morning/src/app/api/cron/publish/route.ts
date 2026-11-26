import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { listAllIssues } from "@/lib/content";
import { issuePushPayload } from "@/lib/notifications";
import { logOp } from "@/lib/ops-log";
import { isVisible } from "@/lib/publishing";
import { notifyIssueOnce, readAutomation } from "@/lib/push";

export const dynamic = "force-dynamic";

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret}`;
  return !!secret && given.length === want.length && timingSafeEqual(Buffer.from(given), Buffer.from(want));
}

/**
 * Daily safety net (Vercel Cron, free: once a day per job at ~07:35 and ~22:35 Riyadh).
 * Scheduled issues already become visible by time; this refreshes caches and sends any missed
 * notification exactly once. Disabled when automation is paused in the admin.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const auto = await readAutomation();
  if (!auto.enabled) {
    await logOp("cron", "الأتمتة موقوفة من لوحة الإدارة", "skipped");
    return NextResponse.json({ ok: true, paused: true });
  }
  revalidatePath("/", "layout");
  const now = new Date();
  const recent = (await listAllIssues()).filter((i) => isVisible(i, now) && !i.isDemo && now.getTime() - new Date(i.publishAt ?? `${i.date}T00:00:00+03:00`).getTime() < 36 * 3600_000);
  const results = [];
  for (const i of recent) results.push({ slug: i.slug, ...(await notifyIssueOnce(i.slug, issuePushPayload(i))) });
  await logOp("cron", `فحص يومي: ${recent.length} عدد حديث`, "success");
  return NextResponse.json({ ok: true, results });
}
