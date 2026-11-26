import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PdfReader } from "@/components/PdfReader";
import { getVisibleIssue } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const issue = await getVisibleIssue((await params).slug);
  return { title: issue ? `PDF: ${issue.title}` : "عدد غير موجود" };
}

export default async function PdfPage({ params }: Props) {
  const issue = await getVisibleIssue((await params).slug);
  if (!issue?.pdf) notFound();
  return <PdfReader src={`/api/pdf/${issue.slug}`} slug={issue.slug} title={issue.title} isDemo={issue.isDemo} />;
}
