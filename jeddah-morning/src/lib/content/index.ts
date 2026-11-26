import "server-only";
import { cache } from "react";
import { compareIssuesDesc, isVisible } from "../publishing";
import type { Issue } from "../schema";
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

/** Today's pair (morning/evening) or the most recent date that has any visible issue. */
export async function getFeaturedIssues(todayKey: string): Promise<{ date: string | null; morning: Issue | null; evening: Issue | null; isToday: boolean }> {
  const visible = await listVisibleIssues();
  const today = visible.filter((i) => i.date === todayKey);
  const date = today.length ? todayKey : (visible[0]?.date ?? null);
  const sameDay = visible.filter((i) => i.date === date);
  return {
    date,
    morning: sameDay.find((i) => i.edition === "morning") ?? null,
    evening: sameDay.find((i) => i.edition === "evening") ?? null,
    isToday: date === todayKey,
  };
}
