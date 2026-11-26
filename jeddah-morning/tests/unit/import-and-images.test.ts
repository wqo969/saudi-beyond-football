import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blocksToText, textToBlocks } from "@/lib/editor-format";
import { markdownToIssue } from "@/lib/markdown-import";
import { IssueSchema, formatIssues } from "@/lib/schema";

describe("Markdown import", () => {
  it("converts the Markdown template into a valid issue", () => {
    const md = readFileSync(path.join(__dirname, "..", "..", "content", "templates", "issue.template.md"), "utf8");
    const raw = markdownToIssue(md);
    const r = IssueSchema.safeParse(raw);
    if (!r.success) throw new Error(formatIssues(r.error).join("\n"));
    expect(r.data.articles).toHaveLength(2);
    expect(r.data.articles[0].body.some((b) => b.type === "h")).toBe(true);
    expect(r.data.articles[1].sources[0].url).toBe("https://example.com/source");
  });
});

describe("editorial images", () => {
  const img = { type: "image", src: "/api/media/al-balad-01.jpg", alt: "واجهة", credit: "مصور", license: "CC BY-SA 4.0", sourceUrl: "https://commons.wikimedia.org/wiki/File:X.jpg" } as const;
  const base = { slug: "2026-12-01-morning", date: "2026-12-01", edition: "morning", number: 1, title: "t", coverHeadline: "c" };
  it("requires credit, license and a source for every image", () => {
    const ok = IssueSchema.safeParse({ ...base, articles: [{ id: "a", section: "discovery", title: "x", body: [img] }] });
    expect(ok.success).toBe(true);
    const { credit: _c, ...noCredit } = img;
    void _c;
    expect(IssueSchema.safeParse({ ...base, articles: [{ id: "a", section: "discovery", title: "x", body: [noCredit] }] }).success).toBe(false);
    expect(IssueSchema.safeParse({ ...base, articles: [{ id: "a", section: "discovery", title: "x", body: [{ ...img, src: "https://hotlink.example/x.jpg" }] }] }).success).toBe(false);
  });
  it("round-trips through the editor format", () => {
    expect(textToBlocks(blocksToText([img]))).toEqual([img]);
  });
});
