import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("privacy & access control", () => {
  test("pages redirect to login; APIs and PDFs return 401 without a session", async ({ page, request }) => {
    await page.goto("/archive");
    await expect(page).toHaveURL(/\/login\?next=%2Farchive/);
    expect((await request.get("/api/search-index", { maxRedirects: 0 })).status()).toBe(401);
    expect((await request.get("/api/pdf/2026-11-26-morning", { maxRedirects: 0 })).status()).toBe(401);
    expect((await request.get("/issue/2026-11-26-morning", { maxRedirects: 0 })).status()).toBe(307);
  });

  test("public shell assets stay reachable and pages are noindex", async ({ request }) => {
    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.ok()).toBeTruthy();
    expect((await manifest.json()).dir).toBe("rtl");
    expect((await request.get("/icons/apple-touch-icon.png")).ok()).toBeTruthy();
    expect((await request.get("/sw.js")).ok()).toBeTruthy();
    const login = await request.get("/login");
    expect(login.headers()["x-robots-tag"]).toContain("noindex");
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /");
  });

  test("wrong password shows an error", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[name=password]", "wrong");
    await page.click("button[type=submit]");
    await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText("غير صحيحة");
  });

  test("open redirect via ?next is blocked", async ({ page }) => {
    await page.goto("/login?next=//evil.example");
    await page.fill("input[name=password]", "e2e-reader");
    await page.click("button[type=submit]");
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test("reader cannot open the admin area", async ({ page, request }) => {
    await login(page, "e2e-reader");
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin&reason=admin/);
    const res = await page.request.post("/api/admin/upload-pdf", { multipart: { slug: "2026-12-01-morning" } });
    expect(res.status()).toBe(403);
    void request;
  });

  test("drafts are hidden from readers", async ({ page }) => {
    await login(page, "e2e-reader");
    const res = await page.goto("/issue/2026-11-27-morning");
    expect(res?.status()).toBe(404);
  });

  test("logout ends the session", async ({ page }) => {
    await login(page, "e2e-reader");
    await page.goto("/settings");
    await page.getByTestId("logout").click();
    await expect(page).toHaveURL(/\/login/);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
