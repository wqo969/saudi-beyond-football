import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, SESSION_COOKIE, verifySession } from "@/lib/auth";

/** Paths reachable without a session. Everything else (pages, APIs, PDFs) requires login. */
const PUBLIC_PATHS = ["/login", "/offline", "/manifest.webmanifest", "/sw.js", "/robots.txt", "/favicon.ico"];
const PUBLIC_PREFIXES = ["/icons/", "/brand/", "/pdfjs/", "/api/cron/"]; // cron endpoint checks its own shared secret

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

/** The pipeline authenticates with a key header; its routes re-verify the key themselves. */
const PIPELINE_PATHS = ["/api/pipeline/", "/print/"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();
  if (PIPELINE_PATHS.some((p) => pathname.startsWith(p)) && request.headers.get("x-jm-pipeline-key")) return NextResponse.next();

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, getAuthConfig().secret);
  const isApi = pathname.startsWith("/api/");
  const needsAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!session) {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (needsAdmin && session.role !== "admin") {
    if (isApi) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    url.searchParams.set("reason", "admin");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next internals (hashed, non-sensitive build assets). Everything else goes through the gate.
  matcher: ["/((?!_next/static|_next/image|pdfjs/).*)"],
};
