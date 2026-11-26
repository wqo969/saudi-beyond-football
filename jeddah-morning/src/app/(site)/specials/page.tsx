import type { Metadata } from "next";
import Link from "next/link";
import { CoverFrame } from "@/components/magazine/CoverFrame";
import { getAllPlans, listVisibleIssues } from "@/lib/content";
import { SPECIAL_EDITIONS } from "@/lib/personas";

export const metadata: Metadata = { title: "الأعداد الخاصة" };

export default async function SpecialsPage() {
  const [issues, plans] = await Promise.all([listVisibleIssues(), getAllPlans()]);
  const specials = issues.filter((i) => i.edition === "special");
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">الأعداد الخاصة</h1>
      {specials.length === 0 ? (
        <p className="mt-4 text-muted">لا توجد أعداد خاصة منشورة بعد.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {specials.map((i) => (
            <li key={i.slug}><Link href={`/issue/${i.slug}`}><CoverFrame issue={i} plan={plans.get(i.slug)!} scale={0.42} /><p className="mt-2 text-sm font-semibold">{plans.get(i.slug)!.identity.name}<span className="sr-only"> — {i.title}</span></p></Link></li>
          ))}
        </ul>
      )}
      <h2 className="mt-10 font-[family-name:var(--font-display)] text-2xl font-bold">سلسلة الأعداد الخاصة</h2>
      <p className="text-sm text-muted">هويات جاهزة في المحرك؛ تظهر حين يُنشر عدد منها.</p>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SPECIAL_EDITIONS.map((s) => (
          <li key={s.key} className="border border-rule p-3">
            <p className="latin-caps text-gold">{s.latin}</p>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold">{s.name}</p>
            <p className="text-xs text-muted">{specials.some((i) => i.special === s.key) ? "منشور" : "لم يصدر بعد"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
