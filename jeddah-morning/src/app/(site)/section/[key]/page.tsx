import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleCard } from "@/components/ArticleCard";
import { listVisibleIssues } from "@/lib/content";
import { formatShortArabicDate } from "@/lib/dates";
import { SECTIONS, SECTION_KEYS, type SectionKey } from "@/lib/sections";

type Props = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const k = (await params).key as SectionKey;
  return { title: SECTIONS[k]?.name ?? "قسم" };
}

export default async function SectionPage({ params }: Props) {
  const key = (await params).key;
  if (!(SECTION_KEYS as readonly string[]).includes(key)) notFound();
  const meta = SECTIONS[key as SectionKey];
  const items = (await listVisibleIssues()).flatMap((i) => i.articles.filter((a) => a.section === key).map((a) => ({ i, a })));
  return (
    <div className="px-4 pt-6">
      <p className="latin-caps text-gold">{meta.latin}</p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">{meta.name}</h1>
      <p className="mt-1 text-sm text-muted">{meta.description}{meta.live ? " · يعتمد على مصادر موثقة" : ""}</p>
      {items.length === 0 && <p className="py-12 text-center text-muted">لا مواد منشورة في هذا القسم بعد.</p>}
      <div className="mt-4 grid gap-x-10 md:grid-cols-2">
        {items.map(({ i, a }) => (
          <div key={`${i.slug}/${a.id}`}>
            <p className="pt-3 text-[0.65rem] text-muted"><Link href={`/issue/${i.slug}`}>{formatShortArabicDate(i.date)} · {i.title}</Link></p>
            <ArticleCard issue={i} article={a} />
          </div>
        ))}
      </div>
    </div>
  );
}
