import type { Metadata } from "next";
import { getAuthConfig } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "الدخول" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reason?: string }> }) {
  const { next, reason } = await searchParams;
  const cfg = getAuthConfig();
  return (
    <main className="pt-safe grid min-h-dvh place-items-center bg-forest px-6 text-on-forest">
      <div className="w-full max-w-sm text-center">
        <p className="latin-caps text-gold">Jeddah Morning</p>
        <h1 className="mt-2 border-y border-gold/60 py-3 font-[family-name:var(--font-display)] text-6xl font-bold leading-tight">صباح جدة</h1>
        <p className="mt-4 font-[family-name:var(--font-body)] text-on-forest/80">مجلة شخصية خاصة. أدخل كلمة المرور للمتابعة.</p>
        {reason === "admin" && <p className="mt-3 text-sm text-gold">هذه الصفحة تتطلب صلاحية التحرير.</p>}
        <LoginForm next={next ?? "/"} />
        {cfg.usingDevDefaults && (
          <p className="mt-6 rounded border border-gold/40 bg-black/20 p-3 text-xs leading-6 text-gold-soft">
            وضع التطوير: لم تُضبط كلمات المرور، فاستُخدمت الافتراضية <code dir="ltr">demo-reader</code> للقراءة و<code dir="ltr">demo-admin</code> للتحرير. لا تُستخدم في الإنتاج.
          </p>
        )}
      </div>
    </main>
  );
}
