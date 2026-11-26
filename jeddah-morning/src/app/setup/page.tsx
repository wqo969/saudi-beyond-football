import type { Metadata } from "next";
import Link from "next/link";
import { setupAvailable } from "./actions";
import { SetupForm } from "./SetupForm";

export const metadata: Metadata = { title: "الإعداد الأولي" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const available = await setupAvailable();
  return (
    <main className="pt-safe grid min-h-dvh place-items-center bg-forest px-6 py-10 text-on-forest">
      <div className="w-full max-w-sm">
        <p className="latin-caps text-center text-gold">Jeddah Morning</p>
        <h1 className="mt-2 text-center font-[family-name:var(--font-display)] text-4xl font-bold">الإعداد الأولي</h1>
        {available ? (
          <>
            <p className="mt-4 text-sm leading-7 text-on-forest/80">اختر كلمتي مرور خاصتين بك (١٢ حرفًا على الأقل). تُحفظان مشفّرتين ولا يراهما أحد. هذه الصفحة تعمل مرة واحدة فقط.</p>
            <SetupForm />
          </>
        ) : (
          <p className="mt-6 text-center text-sm leading-7 text-on-forest/80">
            الإعداد مكتمل أو غير متاح. <Link href="/login" className="text-gold underline">الدخول</Link>
          </p>
        )}
      </div>
    </main>
  );
}
