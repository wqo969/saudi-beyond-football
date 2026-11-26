"use client";
import { useActionState, useState } from "react";
import { changePasswordsAction, logoutEverywhereAction, revealPipelineKeyAction, type SecurityState } from "./actions";

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
      <PipelineKey />
      <form action={async () => { await logoutEverywhereAction(); }} className="mt-8 border-t border-rule pt-6">
        <button type="submit" className="rounded-full border border-demo px-5 py-2 text-sm text-demo">إنهاء كل الجلسات (بما فيها هذه)</button>
      </form>
    </>
  );
}

function PipelineKey() {
  const [key, setKey] = useState<string | null>(null);
  return (
    <section className="mt-8 border-t border-rule pt-6">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">مفتاح خط الإنتاج اليومي</h2>
      <p className="mt-1 text-sm leading-7 text-muted">يُستخدم لنشر الأعداد آليًا. انسخه مرة واحدة إلى «Network secrets» في بيئة Claude Code (الرأس: x-jm-pipeline-key). لا ترسله في أي محادثة.</p>
      {key ? <code className="mt-2 block break-all rounded bg-paper-2 p-2 text-xs" dir="ltr">{key}</code> : <button type="button" onClick={async () => setKey(await revealPipelineKeyAction())} className="mt-2 rounded-full border border-rule px-4 py-1.5 text-sm">اعرض المفتاح</button>}
    </section>
  );
}
