import { expect, test, login, ISSUES, fromArabicDigits } from "./helpers";

test("every page of all seven demo issues renders without errors, and designs differ", async ({ page }) => {
  test.setTimeout(180_000);
  await login(page, "e2e-admin", "/admin");
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`${page.url()} ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errors.push(`${page.url()} ${m.text()}`));
  const looks: string[] = [];
  for (const slug of ISSUES) {
    await page.goto(`/issue/${slug}/read?p=0`);
    const total = Number(fromArabicDigits((await page.getByTestId("page-indicator").innerText()).split("/")[1].trim()));
    expect(total, slug).toBeGreaterThanOrEqual(16);
    const palette = (await page.locator("[data-reader]").getAttribute("class"))!.match(/jm-p-([\w-]+)/)![1];
    const cover = await page.locator("article[aria-label='الغلاف']").first().innerHTML();
    looks.push(`${palette}|${cover.length}`);
    for (let i = 1; i < total; i++) {
      await page.goto(`/issue/${slug}/read?p=${i}`);
      await expect(page.getByTestId("reader-stage")).toHaveAttribute("data-page", String(i));
      await expect(page.locator("[data-testid=reader-stage] article").first()).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
  for (let k = 1; k < looks.length; k++) expect(looks[k].split("|")[0], ISSUES[k]).not.toBe(looks[k - 1].split("|")[0]);
});

test("admin preview of scheduled issues; readers get 404 until publication", async ({ page, browser }) => {
  await login(page, "e2e-admin", "/admin");
  await page.goto("/issue/2026-11-27-morning/read");
  await expect(page.getByText("معاينة المحرر — هذا العدد غير منشور للقراء")).toBeVisible();
  const ctx = await browser.newContext();
  const rp = await ctx.newPage();
  await login(rp, "e2e-reader");
  expect((await rp.goto("/issue/2026-11-27-morning/read"))?.status()).toBe(404);
  await ctx.close();
});

test("admin design report shows novelty and memory checks", async ({ page }) => {
  await login(page, "e2e-admin", "/admin");
  await page.goto("/admin/issues/2026-11-28-morning");
  await expect(page.getByRole("heading", { name: "تقرير الإخراج ومنع التكرار" })).toBeVisible();
  await expect(page.getByText("درجة الجِدّة")).toBeVisible();
  await expect(page.getByText("لا تكرار في الترشيحات أو النصوص مقارنة بالأعداد السابقة.")).toBeVisible();
});

test("After Dark has its own night identity", async ({ page }) => {
  await login(page, "e2e-admin", "/admin");
  await page.goto("/issue/2026-11-26-evening/read?p=0");
  await expect(page.getByText("JEDDAH AFTER DARK").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ما وراء يوم طويل");
});

test("surprises: quiz gives a result, challenge progress persists", async ({ page }) => {
  await login(page, "e2e-admin", "/admin");
  await page.goto("/issue/2026-11-27-morning/surprise");
  for (const label of ["رواية طويلة", "ليلًا", "الفكرة"]) await page.getByRole("button", { name: label }).click();
  await expect(page.getByRole("status")).toContainText("قارئ متعمق");
  await page.goto("/issue/2026-11-28-morning/surprise");
  await page.getByRole("checkbox").first().check();
  await page.reload();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
});
