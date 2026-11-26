"use server";
import { cookies } from "next/headers";
import { getAuthConfig, SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/auth";
import { readAuthDoc, roleFor, writeAuthDoc } from "@/lib/auth-store";
import { logOp } from "@/lib/ops-log";
import { hashPassword, passwordProblems } from "@/lib/passwords";
import { requireAdmin } from "@/lib/session";

export interface SecurityState {
  ok?: boolean;
  errors?: string[];
}

export async function changePasswordsAction(_prev: SecurityState, form: FormData): Promise<SecurityState> {
  await requireAdmin();
  const current = String(form.get("current") ?? "");
  const admin = String(form.get("admin") ?? "");
  const reader = String(form.get("reader") ?? "");
  const cfg = getAuthConfig();
  if ((await roleFor(current, cfg)) !== "admin") return { errors: ["كلمة مرور المحرر الحالية غير صحيحة"] };
  const errors: string[] = [];
  if (!admin && !reader) errors.push("أدخل كلمة مرور جديدة واحدة على الأقل");
  if (admin) errors.push(...passwordProblems(admin).map((e) => `المحرر: ${e}`));
  if (reader) errors.push(...passwordProblems(reader).map((e) => `القارئ: ${e}`));
  if (admin && reader && admin === reader) errors.push("يجب أن تختلف كلمة مرور المحرر عن القارئ");
  if (errors.length) return { errors };
  const doc = await readAuthDoc();
  const next = {
    ...doc,
    ...(admin ? { adminHash: await hashPassword(admin) } : {}),
    ...(reader ? { readerHash: await hashPassword(reader) } : {}),
    sessionVersion: doc.sessionVersion + 1,
  };
  await writeAuthDoc(next);
  await logOp("security", "تغيير كلمات المرور وإنهاء الجلسات الأخرى", "success");
  // keep the current admin signed in with the new session version
  const token = await signSession({ role: "admin", exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE, v: next.sessionVersion }, cfg.secret!);
  (await cookies()).set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" && process.env.JM_INSECURE_COOKIES !== "true", path: "/", maxAge: SESSION_MAX_AGE });
  return { ok: true };
}

export async function logoutEverywhereAction(): Promise<SecurityState> {
  await requireAdmin();
  const doc = await readAuthDoc();
  await writeAuthDoc({ ...doc, sessionVersion: doc.sessionVersion + 1 });
  await logOp("security", "إنهاء كل الجلسات", "success");
  return { ok: true };
}
