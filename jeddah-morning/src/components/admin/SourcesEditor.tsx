"use client";
import { useState, useTransition } from "react";
import { saveSourcesAction, type TrustedSource } from "@/app/admin/ops-actions";

export function SourcesEditor({ initial }: { initial: TrustedSource[] }) {
  const [list, setList] = useState<TrustedSource[]>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const input = "rounded border border-rule bg-paper px-2 py-1 text-sm";
  const set = (i: number, patch: Partial<TrustedSource>) => { setSaved(false); setList((l) => l.map((x, j) => (j === i ? { ...x, ...patch } : x))); };
  return (
    <div className="mt-4">
      <ul className="space-y-2">
        {list.map((s, i) => (
          <li key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_auto]">
            <input className={input} value={s.name} onChange={(e) => set(i, { name: e.target.value })} placeholder="الاسم" aria-label="اسم المصدر" />
            <input className={input} dir="ltr" value={s.url} onChange={(e) => set(i, { url: e.target.value })} placeholder="https://" aria-label="الرابط" />
            <input className={input} dir="ltr" value={s.sections.join(",")} onChange={(e) => set(i, { sections: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} placeholder="news,weather" aria-label="الأقسام" />
            <button type="button" className="text-xs text-demo" onClick={() => setList((l) => l.filter((_, j) => j !== i))}>حذف</button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <button type="button" className="rounded-full border border-rule px-4 py-1.5 text-sm" onClick={() => setList((l) => [...l, { name: "", url: "https://", sections: [] }])}>+ مصدر</button>
        <button type="button" disabled={pending} className="rounded-full bg-forest px-5 py-1.5 text-sm text-on-forest" onClick={() => start(async () => { await saveSourcesAction(list); setSaved(true); })}>حفظ</button>
        {saved && <span role="status" className="self-center text-sm">تم الحفظ</span>}
      </div>
    </div>
  );
}
