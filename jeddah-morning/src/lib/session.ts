import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthConfig, SESSION_COOKIE, verifySession, type Session } from "./auth";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value, getAuthConfig().secret);
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
