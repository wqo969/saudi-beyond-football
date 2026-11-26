"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { toArabicDigits } from "@/lib/dates";
import { IconChevron, IconClose, IconDownload } from "./icons";

const ZOOMS = [0.75, 1, 1.25, 1.5, 2, 2.5];

export function PdfReader({ src, slug, title, isDemo }: { src: string; slug: string; title: string; isDemo: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoomIdx, setZoomIdx] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [width, setWidth] = useState(0);

  // Load pdf.js lazily (client only) and open the document.
  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const task = pdfjs.getDocument({
          url: src,
          withCredentials: true,
          cMapUrl: "/pdfjs/cmaps/",
          standardFontDataUrl: "/pdfjs/standard_fonts/",
          wasmUrl: "/pdfjs/wasm/",
        });
        loadingTask = task;
        const loaded = await task.promise;
        if (cancelled) return;
        setDoc(loaded);
        try {
          const saved = Number(localStorage.getItem(`jm:pdfpos:${slug}`));
          if (saved >= 1 && saved <= loaded.numPages) setPage(saved);
        } catch {}
        setStatus("ready");
      } catch (e) {
        console.error("[pdf]", e);
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      loadingTask?.destroy();
    };
  }, [src, slug]);

  // Track available width for fit-to-width rendering.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Render current page.
  useEffect(() => {
    if (!doc || !canvasRef.current || width === 0) return;
    let cancelled = false;
    (async () => {
      const p = await doc.getPage(page);
      if (cancelled) return;
      const base = p.getViewport({ scale: 1 });
      const fit = (Math.min(width, 900) - 16) / base.width;
      const scale = fit * ZOOMS[zoomIdx];
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const viewport = p.getViewport({ scale: scale * dpr });
      const canvas = canvasRef.current!;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
      canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;
      taskRef.current?.cancel();
      const task = p.render({ canvas, viewport });
      taskRef.current = task;
      await task.promise.catch(() => {});
    })();
    try {
      localStorage.setItem(`jm:pdfpos:${slug}`, String(page));
    } catch {}
    return () => {
      cancelled = true;
    };
  }, [doc, page, zoomIdx, width, slug]);

  const total = doc?.numPages ?? 0;
  const next = useCallback(() => setPage((p) => Math.min(total || 1, p + 1)), [total]);
  const prev = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
      else if (e.key === "+" || e.key === "=") setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1));
      else if (e.key === "-") setZoomIdx((z) => Math.max(0, z - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[#2a2a28]">
      <header className="pt-safe z-10 bg-forest text-on-forest">
        <div className="mx-auto flex h-12 max-w-4xl items-center gap-2 px-2">
          <Link href={`/issue/${slug}`} aria-label="إغلاق" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            <IconClose className="size-5" />
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-sm">{title} · PDF</p>
          <a href={src} download={`${slug}.pdf`} aria-label="تنزيل" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            <IconDownload className="size-5" />
          </a>
        </div>
        {isDemo && <div className="bg-demo/90 py-0.5 text-center text-[0.65rem] font-semibold text-white">ملف PDF تجريبي</div>}
      </header>

      <div
        ref={wrapRef}
        className="flex-1 overflow-auto"
        style={{ touchAction: zoomIdx > 1 ? "auto" : "pan-y" }}
        onPointerDown={(e) => (pointer.current = { x: e.clientX, y: e.clientY })}
        onPointerUp={(e) => {
          const p = pointer.current;
          pointer.current = null;
          if (!p || zoomIdx > 1) return;
          const dx = e.clientX - p.x;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - p.y) * 1.4) (dx > 0 ? next : prev)();
        }}
      >
        {status === "loading" && <p className="py-20 text-center text-sm text-white/70">جارٍ تحميل الملف…</p>}
        {status === "error" && <p className="py-20 text-center text-sm text-white/70">تعذّر فتح الملف. تحقق من الاتصال أو احفظ العدد للقراءة دون إنترنت.</p>}
        <div className="flex min-h-full items-start justify-center p-2">
          <canvas ref={canvasRef} dir="ltr" className={`bg-white shadow-2xl ${status === "ready" ? "" : "hidden"}`} data-testid="pdf-canvas" aria-label={`صفحة ${page} من ${total}`} />
        </div>
      </div>

      <footer className="pb-safe bg-paper text-ink">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3 pt-2 text-sm">
          <button type="button" onClick={prev} disabled={page <= 1} className="flex items-center gap-1 px-2 py-1.5 disabled:opacity-30" aria-label="الصفحة السابقة">
            <IconChevron dir="right" className="size-4" /> السابقة
          </button>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setZoomIdx((z) => Math.max(0, z - 1))} disabled={zoomIdx === 0} aria-label="تصغير" className="grid size-8 place-items-center rounded-full border border-rule disabled:opacity-30">−</button>
            <span className="w-24 text-center text-xs text-muted" data-testid="pdf-indicator">{total ? `${toArabicDigits(page)} / ${toArabicDigits(total)}` : "—"}</span>
            <button type="button" onClick={() => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1))} disabled={zoomIdx === ZOOMS.length - 1} aria-label="تكبير" className="grid size-8 place-items-center rounded-full border border-rule disabled:opacity-30">+</button>
          </div>
          <button type="button" onClick={next} disabled={!total || page >= total} className="flex items-center gap-1 px-2 py-1.5 disabled:opacity-30" aria-label="الصفحة التالية">
            التالية <IconChevron dir="left" className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
