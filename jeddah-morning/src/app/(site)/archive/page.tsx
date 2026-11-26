import type { Metadata } from "next";
import Link from "next/link";
import { DemoBadge } from "@/components/DemoBadge";
import { CoverFrame } from "@/components/magazine/CoverFrame";
import { getAllPlans, listVisibleIssues } from "@/lib/content";
import { editionName, formatMonthKey, formatShortArabicDate, toArabicDigits } from "@/lib/dates";

export const metadata: Metadata = { title: "الأرشيف" };

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ edition?: string; month?: string }> }) {
  const { edition, month } = await searchParams;
  const [all, plans] = await Promise.all([listVisibleIssues(), getAllPlans()]);
  const months = [...new Set(all.map((i) => i.date.slice(0, 7)))];
  const issues = all.filter((i) => (!edition || i.edition === edition) && (!month || i.date.startsWith(month)));
  const grouped = new Map<string, typeof issues>();
  for (const i of issues) grouped.set(i.date.slice(0, 7), [...(grouped.get(i.date.slice(0, 7)) ?? []), i]);
  const q = (p: Record<string, string | undefined>) => {
    const s = new URLSearchParams(Object.entries({ edition, month, ...p }).filter(([, v]) => v) as [string, string][]).toString();
    return s ? `/archive?${s}` : "/archive";
  };
  const chip = (active: boolean) => `rounded-full border px-3 py-1 text-sm ${active ? "border-forest bg-forest text-on-forest" : "border-rule"}`;
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">الأرشيف</h1>
      <p className="mt-1 text-sm text-muted">{toArabicDigits(all.length)} عددًا منشورًا · <Link href="/covers" className="underline">أرشيف الأغلفة</Link> · <Link href="/specials" className="underline">الأعداد الخاصة</Link></p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link href={q({ edition: undefined })} className={chip(!edition)}>الكل</Link>
        <Link href={q({ edition: "morning" })} className={chip(edition === "morning")}>الصباحية</Link>
        <Link href={q({ edition: "evening" })} className={chip(edition === "evening")}>المسائية</Link>
        <Link href={q({ edition: "special" })} className={chip(edition === "special")}>الخاصة</Link>
        <span className="mx-1 w-px bg-rule" />
        {months.map((m) => <Link key={m} href={q({ month: month === m ? undefined : m })} className={chip(month === m)}>{formatMonthKey(m)}</Link>)}
      </div>
      {issues.length === 0 && <p className="py-16 text-center text-muted">لا توجد أعداد مطابقة.</p>}
      {[...grouped.entries()].map(([m, list]) => (
        <section key={m} className="mt-8">
          <h2 className="border-b border-ink pb-1 font-[family-name:var(--font-display)] text-xl font-bold">{formatMonthKey(m)}</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {list.map((i) => (
              <li key={i.slug}>
                <Link href={`/issue/${i.slug}`} className="group block">
                  <CoverFrame issue={i} plan={plans.get(i.slug)!} scale={0.4} />
                  <p className="mt-2 text-sm font-semibold">{formatShortArabicDate(i.date)}<span className="sr-only"> — {i.title}</span></p>
                  <p className="flex items-center gap-2 text-xs text-muted">{editionName(i.edition)} {i.isDemo && <DemoBadge />}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
