"use client";
import { useState } from "react";

export function MediaUpload() {
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const r = await fetch("/api/admin/upload-media", { method: "POST", body: new FormData(e.currentTarget) }).then((x) => x.json()).catch(() => ({ ok: false, errors: ["تعذّر الرفع"] }));
        setMsg(r.ok ? `تم: ${r.src} — استخدمه في المحرر: ![وصف](${r.src}) | صاحب الحقوق | الترخيص | رابط المصدر` : (r.errors ?? []).join("، "));
        setBusy(false);
      }}
    >
      <label className="text-sm"><span className="block text-xs text-muted">اسم الملف (لاتيني)</span><input name="name" required className="rounded border border-rule bg-paper px-2 py-1" dir="ltr" placeholder="jeddah-corniche-01" /></label>
      <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="text-sm" />
      <button type="submit" disabled={busy} className="rounded-full bg-forest px-4 py-1.5 text-sm text-on-forest">{busy ? "…" : "ارفع"}</button>
      {msg && <p role="status" className="w-full break-all text-xs">{msg}</p>}
    </form>
  );
}
