import type { Metadata } from "next";
import Link from "next/link";
import { CollectionsClient } from "@/components/library/CollectionsClient";

export const metadata: Metadata = { title: "مكتبتي" };

export default function LibraryPage() {
  const tiles = [
    { href: "/favorites", t: "المفضلة", d: "المقالات المحفوظة" },
    { href: "/history", t: "سجل القراءة", d: "ما قرأته مؤخرًا" },
    { href: "/gifts", t: "الهدايا الرقمية", d: "خلفيات وبطاقات الأعداد" },
    { href: "/covers", t: "أرشيف الأغلفة", d: "كل الأغلفة" },
  ];
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">مكتبتي</h1>
      <p className="mt-1 text-sm text-muted">كل ما هنا محفوظ على هذا الجهاز فقط.</p>
      <ul className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((x) => (
          <li key={x.href}><Link href={x.href} className="block border border-rule p-4 hover:border-gold"><p className="font-[family-name:var(--font-display)] text-xl font-bold">{x.t}</p><p className="text-xs text-muted">{x.d}</p></Link></li>
        ))}
      </ul>
      <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl font-bold">المجموعات</h2>
      <CollectionsClient />
    </div>
  );
}
