/* eslint-disable @next/next/no-html-link-for-pages -- full navigations on purpose: this page is served by the service worker while offline */
import type { Metadata } from "next";

export const metadata: Metadata = { title: "دون اتصال" };

/** Public, static fallback shown by the service worker when a page isn't cached. Contains no private content. */
export default function OfflinePage() {
  return (
    <main className="pt-safe grid min-h-dvh place-items-center bg-forest px-6 text-center text-on-forest">
      <div className="max-w-sm">
        <p className="latin-caps text-gold">Offline</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl font-bold">أنت دون اتصال</h1>
        <p className="mt-4 font-[family-name:var(--font-body)] leading-8 text-on-forest/80">
          هذه الصفحة لم تُحفظ بعد للقراءة دون إنترنت. الأعداد التي حفظتها مسبقًا ما زالت متاحة.
        </p>
        <div className="mt-8 flex justify-center gap-2 text-sm">
          <a href="/" className="rounded-full bg-gold px-5 py-2 font-semibold text-forest-deep">الرئيسية</a>
          <a href="/favorites" className="rounded-full border border-gold/60 px-5 py-2 text-gold">المفضلة</a>
        </div>
      </div>
    </main>
  );
}
