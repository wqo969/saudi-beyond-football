import "server-only";
import { kv } from "./content/store";

/** Operations & error log (P4/P8): publication attempts, notifications, security events. Never stores secrets or personal data. */
export interface OpEntry {
  at: string;
  area: "publish" | "notify" | "cron" | "security" | "import" | "pdf" | "backup" | "content";
  message: string;
  outcome: "success" | "failure" | "skipped";
  ref?: string;
}

const KEY = () => `ops-${new Date().toISOString().slice(0, 7)}`;

export async function logOp(area: OpEntry["area"], message: string, outcome: OpEntry["outcome"], ref?: string): Promise<void> {
  try {
    const list = (await kv.get<OpEntry[]>(KEY())) ?? [];
    list.unshift({ at: new Date().toISOString(), area, message: message.slice(0, 300), outcome, ...(ref ? { ref } : {}) });
    await kv.set(KEY(), list.slice(0, 500));
  } catch (e) {
    console.error("[ops-log] failed", (e as Error).message);
  }
}

export async function readOps(month = new Date().toISOString().slice(0, 7)): Promise<OpEntry[]> {
  return (await kv.get<OpEntry[]>(`ops-${month}`)) ?? [];
}
