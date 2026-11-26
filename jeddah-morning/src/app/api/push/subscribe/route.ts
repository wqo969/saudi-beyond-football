import { NextResponse } from "next/server";
import { isValidSubscription, pushStatus } from "@/lib/notifications";

/** Scaffold only: returns 503 until JM_PUSH_ENABLED=true and VAPID keys exist. Storage lands with Supabase (phase 2). */
export async function POST(req: Request) {
  const status = pushStatus();
  if (!status.enabled) return NextResponse.json({ ok: false, reason: status.reason }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (!isValidSubscription(body)) return NextResponse.json({ ok: false, reason: "invalid-subscription" }, { status: 400 });
  return NextResponse.json({ ok: false, reason: "storage-not-configured" }, { status: 501 });
}

export async function GET() {
  return NextResponse.json(pushStatus());
}
