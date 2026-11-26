import { NextResponse } from "next/server";
import { getRepository } from "@/lib/content";
import { logOp } from "@/lib/ops-log";
import { pipelineAuthorized } from "@/lib/pipeline-auth";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

/** Upload a licensed editorial image (rights are recorded on the image block itself). */
export async function POST(req: Request) {
  if (!pipelineAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name") ?? "";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!/^[a-z0-9-]+\.(jpe?g|png|webp|avif)$/i.test(name) || !TYPES[ext]) return NextResponse.json({ ok: false, errors: ["name"] }, { status: 400 });
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length > 3_000_000) return NextResponse.json({ ok: false, errors: ["too large"] }, { status: 413 });
  const repo = getRepository();
  if (!repo.saveMedia) return NextResponse.json({ ok: false, errors: ["unsupported"] }, { status: 501 });
  await repo.saveMedia(name, bytes, TYPES[ext]);
  await logOp("content", `رُفعت صورة ${name}`, "success");
  return NextResponse.json({ ok: true, src: `/api/media/${name}` });
}
