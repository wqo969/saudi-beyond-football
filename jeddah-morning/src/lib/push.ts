import "server-only";
import { sendNotification, setVapidDetails } from "web-push";
import { vapidKeys } from "./server-secrets";
import { kv } from "./content/store";
import { logOp } from "./ops-log";

export interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

export async function pushConfigured(): Promise<boolean> {
  return !!(await vapidKeys());
}

async function setup() {
  const k = (await vapidKeys())!;
  setVapidDetails(process.env.JM_VAPID_SUBJECT || "https://jeddah-morning.invalid", k.publicKey, k.privateKey);
}

export const readSubs = async () => (await kv.get<StoredSubscription[]>("push-subscriptions")) ?? [];

export async function addSub(s: Omit<StoredSubscription, "createdAt">) {
  const list = (await readSubs()).filter((x) => x.endpoint !== s.endpoint);
  await kv.set("push-subscriptions", [...list, { ...s, createdAt: new Date().toISOString() }].slice(-20));
}

export async function removeSub(endpoint: string) {
  await kv.set("push-subscriptions", (await readSubs()).filter((x) => x.endpoint !== endpoint));
}

/** Sends to every subscribed device; expired subscriptions are pruned. */
export async function sendToAll(payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!(await pushConfigured())) return { sent: 0, failed: 0 };
  await setup();
  const subs = await readSubs();
  let sent = 0;
  let failed = 0;
  const dead: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await sendNotification(s, JSON.stringify(payload), { TTL: 6 * 3600, urgency: "normal" });
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    }),
  );
  if (dead.length) await kv.set("push-subscriptions", subs.filter((s) => !dead.includes(s.endpoint)));
  return { sent, failed };
}

/** Notify about an issue at most once (dedupe). Returns false when already notified. */
export async function notifyIssueOnce(slug: string, payload: PushPayload): Promise<{ notified: boolean; sent: number; failed: number }> {
  const done = (await kv.get<Record<string, string>>("notified")) ?? {};
  if (done[slug]) return { notified: false, sent: 0, failed: 0 };
  const r = await sendToAll(payload);
  // Mark as notified only when at least one device received it (or nobody is subscribed), so failures are retried by the next cron.
  if (r.failed === 0 || r.sent > 0) {
    done[slug] = new Date().toISOString();
    await kv.set("notified", done);
  }
  await logOp("notify", `إشعار ${payload.title}: ${r.sent} نجح، ${r.failed} فشل`, r.failed && !r.sent ? "failure" : "success", slug);
  return { notified: true, ...r };
}

export interface AutomationSettings {
  enabled: boolean;
  updatedAt?: string;
}
export const readAutomation = async () => (await kv.get<AutomationSettings>("automation")) ?? { enabled: true };
export const writeAutomation = (a: AutomationSettings) => kv.set("automation", { ...a, updatedAt: new Date().toISOString() });
