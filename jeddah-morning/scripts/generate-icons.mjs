// Renders the PWA / Apple touch icons from an HTML design using the pre-installed Playwright Chromium.
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { fontFaces } from "./_fonts.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "icons");
mkdirSync(out, { recursive: true });

const html = (size, maskable) => `<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces(root)}
html,body{margin:0;width:${size}px;height:${size}px}
.i{width:100%;height:100%;background:radial-gradient(circle at 72% 22%,#2f5541 0,#1e3a2c 45%,#12251b 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden}
.sun{position:absolute;width:${size * 0.16}px;height:${size * 0.16}px;border-radius:50%;background:#c9aa72;top:${size * (maskable ? 0.2 : 0.13)}px;right:${size * (maskable ? 0.24 : 0.17)}px;opacity:.9}
.t{font-family:Amiri;font-weight:700;color:#f5efe0;font-size:${size * (maskable ? 0.27 : 0.34)}px;line-height:1;margin-top:${size * 0.04}px}
.r{width:${size * (maskable ? 0.42 : 0.56)}px;border-top:${Math.max(1, size / 128)}px solid #c9aa72;margin-top:${size * 0.06}px}
.l{font-family:Playfair;color:#c9aa72;letter-spacing:.25em;font-size:${size * (maskable ? 0.045 : 0.06)}px;margin-top:${size * 0.04}px}
</style></head><body><div class="i"><div class="sun"></div><div class="t" dir="rtl">صباح</div><div class="r"></div><div class="l">JEDDAH</div></div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size, maskable] of [["icon-192.png", 192, false], ["icon-512.png", 512, false], ["icon-maskable-512.png", 512, true], ["apple-touch-icon.png", 180, false]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html(size, maskable));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, name), omitBackground: false });
}
// Horizontal wordmark (light + dark) for documents and the PDF masthead.
mkdirSync(path.join(root, "public", "brand"), { recursive: true });
for (const [name, bg, fg] of [["wordmark-light.png", "#f5efe0", "#1e3a2c"], ["wordmark-dark.png", "#12251b", "#f5efe0"]]) {
  await page.setViewportSize({ width: 1200, height: 360 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontFaces(root)}html,body{margin:0}
  .w{width:1200px;height:360px;background:${bg};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${fg}}
  .a{font-family:Amiri;font-weight:700;font-size:140px;line-height:1;margin-top:-30px}.r{width:620px;border-top:3px solid #c9aa72;margin:64px 0 18px}
  .l{font-family:Playfair;letter-spacing:.42em;color:#a8854c;font-size:30px}.t{font-family:Playfair;font-style:italic;font-size:20px;margin-top:14px;opacity:.75}</style></head>
  <body><div class="w"><div class="a" dir="rtl">صباح جدة</div><div class="r"></div><div class="l">JEDDAH MORNING</div><div class="t">Your world. Your morning. Your magazine.</div></div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(root, "public", "brand", name) });
}
await browser.close();
console.log("[icons] generated in public/icons/ and public/brand/");
