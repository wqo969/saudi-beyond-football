import Link from "next/link";
import { IssueRowActions } from "@/components/admin/IssueRowActions";
import { DemoBadge } from "@/components/DemoBadge";
import { listAllIssues } from "@/lib/content";
import { editionName, formatDateTime, formatShortArabicDate, toArabicDigits } from "@/lib/dates";
import { effectiveStatus } from "@/lib/publishing";

const STATUS_LABEL = {
  draft: { text: "مسودة", cls: "bg-paper-3 text-ink-soft" },
  scheduled: { text: "مجدول", cls: "bg-gold/20 text-gold" },
  published: { text: "منشور", cls: "bg-forest text-on-forest" },
  "auto-published": { text: "نُشر تلقائيًا", cls: "bg-forest-soft text-on-forest" },
} as const;

export default async function AdminHome() {
  const issues = await listAllIssues();
  const now = new Date();
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">الأعداد</h1>
          <p className="text-sm text-muted">{toArabicDigits(issues.length)} عددًا · الأعداد المجدولة تظهر للقراء تلقائيًا عند حلول موعدها</p>
        </div>
        <Link href="/admin/issues/new" className="rounded-full bg-forest px-5 py-2 text-sm text-on-forest">+ عدد جديد</Link>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-ink text-start text-xs text-muted">
              <th className="py-2 text-start">العدد</th>
              <th className="py-2 text-start">التاريخ</th>
              <th className="py-2 text-start">الحالة</th>
              <th className="py-2 text-start">المحتوى</th>
              <th className="py-2 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => {
              const st = effectiveStatus(i, now);
              return (
                <tr key={i.slug} className="border-b border-rule align-top">
                  <td className="py-3">
                    <Link href={`/admin/issues/${i.slug}`} className="font-[family-name:var(--font-display)] text-base font-bold hover:text-gold">{i.title}</Link>
                    <p className="text-xs text-muted" dir="ltr">{i.slug}</p>
                    {i.isDemo && <DemoBadge className="mt-1" />}
                  </td>
                  <td className="py-3">{formatShortArabicDate(i.date)}<br /><span className="text-xs text-muted">{editionName(i.edition)} · رقم {toArabicDigits(i.number)}</span></td>
                  <td className="py-3">
                    <span className={`rounded px-2 py-0.5 text-xs ${STATUS_LABEL[st].cls}`}>{STATUS_LABEL[st].text}</span>
                    {i.status === "scheduled" && i.publishAt && <p className="mt-1 text-xs text-muted">{formatDateTime(i.publishAt)}</p>}
                  </td>
                  <td className="py-3 text-xs text-muted">{toArabicDigits(i.articles.length)} مقالًا{i.pdf ? " · PDF" : ""}</td>
                  <td className="py-3"><IssueRowActions slug={i.slug} status={i.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {issues.length === 0 && <p className="py-12 text-center text-muted">لا توجد أعداد. ابدأ بعدد جديد أو استورد ملفًا.</p>}
      </div>
    </>
  );
}
