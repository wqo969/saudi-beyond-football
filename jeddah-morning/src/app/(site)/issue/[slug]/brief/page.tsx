import type { Metadata } from "next";
import Link from "next/link";
import { DemoNotice } from "@/components/DemoBadge";
import { PreviewBanner } from "@/components/PreviewBanner";
import { loadIssueView } from "@/lib/content/view";
import { formatArabicDate, toArabicDigits } from "@/lib/dates";
import { articleById } from "@/lib/engine/planner";
import { blockText } from "@/lib/search";
import { SECTIONS } from "@/lib/sections";

export const metadata: Metadata = { title: "النسخة المختصرة" };

/** Brief edition: generated from the same single source — one line per story, in the issue's order. */
export default async function BriefPage({ params }: { params: Promise<{ slug: string }> }) {
  const { issue, plan, preview } = await loadIssueView((await params).slug);
  const items = plan.order.map((id) => articleById(issue, id)!);
  return (
    <div className={`jm-p-${plan.palette.id} min-h-dvh`}>
      {preview && <PreviewBanner issue={issue} />}
      {issue.isDemo && <DemoNotice compact />}
      <div className="mx-auto max-w-2xl px-5 pt-8">
        <p className="latin-caps text-accent">The Brief · {plan.identity.latin}</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-bold">العدد في دقيقتين</h1>
        <p className="mt-1 text-sm text-muted">{formatArabicDate(issue.date)} · {toArabicDigits(items.length)} مواد</p>
        <div className="rule-double my-5" />
        <p className="font-[family-name:var(--font-display)] text-2xl font-bold leading-[1.6]">{issue.coverHeadline}</p>
        {issue.coverDek && <p className="mt-2 leading-8 text-muted">{issue.coverDek}</p>}
        <ol className="mt-6 space-y-5">
          {items.map((a, i) => {
            const firstLine = a.dek ?? blockText(a.body[0]).split(/[.؟!]/)[0];
            return (
              <li key={a.id} className="grid grid-cols-[2rem_1fr] gap-3">
                <span className="font-[family-name:var(--font-latin)] text-xl text-accent">{toArabicDigits(i + 1)}</span>
                <div>
                  <p className="kicker !text-accent">{SECTIONS[a.section].name}{a.isDemo || issue.isDemo ? " · تجريبي" : ""}</p>
                  <Link href={`/issue/${issue.slug}/a/${a.id}`} className="font-[family-name:var(--font-display)] text-lg font-bold leading-8 hover:text-accent">{a.title}</Link>
                  <p className="text-sm leading-7 text-muted">{firstLine}</p>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="my-10 flex gap-2">
          <Link href={`/issue/${issue.slug}/read`} className="rounded-full bg-accent px-5 py-2 text-sm text-on-accent">اقرأ المجلة كاملة</Link>
          <Link href={`/issue/${issue.slug}`} className="rounded-full border border-rule px-5 py-2 text-sm">الفهرس</Link>
        </div>
      </div>
    </div>
  );
}
