"use client";
import { useEffect, useState } from "react";
import { blockText } from "@/lib/search";
import type { Article, Issue } from "@/lib/schema";
import { CollectionPicker } from "../library/CollectionPicker";

/** Listen (device speech synthesis, free), share (link still requires login), add to a collection. */
export function ArticleTools({ issue, article }: { issue: Issue; article: Article }) {
  const [speaking, setSpeaking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, [canSpeak]);

  function listen() {
    if (!canSpeak) return setMsg("القراءة الصوتية غير متاحة في هذا المتصفح");
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const text = [article.title, article.dek ?? "", ...article.body.filter((b) => b.type !== "puzzle").map(blockText)].join("۔ ");
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("ar"));
    if (voice) u.voice = voice;
    else setMsg("لا يوجد صوت عربي على الجهاز؛ قد تكون القراءة بصوت آخر");
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
    setSpeaking(true);
  }

  async function share() {
    const url = `${location.origin}/issue/${issue.slug}/a/${article.id}`;
    const data = { title: article.title, text: "من صباح جدة (يتطلب الدخول)", url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        setMsg("نُسخ الرابط — يتطلب فتحه تسجيل الدخول");
      }
    } catch {
      /* user cancelled */
    }
  }

  const btn = "rounded-full border border-rule px-2.5 py-1 text-[0.7rem] hover:border-accent";
  return (
    <span className="relative flex items-center gap-1">
      <button type="button" onClick={listen} className={btn} aria-pressed={speaking} data-testid="listen">{speaking ? "■ إيقاف" : "▶ استمع"}</button>
      <button type="button" onClick={share} className={btn}>مشاركة</button>
      <CollectionPicker item={{ issueSlug: issue.slug, articleId: article.id, title: article.title, section: article.section }} className={btn} />
      {msg && <span role="status" className="absolute -bottom-6 end-0 whitespace-nowrap text-[0.65rem] text-muted">{msg}</span>}
    </span>
  );
}
