import { layoutById } from "@/lib/engine/layouts";
import type { DuplicateFinding } from "@/lib/engine/memory";
import type { IssuePlan, NoveltyReport } from "@/lib/engine/planner";
import { toArabicDigits } from "@/lib/dates";
import { FreezeButton } from "./FreezeButton";

/** Internal per-issue report: how different this issue is from previous ones (design + content). */
export function DesignReport({ slug, plan, novelty, duplicates }: { slug: string; plan: IssuePlan; novelty: NoveltyReport; duplicates: DuplicateFinding[] }) {
  return (
    <section className="mb-8 border border-rule p-4" aria-labelledby="design-report">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="design-report" className="font-[family-name:var(--font-display)] text-xl font-bold">تقرير الإخراج ومنع التكرار</h2>
        <FreezeButton slug={slug} frozen={plan.frozen} />
      </div>
      <div className="mt-3 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-muted">درجة الجِدّة</p>
          <p className="font-[family-name:var(--font-latin)] text-5xl text-gold">{novelty.score}</p>
          <p className="text-xs text-muted">مقارنة بـ: {novelty.comparedWith.join("، ") || "—"}</p>
        </div>
        <ul className="space-y-1 text-sm md:col-span-2">
          {novelty.checks.map((c) => (
            <li key={c.label} className="flex gap-2"><span className={c.ok ? "text-forest-soft" : "text-demo"}>{c.ok ? "✓" : "!"}</span><span className="font-semibold">{c.label}:</span><span className="text-muted">{c.detail}</span></li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-sm">
        <b>الهوية:</b> {plan.identity.latin} · <b>الغلاف:</b> {layoutById(plan.coverLayout)?.name} · <b>اللوحة:</b> {plan.palette.name} · <b>الفهرس:</b> {plan.contentsVariant} · <b>الخاتمة:</b> {plan.closingVariant} · <b>الصفحات:</b> {toArabicDigits(plan.pages.length)}
      </p>
      <ol className="mt-3 flex flex-wrap gap-1 text-[0.7rem]">
        {plan.pages.map((p, i) => (
          <li key={i} className="rounded border border-rule px-1.5 py-0.5"><span className="text-muted">{i + 1}</span> {layoutById(p.layout)?.name ?? p.layout}</li>
        ))}
      </ol>
      {plan.warnings.length > 0 && <ul className="mt-3 list-disc ps-5 text-sm text-demo">{plan.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}
      <h3 className="mt-4 text-sm font-semibold">الذاكرة التحريرية</h3>
      {duplicates.length === 0 ? (
        <p className="text-sm text-muted">لا تكرار في الترشيحات أو النصوص مقارنة بالأعداد السابقة.</p>
      ) : (
        <ul className="mt-1 list-disc ps-5 text-sm text-demo">{duplicates.map((d, i) => <li key={i}>{d.articleId}: {d.detail} (سبق في {d.previous.issueSlug})</li>)}</ul>
      )}
    </section>
  );
}
