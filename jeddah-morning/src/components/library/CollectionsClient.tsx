"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createCollection, deleteCollection, onLibraryChange, readCollections, removeFromCollection, type Collection } from "@/lib/library";
import { SECTIONS, type SectionKey } from "@/lib/sections";
import { useClientValue } from "@/lib/use-client-value";

export function CollectionsClient() {
  const raw = useClientValue(() => JSON.stringify(readCollections()), "[]", onLibraryChange);
  const cols = useMemo(() => JSON.parse(raw) as Collection[], [raw]);
  const [name, setName] = useState("");
  return (
    <div className="mt-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { createCollection(name); setName(""); } }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم مجموعة جديدة" className="min-w-0 flex-1 rounded border border-rule bg-transparent px-3 py-2 text-sm" aria-label="اسم المجموعة" />
        <button type="submit" className="rounded bg-forest px-4 text-sm text-on-forest">أنشئ</button>
      </form>
      {cols.length === 0 && <p className="py-8 text-center text-sm text-muted">لا مجموعات بعد. أنشئ واحدة أو استخدم «+ مجموعة» في أي مقال.</p>}
      <ul className="mt-4 space-y-6">
        {cols.map((c) => (
          <li key={c.id}>
            <div className="flex items-center justify-between border-b border-ink pb-1">
              <h3 className="font-[family-name:var(--font-display)] text-lg font-bold">{c.name} <span className="text-xs text-muted">({c.items.length})</span></h3>
              <button type="button" onClick={() => confirm(`حذف «${c.name}»؟`) && deleteCollection(c.id)} className="text-xs text-demo">حذف</button>
            </div>
            <ul className="divide-y divide-rule">
              {c.items.map((it) => (
                <li key={`${it.issueSlug}/${it.articleId}`} className="flex items-center gap-2 py-2">
                  <Link href={`/issue/${it.issueSlug}/a/${it.articleId}`} className="min-w-0 flex-1"><span className="kicker block">{SECTIONS[it.section as SectionKey]?.name}</span>{it.title}</Link>
                  <button type="button" onClick={() => removeFromCollection(c.id, it)} className="text-xs text-muted" aria-label={`إزالة ${it.title}`}>إزالة</button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
