import type { Article } from "@/lib/schema";
import { PuzzleBlock } from "./PuzzleBlock";

export function ArticleBody({ article, dropcap = true }: { article: Article; dropcap?: boolean }) {
  return (
    <div className={`prose-mag ${dropcap ? "dropcap" : ""}`}>
      {article.body.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}>{b.text}</p>;
          case "h":
            return <h2 key={i}>{b.text}</h2>;
          case "quote":
            return (
              <blockquote key={i} className="my-8 border-y border-gold/60 py-5 text-center font-[family-name:var(--font-display)] text-2xl leading-[1.8] text-forest-soft dark:text-gold">
                «{b.text}»{b.cite && <footer className="mt-2 font-[family-name:var(--font-ui)] text-sm text-muted">— {b.cite}</footer>}
              </blockquote>
            );
          case "list":
            return (
              <ul key={i} className="my-4 list-disc space-y-1 pe-0 ps-6 marker:text-gold">
                {b.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            );
          case "facts":
            return (
              <aside key={i} className="my-6 border-s-4 border-gold bg-paper-2 p-4 font-[family-name:var(--font-ui)]">
                {b.title && <p className="mb-2 text-sm font-semibold text-forest-soft dark:text-gold">{b.title}</p>}
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
          case "puzzle":
            return <PuzzleBlock key={i} question={b.question} hint={b.hint} answer={b.answer} />;
          case "link":
            return (
              <p key={i}>
                <a href={b.url} target="_blank" rel="noopener noreferrer" className="text-forest-soft underline decoration-gold underline-offset-4 dark:text-gold">
                  {b.label} ↗
                </a>
              </p>
            );
        }
      })}
      {article.sources.length > 0 && (
        <footer className="mt-10 border-t border-rule pt-4 font-[family-name:var(--font-ui)] text-sm text-muted">
          <p className="font-semibold">المصادر</p>
          <ul className="mt-1 space-y-1">
            {article.sources.map((s, i) => (
              <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">{s.name}</a> : s.name}</li>
            ))}
          </ul>
        </footer>
      )}
    </div>
  );
}
