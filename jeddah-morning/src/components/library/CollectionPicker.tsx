"use client";
import { useState } from "react";
import { addToCollection, createCollection, readCollections, type ItemRef } from "@/lib/library";

export function CollectionPicker({ item, className = "" }: { item: ItemRef; className?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const cols = open ? readCollections() : [];
  return (
    <span className="relative">
      <button type="button" className={className} onClick={() => setOpen((v) => !v)} aria-expanded={open}>+ مجموعة</button>
      {open && (
        <span className="absolute end-0 top-8 z-30 block w-56 rounded-md border border-rule bg-paper p-3 text-start text-xs text-ink shadow-xl" role="dialog" aria-label="أضف إلى مجموعة">
          {cols.length === 0 && <span className="block text-muted">لا مجموعات بعد</span>}
          {cols.map((c) => (
            <button key={c.id} type="button" className="block w-full rounded px-2 py-1.5 text-start hover:bg-paper-2" onClick={() => { addToCollection(c.id, item); setDone(c.name); setOpen(false); }}>
              {c.name} <span className="text-muted">({c.items.length})</span>
            </button>
          ))}
          <span className="mt-2 flex gap-1 border-t border-rule pt-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مجموعة جديدة" className="min-w-0 flex-1 rounded border border-rule bg-transparent px-2 py-1" />
            <button type="button" className="rounded bg-accent px-2 text-on-accent" onClick={() => { if (!name.trim()) return; const c = createCollection(name); addToCollection(c.id, item); setDone(c.name); setName(""); setOpen(false); }}>أضف</button>
          </span>
        </span>
      )}
      {done && <span role="status" className="sr-only">أضيف إلى {done}</span>}
    </span>
  );
}
