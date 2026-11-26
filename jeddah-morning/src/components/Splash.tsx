"use client";
import { useEffect, useState } from "react";
import { safeLocalGet, useClientValue } from "@/lib/use-client-value";

/** Launch screen: shown once per session (skippable, respects reduced motion and the setting). */
export function Splash() {
  const enabled = useClientValue(() => {
    try {
      if (sessionStorage.getItem("jm:splashed")) return false;
      const prefs = JSON.parse(safeLocalGet("jm:prefs") ?? "{}");
      if (prefs.splash === false) return false;
      if (location.pathname.startsWith("/login") || location.pathname.startsWith("/admin") || location.pathname === "/offline") return false;
      return !matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    try {
      sessionStorage.setItem("jm:splashed", "1");
    } catch {}
    const t = setTimeout(() => setHidden(true), 1500);
    return () => clearTimeout(t);
  }, [enabled]);
  if (!enabled || hidden) return null;
  return (
    <button type="button" onClick={() => setHidden(true)} className="fixed inset-0 z-[100] grid place-items-center bg-forest text-on-forest" aria-label="تخطي شاشة البداية" data-testid="splash">
      <span className="text-center">
        <span className="block font-[family-name:var(--font-display)] text-6xl font-bold animate-in">صباح جدة</span>
        <span className="latin-caps splash-latin mt-4 block text-gold">Jeddah Morning</span>
        <span className="mt-6 block font-[family-name:var(--font-latin)] text-xs italic text-on-forest/70 animate-in" style={{ animationDelay: ".4s" }}>Your world. Your morning. Your magazine.</span>
      </span>
    </button>
  );
}
