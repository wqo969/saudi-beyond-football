import { NextResponse } from "next/server";
import { getRepository } from "@/lib/content";
import { logOp } from "@/lib/ops-log";
import { getSession } from "@/lib/session";

const MAGIC: [string, number[]][] = [["jpg", [0xff, 0xd8, 0xff]], ["png", [0x89, 0x50, 0x4e, 0x47]], ["webp", [0x52, 0x49, 0x46, 0x46]]];
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Upload an editorial image (≤ 3MB). Rights are recorded where the image is used. */
export async function POST(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return NextResponse.json({ ok: false, errors: ["غير مصرح"] }, { status: 403 });
  const form = await req.formData();
  const file = form.get("file");
  const base = String(form.get("name") ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 60);
  if (!(file instanceof File) || !base) return NextResponse.json({ ok: false, errors: ["الملف والاسم مطلوبان"] }, { status: 400 });
  if (file.size > 3_000_000) return NextResponse.json({ ok: false, errors: ["الحد الأقصى ٣ م.ب"] }, { status: 413 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = MAGIC.find(([, m]) => m.every((b, i) => bytes[i] === b))?.[0];
  if (!kind) return NextResponse.json({ ok: false, errors: ["الصورة يجب أن تكون JPG أو PNG أو WebP"] }, { status: 400 });
  const repo = getRepository();
  if (!repo.saveMedia) return NextResponse.json({ ok: false, errors: ["غير مدعوم"] }, { status: 501 });
  const name = `${base}.${kind}`;
  await repo.saveMedia(name, bytes, TYPES[kind]);
  await logOp("content", `رفع صورة ${name}`, "success");
  return NextResponse.json({ ok: true, src: `/api/media/${name}` });
}
