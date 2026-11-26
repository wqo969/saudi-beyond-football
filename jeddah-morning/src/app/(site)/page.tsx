import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { DemoNotice } from "@/components/DemoBadge";
import { ForYou } from "@/components/ForYou";
import { CoverFrame } from "@/components/magazine/CoverFrame";
import { getFeaturedIssues, getPlan, listVisibleIssues } from "@/lib/content";
import { articleById } from "@/lib/engine/planner";
import { formatArabicDate, riyadhDateKey, riyadhHour, toArabicDigits } from "@/lib/dates";
import { SECTIONS, SECTION_KEYS } from "@/lib/sections";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ edition?: string }> }) {
  const { edition: requested } = await searchParams;
  const today = riyadhDateKey();
  const { date, morning, evening, special, isToday } = await getFeaturedIssues(today);

  if (!morning && !evening && !special) {
    return (
      <section className="px-6 py-24 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">لا يوجد عدد منشور بعد</h1>
        <p className="mt-3 text-muted">حين يُنشر أول عدد سيظهر غلافه هنا.</p>
        <Link href="/next" className="mt-6 inline-block text-sm text-gold underline">موعد العدد القادم</Link>
      </section>
    );
  }

  const byEdition = { morning, evening, special };
  const fallback = riyadhHour() >= 22 || riyadhHour() < 4 ? evening ?? morning ?? special : morning ?? special ?? evening;
  const issue = (requested && byEdition[requested as keyof typeof byEdition]) || fallback!;
  const plan = (await getPlan(issue.slug))!;
  const articles = plan.order.map((id) => articleById(issue, id)!);
  const [lead, ...rest] = articles;
  const minutes = articles.reduce((s, a) => s + (a.readingMinutes ?? 2), 0);
  const recent = (await listVisibleIssues()).filter((i) => i.slug !== issue.slug).slice(0, 6);
  const index = (await listVisibleIssues()).flatMap((i) => i.articles.map((a) => ({ issueSlug: i.slug, id: a.id, title: a.title, section: a.section, date: i.date })));

  return (
    <>
      {issue.isDemo && <DemoNotice />}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-muted">{isToday ? "عدد اليوم" : `آخر عدد منشور · ${formatArabicDate(date!)}`}</p>
          <p className="latin-caps truncate text-gold">{plan.identity.latin}</p>
        </div>
        <div role="tablist" aria-label="اختر العدد" className="flex shrink-0 rounded-full border border-rule p-0.5 text-sm">
          {(["morning", "evening", "special"] as const).map((ed) => {
            const available = byEdition[ed];
            if (ed === "special" && !available) return null;
            const active = issue.edition === ed;
            const label = ed === "morning" ? "الصباحي" : ed === "evening" ? "المسائي" : "الخاص";
            return available ? (
              <Link key={ed} role="tab" aria-selected={active} href={`/?edition=${ed}`} className={`rounded-full px-3.5 py-1 ${active ? "bg-forest text-on-forest" : "text-ink-soft"}`}>{label}</Link>
            ) : (
              <span key={ed} role="tab" aria-selected={false} aria-disabled className="cursor-not-allowed px-3.5 py-1 text-muted/60" title="لم يُنشر بعد">{label}</span>
            );
          })}
        </div>
      </div>

      <div className="md:px-4">
        <Link href={`/issue/${issue.slug}/read`} className="block">
          <CoverFrame issue={issue} plan={plan} className="md:rounded-sm" />
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pt-4">
        <Link href={`/issue/${issue.slug}/read`} className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-on-forest">اقرأ العدد</Link>
        <Link href={`/issue/${issue.slug}/brief`} className="rounded-full border border-rule px-4 py-2.5 text-sm">النسخة المختصرة</Link>
        <Link href={`/issue/${issue.slug}`} className="rounded-full border border-rule px-4 py-2.5 text-sm">الفهرس</Link>
        {issue.surprise && <Link href={`/issue/${issue.slug}/surprise`} className="rounded-full border border-gold px-4 py-2.5 text-sm text-gold">✦ مفاجأة العدد</Link>}
        <span className="self-center text-xs text-muted">{toArabicDigits(plan.pages.length)} صفحة · نحو {toArabicDigits(minutes)} دقيقة</span>
      </div>

      {issue.editorsLetter && (
        <section className="mx-4 mt-8 border-s-4 border-gold ps-4">
          <p className="kicker">الافتتاحية</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">{issue.editorsLetter.title}</p>
          <p className="mt-2 line-clamp-3 font-[family-name:var(--font-body)] leading-8 text-ink-soft">{issue.editorsLetter.body[0]}</p>
        </section>
      )}

      <section className="px-4 pt-10" aria-labelledby="in-issue">
        <div className="rule-double mb-2" />
        <h2 id="in-issue" className="flex items-baseline justify-between">
          <span className="font-[family-name:var(--font-display)] text-2xl font-bold">في هذا العدد</span>
          <Link href={`/issue/${issue.slug}`} className="text-sm text-gold">الفهرس الكامل ←</Link>
        </h2>
        <div className="mt-6">{lead && <ArticleCard issue={issue} article={lead} layout="lead" />}</div>
        <div className="mt-6 grid gap-x-10 md:grid-cols-2">
          {rest.slice(0, 8).map((a) => <ArticleCard key={a.id} issue={issue} article={a} />)}
        </div>
      </section>

      <ForYou index={index} />

      {recent.length > 0 && (
        <section className="px-4 pt-12" aria-labelledby="recent">
          <h2 id="recent" className="flex items-baseline justify-between">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold">أعداد سابقة</span>
            <Link href="/covers" className="text-sm text-gold">أرشيف الأغلفة ←</Link>
          </h2>
          <ul className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {await Promise.all(
              recent.map(async (i) => (
                <li key={i.slug} className="shrink-0">
                  <Link href={`/issue/${i.slug}`} className="block">
                    <CoverFrame issue={i} plan={(await getPlan(i.slug))!} scale={0.36} />
                    <p className="mt-1 w-[140px] truncate text-xs text-muted">{formatArabicDate(i.date)}<span className="sr-only"> — {i.title}</span></p>
                  </Link>
                </li>
              )),
            )}
          </ul>
        </section>
      )}

      <section className="px-4 pt-12" aria-labelledby="sections">
        <h2 id="sections" className="font-[family-name:var(--font-display)] text-2xl font-bold">الأقسام</h2>
        <ul className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-2">
          {SECTION_KEYS.map((k) => (
            <li key={k} className="shrink-0">
              <Link href={`/section/${k}`} className="block rounded-full border border-rule px-4 py-1.5 text-sm hover:border-gold">{SECTIONS[k].name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
