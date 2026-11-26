import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DemoNotice } from "@/components/DemoBadge";
import { ArticleRating } from "@/components/library/ArticleRating";
import { ReadTracker } from "@/components/library/ReadTracker";
import { MagazinePage } from "@/components/magazine/MagazinePage";
import { PreviewBanner } from "@/components/PreviewBanner";
import { getIssueForViewer } from "@/lib/content";
import { loadIssueView } from "@/lib/content/view";

type Params = Promise<{ slug: string; articleId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, articleId } = await params;
  const v = await getIssueForViewer(slug);
  return { title: v?.issue.articles.find((a) => a.id === articleId)?.title ?? "مقال غير موجود" };
}

/** Same single source as the magazine: the article renders in the layout the engine planned for it. */
export default async function ArticlePage({ params }: { params: Params }) {
  const { slug, articleId } = await params;
  const { issue, plan, preview } = await loadIssueView(slug);
  const pages = plan.pages.map((p, i) => ({ p, i })).filter(({ p }) => p.articleId === articleId);
  if (pages.length === 0) notFound();
  const article = issue.articles.find((a) => a.id === articleId)!;
  const idx = plan.order.indexOf(articleId);
  const prev = plan.order[idx - 1];
  const next = plan.order[idx + 1];
  const title = (id: string) => issue.articles.find((a) => a.id === id)!.title;
  return (
    <>
      {preview && <PreviewBanner issue={issue} />}
      {(article.isDemo || issue.isDemo) && <DemoNotice compact />}
      {!preview && <ReadTracker item={{ issueSlug: issue.slug, articleId, title: article.title, section: article.section }} />}
      <div className={`jm-p-${plan.palette.id} mx-auto max-w-3xl md:my-4 md:shadow-xl`}>
        {pages.map(({ p, i }) => (
          <MagazinePage key={i} issue={issue} plan={plan} page={p} pageNo={i} />
        ))}
      </div>
      <div className="mx-auto max-w-3xl px-5">
        <ArticleRating keyId={`${issue.slug}/${articleId}`} />
        <nav className="mt-8 grid grid-cols-2 gap-4 border-t border-rule pt-6 text-sm" aria-label="مقالات العدد">
          <div>{prev && <Link href={`/issue/${issue.slug}/a/${prev}`} className="block"><span className="text-muted">→ السابق</span><span className="mt-1 block font-[family-name:var(--font-display)] text-base font-bold">{title(prev)}</span></Link>}</div>
          <div className="text-left">{next && <Link href={`/issue/${issue.slug}/a/${next}`} className="block"><span className="text-muted">التالي ←</span><span className="mt-1 block font-[family-name:var(--font-display)] text-base font-bold">{title(next)}</span></Link>}</div>
        </nav>
        <p className="mt-6 text-center text-xs"><Link href={`/issue/${issue.slug}`} className="text-muted underline">العودة إلى فهرس العدد</Link></p>
      </div>
    </>
  );
}
