import { expect, test, login, fromArabicDigits } from "./helpers";

test.beforeEach(async ({ page }) => login(page, "e2e-reader"));

test("home: today's cover, persona, RTL and a clear demo notice", async ({ page }) => {
  await page.goto("/?edition=morning");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("note").first()).toContainText("محتوى تجريبي");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("عطلة على مهل في مدينة البحر");
  await expect(page.getByText("THE WEEKEND EDIT").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "في هذا العدد" })).toBeVisible();
});

test("interactive index links to articles rendered in their planned layout", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning");
  await page.getByRole("link", { name: /في مديح البطء/ }).click();
  await expect(page).toHaveURL(/\/a\/opinion-1$/);
  await expect(page.getByRole("heading", { name: "في مديح البطء" })).toBeVisible();
  await expect(page.getByText("مقال رأي يعبّر عن كاتبه ولا يُقدَّم كخبر.")).toBeVisible();
});

test("magazine reader flips by button, RTL keyboard, swipe and page drawer", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/read?p=0");
  const stage = page.getByTestId("reader-stage");
  await expect(stage).toHaveAttribute("data-page", "0");
  await page.getByRole("button", { name: "الصفحة التالية" }).last().click();
  await expect(stage).toHaveAttribute("data-page", "1");
  await page.keyboard.press("ArrowLeft");
  await expect(stage).toHaveAttribute("data-page", "2");
  await page.keyboard.press("ArrowRight");
  await expect(stage).toHaveAttribute("data-page", "1");
  const box = (await stage.boundingBox())!;
  const y = box.y + box.height / 2;
  await stage.dispatchEvent("pointerdown", { clientX: box.x + 40, clientY: y, pointerId: 1, isPrimary: true, target: undefined });
  await stage.dispatchEvent("pointerup", { clientX: box.x + 260, clientY: y + 5, pointerId: 1, isPrimary: true });
  await expect(stage).toHaveAttribute("data-page", "2");
  await expect(page).toHaveURL(/p=2/);
  await page.getByRole("button", { name: "فهرس الصفحات والإعدادات" }).click();
  await page.getByRole("dialog").getByRole("button", { name: /مفاجأة العدد/ }).click();
  await expect(page.getByRole("heading", { name: "خلفية العدد الأول" })).toBeVisible();
});

test("reader settings: vertical mode, no-effect, text size, go-to page, focus mode", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/read?p=0");
  const total = Number(fromArabicDigits((await page.getByTestId("page-indicator").innerText()).split("/")[1].trim()));
  expect(total).toBeGreaterThanOrEqual(16);
  await page.getByRole("button", { name: "تكبير النص" }).click();
  await expect(page.locator("[data-reader]")).toHaveAttribute("style", /--reader-scale:\s*1\.15/);
  await page.getByRole("button", { name: "فهرس الصفحات والإعدادات" }).click();
  await page.getByLabel("انتقل إلى صفحة").fill("5");
  await page.getByRole("button", { name: "انتقل" }).click();
  await expect(page.getByTestId("reader-stage")).toHaveAttribute("data-page", "4");
  await page.getByRole("button", { name: "فهرس الصفحات والإعدادات" }).click();
  await page.getByRole("radio", { name: "بدون" }).click();
  await page.getByRole("radio", { name: "عمودي" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("reader-stage")).toHaveAttribute("data-mode", "scroll");
  await expect(page.locator("#page-0")).toBeAttached();
  await expect(page.locator(`#page-${total - 1}`)).toBeAttached();
  // preference persists
  await page.reload();
  await expect(page.getByTestId("reader-stage")).toHaveAttribute("data-mode", "scroll");
  await page.getByRole("button", { name: "فهرس الصفحات والإعدادات" }).click();
  await page.getByRole("radio", { name: "صفحات" }).click();
  await page.keyboard.press("Escape");
  await page.getByTitle("وضع التركيز").click();
  await expect(page.getByRole("link", { name: "إغلاق القارئ" })).toHaveCount(0);
  await page.getByRole("button", { name: "إنهاء التركيز" }).click();
  await expect(page.getByRole("link", { name: "إغلاق القارئ" })).toBeVisible();
});

test("puzzle reveals answer and explanation only on request", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/a/puzzle-1");
  await expect(page.getByText("الحل: الحفرة")).toHaveCount(0);
  await page.getByRole("button", { name: "اكشف الحل" }).click();
  await expect(page.getByText(/الحل: الحفرة/)).toBeVisible();
  await expect(page.getByText("كل ما تزيله من ترابها يزيد حجمها.")).toBeVisible();
});

