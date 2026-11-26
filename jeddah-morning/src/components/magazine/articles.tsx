import { toArabicDigits } from "@/lib/dates";
import type { Block } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";
import { ArticleBody, BlockView, EditorialImage, Sources } from "../ArticleBody";
import { heroImage } from "@/lib/engine/planner";
import { Art, SectionArt } from "../SectionArt";
import { Byline, Dek, Folio, Kicker, RunningHead, type ArticlePageProps } from "./parts";

const find = <T extends Block["type"]>(p: ArticlePageProps, t: T) => p.article.body.find((b) => b.type === t) as Extract<Block, { type: T }> | undefined;
const title = "font-[family-name:var(--font-display)] font-bold";

function Shell({ p, children, light = false, className = "" }: { p: ArticlePageProps; children: React.ReactNode; light?: boolean; className?: string }) {
  return (
    <article className={`mag-page min-h-full ${className}`} aria-labelledby={`h-${p.article.id}-${p.part ?? 0}`}>
      <RunningHead issue={p.issue} plan={p.plan} article={p.article} light={light} />
      {children}
      <Folio pageNo={p.pageNo} total={p.total} light={light} />
    </article>
  );
}

const H = ({ p, className }: { p: ArticlePageProps; className: string }) => (
  <h2 id={`h-${p.article.id}-${p.part ?? 0}`} className={`${title} ${className}`}>{p.article.title}</h2>
);

// 4. Two columns — art position varies (top / inset / none)
export function TwoColumn(p: ArticlePageProps) {
  const img = heroImage(p.article);
  return (
    <Shell p={p} className="bg-paper text-ink">
      {img && <EditorialImage b={img} className="!my-0" />}
      {!img && p.variant === 0 && <SectionArt section={p.article.section} seed={p.article.id} palette={p.plan.palette} variant="thumb" className="h-48 md:h-64" />}
      <div className="px-6 pt-6">
        <Kicker article={p.article} />
        <H p={p} className="mt-1 text-3xl leading-[1.5] md:text-4xl" />
        <Dek article={p.article} />
        <Byline issue={p.issue} article={p.article} />
        {p.variant === 1 && <SectionArt section={p.article.section} seed={p.article.id} palette={p.plan.palette} variant="thumb" className="float-left my-4 me-0 ms-4 aspect-square w-2/5" />}
        <div className="cols-2 mt-5">
          <ArticleBody article={p.article} lead={p.variant !== 2} omit={img ? ["image"] : []} />
        </div>
      </div>
    </Shell>
  );
}

// 5. Three columns — newspaper density on wide screens, single measured column on phones
export function ThreeColumn(p: ArticlePageProps) {
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-8">
        <div className="border-b-4 border-double border-ink pb-4 text-center">
          <Kicker article={p.article} className="justify-center" />
          <H p={p} className="mt-2 text-4xl leading-[1.45]" />
          <Dek article={p.article} className="mx-auto max-w-xl" />
        </div>
        <Byline issue={p.issue} article={p.article} />
        <div className="cols-3 mt-5 text-[0.95em]">
          <ArticleBody article={p.article} />
        </div>
      </div>
    </Shell>
  );
}

// 6. Photo story — art panels interleaved with paragraphs
export function PhotoStory(p: ArticlePageProps) {
  const patterns = ["dunes", "arches", "waves", "stars"] as const;
  let n = 0;
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-6">
        <Kicker article={p.article} />
        <H p={p} className="mt-1 text-3xl leading-[1.5]" />
        <Dek article={p.article} />
        <Byline issue={p.issue} article={p.article} />
      </div>
      <div className="prose-mag mt-4 space-y-5">
        {p.article.body.map((b, i) => {
          const panel = b.type === "p" && n++ % 2 === 0;
          return (
            <div key={i}>
              {panel && (
                <figure className="mb-4">
                  <Art seed={`${p.article.id}-${i}`} pattern={patterns[(i + p.variant) % 4]} hue={p.plan.palette.artHue} palette={p.plan.palette} className={i % 4 === 0 ? "aspect-[4/3]" : "mx-6 aspect-[16/9]"} />
                  <figcaption className="mx-6 mt-1 font-[family-name:var(--font-ui)] text-xs text-muted">لوحة {toArabicDigits(n)} — رسم أصلي مولّد</figcaption>
                </figure>
              )}
              <div className="px-6"><BlockView b={b} article={p.article} index={i} /></div>
            </div>
          );
        })}
        <div className="px-6"><Sources article={p.article} /></div>
      </div>
    </Shell>
  );
}

