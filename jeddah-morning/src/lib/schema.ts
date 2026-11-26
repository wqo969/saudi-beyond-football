import { z } from "zod";
import { SECTION_KEYS, SECTIONS } from "./sections";

const nonEmpty = (label: string) => z.string().trim().min(1, `${label} مطلوب`);

export const SLUG_RE = /^\d{4}-\d{2}-\d{2}-(morning|evening)(-[a-z0-9-]+)?$/;
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
    type: z.literal("puzzle"),
    question: nonEmpty("السؤال"),
    hint: z.string().optional(),
    answer: nonEmpty("الإجابة"),
  }),
  z.object({ type: z.literal("link"), label: nonEmpty("نص الرابط"), url: z.url("رابط غير صالح") }),
]);

export type Block = z.infer<typeof BlockSchema>;

export const SourceSchema = z.object({
  name: nonEmpty("اسم المصدر"),
  url: z.url("رابط المصدر غير صالح").optional(),
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
  sources: z.array(SourceSchema).default([]),
  body: z.array(BlockSchema).min(1, "المقال يحتاج كتلة واحدة على الأقل"),
});

export type Article = z.infer<typeof ArticleSchema>;

export const ISSUE_STATUSES = ["draft", "scheduled", "published"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const EDITIONS = ["morning", "evening"] as const;
export type Edition = (typeof EDITIONS)[number];

export const IssueSchema = z
  .object({
    slug: z.string().regex(SLUG_RE, "المعرّف بصيغة YYYY-MM-DD-morning أو YYYY-MM-DD-evening"),
    date: z.iso.date("التاريخ بصيغة YYYY-MM-DD"),
    edition: z.enum(EDITIONS),
    number: z.number().int().positive(),
    title: nonEmpty("عنوان العدد"),
    coverHeadline: nonEmpty("عنوان الغلاف"),
    coverDek: z.string().optional(),
    coverSection: z.enum(SECTION_KEYS).optional(),
    status: z.enum(ISSUE_STATUSES).default("draft"),
    publishAt: z.iso.datetime({ offset: true }).optional(),
    isDemo: z.boolean().default(false),
    pdf: z.object({ file: z.string().regex(/^[a-z0-9-]+\.pdf$/i), pages: z.number().int().positive().optional() }).optional(),
    articles: z.array(ArticleSchema).default([]),
    updatedAt: z.iso.datetime({ offset: true }).optional(),
  })
  .superRefine((issue, ctx) => {
    if (!issue.slug.startsWith(`${issue.date}-${issue.edition}`)) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "المعرّف يجب أن يبدأ بالتاريخ ثم نوع العدد" });
    }
    if (issue.status === "scheduled" && !issue.publishAt) {
      ctx.addIssue({ code: "custom", path: ["publishAt"], message: "العدد المجدول يحتاج وقت نشر" });
    }
    const ids = new Set<string>();
    issue.articles.forEach((a, i) => {
      if (ids.has(a.id)) ctx.addIssue({ code: "custom", path: ["articles", i, "id"], message: `معرّف مكرر: ${a.id}` });
      ids.add(a.id);
    });
    // Editorial honesty: real (non-demo) content in live-data sections must cite at least one source.
    issue.articles.forEach((a, i) => {
      if (SECTIONS[a.section].live && !a.isDemo && !issue.isDemo && a.sources.length === 0) {
        ctx.addIssue({ code: "custom", path: ["articles", i, "sources"], message: `«${a.title}»: قسم ${SECTIONS[a.section].name} يتطلب مصدرًا موثوقًا أو تعليم المقال تجريبيًا` });
      }
    });
    if (issue.articles.length === 0 && !issue.pdf) {
      ctx.addIssue({ code: "custom", path: ["articles"], message: "العدد يحتاج مقالًا واحدًا على الأقل أو ملف PDF" });
    }
  });

export type Issue = z.infer<typeof IssueSchema>;
export type IssueInput = z.input<typeof IssueSchema>;

/** Format zod errors as readable Arabic lines with paths. */
export function formatIssues(error: z.ZodError): string[] {
  return error.issues.map((i) => {
    const path = i.path.length ? i.path.join(" › ") + ": " : "";
    return path + i.message;
  });
}
