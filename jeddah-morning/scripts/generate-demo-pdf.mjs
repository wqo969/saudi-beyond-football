// Prints a 4-page DEMO magazine PDF (Arabic, RTL) with Chromium. Output: content/pdfs/demo-2026-11-26-morning.pdf
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { fontFaces } from "./_fonts.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "content", "pdfs");
mkdirSync(outDir, { recursive: true });

const page = (inner, cls = "") => `<section class="pg ${cls}">${inner}<div class="demo">نسخة PDF تجريبية — لا تحتوي على أخبار أو بيانات حقيقية</div></section>`;
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>${fontFaces(root)}
@page{size:A5;margin:0}
*{box-sizing:border-box}body{margin:0;font-family:Naskh;color:#18261e}
.pg{width:148mm;height:210mm;padding:14mm;position:relative;page-break-after:always;background:#f5efe0;overflow:hidden}
.cover{background:linear-gradient(160deg,#2f5541,#12251b);color:#f5efe0;text-align:center}
.mast{font-family:Amiri;font-weight:700;font-size:44pt;border-top:1px solid #c9aa72;border-bottom:1px solid #c9aa72;margin-top:6mm;padding:2mm 0}
.lat{font-family:Playfair;letter-spacing:.3em;color:#c9aa72;font-size:8pt;direction:ltr}
.head{font-family:Amiri;font-weight:700;font-size:28pt;line-height:1.4;position:absolute;bottom:30mm;right:14mm;left:14mm;text-align:right}
h2{font-family:Amiri;font-size:22pt;margin:0 0 4mm;color:#1e3a2c}.k{color:#a8854c;font-size:9pt;font-weight:bold}
p{font-size:11pt;line-height:2}
.demo{position:absolute;bottom:6mm;right:0;left:0;text-align:center;font-size:7.5pt;color:#9a4d1e}
.cover .demo{color:#e09a62}
ol{font-size:12pt;line-height:2.2}
</style></head><body>
${page(`<div class="lat">No. 1</div><div class="mast">صباح جدة</div><div class="lat">JEDDAH MORNING</div><p style="font-size:9pt;margin-top:3mm">الخميس ٢٦ نوفمبر ٢٠٢٦ · العدد الصباحي · THE WEEKEND EDIT</p><div class="head">عطلة على مهل في مدينة البحر</div>`, "cover")}
${page(`<div class="k">الفهرس</div><h2>في هذا العدد</h2><ol><li>نزهة في جدة التاريخية</li><li>قالب طقس جدة</li><li>في مديح البطء</li><li>مشي الفجر على البحر</li><li>لغز اليوم</li></ol>`)}
${page(`<div class="k">التطوير الشخصي · مقال تجريبي</div><h2>في مديح البطء</h2><p>نعيش أسابيع سريعة، ونحتاج إلى نهاية أسبوع بطيئة تعيد إلينا الإيقاع.</p><p>البطء ليس كسلًا؛ إنه انتباه. أن تمشي فتلاحظ، أن تأكل فتتذوق، أن تجلس فتسمع.</p>`)}
${page(`<div class="k">لغز اليوم</div><h2>شيء كلما أخذت منه كبر. ما هو؟</h2><p>الحل: الحفرة — كل ما تزيله من ترابها يزيد حجمها.</p>`)}
</body></html>`;

const browser = await chromium.launch();
const p = await browser.newPage();
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.pdf({ path: path.join(outDir, "demo-2026-11-26-morning.pdf"), format: "A5", printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log("[pdf] demo PDF written to content/pdfs/");
