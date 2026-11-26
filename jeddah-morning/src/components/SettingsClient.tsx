"use client";
import { useEffect, useState } from "react";
import { safeLocalGet, useClientValue } from "@/lib/use-client-value";
import { DEFAULT_PREFS, writePrefs, type ReaderPrefs } from "@/lib/library";
import { applyTheme, readTheme, type ThemePref } from "./ThemeToggle";

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: "light", label: "نهاري" },
  { value: "dark", label: "ليلي" },
  { value: "system", label: "حسب الجهاز" },
];

export function SettingsClient() {
  const storedTheme = useClientValue<ThemePref>(readTheme, "system");
  const [themeOverride, setTheme] = useState<ThemePref | null>(null);
  const theme = themeOverride ?? storedTheme;
  const savedJoined = useClientValue(() => {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith("jm:offline:")).map((k) => k.slice("jm:offline:".length)).sort().join("\n");
    } catch {
      return "";
    }
  }, "");
  const [cleared, setCleared] = useState(false);
  const saved = cleared || !savedJoined ? [] : savedJoined.split("\n");
  const [usage, setUsage] = useState<string | null>(null);
  const prefsRaw = useClientValue(() => safeLocalGet("jm:prefs") ?? "", "");
  const [prefsDraft, setPrefsDraft] = useState<ReaderPrefs | null>(null);
  const prefs: ReaderPrefs = prefsDraft ?? (prefsRaw ? { ...DEFAULT_PREFS, ...JSON.parse(prefsRaw) } : DEFAULT_PREFS);
  const setPref = (patch: Partial<ReaderPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefsDraft(next);
    writePrefs(next);
  };

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => e.usage != null && setUsage(`${(e.usage / 1024 / 1024).toFixed(1)} م.ب`));
  }, []);

  async function clearOffline() {
    if ("caches" in window) for (const k of await caches.keys()) if (k.startsWith("jm-")) await caches.delete(k);
    try {
      Object.keys(localStorage).filter((k) => k.startsWith("jm:offline:")).forEach((k) => localStorage.removeItem(k));
    } catch {}
    setCleared(true);
  }

  return (
    <>
      <section className="mt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">المظهر</h2>
        <div role="radiogroup" aria-label="المظهر" className="mt-3 inline-flex rounded-full border border-rule p-0.5">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={theme === o.value}
              onClick={() => { setTheme(o.value); applyTheme(o.value); }}
              className={`rounded-full px-4 py-1.5 text-sm ${theme === o.value ? "bg-forest text-on-forest" : ""}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>
      <section className="mt-8 border-t border-rule pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">القراءة</h2>
        <div className="mt-3 space-y-3 text-sm">
          <Row label="طريقة القراءة" value={prefs.mode} onChange={(v) => setPref({ mode: v as ReaderPrefs["mode"] })} options={[["pages", "صفحات"], ["scroll", "عمودي"]]} />
          <Row label="تأثير التقليب" value={prefs.effect} onChange={(v) => setPref({ effect: v as ReaderPrefs["effect"] })} options={[["flip", "ورق"], ["slide", "انزلاق"], ["none", "بدون"]]} />
          <Row label="حجم النص" value={String(prefs.scale)} onChange={(v) => setPref({ scale: Number(v) })} options={[["0.85", "صغير"], ["1", "عادي"], ["1.15", "كبير"], ["1.3", "أكبر"]]} />
          <label className="flex items-center justify-between"><span>شاشة البداية</span><input type="checkbox" checked={prefs.splash} onChange={(e) => setPref({ splash: e.target.checked })} className="size-5" /></label>
        </div>
      </section>
      <section className="mt-8 border-t border-rule pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">القراءة دون إنترنت</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {saved.length ? `أعداد محفوظة: ${saved.length}` : "لا توجد أعداد محفوظة. افتح فهرس أي عدد واضغط «احفظ للقراءة دون إنترنت»."}
          {usage && ` · المساحة المستخدمة: ${usage}`}
        </p>
        {saved.length > 0 && <ul className="mt-2 text-xs text-muted" dir="ltr">{saved.map((s) => <li key={s}>{s}</li>)}</ul>}
        <button type="button" onClick={clearOffline} className="mt-3 rounded-full border border-rule px-5 py-2 text-sm">مسح المحفوظ</button>
        {cleared && <p className="mt-2 text-xs text-muted">تم المسح.</p>}
      </section>
    </>
  );
}

function Row({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-rule p-0.5">
        {options.map(([v, l]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`rounded-full px-3 py-1 text-xs ${value === v ? "bg-forest text-on-forest" : ""}`}>{l}</button>
        ))}
      </div>
    </div>
  );
}
