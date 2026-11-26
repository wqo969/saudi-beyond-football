import type { Metadata } from "next";
import Link from "next/link";
import { SurpriseView } from "@/components/magazine/SurpriseView";
import { getAllPlans, listVisibleIssues } from "@/lib/content";
import { formatShortArabicDate } from "@/lib/dates";

export const metadata: Metadata = { title: "الهدايا الرقمية" };

export default async function GiftsPage() {
  const [issues, plans] = await Promise.all([listVisibleIssues(), getAllPlans()]);
  const gifts = issues.filter((i) => i.surprise && (i.surprise.kind === "wallpaper" || i.surprise.kind === "card"));
  return (
    <div className="px-4 pt-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">الهدايا الرقمية</h1>
      <p className="mt-1 text-sm text-muted">خلفيات وبطاقات حصرية من الأعداد المنشورة، تُولَّد على جهازك بدقة عالية.</p>
      {gifts.length === 0 && <p className="py-12 text-center text-muted">لا هدايا منشورة بعد.</p>}
      <ul className="mt-6 grid gap-8 sm:grid-cols-2">
        {gifts.map((i) => {
          const plan = plans.get(i.slug)!;
          return (
            <li key={i.slug} className={`jm-p-${plan.palette.id} rounded-lg p-4`}>
              <p className="text-xs text-muted"><Link href={`/issue/${i.slug}`}>{formatShortArabicDate(i.date)} · {i.title}</Link></p>
              <p className="mb-4 font-[family-name:var(--font-display)] text-xl font-bold">{i.surprise!.title}</p>
              <SurpriseView surprise={i.surprise!} slug={i.slug} palette={plan.palette} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
