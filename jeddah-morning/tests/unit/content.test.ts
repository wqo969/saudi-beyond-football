import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { IssueSchema, formatIssues } from "@/lib/schema";
import { SECTIONS, CORE_MORNING_SECTIONS } from "@/lib/sections";
import { ISSUES_DIR, loadDemoIssues } from "./helpers";

const files = readdirSync(ISSUES_DIR).filter((f) => f.endsWith(".json"));

describe("content/issues (demo set)", () => {
  it("contains seven demo issues starting Thursday 26 Nov 2026", () => {
    const issues = loadDemoIssues();
    expect(issues).toHaveLength(7);
    expect(issues[0].date).toBe("2026-11-26");
    expect(issues.map((i) => i.edition)).toContain("evening");
    expect(issues.map((i) => i.edition)).toContain("special");
  });

  for (const f of files) {
    const raw = JSON.parse(readFileSync(path.join(ISSUES_DIR, f), "utf8"));
    describe(f, () => {
      it("matches the schema", () => {
        const r = IssueSchema.safeParse(raw);
        if (!r.success) throw new Error(formatIssues(r.error).join("\n"));
      });
      it("file name equals slug", () => expect(f).toBe(`${raw.slug}.json`));
      it("is clearly marked demo, issue and every article", () => {
        expect(raw.isDemo).toBe(true);
        for (const a of raw.articles) expect(a.isDemo, a.id).toBe(true);
      });
      it("invents no live numbers: facts/stats in live sections use placeholders", () => {
        for (const a of raw.articles) {
          if (!SECTIONS[a.section as keyof typeof SECTIONS].live || a.section === "careers" && a.kind !== "template") {
            // evergreen sections may contain general-knowledge numbers (e.g. «80/20», puzzle maths)
          }
          if (!SECTIONS[a.section as keyof typeof SECTIONS].live) continue;
          for (const b of a.body) {
            if (b.type === "facts") for (const it of b.items) expect(it.value, `${a.id}: ${it.label}`).not.toMatch(/[0-9٠-٩]/);
            if (b.type === "stats") for (const it of b.items) expect(it.value, `${a.id}: ${it.label}`).not.toMatch(/[0-9٠-٩]/);
          }
        }
      });
      it("never fabricates interviews: Q&A only in templates with placeholder answers", () => {
        for (const a of raw.articles)
          for (const b of a.body)
            if (b.type === "qa") {
              expect(a.kind).toBe("template");
              for (const x of b.items) expect(x.a).toMatch(/^\[.*\]$/);
            }
      });
      if (raw.edition === "morning")
        it("keeps all 13 core morning sections", () => {
          const secs = new Set(raw.articles.map((a: { section: string }) => a.section));
          for (const k of CORE_MORNING_SECTIONS) expect(secs.has(k), k).toBe(true);
        });
    });
  }
});

describe("template", () => {
  it("content/templates/issue.template.json is importable", () => {
    const raw = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "content", "templates", "issue.template.json"), "utf8"));
    const r = IssueSchema.safeParse(raw);
    if (!r.success) throw new Error(formatIssues(r.error).join("\n"));
  });
});
