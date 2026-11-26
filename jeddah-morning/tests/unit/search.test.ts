import { describe, expect, it } from "vitest";
import { IssueSchema } from "@/lib/schema";
import { buildSearchIndex, normalizeArabic, search } from "@/lib/search";

describe("normalizeArabic", () => {
  it("unifies alef/hamza/ya/ta-marbuta and strips tashkeel/tatweel", () => {
    expect(normalizeArabic("الأَنَاقَة")).toBe("الاناقه");
    expect(normalizeArabic("إبداع آخر")).toBe("ابداع اخر");
    expect(normalizeArabic("مستشفى")).toBe("مستشفي");
    expect(normalizeArabic("جـــدة")).toBe("جده");
    expect(normalizeArabic("٢٠٢٦")).toBe("2026");
  });
});

const issue = IssueSchema.parse({
  slug: "2026-12-01-morning", date: "2026-12-01", edition: "morning", number: 1, title: "t", coverHeadline: "c", isDemo: true,
  articles: [
    { id: "a", section: "fashion", title: "الأناقة في مدينة البحر", body: [{ type: "p", text: "القماش الخفيف" }] },
    { id: "b", section: "puzzle", title: "لغز اليوم", body: [{ type: "puzzle", question: "ما هو؟", answer: "الحفرة" }] },
    { id: "c", section: "discovery", title: "المشي", body: [{ type: "p", text: "عن الأناقة أيضًا" }] },
  ],
});
const index = buildSearchIndex([issue]);

describe("search", () => {
  it("finds by title ignoring hamza and ranks title hits first", () => {
    const hits = search(index, "اناقة");
    expect(hits.map((h) => h.doc.articleId)).toEqual(["a", "c"]);
  });
  it("requires all terms", () => {
    expect(search(index, "الأناقة القماش").map((h) => h.doc.articleId)).toEqual(["a"]);
  });
  it("never indexes puzzle answers", () => {
    expect(search(index, "الحفرة")).toHaveLength(0);
  });
  it("filters by section and handles empty queries", () => {
    expect(search(index, "الأناقة", { section: "discovery" }).map((h) => h.doc.articleId)).toEqual(["c"]);
    expect(search(index, "   ")).toEqual([]);
  });
  it("propagates demo flag", () => expect(index.every((d) => d.isDemo)).toBe(true));
});