// 7. Double-page spread: part 0 = full art + giant title, part 1 = text
export function Spread(p: ArticlePageProps) {
  const img = heroImage(p.article);
  if ((p.part ?? 0) === 0)
    return (
      <article className="relative isolate flex min-h-full flex-col justify-end bg-deep px-6 pb-10 text-on-deep" aria-labelledby={`h-${p.article.id}-0`}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- private media route
          <img src={img.src} alt={img.alt} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        ) : (
          <SectionArt section={p.article.section} seed={p.article.id + "spread"} palette={p.plan.palette} className="absolute inset-0 -z-10" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        <Kicker article={p.article} className="!text-accent-light [&_*]:!text-accent-light" />
        <h2 id={`h-${p.article.id}-0`} className={`${title} mt-2 text-5xl leading-[1.3] md:text-7xl`}>{p.article.title}</h2>
        <Dek article={p.article} />
        {img && <p className="mt-3 text-[0.6rem] opacity-70">الصورة: {img.credit} · {img.license}</p>}
        <p className="mt-6 text-xs opacity-70">← تابع في الصفحة التالية</p>
        <Folio pageNo={p.pageNo} total={p.total} light />
      </article>
    );
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-6">
        <p className={`${title} text-xl text-accent`}>{p.article.title}</p>
        <Byline issue={p.issue} article={p.article} />
        <div className="cols-2 mt-5"><ArticleBody article={p.article} omit={img ? ["image"] : []} /></div>
      </div>
    </Shell>
  );
}

// 8. Investigation — numbered chapters + dossier box
export function Investigation(p: ArticlePageProps) {
  let chapter = 0;
  return (
    <Shell p={p} className="bg-paper-2 text-ink">
      <div className="px-6 pt-6">
        <p className="latin-caps text-accent">Investigation · تحقيق</p>
        <H p={p} className="mt-2 text-4xl leading-[1.45]" />
        <Dek article={p.article} />
        <Byline issue={p.issue} article={p.article} />
        <div className="prose-mag mt-6">
          {p.article.body.map((b, i) =>
            b.type === "h" ? (
              <div key={i} className="mt-8 flex items-baseline gap-3 border-t border-ink pt-3">
                <span className="font-[family-name:var(--font-latin)] text-4xl text-accent">{toArabicDigits(++chapter)}</span>
                <h3 className={`${title} text-xl`}>{b.text}</h3>
              </div>
            ) : (
              <BlockView key={i} b={b} article={p.article} index={i} />
            ),
          )}
          <div className="mt-8 border-2 border-ink p-4 font-[family-name:var(--font-ui)] text-sm">
            <p className="font-semibold">ملف التحقيق</p>
            <p className="mt-1 text-muted">{p.article.sources.length ? `${toArabicDigits(p.article.sources.length)} مصادر موثقة أدناه` : "لا مصادر — مادة تجريبية لا تُعامل كحقائق"}</p>
          </div>
          <Sources article={p.article} />
        </div>
      </div>
    </Shell>
  );
}

