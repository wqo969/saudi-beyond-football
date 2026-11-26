import { NextResponse } from "next/server";
import { isValidSubscription, pushStatus } from "@/lib/notifications";
import { addSub, removeSub } from "@/lib/push";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false }, { status: 401 });
  if (!pushStatus().enabled) return NextResponse.json({ ok: false, reason: "disabled" }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (!isValidSubscription(body)) return NextResponse.json({ ok: false, reason: "invalid-subscription" }, { status: 400 });
  await addSub({ endpoint: body.endpoint, keys: body.keys });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await getSession())) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.endpoint) await removeSub(String(body.endpoint));
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const s = pushStatus();
  return NextResponse.json({ enabled: s.enabled, publicKey: s.publicKey ?? null });
}
