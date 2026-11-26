import type { Metadata } from "next";

export const metadata: Metadata = { title: "تثبيت التطبيق" };

export default function InstallPage() {
  return (
    <div className="px-4 pt-6 md:max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">ثبّت صباح جدة</h1>
      <section className="mt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">آيفون وآيباد (Safari)</h2>
        <ol className="mt-3 list-decimal space-y-2 ps-6 leading-8">
          <li>افتح رابط المجلة في <b>Safari</b> وسجّل الدخول.</li>
          <li>اضغط زر <b>المشاركة</b> (مربع وسهم للأعلى).</li>
          <li>اختر <b>إضافة إلى الشاشة الرئيسية</b> ثم <b>إضافة</b>.</li>
          <li>افتح «صباح جدة» من الأيقونة؛ يعمل بملء الشاشة وبلا شريط المتصفح.</li>
          <li>للإشعارات: من داخل التطبيق المثبت افتح <b>المزيد ← الإشعارات ← فعّل الإشعارات</b> (iOS 16.4 أو أحدث).</li>
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">أندرويد (Chrome)</h2>
        <ol className="mt-3 list-decimal space-y-2 ps-6 leading-8">
          <li>افتح الرابط في Chrome وسجّل الدخول.</li>
          <li>من قائمة النقاط الثلاث اختر <b>تثبيت التطبيق</b> أو <b>إضافة إلى الشاشة الرئيسية</b>.</li>
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">القراءة دون إنترنت</h2>
        <p className="mt-2 leading-8">افتح فهرس أي عدد واضغط «احفظ للقراءة دون إنترنت». يُحفظ العدد كاملًا بصوره ونسخته المختصرة وPDF.</p>
      </section>
    </div>
  );
}
