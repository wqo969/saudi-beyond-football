import type { Metadata } from "next";
import { IssueRating } from "@/components/library/IssueRating";
import { loadIssueView } from "@/lib/content/view";

export const metadata: Metadata = { title: "تقييم العدد" };

export default async function RatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { issue, plan } = await loadIssueView((await params).slug);
  return (
    <div className="mx-auto max-w-xl px-5 pt-8">
      <p className="latin-caps text-gold">{plan.identity.latin}</p>
      <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold">قيّم العدد</h1>
      <p className="mt-1 text-sm text-muted">{issue.title}</p>
      <IssueRating slug={issue.slug} />
      <p className="mt-6 text-xs leading-6 text-muted">يُحفظ التقييم على جهازك فقط ويُستخدم لتحسين مختاراتك. يمكنك حذفه من الملف الشخصي.</p>
    </div>
  );
}
