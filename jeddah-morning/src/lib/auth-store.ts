import "server-only";
import { createHash } from "node:crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { kv } from "./content/store";
import { verifyPassword, DEMO_PASSWORDS } from "./passwords";
import { roleForPassword, type AuthConfig, type Role } from "./auth";

/**
 * Password + session-version storage.
 * Precedence: hashes saved from /admin/security (kv "auth") → env hashes
 * (JM_READER_PASSWORD_HASH / JM_ADMIN_PASSWORD_HASH) → env plaintext (dev / tests only).
 */
export interface AuthDoc {
  readerHash?: string;
  adminHash?: string;
  sessionVersion: number;
  updatedAt?: string;
}

const isNext = () => !!process.env.NEXT_RUNTIME;

export const readAuthDoc = async (): Promise<AuthDoc> => {
  const load = async () => (await kv.get<AuthDoc>("auth")) ?? { sessionVersion: 1 };
  return isNext() ? unstable_cache(load, ["jm-auth"], { tags: ["auth"], revalidate: false })() : load();
};

export async function writeAuthDoc(doc: AuthDoc) {
  await kv.set("auth", { ...doc, updatedAt: new Date().toISOString() });
  if (isNext()) revalidateTag("auth", { expire: 0 });
}

export async function roleFor(password: string, cfg: AuthConfig): Promise<Role | null> {
  const doc = await readAuthDoc();
  const adminHash = doc.adminHash ?? process.env.JM_ADMIN_PASSWORD_HASH;
  const readerHash = doc.readerHash ?? process.env.JM_READER_PASSWORD_HASH;
  // Each role: its hash when one exists, otherwise the plaintext env value (development and automated tests).
  const plain = await roleForPassword(password, { ...cfg, adminPassword: adminHash ? null : cfg.adminPassword, readerPassword: readerHash ? null : cfg.readerPassword });
  const [a, r] = await Promise.all([verifyPassword(password, adminHash), verifyPassword(password, readerHash)]);
  if (a || plain === "admin") return "admin";
  if (r || plain === "reader") return "reader";
  return null;
}

/** Can anyone log in at all? (hashes from setup/env, or plaintext env, or dev defaults) */
export async function passwordsConfigured(): Promise<boolean> {
  const doc = await readAuthDoc();
  if (doc.adminHash || process.env.JM_ADMIN_PASSWORD_HASH) return true;
  const cfg = (await import("./auth")).getAuthConfig();
  return !!(cfg.adminPassword && cfg.readerPassword);
}

/** True when the deployment is configured with hashes (production) rather than plaintext. */
export const hasHashedPasswords = () => !!(process.env.JM_ADMIN_PASSWORD_HASH || process.env.JM_READER_PASSWORD_HASH);

export function productionAuthProblems(): string[] {
  const p: string[] = [];
  if (process.env.NODE_ENV !== "production" || process.env.JM_ALLOW_DEV_DEFAULTS === "true") return p;
  for (const k of ["JM_READER_PASSWORD", "JM_ADMIN_PASSWORD"] as const) {
    const v = process.env[k];
    if (v && DEMO_PASSWORDS.includes(v)) p.push(`${k} يستخدم كلمة مرور تجريبية`);
  }
  return p;
}

// ---------- brute-force protection ----------
type Attempts = Record<string, { count: number; first: number; lockedUntil?: number }>;
const WINDOW = 15 * 60_000;
const MAX = 8;

/** Never store raw IP addresses. */
export function ipKey(ip: string): string {
  return createHash("sha256").update(`jm|${ip}`).digest("hex").slice(0, 16);
}

export async function lockedUntil(ip: string): Promise<number> {
  const a = (await kv.get<Attempts>("login-attempts")) ?? {};
  const e = a[ipKey(ip)];
  return e?.lockedUntil && e.lockedUntil > Date.now() ? e.lockedUntil : 0;
}

export async function recordFailure(ip: string): Promise<void> {
  const now = Date.now();
  const a = (await kv.get<Attempts>("login-attempts")) ?? {};
  const fresh: Attempts = {};
  for (const [k, v] of Object.entries(a)) if (now - v.first <= WINDOW || (v.lockedUntil ?? 0) > now) fresh[k] = v;
  const k = ipKey(ip);
  const e = fresh[k] ?? { count: 0, first: now };
  e.count++;
  if (e.count >= MAX) e.lockedUntil = now + WINDOW;
  fresh[k] = e;
  await kv.set("login-attempts", fresh);
}

export async function clearFailures(ip: string): Promise<void> {
  const a = (await kv.get<Attempts>("login-attempts")) ?? {};
  const k = ipKey(ip);
  if (!a[k]) return;
  const rest: Attempts = {};
  for (const [key, v] of Object.entries(a)) if (key !== k) rest[key] = v;
  await kv.set("login-attempts", rest);
}
