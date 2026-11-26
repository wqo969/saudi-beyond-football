import { ImportPanel } from "@/components/admin/ImportPanel";

export const metadata = { title: "الاستيراد" };

export default function ImportPage() {
  return (
    <>
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">الاستيراد</h1>
      <p className="mt-1 text-sm text-muted">استورد عددًا كاملًا من ملف JSON منظم، أو أرفق ملف PDF بعدد. المحتوى المستورد يُحفظ مسودة ما لم يحدد الملف غير ذلك.</p>
      <ImportPanel />
    </>
  );
}
