import type { Metadata } from "next";
import Link from "next/link";
import { SectionArt } from "@/components/SectionArt";
import { listVisibleIssues } from "@/lib/content";
import { toArabicDigits } from "@/lib/dates";
import { SECTIONS, SECTION_KEYS } from "@/lib/sections";

export const metadata: Metadata = { title: "الأقسام" };

export default async function SectionsPage() {
  const issues = await listVisibleIssues();
  const count = (k: string) => issues.reduce((n, i) => n + i.articles.filter((a) => a.section === k).length, 0);
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">الأقسام التحريرية</h1>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SECTION_KEYS.map((k) => (
          <li key={k}>
            <Link href={`/section/${k}`} className="group block">
              <SectionArt section={k} seed={`section-${k}`} variant="thumb" className="aspect-[4/3]" />
              <p className="latin-caps mt-2 !text-[0.55rem] text-gold">{SECTIONS[k].latin}</p>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold group-hover:text-gold">{SECTIONS[k].name}</p>
              <p className="text-xs text-muted">{SECTIONS[k].description} · {toArabicDigits(count(k))}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