test("brief edition, surprise and rating work from the same source", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/brief");
  await expect(page.getByRole("heading", { name: "العدد في دقيقتين" })).toBeVisible();
  await expect(page.getByRole("link", { name: "نزهة في جدة التاريخية: ماذا تلاحظ؟" })).toBeVisible();
  await page.goto("/issue/2026-11-26-morning/surprise");
  await expect(page.getByRole("button", { name: "حمّل الخلفية" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "حمّل الخلفية" }).click();
  expect((await download).suggestedFilename()).toMatch(/\.png$/);
  await page.goto("/issue/2026-11-26-morning/rate");
  await page.getByRole("radio", { name: "4 من 5" }).click();
  await page.reload();
  await expect(page.getByRole("radio", { name: "4 من 5" })).toHaveAttribute("aria-checked", "true");
});

test("PDF reader renders pages and navigates", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/pdf");
  await expect(page.getByTestId("pdf-indicator")).toHaveText("١ / ٤", { timeout: 15_000 });
  await expect(page.getByTestId("pdf-canvas")).toBeVisible();
  await page.getByRole("button", { name: "الصفحة التالية" }).click();
  await expect(page.getByTestId("pdf-indicator")).toHaveText("٢ / ٤");
});

test("archive, cover archive and edition filter", async ({ page }) => {
  await page.goto("/archive");
  await expect(page.getByRole("link", { name: /العدد ١ — مختارات الويكند/ })).toBeVisible();
  await page.getByRole("link", { name: "المسائية" }).click();
  await expect(page).toHaveURL(/edition=evening/);
  await page.goto("/covers");
  await expect(page.getByRole("heading", { name: "أرشيف الأغلفة" })).toBeVisible();
  await expect(page.getByText("غلاف فني تجريدي").first()).toBeVisible();
});

test("search is forgiving about hamza and filters by section", async ({ page }) => {
  await page.goto("/search");
  await page.getByPlaceholder("ابحث في كل الأعداد…").fill("اناقة");
  await expect(page.getByRole("link", { name: /الكتان: أناقة تتنفس/ }).first()).toBeVisible();
  await page.goto("/search?section=puzzle");
  await expect(page.getByRole("link", { name: /لغز اليوم/ }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /الكتان/ })).toHaveCount(0);
});

test("favorites, collections and reading history persist on the device", async ({ page }) => {
  await page.goto("/issue/2026-11-26-morning/a/discovery-1");
  await page.getByRole("button", { name: "أضف للمفضلة" }).click();
  await expect(page.getByRole("button", { name: "في المفضلة" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "+ مجموعة" }).click();
  await page.getByPlaceholder("مجموعة جديدة").fill("قراءات الويكند");
  await page.getByRole("button", { name: "أضف", exact: true }).click();
  await page.goto("/favorites");
  await expect(page.getByRole("link", { name: /مشي الفجر على البحر/ })).toBeVisible();
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: /قراءات الويكند/ })).toBeVisible();
  await page.goto("/history");
  await expect(page.getByRole("link", { name: /مشي الفجر على البحر/ })).toBeVisible();
});

test("personalization: interests drive «مختارات لك» and can be wiped", async ({ page }) => {
  await page.goto("/profile");
  await page.getByRole("button", { name: "الموضة والأناقة" }).click();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "مختارات لك" })).toBeVisible();
  await page.goto("/profile");
  page.once("dialog", (d) => d.accept());
  await page.getByTestId("wipe").click();
  await expect(page.getByRole("status")).toContainText("حُذفت");
  await page.getByRole("checkbox").uncheck();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "مختارات لك" })).toHaveCount(0);
});

test("dark mode toggles and persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "الوضع الليلي" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("secondary screens load", async ({ page }) => {
  for (const [path, heading] of [
    ["/sections", "الأقسام التحريرية"], ["/section/fashion", "الموضة والأناقة"], ["/specials", "الأعداد الخاصة"], ["/gifts", "الهدايا الرقمية"],
    ["/notifications", "الإشعارات"], ["/next", /THE|JEDDAH/], ["/settings", "المزيد والإعدادات"], ["/library", "مكتبتي"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }), path).toContainText(heading);
  }
});
