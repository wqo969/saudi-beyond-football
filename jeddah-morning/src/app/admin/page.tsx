import Link from "next/link";
import { IssueRowActions } from "@/components/admin/IssueRowActions";
import { DemoBadge } from "@/components/DemoBadge";
import { getAllPlans, listAllIssues } from "@/lib/content";
import { editionName, formatDateTime, formatShortArabicDate, toArabicDigits } from "@/lib/dates";
import { noveltyReport, type Fingerprint } from "@/lib/engine/planner";
import { compareIssuesAsc, effectiveStatus } from "@/lib/publishing";
import { STATUS_LABELS } from "@/lib/schema";

export default async function AdminHome() {
  const [issues, plans] = await Promise.all([listAllIssues(), getAllPlans()]);
  const now = new Date();
  // novelty vs. earlier issues, chronologically
  const novelty = new Map<string, number>();
  const hist: Fingerprint[] = [];
  for (const i of [...issues].sort(compareIssuesAsc)) {
    const fp = plans.get(i.slug)!.fingerprint;
    novelty.set(i.slug, noveltyReport(fp, hist).score);
    hist.unshift(fp);
  }
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">الأعداد</h1>
          <p className="text-sm text-muted">{toArabicDigits(issues.length)} عددًا · المسار: مسودة ← مراجعة تحريرية ← تدقيق ← مراجعة تصميم ← معتمد ← مجدول ← منشور ← مؤرشف</p>
        </div>
        <Link href="/admin/issues/new" className="rounded-full bg-forest px-5 py-2 text-sm text-on-forest">+ عدد جديد</Link>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-xs text-muted">
              <th className="py-2 text-start">العدد</th><th className="py-2 text-start">التاريخ</th><th className="py-2 text-start">الحالة</th><th className="py-2 text-start">التصميم</th><th className="py-2 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => {
              const st = effectiveStatus(i, now);
              const plan = plans.get(i.slug)!;
              return (
                <tr key={i.slug} className="border-b border-rule align-top">
                  <td className="py-3">
                    <Link href={`/admin/issues/${i.slug}`} className="font-[family-name:var(--font-display)] text-base font-bold hover:text-gold">{i.title}</Link>
                    <p className="text-xs text-muted" dir="ltr">{i.slug}</p>
                    {i.isDemo && <DemoBadge className="mt-1" />}
                  </td>
                  <td className="py-3">{formatShortArabicDate(i.date)}<br /><span className="text-xs text-muted">{editionName(i.edition)} · {plan.identity.latin}</span></td>
                  <td className="py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${st === "published" || st === "auto-published" ? "bg-forest text-on-forest" : st === "scheduled" ? "bg-gold/20 text-gold" : "bg-paper-3"}`}>{st === "auto-published" ? "نُشر تلقائيًا" : STATUS_LABELS[st]}</span>
                    {i.status === "scheduled" && i.publishAt && <p className="mt-1 text-xs text-muted">{formatDateTime(i.publishAt)}</p>}
                  </td>
                  <td className="py-3 text-xs text-muted">
                    {toArabicDigits(plan.pages.length)} صفحة · {plan.palette.name}<br />
                    الجِدّة: <b className="text-ink">{toArabicDigits(novelty.get(i.slug) ?? 0)}</b>/١٠٠{plan.frozen ? " · مجمّد" : ""}
                  </td>
                  <td className="py-3"><IssueRowActions slug={i.slug} status={i.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
