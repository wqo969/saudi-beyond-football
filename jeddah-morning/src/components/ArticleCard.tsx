import Link from "next/link";
import type { Article, Issue } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";
import { toArabicDigits } from "@/lib/dates";
import { DemoBadge } from "./DemoBadge";
import { SectionArt } from "./SectionArt";

export function ArticleCard({ issue, article, layout = "row" }: { issue: Pick<Issue, "slug" | "isDemo">; article: Article; layout?: "lead" | "row" | "tile" }) {
  const meta = SECTIONS[article.section];
  const href = `/issue/${issue.slug}/a/${article.id}`;
  const demo = article.isDemo || issue.isDemo;

  if (layout === "lead") {
    return (
      <Link href={href} className="group grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-end">
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-[4/5]">
          <SectionArt section={article.section} seed={article.id} className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]" />
        </div>
        <div>
          <p className="kicker">{article.kicker ?? meta.name}</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold leading-[1.45] group-hover:text-forest-soft dark:group-hover:text-gold">{article.title}</h3>
          {article.dek && <p className="mt-2 font-[family-name:var(--font-body)] leading-8 text-ink-soft">{article.dek}</p>}
          <Meta article={article} demo={demo} />
        </div>
      </Link>
    );
  }
  if (layout === "tile") {
    return (
      <Link href={href} className="group block">
        <div className="relative aspect-[3/4] overflow-hidden">
          <SectionArt section={article.section} seed={article.id} variant="thumb" className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]" />
          <span className="absolute right-2 top-2 bg-paper/90 px-1.5 py-0.5 text-[0.65rem] font-semibold text-forest-soft dark:text-gold">{meta.name}</span>
        </div>
        <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg font-bold leading-8 group-hover:text-forest-soft dark:group-hover:text-gold">{article.title}</h3>
        {demo && <DemoBadge className="mt-1" />}
      </Link>
    );
  }
  return (
    <Link href={href} className="group flex gap-4 border-b border-rule py-4">
      <div className="min-w-0 flex-1">
        <p className="kicker">{article.kicker ?? meta.name}</p>
        <h3 className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-bold leading-9 group-hover:text-forest-soft dark:group-hover:text-gold">{article.title}</h3>
        {article.dek && <p className="mt-1 line-clamp-2 font-[family-name:var(--font-body)] text-sm leading-7 text-ink-soft">{article.dek}</p>}
        <Meta article={article} demo={demo} />
      </div>
      <div className="relative size-24 shrink-0 overflow-hidden md:size-28">
        <SectionArt section={article.section} seed={article.id} variant="thumb" className="h-full w-full" />
      </div>
    </Link>
  );
}

function Meta({ article, demo }: { article: Article; demo: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
      {article.author && <span>{article.author}</span>}
      {article.readingMinutes && <span>· {toArabicDigits(article.readingMinutes)} دقائق قراءة</span>}
      {demo && <DemoBadge />}
    </div>
  );
}