// 9. Interview (documented Q&A)
export function Interview(p: ArticlePageProps) {
  const qa = find(p, "qa");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="grid gap-0 md:grid-cols-[1fr_1.4fr]">
        <div className="relative min-h-56 bg-deep">
          <Art seed={p.article.id + "portrait"} pattern="rings" hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0" />
          <p className="absolute bottom-3 end-4 font-[family-name:var(--font-ui)] text-[0.65rem] text-on-deep/80">رسم تعبيري — ليس صورة شخص حقيقي</p>
        </div>
        <div className="px-6 pt-6">
          <p className="latin-caps text-accent">The Interview · مقابلة</p>
          <H p={p} className="mt-2 text-3xl leading-[1.5]" />
          <Dek article={p.article} />
          <Byline issue={p.issue} article={p.article} />
        </div>
      </div>
      <div className="prose-mag px-6 pt-4">
        {p.article.body.filter((b) => b.type !== "qa").map((b, i) => <BlockView key={i} b={b} article={p.article} index={i} />)}
        {qa?.items.map((x, j) => (
          <div key={j} className="mt-6">
            <p className={`${title} text-[1.25em] leading-9 text-accent`}>{x.q}</p>
            <p className="mt-2">{x.a}</p>
          </div>
        ))}
        <Sources article={p.article} />
      </div>
    </Shell>
  );
}

