import type { Metadata } from "next";
import { FavoritesClient } from "@/components/FavoritesClient";

export const metadata: Metadata = { title: "المفضلة" };

export default function FavoritesPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">المفضلة</h1>
      <p className="mt-1 text-sm text-muted">تُحفظ على هذا الجهاز فقط في المرحلة الحالية.</p>
      <FavoritesClient />
    </div>
  );
}
