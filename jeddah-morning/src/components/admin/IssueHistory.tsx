"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addCorrectionAction, restoreVersionAction } from "@/app/admin/ops-actions";

export function IssueHistory({ slug, versions, corrections }: { slug: string; versions: string[]; corrections: { at: string; text: string }[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="mb-8 grid gap-6 border border-rule p-4 md:grid-cols-2">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">التصحيحات</h2>
        <ul className="mt-2 list-disc ps-5 text-sm">{corrections.map((c, i) => <li key={i}>{c.at}: {c.text}</li>)}</ul>
        {corrections.length === 0 && <p className="text-sm text-muted">لا تصحيحات.</p>}
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="mt-2 w-full rounded border border-rule bg-paper px-2 py-1 text-sm" placeholder="نص التصحيح كما سيظهر للقارئ" aria-label="نص التصحيح" />
        <button type="button" disabled={pending} onClick={() => start(async () => { const r = await addCorrectionAction(slug, text); setMsg(r.ok ? "أُضيف التصحيح" : r.error!); if (r.ok) { setText(""); router.refresh(); } })} className="mt-1 rounded-full border border-rule px-4 py-1 text-sm">أضف تصحيحًا</button>
      </div>
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">سجل الإصدارات</h2>
        {versions.length === 0 ? <p className="text-sm text-muted">لا إصدارات سابقة (أو التخزين محلي).</p> : (
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs" dir="ltr">
            {versions.map((v) => (
              <li key={v} className="flex items-center justify-between gap-2">
                <span>{v}</span>
                <button type="button" disabled={pending} className="rounded border border-rule px-2" onClick={() => confirm("استعادة هذا الإصدار؟ يُحفظ الحالي في السجل.") && start(async () => { const r = await restoreVersionAction(slug, v); setMsg(r.ok ? "استُعيد" : r.error!); router.refresh(); })}>استعادة</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {msg && <p role="status" className="text-sm md:col-span-2">{msg}</p>}
    </section>
  );
}
