import AxeBuilder from "@axe-core/playwright";
import { expect, test, login } from "./helpers";

// Accessibility smoke test with axe-core: no critical or serious violations on key screens.
for (const path of ["/", "/issue/2026-11-26-morning", "/issue/2026-11-26-morning/a/opinion-1", "/issue/2026-11-26-morning/read?p=1", "/issue/2026-11-26-morning/brief", "/search", "/settings"]) {
  test(`axe: ${path}`, async ({ page }) => {
    await login(page, "e2e-reader");
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const r = await new AxeBuilder({ page }).disableRules(["color-contrast"]).analyze();
    const bad = r.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect(bad.map((v) => `${v.id}: ${v.nodes.length} — ${v.nodes[0]?.target}`)).toEqual([]);
  });
}
