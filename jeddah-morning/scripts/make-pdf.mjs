// Produces the PDF edition of an issue from the print route (same single source as the app).
// Usage:
//   node scripts/make-pdf.mjs --base http://localhost:3000 --slug 2026-11-27-morning --out out.pdf [--password <admin>]
//   JM_PIPELINE_KEY=… node scripts/make-pdf.mjs --base https://<prod> --slug … --out … --upload
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const base = arg("base", "http://localhost:3000");
const slug = arg("slug");
const out = arg("out", `${slug}.pdf`);
const password = arg("password", process.env.JM_ADMIN_PASSWORD);
const key = process.env.JM_PIPELINE_KEY;
if (!slug) throw new Error("--slug required");

const browser = await chromium.launch();
const ctx = await browser.newContext({ extraHTTPHeaders: key ? { "x-jm-pipeline-key": key } : {}, locale: "ar-SA", timezoneId: "Asia/Riyadh" });
await ctx.addInitScript(() => { try { sessionStorage.setItem("jm:splashed", "1"); } catch {} });
const page = await ctx.newPage();
if (!key) {
  await page.goto(`${base}/login`);
  await page.fill("input[name=password]", password);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}
const res = await page.goto(`${base}/print/${slug}`, { waitUntil: "networkidle" });
if (!res || !res.ok()) throw new Error(`print route failed: ${res?.status()}`);
await page.waitForSelector("[data-print-ready]");
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: "print" });
const footer = `<div style="width:100%;font-size:7px;color:#888;font-family:serif;text-align:center;direction:ltr">JEDDAH MORNING · ${slug} · <span class="pageNumber"></span>/<span class="totalPages"></span></div>`;
await page.pdf({ path: out, width: "148mm", height: "210mm", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>", footerTemplate: footer, margin: { top: "0", bottom: "8mm", left: "0", right: "0" }, preferCSSPageSize: false });
await browser.close();
const size = readFileSync(out).length;
console.log(`[pdf] ${out} (${(size / 1024).toFixed(0)} KB)`);

if (process.argv.includes("--upload")) {
  if (!key) throw new Error("--upload requires JM_PIPELINE_KEY");
  const r = await fetch(`${base}/api/pipeline/pdf?slug=${encodeURIComponent(slug)}`, { method: "POST", headers: { "x-jm-pipeline-key": key, "content-type": "application/pdf" }, body: readFileSync(out) });
  console.log("[pdf] upload", r.status, await r.text());
  if (!r.ok) process.exit(1);
}
