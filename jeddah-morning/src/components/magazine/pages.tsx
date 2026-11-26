import { editionName, formatArabicDate, toArabicDigits } from "@/lib/dates";
import { articleById } from "@/lib/engine/planner";
import { SECTIONS } from "@/lib/sections";
import { Art, SectionArt } from "../SectionArt";
import { ContentsLink } from "./ContentsLink";
import { Folio, RunningHead, type PageProps } from "./parts";
import { SurpriseView } from "./SurpriseView";

const title = "font-[family-name:var(--font-display)] font-bold";

/** First page index of every article in the plan. */
function pageIndex(p: PageProps): { id: string; page: number }[] {
  const seen = new Set<string>();
  const out: { id: string; page: number }[] = [];
  p.plan.pages.forEach((pg, i) => {
    if (pg.articleId && !seen.has(pg.articleId)) {
      seen.add(pg.articleId);
      out.push({ id: pg.articleId, page: i });
    }
  });
  return out;
}

export function Contents(p: PageProps) {
  const entries = pageIndex(p).map((e) => ({ ...e, a: articleById(p.issue, e.id)! }));
  const href = (n: number) => `/issue/${p.issue.slug}/read?p=${n}`;
  const surpriseAt = p.plan.pages.findIndex((x) => x.kind === "surprise");
  const v = p.plan.contentsVariant;
  return (
    <article className="mag-page min-h-full bg-paper text-ink" aria-label="الفهرس">
      <RunningHead issue={p.issue} plan={p.plan} />
      <div className="px-6 pt-8">
        <p className="latin-caps text-accent">Contents</p>
        <h2 className={`${title} mt-1 text-5xl`}>في هذا العدد</h2>
        <p className="mt-2 text-sm text-muted">{p.plan.identity.name} · {formatArabicDate(p.issue.date)} · {toArabicDigits(p.total)} صفحة</p>
        <div className="rule-double my-5" />
        {v === "list" && (
          <ol className="divide-y divide-rule">
            {entries.map(({ a, page }) => (
              <li key={a.id}>
                <ContentsLink href={href(page)} page={page} className="grid grid-cols-[2.5rem_1fr] items-baseline gap-3 py-3">
                  <span className="font-[family-name:var(--font-latin)] text-xl text-accent">{toArabicDigits(String(page + 1).padStart(2, "0"))}</span>
                  <span><span className="kicker block !text-accent">{SECTIONS[a.section].name}</span><span className={`${title} text-lg leading-8`}>{a.title}</span></span>
                </ContentsLink>
              </li>
            ))}
          </ol>
        )}
        {v === "grid" && (
          <ol className="grid grid-cols-2 gap-3">
            {entries.map(({ a, page }, i) => (
              <li key={a.id} className={i === 0 ? "col-span-2" : ""}>
                <ContentsLink href={href(page)} page={page} className="block">
                  <SectionArt section={a.section} seed={a.id} palette={p.plan.palette} variant="thumb" className={i === 0 ? "aspect-[16/9]" : "aspect-[4/3]"} />
                  <span className="mt-1 flex items-baseline gap-2"><span className="font-[family-name:var(--font-latin)] text-accent">{toArabicDigits(page + 1)}</span><span className="kicker !text-accent">{SECTIONS[a.section].name}</span></span>
                  <span className={`${title} block text-base leading-7`}>{a.title}</span>
                </ContentsLink>
              </li>
            ))}
          </ol>
        )}
        {v === "numbers" && (
          <ol className="space-y-5">
            {entries.map(({ a, page }) => (
              <li key={a.id}>
                <ContentsLink href={href(page)} page={page} className="flex items-center gap-4">
                  <span className="w-16 shrink-0 text-end font-[family-name:var(--font-latin)] text-5xl leading-none text-accent">{toArabicDigits(page + 1)}</span>
                  <span className="border-s border-rule ps-4"><span className={`${title} block text-lg leading-8`}>{a.title}</span><span className="text-xs text-muted">{SECTIONS[a.section].name}</span></span>
                </ContentsLink>
              </li>
            ))}
          </ol>
        )}
        {surpriseAt >= 0 && (
          <ContentsLink href={href(surpriseAt)} page={surpriseAt} className="mt-6 flex items-center justify-between rounded-md bg-accent px-4 py-3 text-on-accent">
            <span className="font-semibold">✦ مفاجأة العدد</span><span className="font-[family-name:var(--font-latin)]">{toArabicDigits(surpriseAt + 1)}</span>
          </ContentsLink>
        )}
      </div>
      <Folio pageNo={p.pageNo} total={p.total} />
    </article>
  );
}

