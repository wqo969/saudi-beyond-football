import { notFound } from "next/navigation";
import { IssueEditor } from "@/components/admin/IssueEditor";
import { getRepository } from "@/lib/content";

export const metadata = { title: "تحرير عدد" };

export default async function EditIssuePage({ params }: { params: Promise<{ slug: string }> }) {
  const issue = await getRepository().getIssue((await params).slug);
  if (!issue) notFound();
  return <IssueEditor key={issue.updatedAt ?? issue.slug} issue={issue} defaults={{ date: issue.date, number: issue.number }} />;
}
