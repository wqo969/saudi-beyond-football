import { toArabicDigits } from "@/lib/dates";
import type { IssuePlan } from "@/lib/engine/planner";
import type { Article, Issue } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";
import { DemoBadge } from "../DemoBadge";
import { FavoriteButton } from "../FavoriteButton";
import { ArticleTools } from "./ArticleTools";

export interface PageProps {
  issue: Issue;
  plan: IssuePlan;
  pageNo: number;
  total: number;
  variant: number;
}

export interface ArticlePageProps extends PageProps {
  article: Article;
  part?: number;
}

/** Running header: section + issue identity, like a printed magazine. */
export function RunningHead({ issue, plan, article, light = false }: { issue: Issue; plan: IssuePlan; article?: Article; light?: boolean }) {
  return (
    <div className={`flex items-center justify-between border-b px-5 py-2 text-[0.62rem] ${light ? "border-white/25 text-white/80" : "border-rule text-muted"}`}>
      <span className="latin-caps !text-[0.58rem]">{plan.identity.latin}</span>
      <span>{article ? SECTIONS[article.section].latin : ""} · No. {issue.number}</span>
    </div>
  );
}

export function Folio({ pageNo, total, light = false }: { pageNo: number; total: number; light?: boolean }) {
  return (
    <p className={`mag-folio py-5 text-center font-[family-name:var(--font-latin)] text-xs ${light ? "text-white/70" : "text-muted"}`} aria-label={`صفحة ${pageNo + 1} من ${total}`}>
      — {toArabicDigits(pageNo + 1)} —
    </p>
  );
}

export function Kicker({ article, className = "" }: { article: Article; className?: string }) {
  const kindLabel = article.kind === "opinion" ? "رأي" : article.kind === "analysis" ? "تحليل" : article.kind === "template" ? "قالب" : null;
  return (
    <p className={`kicker flex flex-wrap items-center gap-2 ${className.includes("accent-light") ? "" : "!text-accent"} ${className}`}>
      <span>{article.kicker ?? SECTIONS[article.section].name}</span>
      {kindLabel && <span className="rounded-sm border border-current px-1 text-[0.6rem]">{kindLabel}</span>}
    </p>
  );
}

export function Byline({ issue, article, light = false }: { issue: Issue; article: Article; light?: boolean }) {
  const demo = article.isDemo || issue.isDemo;
  return (
    <div className={`mt-4 flex flex-wrap items-center gap-2 border-y py-2 text-xs ${light ? "border-white/25 text-white/80" : "border-rule text-muted"}`}>
      {article.author && <span>{article.author}</span>}
      {article.readingMinutes && <span>· {toArabicDigits(article.readingMinutes)} د</span>}
      {demo && <DemoBadge />}
      <span className="ms-auto flex items-center gap-1" data-no-swipe data-no-print>
        <ArticleTools issue={issue} article={article} />
        <FavoriteButton issueSlug={issue.slug} articleId={article.id} title={article.title} section={article.section} compact />
      </span>
    </div>
  );
}

export function Dek({ article, className = "" }: { article: Article; className?: string }) {
  if (!article.dek) return null;
  return <p className={`mt-3 font-[family-name:var(--font-body)] text-[1.08em] leading-8 opacity-90 ${className}`}>{article.dek}</p>;
}
