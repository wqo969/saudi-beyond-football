import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { IssueSchema, formatIssues } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";

const dir = path.join(__dirname, "..", "..", "content", "issues");
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

describe("content/issues", () => {
  it("has issues", () => expect(files.length).toBeGreaterThan(0));

  for (const f of files) {
    const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    describe(f, () => {
      it("matches the schema", () => {
        const r = IssueSchema.safeParse(raw);
        if (!r.success) throw new Error(formatIssues(r.error).join("\n"));
      });
      it("file name equals slug", () => expect(f).toBe(`${raw.slug}.json`));
      if (raw.isDemo) {
        it("demo issue: every article is flagged demo", () => {
          for (const a of raw.articles) expect(a.isDemo, a.id).toBe(true);
        });
        it("demo issue: no invented numbers in live-data facts", () => {
          for (const a of raw.articles) {
            if (!SECTIONS[a.section as keyof typeof SECTIONS].live) continue;
            for (const b of a.body) if (b.type === "facts") for (const item of b.items) expect(item.value, `${a.id}: ${item.label}`).not.toMatch(/[0-9٠-٩]/);
          }
        });
      }
    });
  }
});

describe("template", () => {
  it("content/templates/issue.template.json is importable", () => {
    const raw = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "content", "templates", "issue.template.json"), "utf8"));
    expect(IssueSchema.safeParse(raw).success).toBe(true);
  });
});
