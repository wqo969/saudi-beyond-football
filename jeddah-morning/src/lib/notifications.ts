import type { Issue } from "./schema";

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function pushStatus(): Promise<{ enabled: boolean; reason?: string; publicKey?: string }> {
  const { vapidKeys } = await import("./server-secrets");
  const k = await vapidKeys();
  return k ? { enabled: true, publicKey: k.publicKey } : { enabled: false, reason: "disabled" };
}

export function isValidSubscription(x: unknown): x is PushSubscriptionRecord {
  const s = x as PushSubscriptionRecord;
  return !!s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://") && s.endpoint.length < 1000 && typeof s.keys?.p256dh === "string" && typeof s.keys?.auth === "string";
}

export function issuePushPayload(issue: Issue) {
  const title = issue.edition === "evening" ? "صدر عدد جدة بعد الغروب" : issue.edition === "special" ? "صدر عدد خاص من صباح جدة" : "صباح جدة: عدد اليوم صدر";
  return { title, body: issue.coverHeadline + (issue.surprise ? " · فيه مفاجأة ✦" : ""), url: `/issue/${issue.slug}`, tag: issue.slug };
}
