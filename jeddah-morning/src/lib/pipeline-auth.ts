import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Machine access for the daily production pipeline (scheduled Claude Code session / CLI).
 * The key lives only in the hosting environment (JM_PIPELINE_KEY) — never in the repository.
 */
export function pipelineKeyValid(given: string | null | undefined): boolean {
  const want = process.env.JM_PIPELINE_KEY;
  if (!want || want.length < 32 || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function pipelineAuthorized(req: Request): boolean {
  return pipelineKeyValid(req.headers.get("x-jm-pipeline-key"));
}