// 10. Infographic — big numbers + bars
export function Infographic(p: ArticlePageProps) {
  const stats = find(p, "stats");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-6">
        <Kicker article={p.article} />
        <H p={p} className="mt-1 text-3xl leading-[1.5]" />
        <Dek article={p.article} />
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-px bg-rule">
            {stats.items.map((s, i) => (
              <div key={i} className="bg-paper p-4">
                <p className="font-[family-name:var(--font-latin)] text-5xl leading-none text-accent">{s.value}</p>
                <p className="mt-2 text-sm font-semibold">{s.label}</p>
                {s.note && <p className="text-xs text-muted">{s.note}</p>}
                <div className="mt-3 h-1.5 bg-paper-2"><div className="h-full bg-accent" style={{ width: `${30 + ((i * 23 + p.variant * 17) % 60)}%` }} /></div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 text-[0.65rem] text-muted">الأشرطة زخرفية ما لم ترتبط بقيم حقيقية.</p>
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["stats"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// 11. Timeline
export function Timeline(p: ArticlePageProps) {
  const tl = find(p, "timeline");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-6">
        <Kicker article={p.article} />
        <H p={p} className="mt-1 text-3xl leading-[1.5]" />
        <Dek article={p.article} />
        {tl && (
          <ol className="relative mt-8 border-s-2 border-accent">
            {tl.items.map((t, i) => (
              <li key={i} className="relative mb-6 ps-6">
                <span className="absolute -start-[0.55rem] top-1 size-4 rounded-full border-4 border-paper bg-accent" />
                <p className="font-[family-name:var(--font-latin)] text-sm text-accent">{t.when}</p>
                <p className={`${title} text-lg leading-8`}>{t.text}</p>
              </li>
            ))}
          </ol>
        )}
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["timeline"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// 12. Opinion column
export function Opinion(p: ArticlePageProps) {
  const initials = (p.article.author ?? "ر").trim().charAt(0);
  const pull = find(p, "quote");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-8">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-accent font-[family-name:var(--font-display)] text-3xl text-on-accent">{initials}</span>
          <div>
            <p className="latin-caps text-accent">Opinion · رأي</p>
            <p className="text-sm text-muted">{p.article.author}</p>
          </div>
        </div>
        <H p={p} className="mt-5 text-4xl italic leading-[1.45]" />
        <Dek article={p.article} />
        <Byline issue={p.issue} article={p.article} />
        {pull && <p className={`${title} my-6 border-s-4 border-accent ps-4 text-2xl leading-[1.7]`}>«{pull.text}»</p>}
        <ArticleBody article={p.article} omit={["quote"]} />
        <p className="mt-6 border-t border-rule pt-2 text-xs text-muted">مقال رأي يعبّر عن كاتبه ولا يُقدَّم كخبر.</p>
      </div>
    </Shell>
  );
}

// 13. Fashion lookbook
export function Fashion(p: ArticlePageProps) {
  const gallery = find(p, "gallery");
  const looks = gallery?.items ?? [{ caption: "إطلالة" }, { caption: "تفصيلة" }];
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-6 text-center">
        <p className="latin-caps text-accent">Fashion &amp; Style</p>
        <H p={p} className="mt-3 text-4xl leading-[1.4]" />
        <Dek article={p.article} className="mx-auto max-w-lg" />
      </div>
      <div className={`mt-6 grid gap-2 px-2 ${p.variant === 1 ? "grid-cols-3" : "grid-cols-2"}`}>
        {looks.map((l, i) => (
          <figure key={i} className={i === 0 && p.variant !== 1 ? "col-span-2" : ""}>
            <Art seed={l.seed ?? `${p.article.id}-look-${i}`} pattern={(["arches", "stripes", "mashrabiya"] as const)[(i + p.variant) % 3]} hue={p.plan.palette.artHue} palette={p.plan.palette} className={i === 0 && p.variant !== 1 ? "aspect-[4/3]" : "aspect-[2/3]"} />
            <figcaption className="mt-1 px-1 font-[family-name:var(--font-ui)] text-[0.7rem] text-muted"><span className="font-[family-name:var(--font-latin)] text-accent">{String(i + 1).padStart(2, "0")}</span> {l.caption}</figcaption>
          </figure>
        ))}
      </div>
      <div className="px-6">
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["gallery"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// 14. Sports — scoreboard
export function Sports(p: ArticlePageProps) {
  const facts = find(p, "facts");
  const get = (label: string) => facts?.items.find((i) => i.label === label)?.value;
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="relative overflow-hidden bg-deep px-6 py-6 text-on-deep">
        <Art seed={p.article.id + "pitch"} pattern="stripes" hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0 opacity-60" />
        <div className="relative">
          <p className="latin-caps text-accent-light">Football Center</p>
          <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
            <p className={`${title} text-lg`}>{get("المضيف") ?? "الفريق (أ)"}</p>
            <p className="font-[family-name:var(--font-latin)] text-5xl">{get("النتيجة") ?? "— : —"}</p>
            <p className={`${title} text-lg`}>{get("الضيف") ?? "الفريق (ب)"}</p>
          </div>
        </div>
      </div>
      <div className="px-6 pt-5">
        <Kicker article={p.article} />
        <H p={p} className="mt-1 text-3xl uppercase leading-[1.5]" />
        <Dek article={p.article} />
        <Byline issue={p.issue} article={p.article} />
        <div className="cols-2 mt-4"><ArticleBody article={p.article} lead={false} /></div>
      </div>
    </Shell>
  );
}

// 15. Economy — financial-press table
export function Economy(p: ArticlePageProps) {
  const facts = find(p, "facts");
  const stats = find(p, "stats");
  const rows = facts?.items ?? stats?.items.map((s) => ({ label: s.label, value: s.value })) ?? [];
  return (
    <Shell p={p} className="bg-paper-2 text-ink">
      <div className="px-6 pt-6">
        <p className="latin-caps text-accent">Markets &amp; Economy</p>
        <H p={p} className="mt-2 text-3xl leading-[1.5]" />
        <Dek article={p.article} />
        <table className="mt-5 w-full border-t-2 border-ink font-[family-name:var(--font-ui)] text-sm">
          <caption className="sr-only">مؤشرات</caption>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-rule">
                <th scope="row" className="py-2 text-start font-normal">{r.label}</th>
                <td className="py-2 text-end font-[family-name:var(--font-latin)] text-base">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Byline issue={p.issue} article={p.article} />
        <div className="cols-2 mt-4"><ArticleBody article={p.article} omit={["facts", "stats"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// 16. Gallery grid
export function Gallery(p: ArticlePageProps) {
  const g = find(p, "gallery");
  return (
    <Shell p={p} className="bg-ink text-paper">
      <div className="px-6 pt-6" style={{ color: "var(--paper)" }}>
        <p className="latin-caps text-accent-light">Portfolio · معرض</p>
        <H p={p} className="mt-2 text-3xl leading-[1.5]" />
        <Dek article={p.article} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-1 px-1">
        {g?.items.map((it, i) => (
          <figure key={i} className={i % 3 === 0 ? "col-span-2" : ""}>
            <Art seed={it.seed ?? `${p.article.id}-g-${i}`} pattern={(["stars", "dunes", "orbits", "arches"] as const)[(i + p.variant) % 4]} hue={p.plan.palette.artHue + i * 12} palette={p.plan.palette} className={i % 3 === 0 ? "aspect-[16/10]" : "aspect-square"} />
            <figcaption className="px-2 py-1 font-[family-name:var(--font-ui)] text-[0.7rem] opacity-80" style={{ color: "var(--paper)" }}>{it.caption}</figcaption>
          </figure>
        ))}
      </div>
      <div className="bg-paper px-6 pt-4 text-ink">
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["gallery"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// 17. Travel guide
export function TravelGuide(p: ArticlePageProps) {
  const list = find(p, "list");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="relative h-56 overflow-hidden">
        <Art seed={p.article.id + "map"} pattern={p.variant === 1 ? "waves" : "grid"} hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0" />
        <div className="absolute bottom-4 start-6 bg-paper px-3 py-1 text-xs font-semibold">دليل · {SECTIONS[p.article.section].name}</div>
      </div>
      <div className="px-6 pt-5">
        <H p={p} className="text-3xl leading-[1.5]" />
        <Dek article={p.article} />
        {list && (
          <ol className="mt-5 space-y-3">
            {list.items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent font-[family-name:var(--font-latin)] text-sm text-on-accent">{i + 1}</span>
                <span className="pt-1 leading-7">{it}</span>
              </li>
            ))}
          </ol>
        )}
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["list"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// 18. Interactive (puzzles)
export function Interactive(p: ArticlePageProps) {
  return (
    <Shell p={p} className="bg-paper-2 text-ink">
      <div className="px-6 pt-8 text-center">
        <p className="font-[family-name:var(--font-latin)] text-7xl text-accent">?</p>
        <Kicker article={p.article} className="justify-center" />
        <H p={p} className="mt-1 text-4xl leading-[1.5]" />
        <Dek article={p.article} className="mx-auto max-w-md" />
      </div>
      <div className="mx-auto max-w-xl px-6"><ArticleBody article={p.article} lead={false} /></div>
      <div className="px-6"><Byline issue={p.issue} article={p.article} /></div>
    </Shell>
  );
}

// 19. Documented quotes wall
export function Quotes(p: ArticlePageProps) {
  const quotes = p.article.body.filter((b): b is Extract<Block, { type: "quote" }> => b.type === "quote");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-6">
        <Kicker article={p.article} />
        <H p={p} className="mt-1 text-3xl leading-[1.5]" />
        <Dek article={p.article} />
        <div className="mt-6 space-y-8">
          {quotes.map((q, i) => (
            <figure key={i} className={i % 2 ? "text-start" : "text-end"}>
              <blockquote className={`${title} text-[1.6em] leading-[1.7] ${i % 2 ? "text-accent" : ""}`}>«{q.text}»</blockquote>
              {q.cite && <figcaption className="mt-2 font-[family-name:var(--font-ui)] text-sm text-muted">— {q.cite}</figcaption>}
            </figure>
          ))}
        </div>
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["quote"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// Weather card (signature)
export function WeatherCard(p: ArticlePageProps) {
  const facts = find(p, "facts");
  const stats = find(p, "stats");
  const items = facts?.items ?? stats?.items.map((s) => ({ label: s.label, value: s.value })) ?? [];
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="relative overflow-hidden bg-deep px-6 pb-6 pt-8 text-on-deep">
        <Art seed={p.article.id + "sky"} pattern="waves" hue={p.plan.palette.artHue} palette={p.plan.palette} sun className="absolute inset-0 opacity-80" />
        <div className="relative">
          <p className="latin-caps text-accent-light">{SECTIONS[p.article.section].latin}</p>
          <H p={p} className="mt-2 text-3xl leading-[1.5]" />
          <div className="mt-6 grid grid-cols-3 gap-3">
            {items.slice(0, 6).map((f, i) => (
              <div key={i} className="rounded-md bg-black/25 p-3 backdrop-blur-sm">
                <p className="text-[0.65rem] opacity-80">{f.label}</p>
                <p className="font-[family-name:var(--font-latin)] text-xl">{f.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-6 pt-4">
        <Dek article={p.article} />
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["facts", "stats"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// Briefing — numbered digest
export function Briefing(p: ArticlePageProps) {
  const list = find(p, "list");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="px-6 pt-6">
        <div className="flex items-end justify-between border-b-4 border-ink pb-2">
          <H p={p} className="text-3xl leading-[1.5]" />
          <span className="latin-caps text-accent">Briefing</span>
        </div>
        <Dek article={p.article} />
        <ol className="mt-4">
          {list?.items.map((it, i) => (
            <li key={i} className="grid grid-cols-[2.5rem_1fr] gap-2 border-b border-rule py-3">
              <span className="font-[family-name:var(--font-latin)] text-2xl text-accent">{toArabicDigits(i + 1)}</span>
              <span className={`${title} text-lg leading-8`}>{it}</span>
            </li>
          ))}
        </ol>
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["list"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// Song of the day — record sleeve
export function Record(p: ArticlePageProps) {
  const facts = find(p, "facts");
  return (
    <Shell p={p} className="bg-paper text-ink">
      <div className="flex flex-col items-center px-6 pt-8">
        <div className="relative aspect-square w-64 max-w-full">
          <Art seed={p.article.id + "sleeve"} pattern={(["rings", "waves", "dots"] as const)[p.variant]} hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0 shadow-2xl" />
          <div className="absolute -end-10 top-1/2 size-40 -translate-y-1/2 rounded-full bg-[repeating-radial-gradient(circle,#111_0,#111_2px,#222_3px,#111_4px)] shadow-xl motion-safe:animate-[spin_8s_linear_infinite]" aria-hidden="true">
            <span className="absolute inset-[38%] rounded-full bg-accent" />
          </div>
        </div>
        <p className="latin-caps mt-8 text-accent">Song of the Day</p>
        <H p={p} className="mt-2 text-center text-3xl leading-[1.5]" />
        <Dek article={p.article} className="text-center" />
        {facts && (
          <dl className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
            {facts.items.map((f, i) => (<div key={i} className="text-center"><dt className="text-xs text-muted">{f.label}</dt><dd className="font-semibold">{f.value}</dd></div>))}
          </dl>
        )}
      </div>
      <div className="px-6">
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["facts"]} lead={false} /></div>
      </div>
    </Shell>
  );
}

// Watchlist — tickets
export function Ticket(p: ArticlePageProps) {
  const facts = find(p, "facts");
  return (
    <Shell p={p} className="bg-paper-2 text-ink">
      <div className="px-6 pt-6">
        <p className="latin-caps text-accent">Watchlist Radar</p>
        <H p={p} className="mt-2 text-3xl leading-[1.5]" />
        <Dek article={p.article} />
        <div className="mt-5 flex overflow-hidden rounded-lg bg-paper shadow-lg">
          <div className="relative w-28 shrink-0 bg-deep"><Art seed={p.article.id + "poster"} pattern="stars" hue={p.plan.palette.artHue} palette={p.plan.palette} className="absolute inset-0" /></div>
          <dl className="grid flex-1 grid-cols-2 gap-2 border-s-2 border-dashed border-rule p-4 text-sm">
            {facts?.items.map((f, i) => (<div key={i}><dt className="text-[0.65rem] text-muted">{f.label}</dt><dd className="font-semibold">{f.value}</dd></div>))}
          </dl>
        </div>
        <Byline issue={p.issue} article={p.article} />
        <div className="mt-4"><ArticleBody article={p.article} omit={["facts"]} lead={false} /></div>
      </div>
    </Shell>
  );
}
