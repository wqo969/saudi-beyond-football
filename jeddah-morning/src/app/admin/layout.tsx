import type { Metadata } from "next";
import Link from "next/link";
import { getRepository } from "@/lib/content";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: { default: "غرفة التحرير", template: "%s · غرفة التحرير" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const repo = getRepository();
  return (
    <div className="min-h-dvh bg-paper">
      <header className="pt-safe bg-forest-deep text-on-forest">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold">غرفة التحرير</span>
            <span className="latin-caps text-gold">Newsroom</span>
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin" className="hover:text-gold">الأعداد</Link>
            <Link href="/admin/issues/new" className="hover:text-gold">عدد جديد</Link>
            <Link href="/admin/import" className="hover:text-gold">الاستيراد</Link>
            <Link href="/" className="text-gold">← المجلة</Link>
          </nav>
        </div>
        <div className="bg-black/20 py-1 text-center text-[0.7rem] text-on-forest/70">
          مصدر المحتوى: {repo.kind === "local" ? "ملفات محلية" : "Supabase"} · {repo.writable ? "الكتابة متاحة" : "للقراءة فقط في هذه البيئة"}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
