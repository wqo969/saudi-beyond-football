"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { editionName, formatShortArabicDate } from "@/lib/dates";
import { search, type SearchDoc } from "@/lib/search";
import { SECTIONS, SECTION_KEYS, type SectionKey } from "@/lib/sections";
import { DemoBadge } from "./DemoBadge";

export function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const sectionParam = params.get("section");
  const section = sectionParam && (SECTION_KEYS as readonly string[]).includes(sectionParam) ? (sectionParam as SectionKey) : null;

  useEffect(() => {
    fetch("/api/search-index")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { docs: SearchDoc[] }) => setDocs(d.docs))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams();
      if (query) sp.set("q", query);
      if (section) sp.set("section", section);
      router.replace(sp.size ? `/search?${sp}` : "/search", { scroll: false });
    }, 300);
    return () => clearTimeout(t);
  }, [query, section, router]);

  const results = useMemo(() => {
    if (!docs) return [];
    if (!query.trim() && section) return docs.filter((d) => d.section === section).map((doc) => ({ doc, score: 0 }));
    return search(docs, query, { section });
  }, [docs, query, section]);

  const setSection = (k: SectionKey | null) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    if (k) sp.set("section", k);
    router.replace(sp.size ? `/search?${sp}` : "/search", { scroll: false });
  };

  return (
    <div>
      <label className="mt-4 block">
        <span className="sr-only">ابحث في الأعداد</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في كل الأعداد…"
          autoFocus
          className="w-full rounded-none border-0 border-b-2 border-ink bg-transparent py-3 font-[family-name:var(--font-display)] text-2xl outline-none placeholder:text-muted focus:border-gold"
        />
      </label>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <button type="button" onClick={() => setSection(null)} className={`shrink-0 rounded-full border px-3 py-1 text-sm ${!section ? "border-forest bg-forest text-on-forest" : "border-rule"}`}>كل الأقسام</button>
        {SECTION_KEYS.map((k) => (
          <button key={k} type="button" onClick={() => setSection(k)} className={`shrink-0 rounded-full border px-3 py-1 text-sm ${section === k ? "border-forest bg-forest text-on-forest" : "border-rule"}`}>{SECTIONS[k].name}</button>
        ))}
      </div>
      {error && <p className="py-10 text-center text-muted">تعذّر تحميل فهرس البحث. إن كنت دون اتصال فاحفظ عددًا للقراءة دون إنترنت أولًا.</p>}
      {!docs && !error && <p className="py-10 text-center text-muted">جارٍ التحميل…</p>}
      {docs && (query.trim() || section) && (
        <p className="mt-4 text-sm text-muted" aria-live="polite">{results.length ? `${results.length} نتيجة` : "لا توجد نتائج"}</p>
      )}
      <ul className="mt-2 divide-y divide-rule">
        {results.map(({ doc }) => (
          <li key={`${doc.issueSlug}/${doc.articleId}`}>
            <Link href={`/issue/${doc.issueSlug}/a/${doc.articleId}`} className="block py-4">
              <p className="kicker">{SECTIONS[doc.section].name} · {editionName(doc.edition)} · {formatShortArabicDate(doc.date)}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold leading-9">{doc.title}</p>
              {doc.dek && <p className="line-clamp-2 text-sm leading-7 text-ink-soft">{doc.dek}</p>}
              {doc.isDemo && <DemoBadge className="mt-1" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
