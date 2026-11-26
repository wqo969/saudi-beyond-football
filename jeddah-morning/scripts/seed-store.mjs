// Seeds an object-store layout (index/, issues/, pdfs/, media/) on disk from content/ —
// used by e2e tests to exercise the production (blob) code path without network.
// Usage: node scripts/seed-store.mjs <dataRoot>
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
if (!root) throw new Error("usage: seed-store.mjs <dataRoot>");
const src = path.join(root, "content");
const out = path.join(root, "storage", "blobfs");
mkdirSync(path.join(out, "issues"), { recursive: true });
mkdirSync(path.join(out, "index"), { recursive: true });
const now = new Date().toISOString();
const slugs = [];
for (const f of readdirSync(path.join(src, "issues")).filter((f) => f.endsWith(".json"))) {
  writeFileSync(path.join(out, "issues", f), readFileSync(path.join(src, "issues", f)));
  slugs.push({ slug: f.replace(/\.json$/, ""), updatedAt: now });
}
writeFileSync(path.join(out, "index", "issues.json"), JSON.stringify({ slugs }));
for (const dir of ["pdfs", "media"]) if (existsSync(path.join(src, dir))) cpSync(path.join(src, dir), path.join(out, dir), { recursive: true });
console.log(`[seed] ${slugs.length} issues → ${out}`);
