import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { DemoBadge, DemoNotice } from "@/components/DemoBadge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { SectionArt } from "@/components/SectionArt";
import { getVisibleIssue } from "@/lib/content";
import { editionName, formatArabicDate, toArabicDigits } from "@/lib/dates";
import { SECTIONS } from "@/lib/sections";

type Params = Promise<{ slug: string; articleId: string }>;

async function load(params: Params) {
  const { slug, articleId } = await params;
  const issue = await getVisibleIssue(slug);
  const index = issue?.articles.findIndex((a) => a.id === articleId) ?? -1;
  return issue && index >= 0 ? { issue, article: issue.articles[index], index } : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const data = await load(params);
  return { title: data?.article.title ?? "مقال غير موجود" };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { issue, article, index } = data;
  const meta = SECTIONS[article.section];
  const demo = article.isDemo || issue.isDemo;
  const prev = issue.articles[index - 1];
  const next = issue.articles[index + 1];

  return (
    <article>
      {demo && <DemoNotice compact />}
      <div className="relative aspect-[4/3] max-h-[60dvh] w-full overflow-hidden md:aspect-[21/9]">
        <SectionArt section={article.section} seed={article.id} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
      </div>
      <header className="relative -mt-24 px-5 md:mx-auto md:max-w-3xl">
        <Link href={`/issue/${issue.slug}`} className="text-xs text-muted hover:text-gold">
          {editionName(issue.edition)} · {formatArabicDate(issue.date)}
        </Link>
        <p className="kicker mt-3 text-sm">{article.kicker ?? meta.name}</p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.45] md:text-5xl md:leading-[1.4]">{article.title}</h1>
        {article.dek && <p className="mt-3 font-[family-name:var(--font-body)] text-lg leading-9 text-ink-soft">{article.dek}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-y border-rule py-3 text-sm text-muted">
          {article.author && <span>بقلم {article.author}</span>}
          {article.readingMinutes && <span>{toArabicDigits(article.readingMinutes)} دقائق</span>}
          {demo && <DemoBadge />}
          <span className="ms-auto">
            <FavoriteButton issueSlug={issue.slug} articleId={article.id} title={article.title} section={article.section} />
          </span>
        </div>
      </header>
      <div className="px-5 pt-6 md:mx-auto md:max-w-3xl">
        <ArticleBody article={article} />
      </div>
      <nav className="mx-5 mt-12 grid grid-cols-2 gap-4 border-t border-rule pt-6 text-sm md:mx-auto md:max-w-3xl" aria-label="مقالات العدد">
        <div>{prev && <Link href={`/issue/${issue.slug}/a/${prev.id}`} className="block"><span className="text-muted">→ السابق</span><span className="mt-1 block font-[family-name:var(--font-display)] text-base font-bold">{prev.title}</span></Link>}</div>
        <div className="text-left">{next && <Link href={`/issue/${issue.slug}/a/${next.id}`} className="block"><span className="text-muted">التالي ←</span><span className="mt-1 block font-[family-name:var(--font-display)] text-base font-bold">{next.title}</span></Link>}</div>
      </nav>
    </article>
  );
}
