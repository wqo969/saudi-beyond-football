"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthConfig, roleForPassword, safeNext, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const cfg = getAuthConfig();
  if (!cfg.secret || !cfg.readerPassword || !cfg.adminPassword) {
    return { error: "لم تُضبط إعدادات الدخول على الخادم (JM_READER_PASSWORD و JM_ADMIN_PASSWORD و JM_SESSION_SECRET)." };
  }
  const password = String(form.get("password") ?? "");
  const role = await roleForPassword(password, cfg);
  if (!role) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return { error: "كلمة المرور غير صحيحة" };
  }
  const token = await signSession({ role, exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE }, cfg.secret);
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
