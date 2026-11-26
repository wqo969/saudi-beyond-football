import type { Metadata } from "next";
import { FlipReader } from "@/components/FlipReader";
import { getIssueForViewer } from "@/lib/content";
import { loadIssueView } from "@/lib/content/view";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ p?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = await getIssueForViewer((await params).slug);
  return { title: v ? `قراءة: ${v.issue.title}` : "عدد غير موجود" };
}

export default async function ReaderPage({ params, searchParams }: Props) {
  const [{ slug }, { p }] = await Promise.all([params, searchParams]);
  const { issue, plan, preview } = await loadIssueView(slug);
  const page = p != null && /^\d+$/.test(p) ? Number(p) : null;
  return <FlipReader issue={issue} plan={plan} initialPage={page} preview={preview} />;
}
