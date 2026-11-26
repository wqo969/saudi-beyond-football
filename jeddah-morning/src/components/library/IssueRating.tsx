"use client";
import { useState } from "react";
import { onLibraryChange, rateIssue, readRatings } from "@/lib/library";
import { useClientValue } from "@/lib/use-client-value";

export function IssueRating({ slug }: { slug: string }) {
  const stored = useClientValue(() => readRatings().issues[slug] ?? 0, 0, onLibraryChange);
  const [v, setV] = useState<number | null>(null);
  const value = v ?? stored;
  return (
    <div className="mt-8">
      <div className="flex gap-2" role="radiogroup" aria-label="عدد النجوم">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} من 5`} onClick={() => { rateIssue(slug, n); setV(n); }} className={`text-4xl ${n <= value ? "text-gold" : "text-rule"}`}>★</button>
        ))}
      </div>
      {value > 0 && <p role="status" className="mt-3 text-sm">شكرًا — قيّمت العدد بـ {value} من 5.</p>}
    </div>
  );
}
