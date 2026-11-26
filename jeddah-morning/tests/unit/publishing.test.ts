import { describe, expect, it } from "vitest";
import { compareIssuesDesc, effectiveStatus, isVisible, nextStatus, targetPublishAt } from "@/lib/publishing";

const now = new Date("2026-11-26T12:00:00+03:00");

describe("publishing", () => {
  it("published is visible, draft is not", () => {
    expect(isVisible({ status: "published" }, now)).toBe(true);
    expect(isVisible({ status: "draft" }, now)).toBe(false);
  });
  it("scheduled becomes visible exactly at publishAt", () => {
    const s = { status: "scheduled" as const, publishAt: "2026-11-26T18:00:00+03:00" };
    expect(isVisible(s, now)).toBe(false);
    expect(isVisible(s, new Date("2026-11-26T18:00:00+03:00"))).toBe(true);
    expect(effectiveStatus(s, new Date("2026-11-27T00:00:00+03:00"))).toBe("auto-published");
  });
  it("keeps archived issues readable and hides review stages", () => {
    expect(isVisible({ status: "archived" }, now)).toBe(true);
    for (const s of ["editorial-review", "fact-check", "design-review", "approved"] as const) expect(isVisible({ status: s }, now)).toBe(false);
  });
  it("walks the editorial workflow in order", () => {
    expect(nextStatus("draft")).toBe("editorial-review");
    expect(nextStatus("design-review")).toBe("approved");
    expect(nextStatus("archived")).toBeNull();
  });
  it("targets 07:30 / 22:30 Riyadh", () => {
    expect(targetPublishAt("2026-11-26", "morning")).toBe("2026-11-26T07:30:00+03:00");
    expect(targetPublishAt("2026-11-26", "evening")).toBe("2026-11-26T22:30:00+03:00");
  });
  it("sorts newest first, evening before morning on the same day", () => {
    const list = [
      { date: "2026-11-25", edition: "evening" as const },
      { date: "2026-11-26", edition: "morning" as const },
      { date: "2026-11-26", edition: "evening" as const },
    ].sort(compareIssuesDesc);
    expect(list.map((i) => `${i.date}-${i.edition}`)).toEqual(["2026-11-26-evening", "2026-11-26-morning", "2026-11-25-evening"]);
  });
});
