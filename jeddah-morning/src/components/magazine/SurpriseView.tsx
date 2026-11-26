"use client";
import { useState } from "react";
import { artSvg } from "@/lib/art";
import type { Palette } from "@/lib/engine/palettes";
import type { Surprise } from "@/lib/schema";
import { safeLocalGet, useClientValue } from "@/lib/use-client-value";

/** Renders an SVG artwork + optional caption to a PNG and downloads it (all on-device, free). */
export async function downloadArtPng(opts: { seed: string; palette: Palette; width: number; height: number; caption?: string; sub?: string; filename: string }) {
  const svg = artSvg({ seed: opts.seed, pattern: "mashrabiya", hue: opts.palette.artHue, width: opts.width, height: opts.height, bg: [opts.palette.deep, opts.palette.deep, "#000000"], accent: opts.palette.accent, sun: true });
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = opts.width;
  c.height = opts.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  await document.fonts.ready;
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.fillStyle = opts.palette.onDeep;
  if (opts.caption) {
    ctx.font = `700 ${Math.round(opts.width / 11)}px Amiri, serif`;
    wrap(ctx, opts.caption, opts.width / 2, opts.height * 0.62, opts.width * 0.8, opts.width / 8);
  }
  ctx.font = `600 ${Math.round(opts.width / 30)}px "Playfair Display", serif`;
  ctx.direction = "ltr";
  ctx.fillStyle = opts.palette.accent;
  ctx.fillText(opts.sub ?? "JEDDAH MORNING", opts.width / 2, opts.height * 0.92);
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = opts.filename;
  a.click();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
}

export function SurpriseView({ surprise, slug, palette }: { surprise: Surprise; slug: string; palette: Palette }) {
  switch (surprise.kind) {
    case "wallpaper":
    case "card":
      return <ArtGift surprise={surprise} slug={slug} palette={palette} />;
    case "quiz":
      return <Quiz surprise={surprise} />;
    case "challenge":
      return <Checklist surprise={surprise} slug={slug} />;
    case "reflection":
      return <Reflection surprise={surprise} slug={slug} />;
    case "facts":
      return (
        <ol className="space-y-3">
          {surprise.items?.map((f, i) => (
            <li key={i} className="flex gap-3 border-b border-rule pb-3"><span className="font-[family-name:var(--font-latin)] text-2xl text-accent">{i + 1}</span><span className="leading-8">{f}</span></li>
          ))}
        </ol>
      );
  }
}

function ArtGift({ surprise, slug, palette }: { surprise: Surprise; slug: string; palette: Palette }) {
  const [busy, setBusy] = useState(false);
  const wallpaper = surprise.kind === "wallpaper";
  const svg = artSvg({ seed: slug + surprise.kind, pattern: "mashrabiya", hue: palette.artHue, width: 390, height: wallpaper ? 844 : 520, bg: [palette.deep, palette.deep, "#000000"], accent: palette.accent, sun: true });
  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl ${wallpaper ? "aspect-[390/844] w-52" : "aspect-[3/4] w-64"}`}>
        <div className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
        {surprise.text && <p className="absolute inset-x-4 top-[55%] text-center font-[family-name:var(--font-display)] text-xl font-bold leading-8" style={{ color: palette.onDeep }}>{surprise.text}</p>}
      </div>
      <button
        type="button"
        disabled={busy}
        data-no-swipe
        className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          try {
            await downloadArtPng({ seed: slug + surprise.kind, palette, width: wallpaper ? 1170 : 1080, height: wallpaper ? 2532 : 1440, caption: surprise.text, filename: `jeddah-morning-${slug}-${surprise.kind}.png` });
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "جارٍ التجهيز…" : wallpaper ? "حمّل الخلفية" : "حمّل البطاقة"}
      </button>
    </div>
  );
}

function Quiz({ surprise }: { surprise: Surprise }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const qs = surprise.questions ?? [];
  const done = qs.length > 0 && Object.keys(answers).length === qs.length;
  let result: string | null = null;
  if (done) {
    const tally: Record<string, number> = {};
    Object.values(answers).forEach((r) => (tally[r] = (tally[r] ?? 0) + 1));
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
    result = surprise.results?.[top] ?? top;
  }
  return (
    <div className="space-y-5" data-no-swipe>
      {qs.map((q, i) => (
        <fieldset key={i}>
          <legend className="font-[family-name:var(--font-display)] text-lg font-bold">{q.q}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((o) => (
              <button key={o.label} type="button" aria-pressed={answers[i] === o.result} onClick={() => setAnswers((a) => ({ ...a, [i]: o.result }))} className={`rounded-full border px-3 py-1.5 text-sm ${answers[i] === o.result ? "border-accent bg-accent text-on-accent" : "border-rule"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
      {result && <p role="status" className="border-s-4 border-accent bg-paper-2 p-4 leading-8">{result}</p>}
      <p className="text-xs text-muted">اختبار ترفيهي غير تشخيصي — لا يقيس شخصيتك علميًا.</p>
    </div>
  );
}

function Checklist({ surprise, slug }: { surprise: Surprise; slug: string }) {
  const key = `jm:challenge:${slug}`;
  const stored = useClientValue(() => safeLocalGet(key) ?? "", "");
  const [local, setLocal] = useState<string | null>(null);
  const done = new Set((local ?? stored).split(",").filter(Boolean));
  const toggle = (i: number) => {
    const next = new Set(done);
    if (next.has(String(i))) next.delete(String(i));
    else next.add(String(i));
    const v = [...next].join(",");
    setLocal(v);
    try {
      localStorage.setItem(key, v);
    } catch {}
  };
  return (
    <ul className="space-y-2" data-no-swipe>
      {surprise.items?.map((it, i) => (
        <li key={i}>
          <label className="flex items-start gap-3 rounded-md border border-rule p-3">
            <input type="checkbox" checked={done.has(String(i))} onChange={() => toggle(i)} className="mt-1.5 size-4 accent-[var(--accent)]" />
            <span className={`leading-7 ${done.has(String(i)) ? "line-through opacity-60" : ""}`}>{it}</span>
          </label>
        </li>
      ))}
      <li className="text-xs text-muted">{done.size}/{surprise.items?.length ?? 0} — يُحفظ على جهازك فقط</li>
    </ul>
  );
}

function Reflection({ surprise, slug }: { surprise: Surprise; slug: string }) {
  const key = `jm:reflection:${slug}`;
  const stored = useClientValue(() => safeLocalGet(key) ?? "", "");
  const [text, setText] = useState<string | null>(null);
  return (
    <div className="space-y-4" data-no-swipe>
      <ul className="space-y-2">{surprise.items?.map((q, i) => <li key={i} className="font-[family-name:var(--font-display)] text-xl leading-9">— {q}</li>)}</ul>
      <label className="block">
        <span className="text-xs text-muted">ملاحظاتك (تبقى على جهازك)</span>
        <textarea rows={5} value={text ?? stored} onChange={(e) => { setText(e.target.value); try { localStorage.setItem(key, e.target.value); } catch {} }} className="mt-1 w-full rounded-md border border-rule bg-transparent p-3 leading-8" />
      </label>
    </div>
  );
}
