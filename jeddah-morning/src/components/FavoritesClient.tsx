"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { favKey, onFavoritesChange, readFavorites, toggleFavorite, type Favorite } from "@/lib/favorites";
import { SECTIONS, type SectionKey } from "@/lib/sections";
import { IconClose } from "./icons";

export function FavoritesClient() {
  const [list, setList] = useState<Favorite[] | null>(null);
  useEffect(() => {
    const sync = () => setList(readFavorites());
    sync();
    return onFavoritesChange(sync);
  }, []);
  if (list === null) return null;
  if (list.length === 0)
    return <p className="py-16 text-center text-muted">لا شيء هنا بعد. اضغط «أضف للمفضلة» في أي مقال ليظهر هنا.</p>;
  return (
    <ul className="mt-6 divide-y divide-rule">
      {list.map((f) => (
        <li key={favKey(f)} className="flex items-start gap-3 py-4">
          <Link href={`/issue/${f.issueSlug}/a/${f.articleId}`} className="min-w-0 flex-1">
            <p className="kicker">{SECTIONS[f.section as SectionKey]?.name ?? f.section}</p>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold leading-9">{f.title}</p>
          </Link>
          <button type="button" aria-label={`إزالة ${f.title} من المفضلة`} onClick={() => toggleFavorite(f)} className="grid size-9 place-items-center rounded-full text-muted hover:bg-paper-2">
            <IconClose className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
