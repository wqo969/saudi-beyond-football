import { AutomationToggle, RestoreBackup } from "@/components/admin/OpsClient";
import { listAllIssues } from "@/lib/content";
import { backend } from "@/lib/content/store";
import { readOps } from "@/lib/ops-log";
import { pushConfigured, readAutomation, readSubs } from "@/lib/push";
import { formatDateTime, toArabicDigits } from "@/lib/dates";

export const metadata = { title: "العمليات" };

const LIMITS = [
  ["Vercel Hobby", "نقل 100GB/شهر · مليون استدعاء · Cron مرة يوميًا لكل مهمة · استخدام شخصي غير تجاري", "تتوقف الميزة حتى نهاية الدورة؛ لا فوترة"],
  ["Vercel Blob (خاص)", "ضمن حدود Hobby المجانية (عمليات ونقل وتخزين)", "يتوقف الوصول للتخزين مؤقتًا؛ لا فوترة"],
  ["Web Push", "مجاني (خدمات Apple/Google/Mozilla)", "—"],
  ["GitHub", "مستودع وحفظ الكود", "—"],
] as const;

export default async function OperationsPage() {
  const [ops, auto, issues, subs, pushOn] = await Promise.all([readOps(), readAutomation(), listAllIssues(), readSubs(), pushConfigured()]);
  const count = (area: string, outcome?: string) => ops.filter((o) => o.area === area && (!outcome || o.outcome === outcome)).length;
  const pdfs = issues.filter((i) => i.pdf).length;
  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">العمليات والأتمتة</h1>
        <p className="text-sm text-muted">التخزين: {backend() === "blob" ? "Vercel Blob خاص" : backend() === "blob-fs" ? "تخزين محلي (اختبار)" : "ملفات محلية"} · الإشعارات: {pushOn ? `مفعّلة (${toArabicDigits(subs.length)} جهاز)` : "غير مهيأة"}</p>
        <AutomationToggle enabled={auto.enabled} />
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">مراقبة الاستهلاك المجاني</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[["الأعداد", issues.length], ["نسخ PDF", pdfs], ["عمليات النشر هذا الشهر", count("publish", "success")], ["إشعارات أُرسلت", count("notify", "success")]].map(([l, v]) => (
            <div key={String(l)} className="border border-rule p-3"><p className="text-xs text-muted">{l}</p><p className="font-[family-name:var(--font-latin)] text-3xl">{toArabicDigits(Number(v))}</p></div>
          ))}
        </div>
        <table className="mt-4 w-full text-sm">
          <thead><tr className="border-b border-ink text-xs text-muted"><th className="py-1 text-start">الخدمة</th><th className="py-1 text-start">الحد المجاني</th><th className="py-1 text-start">عند التجاوز</th></tr></thead>
          <tbody>{LIMITS.map(([a, b, c]) => <tr key={a} className="border-b border-rule"><td className="py-2">{a}</td><td className="py-2 text-xs">{b}</td><td className="py-2 text-xs">{c}</td></tr>)}</tbody>
        </table>
        <p className="mt-2 text-xs text-muted">استهلاك Vercel التفصيلي يظهر في لوحة Vercel (Usage). التطبيق يقلل عمليات التخزين بالتخزين المؤقت ولا يقرأ إلا عند تغيّر المحتوى.</p>
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">النسخ الاحتياطي والاستعادة</h2>
        <a href="/api/admin/export" className="mt-3 inline-block rounded-full bg-forest px-5 py-2 text-sm text-on-forest">تنزيل نسخة احتياطية (JSON)</a>
        <p className="mt-2 text-xs text-muted">تشمل الأعداد والمصادر الموثوقة. لا تشمل كلمات المرور أو المفاتيح أو اشتراكات الإشعارات.</p>
        <RestoreBackup />
      </section>

      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">سجل العمليات والأخطاء (هذا الشهر)</h2>
        {ops.length === 0 && <p className="mt-2 text-sm text-muted">لا عمليات مسجلة بعد.</p>}
        <ul className="mt-3 divide-y divide-rule text-sm">
          {ops.slice(0, 100).map((o, i) => (
            <li key={i} className="flex flex-wrap gap-2 py-2">
              <span className={o.outcome === "failure" ? "text-demo" : o.outcome === "skipped" ? "text-muted" : "text-forest-soft"}>{o.outcome === "failure" ? "✗" : o.outcome === "skipped" ? "–" : "✓"}</span>
              <span className="text-xs text-muted">{formatDateTime(o.at)}</span>
              <span className="rounded bg-paper-2 px-1.5 text-xs">{o.area}</span>
              <span>{o.message}</span>
              {o.ref && <span className="text-xs text-muted" dir="ltr">{o.ref}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
