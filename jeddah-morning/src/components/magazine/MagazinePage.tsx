import type { IssuePlan, PageSpec } from "@/lib/engine/planner";
import { articleById } from "@/lib/engine/planner";
import type { Issue } from "@/lib/schema";
import * as A from "./articles";
import { CoverAbstract, CoverFull, CoverNight, CoverSplit, CoverType } from "./covers";
import { Closing, Contents, Letter, SurprisePage } from "./pages";
import type { ArticlePageProps, PageProps } from "./parts";

const ARTICLE_RENDERERS: Record<string, (p: ArticlePageProps) => React.ReactNode> = {
  "two-column": A.TwoColumn,
  "three-column": A.ThreeColumn,
  "photo-story": A.PhotoStory,
  spread: A.Spread,
  investigation: A.Investigation,
  interview: A.Interview,
  infographic: A.Infographic,
  timeline: A.Timeline,
  opinion: A.Opinion,
  fashion: A.Fashion,
  sports: A.Sports,
  economy: A.Economy,
  gallery: A.Gallery,
  "travel-guide": A.TravelGuide,
  interactive: A.Interactive,
  quotes: A.Quotes,
  "weather-card": A.WeatherCard,
  briefing: A.Briefing,
  record: A.Record,
  ticket: A.Ticket,
};

const COVER_RENDERERS: Record<string, (p: PageProps) => React.ReactNode> = {
  "cover-full": CoverFull,
  "cover-type": CoverType,
  "cover-abstract": CoverAbstract,
  "cover-split": CoverSplit,
  "cover-night": CoverNight,
};

export const RENDERED_LAYOUTS = [...Object.keys(ARTICLE_RENDERERS), ...Object.keys(COVER_RENDERERS), "contents", "closing-art"];

/** Renders one planned page. Pure and server-safe; interactive bits are client islands. */
export function MagazinePage({ issue, plan, page, pageNo }: { issue: Issue; plan: IssuePlan; page: PageSpec; pageNo: number }) {
  const base: PageProps = { issue, plan, pageNo, total: plan.pages.length, variant: page.variant };
  switch (page.kind) {
    case "cover":
      return (COVER_RENDERERS[page.layout] ?? CoverFull)(base);
    case "contents":
      return <Contents {...base} />;
    case "letter":
      return <Letter {...base} />;
    case "surprise":
      return <SurprisePage {...base} />;
    case "closing":
      return <Closing {...base} />;
    case "article": {
      const article = articleById(issue, page.articleId);
      if (!article) return null;
      const R = ARTICLE_RENDERERS[page.layout] ?? A.TwoColumn;
      return <R {...base} article={article} part={page.part} />;
    }
  }
}
