import { z } from "zod";
import { SECTION_KEYS, SECTIONS } from "./sections";

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} مطلوب`);

export const SLUG_RE = /^\d{4}-\d{2}-\d{2}-(morning|evening|special)(-[a-z0-9-]+)?$/;
export const ARTICLE_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("p"), text: nonEmpty("النص") }),
  z.object({ type: z.literal("h"), text: nonEmpty("العنوان") }),
  z.object({ type: z.literal("quote"), text: nonEmpty("الاقتباس"), cite: z.string().optional() }),
  z.object({ type: z.literal("list"), items: z.array(nonEmpty("البند")).min(1) }),
  z.object({
    type: z.literal("facts"),
    title: z.string().optional(),
    items: z.array(z.object({ label: nonEmpty("التسمية"), value: nonEmpty("القيمة") })).min(1),
  }),
  z.object({
    type: z.literal("stats"),
    title: z.string().optional(),
    items: z.array(z.object({ value: nonEmpty("القيمة"), label: nonEmpty("التسمية"), note: z.string().optional() })).min(1),
  }),
  z.object({
    type: z.literal("timeline"),
    title: z.string().optional(),
    items: z.array(z.object({ when: nonEmpty("الزمن"), text: nonEmpty("الحدث") })).min(2),
  }),
  z.object({
    type: z.literal("qa"),
    items: z.array(z.object({ q: nonEmpty("السؤال"), a: nonEmpty("الإجابة") })).min(1),
  }),
  z.object({
    type: z.literal("gallery"),
    items: z.array(z.object({ caption: nonEmpty("التعليق"), seed: z.string().optional() })).min(2),
  }),
  z.object({
    type: z.literal("puzzle"),
    question: nonEmpty("السؤال"),
    hint: z.string().optional(),
    answer: nonEmpty("الإجابة"),
    explanation: z.string().optional(),
  }),
  z.object({ type: z.literal("link"), label: nonEmpty("نص الرابط"), url: z.url("رابط غير صالح") }),
]);

export type Block = z.infer<typeof BlockSchema>;
export type BlockType = Block["type"];

export const SourceSchema = z.object({
  name: nonEmpty("اسم المصدر"),
  url: z.url("رابط المصدر غير صالح").optional(),
  publishedAt: z.string().optional(),
});

/** Keys recorded in editorial memory for anti-repetition (song, title, puzzle, expression…). */
export const MemoryKeySchema = z.object({
  kind: z.enum(["song", "artist", "film", "series", "puzzle", "discovery", "look", "expression", "concept", "cover-story", "topic", "book", "place"]),
  key: nonEmpty("المفتاح"),
});

export const ArticleSchema = z.object({
  id: z.string().regex(ARTICLE_ID_RE, "معرّف المقال: حروف لاتينية صغيرة وأرقام وشرطات"),
  section: z.enum(SECTION_KEYS),
  kicker: z.string().optional(),
  title: nonEmpty("عنوان المقال"),
  dek: z.string().optional(),
  author: z.string().optional(),
  readingMinutes: z.number().int().positive().max(120).optional(),
  isDemo: z.boolean().default(false),
  /** Editor override for the page layout; otherwise the engine chooses. */
  layout: z.string().optional(),
  /** Continuing story — allowed to resemble earlier coverage. */
  followUp: z.boolean().default(false),
  /** Opinion/analysis marker: shown separately from news. */
  kind: z.enum(["news", "analysis", "opinion", "feature", "service", "template"]).default("feature"),
  sources: z.array(SourceSchema).default([]),
  memory: z.array(MemoryKeySchema).default([]),
  body: z.array(BlockSchema).min(1, "المقال يحتاج كتلة واحدة على الأقل"),
});

export type Article = z.infer<typeof ArticleSchema>;

export const ISSUE_STATUSES = ["draft", "editorial-review", "fact-check", "design-review", "approved", "scheduled", "published", "archived"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const EDITIONS = ["morning", "evening", "special"] as const;
export type Edition = (typeof EDITIONS)[number];

export const SURPRISE_KINDS = ["wallpaper", "quiz", "challenge", "reflection", "card", "facts"] as const;

export const SurpriseSchema = z.object({
  kind: z.enum(SURPRISE_KINDS),
  title: nonEmpty("عنوان المفاجأة"),
  intro: z.string().optional(),
  /** wallpaper/card: art seed + text */
  text: z.string().optional(),
  /** quiz */
  questions: z
    .array(z.object({ q: nonEmpty("السؤال"), options: z.array(z.object({ label: nonEmpty("الخيار"), result: z.string() })).min(2) }))
    .optional(),
  results: z.record(z.string(), z.string()).optional(),
  /** challenge / facts / reflection prompts */
  items: z.array(nonEmpty("البند")).optional(),
});
export type Surprise = z.infer<typeof SurpriseSchema>;

export const DesignSchema = z.object({
  coverLayout: z.string().optional(),
  palette: z.string().optional(),
  seed: z.string().optional(),
  lockOrder: z.boolean().default(false),
  /** Frozen plan (page layouts) stored on approval so published issues never change look. */
  frozen: z
    .object({
      palette: z.string(),
      coverLayout: z.string(),
      contentsVariant: z.string(),
      closingVariant: z.string(),
      pages: z.array(z.object({ layout: z.string(), articleId: z.string().optional(), part: z.number().int().optional() })),
      frozenAt: z.string(),
    })
    .optional(),
});

export const IssueSchema = z
  .object({
    slug: z.string().regex(SLUG_RE, "المعرّف بصيغة YYYY-MM-DD-morning أو -evening أو -special-name"),
    date: z.iso.date("التاريخ بصيغة YYYY-MM-DD"),
    edition: z.enum(EDITIONS),
    special: z.string().optional(),
    number: z.number().int().positive(),
    title: nonEmpty("عنوان العدد"),
    coverHeadline: nonEmpty("عنوان الغلاف"),
    coverDek: z.string().optional(),
    coverStory: z.string().optional(),
    coverSection: z.enum(SECTION_KEYS).optional(),
    persona: z.string().optional(),
    status: z.enum(ISSUE_STATUSES).default("draft"),
    publishAt: z.iso.datetime({ offset: true }).optional(),
    isDemo: z.boolean().default(false),
    editorsLetter: z.object({ title: nonEmpty("عنوان الافتتاحية"), body: z.array(nonEmpty("فقرة")).min(1), signature: z.string().optional() }).optional(),
    surprise: SurpriseSchema.optional(),
    closingLine: z.string().optional(),
    design: DesignSchema.default({ lockOrder: false }),
    pdf: z.object({ file: z.string().regex(/^[a-z0-9-]+\.pdf$/i), pages: z.number().int().positive().optional() }).optional(),
    corrections: z.array(z.object({ at: z.string(), text: nonEmpty("نص التصحيح") })).default([]),
    articles: z.array(ArticleSchema).default([]),
    updatedAt: z.iso.datetime({ offset: true }).optional(),
  })
  .superRefine((issue, ctx) => {
    if (!issue.slug.startsWith(`${issue.date}-${issue.edition}`)) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "المعرّف يجب أن يبدأ بالتاريخ ثم نوع العدد" });
    }
    if (issue.edition === "special" && !issue.special) {
      ctx.addIssue({ code: "custom", path: ["special"], message: "العدد الخاص يحتاج نوعه (special)" });
    }
    if (issue.status === "scheduled" && !issue.publishAt) {
      ctx.addIssue({ code: "custom", path: ["publishAt"], message: "العدد المجدول يحتاج وقت نشر" });
    }
    const ids = new Set<string>();
    issue.articles.forEach((a, i) => {
      if (ids.has(a.id)) ctx.addIssue({ code: "custom", path: ["articles", i, "id"], message: `معرّف مكرر: ${a.id}` });
      ids.add(a.id);
      // Editorial honesty: real (non-demo) content in live-data sections must cite at least one source.
      if (SECTIONS[a.section].live && !a.isDemo && !issue.isDemo && a.kind !== "opinion" && a.sources.length === 0) {
        ctx.addIssue({ code: "custom", path: ["articles", i, "sources"], message: `«${a.title}»: قسم ${SECTIONS[a.section].name} يتطلب مصدرًا موثوقًا أو تعليم المقال تجريبيًا` });
      }
      // Interviews must be documented: real Q&A requires a source.
      if (!a.isDemo && !issue.isDemo && a.body.some((b) => b.type === "qa") && a.sources.length === 0) {
        ctx.addIssue({ code: "custom", path: ["articles", i, "sources"], message: `«${a.title}»: المقابلة تتطلب مصدرًا موثقًا` });
      }
    });
    if (issue.coverStory && !ids.has(issue.coverStory)) {
      ctx.addIssue({ code: "custom", path: ["coverStory"], message: "قصة الغلاف يجب أن تكون أحد مقالات العدد" });
    }
    if (issue.articles.length === 0 && !issue.pdf) {
      ctx.addIssue({ code: "custom", path: ["articles"], message: "العدد يحتاج مقالًا واحدًا على الأقل أو ملف PDF" });
    }
  });

export type Issue = z.infer<typeof IssueSchema>;
export type IssueInput = z.input<typeof IssueSchema>;

export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    const path = i.path.length ? i.path.join(" › ") + ": " : "";
    return path + i.message;
  });
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  draft: "مسودة",
  "editorial-review": "مراجعة تحريرية",
  "fact-check": "تدقيق الحقائق",
  "design-review": "مراجعة التصميم",
  approved: "معتمد",
  scheduled: "مجدول",
  published: "منشور",
  archived: "مؤرشف",
};
