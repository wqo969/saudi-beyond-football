"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { editionName, formatArabicDate, toArabicDigits } from "@/lib/dates";
import type { Article, Issue } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";
import { ArticleBody } from "./ArticleBody";
import { DemoBadge } from "./DemoBadge";
import { FavoriteButton } from "./FavoriteButton";
import { IconChevron, IconClose, IconList } from "./icons";
import { IssueCover } from "./IssueCover";
import { SectionArt } from "./SectionArt";
import { safeLocalGet, useClientValue } from "@/lib/use-client-value";

type Page =
  | { kind: "cover"; label: string }
  | { kind: "toc"; label: string }
  | { kind: "article"; label: string; article: Article }
  | { kind: "back"; label: string };

type Anim = { from: number; to: number; dir: 1 | -1; phase: "start" | "run" };

const DURATION = 650;

export function buildPages(issue: Issue): Page[] {
  return [
    { kind: "cover", label: "الغلاف" },
    { kind: "toc", label: "الفهرس" },
    ...issue.articles.map((a) => ({ kind: "article" as const, label: a.title, article: a })),
    { kind: "back", label: "نهاية العدد" },
  ];
}

export function FlipReader({ issue, initialPage }: { issue: Issue; initialPage: number | null }) {
  const pages = useMemo(() => buildPages(issue), [issue]);
  const clamp = useCallback((n: number) => Math.max(0, Math.min(pages.length - 1, n)), [pages.length]);
  const posKey = `jm:pos:${issue.slug}`;

  const [index, setIndex] = useState(() => clamp(initialPage ?? 0));
  const [anim, setAnim] = useState<Anim | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const reduced = useRef(false);
  const pointer = useRef<{ x: number; y: number; t: number } | null>(null);

  // Offer to resume from the last saved position (when no explicit page was requested).
  const savedPos = useClientValue(() => Number(safeLocalGet(posKey) ?? 0), 0);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const showResume = initialPage == null && !resumeDismissed && index === 0 && savedPos > 1 && savedPos < pages.length;

  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Persist position & reflect it in the URL without re-rendering the route.
  useEffect(() => {
    try {
      if (index > 0 || initialPage != null) localStorage.setItem(posKey, String(index));
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("p", String(index));
    window.history.replaceState(window.history.state, "", url);
  }, [index, posKey, initialPage]);

  const go = useCallback(
    (target: number) => {
      const to = clamp(target);
      if (to === index || anim) return;
      if (reduced.current) {
        setIndex(to);
        return;
      }
      setAnim({ from: index, to, dir: to > index ? 1 : -1, phase: "start" });
    },
    [anim, clamp, index],
  );

  // Kick the transition on the next frame so the start transform is painted first.
  useEffect(() => {
    if (anim?.phase !== "start") return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setAnim((a) => (a ? { ...a, phase: "run" } : a))));
    return () => cancelAnimationFrame(r);
  }, [anim?.phase]);

  const finish = useCallback(() => {
    if (!anim) return;
    setIndex(anim.to);
    setAnim(null);
  }, [anim]);

  // Safety net in case transitionend doesn't fire.
  useEffect(() => {
    if (anim?.phase !== "run") return;
    const t = setTimeout(finish, DURATION + 120);
    return () => clearTimeout(t);
  }, [anim?.phase, finish]);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // RTL keyboard: left arrow advances, right arrow goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" || e.key === "PageDown") next();
      else if (e.key === "ArrowRight" || e.key === "PageUp") prev();
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(pages.length - 1);
      else if (e.key === "Escape") setTocOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, pages.length]);

  // Swipe: in Arabic, dragging the page from left to right turns forward.
  const onPointerDown = (e: React.PointerEvent) => {
    pointer.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = pointer.current;
    pointer.current = null;
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    const fast = Date.now() - p.t < 600;
    if (Math.abs(dx) > (fast ? 40 : 90) && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx > 0) next();
      else prev();
    }
  };

  // Layers: base (static) + top (rotating around the right spine).
  let baseIndex = index;
  let top: { index: number; transform: string } | null = null;
  if (anim) {
    const ran = anim.phase === "run";
    if (anim.dir === 1) {
      baseIndex = anim.to;
      top = { index: anim.from, transform: ran ? "rotateY(180deg)" : "rotateY(0deg)" };
    } else {
      baseIndex = anim.from;
      top = { index: anim.to, transform: ran ? "rotateY(0deg)" : "rotateY(180deg)" };
    }
  }

  const progress = pages.length > 1 ? (index / (pages.length - 1)) * 100 : 100;

  return (
    <div className="fixed inset-0 flex flex-col bg-paper-3 dark:bg-black">
      {/* Top bar */}
      <header className="pt-safe z-30 bg-forest text-on-forest">
        <div className="mx-auto flex h-12 max-w-3xl items-center gap-2 px-2">
          <Link href={`/issue/${issue.slug}`} aria-label="إغلاق القارئ" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            <IconClose className="size-5" />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-[family-name:var(--font-display)] text-lg font-bold leading-6">صباح جدة</p>
            <p className="truncate text-[0.65rem] text-on-forest/70">{editionName(issue.edition)} · {formatArabicDate(issue.date)}</p>
          </div>
          <button type="button" onClick={() => setTocOpen(true)} aria-label="فهرس الصفحات" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            <IconList className="size-5" />
          </button>
        </div>
        {issue.isDemo && <div className="bg-demo/90 py-0.5 text-center text-[0.65rem] font-semibold text-white">محتوى تجريبي — ليس أخبارًا أو بيانات حقيقية</div>}
      </header>

      {/* Stage */}
      <div className="relative flex-1 overflow-hidden px-0 py-0 md:px-6 md:py-5">
        <div
          className="flip-stage relative mx-auto h-full max-w-3xl"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointer.current = null)}
          style={{ touchAction: "pan-y" }}
          data-testid="reader-stage"
          data-page={index}
        >
          <PageFrame key={`base-${baseIndex}`} page={pages[baseIndex]} issue={issue} onJump={go} pageNo={baseIndex} total={pages.length} />
          {top && (
            <div
              key={`top-${top.index}-${anim?.dir}`}
              className="flip-page absolute inset-0 z-10"
              style={{ transform: top.transform, transition: anim?.phase === "run" ? `transform ${DURATION}ms cubic-bezier(.45,.05,.25,1)` : "none" }}
              onTransitionEnd={(e) => e.propertyName === "transform" && finish()}
            >
              <PageFrame page={pages[top.index]} issue={issue} onJump={go} pageNo={top.index} total={pages.length} />
              <div className="flip-shade pointer-events-none absolute inset-0" />
            </div>
          )}

          {/* Desktop edge controls */}
          <button type="button" onClick={prev} disabled={index === 0} aria-label="الصفحة السابقة" className="absolute -right-14 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow disabled:opacity-30 md:grid">
            <IconChevron dir="right" className="size-5" />
          </button>
          <button type="button" onClick={next} disabled={index === pages.length - 1} aria-label="الصفحة التالية" className="absolute -left-14 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow disabled:opacity-30 md:grid">
            <IconChevron dir="left" className="size-5" />
          </button>
        </div>
      </div>

      {showResume && (
        <div className="absolute inset-x-0 bottom-20 z-40 flex justify-center px-4" role="status">
          <div className="flex items-center gap-3 rounded-full bg-forest px-4 py-2 text-sm text-on-forest shadow-xl">
            <span>تابع من الصفحة {toArabicDigits(savedPos + 1)}؟</span>
            <button type="button" onClick={() => { setResumeDismissed(true); go(savedPos); }} className="rounded-full bg-gold px-3 py-1 font-semibold text-forest-deep">تابع</button>
            <button type="button" onClick={() => setResumeDismissed(true)} aria-label="إخفاء" className="text-on-forest/70"><IconClose className="size-4" /></button>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <footer className="pb-safe z-30 border-t border-rule bg-paper">
        <div className="h-0.5 bg-rule" aria-hidden>
          <div className="mr-0 h-full bg-gold transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="mx-auto flex max-w-3xl items-center justify-between px-3 pt-1.5 text-sm">
          <button type="button" onClick={prev} disabled={index === 0} className="flex items-center gap-1 rounded-full px-3 py-1.5 disabled:opacity-30" aria-label="الصفحة السابقة">
            <IconChevron dir="right" className="size-4" /> السابقة
          </button>
          <span className="text-xs text-muted" aria-live="polite" data-testid="page-indicator">
            {toArabicDigits(index + 1)} / {toArabicDigits(pages.length)}
          </span>
          <button type="button" onClick={next} disabled={index === pages.length - 1} className="flex items-center gap-1 rounded-full px-3 py-1.5 disabled:opacity-30" aria-label="الصفحة التالية">
            التالية <IconChevron dir="left" className="size-4" />
          </button>
        </div>
      </footer>

      {/* Page index drawer */}
      {tocOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="فهرس الصفحات">
          <button type="button" className="flex-1 bg-black/50" aria-label="إغلاق" onClick={() => setTocOpen(false)} />
          <nav className="pt-safe h-full w-[82%] max-w-sm overflow-y-auto bg-paper p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">الصفحات</h2>
              <button type="button" onClick={() => setTocOpen(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full hover:bg-paper-2">
                <IconClose className="size-4" />
              </button>
            </div>
            <ol className="mt-4 divide-y divide-rule">
              {pages.map((p, i) => (
                <li key={i}>
                  <button type="button" onClick={() => { setTocOpen(false); setIndex(i); }} className={`flex w-full items-baseline gap-3 py-3 text-start ${i === index ? "text-gold" : ""}`} aria-current={i === index ? "page" : undefined}>
                    <span className="w-6 shrink-0 text-sm text-muted">{toArabicDigits(i + 1)}</span>
                    <span className="min-w-0">
                      {p.kind === "article" && <span className="kicker block">{SECTIONS[p.article.section].name}</span>}
                      <span className="font-[family-name:var(--font-display)] text-base font-bold leading-7">{p.label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      )}
    </div>
  );
}

function PageFrame({ page, issue, onJump, pageNo, total }: { page: Page; issue: Issue; onJump: (n: number) => void; pageNo: number; total: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-paper shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] md:rounded-sm">
      {/* spine shadow on the right edge */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-black/10 to-transparent" />
      <div className="h-full overflow-y-auto overscroll-contain">
        {page.kind === "cover" && <IssueCover issue={issue} actions={false} fill />}
        {page.kind === "toc" && <TocPage issue={issue} onJump={onJump} />}
        {page.kind === "article" && <ArticlePage issue={issue} article={page.article} />}
        {page.kind === "back" && <BackPage issue={issue} />}
        {page.kind !== "cover" && (
          <p className="pb-6 text-center font-[family-name:var(--font-latin)] text-xs text-muted">— {toArabicDigits(pageNo + 1)} من {toArabicDigits(total)} —</p>
        )}
      </div>
    </div>
  );
}

function TocPage({ issue, onJump }: { issue: Issue; onJump: (n: number) => void }) {
  return (
    <div className="px-6 pb-4 pt-8">
      <p className="latin-caps text-gold">Contents</p>
      <h2 className="mt-1 font-[family-name:var(--font-display)] text-4xl font-bold">في هذا العدد</h2>
      <div className="rule-double my-4" />
      <ol className="divide-y divide-rule">
        {issue.articles.map((a, i) => (
          <li key={a.id}>
            <button type="button" onClick={() => onJump(i + 2)} className="grid w-full grid-cols-[2.25rem_1fr] items-baseline gap-3 py-3 text-start">
              <span className="font-[family-name:var(--font-latin)] text-xl text-gold">{toArabicDigits(String(i + 3).padStart(2, "0"))}</span>
              <span>
                <span className="kicker block">{SECTIONS[a.section].name}</span>
                <span className="font-[family-name:var(--font-display)] text-lg font-bold leading-8">{a.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ArticlePage({ issue, article }: { issue: Issue; article: Article }) {
  const meta = SECTIONS[article.section];
  return (
    <article>
      <div className="relative h-56 overflow-hidden md:h-72">
        <SectionArt section={article.section} seed={article.id} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper to-transparent" />
        <span className="absolute right-5 top-5 bg-gold px-2 py-0.5 text-xs font-semibold text-forest-deep">{meta.name}</span>
      </div>
      <div className="-mt-10 px-6 pb-6">
        {article.kicker && <p className="kicker relative">{article.kicker}</p>}
        <h2 className="relative mt-1 font-[family-name:var(--font-display)] text-3xl font-bold leading-[1.5]">{article.title}</h2>
        {article.dek && <p className="mt-2 font-[family-name:var(--font-body)] leading-8 text-ink-soft">{article.dek}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-y border-rule py-2 text-xs text-muted">
          {article.author && <span>{article.author}</span>}
          {(article.isDemo || issue.isDemo) && <DemoBadge />}
          <span className="ms-auto" onPointerDown={(e) => e.stopPropagation()}>
            <FavoriteButton issueSlug={issue.slug} articleId={article.id} title={article.title} section={article.section} />
          </span>
        </div>
        <div className="mt-5">
          <ArticleBody article={article} />
        </div>
      </div>
    </article>
  );
}

function BackPage({ issue }: { issue: Issue }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-forest px-8 py-16 text-center text-on-forest">
      <p className="latin-caps text-gold">Fin</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl font-bold">انتهى العدد</h2>
      <p className="mt-4 max-w-xs font-[family-name:var(--font-body)] leading-8 text-on-forest/80">
        {issue.edition === "morning" ? "نلقاك في العدد المسائي." : "تصبح على خير، ونلقاك صباحًا."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm">
        <Link href="/archive" className="rounded-full border border-gold/60 px-5 py-2 text-gold">الأرشيف</Link>
        <Link href="/" className="rounded-full bg-gold px-5 py-2 font-semibold text-forest-deep">الرئيسية</Link>
      </div>
    </div>
  );
}
