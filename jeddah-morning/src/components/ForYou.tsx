"use client";
import Link from "next/link";
import { useMemo } from "react";
import { readFavorites } from "@/lib/favorites";
import { onLibraryChange, readHistory, readProfile, readRatings } from "@/lib/library";
import { rankForYou, type Candidate } from "@/lib/personalization";
import { SECTIONS, type SectionKey } from "@/lib/sections";
import { useClientValue } from "@/lib/use-client-value";

/** On-device personalization: never leaves the browser, can be switched off in the profile. */
export function ForYou({ index }: { index: (Candidate & { title: string; date: string })[] }) {
  const snapshot = useClientValue(
    () => JSON.stringify({ p: readProfile(), h: readHistory().slice(0, 100), f: readFavorites(), r: readRatings() }),
    "",
    onLibraryChange,
  );
  const picks = useMemo(() => {
    if (!snapshot) return null;
    const s = JSON.parse(snapshot);
    if (!s.p.personalization) return null;
    return rankForYou(index, { interests: s.p.interests, history: s.h, favorites: s.f, ratings: s.r }, 6);
  }, [snapshot, index]);
  if (!picks || picks.length === 0) return null;
  return (
    <section className="px-4 pt-12" aria-labelledby="for-you">
      <h2 id="for-you" className="flex items-baseline justify-between">
        <span className="font-[family-name:var(--font-display)] text-2xl font-bold">مختارات لك</span>
        <Link href="/profile" className="text-xs text-muted">لماذا أرى هذا؟</Link>
      </h2>
      <ul className="mt-3 divide-y divide-rule">
        {picks.map((c) => (
          <li key={`${c.issueSlug}/${c.id}`}>
            <Link href={`/issue/${c.issueSlug}/a/${c.id}`} className="flex items-baseline gap-3 py-3">
              <span className="kicker w-24 shrink-0">{c.reason === "discovery" ? "✦ اكتشف" : SECTIONS[c.section as SectionKey].name}</span>
              <span className="font-[family-name:var(--font-display)] text-lg font-bold leading-8">{(c as { title: string }).title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
