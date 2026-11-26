"use client";
import { useEffect, useState } from "react";
import { isFavorite, onFavoritesChange, toggleFavorite } from "@/lib/favorites";
import { IconStar } from "./icons";

export function FavoriteButton({ issueSlug, articleId, title, section, className = "", compact = false }: { issueSlug: string; articleId: string; title: string; section: string; className?: string; compact?: boolean }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(isFavorite(issueSlug, articleId));
    sync();
    return onFavoritesChange(sync);
  }, [issueSlug, articleId]);
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn(toggleFavorite({ issueSlug, articleId, title, section }))}
      className={`inline-flex items-center gap-1.5 rounded-full border ${compact ? "px-2.5 py-1 text-[0.7rem]" : "px-3 py-1.5 text-sm"} ${on ? "border-gold bg-gold/15 text-gold" : "border-rule"} ${className}`}
      aria-label={on ? "في المفضلة" : "أضف للمفضلة"}
    >
      <IconStar className="size-4" filled={on} />
      {compact ? (on ? "محفوظ" : "احفظ") : on ? "في المفضلة" : "أضف للمفضلة"}
    </button>
  );
}
