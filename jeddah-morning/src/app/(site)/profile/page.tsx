import type { Metadata } from "next";
import { ProfileClient } from "@/components/library/ProfileClient";

export const metadata: Metadata = { title: "الملف الشخصي" };

export default function ProfilePage() {
  return (
    <div className="px-4 pt-6 md:max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">الملف الشخصي</h1>
      <p className="mt-1 text-sm text-muted">التخصيص يعمل على جهازك فقط، ولا يُرسل شيء إلى أي خادم.</p>
      <ProfileClient />
    </div>
  );
}
