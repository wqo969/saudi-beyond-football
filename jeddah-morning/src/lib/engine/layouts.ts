import type { Article, BlockType } from "../schema";
import type { SectionKey } from "../sections";

/**
 * Layout library — metadata only (renderers live in src/components/layouts).
 * `fit` returns 0 when the layout must NOT be used for an article (readability guard),
 * otherwise a positive affinity (higher = better match). Add a new layout by adding an
 * entry here and a renderer in LayoutRenderer.
 */
export type LayoutKind = "cover" | "article" | "contents" | "closing";

export interface ArticleMetrics {
  words: number;
  paragraphs: number;
  headings: number;
  quotes: number;
  blocks: Set<BlockType>;
}

export function metrics(a: Article): ArticleMetrics {
  let words = 0;
  let paragraphs = 0;
  let headings = 0;
  let quotes = 0;
  const blocks = new Set<BlockType>();
  for (const b of a.body) {
    blocks.add(b.type);
    if (b.type === "p") {
      paragraphs++;
      words += b.text.split(/\s+/).length;
    } else if (b.type === "h") headings++;
    else if (b.type === "quote") quotes++;
  }
  return { words, paragraphs, headings, quotes, blocks };
}

export interface LayoutDef {
  id: string;
  name: string;
  kind: LayoutKind;
  /** pages this layout occupies */
  pages: 1 | 2;
  /** short description for the admin */
  note: string;
  fit?: (a: Article, m: ArticleMetrics) => number;
  /** evening-only / day-only covers */
  mode?: "day" | "night";
}

const sec = (a: Article, ...keys: SectionKey[]) => keys.includes(a.section);
const longForm = (m: ArticleMetrics) => m.paragraphs >= 3 && m.words >= 45;

