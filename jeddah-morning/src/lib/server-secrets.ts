import "server-only";
import { randomBytes } from "node:crypto";
import { kv } from "./content/store";

/**
 * Server-side secrets generated on the server itself and kept in the private store,
 * so no secret value ever needs to pass through a person, a chat or the repository.
 * Environment variables, when present, take precedence (JM_SESSION_SECRET, JM_PIPELINE_KEY,
 * NEXT_PUBLIC_JM_VAPID_PUBLIC_KEY / JM_VAPID_PRIVATE_KEY).
 */
export interface ServerSecrets {
  sessionSecret: string;
  pipelineKey: string;
  vapidPublic?: string;
  vapidPrivate?: string;
  createdAt: string;
}

let cache: { v: ServerSecrets; at: number } | null = null;

export async function getServerSecrets(): Promise<ServerSecrets> {
  if (cache && Date.now() - cache.at < 60_000) return cache.v;
  let s = await kv.get<ServerSecrets>("secrets");
  if (!s) {
    s = { sessionSecret: randomBytes(48).toString("base64url"), pipelineKey: randomBytes(32).toString("hex"), createdAt: new Date().toISOString() };
    await kv.set("secrets", s);
  }
  if (!s.vapidPublic || !s.vapidPrivate) {
    const { generateVAPIDKeys } = await import("web-push");
    const k = generateVAPIDKeys();
    s = { ...s, vapidPublic: k.publicKey, vapidPrivate: k.privateKey };
    await kv.set("secrets", s);
  }
  cache = { v: s, at: Date.now() };
  return s;
}

export async function sessionSecret(): Promise<string> {
  const env = process.env.JM_SESSION_SECRET?.trim();
  if (env && env.length >= 32) return env;
  // Local development without configuration keeps the documented dev default.
  const { getAuthConfig } = await import("./auth");
  const cfg = getAuthConfig();
  if (cfg.usingDevDefaults && cfg.secret) return cfg.secret;
  return (await getServerSecrets()).sessionSecret;
}

export async function pipelineKey(): Promise<string> {
  const env = process.env.JM_PIPELINE_KEY?.trim();
  if (env && env.length >= 32) return env;
  return (await getServerSecrets()).pipelineKey;
}

export async function vapidKeys(): Promise<{ publicKey: string; privateKey: string } | null> {
  if (process.env.NEXT_PUBLIC_JM_VAPID_PUBLIC_KEY && process.env.JM_VAPID_PRIVATE_KEY) return { publicKey: process.env.NEXT_PUBLIC_JM_VAPID_PUBLIC_KEY, privateKey: process.env.JM_VAPID_PRIVATE_KEY };
  if (process.env.JM_PUSH_ENABLED === "false") return null;
  const s = await getServerSecrets();
  return s.vapidPublic && s.vapidPrivate ? { publicKey: s.vapidPublic, privateKey: s.vapidPrivate } : null;
}
