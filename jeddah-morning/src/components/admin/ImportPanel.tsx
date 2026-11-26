"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { importIssueJsonAction, importMarkdownAction, type SaveResult } from "@/app/admin/actions";
import { riyadhDateKey } from "@/lib/dates";

export function ImportPanel() {
  const [json, setJson] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [jsonResult, setJsonResult] = useState<SaveResult | null>(null);
  const [pdfResult, setPdfResult] = useState<SaveResult | null>(null);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);

  async function onJsonFile(file: File | undefined) {
    if (file) setJson(await file.text());
  }

  function importJson() {
    const looksMarkdown = !json.trim().startsWith("{");
    start(async () => setJsonResult(looksMarkdown ? await importMarkdownAction(json, overwrite) : await importIssueJsonAction(json, overwrite)));
  }

  async function uploadPdf(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploading(true);
    try {
      const res = await fetch("/api/admin/upload-pdf", { method: "POST", body: new FormData(e.currentTarget) });
      setPdfResult(await res.json());
    } catch {
      setPdfResult({ ok: false, errors: ["تعذّر الرفع"] });
    } finally {
      setUploading(false);
    }
  }

  const input = "w-full rounded border border-rule bg-paper px-3 py-2 text-sm";
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <section className="border border-rule p-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">محتوى منظم (JSON أو Markdown)</h2>
        <p className="mt-1 text-xs leading-6 text-muted">
          الصيغة موثقة في <code dir="ltr">content/templates/issue.template.json</code>. يُتحقق من الملف كاملًا قبل الحفظ.
        </p>
        <input type="file" accept="application/json,.json,.md,text/markdown" onChange={(e) => onJsonFile(e.target.files?.[0])} className="mt-3 block text-sm" data-testid="json-file" />
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={12} dir="ltr" className={`${input} mt-3 font-mono text-xs`} placeholder='{ "slug": "2026-11-27-morning", ... }' data-testid="json-text" />
        <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} /> استبدال العدد إن وُجد</label>
        <button type="button" onClick={importJson} disabled={pending || !json.trim()} className="mt-3 rounded-full bg-forest px-5 py-2 text-sm text-on-forest disabled:opacity-50" data-testid="import-json">
          {pending ? "جارٍ التحقق…" : "تحقق واستورد"}
        </button>
        <Result r={jsonResult} />
      </section>

      <section className="border border-rule p-4">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">ملف PDF</h2>
        <p className="mt-1 text-xs leading-6 text-muted">يُرفق بالعدد ذي المعرّف المحدد، أو يُنشأ عدد مسودة بنسخة PDF فقط. الحد الأقصى 25 م.ب (محليًا).</p>
        <form onSubmit={uploadPdf} className="mt-3 space-y-3">
          <label className="block"><span className="mb-1 block text-xs text-muted">معرّف العدد</span><input name="slug" required dir="ltr" defaultValue={`${riyadhDateKey()}-morning`} className={input} pattern="\d{4}-\d{2}-\d{2}-(morning|evening).*" /></label>
          <label className="block"><span className="mb-1 block text-xs text-muted">العنوان (للعدد الجديد فقط)</span><input name="title" className={input} /></label>
          <label className="block"><span className="mb-1 block text-xs text-muted">رقم العدد (للعدد الجديد فقط)</span><input name="number" type="number" min={1} className={input} /></label>
          <input name="file" type="file" accept="application/pdf,.pdf" required className="block text-sm" />
          <button type="submit" disabled={uploading} className="rounded-full bg-forest px-5 py-2 text-sm text-on-forest disabled:opacity-50">{uploading ? "جارٍ الرفع…" : "ارفع"}</button>
        </form>
        <Result r={pdfResult} />
      </section>
    </div>
  );
}

function Result({ r }: { r: SaveResult | null }) {
  if (!r) return null;
  if (r.ok)
    return (
      <p role="status" className="mt-3 text-sm text-forest-soft dark:text-gold">
        تم ✓ <Link href={`/admin/issues/${r.slug}`} className="underline">افتح العدد في المحرر</Link>
      </p>
    );
  return (
    <ul role="alert" className="mt-3 list-disc space-y-1 ps-5 text-sm text-demo">
      {(r.errors ?? []).map((e, i) => <li key={i}>{e}</li>)}
    </ul>
  );
}
