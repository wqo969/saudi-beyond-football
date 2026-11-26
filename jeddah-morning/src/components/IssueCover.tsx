import Link from "next/link";
import { editionName, formatArabicDate, formatHijriDate, toArabicDigits } from "@/lib/dates";
import type { Issue } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";
import { DemoBadge } from "./DemoBadge";
import { SectionArt } from "./SectionArt";

/** Full-bleed editorial cover for an issue. */
export function IssueCover({ issue, priority = false, actions = true, fill = false }: { issue: Issue; priority?: boolean; actions?: boolean; fill?: boolean }) {
  const coverSection = issue.coverSection ?? issue.articles[0]?.section ?? "discovery";
  return (
    <article className={`relative isolate overflow-hidden ${fill ? "h-full" : ""} bg-forest-deep text-on-forest md:rounded-sm`} aria-label={`غلاف ${issue.title}`}>
      <SectionArt section={coverSection} seed={issue.slug} className="absolute inset-0 -z-10 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-black/30" />
      <div className={`flex flex-col px-5 pb-8 pt-6 md:px-10 ${fill ? "min-h-full" : "min-h-[78dvh] md:min-h-[640px]"}`}>
        {/* Masthead */}
        <div className="text-center">
          <div className="flex items-center justify-between text-[0.7rem] text-on-forest/80">
            <span>{formatHijriDate(issue.date)}</span>
            <span className="latin-caps text-gold">No. {issue.number}</span>
          </div>
          <div className="mt-3 border-y border-gold/60 py-2">
            <h2 className="font-[family-name:var(--font-display)] text-[3.4rem] font-bold leading-[1.1] md:text-7xl">صباح جدة</h2>
            <p className="latin-caps mt-3 text-gold">Jeddah Morning</p>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-on-forest/85">
            <span>{formatArabicDate(issue.date)}</span>
            <span>
              {editionName(issue.edition)} · العدد {toArabicDigits(issue.number)}
            </span>
          </div>
        </div>

        <div className="mt-auto max-w-2xl pt-16">
          <div className="mb-3 flex items-center gap-2">
            <span className="bg-gold px-2 py-0.5 text-xs font-semibold text-forest-deep">{SECTIONS[coverSection].name}</span>
            {issue.isDemo && <DemoBadge className="border-gold-soft/60 bg-black/30 text-gold-soft" />}
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.35] drop-shadow md:text-6xl md:leading-[1.25]">
            {issue.coverHeadline}
          </h1>
          {issue.coverDek && <p className="mt-3 font-[family-name:var(--font-body)] text-base leading-8 text-on-forest/90 md:text-lg">{issue.coverDek}</p>}
          {actions && (<div className="mt-6 flex flex-wrap gap-2">
            <Link href={`/issue/${issue.slug}/read`} prefetch={priority} className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-forest-deep hover:bg-gold-soft">
              اقرأ العدد
            </Link>
            <Link href={`/issue/${issue.slug}`} className="rounded-full border border-on-forest/50 px-5 py-2.5 text-sm hover:bg-white/10">
              الفهرس
            </Link>
            {issue.pdf && (
              <Link href={`/issue/${issue.slug}/pdf`} className="rounded-full border border-on-forest/50 px-5 py-2.5 text-sm hover:bg-white/10">
                نسخة PDF
              </Link>
            )}
          </div>)}
        </div>
      </div>
    </article>
  );
}
