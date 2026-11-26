import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAuthConfig, SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getRepository } from "@/lib/content";
import { ReadOnlyError } from "@/lib/content/repository";
import { IssueSchema, SLUG_RE } from "@/lib/schema";

const MAX_BYTES = 25 * 1024 * 1024;

/** Upload a PDF and attach it to an existing issue, or create a PDF-only draft issue. */
export async function POST(req: Request) {
  // Defense in depth (proxy also checks).
  const cookie = req.headers.get("cookie")?.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`))?.[1];
  const session = await verifySession(cookie, getAuthConfig().secret);
  if (session?.role !== "admin") return NextResponse.json({ ok: false, errors: ["غير مصرح"] }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  const slug = String(form.get("slug") ?? "");
  const title = String(form.get("title") ?? "").trim();
  const number = Number(form.get("number") ?? 0);

  if (!(file instanceof File)) return NextResponse.json({ ok: false, errors: ["لم يُرفق ملف"] }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, errors: ["حجم الملف يتجاوز 25 م.ب"] }, { status: 413 });
  if (!SLUG_RE.test(slug)) return NextResponse.json({ ok: false, errors: ["معرّف العدد غير صالح"] }, { status: 400 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Verify PDF magic bytes instead of trusting the browser-provided MIME type.
  if (!(bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) {
    return NextResponse.json({ ok: false, errors: ["الملف ليس PDF صالحًا"] }, { status: 400 });
  }

  const repo = getRepository();
  const pdfName = `${slug}.pdf`;
  try {
    await repo.savePdf(pdfName, bytes);
    const existing = await repo.getIssue(slug);
    const [date, edition] = [slug.slice(0, 10), slug.slice(11).split("-")[0]];
    const issue = existing
      ? { ...existing, pdf: { file: pdfName } }
      : { slug, date, edition, number: number > 0 ? number : 1, title: title || `عدد ${date}`, coverHeadline: title || "نسخة PDF", status: "draft", pdf: { file: pdfName }, articles: [] };
    const parsed = IssueSchema.safeParse(issue);
    if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.issues.map((i) => i.message) }, { status: 400 });
    await repo.saveIssue(parsed.data);
  } catch (e) {
    return NextResponse.json({ ok: false, errors: [e instanceof ReadOnlyError ? e.message : "تعذّر حفظ الملف"] }, { status: 500 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, slug });
}
