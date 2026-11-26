import { describe, expect, it } from "vitest";
import { compareIssuesDesc, effectiveStatus, isVisible } from "@/lib/publishing";

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
  it("sorts newest first, evening before morning on the same day", () => {
    const list = [
      { date: "2026-11-25", edition: "evening" as const },
      { date: "2026-11-26", edition: "morning" as const },
      { date: "2026-11-26", edition: "evening" as const },
    ].sort(compareIssuesDesc);
    expect(list.map((i) => `${i.date}-${i.edition}`)).toEqual(["2026-11-26-evening", "2026-11-26-morning", "2026-11-25-evening"]);
  });
});
