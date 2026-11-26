import "server-only";
import { cache } from "react";
import { planAll, type IssuePlan } from "../engine/planner";
import { compareIssuesDesc, isVisible } from "../publishing";
import type { Issue } from "../schema";
import { getSession } from "../session";
import { LocalRepository } from "./local";
import type { ContentRepository } from "./repository";
import { SupabaseRepository } from "./supabase";

let repo: ContentRepository | null = null;

export function getRepository(): ContentRepository {
  if (!repo) repo = process.env.JM_CONTENT_BACKEND === "supabase" ? new SupabaseRepository() : new LocalRepository();
  return repo;
}

/** All issues (admin view), newest first. */
export const listAllIssues = cache(async (): Promise<Issue[]> => {
  const all = await getRepository().listIssues();
  return all.sort(compareIssuesDesc);
});

/** Issues visible to readers right now, newest first. */
export const listVisibleIssues = cache(async (): Promise<Issue[]> => {
  const now = new Date();
  return (await listAllIssues()).filter((i) => isVisible(i, now));
});

export const getVisibleIssue = cache(async (slug: string): Promise<Issue | null> => {
  const issue = await getRepository().getIssue(slug);
  return issue && isVisible(issue) ? issue : null;
});

/** Readers get visible issues; admins may preview any issue (drafts, scheduled). */
export const getIssueForViewer = cache(async (slug: string): Promise<{ issue: Issue; preview: boolean } | null> => {
  const issue = await getRepository().getIssue(slug);
  if (!issue) return null;
  if (isVisible(issue)) return { issue, preview: false };
  const session = await getSession();
  return session?.role === "admin" ? { issue, preview: true } : null;
});

/**
 * Design plans for every issue, computed chronologically so each issue is compared with the
 * ones before it. Plans of published issues should be frozen (see design.frozen) so later
 * edits to the archive never change how an already-published issue looks.
 */
export const getAllPlans = cache(async (): Promise<Map<string, IssuePlan>> => planAll(await listAllIssues()));

export async function getPlan(slug: string): Promise<IssuePlan | null> {
  return (await getAllPlans()).get(slug) ?? null;
}

/** Today's pair or the most recent date with any visible issue (archived issues are not featured). */
export async function getFeaturedIssues(todayKey: string): Promise<{ date: string | null; morning: Issue | null; evening: Issue | null; special: Issue | null; isToday: boolean }> {
  const visible = (await listVisibleIssues()).filter((i) => i.status !== "archived");
  const today = visible.filter((i) => i.date === todayKey);
  const date = today.length ? todayKey : (visible[0]?.date ?? null);
  const sameDay = visible.filter((i) => i.date === date);
  return {
    date,
    morning: sameDay.find((i) => i.edition === "morning") ?? null,
    evening: sameDay.find((i) => i.edition === "evening") ?? null,
    special: sameDay.find((i) => i.edition === "special") ?? null,
    isToday: date === todayKey,
  };
}
