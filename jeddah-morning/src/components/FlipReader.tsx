"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { editionName, formatArabicDate, toArabicDigits } from "@/lib/dates";
import type { IssuePlan } from "@/lib/engine/planner";
import { articleById } from "@/lib/engine/planner";
import { DEFAULT_PREFS, readPrefs, recordRead, writePrefs, type ReaderPrefs } from "@/lib/library";
import type { Issue } from "@/lib/schema";
import { SECTIONS } from "@/lib/sections";
import { safeLocalGet, useClientValue } from "@/lib/use-client-value";
import { IconChevron, IconClose, IconList } from "./icons";
import { MagazinePage } from "./magazine/MagazinePage";

type Anim = { from: number; to: number; dir: 1 | -1; phase: "start" | "run" };
const DURATION = 650;
const SCALES = [0.85, 1, 1.15, 1.3, 1.5];

function pageLabel(issue: Issue, plan: IssuePlan, i: number): string {
  const p = plan.pages[i];
  if (p.kind === "cover") return "الغلاف";
  if (p.kind === "contents") return "الفهرس";
  if (p.kind === "letter") return "الافتتاحية";
  if (p.kind === "surprise") return "مفاجأة العدد";
  if (p.kind === "closing") return "الخاتمة";
  const a = articleById(issue, p.articleId);
  return (a?.title ?? "") + (p.part === 1 ? " (تابع)" : "");
}

