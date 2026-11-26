"use client";
import { useEffect, useState } from "react";

function urlB64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "loading" | "unsupported" | "needs-install" | "disabled-server" | "off" | "on" | "denied" | "error";

/** Web Push opt-in. On iPhone, notifications work only for the app installed to the Home Screen (iOS 16.4+). */
export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        const ios = /iPhone|iPad/.test(navigator.userAgent);
        const standalone = matchMedia("(display-mode: standalone)").matches;
        setState(ios && !standalone ? "needs-install" : "unsupported");
        return;
      }
      const r = await fetch("/api/push/subscribe").then((x) => x.json()).catch(() => null);
      if (!r?.enabled) return setState("disabled-server");
      setKey(r.publicKey);
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "on" : "off");
    })().catch(() => setState("error"));
  }, []);

  async function enable() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key!) });
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      setState(res.ok ? "on" : "error");
    } catch {
      setState("error");
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("off");
  }

  const msg: Record<State, string> = {
    loading: "جارٍ التحقق…",
    unsupported: "هذا المتصفح لا يدعم الإشعارات.",
    "needs-install": "على الآيفون: ثبّت التطبيق أولًا (مشاركة ← إضافة إلى الشاشة الرئيسية) ثم افتحه من الأيقونة.",
    "disabled-server": "الإشعارات غير مفعّلة على الخادم.",
    off: "الإشعارات متوقفة على هذا الجهاز.",
    on: "الإشعارات مفعّلة على هذا الجهاز: صدور العدد الصباحي والمسائي والأعداد الخاصة.",
    denied: "رُفض الإذن. فعّله من إعدادات الجهاز للتطبيق.",
    error: "تعذّر تفعيل الإشعارات. حاول مرة أخرى.",
  };
  return (
    <div className="mt-4 rounded border border-rule p-4" data-testid="push-toggle">
      <p className="text-sm">{msg[state]}</p>
      {state === "off" && <button type="button" onClick={enable} className="mt-3 rounded-full bg-forest px-5 py-2 text-sm text-on-forest">فعّل الإشعارات</button>}
      {state === "on" && <button type="button" onClick={disable} className="mt-3 rounded-full border border-rule px-5 py-2 text-sm">أوقف الإشعارات</button>}
    </div>
  );
}
