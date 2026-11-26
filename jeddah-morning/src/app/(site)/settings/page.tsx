import type { Metadata } from "next";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { SettingsClient } from "@/components/SettingsClient";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "الإعدادات" };

const LINKS = [
  ["/profile", "الملف الشخصي والتخصيص"],
  ["/notifications", "الإشعارات"],
  ["/sections", "الأقسام التحريرية"],
  ["/specials", "الأعداد الخاصة"],
  ["/covers", "أرشيف الأغلفة"],
  ["/gifts", "الهدايا الرقمية"],
  ["/next", "العدد القادم"],
] as const;

export default async function SettingsPage() {
  const session = await getSession();
  return (
    <div className="px-4 pt-6 md:max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">المزيد والإعدادات</h1>
      <ul className="mt-5 divide-y divide-rule border-y border-rule">
        {LINKS.map(([href, label]) => (
          <li key={href}><Link href={href} className="flex justify-between py-3"><span>{label}</span><span className="text-muted">←</span></Link></li>
        ))}
        {session?.role === "admin" && <li><Link href="/admin" className="flex justify-between py-3 text-gold"><span>غرفة التحرير</span><span>←</span></Link></li>}
      </ul>
      <SettingsClient />
      <section className="mt-8 border-t border-rule pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">الحساب</h2>
        <p className="mt-2 text-sm text-muted">الصلاحية: {session?.role === "admin" ? "محرر" : "قارئ"}</p>
        <LogoutButton />
      </section>
    </div>
  );
}
