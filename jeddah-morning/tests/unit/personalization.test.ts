import { describe, expect, it } from "vitest";
import { rankForYou } from "@/lib/personalization";
import { personaForDate } from "@/lib/personas";

const cands = ["fashion", "fashion", "fashion", "ai", "song", "puzzle", "travel", "careers"].map((section, i) => ({ issueSlug: "x", id: `a${i}`, section }));

describe("personalization", () => {
  it("keeps room for discovery even with strong interests", () => {
    const r = rankForYou(cands, { interests: ["fashion"], history: [], favorites: [], ratings: { articles: {} } }, 6);
    expect(r.length).toBe(6);
    expect(r.filter((c) => c.reason === "discovery").length).toBeGreaterThanOrEqual(2);
    expect(r[0].section).toBe("fashion");
  });
  it("skips already-read and disliked items", () => {
    const r = rankForYou(cands, { interests: [], history: [{ issueSlug: "x", articleId: "a0", section: "fashion" }], favorites: [], ratings: { articles: { "x/a3": -1 } } }, 8);
    expect(r.map((c) => c.id)).not.toContain("a0");
    expect(r.map((c) => c.id)).not.toContain("a3");
  });
});

describe("weekly personas", () => {
  it("maps weekdays to personas", () => {
    expect(personaForDate("2026-11-26").latin).toBe("THE WEEKEND EDIT"); // Thursday
    expect(personaForDate("2026-11-29").latin).toBe("THE WEEK AHEAD"); // Sunday
    expect(personaForDate("2026-12-01").latin).toBe("THE FUTURE ISSUE"); // Tuesday
    expect(personaForDate("2026-12-02").latin).toBe("THE STYLE ISSUE"); // Wednesday
  });
});
