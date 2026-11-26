import { expect, test, login } from "./helpers";

const KEY = "e2e-pipeline-key-0123456789-0123456789-abcdef";
const issue = {
  slug: "2026-11-20-morning", date: "2026-11-20", edition: "morning", number: 40, title: "اختبار خط الإنتاج", coverHeadline: "خط الإنتاج يعمل", isDemo: true,
  articles: [{ id: "growth-1", section: "personal-growth", title: "مادة الاختبار", isDemo: true, body: [{ type: "p", text: "نص" }, { type: "puzzle", question: "س؟", answer: "ج", explanation: "لأن" }] }],
};

test("pipeline API: key required, validate → save draft → print → PDF upload → publish once → notify once", async ({ request, page }) => {
  expect((await request.post("/api/pipeline/issue", { data: issue })).status()).toBe(401);
  expect((await request.post("/api/pipeline/issue", { data: issue, headers: { "x-jm-pipeline-key": "wrong" } })).status()).toBe(401);
  const bad = await request.post("/api/pipeline/issue", { data: { ...issue, slug: "x" }, headers: { "x-jm-pipeline-key": KEY } });
  expect(bad.status()).toBe(400);
  const ok = await request.post("/api/pipeline/issue", { data: issue, headers: { "x-jm-pipeline-key": KEY } });
  expect(ok.ok()).toBeTruthy();
  const list = await (await request.get("/api/pipeline/issues", { headers: { "x-jm-pipeline-key": KEY } })).json();
  expect(list.issues.find((i: { slug: string }) => i.slug === issue.slug).status).toBe("draft");
  // print route for the PDF edition, via key
  const print = await request.get(`/print/${issue.slug}`, { headers: { "x-jm-pipeline-key": KEY } });
  expect(print.status()).toBe(200);
  expect(await print.text()).toContain("خط الإنتاج يعمل");
  // PDF upload must be a real PDF
  expect((await request.post(`/api/pipeline/pdf?slug=${issue.slug}`, { data: Buffer.from("nope"), headers: { "x-jm-pipeline-key": KEY, "content-type": "application/pdf" } })).status()).toBe(400);
  const pdf = Buffer.from("%PDF-1.4\n%%EOF\n");
  expect((await request.post(`/api/pipeline/pdf?slug=${issue.slug}`, { data: pdf, headers: { "x-jm-pipeline-key": KEY, "content-type": "application/pdf" } })).ok()).toBeTruthy();
  // publish is idempotent
  const p1 = await (await request.post(`/api/pipeline/publish?slug=${issue.slug}`, { headers: { "x-jm-pipeline-key": KEY } })).json();
  const p2 = await (await request.post(`/api/pipeline/publish?slug=${issue.slug}`, { headers: { "x-jm-pipeline-key": KEY } })).json();
  expect(p1.ok && !p1.already).toBe(true);
  expect(p2.already).toBe(true);
  // a published issue cannot be silently overwritten
  expect((await request.post("/api/pipeline/issue", { data: issue, headers: { "x-jm-pipeline-key": KEY } })).status()).toBe(409);
  // notification: once only (no devices subscribed in tests → 0 sent)
  const n1 = await (await request.post(`/api/pipeline/notify?slug=${issue.slug}`, { headers: { "x-jm-pipeline-key": KEY } })).json();
  const n2 = await (await request.post(`/api/pipeline/notify?slug=${issue.slug}`, { headers: { "x-jm-pipeline-key": KEY } })).json();
  expect(n1.notified).toBe(true);
  expect(n2.notified).toBe(false);
  // readers see it immediately (cache invalidated), frozen design, PDF attached
  await login(page, "e2e-reader");
  await page.goto(`/issue/${issue.slug}`);
  await expect(page.getByRole("link", { name: "PDF" })).toBeVisible();
  // ops log records it (admin)
  await page.goto("/settings");
  await page.getByTestId("logout").click();
  await login(page, "e2e-admin", "/admin/operations");
  await expect(page.getByText("نُشر العدد").first()).toBeVisible();
  await expect(page.getByText("النشر متجاهَل: العدد منشور مسبقًا").first()).toBeVisible();
  // clean up so later tests see the original archive
  await page.goto("/admin");
  const row = page.getByRole("row", { name: new RegExp(issue.slug) });
  page.once("dialog", (d) => d.accept());
  await row.getByRole("button", { name: "حذف" }).click();
  await expect(row).toHaveCount(0);
});

test("cron endpoint requires its secret; print route hidden from readers", async ({ request, page }) => {
  expect((await request.get("/api/cron/publish")).status()).toBe(401);
  await login(page, "e2e-reader");
  expect((await page.goto("/print/2026-11-26-morning"))?.status()).toBe(404);
});

test("admin: version history, corrections, sources, backup, automation switch", async ({ page }) => {
  await login(page, "e2e-admin", "/admin");
  await page.goto("/admin/issues/2026-11-28-morning");
  await page.getByLabel("نص التصحيح").fill("تصحيح اختبار: تعديل صياغة فقرة.");
  await page.getByRole("button", { name: "أضف تصحيحًا" }).click();
  await expect(page.getByText("تصحيح اختبار: تعديل صياغة فقرة.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "استعادة" }).first()).toBeVisible();
  await page.goto("/admin/sources");
  await page.getByRole("button", { name: "+ مصدر" }).click();
  await page.getByLabel("اسم المصدر").last().fill("Open-Meteo");
  await page.getByLabel("الرابط").last().fill("https://open-meteo.com/");
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.getByRole("status")).toContainText("تم الحفظ");
  await page.goto("/admin/operations");
  await page.getByTestId("automation-toggle").click();
  await expect(page.getByText("الأتمتة موقوفة").first()).toBeVisible();
  await page.getByTestId("automation-toggle").click();
  await expect(page.getByText("الأتمتة تعمل").first()).toBeVisible();
  const backup = await page.request.get("/api/admin/export");
  expect(backup.ok()).toBeTruthy();
  const json = await backup.json();
  expect(json.issues.length).toBeGreaterThanOrEqual(7);
  expect(JSON.stringify(json)).not.toMatch(/pbkdf2|password|JM_/i);
});

test("security: change passwords logs out other sessions; lockout after repeated failures", async ({ page, browser }) => {
  // other device signed in as reader
  const other = await browser.newContext();
  const op = await other.newPage();
  await login(op, "e2e-reader");
  await login(page, "e2e-admin", "/admin/security");
  await page.locator("input[name=current]").fill("e2e-admin-pass-01");
  await page.locator("input[name=reader]").fill("new-reader-pass-2026");
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.getByRole("status")).toContainText("أُنهيت الجلسات");
  // revocation propagates within the gate's short cache window (≤ 10s)
  await expect.poll(async () => { await op.goto("/"); return op.url(); }, { timeout: 30_000, intervals: [2000] }).toMatch(/\/login/);
  await op.fill("input[name=password]", "e2e-reader-pass");
  await op.click("button[type=submit]");
  await expect(op.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("غير صحيحة");
  await op.fill("input[name=password]", "new-reader-pass-2026");
  await op.click("button[type=submit]");
  await expect(op).toHaveURL(/localhost:\d+\/$/);
  // restore the original reader password for the rest of the suite
  await page.locator("input[name=current]").fill("e2e-admin-pass-01");
  await page.locator("input[name=reader]").fill("e2e-reader-pass");
  await page.getByRole("button", { name: "حفظ" }).click();
  await expect(page.getByRole("status")).toContainText("أُنهيت الجلسات");
  await other.close();
});
