import type { Article, Block, BlockType } from "@/lib/schema";
import { PuzzleBlock } from "./PuzzleBlock";
import { Art } from "./SectionArt";
import { SECTIONS } from "@/lib/sections";

export function ArticleBody({ article, lead = true, omit = [], className = "" }: { article: Article; lead?: boolean; omit?: BlockType[]; className?: string }) {
  const blocks = article.body.filter((b) => !omit.includes(b.type));
  return (
    <div className={`prose-mag ${lead ? "dropcap" : ""} ${className}`}>
      {blocks.map((b, i) => (
        <BlockView key={i} b={b} article={article} index={i} />
      ))}
      <Sources article={article} />
    </div>
  );
}

export function Sources({ article }: { article: Article }) {
  if (article.sources.length === 0) return null;
  return (
    <footer className="mt-10 break-inside-avoid border-t border-rule pt-4 font-[family-name:var(--font-ui)] text-sm text-muted [column-span:all]">
      <p className="font-semibold">المصادر</p>
      <ul className="mt-1 space-y-1">
        {article.sources.map((s, i) => (
          <li key={i}>
            {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name}</a> : s.name}
            {s.publishedAt && <span> · {s.publishedAt}</span>}
          </li>
        ))}
      </ul>
    </footer>
  );
}

export function BlockView({ b, article, index }: { b: Block; article: Article; index: number }) {
  switch (b.type) {
    case "p":
      return <p>{b.text}</p>;
    case "h":
      return <h2>{b.text}</h2>;
    case "quote":
      return (
        <blockquote className="my-8 break-inside-avoid border-y border-gold/60 py-5 text-center font-[family-name:var(--font-display)] text-[1.5em] leading-[1.8] text-gold [column-span:all]">
          «{b.text}»{b.cite && <footer className="mt-2 font-[family-name:var(--font-ui)] text-sm text-muted">— {b.cite}</footer>}
        </blockquote>
      );
    case "list":
      return (
        <ul className="my-4 list-disc space-y-1 ps-6 marker:text-gold">
          {b.items.map((it, j) => <li key={j}>{it}</li>)}
        </ul>
      );
    case "facts":
      return (
        <aside className="my-6 break-inside-avoid border-s-4 border-gold bg-paper-2 p-4 font-[family-name:var(--font-ui)]">
          {b.title && <p className="mb-2 text-sm font-semibold text-gold">{b.title}</p>}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            {b.items.map((f, j) => (
              <div key={j}>
                <dt className="text-muted">{f.label}</dt>
                <dd className="text-base font-semibold">{f.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      );
    case "stats":
      return (
        <aside className="my-6 break-inside-avoid font-[family-name:var(--font-ui)]">
          {b.title && <p className="mb-2 text-sm font-semibold text-gold">{b.title}</p>}
          <div className="grid grid-cols-2 gap-3">
            {b.items.map((s, j) => (
              <div key={j} className="border-t-2 border-gold pt-2">
                <p className="font-[family-name:var(--font-latin)] text-3xl">{s.value}</p>
                <p className="text-sm">{s.label}</p>
                {s.note && <p className="text-xs text-muted">{s.note}</p>}
              </div>
            ))}
          </div>
        </aside>
      );
    case "timeline":
      return (
        <ol className="my-6 break-inside-avoid border-s-2 border-gold ps-5 font-[family-name:var(--font-ui)]">
          {b.title && <li className="mb-2 list-none text-sm font-semibold text-gold">{b.title}</li>}
          {b.items.map((t, j) => (
            <li key={j} className="relative mb-3 list-none">
              <span className="absolute -start-[1.72rem] top-2 size-3 rounded-full bg-gold" />
              <span className="block text-xs font-semibold text-gold">{t.when}</span>
              <span className="block text-base">{t.text}</span>
            </li>
          ))}
        </ol>
      );
    case "qa":
      return (
        <div className="my-6 space-y-5">
          {b.items.map((x, j) => (
            <div key={j} className="break-inside-avoid">
              <p className="font-[family-name:var(--font-ui)] font-semibold text-gold">س: {x.q}</p>
              <p className="mt-1">ج: {x.a}</p>
            </div>
          ))}
        </div>
      );
    case "gallery":
      return (
        <div className="my-6 grid grid-cols-2 gap-3 [column-span:all]">
          {b.items.map((g, j) => (
            <figure key={j} className="break-inside-avoid">
              <Art seed={g.seed ?? `${article.id}-${index}-${j}`} pattern={(["arches", "stars", "dunes", "mashrabiya"] as const)[j % 4]} hue={SECTIONS[article.section].hue} className="aspect-[3/4]" />
              <figcaption className="mt-1 font-[family-name:var(--font-ui)] text-xs text-muted">{g.caption}</figcaption>
            </figure>
          ))}
        </div>
      );
    case "puzzle":
      return <PuzzleBlock question={b.question} hint={b.hint} answer={b.answer} explanation={b.explanation} />;
    case "image":
      return <EditorialImage b={b} />;
    case "link":
      return (
        <p>
          <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-4">{b.label} ↗</a>
        </p>
      );
  }
}

export function EditorialImage({ b, className = "" }: { b: Extract<Block, { type: "image" }>; className?: string }) {
  return (
    <figure className={`my-6 break-inside-avoid [column-span:all] ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- private, authenticated media route; next/image optimizer would cache it publicly */}
      <img src={b.src} alt={b.alt} loading="lazy" decoding="async" className="w-full bg-paper-2 object-cover" />
      <figcaption className="mt-1 font-[family-name:var(--font-ui)] text-xs text-muted">
        {b.caption && <span>{b.caption} · </span>}
        <span>الصورة: {b.credit} · </span>
        <a href={b.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{b.license}</a>
      </figcaption>
    </figure>
  );
}
