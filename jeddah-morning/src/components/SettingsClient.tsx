"use client";
import { useEffect, useState } from "react";
import { useClientValue } from "@/lib/use-client-value";
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
