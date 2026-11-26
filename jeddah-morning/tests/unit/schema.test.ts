import { describe, expect, it } from "vitest";
import { IssueSchema } from "@/lib/schema";

const base = {
  slug: "2026-12-01-morning", date: "2026-12-01", edition: "morning", number: 1, title: "t", coverHeadline: "c",
  articles: [{ id: "a-1", section: "fashion", title: "x", body: [{ type: "p", text: "y" }] }],
};

describe("IssueSchema", () => {
  it("accepts a minimal valid issue and applies defaults", () => {
    const r = IssueSchema.parse(base);
    expect(r.status).toBe("draft");
    expect(r.isDemo).toBe(false);
  });
  it("rejects slug not matching date/edition", () => {
    expect(IssueSchema.safeParse({ ...base, slug: "2026-12-02-morning" }).success).toBe(false);
  });
  it("requires publishAt for scheduled issues", () => {
    expect(IssueSchema.safeParse({ ...base, status: "scheduled" }).success).toBe(false);
    expect(IssueSchema.safeParse({ ...base, status: "scheduled", publishAt: "2026-12-01T06:00:00+03:00" }).success).toBe(true);
  });
  it("rejects duplicate article ids", () => {
    const a = base.articles[0];
    expect(IssueSchema.safeParse({ ...base, articles: [a, a] }).success).toBe(false);
  });
  it("requires sources for real content in live-data sections", () => {
    const news = { id: "n-1", section: "news", title: "خبر", body: [{ type: "p", text: "..." }] };
    expect(IssueSchema.safeParse({ ...base, articles: [news] }).success).toBe(false);
    expect(IssueSchema.safeParse({ ...base, articles: [{ ...news, isDemo: true }] }).success).toBe(true);
    expect(IssueSchema.safeParse({ ...base, articles: [{ ...news, sources: [{ name: "مصدر", url: "https://example.com" }] }] }).success).toBe(true);
  });
  it("requires articles or a pdf", () => {
    expect(IssueSchema.safeParse({ ...base, articles: [] }).success).toBe(false);
    expect(IssueSchema.safeParse({ ...base, articles: [], pdf: { file: "x.pdf" } }).success).toBe(true);
  });
  it("rejects path traversal in pdf file names", () => {
    expect(IssueSchema.safeParse({ ...base, pdf: { file: "../secret.pdf" } }).success).toBe(false);
  });
});
