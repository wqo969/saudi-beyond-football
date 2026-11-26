import type { Issue } from "./schema";

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function pushStatus(): { enabled: boolean; reason?: string; publicKey?: string } {
  const publicKey = process.env.NEXT_PUBLIC_JM_VAPID_PUBLIC_KEY;
  if (!publicKey || !process.env.JM_VAPID_PRIVATE_KEY) return { enabled: false, reason: "missing-vapid-keys" };
  return { enabled: true, publicKey };
}

export function isValidSubscription(x: unknown): x is PushSubscriptionRecord {
  const s = x as PushSubscriptionRecord;
  return !!s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://") && s.endpoint.length < 1000 && typeof s.keys?.p256dh === "string" && typeof s.keys?.auth === "string";
}

export function issuePushPayload(issue: Issue) {
  const title = issue.edition === "evening" ? "صدر عدد جدة بعد الغروب" : issue.edition === "special" ? "صدر عدد خاص من صباح جدة" : "صباح جدة: عدد اليوم صدر";
  return { title, body: issue.coverHeadline + (issue.surprise ? " · فيه مفاجأة ✦" : ""), url: `/issue/${issue.slug}`, tag: issue.slug };
}
