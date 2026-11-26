import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type Session } from "./auth";
import { sessionSecret } from "./server-secrets";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const s = await verifySession(store.get(SESSION_COOKIE)?.value, await sessionSecret());
  if (!s) return null;
  // Revocation: a password change bumps the version and invalidates every older session.
  const { readAuthDoc } = await import("./auth-store");
  const doc = await readAuthDoc();
  return (s.v ?? 1) === doc.sessionVersion ? s : null;
}

/** Defense in depth: proxy already gates routes, but server code re-checks before mutating. */
export async function requireAdmin(): Promise<Session> {
  const s = await getSession();
  if (!s || s.role !== "admin") redirect("/login?next=/admin");
  return s;
}

export async function requireReader(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}
