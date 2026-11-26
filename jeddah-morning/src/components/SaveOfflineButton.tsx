"use client";
import { useState } from "react";
import { safeLocalGet, useClientValue } from "@/lib/use-client-value";
import { IconDownload } from "./icons";

type State = "idle" | "saving" | "saved" | "error";

const savedKey = (slug: string) => `jm:offline:${slug}`;

export function SaveOfflineButton({ slug, urls }: { slug: string; urls: string[] }) {
  const supported = useClientValue(() => "serviceWorker" in navigator && "caches" in window, false);
  const savedBefore = useClientValue(() => !!safeLocalGet(savedKey(slug)), false);
  const [action, setAction] = useState<State>("idle");
  const state: State = action === "idle" && savedBefore ? "saved" : action;
  const [progress, setProgress] = useState(0);

  async function save() {
    setAction("saving");
    setProgress(0);
    try {
      // Cache directly from the page (works even before the SW controls this tab). The SW reads the same cache.
      const cache = await caches.open("jm-issues-v1");
      let done = 0;
      for (const url of urls) {
        const res = await fetch(url, { credentials: "same-origin", cache: "no-store" });
        if (res.ok && !res.redirected) await cache.put(url, res);
        done++;
        setProgress(Math.round((done / urls.length) * 100));
      }
      try {
        localStorage.setItem(savedKey(slug), new Date().toISOString());
      } catch {}
      setAction("saved");
    } catch {
      setAction("error");
    }
  }

  if (!supported) return null;
  return (
    <button type="button" onClick={save} disabled={state === "saving"} className="inline-flex items-center gap-1.5 rounded-full border border-rule px-4 py-2 text-sm disabled:opacity-60" data-testid="save-offline">
      <IconDownload className="size-4" />
      {state === "saving" ? `جارٍ الحفظ ${progress}٪` : state === "saved" ? "محفوظ للقراءة دون إنترنت ✓" : state === "error" ? "تعذّر الحفظ — أعد المحاولة" : "احفظ للقراءة دون إنترنت"}
    </button>
  );
}
