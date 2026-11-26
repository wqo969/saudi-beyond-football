import type { Block, Issue } from "./schema";
import type { SectionKey } from "./sections";

/** Normalize Arabic text for forgiving search: strip tashkeel/tatweel, unify alef/ya/ta-marbuta/hamza forms, Arabic digits. */
export function normalizeArabic(input: string): string {
  return input
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭ]/g, "") // tashkeel + Quranic marks
    .replace(/ـ/g, "") // tatweel
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SearchDoc {
  issueSlug: string;
  issueTitle: string;
  date: string;
  edition: Issue["edition"];
  articleId: string;
  section: SectionKey;
  title: string;
  dek?: string;
  isDemo: boolean;
  /** normalized title (weighted) */
  t: string;
  /** normalized full text */
  x: string;
}

export function blockText(b: Block): string {
  switch (b.type) {
    case "p":
    case "h":
    case "quote":
      return b.text;
    case "list":
      return b.items.join(" ");
    case "facts":
      return [b.title ?? "", ...b.items.map((i) => `${i.label} ${i.value}`)].join(" ");
    case "stats":
      return [b.title ?? "", ...b.items.map((i) => `${i.label} ${i.value} ${i.note ?? ""}`)].join(" ");
    case "timeline":
      return [b.title ?? "", ...b.items.map((i) => `${i.when} ${i.text}`)].join(" ");
    case "qa":
      return b.items.map((i) => `${i.q} ${i.a}`).join(" ");
    case "gallery":
      return b.items.map((i) => i.caption).join(" ");
    case "puzzle":
      return `${b.question} ${b.hint ?? ""}`; // never index answers or explanations
    case "link":
      return b.label;
  }
}

export function buildSearchIndex(issues: Issue[]): SearchDoc[] {
  return issues.flatMap((issue) =>
    issue.articles.map((a) => ({
      issueSlug: issue.slug,
      issueTitle: issue.title,
      date: issue.date,
      edition: issue.edition,
      articleId: a.id,
      section: a.section,
      title: a.title,
      dek: a.dek,
      isDemo: a.isDemo || issue.isDemo,
      t: normalizeArabic(`${a.kicker ?? ""} ${a.title}`),
      x: normalizeArabic([a.dek ?? "", ...a.body.map(blockText)].join(" ")),
    })),
  );
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
}

/** All query terms must match (title or text). Title matches score higher; newer issues break ties. */
export function search(index: SearchDoc[], query: string, opts: { section?: SectionKey | null } = {}): SearchHit[] {
  const terms = normalizeArabic(query).split(" ").filter((t) => t.length > 0);
  if (terms.length === 0) return [];
  const hits: SearchHit[] = [];
  for (const doc of index) {
    if (opts.section && doc.section !== opts.section) continue;
    let score = 0;
    let all = true;
    for (const term of terms) {
      const inTitle = doc.t.includes(term);
      const inText = doc.x.includes(term);
      if (!inTitle && !inText) {
        all = false;
        break;
      }
      score += (inTitle ? 5 : 0) + (inText ? 1 : 0);
    }
    if (all) hits.push({ doc, score });
  }
  return hits.sort((a, b) => b.score - a.score || (a.doc.date < b.doc.date ? 1 : a.doc.date > b.doc.date ? -1 : 0));
}
