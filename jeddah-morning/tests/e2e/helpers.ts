import { test as base, expect, type Page } from "@playwright/test";

/** Every test context skips the launch splash. */
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addInitScript(() => {
      try {
        sessionStorage.setItem("jm:splashed", "1");
      } catch {}
    });
    await provide(context);
  },
});
export { expect };

export async function login(page: Page, password: "e2e-reader" | "e2e-admin", next = "/") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.fill("input[name=password]", password);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(next === "/" ? /\/(\?.*)?$/ : new RegExp(next.replace(/[?]/g, "\\?")));
}

export const ISSUES = ["2026-11-26-morning", "2026-11-26-evening", "2026-11-27-morning", "2026-11-28-morning", "2026-11-29-morning", "2026-11-30-morning", "2026-12-01-special-winter"];
export const fromArabicDigits = (s: string) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
export const alertBox = (page: Page) => page.locator("[role=alert]:not(#__next-route-announcer__)");
