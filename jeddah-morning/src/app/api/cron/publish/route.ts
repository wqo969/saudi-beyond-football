import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { listAllIssues } from "@/lib/content";
import { isVisible } from "@/lib/publishing";

export const dynamic = "force-dynamic";

/**
 * Scheduled-publishing hook (inactive by default).
 * Visibility of scheduled issues is already computed per request, so this endpoint is only needed to
 * refresh caches and (later) send notifications. Enable by setting JM_CRON_SECRET and calling with
 * `Authorization: Bearer <secret>` from Vercel Cron (free, daily on Hobby) or a GitHub Actions schedule.
 */
export async function GET(req: Request) {
  const secret = process.env.JM_CRON_SECRET;
  if (!secret) return NextResponse.json({ ok: false, reason: "disabled" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ ok: false }, { status: 401 });
  const now = new Date();
  const due = (await listAllIssues()).filter((i) => i.status === "scheduled" && isVisible(i, now)).map((i) => i.slug);
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, visibleScheduled: due, notified: 0 });
}
