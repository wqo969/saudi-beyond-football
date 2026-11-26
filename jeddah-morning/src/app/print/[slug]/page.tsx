import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { MagazinePage } from "@/components/magazine/MagazinePage";
import { getPlan, getRepository } from "@/lib/content";
import { pipelineKeyValid } from "@/lib/pipeline-auth";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "نسخة الطباعة", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Print edition: every planned page of the issue, one after another, styled for A5 PDF output.
 * Same single source as the interactive magazine. Admins (session) or the pipeline (key) only.
 */
export default async function PrintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getSession();
  const h = await headers();
  if (session?.role !== "admin" && !pipelineKeyValid(h.get("x-jm-pipeline-key"))) notFound();
  const issue = await getRepository().getIssue(slug);
  const plan = await getPlan(slug);
  if (!issue || !plan) notFound();
  return (
    <div className={`jm-p-${plan.palette.id} print-root`} data-print-ready>
      {plan.pages.map((p, i) => (
        <section key={i} className={`print-page ${p.kind === "cover" || p.kind === "closing" || (p.layout === "spread" && p.part === 0) ? "print-full" : ""}`}>
          <MagazinePage issue={issue} plan={plan} page={p} pageNo={i} />
        </section>
      ))}
    </div>
  );
}
