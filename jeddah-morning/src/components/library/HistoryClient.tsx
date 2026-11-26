"use client";
import Link from "next/link";
import { useMemo } from "react";
import { clearHistory, onLibraryChange, readHistory, type HistoryEntry } from "@/lib/library";
import { SECTIONS, type SectionKey } from "@/lib/sections";
import { useClientValue } from "@/lib/use-client-value";

export function HistoryClient() {
  const raw = useClientValue(() => JSON.stringify(readHistory()), "[]", onLibraryChange);
  const list = useMemo(() => JSON.parse(raw) as HistoryEntry[], [raw]);
  if (list.length === 0) return <p className="py-16 text-center text-muted">لم تقرأ شيئًا بعد على هذا الجهاز.</p>;
  return (
    <>
      <button type="button" onClick={() => confirm("مسح سجل القراءة؟") && clearHistory()} className="mt-4 rounded-full border border-rule px-4 py-1.5 text-xs">مسح السجل</button>
      <ul className="mt-4 divide-y divide-rule">
        {list.map((h) => (
          <li key={`${h.issueSlug}/${h.articleId}`}>
            <Link href={`/issue/${h.issueSlug}/a/${h.articleId}`} className="block py-3">
              <span className="kicker">{SECTIONS[h.section as SectionKey]?.name}</span>
              <span className="block font-[family-name:var(--font-display)] text-lg font-bold">{h.title}</span>
              <span className="text-xs text-muted">{new Date(h.at).toLocaleString("ar-SA-u-nu-arab", { dateStyle: "medium", timeStyle: "short" })}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
