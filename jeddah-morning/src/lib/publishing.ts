import type { Issue } from "./schema";

/** Is the issue visible to readers at `now`? Scheduled issues auto-publish once publishAt passes. */
export function isVisible(issue: Pick<Issue, "status" | "publishAt">, now: Date = new Date()): boolean {
  if (issue.status === "published") return true;
  if (issue.status === "scheduled" && issue.publishAt) return new Date(issue.publishAt).getTime() <= now.getTime();
  return false;
}

export type EffectiveStatus = "draft" | "scheduled" | "published" | "auto-published";

export function effectiveStatus(issue: Pick<Issue, "status" | "publishAt">, now: Date = new Date()): EffectiveStatus {
  if (issue.status === "scheduled" && isVisible(issue, now)) return "auto-published";
  return issue.status;
}

/** Newest first: by date, then evening after morning. */
export function compareIssuesDesc(a: Pick<Issue, "date" | "edition">, b: Pick<Issue, "date" | "edition">): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const rank = (e: string) => (e === "evening" ? 1 : 0);
  return rank(b.edition) - rank(a.edition);
}
