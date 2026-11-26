import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchClient } from "@/components/SearchClient";

export const metadata: Metadata = { title: "البحث" };

export default function SearchPage() {
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">البحث</h1>
      <Suspense fallback={null}>
        <SearchClient />
      </Suspense>
    </div>
  );
}
