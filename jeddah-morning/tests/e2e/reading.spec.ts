import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page, "e2e-reader"));

test("home shows today's cover, RTL, and a clear demo notice", async ({ page }) => {
  await page.goto("/?edition=morning");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("note")).toContainText("محتوى تجريبي");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("الأناقة في مدينة البحر");
  await expect(page.getByRole("heading", { name: "في هذا العدد" })).toBeVisible();
});

test("interactive index links to articles", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning");
  await page.getByRole("link", { name: /صباح بطيء/ }).click();
  await expect(page).toHaveURL(/\/a\/personal-growth-3$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("صباح بطيء");
});

test("magazine reader flips pages by button, keyboard (RTL) and swipe", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/read?p=0");
  const stage = page.getByTestId("reader-stage");
  await expect(stage).toHaveAttribute("data-page", "0");
  await page.getByRole("button", { name: "الصفحة التالية" }).last().click();
  await expect(stage).toHaveAttribute("data-page", "1");
  await page.keyboard.press("ArrowLeft"); // forward in Arabic
  await expect(stage).toHaveAttribute("data-page", "2");
  await page.keyboard.press("ArrowRight"); // back
  await expect(stage).toHaveAttribute("data-page", "1");
  // swipe left→right = next page
  const box = (await stage.boundingBox())!;
  const y = box.y + box.height / 2;
  await stage.dispatchEvent("pointerdown", { clientX: box.x + 40, clientY: y, pointerId: 1, isPrimary: true });
  await stage.dispatchEvent("pointerup", { clientX: box.x + 260, clientY: y + 5, pointerId: 1, isPrimary: true });
  await expect(stage).toHaveAttribute("data-page", "2");
  await expect(page).toHaveURL(/p=2/);
  // page drawer jumps directly
  await page.getByRole("button", { name: "فهرس الصفحات" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /لغز اليوم/ }).click();
  await expect(stage).toHaveAttribute("data-page", "14");
});

test("puzzle reveals its answer only on request", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/a/puzzle-3");
  await expect(page.getByText("الحل: الحفرة")).toHaveCount(0);
  await page.getByRole("button", { name: "اكشف الحل" }).click();
  await expect(page.getByText("الحل: الحفرة")).toBeVisible();
});

test("PDF reader renders pages and navigates", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/pdf");
  await expect(page.getByTestId("pdf-indicator")).toHaveText("١ / ٤", { timeout: 15_000 });
  await expect(page.getByTestId("pdf-canvas")).toBeVisible();
  await page.getByRole("button", { name: "الصفحة التالية" }).click();
  await expect(page.getByTestId("pdf-indicator")).toHaveText("٢ / ٤");
});

test("archive lists issues and filters by edition", async ({ page }) => {
  await page.goto("/archive");
  await expect(page.getByRole("link", { name: /ماذا نشاهد الليلة/ })).toBeVisible();
  await page.getByRole("link", { name: "الصباحية" }).click();
  await expect(page).toHaveURL(/edition=morning/);
  await expect(page.getByRole("link", { name: /ماذا نشاهد الليلة/ })).toHaveCount(0);
});

test("search is forgiving about hamza and filters by section", async ({ page }) => {
  await page.goto("/search");
  await page.getByPlaceholder("ابحث في كل الأعداد…").fill("اناقة");
  await expect(page.getByRole("link", { name: /الأناقة في مدينة البحر/ }).first()).toBeVisible();
  await page.goto("/search?section=puzzle");
  await expect(page.getByRole("link", { name: /لغز اليوم/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /الأناقة/ })).toHaveCount(0);
});

test("favorites persist on the device", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/a/discovery-3");
  await page.getByRole("button", { name: "أضف للمفضلة" }).click();
  await expect(page.getByRole("button", { name: "في المفضلة" })).toHaveAttribute("aria-pressed", "true");
  await page.goto("/favorites");
  await expect(page.getByRole("link", { name: /متعة المشي بلا وجهة/ })).toBeVisible();
  await page.getByRole("button", { name: /إزالة/ }).click();
  await expect(page.getByText("لا شيء هنا بعد")).toBeVisible();
});

test("dark mode toggles and persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "الوضع الليلي" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
