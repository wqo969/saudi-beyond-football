// Daily production pipeline: validate → upload media → save draft → PDF → (schedule|publish) → notify.
//
//   node scripts/publish-issue.mjs --base https://<app>.vercel.app --file issue.json [--media dir] [--publish] [--notify]
//
// Authentication: header x-jm-pipeline-key. In Claude Code cloud sessions the key is stored as a
// network secret for the app host and injected by the proxy (JM_PIPELINE_KEY may then be a placeholder).
// Locally: JM_PIPELINE_KEY=<key from /admin/security>.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);
const base = arg("base");
const file = arg("file");
const mediaDir = arg("media");
const key = process.env.JM_PIPELINE_KEY || "proxy-injected";
if (!base || !file) throw new Error("usage: --base URL --file issue.json [--media dir] [--publish] [--notify]");

const headers = { "x-jm-pipeline-key": key };
const step = (s) => console.log(`\n▶ ${s}`);
async function call(method, p, body, contentType = "application/json") {
  const r = await fetch(`${base}${p}`, { method, headers: { ...headers, ...(body ? { "content-type": contentType } : {}) }, body });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${p} → ${r.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : {};
}

step("1/6 pre-publication check (schema, sources, 13 sections, 16–24 pages)");
execFileSync("npx", ["vitest", "run", "tests/unit/issue-file.test.ts"], { cwd: root, stdio: "inherit", env: { ...process.env, ISSUE_FILE: path.resolve(file) } });
const issue = JSON.parse(readFileSync(file, "utf8"));

step("2/6 anti-repetition against the last 90 days (memory keys)");
const mem = await call("GET", "/api/pipeline/memory");
const norm = (s) => s.normalize("NFKD").replace(/[ً-ٟ]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه").toLowerCase().trim();
const seen = new Set(mem.memory.filter((m) => m.issueSlug !== issue.slug).map((m) => `${m.kind}|${norm(m.key)}`));
const repeats = issue.articles.flatMap((a) => (a.followUp ? [] : (a.memory ?? []).filter((m) => seen.has(`${m.kind}|${norm(m.key)}`)).map((m) => `${a.id}: ${m.kind} «${m.key}»`)));
if (repeats.length) {
  console.error("✗ repeated recommendations:\n  " + repeats.join("\n  "));
  if (!flag("allow-repeats")) process.exit(2);
}
console.log("✓ no repeats");

step("3/6 media");
const used = new Set(issue.articles.flatMap((a) => a.body.filter((b) => b.type === "image").map((b) => b.src.split("/").pop())));
if (used.size) {
  if (!mediaDir) throw new Error("issue uses images: pass --media <dir>");
  for (const f of readdirSync(mediaDir).filter((f) => used.has(f))) {
    const r = await call("POST", `/api/pipeline/media?name=${encodeURIComponent(f)}`, readFileSync(path.join(mediaDir, f)), "application/octet-stream");
    console.log("  ↑", f, r.src);
  }
  for (const f of used) if (!existsSync(path.join(mediaDir, f))) throw new Error(`missing media file ${f}`);
}

step("4/6 save issue (draft/scheduled as in file)");
console.log(await call("POST", "/api/pipeline/issue", JSON.stringify(issue)));

step("5/6 PDF edition");
execFileSync("node", [path.join(root, "scripts", "make-pdf.mjs"), "--base", base, "--slug", issue.slug, "--out", path.join(path.dirname(path.resolve(file)), `${issue.slug}.pdf`), "--upload"], { cwd: root, stdio: "inherit", env: { ...process.env, JM_PIPELINE_KEY: key } });

step("6/6 publish & notify");
if (flag("publish")) console.log("publish:", await call("POST", `/api/pipeline/publish?slug=${issue.slug}`));
else console.log(`scheduled for ${issue.publishAt ?? "(no time)"} — becomes visible automatically`);
if (flag("notify")) console.log("notify:", await call("POST", `/api/pipeline/notify?slug=${issue.slug}`));
console.log("\n✓ done:", `${base}/issue/${issue.slug}`);
