import { notFound } from "next/navigation";
import { DesignReport } from "@/components/admin/DesignReport";
import { IssueEditor } from "@/components/admin/IssueEditor";
import { getAllPlans, getRepository, listAllIssues } from "@/lib/content";
import { findDuplicates } from "@/lib/engine/memory";
import { noveltyReport, type Fingerprint } from "@/lib/engine/planner";
import { compareIssuesAsc } from "@/lib/publishing";

export const metadata = { title: "تحرير عدد" };

export default async function EditIssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const issue = await getRepository().getIssue(slug);
  if (!issue) notFound();
  const [all, plans] = await Promise.all([listAllIssues(), getAllPlans()]);
  const earlier = all.filter((i) => compareIssuesAsc(i, issue) < 0).sort((a, b) => -compareIssuesAsc(a, b));
  const history: Fingerprint[] = earlier.map((i) => plans.get(i.slug)!.fingerprint);
  const plan = plans.get(slug)!;
  return (
    <>
      <DesignReport slug={slug} plan={plan} novelty={noveltyReport(plan.fingerprint, history)} duplicates={findDuplicates(issue, all)} />
      <IssueEditor key={issue.updatedAt ?? issue.slug} issue={issue} defaults={{ date: issue.date, number: issue.number }} />
    </>
  );
}
