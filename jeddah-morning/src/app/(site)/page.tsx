import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { DemoNotice } from "@/components/DemoBadge";
import { IssueCover } from "@/components/IssueCover";
import { getFeaturedIssues } from "@/lib/content";
import { formatArabicDate, riyadhDateKey, riyadhHour } from "@/lib/dates";
import { SECTIONS, SECTION_KEYS } from "@/lib/sections";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ edition?: string }> }) {
  const { edition: requested } = await searchParams;
  const today = riyadhDateKey();
  const { date, morning, evening, isToday } = await getFeaturedIssues(today);

  if (!morning && !evening) {
    return (
      <section className="px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">لا يوجد عدد منشور بعد</h1>
        <p className="mt-3 text-muted">حين يُنشر أول عدد سيظهر غلافه هنا.</p>
      </section>
    );
  }

  const prefersEvening = requested ? requested === "evening" : riyadhHour() >= 15;
  const issue = (prefersEvening ? evening ?? morning : morning ?? evening)!;
  const lead = issue.articles[0];
  const rest = issue.articles.slice(1);

  return (
    <>
      {issue.isDemo && <DemoNotice />}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-xs text-muted">{isToday ? "عدد اليوم" : `آخر عدد منشور · ${formatArabicDate(date!)}`}</p>
        <div role="tablist" aria-label="اختر العدد" className="flex rounded-full border border-rule p-0.5 text-sm">
          {(["morning", "evening"] as const).map((ed) => {
            const available = ed === "morning" ? morning : evening;
            const active = issue.edition === ed;
            const label = ed === "morning" ? "الصباحي" : "المسائي";
            return available ? (
              <Link key={ed} role="tab" aria-selected={active} href={`/?edition=${ed}`} className={`rounded-full px-4 py-1 ${active ? "bg-forest text-on-forest" : "text-ink-soft"}`}>
                {label}
              </Link>
            ) : (
              <span key={ed} role="tab" aria-selected={false} aria-disabled className="cursor-not-allowed px-4 py-1 text-muted/60" title="لم يُنشر بعد">
                {label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="md:px-4">
        <IssueCover issue={issue} priority />
      </div>

      {issue.articles.length > 0 && (
        <section className="px-4 pt-10" aria-labelledby="in-issue">
          <div className="rule-double mb-2" />
          <h2 id="in-issue" className="flex items-baseline justify-between">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold">في هذا العدد</span>
            <Link href={`/issue/${issue.slug}`} className="text-sm text-forest-soft dark:text-gold">
              الفهرس الكامل ←
            </Link>
          </h2>
          <div className="mt-6">{lead && <ArticleCard issue={issue} article={lead} layout="lead" />}</div>
          <div className="mt-6 grid gap-x-10 md:grid-cols-2">
            {rest.map((a) => (
              <ArticleCard key={a.id} issue={issue} article={a} />
            ))}
          </div>
        </section>
      )}

      <section className="px-4 pt-12" aria-labelledby="sections">
        <h2 id="sections" className="font-[family-name:var(--font-display)] text-2xl font-bold">الأقسام</h2>
        <ul className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {SECTION_KEYS.map((k) => (
            <li key={k} className="shrink-0">
              <Link href={`/search?section=${k}`} className="block rounded-full border border-rule px-4 py-1.5 text-sm hover:border-gold hover:text-forest-soft dark:hover:text-gold">
                {SECTIONS[k].name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
