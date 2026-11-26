import { describe, expect, it } from "vitest";
import { PALETTES, contrast, darkAdapt, mixHex } from "@/lib/engine/palettes";

describe("secondary palettes stay readable (WCAG AA)", () => {
  for (const base of PALETTES) {
    for (const p of [base, darkAdapt(base)]) {
      const label = `${base.id}${p === base ? "" : " (dark mode)"}`;
      it(label, () => {
        expect(contrast(p.ink, p.paper), "ink/paper").toBeGreaterThanOrEqual(7);
        expect(contrast(p.muted, p.paper), "muted/paper").toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.accent, p.paper), "accent/paper").toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.onAccent, p.accent), "onAccent/accent").toBeGreaterThanOrEqual(4.5);
        expect(contrast(p.onDeep, p.deep), "onDeep/deep").toBeGreaterThanOrEqual(7);
        const accentLight = p.mode === "night" ? p.accent : mixHex(p.accent, "#ffffff", 0.55);
        expect(contrast(accentLight, p.deep), "accentLight/deep").toBeGreaterThanOrEqual(4.5);
      });
    }
  }
  it("has enough palettes for anti-repetition", () => {
    expect(PALETTES.filter((p) => p.mode === "day").length).toBeGreaterThanOrEqual(8);
    expect(PALETTES.filter((p) => p.mode === "night").length).toBeGreaterThanOrEqual(4);
  });
});
