// Copies pdf.js runtime assets (worker, cmaps, standard fonts, wasm) into public/pdfjs/ so the
// PDF reader works offline and same-origin. Runs automatically before dev/build.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "pdfjs-dist");
const dest = path.join(root, "public", "pdfjs");
if (!existsSync(src)) {
  console.error("[pdfjs] pdfjs-dist not installed");
  process.exit(1);
}
mkdirSync(dest, { recursive: true });
cpSync(path.join(src, "build", "pdf.worker.min.mjs"), path.join(dest, "pdf.worker.min.mjs"));
for (const dir of ["cmaps", "standard_fonts", "wasm"]) cpSync(path.join(src, dir), path.join(dest, dir), { recursive: true });
console.log("[pdfjs] assets copied to public/pdfjs/");
