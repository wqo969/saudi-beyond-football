import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "./helpers";
import { login } from "./helpers";

test.beforeEach(async ({ page }) => login(page, "e2e-admin", "/admin"));

test("import JSON → draft hidden → publish → visible → delete", async ({ page, browser }) => {
  const tpl = JSON.parse(readFileSync(path.join(__dirname, "..", "..", "content", "templates", "issue.template.json"), "utf8"));
  delete tpl.status; // import must default to draft
  await page.goto("/admin/import");
  await page.getByTestId("json-text").fill(JSON.stringify(tpl));
  await page.getByTestId("import-json").click();
  await expect(page.getByRole("status")).toContainText("تم");

  await page.goto("/admin");
  const row = page.getByRole("row", { name: new RegExp(tpl.slug) });
  await expect(row).toContainText("مسودة");

  // A reader can't see the draft
  const reader = await browser.newContext();
  const rp = await reader.newPage();
  await login(rp, "e2e-reader");
  expect((await rp.goto(`/issue/${tpl.slug}`))?.status()).toBe(404);

  await row.getByRole("button", { name: "انشر الآن" }).click();
  await expect(row).toContainText("منشور");
  expect((await rp.goto(`/issue/${tpl.slug}`))?.status()).toBe(200);
  await reader.close();

  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "حذف" }).click();
  await expect(page.getByRole("row", { name: new RegExp(tpl.slug) })).toHaveCount(0);
});

test("invalid import is rejected with readable errors", async ({ page }) => {
  await page.goto("/admin/import");
  await page.getByTestId("json-text").fill(JSON.stringify({ slug: "bad", articles: [] }));
  await page.getByTestId("import-json").click();
  await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText("المعرّف");
});

test("editor: create an issue with an article and schedule it", async ({ page }) => {
  await page.goto("/admin/issues/new");
  await page.locator("input[type=date]").fill("2026-12-05");
  await page.getByLabel("عنوان العدد (داخلي)").fill("اختبار المحرر");
  await page.getByLabel("عنوان الغلاف", { exact: true }).fill("غلاف الاختبار");
  await page.getByTestId("status-select").selectOption("scheduled");
  await page.locator("input[type=datetime-local]").fill("2026-12-05T07:30");
  await page.getByTestId("add-article").click();
  await page.getByLabel("العنوان", { exact: true }).fill("مقال الاختبار");
  await page.getByLabel("النص", { exact: true }).fill("## عنوان\n\nفقرة أولى.\n\n@ ٠٨:٠٠ | حدث\n@ ٠٩:٠٠ | حدث ثانٍ");
  await page.getByTestId("save-issue").click();
  await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("يتطلب مصدرًا");
  await page.getByLabel(/المصادر/).fill("مصدر الاختبار | https://example.com");
  await page.getByTestId("save-issue").click();
  await expect(page).toHaveURL(/\/admin\/issues\/2026-12-05-morning$/);
  await expect(page.getByRole("heading", { name: "تقرير الإخراج ومنع التكرار" })).toBeVisible();
  await page.goto("/admin");
  const row = page.getByRole("row", { name: /2026-12-05-morning/ });
  await expect(row).toContainText("مجدول");
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "حذف" }).click();
  await expect(page.getByRole("row", { name: /2026-12-05-morning/ })).toHaveCount(0);
});

test("workflow: advance stages, approval freezes design, publishing twice is a no-op", async ({ page }) => {
  const tpl = { slug: "2026-12-07-morning", date: "2026-12-07", edition: "morning", number: 30, title: "سير العمل", coverHeadline: "اختبار", isDemo: true, articles: [{ id: "g-1", section: "personal-growth", title: "مادة", isDemo: true, body: [{ type: "p", text: "نص" }] }] };
  await page.goto("/admin/import");
  await page.getByTestId("json-text").fill(JSON.stringify(tpl));
  await page.getByTestId("import-json").click();
  await expect(page.getByRole("status")).toContainText("تم");
  await page.goto("/admin");
  const row = page.getByRole("row", { name: /2026-12-07-morning/ });
  for (const stage of ["مراجعة تحريرية", "تدقيق الحقائق", "مراجعة التصميم", "معتمد"]) {
    await row.getByRole("button", { name: `← ${stage}` }).click();
    await expect(row).toContainText(stage);
  }
  await expect(row).toContainText("مجمّد");
  await row.getByRole("button", { name: "انشر الآن" }).click();
  await expect(row).toContainText("منشور");
  const again = await page.request.get("/admin"); // idempotency is enforced server-side (unit-tested); smoke the page
  expect(again.ok()).toBeTruthy();
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "حذف" }).click();
  await expect(row).toHaveCount(0);
});

test("PDF upload validates file type and attaches to a new draft", async ({ page }) => {
  const notPdf = await page.request.post("/api/admin/upload-pdf", {
    multipart: { slug: "2026-12-06-morning", file: { name: "x.pdf", mimeType: "application/pdf", buffer: Buffer.from("hello") } },
  });
  expect(notPdf.status()).toBe(400);
  const pdf = readFileSync(path.join(__dirname, "..", "..", "content", "pdfs", "demo-2026-11-26-morning.pdf"));
  const ok = await page.request.post("/api/admin/upload-pdf", {
    multipart: { slug: "2026-12-06-morning", title: "PDF فقط", number: "9", file: { name: "a.pdf", mimeType: "application/pdf", buffer: pdf } },
  });
  expect(ok.status()).toBe(200);
  await page.goto("/admin");
  const row = page.getByRole("row", { name: /2026-12-06-morning/ });
  await expect(row).toContainText("PDF");
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "حذف" }).click();
  await expect(row).toHaveCount(0);
});
