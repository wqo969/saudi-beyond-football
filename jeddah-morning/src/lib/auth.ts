/**
 * Minimal signed-session auth (phase 1). Web Crypto only, so it runs in proxy, route handlers and server actions.
 * Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, secret))
 */
export type Role = "reader" | "admin";
export interface Session {
  role: Role;
  /** expiry, epoch seconds */
  exp: number;
}

export const SESSION_COOKIE = "jm_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const DEV_DEFAULTS = {
  JM_READER_PASSWORD: "demo-reader",
  JM_ADMIN_PASSWORD: "demo-admin",
  JM_SESSION_SECRET: "dev-only-insecure-secret-change-me-0123456789",
} as const;

const isProd = () => process.env.NODE_ENV === "production" && process.env.JM_ALLOW_DEV_DEFAULTS !== "true";

export interface AuthConfig {
  readerPassword: string | null;
  adminPassword: string | null;
  secret: string | null;
  usingDevDefaults: boolean;
}

export function getAuthConfig(): AuthConfig {
  const env = (k: keyof typeof DEV_DEFAULTS) => process.env[k]?.trim() || null;
  const reader = env("JM_READER_PASSWORD");
  const admin = env("JM_ADMIN_PASSWORD");
  const secret = env("JM_SESSION_SECRET");
  const missing = !reader || !admin || !secret;
  if (missing && !isProd()) {
    return {
      readerPassword: reader ?? DEV_DEFAULTS.JM_READER_PASSWORD,
      adminPassword: admin ?? DEV_DEFAULTS.JM_ADMIN_PASSWORD,
      secret: secret ?? DEV_DEFAULTS.JM_SESSION_SECRET,
      usingDevDefaults: true,
    };
  }
  // In production a too-short secret is treated as missing.
  return { readerPassword: reader, adminPassword: admin, secret: secret && secret.length >= 32 ? secret : null, usingDevDefaults: false };
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(session: Session, secret: string): Promise<string> {
  const payload = b64url(enc.encode(JSON.stringify(session)));
  const sig = b64url(await hmac(secret, payload));
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined | null, secret: string | null, nowSec = Math.floor(Date.now() / 1000)): Promise<Session | null> {
  if (!token || !secret) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  try {
    const expected = await hmac(secret, payload);
    if (!timingSafeEqual(expected, fromB64url(sig))) return null;
    const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Partial<Session>;
    if ((data.role !== "reader" && data.role !== "admin") || typeof data.exp !== "number") return null;
    if (data.exp <= nowSec) return null;
    return { role: data.role, exp: data.exp };
  } catch {
    return null;
  }
}

/** Compare a password in constant time (hash both sides first so lengths match). */
export async function passwordMatches(input: string, expected: string | null): Promise<boolean> {
  if (!expected) return false;
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(input)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  return timingSafeEqual(new Uint8Array(a), new Uint8Array(b));
}

/** Resolve which role a password grants (admin wins if both match). */
export async function roleForPassword(input: string, cfg: AuthConfig): Promise<Role | null> {
  const [isAdmin, isReader] = await Promise.all([passwordMatches(input, cfg.adminPassword), passwordMatches(input, cfg.readerPassword)]);
  if (isAdmin) return "admin";
  if (isReader) return "reader";
  return null;
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  if (next.startsWith("/login")) return "/";
  return next;
}
