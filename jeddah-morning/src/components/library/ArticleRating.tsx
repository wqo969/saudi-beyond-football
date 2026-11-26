"use client";
import { useState } from "react";
import { onLibraryChange, rateArticle, readRatings } from "@/lib/library";
import { useClientValue } from "@/lib/use-client-value";

export function ArticleRating({ keyId }: { keyId: string }) {
  const stored = useClientValue(() => readRatings().articles[keyId] ?? 0, 0, onLibraryChange);
  const [v, setV] = useState<number | null>(null);
  const value = v ?? stored;
  const set = (n: 1 | -1) => {
    const next = value === n ? 0 : n;
    rateArticle(keyId, next as 1 | -1 | 0);
    setV(next);
  };
  return (
    <div className="mt-8 flex items-center justify-center gap-3 text-sm" role="group" aria-label="تقييم المقال">
      <span className="text-muted">هل أعجبك المقال؟</span>
      <button type="button" aria-pressed={value === 1} onClick={() => set(1)} className={`rounded-full border px-3 py-1 ${value === 1 ? "border-gold bg-gold/15 text-gold" : "border-rule"}`}>نعم</button>
      <button type="button" aria-pressed={value === -1} onClick={() => set(-1)} className={`rounded-full border px-3 py-1 ${value === -1 ? "border-gold bg-gold/15 text-gold" : "border-rule"}`}>لا</button>
    </div>
  );
}
