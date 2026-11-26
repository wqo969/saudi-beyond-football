import { devices } from "@playwright/test";
import { expect, test, login } from "./helpers";

// Layout sanity on several real device sizes: no horizontal overflow, reader fills the screen.
for (const name of ["iPhone SE", "iPhone 15 Pro Max", "iPad Mini", "Desktop Chrome"] as const) {
  test.describe(name, () => {
    const { defaultBrowserType: _b, ...d } = devices[name];
    void _b;
    test.use({ ...d });
    test(`no horizontal overflow on key screens (${name})`, async ({ page }) => {
      await login(page, "e2e-admin", "/admin");
      for (const path of ["/", "/issue/2026-11-27-morning", "/issue/2026-11-27-morning/a/culture-3", "/issue/2026-11-27-morning/read?p=0", "/issue/2026-11-29-morning/read?p=3", "/archive", "/library"]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${name} ${path}`).toBeLessThanOrEqual(1);
      }
    });
  });
}
