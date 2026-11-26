"use client";
import { useState } from "react";

export function PuzzleBlock({ question, hint, answer, explanation }: { question: string; hint?: string; answer: string; explanation?: string }) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  return (
    <div className="my-6 break-inside-avoid border border-gold/60 bg-paper-2 p-5 [column-span:all]">
      <p className="kicker">لغز</p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-xl leading-9">{question}</p>
      <div className="mt-4 flex flex-wrap gap-2 font-[family-name:var(--font-ui)] text-sm">
        {hint && (
          <button type="button" onClick={() => setShowHint((v) => !v)} className="rounded-full border border-rule px-4 py-1.5">
            {showHint ? "إخفاء التلميح" : "تلميح"}
          </button>
        )}
        <button type="button" onClick={() => setShowAnswer((v) => !v)} className="rounded-full bg-forest px-4 py-1.5 text-on-forest">
          {showAnswer ? "إخفاء الحل" : "اكشف الحل"}
        </button>
      </div>
      {showHint && hint && <p className="mt-3 text-ink-soft">💡 {hint}</p>}
      <p className="print-only mt-3 border-t border-rule pt-2 text-sm" style={{ transform: "rotate(180deg)" }}>الحل: {answer}{explanation ? ` — ${explanation}` : ""}</p>
      {showAnswer && <p className="mt-3 border-t border-rule pt-3 font-semibold text-gold" aria-live="polite">الحل: {answer}{explanation && <span className="mt-2 block font-normal text-ink">{explanation}</span>}</p>}
    </div>
  );
}
