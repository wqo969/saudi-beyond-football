import { expect, test } from "./helpers";
import { login } from "./helpers";

test("saved issue can be read offline; unsaved pages fall back to the offline page", async ({ page, context }) => {
  await login(page, "e2e-reader");
  await page.goto("/issue/2026-11-26-morning");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // let the SW control the page
  await page.getByTestId("save-offline").click();
  await expect(page.getByTestId("save-offline")).toContainText("محفوظ", { timeout: 20_000 });

  await context.setOffline(true);
  await page.goto("/issue/2026-11-26-morning/a/opinion-1");
  await expect(page.getByRole("heading", { name: "في مديح البطء" })).toBeVisible();
  await page.goto("/issue/2026-11-26-morning/read");
  await expect(page.getByTestId("reader-stage")).toBeVisible();
  await page.goto("/sections");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("أنت دون اتصال");
  await context.setOffline(false);
});
