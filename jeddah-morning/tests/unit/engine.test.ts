import { describe, expect, it } from "vitest";
import { ARTICLE_LAYOUTS, COVER_LAYOUTS, LAYOUTS, candidates, layoutById } from "@/lib/engine/layouts";
import { findDuplicates } from "@/lib/engine/memory";
import { noveltyReport, planAll, planIssue, type Fingerprint } from "@/lib/engine/planner";
import { RENDERED_LAYOUTS } from "@/components/magazine/MagazinePage";
import { IssueSchema } from "@/lib/schema";
import { loadDemoIssues } from "./helpers";

const issues = loadDemoIssues();
const plans = planAll(issues);

describe("layout library", () => {
  it("has at least 20 editorial layouts, each with a renderer", () => {
    expect(LAYOUTS.length).toBeGreaterThanOrEqual(20);
    for (const l of LAYOUTS) expect(RENDERED_LAYOUTS, l.id).toContain(l.id);
  });
  it("includes every layout named in the spec", () => {
    const required = ["cover-full", "cover-type", "cover-abstract", "two-column", "three-column", "photo-story", "spread", "investigation", "interview", "infographic", "timeline", "opinion", "fashion", "sports", "economy", "gallery", "travel-guide", "interactive", "quotes", "closing-art"];
    for (const id of required) expect(layoutById(id), id).toBeDefined();
  });
});

