import { editionName, formatArabicDate, formatHijriDate, toArabicDigits } from "@/lib/dates";
import { articleById, heroImage } from "@/lib/engine/planner";
import { SECTIONS } from "@/lib/sections";
import { DemoBadge } from "../DemoBadge";
import { Art, SectionArt } from "../SectionArt";
import type { PageProps } from "./parts";

function Masthead({ issue, plan, light = true, align = "center", size = "lg" }: PageProps & { light?: boolean; align?: "center" | "start"; size?: "lg" | "sm" }) {
  const night = issue.edition === "evening";
  const title = night ? "بعد الغروب" : "صباح جدة";
  const latin = night ? "JEDDAH AFTER DARK" : "JEDDAH MORNING";
  return (
    <div className={`${align === "center" ? "text-center" : "text-start"} ${light ? "text-on-deep" : "text-ink"}`}>
      <div className="flex items-center justify-between text-[0.66rem] opacity-80">
        <span>{formatHijriDate(issue.date)}</span>
        <span className="latin-caps">No. {issue.number}</span>
      </div>
      <div className={`mt-2 border-y py-2 ${light ? "border-accent-light/70" : "border-accent/70"}`}>
        <p className={`font-[family-name:var(--font-display)] font-bold leading-[1.1] ${size === "lg" ? "text-[3.2rem] md:text-7xl" : "text-3xl"}`}>{title}</p>
        <p className={`latin-caps mt-2 ${light ? "text-accent-light" : "text-accent"}`}>{latin}</p>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[0.7rem] opacity-90">
        <span>{formatArabicDate(issue.date)}</span>
        <span>{editionName(issue.edition)} · العدد {toArabicDigits(issue.number)}</span>
      </div>
      {(plan.persona || plan.special) && (
        <p className={`latin-caps mt-2 !tracking-[0.4em] ${light ? "text-accent-light" : "text-accent"}`}>{plan.identity.latin}</p>
      )}
    </div>
  );
}

function coverSection(p: PageProps) {
  return p.issue.coverSection ?? articleById(p.issue, p.issue.coverStory)?.section ?? p.issue.articles[0]?.section ?? "discovery";
}

function CoverLines({ issue, plan, light = false }: PageProps & { light?: boolean }) {
  // Secondary cover lines: three other stories, as on a newsstand cover.
  const lines = plan.order.filter((id) => id !== issue.coverStory).slice(0, 3).map((id) => articleById(issue, id)!);
  return (
    <ul className="space-y-1.5 text-sm">
      {lines.map((a) => (
        <li key={a.id} className={`border-s-2 ps-2 leading-6 ${light ? "border-accent-light" : "border-accent"}`}>
          <span className={`block text-[0.65rem] ${light ? "text-accent-light" : "text-accent"}`}>{SECTIONS[a.section].name}</span>
          {a.title}
        </li>
      ))}
    </ul>
  );
}

function Headline({ issue, className = "" }: { issue: PageProps["issue"]; className?: string }) {
  return (
    <>
      <h1 className={`font-[family-name:var(--font-display)] font-bold ${className}`}>{issue.coverHeadline}</h1>
      {issue.coverDek && <p className="mt-3 max-w-xl font-[family-name:var(--font-body)] text-base leading-8 opacity-90">{issue.coverDek}</p>}
    </>
  );
}

export function CoverFull(p: PageProps) {
  const section = coverSection(p);
  const img = heroImage(articleById(p.issue, p.issue.coverStory));
  return (
    <article className="relative isolate flex min-h-full flex-col bg-deep px-5 pb-8 pt-6 text-on-deep" aria-label="الغلاف">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element -- private media route
        <img src={img.src} alt={img.alt} className="absolute inset-0 -z-10 h-full w-full object-cover" />
      ) : (
        <SectionArt section={section} seed={p.issue.slug} palette={p.plan.palette} className="absolute inset-0 -z-10" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/15 to-black/35" />
      <Masthead {...p} />
      <div className="mt-auto pt-16">
        <div className="mb-3 flex items-center gap-2">
          <span className="bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">{SECTIONS[section].name}</span>
          {p.issue.isDemo && <DemoBadge className="border-white/50 bg-black/40 text-white" />}
        </div>
        <Headline issue={p.issue} className="text-4xl leading-[1.35] drop-shadow md:text-6xl" />
        {img && <p className="mt-3 text-[0.6rem] opacity-70">صورة الغلاف: {img.credit} · {img.license}</p>}
      </div>
    </article>
  );
}