export function Letter(p: PageProps) {
  const l = p.issue.editorsLetter!;
  return (
    <article className="mag-page min-h-full bg-paper-2 text-ink" aria-label="افتتاحية العدد">
      <RunningHead issue={p.issue} plan={p.plan} />
      <div className="mx-auto max-w-2xl px-6 pt-10">
        <p className="latin-caps text-accent">Editor&rsquo;s Letter · الافتتاحية</p>
        <h2 className={`${title} mt-3 text-4xl leading-[1.45]`}>{l.title}</h2>
        <div className={`prose-mag mt-6 ${p.variant === 1 ? "text-center" : ""}`}>
          {l.body.map((t, i) => <p key={i}>{t}</p>)}
        </div>
        {l.signature && <p className="mt-8 font-[family-name:var(--font-display)] text-2xl text-accent">— {l.signature}</p>}
      </div>
      <Folio pageNo={p.pageNo} total={p.total} />
    </article>
  );
}

export function SurprisePage(p: PageProps) {
  const s = p.issue.surprise!;
  const labels: Record<string, string> = { wallpaper: "خلفية حصرية", quiz: "اختبار ترفيهي", challenge: "تحدٍّ قصير", reflection: "أسئلة للتأمل", card: "بطاقة رقمية", facts: "حقائق" };
  return (
    <article className="mag-page relative isolate min-h-full text-ink" aria-label="مفاجأة العدد">
      <div className="absolute inset-0 -z-10 bg-paper" />
      <RunningHead issue={p.issue} plan={p.plan} />
      <div className="mx-auto max-w-xl px-6 pt-8">
        <p className="latin-caps text-accent">Surprise · مفاجأة العدد</p>
        <p className="mt-2 inline-block bg-accent px-2 py-0.5 text-xs text-on-accent">{labels[s.kind]}</p>
        <h2 className={`${title} mt-3 text-4xl leading-[1.45]`}>{s.title}</h2>
        {s.intro && <p className="mt-3 leading-8 text-muted">{s.intro}</p>}
        <div className="mt-6"><SurpriseView surprise={s} slug={p.issue.slug} palette={p.plan.palette} /></div>
      </div>
      <Folio pageNo={p.pageNo} total={p.total} />
    </article>
  );
}

export function Closing(p: PageProps) {
  const v = p.plan.closingVariant;
  const night = p.issue.edition === "evening";
  const line = p.issue.closingLine ?? (night ? "تصبح على خير، ونلقاك صباحًا." : "نلقاك في العدد القادم.");
  if (v === "canvas")
    return (
      <article className="relative isolate flex min-h-full flex-col items-center justify-end px-8 pb-16 text-center text-on-deep" aria-label="الخاتمة">
        <Art seed={p.issue.slug + "closing"} pattern={night ? "moon" : "dunes"} hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0 -z-10" />
        <p className={`${title} text-4xl leading-[1.5]`}>{line}</p>
        <p className="latin-caps mt-4 text-accent-light">{p.plan.identity.latin} · No. {p.issue.number}</p>
      </article>
    );
  if (v === "teaser")
    return (
      <article className="flex min-h-full flex-col justify-center bg-deep px-8 py-16 text-on-deep" aria-label="الخاتمة">
        <p className="latin-caps text-accent-light">Next</p>
        <h2 className={`${title} mt-3 text-5xl leading-[1.3]`}>العدد القادم</h2>
        <p className="mt-4 max-w-sm leading-8 opacity-85">{night ? "العدد الصباحي يصدر عند السابعة والنصف صباحًا بتوقيت السعودية." : "العدد المسائي JEDDAH AFTER DARK يصدر عند العاشرة والنصف مساءً."}</p>
        <a href="/next" className="mt-8 self-start rounded-full border border-accent-light px-5 py-2 text-sm text-accent-light">ماذا ينتظرك؟</a>
        <p className="mt-auto pt-10 text-xs opacity-60">{line}</p>
      </article>
    );
  return (
    <article className="flex min-h-full flex-col items-center justify-center bg-paper px-8 py-16 text-center text-ink" aria-label="الخاتمة">
      <span className="text-4xl text-accent">✦</span>
      <p className={`${title} mt-6 max-w-md text-3xl leading-[1.8]`}>{line}</p>
      <div className="rule-double mt-8 w-24" />
      <p className="latin-caps mt-4 text-accent">{p.plan.identity.latin}</p>
      <p className="mt-1 text-xs text-muted">{editionName(p.issue.edition)} · العدد {toArabicDigits(p.issue.number)}</p>
    </article>
  );
}
