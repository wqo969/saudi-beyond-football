import "server-only";
import { timingSafeEqual } from "node:crypto";
import { pipelineKey } from "./server-secrets";

/**
 * Machine access for the daily production pipeline (scheduled Claude Code session / CLI).
 * The key lives only on the server (env JM_PIPELINE_KEY or generated into the private store).
 */
export async function pipelineKeyValid(given: string | null | undefined): Promise<boolean> {
  if (!given) return false;
  const want = await pipelineKey();
  if (!want || want.length < 32) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function pipelineAuthorized(req: Request): Promise<boolean> {
  return pipelineKeyValid(req.headers.get("x-jm-pipeline-key"));
}
