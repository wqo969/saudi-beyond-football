import type { Issue, IssueStatus } from "./schema";

type Pub = { status: IssueStatus; publishAt?: string };

/** Visible to readers at `now`? Scheduled issues auto-publish once publishAt passes; archived stay readable. */
export function isVisible(issue: Pub, now: Date = new Date()): boolean {
  if (issue.status === "published" || issue.status === "archived") return true;
  if (issue.status === "scheduled" && issue.publishAt) return new Date(issue.publishAt).getTime() <= now.getTime();
  return false;
}

export type EffectiveStatus = IssueStatus | "auto-published";

export function effectiveStatus(issue: Pub, now: Date = new Date()): EffectiveStatus {
  if (issue.status === "scheduled" && isVisible(issue, now)) return "auto-published";
  return issue.status;
}

/** Workflow: Draft → Editorial Review → Fact Check → Design Review → Approved → Scheduled → Published → Archived. */
export const WORKFLOW: IssueStatus[] = ["draft", "editorial-review", "fact-check", "design-review", "approved", "scheduled", "published", "archived"];

export function nextStatus(s: IssueStatus): IssueStatus | null {
  const i = WORKFLOW.indexOf(s);
  return i >= 0 && i < WORKFLOW.length - 1 ? WORKFLOW[i + 1] : null;
}

const EDITION_RANK: Record<Issue["edition"], number> = { morning: 0, special: 1, evening: 2 };

/** Newest first: by date, then evening after special after morning. */
export function compareIssuesDesc(a: Pick<Issue, "date" | "edition">, b: Pick<Issue, "date" | "edition">): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return EDITION_RANK[b.edition] - EDITION_RANK[a.edition];
}

export const compareIssuesAsc = (a: Pick<Issue, "date" | "edition">, b: Pick<Issue, "date" | "edition">) => -compareIssuesDesc(a, b);

/** Target publication times (Asia/Riyadh, UTC+3, no DST). */
export const TARGET_TIMES = { morning: "07:30", evening: "22:30", special: "09:00" } as const;

export function targetPublishAt(date: string, edition: Issue["edition"]): string {
  return `${date}T${TARGET_TIMES[edition]}:00+03:00`;
}
