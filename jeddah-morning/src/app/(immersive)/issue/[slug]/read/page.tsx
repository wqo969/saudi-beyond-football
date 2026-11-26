import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FlipReader } from "@/components/FlipReader";
import { getVisibleIssue } from "@/lib/content";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ p?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const issue = await getVisibleIssue((await params).slug);
  return { title: issue ? `قراءة: ${issue.title}` : "عدد غير موجود" };
}

export default async function ReaderPage({ params, searchParams }: Props) {
  const [{ slug }, { p }] = await Promise.all([params, searchParams]);
  const issue = await getVisibleIssue(slug);
  if (!issue) notFound();
  const page = p != null && /^\d+$/.test(p) ? Number(p) : null;
  return <FlipReader issue={issue} initialPage={page} />;
}
