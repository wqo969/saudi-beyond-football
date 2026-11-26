import { MediaUpload } from "@/components/admin/MediaUpload";
import { listAllIssues } from "@/lib/content";

export const metadata = { title: "الوسائط وحقوقها" };

export default async function MediaPage() {
  const issues = await listAllIssues();
  const items = issues.flatMap((i) => i.articles.flatMap((a) => a.body.flatMap((b) => (b.type === "image" ? [{ ...b, issue: i.slug, article: a.title }] : []))));
  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">الوسائط وحقوق الاستخدام</h1>
        <p className="text-sm text-muted">لا تُقبل صورة في أي عدد دون صاحب حقوق وترخيص ورابط مصدر (يفرضه المخطط). المسموح: ترخيص حر (CC0/CC BY/CC BY-SA/ملكية عامة) أو صور من إنتاجك.</p>
        <MediaUpload />
      </section>
      <section>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">الصور المستخدمة ({items.length})</h2>
        <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((m, i) => (
            <li key={i} className="text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- private media route */}
              <img src={m.src} alt={m.alt} className="aspect-[4/3] w-full bg-paper-2 object-cover" loading="lazy" />
              <p className="mt-1 font-semibold">{m.credit}</p>
              <p><a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">{m.license}</a></p>
              <p className="text-muted">{m.issue} · {m.article}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
