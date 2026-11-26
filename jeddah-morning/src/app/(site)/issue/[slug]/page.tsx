import type { Metadata } from "next";
import Link from "next/link";
import { DemoNotice } from "@/components/DemoBadge";
import { CoverFrame } from "@/components/magazine/CoverFrame";
import { PreviewBanner } from "@/components/PreviewBanner";
import { SaveOfflineButton } from "@/components/SaveOfflineButton";
import { SectionArt } from "@/components/SectionArt";
import { getIssueForViewer } from "@/lib/content";
import { loadIssueView } from "@/lib/content/view";
import { formatArabicDate, toArabicDigits } from "@/lib/dates";
import { articleById } from "@/lib/engine/planner";
import { issueOfflineUrls } from "@/lib/offline";
import { SECTIONS } from "@/lib/sections";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getIssueForViewer((await params).slug);
  return { title: v?.issue.title ?? "عدد غير موجود" };
}

export default async function IssuePage({ params }: Props) {
  const { issue, plan, preview } = await loadIssueView((await params).slug);
  const first = new Map<string, number>();
  plan.pages.forEach((p, i) => p.articleId && !first.has(p.articleId) && first.set(p.articleId, i));
  return (
    <>
      {preview && <PreviewBanner issue={issue} />}
      {issue.isDemo && <DemoNotice />}
      <div className="md:grid md:grid-cols-[minmax(0,420px)_1fr] md:gap-8 md:px-4 md:pt-4">
        <Link href={`/issue/${issue.slug}/read`}><CoverFrame issue={issue} plan={plan} className="md:rounded-sm" /></Link>
        <section className="px-4 pt-6 md:px-0" aria-labelledby="toc">
          <p className="latin-caps text-gold">{plan.identity.latin}</p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold">{issue.title}</h1>
          <p className="mt-1 text-sm text-muted">{formatArabicDate(issue.date)} · {toArabicDigits(plan.pages.length)} صفحة · لوحة «{plan.palette.name}»</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/issue/${issue.slug}/read`} className="rounded-full bg-forest px-4 py-2 text-sm text-on-forest">قارئ المجلة</Link>
            <Link href={`/issue/${issue.slug}/brief`} className="rounded-full border border-rule px-4 py-2 text-sm">المختصرة</Link>
            {issue.pdf && <Link href={`/issue/${issue.slug}/pdf`} className="rounded-full border border-rule px-4 py-2 text-sm">PDF</Link>}
            {issue.surprise && <Link href={`/issue/${issue.slug}/surprise`} className="rounded-full border border-gold px-4 py-2 text-sm text-gold">✦ المفاجأة</Link>}
            <Link href={`/issue/${issue.slug}/rate`} className="rounded-full border border-rule px-4 py-2 text-sm">قيّم العدد</Link>
            {!preview && <SaveOfflineButton slug={issue.slug} urls={issueOfflineUrls(issue)} />}
          </div>
          <h2 id="toc" className="mt-8 font-[family-name:var(--font-display)] text-3xl font-bold">الفهرس</h2>
          <div className="rule-double mt-2" />
          <ol className="divide-y divide-rule">
            {plan.order.map((id) => {
              const a = articleById(issue, id)!;
              const page = first.get(id)!;
              return (
                <li key={id}>
                  <div className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 py-3">
                    <SectionArt section={a.section} seed={a.id} palette={plan.palette} variant="thumb" className="aspect-square" />
                    <Link href={`/issue/${issue.slug}/a/${a.id}`} className="group min-w-0">
                      <span className="kicker block">{SECTIONS[a.section].name}{a.isDemo || issue.isDemo ? " · تجريبي" : ""}</span>
                      <span className="font-[family-name:var(--font-display)] text-lg font-bold leading-8 group-hover:text-gold">{a.title}</span>
                    </Link>
                    <Link href={`/issue/${issue.slug}/read?p=${page}`} className="text-xs text-muted hover:text-gold">ص {toArabicDigits(page + 1)}<span className="sr-only"> — افتحها في القارئ</span></Link>
                  </div>
                </li>
              );
            })}
          </ol>
          {issue.corrections.length > 0 && (
            <aside className="mt-8 border border-rule p-4 text-sm">
              <p className="font-semibold">تصحيحات</p>
              <ul className="mt-2 space-y-1 text-muted">{issue.corrections.map((c, i) => <li key={i}>{c.at}: {c.text}</li>)}</ul>
            </aside>
          )}
        </section>
      </div>
    </>
  );
}
