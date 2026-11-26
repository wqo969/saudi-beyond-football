import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { planIssue } from "@/lib/engine/planner";
import { IssueSchema, formatIssues } from "@/lib/schema";
import { SECTIONS, CORE_MORNING_SECTIONS } from "@/lib/sections";

/**
 * Pre-publication check for a real issue file (used by the daily pipeline):
 *   ISSUE_FILE=/path/to/issue.json npx vitest run tests/unit/issue-file.test.ts
 * Skipped when ISSUE_FILE is not set.
 */
const file = process.env.ISSUE_FILE;
describe.skipIf(!file || !existsSync(file))("issue file pre-publication check", () => {
  const raw = file ? JSON.parse(readFileSync(file, "utf8")) : null;
  it("matches the schema (sources, rights, structure)", () => {
    const r = IssueSchema.safeParse(raw);
    if (!r.success) throw new Error(formatIssues(r.error).join("\n"));
  });
  it("is real content: not demo, every live-section article cites dated or linked sources", () => {
    const issue = IssueSchema.parse(raw);
    expect(issue.isDemo).toBe(false);
    for (const a of issue.articles) {
      expect(a.isDemo, a.id).toBe(false);
      if (SECTIONS[a.section].live && a.kind !== "opinion") {
        expect(a.sources.length, a.id).toBeGreaterThan(0);
        for (const s of a.sources) expect(s.url, `${a.id}: ${s.name}`).toMatch(/^https:\/\//);
      }
    }
  });
  it("keeps all 13 core sections in a morning issue", () => {
    const issue = IssueSchema.parse(raw);
    if (issue.edition !== "morning") return;
    const secs = new Set(issue.articles.map((a) => a.section));
    for (const k of CORE_MORNING_SECTIONS) expect(secs.has(k), k).toBe(true);
  });
  it("plans to 16–24 pages", () => {
    const plan = planIssue(IssueSchema.parse(raw), []);
    expect(plan.pages.length).toBeGreaterThanOrEqual(16);
    expect(plan.pages.length).toBeLessThanOrEqual(24);
    console.log(`[issue-check] ${plan.pages.length} pages · cover ${plan.coverLayout} · palette ${plan.palette.id} · ${plan.identity.latin}`);
  });
});
