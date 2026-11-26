import { expect, test } from "./helpers";

test("first run: no default passwords; owner sets passwords with the setup code; setup closes afterwards", async ({ page, request }) => {
  // nothing is reachable and demo passwords do not exist
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("link", { name: "ابدأ الإعداد الأولي" })).toBeVisible();
  expect((await request.get("/api/search-index")).status()).toBe(401);
  await page.goto("/setup");
  await page.locator("input[name=code]").fill("wrong-code-123456");
  await page.locator("input[name=reader]").fill("my-reader-password-1");
  await page.locator("input[name=admin]").fill("my-admin-password-22");
  await page.getByRole("button", { name: "احفظ وابدأ" }).click();
  await expect(page.locator("[role=alert]:not(#__next-route-announcer__)")).toContainText("غير صحيح");
  // demo passwords are shorter than the 12-char policy: blocked in the browser and rejected on the server (unit-tested)
  await expect(page.locator("input[name=reader]")).toHaveAttribute("minlength", "12");
  await page.locator("input[name=code]").fill("owner-chosen-setup-code-2026");
  await page.locator("input[name=reader]").fill("my-reader-password-1");
  await page.locator("input[name=admin]").fill("my-admin-password-22");
  await page.getByRole("button", { name: "احفظ وابدأ" }).click();
  await expect(page).toHaveURL(/\/login\?setup=done/);
  await expect(page.getByRole("status")).toContainText("اكتمل الإعداد");
  // setup cannot be repeated
  await page.goto("/setup");
  await expect(page.getByText("الإعداد مكتمل أو غير متاح")).toBeVisible();
  // log in as editor with the chosen password; the pipeline key is generated server-side
  await page.goto("/login?next=/admin/security");
  await page.fill("input[name=password]", "my-admin-password-22");
  await page.click("button[type=submit]");
  await expect(page).toHaveURL(/\/admin\/security/);
  await page.getByRole("button", { name: "اعرض المفتاح" }).click();
  const key = (await page.locator("code").innerText()).trim();
  expect(key).toMatch(/^[0-9a-f]{64}$/);
  const r = await request.get("/api/pipeline/issues", { headers: { "x-jm-pipeline-key": key } });
  expect(r.ok()).toBeTruthy();
  // push keys were generated too (no env configuration needed)
  const push = await (await page.request.get("/api/push/subscribe")).json();
  expect(push.enabled).toBe(true);
  expect(push.publicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/);
});
