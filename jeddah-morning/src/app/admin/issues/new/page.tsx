import { IssueEditor } from "@/components/admin/IssueEditor";
import { listAllIssues } from "@/lib/content";
import { riyadhDateKey } from "@/lib/dates";

export const metadata = { title: "عدد جديد" };

export default async function NewIssuePage() {
  const all = await listAllIssues();
  const nextNumber = all.reduce((m, i) => Math.max(m, i.number), 0) + 1;
  return <IssueEditor issue={null} defaults={{ date: riyadhDateKey(), number: nextNumber }} />;
}
