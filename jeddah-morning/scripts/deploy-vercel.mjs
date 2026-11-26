// Deploys JEDDAH MORNING to Vercel Hobby (free) with a PRIVATE Blob store.
// No secret value is set by this script except a one-time setup code and the cron secret,
// both random and printed ONLY to the local terminal (never committed). Passwords are chosen
// by the owner at /setup; session/pipeline/push keys are generated on the server.
//
//   VERCEL_TOKEN=… node scripts/deploy-vercel.mjs            (token: vercel.com/account/settings/tokens)
//   In Claude Code cloud sessions the token is injected by the proxy: VERCEL_TOKEN=proxy-injected
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const token = process.env.VERCEL_TOKEN || "proxy-injected";
const PROJECT = process.env.JM_VERCEL_PROJECT || "jeddah-morning";
const api = async (method, p, body) => {
  const r = await fetch(`https://api.vercel.com${p}`, { method, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok && r.status !== 409) throw new Error(`${method} ${p} → ${r.status} ${JSON.stringify(j).slice(0, 400)}`);
  return { status: r.status, ...j };
};
const vercel = (...args) => execFileSync("npx", ["--yes", "vercel@67", ...args, "--token", token], { cwd: root, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });

const user = (await api("GET", "/v2/user")).user;
console.log("✓ Vercel account:", user.username, "· plan must stay Hobby (free)");

// 1. project (Next.js, this folder is the root)
let project = await api("GET", `/v9/projects/${PROJECT}`).catch(() => null);
if (!project?.id) project = await api("POST", "/v11/projects", { name: PROJECT, framework: "nextjs" });
console.log("✓ project", project.name ?? PROJECT, project.id);

// 2. private Blob store connected to the project (BLOB_READ_WRITE_TOKEN is injected by Vercel, never seen here)
const stores = await api("GET", "/v1/storage/stores");
let store = (stores.stores ?? []).find((s) => s.name === `${PROJECT}-private`);
if (!store) store = (await api("POST", "/v1/storage/stores/blob", { name: `${PROJECT}-private`, access: "private" })).store;
console.log("✓ private blob store", store?.id);
await api("POST", `/v1/storage/stores/${store.id}/connections`, { projectId: project.id, envVarEnvironments: ["production", "preview"] }).catch((e) => console.log("  (connection)", e.message));

// 3. non-secret configuration + one-time setup code + cron secret
const setupCode = randomBytes(9).toString("base64url");
const env = { JM_CONTENT_BACKEND: "blob", JM_SETUP_CODE: setupCode, CRON_SECRET: randomBytes(24).toString("hex") };
const existing = (await api("GET", `/v10/projects/${project.id}/env`)).envs ?? [];
for (const [key, value] of Object.entries(env)) {
  if (existing.some((e) => e.key === key)) continue;
  await api("POST", `/v10/projects/${project.id}/env`, { key, value, type: key === "JM_CONTENT_BACKEND" ? "plain" : "sensitive", target: ["production", "preview"] });
}
console.log("✓ environment configured");

// 4. deploy (remote build on Vercel)
vercel("link", "--yes", "--project", PROJECT);
const url = vercel("deploy", "--prod", "--yes").trim().split("\n").pop();
console.log("✓ deployed:", url);
console.log(`\nNEXT: open ${url}/setup and enter the setup code below to choose your own passwords.`);
console.log(`ONE-TIME SETUP CODE (local terminal only, useless after setup): ${setupCode}`);
