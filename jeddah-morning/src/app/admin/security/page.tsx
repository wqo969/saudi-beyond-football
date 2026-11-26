import { SecurityForm } from "./SecurityForm";

export const metadata = { title: "الأمان" };

export default function SecurityPage() {
  return (
    <div className="max-w-xl">
      <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">الأمان وكلمات المرور</h1>
      <p className="mt-2 text-sm leading-7 text-muted">
        كلمات المرور تُحفظ مشفّرة (PBKDF2-SHA256) في التخزين الخاص. تغييرها يُنهي كل الجلسات على الأجهزة الأخرى. ٨ محاولات خاطئة خلال ١٥ دقيقة تقفل الدخول مؤقتًا.
      </p>
      <SecurityForm />
    </div>
  );
}
