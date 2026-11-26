"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthConfig, safeNext, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth";
import { clearFailures, hasHashedPasswords, lockedUntil, productionAuthProblems, readAuthDoc, recordFailure, roleFor } from "@/lib/auth-store";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const cfg = getAuthConfig();
  if (!cfg.secret || (!hasHashedPasswords() && (!cfg.readerPassword || !cfg.adminPassword)) || productionAuthProblems().length) {
    return { error: "إعدادات الدخول على الخادم غير مكتملة أو غير آمنة." };
  }
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  const until = await lockedUntil(ip);
  if (until) return { error: `محاولات كثيرة خاطئة. حاول بعد ${Math.ceil((until - Date.now()) / 60000)} دقيقة.` };
  const password = String(form.get("password") ?? "");
  const role = await roleFor(password, cfg);
  if (!role) {
    await recordFailure(ip);
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "كلمة المرور غير صحيحة" };
  }
  await clearFailures(ip);
  const { sessionVersion } = await readAuthDoc();
  const token = await signSession({ role, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE, v: sessionVersion }, cfg.secret);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.JM_INSECURE_COOKIES !== "true",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(safeNext(String(form.get("next") ?? "/")));
}

export async function logoutAction() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
