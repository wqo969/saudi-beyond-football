/**
 * Notification scaffolding (not active). Activation plan (free):
 *  1. Generate VAPID keys locally (e.g. `npx web-push generate-vapid-keys`) — no third-party account needed.
 *  2. Set JM_PUSH_ENABLED=true, NEXT_PUBLIC_JM_VAPID_PUBLIC_KEY, JM_VAPID_PRIVATE_KEY.
 *  3. Store subscriptions in Supabase `push_subscriptions` (see migrations).
 *  4. Send from /api/cron/publish when an issue becomes visible.
 * iOS supports Web Push only for PWAs added to the Home Screen (iOS 16.4+).
 */
export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}

export function pushStatus(): { enabled: boolean; reason?: string } {
  if (process.env.JM_PUSH_ENABLED !== "true") return { enabled: false, reason: "disabled-by-config" };
  if (!process.env.NEXT_PUBLIC_JM_VAPID_PUBLIC_KEY || !process.env.JM_VAPID_PRIVATE_KEY) return { enabled: false, reason: "missing-vapid-keys" };
  return { enabled: true };
}

export function isValidSubscription(x: unknown): x is Omit<PushSubscriptionRecord, "createdAt"> {
  const s = x as PushSubscriptionRecord;
  return !!s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://") && typeof s.keys?.p256dh === "string" && typeof s.keys?.auth === "string";
}
