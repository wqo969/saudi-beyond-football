import "server-only";
import { notFound } from "next/navigation";
import { getIssueForViewer, getPlan } from ".";

/** Issue + its design plan for the current viewer (404 for readers when not visible). */
export async function loadIssueView(slug: string) {
  const v = await getIssueForViewer(slug);
  if (!v) notFound();
  const plan = await getPlan(slug);
  if (!plan) notFound();
  return { ...v, plan };
}
