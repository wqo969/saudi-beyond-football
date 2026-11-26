import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoNotice } from "@/components/DemoBadge";
import { IssueCover } from "@/components/IssueCover";
import { IssueToc } from "@/components/IssueToc";
import { SaveOfflineButton } from "@/components/SaveOfflineButton";
import { getVisibleIssue } from "@/lib/content";
import { issueOfflineUrls } from "@/lib/offline";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const issue = await getVisibleIssue((await params).slug);
  return { title: issue?.title ?? "عدد غير موجود" };
}

export default async function IssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const issue = await getVisibleIssue((await params).slug);
  if (!issue) notFound();
  return (
    <>
      {issue.isDemo && <DemoNotice />}
      <div className="md:px-4 md:pt-4">
        <IssueCover issue={issue} />
      </div>
      <section className="px-4 pt-8" aria-labelledby="toc">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="toc" className="font-[family-name:var(--font-display)] text-3xl font-bold">الفهرس</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/issue/${issue.slug}/read`} className="rounded-full bg-forest px-4 py-2 text-sm text-on-forest">قارئ المجلة</Link>
            {issue.pdf && <Link href={`/issue/${issue.slug}/pdf`} className="rounded-full border border-rule px-4 py-2 text-sm">PDF</Link>}
            <SaveOfflineButton slug={issue.slug} urls={issueOfflineUrls(issue)} />
          </div>
        </div>
        <div className="rule-double mt-3" />
        <IssueToc issue={issue} />
      </section>
    </>
  );
}
