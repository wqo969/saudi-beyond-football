import { getRepository } from "@/lib/content";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };

/** Editorial images: served only to signed-in readers (proxy) from the private store. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const repo = getRepository();
  const data = repo.readMedia ? await repo.readMedia(name) : null;
  if (!data) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(data), {
    headers: { "Content-Type": TYPES[name.split(".").pop()!.toLowerCase()] ?? "application/octet-stream", "Cache-Control": "private, max-age=604800, immutable" },
  });
}
