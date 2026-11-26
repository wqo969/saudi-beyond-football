import type { Metadata } from "next";
import { HistoryClient } from "@/components/library/HistoryClient";

export const metadata: Metadata = { title: "سجل القراءة" };

export default function HistoryPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">سجل القراءة</h1>
      <p className="mt-1 text-sm text-muted">محفوظ على هذا الجهاز فقط.</p>
      <HistoryClient />
    </div>
  );
}
