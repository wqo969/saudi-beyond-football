import { SourcesEditor } from "@/components/admin/SourcesEditor";
import { listAllIssues } from "@/lib/content";
import { kv } from "@/lib/content/store";
import type { TrustedSource } from "../ops-actions";
import { toArabicDigits } from "@/lib/dates";

export const metadata = { title: "المصادر" };

export default async function SourcesPage() {
  const [issues, trusted] = await Promise.all([listAllIssues(), kv.get<TrustedSource[]>("sources")]);
  const used = new Map<string, { name: string; url?: string; count: number; last: string }>();
  for (const i of issues)
    for (const a of i.articles)
      for (const s of a.sources) {
        const k = s.url ?? s.name;
        const e = used.get(k) ?? { name: s.name, url: s.url, count: 0, last: i.date };
        e.count++;
        if (i.date > e.last) e.last = i.date;
        used.set(k, e);
      }
  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">المصادر</h1>
        <p className="text-sm text-muted">قائمة المصادر الموثوقة المعتمدة لكل قسم. خط الإنتاج اليومي يقرأ هذه القائمة.</p>
        <SourcesEditor initial={trusted ?? []} />
      </section>
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">المصادر المستخدمة فعليًا</h2>
        {used.size === 0 && <p className="mt-2 text-sm text-muted">لا مصادر بعد.</p>}
        <ul className="mt-3 divide-y divide-rule text-sm">
          {[...used.values()].sort((a, b) => b.count - a.count).map((s) => (
            <li key={s.url ?? s.name} className="flex flex-wrap items-baseline gap-2 py-2">
              {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name}</a> : s.name}
              <span className="text-xs text-muted">· {toArabicDigits(s.count)} مرة · آخر استخدام {s.last}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
