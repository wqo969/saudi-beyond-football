"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveIssueAction } from "@/app/admin/actions";
import { blocksToText, isoToRiyadhLocal, riyadhLocalToIso, sourcesToText, textToBlocks, textToSources } from "@/lib/editor-format";
import { ARTICLE_LAYOUTS, COVER_LAYOUTS } from "@/lib/engine/layouts";
import { PALETTES } from "@/lib/engine/palettes";
import { PERSONAS, SPECIAL_EDITIONS } from "@/lib/personas";
import { targetPublishAt } from "@/lib/publishing";
import { ISSUE_STATUSES, STATUS_LABELS, type Article, type Issue, type IssueStatus } from "@/lib/schema";
import { SECTIONS, SECTION_KEYS, type SectionKey } from "@/lib/sections";

interface ArticleDraft {
  key: string;
  orig?: Article;
  layout: string;
  kind: Article["kind"];
  id: string;
  section: SectionKey;
  kicker: string;
  title: string;
  dek: string;
  author: string;
  readingMinutes: string;
  isDemo: boolean;
  sources: string;
  body: string;
  open: boolean;
}

interface IssueDraft {
  date: string;
  edition: "morning" | "evening" | "special";
  special: string;
  persona: string;
  coverStory: string;
  coverLayout: string;
  palette: string;
  lockOrder: boolean;
  letterTitle: string;
  letterBody: string;
  closingLine: string;
  number: string;
  title: string;
  coverHeadline: string;
  coverDek: string;
  coverSection: SectionKey | "";
  status: IssueStatus;
  publishAt: string;
  isDemo: boolean;
  pdfFile: string;
  articles: ArticleDraft[];
}

let counter = 0;
const newKey = () => `k${Date.now().toString(36)}${counter++}`;

function toDraft(issue: Issue | null, defaults: { date: string; number: number }): IssueDraft {
  if (!issue)
    return {
      date: defaults.date, edition: "morning", special: "", persona: "", coverStory: "", coverLayout: "", palette: "", lockOrder: false, letterTitle: "", letterBody: "", closingLine: "",
      number: String(defaults.number), title: "", coverHeadline: "", coverDek: "", coverSection: "",
      status: "draft", publishAt: "", isDemo: false, pdfFile: "", articles: [],
    };
  return {
    date: issue.date, edition: issue.edition, special: issue.special ?? "", persona: issue.persona ?? "", coverStory: issue.coverStory ?? "",
    coverLayout: issue.design.coverLayout ?? "", palette: issue.design.palette ?? "", lockOrder: issue.design.lockOrder,
    letterTitle: issue.editorsLetter?.title ?? "", letterBody: issue.editorsLetter?.body.join("\n\n") ?? "", closingLine: issue.closingLine ?? "",
    number: String(issue.number), title: issue.title, coverHeadline: issue.coverHeadline,
    coverDek: issue.coverDek ?? "", coverSection: issue.coverSection ?? "", status: issue.status, publishAt: isoToRiyadhLocal(issue.publishAt),
    isDemo: issue.isDemo, pdfFile: issue.pdf?.file ?? "",
    articles: issue.articles.map((a) => ({
      key: newKey(), orig: a, layout: a.layout ?? "", kind: a.kind, id: a.id, section: a.section, kicker: a.kicker ?? "", title: a.title, dek: a.dek ?? "", author: a.author ?? "",
      readingMinutes: a.readingMinutes ? String(a.readingMinutes) : "", isDemo: a.isDemo, sources: sourcesToText(a.sources), body: blocksToText(a.body), open: false,
    })),
  };
}

function fromDraft(d: IssueDraft, base: Issue | null) {
  const slug = base?.slug ?? `${d.date}-${d.edition}${d.edition === "special" && d.special ? `-${d.special}` : ""}`;
  return {
    ...(base ?? {}),
    slug, date: d.date, edition: d.edition, special: d.edition === "special" ? d.special || undefined : undefined, persona: d.persona || undefined,
    number: Number(d.number), title: d.title, coverHeadline: d.coverHeadline, coverDek: d.coverDek || undefined, coverSection: d.coverSection || undefined,
    coverStory: d.coverStory || undefined, status: d.status, publishAt: riyadhLocalToIso(d.publishAt), isDemo: d.isDemo, pdf: d.pdfFile ? { file: d.pdfFile } : undefined,
    closingLine: d.closingLine || undefined,
    editorsLetter: d.letterTitle && d.letterBody.trim() ? { title: d.letterTitle, body: d.letterBody.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean), signature: base?.editorsLetter?.signature ?? "رئيس التحرير" } : undefined,
    design: { ...(base?.design ?? {}), coverLayout: d.coverLayout || undefined, palette: d.palette || undefined, lockOrder: d.lockOrder },
    articles: d.articles.map((a, i) => ({
      ...(a.orig ?? {}),
      id: a.id || `${a.section}-${i + 1}`, section: a.section, kicker: a.kicker || undefined, title: a.title, dek: a.dek || undefined,
      author: a.author || undefined, readingMinutes: a.readingMinutes ? Number(a.readingMinutes) : undefined, isDemo: a.isDemo, kind: a.kind,
      layout: a.layout || undefined, sources: textToSources(a.sources), body: textToBlocks(a.body),
    })),
  };
}

