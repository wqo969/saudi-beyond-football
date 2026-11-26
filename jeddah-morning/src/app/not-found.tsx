import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="latin-caps text-gold">404</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold">الصفحة غير موجودة</h1>
        <p className="mt-3 text-muted">ربما لم يُنشر هذا العدد بعد، أو أن الرابط غير صحيح.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-forest px-6 py-2 text-on-forest">الرئيسية</Link>
      </div>
    </main>
  );
}
