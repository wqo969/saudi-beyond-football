import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MagazinePage } from "@/components/magazine/MagazinePage";
import { PreviewBanner } from "@/components/PreviewBanner";
import { loadIssueView } from "@/lib/content/view";

export const metadata: Metadata = { title: "مفاجأة العدد" };

export default async function SurprisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { issue, plan, preview } = await loadIssueView((await params).slug);
  const i = plan.pages.findIndex((p) => p.kind === "surprise");
  if (i < 0) notFound();
  return (
    <>
      {preview && <PreviewBanner issue={issue} />}
      <div className={`jm-p-${plan.palette.id} mx-auto max-w-3xl md:my-4`}>
        <MagazinePage issue={issue} plan={plan} page={plan.pages[i]} pageNo={i} />
      </div>
    </>
  );
}
