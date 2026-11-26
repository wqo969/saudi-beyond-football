import type { Metadata } from "next";
import { LogoutButton } from "@/components/LogoutButton";
import { SettingsClient } from "@/components/SettingsClient";
import { pushStatus } from "@/lib/notifications";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "الإعدادات" };

export default async function SettingsPage() {
  const session = await getSession();
  const push = pushStatus();
  return (
    <div className="px-4 pt-6 md:max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">الإعدادات</h1>
      <SettingsClient />
      <section className="mt-8 border-t border-rule pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">الإشعارات</h2>
        <p className="mt-2 text-sm leading-7 text-ink-soft">
          {push.enabled ? "الإشعارات مفعّلة على الخادم." : "البنية جاهزة لكن الإشعارات غير مفعّلة بعد (مرحلة لاحقة، مجانية عبر Web Push)."}
        </p>
      </section>
      <section className="mt-8 border-t border-rule pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">الحساب</h2>
        <p className="mt-2 text-sm text-ink-soft">الصلاحية: {session?.role === "admin" ? "محرر" : "قارئ"}</p>
        <LogoutButton />
      </section>
    </div>
  );
}
