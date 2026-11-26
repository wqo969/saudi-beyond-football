import { getRepository, getVisibleIssue } from "@/lib/content";

export const dynamic = "force-dynamic";

/** Serves an issue PDF only to signed-in readers (proxy enforces auth) and only when the issue is visible. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const issue = await getVisibleIssue((await params).slug);
  if (!issue?.pdf) return new Response("Not found", { status: 404 });
  const data = await getRepository().readPdf(issue.pdf.file);
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${issue.slug}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
