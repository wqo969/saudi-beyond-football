"use client";
import Link from "next/link";
import { useActionState } from "react";
import { setupAction, type SetupState } from "./actions";

export function SetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(setupAction, {});
  const input = "w-full rounded-md border border-gold/50 bg-black/20 px-4 py-3 text-on-forest outline-none focus:border-gold";
  if (state.ok)
    return (
      <p role="status" className="mt-6 rounded border border-gold/50 p-4 text-sm leading-7">
        اكتمل الإعداد. <Link href="/login" className="text-gold underline">ادخل الآن بكلمة مرور المحرر</Link>
      </p>
    );
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block"><span className="mb-1 block text-sm">رمز الإعداد (الذي وضعته في إعدادات الاستضافة)</span><input name="code" type="password" required className={input} dir="ltr" autoComplete="off" /></label>
      <label className="block"><span className="mb-1 block text-sm">كلمة مرور القارئ</span><input name="reader" type="password" required minLength={12} className={input} dir="ltr" autoComplete="new-password" /></label>
      <label className="block"><span className="mb-1 block text-sm">كلمة مرور المحرر</span><input name="admin" type="password" required minLength={12} className={input} dir="ltr" autoComplete="new-password" /></label>
      {state.errors && <ul role="alert" className="list-disc ps-5 text-sm text-[#f0b48a]">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      <button type="submit" disabled={pending} className="w-full rounded-md bg-gold py-3 font-semibold text-forest-deep disabled:opacity-60">{pending ? "…" : "احفظ وابدأ"}</button>
    </form>
  );
}