export function FlipReader({ issue, plan, initialPage, preview = false }: { issue: Issue; plan: IssuePlan; initialPage: number | null; preview?: boolean }) {
  const total = plan.pages.length;
  const clamp = useCallback((n: number) => Math.max(0, Math.min(total - 1, n)), [total]);
  const posKey = `jm:pos:${issue.slug}`;

  const prefsJson = useClientValue(() => safeLocalGet("jm:prefs") ?? "", "");
  const storedPrefs: ReaderPrefs = useMemo(() => (prefsJson ? { ...DEFAULT_PREFS, ...JSON.parse(prefsJson) } : DEFAULT_PREFS), [prefsJson]);
  const [prefOverride, setPrefOverride] = useState<ReaderPrefs | null>(null);
  const prefs = prefOverride ?? storedPrefs;
  const setPrefs = (p: Partial<ReaderPrefs>) => {
    const next = { ...readPrefs(), ...prefs, ...p };
    setPrefOverride(next);
    writePrefs(next);
  };

  const [index, setIndex] = useState(() => clamp(initialPage ?? 0));
  const [anim, setAnim] = useState<Anim | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [focus, setFocus] = useState(false);
  const [gotoValue, setGotoValue] = useState("");
  const reduced = useRef(false);
  const pointer = useRef<{ x: number; y: number; t: number; ignore: boolean } | null>(null);
  const scrollRoot = useRef<HTMLDivElement>(null);

  const savedPos = useClientValue(() => Number(safeLocalGet(posKey) ?? 0), 0);
  const [resumeDismissed, setResumeDismissed] = useState(false);
  const showResume = initialPage == null && !resumeDismissed && index === 0 && savedPos > 1 && savedPos < total;

  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // persist position, reflect in URL, record reading history
  useEffect(() => {
    try {
      if (index > 0 || initialPage != null) localStorage.setItem(posKey, String(index));
    } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set("p", String(index));
    window.history.replaceState(window.history.state, "", url);
    const pg = plan.pages[index];
    const a = articleById(issue, pg?.articleId);
    if (a && !preview) recordRead({ issueSlug: issue.slug, articleId: a.id, title: a.title, section: a.section });
  }, [index, posKey, initialPage, plan.pages, issue, preview]);

  const scrollToPage = (i: number) => setTimeout(() => document.getElementById(`page-${i}`)?.scrollIntoView({ behavior: reduced.current ? "auto" : "smooth" }), 0);

  const go = useCallback(
    (target: number) => {
      const to = clamp(target);
      if (to === index || anim) return;
      if (prefs.mode === "scroll") {
        scrollToPage(to);
        setIndex(to);
        return;
      }
      if (reduced.current || prefs.effect === "none" || Math.abs(to - index) > 1) {
        setIndex(to);
        return;
      }
      setAnim({ from: index, to, dir: to > index ? 1 : -1, phase: "start" });
    },
    [anim, clamp, index, prefs.mode, prefs.effect],
  );

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

  useEffect(() => {
    if (anim?.phase !== "run") return;
    const t = setTimeout(finish, DURATION + 120);
    return () => clearTimeout(t);
  }, [anim?.phase, finish]);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    const onGoto = (e: Event) => go((e as CustomEvent<number>).detail);
    window.addEventListener("jm:goto", onGoto);
    return () => window.removeEventListener("jm:goto", onGoto);
  }, [go]);

  // RTL keyboard: left arrow advances, right arrow goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" || e.key === "PageDown") next();
      else if (e.key === "ArrowRight" || e.key === "PageUp") prev();
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(total - 1);
      else if (e.key === "Escape") {
        setDrawer(false);
        setFocus(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, total]);

  // Scroll mode: track the page in view.
  useEffect(() => {
    if (prefs.mode !== "scroll" || !scrollRoot.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setIndex(Number((vis.target as HTMLElement).dataset.index));
      },
      { root: scrollRoot.current, threshold: [0.25, 0.5, 0.75] },
    );
    scrollRoot.current.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [prefs.mode]);

  const onPointerDown = (e: React.PointerEvent) => {
    const ignore = !!(e.target as HTMLElement).closest("[data-no-swipe],button,a,input,textarea,select,label");
    pointer.current = { x: e.clientX, y: e.clientY, t: Date.now(), ignore };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const p = pointer.current;
    pointer.current = null;
    if (!p || p.ignore || prefs.mode === "scroll") return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    const fast = Date.now() - p.t < 600;
    // Arabic: dragging the page from left to right turns forward.
    if (Math.abs(dx) > (fast ? 40 : 90) && Math.abs(dx) > Math.abs(dy) * 1.4) (dx > 0 ? next : prev)();
  };

  let baseIndex = index;
  let top: { index: number; transform: string } | null = null;
  if (anim) {
    const ran = anim.phase === "run";
    const off = prefs.effect === "flip" ? "rotateY(180deg)" : "translateX(105%)";
    if (anim.dir === 1) {
      baseIndex = anim.to;
      top = { index: anim.from, transform: ran ? off : "none" };
    } else {
      baseIndex = anim.from;
      top = { index: anim.to, transform: ran ? "none" : off };
    }
  }

  const progress = total > 1 ? (index / (total - 1)) * 100 : 100;
  const scaleIdx = Math.max(0, SCALES.indexOf(prefs.scale));
  const chrome = !focus;
  const jump = (i: number) => {
    setDrawer(false);
    setIndex(i);
    if (prefs.mode === "scroll") scrollToPage(i);
  };

  return (
    <div className={`jm-p-${plan.palette.id} fixed inset-0 flex flex-col`} data-reader style={{ ["--reader-scale" as string]: String(prefs.scale) }}>
      {chrome && (
        <header className="pt-safe z-30 bg-deep text-on-deep">
          <div className="mx-auto flex h-12 max-w-3xl items-center gap-1 px-2">
            <Link href={`/issue/${issue.slug}`} aria-label="إغلاق القارئ" className="grid size-10 place-items-center rounded-full hover:bg-white/10"><IconClose className="size-5" /></Link>
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate font-[family-name:var(--font-display)] text-lg font-bold leading-6">{plan.identity.name}</p>
              <p className="truncate text-[0.62rem] opacity-70">{editionName(issue.edition)} · {formatArabicDate(issue.date)}</p>
            </div>
            <button type="button" onClick={() => setPrefs({ scale: SCALES[Math.max(0, scaleIdx - 1)] })} className="grid size-9 place-items-center rounded-full text-sm hover:bg-white/10">أ−<span className="sr-only"> تصغير النص</span></button>
            <button type="button" onClick={() => setPrefs({ scale: SCALES[Math.min(SCALES.length - 1, scaleIdx + 1)] })} className="grid size-9 place-items-center rounded-full text-base hover:bg-white/10">أ+<span className="sr-only"> تكبير النص</span></button>
            <button type="button" onClick={() => setDrawer(true)} aria-label="فهرس الصفحات والإعدادات" className="grid size-10 place-items-center rounded-full hover:bg-white/10"><IconList className="size-5" /></button>
          </div>
          {(issue.isDemo || preview) && (
            <div className={`${preview ? "bg-[#7a3b12]" : "bg-demo/90"} py-0.5 text-center text-[0.62rem] font-semibold text-white`}>
              {preview ? "معاينة المحرر — هذا العدد غير منشور للقراء" : "محتوى تجريبي — ليس أخبارًا أو بيانات حقيقية"}
            </div>
          )}
        </header>
      )}

      {prefs.mode === "scroll" ? (
        <div ref={scrollRoot} className="flex-1 overflow-y-auto bg-paper-2" data-testid="reader-stage" data-page={index} data-mode="scroll">
          <div className="mx-auto max-w-3xl">
            {plan.pages.map((pg, i) => (
              <section key={i} id={`page-${i}`} data-index={i} className="mb-2 bg-paper shadow">
                <MagazinePage issue={issue} plan={plan} page={pg} pageNo={i} />
              </section>
            ))}
          </div>
        </div>
      ) : (
        <div className="relative flex-1 overflow-hidden bg-paper-2 md:px-6 md:py-4">
          <div
            className="flip-stage relative mx-auto h-full max-w-3xl"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => (pointer.current = null)}
            style={{ touchAction: "pan-y pinch-zoom" }}
            data-testid="reader-stage"
            data-page={index}
            data-mode="pages"
          >
            <PageFrame key={`base-${baseIndex}`} issue={issue} plan={plan} i={baseIndex} />
            {top && (
              <div
                key={`top-${top.index}-${anim?.dir}`}
                className="flip-page absolute inset-0 z-10"
                style={{ transform: top.transform, transition: anim?.phase === "run" ? `transform ${DURATION}ms cubic-bezier(.45,.05,.25,1)` : "none" }}
                onTransitionEnd={(e) => e.propertyName === "transform" && finish()}
              >
                <PageFrame issue={issue} plan={plan} i={top.index} />
                {prefs.effect === "flip" && <div className="flip-shade pointer-events-none absolute inset-0" />}
              </div>
            )}
            <button type="button" onClick={prev} disabled={index === 0} aria-label="الصفحة السابقة" className="absolute -right-14 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow disabled:opacity-30 md:grid"><IconChevron dir="right" className="size-5" /></button>
            <button type="button" onClick={next} disabled={index === total - 1} aria-label="الصفحة التالية" className="absolute -left-14 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow disabled:opacity-30 md:grid"><IconChevron dir="left" className="size-5" /></button>
          </div>
        </div>
      )}

      {showResume && (
        <div className="absolute inset-x-0 bottom-20 z-40 flex justify-center px-4" role="status">
          <div className="flex items-center gap-3 rounded-full bg-deep px-4 py-2 text-sm text-on-deep shadow-xl">
            <span>تابع من الصفحة {toArabicDigits(savedPos + 1)}؟</span>
            <button type="button" onClick={() => { setResumeDismissed(true); jump(savedPos); }} className="rounded-full bg-accent px-3 py-1 font-semibold text-on-accent">تابع</button>
            <button type="button" onClick={() => setResumeDismissed(true)} aria-label="إخفاء"><IconClose className="size-4" /></button>
          </div>
        </div>
      )}

      {focus && (
        <button type="button" onClick={() => setFocus(false)} className="absolute end-3 top-3 z-40 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white" style={{ marginTop: "env(safe-area-inset-top)" }}>إنهاء التركيز</button>
      )}

      {chrome && (
        <footer className="pb-safe z-30 border-t border-rule bg-paper text-ink">
          <div className="h-0.5 bg-rule" aria-hidden><div className="h-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
          <div className="mx-auto flex max-w-3xl items-center justify-between px-3 pt-1.5 text-sm">
            <button type="button" onClick={prev} disabled={index === 0} className="flex items-center gap-1 rounded-full px-3 py-1.5 disabled:opacity-30" aria-label="الصفحة السابقة"><IconChevron dir="right" className="size-4" /> السابقة</button>
            <button type="button" onClick={() => setFocus(true)} className="text-xs text-muted" title="وضع التركيز">
              <span data-testid="page-indicator">{toArabicDigits(index + 1)} / {toArabicDigits(total)}</span> · تركيز
            </button>
            <button type="button" onClick={next} disabled={index === total - 1} className="flex items-center gap-1 rounded-full px-3 py-1.5 disabled:opacity-30" aria-label="الصفحة التالية">التالية <IconChevron dir="left" className="size-4" /></button>
          </div>
        </footer>
      )}

      {drawer && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="فهرس الصفحات">
          <button type="button" className="flex-1 bg-black/50" aria-label="إغلاق" onClick={() => setDrawer(false)} />
          <nav className="pt-safe h-full w-[86%] max-w-sm overflow-y-auto bg-paper p-5 text-ink shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">الصفحات</h2>
              <button type="button" onClick={() => setDrawer(false)} aria-label="إغلاق" className="grid size-9 place-items-center rounded-full hover:bg-paper-2"><IconClose className="size-4" /></button>
            </div>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(gotoValue); if (n >= 1 && n <= total) jump(n - 1); }}>
              <label className="sr-only" htmlFor="goto">انتقل إلى صفحة</label>
              <input id="goto" type="number" min={1} max={total} value={gotoValue} onChange={(e) => setGotoValue(e.target.value)} placeholder={`رقم الصفحة (1–${total})`} className="min-w-0 flex-1 rounded border border-rule bg-transparent px-3 py-1.5 text-sm" />
              <button type="submit" className="rounded bg-accent px-3 text-sm text-on-accent">انتقل</button>
            </form>
            <fieldset className="mt-4 space-y-2 border-y border-rule py-3 text-sm">
              <legend className="sr-only">إعدادات القراءة</legend>
              <div className="flex items-center justify-between gap-2"><span>طريقة القراءة</span><Seg value={prefs.mode} onChange={(v) => setPrefs({ mode: v as ReaderPrefs["mode"] })} options={[["pages", "صفحات"], ["scroll", "عمودي"]]} /></div>
              <div className="flex items-center justify-between gap-2"><span>تأثير التقليب</span><Seg value={prefs.effect} onChange={(v) => setPrefs({ effect: v as ReaderPrefs["effect"] })} options={[["flip", "ورق"], ["slide", "انزلاق"], ["none", "بدون"]]} /></div>
            </fieldset>
            <ol className="mt-2 divide-y divide-rule">
              {plan.pages.map((p, i) => (
                <li key={i}>
                  <button type="button" onClick={() => jump(i)} className={`flex w-full items-baseline gap-3 py-2.5 text-start ${i === index ? "text-accent" : ""}`} aria-current={i === index ? "page" : undefined}>
                    <span className="w-6 shrink-0 text-sm text-muted">{toArabicDigits(i + 1)}</span>
                    <span className="min-w-0">
                      {p.articleId && <span className="kicker block !text-accent">{SECTIONS[articleById(issue, p.articleId)!.section].name}</span>}
                      <span className="font-[family-name:var(--font-display)] text-base font-bold leading-7">{pageLabel(issue, plan, i)}</span>
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

function Seg({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="inline-flex rounded-full border border-rule p-0.5" role="radiogroup">
      {options.map(([v, label]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)} className={`rounded-full px-3 py-1 text-xs ${value === v ? "bg-accent text-on-accent" : ""}`}>{label}</button>
      ))}
    </div>
  );
}

function PageFrame({ issue, plan, i }: { issue: Issue; plan: IssuePlan; i: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-paper shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] md:rounded-sm">
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-black/10 to-transparent" />
      <div className="h-full overflow-y-auto overscroll-contain">
        <MagazinePage issue={issue} plan={plan} page={plan.pages[i]} pageNo={i} />
      </div>
    </div>
  );
}