const input = "w-full rounded border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-gold";
const label = "mb-1 block text-xs font-semibold text-muted";

export function IssueEditor({ issue, defaults }: { issue: Issue | null; defaults: { date: string; number: number } }) {
  const router = useRouter();
  const isNew = !issue;
  const [d, setD] = useState<IssueDraft>(() => toDraft(issue, defaults));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const set = <K extends keyof IssueDraft>(k: K, v: IssueDraft[K]) => { setSaved(false); setD((s) => ({ ...s, [k]: v })); };
  const setA = (key: string, patch: Partial<ArticleDraft>) => { setSaved(false); setD((s) => ({ ...s, articles: s.articles.map((a) => (a.key === key ? { ...a, ...patch } : a)) })); };
  const move = (idx: number, delta: number) =>
    setD((s) => {
      const arr = [...s.articles];
      const j = idx + delta;
      if (j < 0 || j >= arr.length) return s;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...s, articles: arr };
    });
  const addArticle = () =>
    setD((s) => ({
      ...s,
      articles: [...s.articles, { key: newKey(), layout: "", kind: "feature", id: "", section: "news", kicker: "", title: "", dek: "", author: "", readingMinutes: "", isDemo: s.isDemo, sources: "", body: "", open: true }],
    }));

  function save() {
    start(async () => {
      const r = await saveIssueAction(JSON.stringify(fromDraft(d, issue)), isNew);
      if (!r.ok) {
        setErrors(r.errors ?? ["خطأ غير معروف"]);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrors([]);
      setSaved(true);
      if (isNew && r.slug) router.replace(`/admin/issues/${r.slug}`);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">{isNew ? "عدد جديد" : `تحرير: ${issue.title}`}</h1>
        <div className="flex gap-2">
          {!isNew && <Link href={`/issue/${issue.slug}`} className="rounded-full border border-rule px-4 py-2 text-sm">معاينة</Link>}
          <button type="button" onClick={save} disabled={pending} className="rounded-full bg-forest px-6 py-2 text-sm text-on-forest disabled:opacity-60" data-testid="save-issue">
            {pending ? "جارٍ الحفظ…" : "حفظ"}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="border border-demo/50 bg-demo/10 p-4 text-sm text-demo">
          <p className="font-semibold">لم يُحفظ العدد:</p>
          <ul className="mt-1 list-disc ps-5">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
      {saved && <p role="status" className="border border-forest-soft/50 bg-forest-soft/10 p-3 text-sm">تم الحفظ ✓</p>}

      <section className="grid gap-4 border border-rule p-4 sm:grid-cols-2">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold sm:col-span-2">بيانات العدد</h2>
        <label><span className={label}>التاريخ</span><input type="date" className={input} value={d.date} disabled={!isNew} onChange={(e) => set("date", e.target.value)} /></label>
        <label><span className={label}>نوع العدد</span>
          <select className={input} value={d.edition} disabled={!isNew} onChange={(e) => set("edition", e.target.value as IssueDraft["edition"])}>
            <option value="morning">صباحي — JEDDAH MORNING</option><option value="evening">مسائي — JEDDAH AFTER DARK</option><option value="special">عدد خاص</option>
          </select>
        </label>
        {d.edition === "special" && (
          <label><span className={label}>نوع العدد الخاص</span>
            <select className={input} value={d.special} disabled={!isNew} onChange={(e) => set("special", e.target.value)}>
              <option value="">—</option>
              {SPECIAL_EDITIONS.map((x) => <option key={x.key} value={x.key}>{x.name} — {x.latin}</option>)}
            </select>
          </label>
        )}
        {d.edition === "morning" && (
          <label><span className={label}>الشخصية التحريرية</span>
            <select className={input} value={d.persona} onChange={(e) => set("persona", e.target.value)}>
              <option value="">تلقائي حسب اليوم</option>
              {PERSONAS.map((x) => <option key={x.id} value={x.id}>{x.latin} — {x.name}</option>)}
            </select>
          </label>
        )}
        <label><span className={label}>رقم العدد</span><input type="number" min={1} className={input} value={d.number} onChange={(e) => set("number", e.target.value)} /></label>
        <label><span className={label}>عنوان العدد (داخلي)</span><input className={input} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="مثال: عدد الخميس الصباحي" /></label>
        <label className="sm:col-span-2"><span className={label}>عنوان الغلاف</span><input className={`${input} font-[family-name:var(--font-display)] text-lg`} value={d.coverHeadline} onChange={(e) => set("coverHeadline", e.target.value)} /></label>
        <label className="sm:col-span-2"><span className={label}>سطر الغلاف التعريفي</span><textarea rows={2} className={input} value={d.coverDek} onChange={(e) => set("coverDek", e.target.value)} /></label>
        <label><span className={label}>قسم الغلاف</span>
          <select className={input} value={d.coverSection} onChange={(e) => set("coverSection", e.target.value as SectionKey | "")}>
            <option value="">— أول مقال —</option>
            {SECTION_KEYS.map((k) => <option key={k} value={k}>{SECTIONS[k].name}</option>)}
          </select>
        </label>
        <label><span className={label}>ملف PDF (اسم الملف المرفوع)</span><input className={input} dir="ltr" value={d.pdfFile} onChange={(e) => set("pdfFile", e.target.value)} placeholder="2026-11-26-morning.pdf" /></label>
        <label><span className={label}>الحالة</span>
          <select className={input} value={d.status} onChange={(e) => set("status", e.target.value as IssueStatus)} data-testid="status-select">
            {ISSUE_STATUSES.map((x) => <option key={x} value={x}>{STATUS_LABELS[x]}</option>)}
          </select>
        </label>
        <label><span className={label}>موعد النشر (توقيت الرياض)</span>
          <span className="flex gap-1">
            <input type="datetime-local" className={input} value={d.publishAt} onChange={(e) => set("publishAt", e.target.value)} />
            <button type="button" className="shrink-0 rounded border border-rule px-2 text-xs" onClick={() => set("publishAt", isoToRiyadhLocal(targetPublishAt(d.date, d.edition)))}>الموعد المعتاد</button>
          </span>
        </label>
        <label><span className={label}>قصة الغلاف</span>
          <select className={input} value={d.coverStory} onChange={(e) => set("coverStory", e.target.value)}>
            <option value="">—</option>
            {d.articles.map((a, i) => <option key={a.key} value={a.id || `${a.section}-${i + 1}`}>{a.title || "بلا عنوان"}</option>)}
          </select>
        </label>
        <label><span className={label}>قالب الغلاف</span>
          <select className={input} value={d.coverLayout} onChange={(e) => set("coverLayout", e.target.value)}>
            <option value="">يختاره المحرك</option>
            {COVER_LAYOUTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </label>
        <label><span className={label}>لوحة الألوان</span>
          <select className={input} value={d.palette} onChange={(e) => set("palette", e.target.value)}>
            <option value="">يختارها المحرك</option>
            {PALETTES.map((x) => <option key={x.id} value={x.id}>{x.name} ({x.mode === "night" ? "ليلية" : "نهارية"})</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.lockOrder} onChange={(e) => set("lockOrder", e.target.checked)} /> تثبيت ترتيب المقالات كما هو</label>
        <label className="sm:col-span-2"><span className={label}>عنوان الافتتاحية</span><input className={input} value={d.letterTitle} onChange={(e) => set("letterTitle", e.target.value)} /></label>
        <label className="sm:col-span-2"><span className={label}>نص الافتتاحية (سطر فارغ بين الفقرات)</span><textarea rows={4} className={input} value={d.letterBody} onChange={(e) => set("letterBody", e.target.value)} /></label>
        <label className="sm:col-span-2"><span className={label}>سطر الخاتمة</span><input className={input} value={d.closingLine} onChange={(e) => set("closingLine", e.target.value)} /></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={d.isDemo} onChange={(e) => set("isDemo", e.target.checked)} />
          محتوى تجريبي (يظهر للقارئ بشارة «تجريبي»)
        </label>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">المقالات ({d.articles.length})</h2>
          <button type="button" onClick={addArticle} className="rounded-full border border-forest px-4 py-1.5 text-sm" data-testid="add-article">+ مقال</button>
        </div>
        <details className="mt-2 text-xs text-muted">
          <summary className="cursor-pointer">صيغة كتابة النص</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded bg-paper-2 p-3 leading-6">{`سطر فارغ = فقرة جديدة
## عنوان فرعي
> اقتباس
— القائل
- بند قائمة
|| عنوان جدول الحقائق
| التسمية | القيمة
لغز: السؤال
تلميح: ...
الحل: ...
[نص الرابط](https://example.com)
%% عنوان الأرقام
% القيمة | التسمية | ملاحظة
@@ عنوان الخط الزمني
@ ٠٨:٠٠ | الحدث
س: سؤال المقابلة
ج: الإجابة الموثقة
صورة: تعليق اللوحة
التفسير: شرح حل اللغز`}</pre>
        </details>
        <ol className="mt-4 space-y-3">
          {d.articles.map((a, idx) => (
            <li key={a.key} className="border border-rule">
              <div className="flex items-center gap-2 bg-paper-2 px-3 py-2">
                <button type="button" onClick={() => setA(a.key, { open: !a.open })} className="min-w-0 flex-1 text-start">
                  <span className="kicker">{SECTIONS[a.section].name}</span>
                  <span className="block truncate font-[family-name:var(--font-display)] font-bold">{a.title || "مقال بلا عنوان"}</span>
                </button>
                <button type="button" onClick={() => move(idx, -1)} aria-label="أعلى" className="px-2 text-muted">▲</button>
                <button type="button" onClick={() => move(idx, 1)} aria-label="أسفل" className="px-2 text-muted">▼</button>
                <button type="button" onClick={() => confirm("حذف المقال؟") && setD((s) => ({ ...s, articles: s.articles.filter((x) => x.key !== a.key) }))} className="px-2 text-xs text-demo">حذف</button>
              </div>
              {a.open && (
                <div className="grid gap-3 p-3 sm:grid-cols-2">
                  <label><span className={label}>القسم</span>
                    <select className={input} value={a.section} onChange={(e) => setA(a.key, { section: e.target.value as SectionKey })}>
                      {SECTION_KEYS.map((k) => <option key={k} value={k}>{SECTIONS[k].name}</option>)}
                    </select>
                  </label>
                  <label><span className={label}>المعرّف (لاتيني، اختياري)</span><input className={input} dir="ltr" value={a.id} onChange={(e) => setA(a.key, { id: e.target.value.toLowerCase() })} placeholder={`${a.section}-${idx + 1}`} /></label>
                  <label><span className={label}>الكيكر (فوق العنوان)</span><input className={input} value={a.kicker} onChange={(e) => setA(a.key, { kicker: e.target.value })} /></label>
                  <label><span className={label}>الكاتب</span><input className={input} value={a.author} onChange={(e) => setA(a.key, { author: e.target.value })} /></label>
                  <label><span className={label}>قالب الصفحة</span>
                    <select className={input} value={a.layout} onChange={(e) => setA(a.key, { layout: e.target.value })}>
                      <option value="">يختاره المحرك</option>
                      {ARTICLE_LAYOUTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                  </label>
                  <label><span className={label}>نوع المادة</span>
                    <select className={input} value={a.kind} onChange={(e) => setA(a.key, { kind: e.target.value as Article["kind"] })}>
                      {([["news", "خبر"], ["analysis", "تحليل"], ["opinion", "رأي"], ["feature", "مقال"], ["service", "خدمة"], ["template", "قالب"]] as const).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label className="sm:col-span-2"><span className={label}>العنوان</span><input className={`${input} font-[family-name:var(--font-display)] text-lg`} value={a.title} onChange={(e) => setA(a.key, { title: e.target.value })} /></label>
                  <label className="sm:col-span-2"><span className={label}>المقدمة</span><textarea rows={2} className={input} value={a.dek} onChange={(e) => setA(a.key, { dek: e.target.value })} /></label>
                  <label className="sm:col-span-2"><span className={label}>النص</span><textarea rows={12} className={`${input} font-[family-name:var(--font-body)] leading-8`} value={a.body} onChange={(e) => setA(a.key, { body: e.target.value })} /></label>
                  <label><span className={label}>المصادر (سطر لكل مصدر: الاسم | الرابط)</span><textarea rows={3} className={input} value={a.sources} onChange={(e) => setA(a.key, { sources: e.target.value })} /></label>
                  <div className="space-y-3">
                    <label className="block"><span className={label}>دقائق القراءة</span><input type="number" min={1} className={input} value={a.readingMinutes} onChange={(e) => setA(a.key, { readingMinutes: e.target.value })} /></label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={a.isDemo} onChange={(e) => setA(a.key, { isDemo: e.target.checked })} /> مقال تجريبي</label>
                    {SECTIONS[a.section].live && !a.sources.trim() && !a.isDemo && (
                      <p className="text-xs text-demo">هذا قسم يعتمد على بيانات حية: أضف مصدرًا موثوقًا أو علّمه تجريبيًا.</p>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
