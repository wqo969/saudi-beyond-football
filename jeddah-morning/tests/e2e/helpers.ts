import { expect, type Page } from "@playwright/test";

export async function login(page: Page, password: "e2e-reader" | "e2e-admin", next = "/") {
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.fill("input[name=password]", password);
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(next === "/" ? /\/(\?.*)?$/ : new RegExp(next.replace(/[?]/g, "\\?")));
}
