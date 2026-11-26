"use server";
import { timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clearFailures, lockedUntil, readAuthDoc, recordFailure, writeAuthDoc } from "@/lib/auth-store";
import { logOp } from "@/lib/ops-log";
import { hashPassword, passwordProblems } from "@/lib/passwords";
import { getServerSecrets } from "@/lib/server-secrets";

export interface SetupState {
  ok?: boolean;
  errors?: string[];
}

/** Setup is possible only once: while no editor password exists, and only with the owner's own setup code. */
export async function setupAvailable(): Promise<boolean> {
  const code = process.env.JM_SETUP_CODE ?? "";
  if (code.length < 12) return false;
  const doc = await readAuthDoc();
  return !doc.adminHash && !process.env.JM_ADMIN_PASSWORD_HASH && !process.env.JM_ADMIN_PASSWORD;
}

export async function setupAction(_prev: SetupState, form: FormData): Promise<SetupState> {
  if (!(await setupAvailable())) return { errors: ["الإعداد الأولي غير متاح (اكتمل مسبقًا أو لم يُضبط رمز الإعداد)."] };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (await lockedUntil(ip)) return { errors: ["محاولات كثيرة خاطئة. حاول لاحقًا."] };
  const given = Buffer.from(String(form.get("code") ?? ""));
  const want = Buffer.from(process.env.JM_SETUP_CODE!);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    await recordFailure(ip);
    return { errors: ["رمز الإعداد غير صحيح"] };
  }
  const reader = String(form.get("reader") ?? "");
  const admin = String(form.get("admin") ?? "");
  const errors = [...passwordProblems(reader).map((e) => `القارئ: ${e}`), ...passwordProblems(admin).map((e) => `المحرر: ${e}`)];
  if (reader === admin) errors.push("يجب أن تختلف كلمة مرور المحرر عن القارئ");
  if (reader === process.env.JM_SETUP_CODE || admin === process.env.JM_SETUP_CODE) errors.push("لا تستخدم رمز الإعداد ككلمة مرور");
  if (errors.length) return { errors };
  await clearFailures(ip);
  await getServerSecrets(); // generate session secret, pipeline key and push keys on the server
  const doc = await readAuthDoc();
  await writeAuthDoc({ ...doc, readerHash: await hashPassword(reader), adminHash: await hashPassword(admin), sessionVersion: (doc.sessionVersion ?? 1) + 1 });
  await logOp("security", "اكتمل الإعداد الأولي وتعيين كلمات المرور", "success");
  redirect("/login?setup=done");
}