export const LAYOUTS: LayoutDef[] = [
  // ---- Covers ----
  { id: "cover-full", name: "غلاف بصورة كاملة", kind: "cover", pages: 1, note: "عمل فني يملأ الصفحة والعنوان أسفلها" },
  { id: "cover-type", name: "غلاف تايبوجرافي", kind: "cover", pages: 1, note: "العنوان هو الصورة" },
  { id: "cover-abstract", name: "غلاف فني تجريدي", kind: "cover", pages: 1, note: "تكوين هندسي بألوان العدد" },
  { id: "cover-split", name: "غلاف منقسم", kind: "cover", pages: 1, note: "نصف فني ونصف تحريري" },
  { id: "cover-night", name: "غلاف ليلي", kind: "cover", pages: 1, note: "هوية JEDDAH AFTER DARK", mode: "night" },

  // ---- Contents / closing ----
  { id: "contents", name: "الفهرس", kind: "contents", pages: 1, note: "ثلاثة أشكال: قائمة، شبكة، أرقام كبيرة" },
  { id: "closing-art", name: "صفحة ختامية فنية", kind: "closing", pages: 1, note: "ثلاثة أشكال: سطر شعري، لوحة، تشويق للعدد القادم" },

  // ---- Article layouts ----
  { id: "two-column", name: "مقال بعمودين", kind: "article", pages: 1, note: "عمودان على الشاشات العريضة", fit: (_a, m) => (m.paragraphs >= 2 ? 1.5 : 1) },
  { id: "three-column", name: "مقال بثلاثة أعمدة", kind: "article", pages: 1, note: "للنصوص الطويلة فقط", fit: (_a, m) => (m.paragraphs >= 4 && m.words >= 70 ? 2 : 0) },
  { id: "photo-story", name: "قصة مصورة", kind: "article", pages: 1, note: "لوحات فنية تتخلل الفقرات", fit: (a, m) => (m.paragraphs >= 3 ? (sec(a, "travel", "culture", "discovery", "fashion") ? 3 : 1) : 0) },
  { id: "spread", name: "صورة ممتدة على صفحتين", kind: "article", pages: 2, note: "صفحة فنية كاملة ثم النص", fit: (a, m) => (longForm(m) ? (sec(a, "culture", "travel", "fashion", "opinion", "personal-growth") ? 3 : 1) : 0) },
  { id: "investigation", name: "تحقيق صحفي", kind: "article", pages: 1, note: "فصول مرقمة وملف جانبي", fit: (_a, m) => (m.headings >= 2 && m.words >= 60 ? 3 : 0) },
  { id: "interview", name: "مقابلة موثقة", kind: "article", pages: 1, note: "سؤال وجواب", fit: (_a, m) => (m.blocks.has("qa") ? 4 : 0) },
  { id: "infographic", name: "إنفوجرافيك", kind: "article", pages: 1, note: "أرقام كبيرة وأشرطة", fit: (a, m) => (m.blocks.has("stats") ? (sec(a, "saudi-economy", "weather", "football", "ai") ? 3 : 2) : 0) },
  { id: "timeline", name: "خط زمني", kind: "article", pages: 1, note: "تسلسل أحداث أو جدول يوم", fit: (_a, m) => (m.blocks.has("timeline") ? 3 : 0) },
  { id: "opinion", name: "مقال رأي", kind: "article", pages: 1, note: "عمود موقّع بصورة الكاتب", fit: (a, m) => (a.kind === "opinion" || sec(a, "opinion") ? 5 : longForm(m) && sec(a, "personal-growth", "culture") ? 1 : 0) },
  { id: "fashion", name: "صفحة أزياء", kind: "article", pages: 1, note: "لوك بوك بلوحات طويلة", fit: (a) => (sec(a, "fashion") ? 4 : 0) },
  { id: "sports", name: "صفحة رياضية", kind: "article", pages: 1, note: "لوحة نتيجة وأشرطة", fit: (a) => (sec(a, "football") ? 4 : 0) },
  { id: "economy", name: "صفحة اقتصادية", kind: "article", pages: 1, note: "جدول مؤشرات بأسلوب الصحافة المالية", fit: (a, m) => (sec(a, "saudi-economy", "careers") && (m.blocks.has("facts") || m.blocks.has("stats")) ? 4 : 0) },
  { id: "gallery", name: "معرض صور", kind: "article", pages: 1, note: "شبكة لوحات وتعليقات", fit: (_a, m) => (m.blocks.has("gallery") ? 3 : 0) },
  { id: "travel-guide", name: "دليل سفر", kind: "article", pages: 1, note: "خريطة ومحطات مرقمة", fit: (a, m) => (sec(a, "travel") ? 4 : sec(a, "discovery") && m.blocks.has("list") ? 2 : 0) },
  { id: "interactive", name: "صفحة تفاعلية", kind: "article", pages: 1, note: "ألغاز واختبارات", fit: (_a, m) => (m.blocks.has("puzzle") ? 5 : 0) },
  { id: "quotes", name: "صفحة اقتباسات موثقة", kind: "article", pages: 1, note: "جدار اقتباسات بمصادرها", fit: (_a, m) => (m.quotes >= 2 ? 4 : 0) },
  { id: "weather-card", name: "بطاقة الطقس", kind: "article", pages: 1, note: "لوحة الحرارة والبحر", fit: (a) => (sec(a, "weather", "tomorrow") ? 4 : 0) },
  { id: "briefing", name: "موجز", kind: "article", pages: 1, note: "أخبار قصيرة مرقمة", fit: (a, m) => (sec(a, "news", "recap", "developments", "careers", "ai") && m.blocks.has("list") ? 4 : 0) },
  { id: "record", name: "أسطوانة اليوم", kind: "article", pages: 1, note: "بطاقة الأغنية", fit: (a) => (sec(a, "song") ? 5 : 0) },
  { id: "ticket", name: "تذاكر المشاهدة", kind: "article", pages: 1, note: "قائمة مشاهدة كتذاكر", fit: (a) => (sec(a, "screen") ? 5 : 0) },
];

export const COVER_LAYOUTS = LAYOUTS.filter((l) => l.kind === "cover");
export const ARTICLE_LAYOUTS = LAYOUTS.filter((l) => l.kind === "article");
export const CONTENTS_VARIANTS = ["list", "grid", "numbers"] as const;
export const CLOSING_VARIANTS = ["verse", "canvas", "teaser"] as const;

export function layoutById(id: string | undefined): LayoutDef | undefined {
  return LAYOUTS.find((l) => l.id === id);
}

/** Candidate layouts for an article, with their base affinity. */
export function candidates(a: Article): { layout: LayoutDef; score: number }[] {
  const m = metrics(a);
  return ARTICLE_LAYOUTS.map((layout) => ({ layout, score: layout.fit ? layout.fit(a, m) : 0 })).filter((c) => c.score > 0);
}