export function CoverType(p: PageProps) {
  const words = p.issue.coverHeadline.split(" ");
  return (
    <article className="mag-page flex min-h-full flex-col bg-paper px-5 pb-8 pt-6 text-ink" aria-label="الغلاف">
      <Masthead {...p} light={false} size="sm" />
      <div className="my-auto py-10">
        <h1 className="display-xl">
          {words.map((w, i) => (
            <span key={i} className={i % 2 === (p.variant % 2) ? "text-accent" : ""}>{w} </span>
          ))}
        </h1>
        {p.issue.coverDek && <p className="mt-6 max-w-md border-t-4 border-accent pt-3 font-[family-name:var(--font-body)] leading-8">{p.issue.coverDek}</p>}
      </div>
      <div className="flex items-end justify-between gap-4">
        <CoverLines {...p} />
        {p.issue.isDemo && <DemoBadge />}
      </div>
    </article>
  );
}

export function CoverAbstract(p: PageProps) {
  const patterns = ["orbits", "blocks", "mashrabiya"] as const;
  return (
    <article className="relative isolate flex min-h-full flex-col px-5 pb-8 pt-6 text-on-deep" aria-label="الغلاف">
      <Art seed={p.issue.slug + "abs"} pattern={patterns[p.variant % 3]} hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0 -z-10" />
      <Masthead {...p} />
      <div className="mt-auto pt-10">
        <div className="bg-paper p-5 text-ink shadow-2xl md:max-w-lg">
          <p className="kicker !text-accent">{SECTIONS[coverSection(p)].name}</p>
          <Headline issue={p.issue} className="mt-1 text-3xl leading-[1.4]" />
          {p.issue.isDemo && <DemoBadge className="mt-3" />}
        </div>
      </div>
    </article>
  );
}

export function CoverSplit(p: PageProps) {
  const section = coverSection(p);
  return (
    <article className="grid min-h-full grid-rows-[minmax(16rem,1fr)_auto] bg-paper text-ink" aria-label="الغلاف">
      <div className="relative">
        <SectionArt section={section} seed={p.issue.slug + "split"} palette={p.plan.palette} variant="thumb" pattern={(["arches", "dunes", "stars"] as const)[p.variant % 3]} className="absolute inset-0" />
        <div className="absolute inset-x-5 top-6"><Masthead {...p} /></div>
      </div>
      <div className="flex flex-col px-5 py-6">
        <span className="self-start bg-accent px-2 py-0.5 text-xs font-semibold text-on-accent">{SECTIONS[section].name}</span>
        <Headline issue={p.issue} className="mt-3 text-3xl leading-[1.4] md:text-5xl" />
        <div className="mt-auto pt-5"><CoverLines {...p} /></div>
        {p.issue.isDemo && <DemoBadge className="mt-3 self-start" />}
      </div>
    </article>
  );
}

export function CoverNight(p: PageProps) {
  return (
    <article className="relative isolate flex min-h-full flex-col px-5 pb-8 pt-6 text-on-deep" aria-label="الغلاف">
      <Art seed={p.issue.slug + "night"} pattern="moon" hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0 -z-10" />
      <Masthead {...p} />
      <div className="mt-auto pt-16">
        <p className="latin-caps text-accent-light">Tonight</p>
        <Headline issue={p.issue} className="mt-2 text-4xl leading-[1.4] md:text-6xl" />
        <div className="mt-5 text-on-deep/90"><CoverLines {...p} light /></div>
        {p.issue.isDemo && <DemoBadge className="mt-3 border-white/50 bg-black/40 text-white" />}
      </div>
    </article>
  );
}