describe("dynamic editorial engine on the demo set", () => {
  it("is deterministic", () => {
    const again = planAll(issues);
    for (const i of issues) expect(again.get(i.slug)!.fingerprint).toEqual(plans.get(i.slug)!.fingerprint);
  });

  it("gives regular issues 16–24 pages", () => {
    for (const i of issues) {
      const n = plans.get(i.slug)!.pages.length;
      expect(n, i.slug).toBeGreaterThanOrEqual(16);
      expect(n, i.slug).toBeLessThanOrEqual(i.edition === "special" ? 40 : 24);
    }
  });

  it("never repeats the previous issue's cover layout or palette", () => {
    for (let k = 1; k < issues.length; k++) {
      const a = plans.get(issues[k - 1].slug)!;
      const b = plans.get(issues[k].slug)!;
      expect(b.coverLayout, issues[k].slug).not.toBe(a.coverLayout);
      expect(b.palette.id, issues[k].slug).not.toBe(a.palette.id);
    }
  });

  it("uses night identity for After Dark and day palettes for morning", () => {
    for (const i of issues) {
      const p = plans.get(i.slug)!;
      expect(p.palette.mode).toBe(i.edition === "evening" ? "night" : "day");
      if (i.edition === "evening") expect(p.identity.latin).toBe("JEDDAH AFTER DARK");
    }
  });

  it("follows the weekly persona of the date", () => {
    expect(plans.get("2026-11-26-morning")!.persona?.id).toBe("weekend-edit"); // Thursday
    expect(plans.get("2026-11-27-morning")!.persona?.id).toBe("culture"); // Friday
    expect(plans.get("2026-11-28-morning")!.persona?.id).toBe("reset");
    expect(plans.get("2026-11-29-morning")!.persona?.id).toBe("week-ahead");
    expect(plans.get("2026-11-30-morning")!.persona?.id).toBe("ambition");
    expect(plans.get("2026-12-01-special-winter")!.special?.key).toBe("winter");
  });

  it("only assigns layouts that fit the content (readability guard)", () => {
    for (const i of issues)
      for (const pg of plans.get(i.slug)!.pages.filter((p) => p.kind === "article")) {
        const a = i.articles.find((x) => x.id === pg.articleId)!;
        expect(candidates(a).map((c) => c.layout.id), `${i.slug}/${a.id}`).toContain(pg.layout);
      }
  });

  it("caps double-page spreads and avoids the same layout on consecutive pages", () => {
    for (const i of issues) {
      const seq = plans.get(i.slug)!.fingerprint.sequence;
      expect(seq.filter((l) => l === "spread").length).toBeLessThanOrEqual(2);
      for (let k = 1; k < seq.length; k++) if (seq[k] === seq[k - 1]) expect(["briefing", "two-column", "photo-story"]).toContain(seq[k]);
    }
  });

  it("scores every demo issue as clearly different from the previous ones", () => {
    const hist: Fingerprint[] = [];
    for (const i of issues) {
      const fp = plans.get(i.slug)!.fingerprint;
      expect(noveltyReport(fp, hist).score, i.slug).toBeGreaterThanOrEqual(85);
      hist.unshift(fp);
    }
  });

  it("rotates through the whole library across the demo week", () => {
    const used = new Set([...plans.values()].flatMap((p) => p.pages.map((x) => x.layout)));
    for (const l of [...ARTICLE_LAYOUTS, ...COVER_LAYOUTS]) expect(used.has(l.id), l.id).toBe(true);
  });

  it("puts the cover story first and the puzzle last", () => {
    for (const i of issues) {
      const order = plans.get(i.slug)!.order;
      if (i.coverStory) expect(order[0]).toBe(i.coverStory);
      const last = i.articles.find((a) => a.id === order[order.length - 1])!;
      expect(last.section).toBe("puzzle");
    }
  });

  it("honours a frozen design exactly", () => {
    const i = issues[0];
    const p = plans.get(i.slug)!;
    const frozen = IssueSchema.parse({ ...i, design: { lockOrder: false, frozen: { palette: "ember", coverLayout: "cover-type", contentsVariant: "list", closingVariant: "verse", pages: p.pages.map(({ layout, articleId, part }) => ({ layout, articleId, part })), frozenAt: "2026-11-26T00:00:00Z" } } });
    const fp = planIssue(frozen, []);
    expect(fp.frozen).toBe(true);
    expect(fp.palette.id).toBe("ember");
    expect(fp.coverLayout).toBe("cover-type");
    expect(fp.pages.map((x) => x.layout)).toEqual(p.pages.map((x) => x.layout));
  });

  it("honours editor overrides when they fit, and warns when they don't", () => {
    const i = issues[0];
    const art = i.articles.find((a) => a.section === "puzzle")!;
    const bad = IssueSchema.parse({ ...i, articles: i.articles.map((a) => (a.id === art.id ? { ...a, layout: "three-column" } : a)) });
    const plan = planIssue(bad, []);
    expect(plan.warnings.join()).toContain("لا يناسب");
    expect(plan.pages.find((p) => p.articleId === art.id)!.layout).not.toBe("three-column");
  });
});

describe("editorial memory", () => {
  it("finds no repeats in the demo set", () => {
    for (const i of issues) expect(findDuplicates(i, issues), i.slug).toEqual([]);
  });
  it("detects a repeated recommendation and near-duplicate text, but allows follow-ups", () => {
    const [first, second] = issues;
    const puzzle = first.articles.find((a) => a.section === "puzzle")!;
    const growth = first.articles.find((a) => a.section === "personal-growth")!;
    const copy = IssueSchema.parse({ ...second, articles: [...second.articles.filter((a) => a.section !== "puzzle"), { ...puzzle, id: "puzzle-x" }, { ...growth, id: "growth-copy" }] });
    const found = findDuplicates(copy, [first, copy]);
    expect(found.some((f) => f.type === "memory-key" && f.articleId === "puzzle-x")).toBe(true);
    expect(found.some((f) => f.type === "similar-text" && f.articleId === "growth-copy")).toBe(true);
    const follow = IssueSchema.parse({ ...copy, articles: copy.articles.map((a) => (a.id === "growth-copy" ? { ...a, followUp: true } : a)) });
    expect(findDuplicates(follow, [first, follow]).some((f) => f.articleId === "growth-copy")).toBe(false);
  });
});
