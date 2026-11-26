import type { Metadata } from "next";
import Link from "next/link";
import { CoverFrame } from "@/components/magazine/CoverFrame";
import { getAllPlans, listVisibleIssues } from "@/lib/content";
import { formatShortArabicDate } from "@/lib/dates";
import { layoutById } from "@/lib/engine/layouts";

export const metadata: Metadata = { title: "أرشيف الأغلفة" };

export default async function CoversPage() {
  const [issues, plans] = await Promise.all([listVisibleIssues(), getAllPlans()]);
  return (
    <div className="px-4 pt-6">
      <p className="latin-caps text-gold">The Covers</p>
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">أرشيف الأغلفة</h1>
      <p className="mt-1 text-sm text-muted">كل غلاف صُمم ليختلف عمّا قبله.</p>
      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {issues.map((i) => {
          const plan = plans.get(i.slug)!;
          return (
            <li key={i.slug}>
              <Link href={`/issue/${i.slug}`}>
                <CoverFrame issue={i} plan={plan} scale={0.42} />
                <p className="mt-2 text-sm font-semibold">{formatShortArabicDate(i.date)} · {plan.identity.name}<span className="sr-only"> — {i.title}</span></p>
                <p className="text-xs text-muted">{layoutById(plan.coverLayout)?.name} · {plan.palette.name}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
