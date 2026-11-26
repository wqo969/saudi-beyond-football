"use client";
import { useActionState } from "react";
import { changePasswordsAction, logoutEverywhereAction, type SecurityState } from "./actions";

export function SecurityForm() {
  const [state, action, pending] = useActionState<SecurityState, FormData>(changePasswordsAction, {});
  const input = "w-full rounded border border-rule bg-paper px-3 py-2";
  return (
    <>
      <form action={action} className="mt-6 space-y-4">
        <label className="block"><span className="mb-1 block text-sm">كلمة مرور المحرر الحالية</span><input name="current" type="password" required autoComplete="current-password" className={input} dir="ltr" /></label>
        <label className="block"><span className="mb-1 block text-sm">كلمة مرور المحرر الجديدة (اختياري)</span><input name="admin" type="password" autoComplete="new-password" minLength={12} className={input} dir="ltr" /></label>
        <label className="block"><span className="mb-1 block text-sm">كلمة مرور القارئ الجديدة (اختياري)</span><input name="reader" type="password" autoComplete="new-password" minLength={12} className={input} dir="ltr" /></label>
        {state.errors && <ul role="alert" className="list-disc ps-5 text-sm text-demo">{state.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
        {state.ok && <p role="status" className="text-sm">تم الحفظ، وأُنهيت الجلسات الأخرى.</p>}
        <button type="submit" disabled={pending} className="rounded-full bg-forest px-6 py-2 text-sm text-on-forest disabled:opacity-60">{pending ? "جارٍ الحفظ…" : "حفظ"}</button>
      </form>
      <form action={async () => { await logoutEverywhereAction(); }} className="mt-8 border-t border-rule pt-6">
        <button type="submit" className="rounded-full border border-demo px-5 py-2 text-sm text-demo">إنهاء كل الجلسات (بما فيها هذه)</button>
      </form>
    </>
  );
}
