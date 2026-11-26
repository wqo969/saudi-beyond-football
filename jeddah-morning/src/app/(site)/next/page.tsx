import type { Metadata } from "next";
import Link from "next/link";
import { listAllIssues } from "@/lib/content";
import { addDays, formatArabicDate, riyadhDateKey, riyadhMinutes } from "@/lib/dates";
import { EVENING_IDENTITY, personaForDate } from "@/lib/personas";
import { isVisible } from "@/lib/publishing";

export const metadata: Metadata = { title: "العدد القادم" };

/** Teaser: announces WHEN the next issue lands and its editorial persona — never its (unwritten) content. */
export default async function NextPage() {
  const today = riyadhDateKey();
  const m = riyadhMinutes();
  const slots: { date: string; edition: "morning" | "evening"; time: string }[] = [];
  for (let d = 0; d < 3; d++) {
    const date = addDays(today, d);
    if (d > 0 || m < 7 * 60 + 30) slots.push({ date, edition: "morning", time: "٧:٣٠ صباحًا" });
    if (d > 0 || m < 22 * 60 + 30) slots.push({ date, edition: "evening", time: "١٠:٣٠ مساءً" });
  }
  const next = slots[0];
  const all = await listAllIssues();
  const ready = all.some((i) => i.date === next.date && i.edition === next.edition && !isVisible(i) && (i.status === "scheduled" || i.status === "approved"));
  const persona = personaForDate(next.date);
  const identity = next.edition === "evening" ? { latin: EVENING_IDENTITY.latin, name: EVENING_IDENTITY.name, tagline: EVENING_IDENTITY.tagline } : persona;
  return (
    <div className="grid min-h-[70dvh] place-items-center bg-forest px-6 py-16 text-center text-on-forest">
      <div className="max-w-md">
        <p className="latin-caps text-gold">Next Issue</p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold leading-tight">{identity.latin}</h1>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">{identity.name}</p>
        <p className="mt-4 leading-8 text-on-forest/80">{identity.tagline}</p>
        <p className="mt-8 text-lg">{formatArabicDate(next.date)} · {next.time}</p>
        <p className="mt-2 text-xs text-on-forest/60">{ready ? "العدد جاهز ومجدول للنشر." : "لم يُجهّز العدد بعد."} لا نكشف المحتوى قبل صدوره، ولا نخترعه.</p>
        <Link href="/" className="mt-8 inline-block rounded-full bg-gold px-6 py-2 text-sm font-semibold text-forest-deep">عدد اليوم</Link>
      </div>
    </div>
  );
}
