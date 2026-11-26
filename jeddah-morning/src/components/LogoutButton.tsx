"use client";
import { useRef } from "react";
import { logoutAction } from "@/app/actions";

/** Clears private offline caches on this device, then ends the session. */
export function LogoutButton() {
  const formRef = useRef<HTMLFormElement>(null);
  async function onClick() {
    try {
      if ("caches" in window) for (const k of await caches.keys()) if (k.startsWith("jm-pages") || k.startsWith("jm-issues")) await caches.delete(k);
      Object.keys(localStorage).filter((k) => k.startsWith("jm:offline:")).forEach((k) => localStorage.removeItem(k));
    } catch {}
    formRef.current?.requestSubmit();
  }
  return (
    <form ref={formRef} action={logoutAction} className="mt-3">
      <button type="button" onClick={onClick} className="rounded-full border border-rule px-5 py-2 text-sm" data-testid="logout">تسجيل الخروج</button>
    </form>
  );
}
