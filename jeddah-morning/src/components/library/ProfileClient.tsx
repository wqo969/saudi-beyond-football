"use client";
import { useMemo, useState } from "react";
import { DEFAULT_PROFILE, onLibraryChange, readProfile, wipePersonalData, writeProfile, type Profile } from "@/lib/library";
import { SECTIONS, SECTION_KEYS } from "@/lib/sections";
import { useClientValue } from "@/lib/use-client-value";

export function ProfileClient() {
  const raw = useClientValue(() => JSON.stringify(readProfile()), JSON.stringify(DEFAULT_PROFILE), onLibraryChange);
  const stored = useMemo(() => JSON.parse(raw) as Profile, [raw]);
  const [draft, setDraft] = useState<Profile | null>(null);
  const p = draft ?? stored;
  const [msg, setMsg] = useState<string | null>(null);
  const update = (patch: Partial<Profile>) => {
    const next = { ...p, ...patch };
    setDraft(next);
    writeProfile(next);
  };
  function exportData() {
    const data: Record<string, unknown> = {};
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("jm:")).forEach((k) => (data[k] = localStorage.getItem(k)));
    } catch {}
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = "jeddah-morning-my-data.json";
    a.click();
  }
  return (
    <div className="mt-6 space-y-8">
      <label className="block">
        <span className="text-sm font-semibold">الاسم الظاهر (اختياري)</span>
        <input value={p.displayName} onChange={(e) => update({ displayName: e.target.value })} className="mt-1 w-full rounded border border-rule bg-transparent px-3 py-2" />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">اهتماماتك</legend>
        <p className="text-xs text-muted">نخصص لك ثلثي المختارات تقريبًا، ونترك الثلث لاكتشاف أقسام جديدة.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SECTION_KEYS.map((k) => {
            const on = p.interests.includes(k);
            return (
              <button key={k} type="button" aria-pressed={on} onClick={() => update({ interests: on ? p.interests.filter((x) => x !== k) : [...p.interests, k] })} className={`rounded-full border px-3 py-1 text-sm ${on ? "border-forest bg-forest text-on-forest" : "border-rule"}`}>{SECTIONS[k].name}</button>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold">مدة القراءة المفضلة</legend>
        <div className="mt-2 inline-flex rounded-full border border-rule p-0.5">
          {([["short", "قصيرة"], ["medium", "متوسطة"], ["long", "طويلة"]] as const).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={p.readingLength === v} onClick={() => update({ readingLength: v })} className={`rounded-full px-4 py-1 text-sm ${p.readingLength === v ? "bg-forest text-on-forest" : ""}`}>{l}</button>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-3">
        <input type="checkbox" checked={p.personalization} onChange={(e) => update({ personalization: e.target.checked })} className="size-5" />
        <span><span className="block text-sm font-semibold">التخصيص</span><span className="text-xs text-muted">عند تعطيله تختفي «مختارات لك» ولا تُستخدم إشاراتك.</span></span>
      </label>
      <section className="border-t border-rule pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">بياناتك</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={exportData} className="rounded-full border border-rule px-4 py-2 text-sm">تنزيل نسخة من بياناتي</button>
          <button type="button" data-testid="wipe" onClick={() => { if (confirm("حذف كل بياناتك الشخصية من هذا الجهاز؟")) { wipePersonalData(); setDraft(null); setMsg("حُذفت بياناتك من هذا الجهاز."); } }} className="rounded-full border border-demo px-4 py-2 text-sm text-demo">حذف بيانات التخصيص والمكتبة</button>
        </div>
        {msg && <p role="status" className="mt-2 text-sm">{msg}</p>}
      </section>
    </div>
  );
}
